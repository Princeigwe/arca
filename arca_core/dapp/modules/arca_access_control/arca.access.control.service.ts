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
}


const accessControlEthersOnchain = new AccessControlEthersOnchain()
const arcaAccessControlService = new ArcaAccessControlService(accessControlEthersOnchain)



//** TESTINGS *//////////////


const primaryGuardianWallet = testWallets[4];

arcaAccessControlService.getMyMedicalGuardianPermissions(primaryGuardianWallet)