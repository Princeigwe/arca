import { ethers } from "ethers";
import { testWallets, testConnects } from "../test.wallets.contract.connects";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/arca.identity.facet.abi";

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const arcaDiamondAddress = process.env.DEPLOYED_DIAMOND_ADDRESS || process.env.LOCAL_DIAMOND_ADDRESS;
const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

export class IdentityEthersOnchain {

  async checkIsAdmin(wallet: ethers.Wallet) {
    try {
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("checkIsAdmin", [wallet.address]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };
      const response = await wallet.call(txOption);
  
      // decoding ABI encoded returned data
      const [isAdmin] = iFace.decodeFunctionResult("checkIsAdmin", response);
      console.log("Is admin: ", isAdmin);

      return isAdmin
    } catch (error) {
      console.error("Error checking if admin: ", error);
    }
  }

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
      const response = await wallet.sendTransaction(txOption);
      await response.wait();
      console.log("Transaction successful");
    } catch (error) {
      throw new Error(`Error saving admin initialization hash: ${error}`);
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
      throw new Error(`Error getting message hashes and signature: ${error}`);
    }
  }

  async selectRandomAdminPublicKeyAndSignature(senderWallet: ethers.Wallet) {
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
      return {
        messageSignature: randomAdminData.messageSignature,
        recoveredPublicKey,
      };
    } catch (error) {
      throw new Error(`Error selecting random PK: ${error}`);
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
      throw new Error(`Error getting identity from diamond contract: ${error}`);
    }
  }

  async registerPatientOnChain(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    cid: string,
    adminInitializationSignatureUsed: string,
    rsaMasterDEK: string,
  ) {
    try {
      contractConnect.once("PatientRegisteredEvent", (message, patient) => {
        console.log(`Event received: ${message}`, patient);
      });

      // converting unix date to bytes32
      const unixTimestampInSeconds = Math.floor(Date.now() / 1000); //unix timestamp in seconds
      console.log("Unix Timestamp in second:", unixTimestampInSeconds);

      const cidBytes = ethers.toUtf8Bytes(cid);

      const rsaMasterDEKbytes = ethers.toUtf8Bytes(rsaMasterDEK);

      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("registerPatient", [
        unixTimestampInSeconds,
        cidBytes,
        adminInitializationSignatureUsed, //* already in bytes
        rsaMasterDEKbytes,
      ]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
        nonce: await wallet.getNonce("pending"),
      };
      const response = await wallet.sendTransaction(txOption);
      await response.wait();
    } catch (error) {
      throw new Error(`Error registering patient on chain: ${error}`);
    }
  }

  async verifyOnchainPatient(wallet: ethers.Wallet, patientAddress: string) {
    try {
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("verifyPatientIdentity", [
        patientAddress,
      ]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
        nonce: await wallet.getNonce("pending"),
      };
      const response = await wallet.sendTransaction(txOption);
      await response.wait();
    } catch (error) {
      throw new Error(`Error verifying patient on chain:${error}`);
    }
  }

  async getPatientDataOnChain(
    wallet: ethers.Wallet,
    patientAddress: string,
  ) {
    try {
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("getPatientIdentity", [
        patientAddress,
      ]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };
      const response = await wallet.call(txOption);
      const decoded = iFace.decodeFunctionResult(
        "getPatientIdentity",
        response,
      );
      const patient = decoded[0];
      console.log("Patient: ", patient);

      const formattedPatient = {
        primaryAddress: patient[0],
        linkedAddresses: Array.from(patient[1]),
        registeredAt: Number(patient[2]),
        isVerified: patient[3],
        guardians: Array.from(patient[4]),
        guardiansRequired: Number(patient[5]),
        adminInitializationSignature: patient[6],
        rsaMasterDEKs: Array.from(patient[7]).map((item: any) => ({
          identity: item[0],
          rsaMasterDEK: ethers.toUtf8String(item[1]),
        })),
      };
      console.log("Formatted Patient Identity:", formattedPatient);
      return formattedPatient;
    } catch (error) {
      throw new Error(`Error getting patient data on chain: ${error}`);
    }
  }

  // async convertRsaKeyBytesToString(rsaMasterKeyBytes: string) {
  //   try {
  //     const stringKey = ethers.toUtf8String(rsaMasterKeyBytes)
  //     return stringKey
  //   } catch (error) {
  //     throw new Error(`Error converting RSA master key to string: ${error}`)
  //   }
  // }

  async linkAddressRequest(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    primaryAddress: string,
    randomRequestMessage: string,
  ) {
    try {
      contractConnect.once(
        "LinkAccountRequestEvent",
        (message, sender, requestHash, requestSignature, primaryAddress) => {
          console.log(
            `Event received: ${message}
            Sender: ${sender}
            Request Hash: ${requestHash}
            Request Signature: ${requestSignature}
            Primary Address:  ${primaryAddress}`,
          );
        },
      );
      const requestHash = ethers.hashMessage(randomRequestMessage);
      const requestSignature = await wallet.signMessage(randomRequestMessage);
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("linkAddressRequest", [
        primaryAddress,
        requestHash,
        requestSignature,
      ]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
        // nonce: await wallet.getNonce("pending"),
      };
      const response = await wallet.sendTransaction(txOption);
      await response.wait();
    } catch (error) {
      throw new Error(`Error linking address request: ${error}`);
    }
  }

  async getCurrentNonce(wallet: ethers.Wallet) {
    try {
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("getCurrentNonce");
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };
      const response = await wallet.call(txOption); // fallback call for a view function with call()
      const result = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        response,
      );
      console.log(result);
      return result;
    } catch (error) {
      throw new Error(`Error getting internal nonce: ${error}`);
    }
  }

  async approveLinkAddressRequest(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    secondaryAddress: string,
    randomMessage: string,
  ) {
    try {
      contractConnect.once(
        "LinkAccountRequestApprovalEvent",
        (message, sender, secondaryAddress) => {
          console.log(
            `Event received: ${message}: Sender: ${sender}: Secondary Address:  ${secondaryAddress}`,
          );
        },
      );
      let currentNonce = await this.getCurrentNonce(wallet);
      let currentNonceNumber = Number(currentNonce![0]);
      const signature = await wallet.signMessage(randomMessage);
      const messageHash = ethers.hashMessage(randomMessage);
      const unixTimestampInSeconds = Math.floor(Date.now() / 1000);
      const iFace = new ethers.Interface(arca_identity_facet_abi);

      // fix for error on blockchain nonce too low on transaction
      const nonce = await provider.getTransactionCount(wallet.address, 'pending') 

      const data = iFace.encodeFunctionData("approveLinkAddressRequest", [
        secondaryAddress,
        unixTimestampInSeconds,
        currentNonceNumber,
        messageHash,
        signature,
      ]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
        nonce,
      };
      const response = await wallet.sendTransaction(txOption);
      await response.wait();
    } catch (error) {
      throw new Error(`Error approving link address request: ${error}`);
    }
  }

  async storeRsaMasterDekForLinkedAccountOnChain(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    secondaryAddress: string,
    secondaryRsaMasterKey: string,
  ) {
    try {
      contractConnect.once("PatientIdentityUpdateEvent", (message) => {
        console.log(`Event received: ${message}`);
      });
      // fix for error on blockchain nonce too low on transaction
      const nonce = await provider.getTransactionCount(wallet.address, 'pending')
      const secondaryRsaMasterKeyBytes = ethers.toUtf8Bytes(
        secondaryRsaMasterKey,
      );
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData(
        "storeRsaMasterDekForLinkedAccount",
        [secondaryAddress, secondaryRsaMasterKeyBytes],
      );
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
        nonce
      };
      const response = await wallet.sendTransaction(txOption);
      await response.wait();
    } catch (error) {
      throw new Error(
        `Error storing RSA master dek for linked account: ${error}`,
      );
    }
  }

  // this get the content identifier of the current msg.sender
  async getAddressCidOfCurrentSender(wallet: ethers.Wallet) {
    try {
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("getAddressCid", [wallet.address]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };
      const response = await wallet.call(txOption)
      const decoded = iFace.decodeFunctionResult("getAddressCid", response)
      const addressCid = ethers.toUtf8String(decoded[0])
      return addressCid
    } catch (error) {
      throw new Error(`Error fetching address cid: ${error}`)
    }
  }


  async getCidOfAddress(wallet: ethers.Wallet, address: string) {
    try {
      const iFace = new ethers.Interface(arca_identity_facet_abi);
      const data = iFace.encodeFunctionData("getAddressCid", [address]);
      const txOption = {
        to: arcaDiamondAddress,
        data: data,
      };
      const response = await wallet.call(txOption)
      const decoded = iFace.decodeFunctionResult("getAddressCid", response)
      const addressCid = ethers.toUtf8String(decoded[0])
      return addressCid
    } catch (error) {
      throw new Error(`Error fetching address cid: ${error}`)
    }
  }

  async updateAddressCid(wallet: ethers.Wallet, newCid: string){
    try {
      const cidBytes = ethers.toUtf8Bytes(newCid)
      const iFace = new ethers.Interface(arca_identity_facet_abi)
      const data = iFace.encodeFunctionData('updateAddressCid', [wallet.address, cidBytes])
      const txOption = {
        to: arcaDiamondAddress,
        data: data
      }
      const response = await wallet.sendTransaction(txOption)
      await response.wait()
    } catch (error) {
      throw new Error(`Error updating address cid: ${error}`)
    }
  }
}
