import { ethers } from "ethers";
import { testWallets, testConnects } from "../test.wallets.contract.connects";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/arca.identity.facet.abi";

const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

export class IdentityEthersOnchain {
  async saveAdminInitializationMessageHash(
    randomMessage: string,
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
  ) {
    try {
      contractConnect.once(
        "AdminInitializationMessageHashWrittenEvent",
        (message, writer, customMessageHash) => {
          const data = {
            message,
            writer,
            customMessageHash,
          };
          console.log(`Event data:`, data);
        },
      );

      const signature = await wallet.signMessage(randomMessage);
      const messageHash = ethers.hashMessage(randomMessage);
      console.log("Message hash:", messageHash);

      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const messageHashData = iFace.encodeFunctionData(
        "saveAdminInitializationMessageHash",
        [messageHash, signature],
      );

      const txOption = {
        to: arcaDiamondAddress,
        data: messageHashData,
      };
      await wallet.sendTransaction(txOption);
      console.log("Transaction successful");
    } catch (error) {
      throw new Error(`Error saving admin initialization hash: ${error}`)
    }
  }

  async getAdminInitializationMessageHashesAndSignatures(
    wallet: ethers.Wallet,
  ) {
    try {
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const txData = iFace.encodeFunctionData(
        "getAdminInitializationMessageHashesAndSignatures",
      );
      const txOption = {
        to: arcaDiamondAddress,
        data: txData,
      };
      const response = await wallet.call(txOption);
      const decoded = iFace.decodeFunctionResult(
        "getAdminInitializationMessageHashesAndSignatures",
        response,
      );
      const formattedResponse = decoded[0].map((item: any) => ({
        messageHash: item.messageHash,
        messageSignature: item.messageSignature,
      }));
      console.log("Hash and Signature Formatted Response: ", formattedResponse);
      return formattedResponse;
    } catch (error) {
      throw new Error(`Error getting message hashes and signature: error`)
    }
  }

  async selectRandomAdminPublicKey(senderWallet: ethers.Wallet) {
    try {
      const hashesAndSigs =
        await this.getAdminInitializationMessageHashesAndSignatures(
          senderWallet,
        );
      if (!hashesAndSigs || hashesAndSigs.length === 0) {
        throw new Error("No admin initialization hashes found.");
      }
      const randomIndex = Math.floor(Math.random() * hashesAndSigs.length);
      const randomAdminData = hashesAndSigs[randomIndex];
      const recoveredPublicKey = ethers.SigningKey.recoverPublicKey(
        randomAdminData.messageHash,
        randomAdminData.messageSignature,
      );
      return recoveredPublicKey;
    } catch (error) {
      throw new Error(`Error selecting random PK: ${error}`)
    }
  }

  async getIdentityCount(wallet: ethers.Wallet) {
    try {
      const txOption = {
        to: arcaDiamondAddress,
        data: ethers.id("getIdentityCount()").substring(0, 10),
      };
      const response = await wallet.call(txOption); // fallback call for a view function with call()
      const result = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256", "uint256"],
        response,
      );
      console.log(result);
    } catch (error) {
      throw new Error(`Error getting identity from diamond contract: ${error}`)
    }
  }

  async registerPatientOnChain(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    cid: string,
  ) {
    try {
      contractConnect.once("PatientRegisteredEvent", (message, patient) => {
        console.log(`Event received: ${message}`, patient);
      });

      // converting unix date to bytes32
      const unixTimestampInSeconds = Math.floor(Date.now() / 1000); //unix timestamp in seconds
      console.log("Unix Timestamp in second:", unixTimestampInSeconds);

      const cidBytes32 = ethers.toUtf8Bytes(cid);


      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("registerPatient", [
        unixTimestampInSeconds,
        cidBytes32,
      ]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };
      const response = await wallet.sendTransaction(txOption);
      await response.wait();
    } catch (error) {
      throw new Error(`Error registering patient on chain: ${error}`)
    }
  }

  async verifyOnchainPatient(wallet: ethers.Wallet, patientAddress: string) {
    try {
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData('verifyPatientIdentity', [patientAddress])
      const txOption = {
        to: arcaDiamondAddress,
        data: data
      }
      const response = await wallet.sendTransaction(txOption)
      await response.wait()
    } catch (error) {
      throw new Error(`Error verifying patient on chain:${error}`)
    }
  }

  async getPatientDataOnChain(wallet: ethers.Wallet, contractConnect: ethers.Contract, patientAddress: string) {
    try {
      contractConnect.once(
        "PatientIdentityFetchedEvent",
        (message, patient) => {
          console.log(`Event received: ${message}`, patient);
        },
      );
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("getPatientIdentity", [patientAddress]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };
      await wallet.sendTransaction(txOption);
    } catch (error) {
      throw new Error(`Error getting patient data on chain: ${error}`)
    }
  }
}
