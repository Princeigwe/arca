import { ethers } from "ethers";
import { testWallets, testConnects } from "../../test.wallets.contract.connects";
import { arca_diamond_abi } from "../../abis/arca.diamond.abi";
import { arca_access_control_facet_abi } from "../../abis/arca.access.control.facet.abi";
import { arca_identity_facet_abi } from "../../abis/arca.identity.facet.abi";
import { MedicalGuardianRoleType, MedicalGuardianRoleEnum } from "./enums/medical.guardian.role.type";

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const arcaDiamondAddress = process.env.DEPLOYED_DIAMOND_ADDRESS || process.env.LOCAL_DIAMOND_ADDRESS;
const combinedABIs = [...arca_diamond_abi, ...arca_access_control_facet_abi, ...arca_identity_facet_abi];

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);


export class AccessControlEthersOnchain{

  async getMyMedicalGuardianPermissions(wallet: ethers.Wallet){
    try {
      const iFace = new ethers.Interface(arca_access_control_facet_abi)
      const data = iFace.encodeFunctionData('getMyMedicalGuardianPermissions')
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };

      const response = await wallet.call(txOption);
      const decodedMedicalGuardianPermissions = iFace.decodeFunctionResult('getMyMedicalGuardianPermissions', response)
      console.log('medical guardian permissions: ', decodedMedicalGuardianPermissions)
      const formattedMedicalGuardianPermissions = decodedMedicalGuardianPermissions[0].map((item: any) => ({
        role:                   Number(item[0]),  // enum comes back as bigint
        guardian:               item[1],
        patient:                item[2],
        canGrantProviderAccess: item[3],
        canGrantGuardianAccess: item[4],
        canRevokeProviderAccess:item[5],
        canRevokeGuardianAccess:item[6],
        canUploadRecords:       item[7],
        canReadRecords:         item[8],
        canDeleteRecords:       item[9],
      }))
      console.log('formatted medical guardian permissions: ', formattedMedicalGuardianPermissions)
    } catch (error: any) {
      const iFace = new ethers.Interface(combinedABIs)
      const errorData = error?.data ?? error?.error?.data ?? error?.info?.error?.data

      if (errorData) {
        const decodedError = iFace.parseError(errorData)
        throw new Error(`Onchain error -  ${decodedError?.name}(${decodedError?.args?.join(', ')})`)
      }
    }
  }


  async getMedicalPermission(wallet: ethers.Wallet, medicalGuardianAddress: string, patientAddress: string){
    try {
      const iFace = new ethers.Interface(combinedABIs)
      const data = iFace.encodeFunctionData('getMedicalPermission', [medicalGuardianAddress, patientAddress])
      const txOption = {
        to: arcaDiamondAddress,
        data: data
      }
      const response = await wallet.call(txOption)
      const decodedMedicalPermission = iFace.decodeFunctionResult('getMedicalPermission', response)
      const result = decodedMedicalPermission[0]
      console.log('medical guardian permission:', result)
      const formattedMedicalGuardianPermission = {
        role: Number(result[0]), // primary guardian
        guardian: result[1],
        patient: result[2],
        canGrantProviderAccess: result[3],
        canGrantGuardianAccess: result[4],
        canRevokeProviderAccess: result[5],
        canRevokeGuardianAccess: result[6],
        canUploadRecords: result[7],
        canReadRecords: result[8],
        canDeleteRecords: result[9]
      }
      console.log("formatted medical permission: ", formattedMedicalGuardianPermission)
      return formattedMedicalGuardianPermission
    } catch (error: any) {
      const iFace = new ethers.Interface(combinedABIs)
      const errorData = error?.data ?? error?.error?.data ?? error?.info?.error?.data

      if (errorData) {
        const decodedError = iFace.parseError(errorData)
        throw new Error(`Onchain error -  ${decodedError?.name}(${decodedError?.args?.join(', ')})`)
      }
      throw error
    }
  }


  // can only be executed by a primary guardian, and only for guardian assignment
  async assignMedicalGuardian(
    wallet: ethers.Wallet, 
    contractConnect: ethers.Contract,
    medicalGuardianAddress: string,
    mainPatientAddress: string,
    role: MedicalGuardianRoleEnum,
    canGrantProviderAccess: boolean = false,
    canGrantGuardianAccess: boolean = false,
    canRevokeProviderAccess: boolean = false,
    canRevokeGuardianAccess: boolean = false,
    canUploadRecords: boolean = false,
    canReadRecords: boolean = false,
    canDeleteRecords: boolean = false,
    rsaMasterDekForMedicalGuardian: string,
    cid: string
  ){
    const medicalGuardianRoleType = role === MedicalGuardianRoleEnum.PRIMARY ? MedicalGuardianRoleType.PRIMARY : MedicalGuardianRoleType.SECONDARY
    
    try {
      const cidBytes = ethers.toUtf8Bytes(cid)
      const rsaMasterDEKbytes = ethers.toUtf8Bytes(rsaMasterDekForMedicalGuardian);

      const iFace = new ethers.Interface(combinedABIs)
      const data = iFace.encodeFunctionData(
        'assignMedicalGuardian',
        [
          medicalGuardianAddress,
          mainPatientAddress,
          medicalGuardianRoleType,
          canGrantProviderAccess,
          canGrantGuardianAccess,
          canRevokeProviderAccess,
          canRevokeGuardianAccess,
          canUploadRecords,
          canReadRecords,
          canDeleteRecords,
          rsaMasterDEKbytes,
          cidBytes
        ]
      )

      const txOption = {
        to: arcaDiamondAddress,
        data: data
      }

      const response = await wallet.sendTransaction(txOption);
      await response.wait();

      contractConnect.once('MedicalGuardianAssignedToPatientEvent', (message, medicalGuardian, patient)=>{
        console.log(`Event emitted: Message:${message} - Medical Guardian: ${medicalGuardian} - Patient: ${patient}`)
      })
    } catch (error: any) {
      const iFace = new ethers.Interface(combinedABIs)
      const errorData = error?.data ?? error?.error?.data ?? error?.info?.error?.data

      if (errorData) {
        const decodedError = iFace.parseError(errorData)
        throw new Error(`Onchain error -  ${decodedError?.name}(${decodedError?.args?.join(', ')})`)
      }
      throw error
    }
  }


  async updateMedicalGuardianPermission(
    wallet: ethers.Wallet, 
    contractConnect: ethers.Contract,
    medicalGuardianAddress: string,
    mainPatientAddress: string,
    role: MedicalGuardianRoleEnum,
    canGrantProviderAccess: boolean = false,
    canGrantGuardianAccess: boolean = false,
    canRevokeProviderAccess: boolean = false,
    canRevokeGuardianAccess: boolean = false,
    canUploadRecords: boolean = false,
    canReadRecords: boolean = false,
    canDeleteRecords: boolean = false,
  ){
    try {
      const medicalGuardianRoleType = role === MedicalGuardianRoleEnum.PRIMARY ? MedicalGuardianRoleType.PRIMARY : MedicalGuardianRoleType.SECONDARY

      const iFace = new ethers.Interface(combinedABIs)
      const data = iFace.encodeFunctionData(
        'updateMedicalGuardianPermission',
        [
          medicalGuardianAddress,
          mainPatientAddress,
          medicalGuardianRoleType,
          canGrantProviderAccess,
          canGrantGuardianAccess,
          canRevokeProviderAccess,
          canRevokeGuardianAccess,
          canUploadRecords,
          canReadRecords,
          canDeleteRecords
        ]
      )

      const txOption = {
        to: arcaDiamondAddress,
        data: data
      }

      const response = await wallet.sendTransaction(txOption);
      await response.wait();

      contractConnect.once('MedicalGuardianAssignedToPatientEvent', (message, medicalGuardian, patient)=>{
        console.log(`Event emitted: Message:${message} - Medical Guardian: ${medicalGuardian} - Patient: ${patient}`)
      })

    } catch (error: any) {
      const iFace = new ethers.Interface(combinedABIs)
      const errorData = error?.data ?? error?.error?.data ?? error?.info?.error?.data

      if (errorData) {
        const decodedError = iFace.parseError(errorData)
        throw new Error(`Onchain error -  ${decodedError?.name}(${decodedError?.args?.join(', ')})`)
      }
      throw error
    }
  }


  async getIdentityCidOfAddress(wallet: ethers.Wallet, address: string) {
    try {
      const iFace = new ethers.Interface(combinedABIs);
      const data = iFace.encodeFunctionData("getAddressCid", [address]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };
      const response = await wallet.call(txOption)
      const decoded = iFace.decodeFunctionResult("getAddressCid", response)
      const addressCid = ethers.toUtf8String(decoded[0])
      return addressCid
    } catch (error: any) {
      const iFace = new ethers.Interface(combinedABIs)
      const decodedError = iFace.parseError(error.data)
      console.log("Onchain Error:", decodedError)
      throw new Error(`Error fetching address cid: ${error}`)
    }
  }
  
}

