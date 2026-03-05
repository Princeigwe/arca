import { ethers } from "ethers";
import { testWallets, testConnects } from "../../test.wallets.contract.connects";
import { arca_diamond_abi } from "../../abis/arca.diamond.abi";
import { arca_access_control_facet_abi } from "../../abis/arca.access.control.facet.abi";

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const arcaDiamondAddress = process.env.DEPLOYED_DIAMOND_ADDRESS || process.env.LOCAL_DIAMOND_ADDRESS;
const combinedABIs = [...arca_diamond_abi, ...arca_access_control_facet_abi];

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
}

