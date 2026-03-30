import { AccessControlEthersOnchain } from "./access.control.ethers.onchain";
import { ethers } from "ethers";
import {
  TestWallet,
  testWallets,
  testConnects,
} from "../../test.wallets.contract.connects";
import { MedicalGuardianRoleEnum } from "./enums/medical.guardian.role.type";

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

  async assignMedicalGuardian(
    wallet: ethers.Wallet, 
    contractConnect: ethers.Contract,
    medicalGuardianAddress: string,
    mainPatientAddress: string,
    role: MedicalGuardianRoleEnum,
    canGrantProviderAccess?: boolean,
    canGrantGuardianAccess?: boolean,
    canRevokeProviderAccess?: boolean,
    canRevokeGuardianAccess?: boolean,
    canUploadRecords?: boolean,
    canReadRecords?: boolean,
    canDeleteRecords?: boolean
  ){
    try {
      return await this.accessControlEthersOnchain.assignMedicalGuardian(
        wallet,
        contractConnect,
        medicalGuardianAddress,
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
      throw new Error(`Error assigning medical guardian to patient: ${error}`)
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

const secondaryGuardianWallet = testWallets[5];
const secondaryGuardianConnect = testConnects[5]

// arcaAccessControlService.getMyMedicalGuardianPermissions(primaryGuardianWallet)
// arcaAccessControlService.getMedicalPermission(anyWallet, primaryGuardianWallet.address, patient1Wallet.address)
arcaAccessControlService.assignMedicalGuardian(
  primaryGuardianWallet, 
  primaryGuardianConnect,
  secondaryGuardianWallet.address,
  patient1Wallet.address,
  MedicalGuardianRoleEnum.PRIMARY,
  true,
  true,
  true,
  true,
  true,
  true,
  true
)