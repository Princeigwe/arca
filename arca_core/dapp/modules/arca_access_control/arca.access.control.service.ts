import { AccessControlEthersOnchain } from "./access.control.ethers.onchain";
import { ethers } from "ethers";
import {
  TestWallet,
  testWallets,
  testConnects,
} from "../../test.wallets.contract.connects";

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

}


const accessControlEthersOnchain = new AccessControlEthersOnchain()
const arcaAccessControlService = new ArcaAccessControlService(accessControlEthersOnchain)



//** TESTINGS *//////////////


const anyWallet = testWallets[2];
const primaryGuardianWallet = testWallets[4];
const patient1Wallet = testWallets[1];

// arcaAccessControlService.getMyMedicalGuardianPermissions(primaryGuardianWallet)
arcaAccessControlService.getMedicalPermission(anyWallet, primaryGuardianWallet.address, patient1Wallet.address)