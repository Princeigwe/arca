import { AccessControlEthersOnchain } from "./access.control.ethers.onchain";
import { ethers } from "ethers";
import {
  TestWallet,
  testWallets,
  testConnects,
} from "../../test.wallets.contract.connects";
import { MedicalGuardianRoleEnum } from "./enums/medical.guardian.role.type";
import { IpfsOperator } from "../../utils/ipfs.operator";
import { RsaEncryptDecrypt } from "../../utils/rsa.encrypt.decrypt";

const RED = new RsaEncryptDecrypt()

const ipfsOperator = new IpfsOperator()

export class ArcaAccessControlService{
  constructor(private accessControlEthersOnchain: AccessControlEthersOnchain){}

  async getMyMedicalGuardianPermissions(wallet: ethers.Wallet){
    try {
      return await this.accessControlEthersOnchain.getMyMedicalGuardianPermissions(wallet)
    } catch (error) {
      throw new Error(`Error fetching medical guardian permissions of current sender: ${error}`)
    }
  }


  async getMedicalPermission(wallet: ethers.Wallet, medicalGuardianAddress: string, patientAddress: string){
    try {
      return await this.accessControlEthersOnchain.getMedicalPermission(
        wallet,
        medicalGuardianAddress,
        patientAddress
      )
    } catch (error) {
      throw new Error(`Error getting permission of medical guardian on patient: ${error}`)
    }
  }


  async generateMedicalGuardianConnectionSignature(
    guardianWallet: ethers.Wallet,
    patientAddress: string
  ){
    try {
      const connectionMessage = `I, ${guardianWallet.address}, agree to be connected as a medical guardian to patient with address ${patientAddress}`;
      const connectionSignature = await guardianWallet.signMessage(connectionMessage); // pass raw string
      console.log("Medical guardian connection signature: ", connectionSignature);
      return connectionSignature;
    } catch (error) {
      throw new Error(`Error generating medical guardian connection signature: ${error}`)
    }
  }


  async verifyMedicalGuardianConnectionSignature(
    medicalGuardianAddress: string,
    patientAddress: string,
    expectedSignature: string
  ){
    try {
      const connectionMessage = `I, ${medicalGuardianAddress}, agree to be connected as a medical guardian to patient with address ${patientAddress}`
      const connectionMessageHash = ethers.hashMessage(connectionMessage);

      console.log("Medical Guardian Address (passed in):", medicalGuardianAddress);
      console.log("Connection Message:", connectionMessage);
      console.log("Connection Message Hash:", connectionMessageHash);
      console.log("Expected Signature:", expectedSignature);

      const recoveredMedicalGuardianPublicKey = ethers.SigningKey.recoverPublicKey(
        connectionMessageHash,
        expectedSignature,
      );
      const recoveredAddress = ethers.recoverAddress(
        connectionMessageHash,
        expectedSignature,
      ); 
      if(recoveredAddress == ethers.getAddress(medicalGuardianAddress)){
        return{
          isVerifiedSignature: true,
          recoveredMedicalGuardianPublicKey
        }
      }
      return{
        isVerifiedSignature: false,
        recoveredMedicalGuardianPublicKey: null
      }
    } catch (error) {
      throw new Error(`Error verifying medical guardian connection signature: ${error}`)
    }
  }

  async assignMedicalGuardian(
    wallet: ethers.Wallet, 
    contractConnect: ethers.Contract,
    assigneeMedicalGuardianAddress: string,
    mainPatientAddress: string,
    role: MedicalGuardianRoleEnum,
    assigneeMedicalGuardianConnectionSignature: string,
    canGrantProviderAccess?: boolean,
    canGrantGuardianAccess?: boolean,
    canRevokeProviderAccess?: boolean,
    canRevokeGuardianAccess?: boolean,
    canUploadRecords?: boolean,
    canReadRecords?: boolean,
    canDeleteRecords?: boolean,
  ){
    try {

       //* verifying signature from supposed medical provider's address
      const {isVerifiedSignature, recoveredMedicalGuardianPublicKey} = await this.verifyMedicalGuardianConnectionSignature(
        assigneeMedicalGuardianAddress,
        mainPatientAddress,
        assigneeMedicalGuardianConnectionSignature
      )
      console.log('Recovered medical guardian public key: ', recoveredMedicalGuardianPublicKey)
      if(!isVerifiedSignature){
        throw new Error('Signature of provided address of medical guardian is not valid')
      }

      console.log("Assigning medical guardian onchain...")
      //**  getting RSA-encrypted master DEK of medical guardian carrying out the assignment
      // 1. get address CID of the patient's address onchain and convert from bytes to string
      const patientIdentityCid = await this.accessControlEthersOnchain.getIdentityCidOfAddress(wallet, mainPatientAddress)
      console.log("Patient identity CID fetched onchain: ", patientIdentityCid)

      //2. get the offchain data from IPFS using the CID and extract the RSA-encrypted master DEK of the medical guardian(assigner) from the data
      let patientOffchainData = await ipfsOperator.getFileByCid(patientIdentityCid)
      console.log("Offchain patient data fetched by CID: ", patientOffchainData)
      const parsedOffchainData = JSON.parse(patientOffchainData);

      console.log("Keys for medical guardians in offchain data: ", parsedOffchainData.encryptionMetaData.rsaKeys.rsaEncryptedMasterDEKsForMedicalGuardians)

      let assignerRsaMasterDekPosition = parsedOffchainData
        .encryptionMetaData
        .rsaKeys
        .rsaEncryptedMasterDEKsForMedicalGuardians
        .findIndex((item: any) => item.medicalGuardian.toLowerCase() === wallet.address.toLowerCase())
      
      console.log("Position of assigner medical guardian's RSA-encrypted master DEK in offchain data: ", assignerRsaMasterDekPosition)

      if (assignerRsaMasterDekPosition === -1) {
        throw new Error(`Medical guardian ${wallet.address} not found in patient's encrypted DEK list`)
      }
      
      const decryptedDekForAssigner = RED.decryptDek(
        wallet.privateKey, 
        parsedOffchainData.encryptionMetaData.rsaKeys.rsaEncryptedMasterDEKsForMedicalGuardians[assignerRsaMasterDekPosition].rsaEncryptedMasterDEK
      )

      // RSA-encrypting the master DEK with the public key of the new medical guardian(assignee)
      const encryptedDekForAssignee = RED.encryptDek(recoveredMedicalGuardianPublicKey!, decryptedDekForAssigner)

      parsedOffchainData.encryptionMetaData.rsaKeys.rsaEncryptedMasterDEKsForMedicalGuardians.push({
        medicalGuardian: assigneeMedicalGuardianAddress,
        rsaEncryptedMasterDEK: encryptedDekForAssignee
      });

      const jsonData = JSON.stringify(parsedOffchainData);

      const fileName: string = `${mainPatientAddress}-patient-identity.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );
      console.log("Filebase upload response: ", uploadRequest);

      return await this.accessControlEthersOnchain.assignMedicalGuardian(
        wallet,
        contractConnect,
        assigneeMedicalGuardianAddress,
        mainPatientAddress,
        role,
        canGrantProviderAccess,
        canGrantGuardianAccess,
        canRevokeProviderAccess,
        canRevokeGuardianAccess,
        canUploadRecords,
        canReadRecords,
        canDeleteRecords,
        encryptedDekForAssignee,
        cid
      )
    } catch (error) {
      throw new Error(`Error assigning medical guardian to patient: ${error}`)
    }
  }


  async updateMedicalGuardianPermission(
    wallet: ethers.Wallet, 
    contractConnect: ethers.Contract,
    assigneeMedicalGuardianAddress: string,
    mainPatientAddress: string,
    role: MedicalGuardianRoleEnum,
    canGrantProviderAccess?: boolean,
    canGrantGuardianAccess?: boolean,
    canRevokeProviderAccess?: boolean,
    canRevokeGuardianAccess?: boolean,
    canUploadRecords?: boolean,
    canReadRecords?: boolean,
    canDeleteRecords?: boolean,
  ){
    try {
      return await this.accessControlEthersOnchain.updateMedicalGuardianPermission(
        wallet,
        contractConnect,
        assigneeMedicalGuardianAddress,
        mainPatientAddress,
        role,
        canGrantProviderAccess,
        canGrantGuardianAccess,
        canRevokeProviderAccess,
        canRevokeGuardianAccess,
        canUploadRecords,
        canReadRecords,
        canDeleteRecords
      )
    } catch (error) {
      throw new Error(`Error updating medical guardian permissions: ${error}`)
    }
  }

}


const accessControlEthersOnchain = new AccessControlEthersOnchain()
const arcaAccessControlService = new ArcaAccessControlService(accessControlEthersOnchain)



//** TESTINGS *//////////////


const anyWallet = testWallets[2];
const primaryGuardianWallet = testWallets[4];
const primaryGuardianConnect = testConnects[4]
const patient1Wallet = testWallets[1];

const secondGuardianWallet = testWallets[5];
const secondGuardianConnect = testConnects[5]

// arcaAccessControlService.getMyMedicalGuardianPermissions(primaryGuardianWallet)
// arcaAccessControlService.getMedicalPermission(anyWallet, primaryGuardianWallet.address, patient1Wallet.address)
arcaAccessControlService.getMedicalPermission(anyWallet, secondGuardianWallet.address, patient1Wallet.address)

// arcaAccessControlService.generateMedicalGuardianConnectionSignature(
//   secondGuardianWallet,
//   patient1Wallet.address
// )

// arcaAccessControlService.assignMedicalGuardian(
//   primaryGuardianWallet, 
//   primaryGuardianConnect,
//   secondGuardianWallet.address,
//   patient1Wallet.address,
//   MedicalGuardianRoleEnum.PRIMARY,
//   "0x5925b53d20cbcbd43107e57ba30ea67d7ef50bc9181db740e4f05261840a75f009bc4fc1453aa0057822fd85ba33531dbc0ef74177f2f633b50cf342c99a8b501b",
//   true,
//   true,
//   true,
//   true,
//   true,
//   true,
//   true
// )

// arcaAccessControlService.updateMedicalGuardianPermission(
//   primaryGuardianWallet, 
//   primaryGuardianConnect,
//   secondGuardianWallet.address,
//   patient1Wallet.address,
//   MedicalGuardianRoleEnum.PRIMARY,
//   true,
//   true,
//   true,
//   true,
//   true,
//   true,
//   false
// )