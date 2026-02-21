import { EncryptionMetadata, IPFS, SenderToRsaMasterKey } from "./entities/base.entity.type";
import { PatientIdentity } from "./entities/patient.identity";
import { Gender } from "./enums/gender.enum";
import { EmploymentStatus } from "./enums/employment.status.enum";
import { IpfsOperator } from "../utils/ipfs.operator";
import { SymmetricEncryptDecrypt } from "../utils/symmetric.encrypt.decrypt";
import {
  TestWallet,
  testWallets,
  testConnects,
} from "../test.wallets.contract.connects";
import { ContractConnect } from "../test.wallets.contract.connects";
import { ethers } from "ethers";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/arca.identity.facet.abi";
import { RsaEncryptDecrypt } from "../utils/rsa.encrypt.decrypt";
import { IdentityEthersOnchain } from "./identity.ethers.onchain";
import { isTemplateExpression } from "typescript";

// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

const ipfsOperator = new IpfsOperator();

const storageType = PatientIdentity.name;

const SED = new SymmetricEncryptDecrypt();
const RED = new RsaEncryptDecrypt();

export class ArcaIdentityService {
  constructor(private identityEthersOnchain: IdentityEthersOnchain) {}

  async getIdentityCount(wallet: ethers.Wallet) {
    try {
      return await this.identityEthersOnchain.getIdentityCount(wallet);
    } catch (error) {
      throw new Error(
        `Error getting identity count from onchain identity facet: ${error}`,
      );
    }
  }


  async addAdmin(wallet: ethers.Wallet, contractConnect: ethers.Contract, newAdminAddress: string) {
    try {
      await this.identityEthersOnchain.addAdmin(wallet, contractConnect, newAdminAddress);
    } catch (error) {
      throw new Error(`Error adding admin: ${error}`);
    }
  }


  async checkIsAdmin(wallet: ethers.Wallet){
    try {
      return await this.identityEthersOnchain.checkIsAdmin(wallet);
    } catch (error) {
      throw new Error(`Error checking if admin: ${error}`);
    }
  }

  async createAdminMsgAndSig(
    message: string,
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
  ) {
    try {
      return await this.identityEthersOnchain.saveAdminInitializationMessageHash(
        message,
        wallet,
        contractConnect,
      );
    } catch (error) {
      throw new Error(`Error creating admin message and signature: ${error}`);
    }
  }

  async getAdminMsgAndSigs(wallet: ethers.Wallet) {
    try {
      return await this.identityEthersOnchain.getAdminInitializationMessageHashesAndSignatures(
        wallet,
      );
    } catch (error) {
      throw new Error(`Error getting admin message and signature: ${error}`);
    }
  }

  async registerPatient(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender,
    nationalID: string,
    homeAddress: string,
    employmentStatus: EmploymentStatus,
  ) {
    try {
      // check if there are admin init msg and sigs
      const adminMsgAndSigs =
        await this.identityEthersOnchain.getAdminInitializationMessageHashesAndSignatures(
          wallet,
        );
      if (!adminMsgAndSigs || adminMsgAndSigs.length === 0) {
        throw new Error("No admin initialization hashes found.");
      }
      const identityData = new PatientIdentity(
        firstName,
        lastName,
        dateOfBirth,
        gender,
        nationalID,
        homeAddress,
        employmentStatus,
      );

      const plainIdentityJsonData = JSON.stringify(identityData);
      // secret key encryption of plain data
      const { encryptedData, iv, dek } = (await SED.encryptData(
        plainIdentityJsonData,
      ))!;

      console.log("Encrypted data: ", encryptedData);
      console.log("IV: ", iv);

      const senderPk = wallet.signingKey.publicKey;
      const { recoveredPublicKey, messageSignature } =
        await this.identityEthersOnchain.selectRandomAdminPublicKeyAndSignature(
          wallet,
        );
      const rsaEncryptedKeys = RED.dualKeyEncryption(
        dek,
        wallet.address,
        senderPk,
        recoveredPublicKey!,
      )!;
      const encryptionMetadata: EncryptionMetadata = {
        dekIv: iv,
        rsaKeys: rsaEncryptedKeys,
      };
      const data: IPFS = {
        storageType,
        primaryWalletAddress: wallet.address,
        uploadedAt: new Date(),
        encryptedData,
        encryptionMetaData: encryptionMetadata,
      };
      const jsonData = JSON.stringify(data);

      const fileName: string = `${wallet.address}-patient-identity.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );
      console.log("Filebase upload response: ", uploadRequest);

      // registering patient onchain
      await this.identityEthersOnchain.registerPatientOnChain(
        wallet,
        contractConnect,
        cid!,
        messageSignature,
        rsaEncryptedKeys.rsaEncryptedMasterDEKsForSender[0].rsaEncryptedMasterDEK,
      );
      console.log("Patient registration successful");
    } catch (error) {
      throw new Error(`Error registering patient: ${error}`);
    }
  }

  async decryptAndReadIPFSPatientData(
    privateKey: string,
    encryptedDekForAdmin: string,
    encryptedPatientData: string,
    iv: string,
  ) {
    try {
      const decryptedRsaDEK = RED.decryptDek(privateKey, encryptedDekForAdmin);
      const decryptedPatientData = SED.decryptData(
        encryptedPatientData,
        decryptedRsaDEK,
        iv,
      );
      console.log("Decrypted patient data:", decryptedPatientData);
    } catch (error) {
      throw new Error(
        `Error decrypting and reading IPFS patient data: ${error}`,
      );
    }
  }

  async verifyPatient(wallet: ethers.Wallet, patientAddress: string) {
    try {
      await this.identityEthersOnchain.verifyOnchainPatient(
        wallet,
        patientAddress,
      );
    } catch (error) {
      throw new Error(`Error verifying patient: ${error}`);
    }
  }

  async readPatientOnchainData(
    wallet: ethers.Wallet,
    patientAddress: string,
  ) {
    try {
      return await this.identityEthersOnchain.getPatientDataOnChain(
        wallet,
        patientAddress,
      );
    } catch (error) {
      throw new Error(`Error reading patient on chain data: ${error}`);
    }
  }


  async verifyAdminSenderInitSigForPatientIpfsData(
    wallet: ethers.Wallet, 
    patientAddress: string, 
    adminInitMessage: string
  ){
    try {
      const senderIsAdmin = await this.checkIsAdmin(wallet)
      if(senderIsAdmin){
        const patient = await this.readPatientOnchainData(wallet, patientAddress)
        const adminInitSig = patient.adminInitializationSignature

        const adminInitMsgHash = ethers.hashMessage(adminInitMessage)
        const recoveredAdminAddress = ethers.recoverAddress(adminInitMsgHash, adminInitSig)

        if(recoveredAdminAddress == wallet.address){
          return true;
        }
        else{
          return false;
        }
      }
      throw new Error("Sender is not an admin, cannot verify initialization signature for patient IPFS data")
    } catch (error) {
      throw new Error(`Error verifying admin initialization signature for patient IPFS data: ${error}`)
    }
  }


  async readPatientIpfsData(
    wallet: ethers.Wallet, 
    patientAddress: string,
    adminInitMessage: string
  ){
    try {
      const senderIsAdmin = await this.checkIsAdmin(wallet)
      if(senderIsAdmin){
         //* verifying patient IPFS data was encrypted with the appropriate admin signature before any further operation
        const isAppropriateAdmin = await this.verifyAdminSenderInitSigForPatientIpfsData(wallet, patientAddress, adminInitMessage)
        if(!isAppropriateAdmin){
          throw new Error("The signature of the admin sender cannot be verified to have initialized the patient data, hence cannot be authorized to read the patient IPFS data")
        }
        const patientCid = await this.identityEthersOnchain.getCidOfAddress(wallet, patientAddress)
        const encryptedIpfsData = await ipfsOperator.getFileByCid(patientCid)
        const decryptedDekForAdmin = RED.decryptDek(
          wallet.privateKey, 
          JSON.parse(encryptedIpfsData).encryptionMetaData.rsaKeys.rsaEncryptedDEKForAdmin
        )

        const decryptedPatientData = SED.decryptData(
          JSON.parse(encryptedIpfsData).encryptedData,
          decryptedDekForAdmin,
          JSON.parse(encryptedIpfsData).encryptionMetaData.dekIv,
        )
        console.log("Decrypted patient data:", decryptedPatientData);
        return decryptedPatientData;
      }

      // sender is not an admin
      else{
        const patientCid = await this.identityEthersOnchain.getCidOfAddress(wallet, patientAddress)
        const patientOnchainData = await this.readPatientOnchainData(wallet, patientAddress)

        let senderRsaMasterDekPosition = patientOnchainData.rsaMasterDEKs.findIndex(item => item.identity == wallet.address)
    
        const encryptedIpfsData = await ipfsOperator.getFileByCid(patientCid)
        const decryptedDekForSender = RED.decryptDek(
          wallet.privateKey, 
          JSON.parse(encryptedIpfsData).encryptionMetaData.rsaKeys.rsaEncryptedMasterDEKsForSender[senderRsaMasterDekPosition].rsaEncryptedMasterDEK
        )

        const decryptedPatientData = SED.decryptData(
          JSON.parse(encryptedIpfsData).encryptedData,
          decryptedDekForSender,
          JSON.parse(encryptedIpfsData).encryptionMetaData.dekIv,
        )

        console.log("Decrypted patient data:", decryptedPatientData);
        return decryptedPatientData;
      }

    } catch (error) {
      throw new Error(`Error reading patient IPFS data: ${error}`);
    }
  }

  // async convertBytesToString(rsaMasterKeyBytes: string) {
  //   try {
  //     const stringKey = ethers.toUtf8String(rsaMasterKeyBytes);
  //     return stringKey;
  //   } catch (error) {
  //     throw new Error(`Error converting RSA master key to string: ${error}`);
  //   }
  // }

  async linkAddressRequest(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    patientAddress: string,
    randomMessage: string,
  ) {
    try {
      return await this.identityEthersOnchain.linkAddressRequest(
        wallet,
        contractConnect,
        patientAddress,
        randomMessage,
      );
    } catch (error) {
      throw new Error(`Error sending request for linking address: ${error}`);
    }
  }

  async approveLinkAddressRequest(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    secondaryAddress: string,
    randomApprovalMessage: string,
  ) {
    try {

      await this.identityEthersOnchain.approveLinkAddressRequest(
        wallet,
        contractConnect,
        secondaryAddress,
        randomApprovalMessage,
      );

    } catch (error) {
      throw new Error(`Error approving link address request: ${error}`);
    }
  }

  async storeRsaMasterDekForLinkedAccount(
    wallet: ethers.Wallet,
    contractConnect: ethers.Contract,
    requestHash: string,
    requestSignature: string,
  ) {
    try {
      const walletAddress = await wallet.getAddress();
      const patient = await this.readPatientOnchainData(
        wallet,
        walletAddress,
      );
      const patientRsaMasterDEKs = patient.rsaMasterDEKs;
      const mainItemRsaData = patientRsaMasterDEKs.find(
        (item) => item.identity === patient.primaryAddress,
      );
      const mainRsaKey = mainItemRsaData!.rsaMasterDEK // already converted from bytes to string

      let decryptedMainRsaKey = mainRsaKey;
      if (mainRsaKey.length > 100) {
        decryptedMainRsaKey = RED.decryptDek(wallet.privateKey, mainRsaKey);
      }

      const recoveredPublicKey = ethers.SigningKey.recoverPublicKey(
        requestHash,
        requestSignature,
      );
      const recoveredAddress = ethers.recoverAddress(
        requestHash,
        requestSignature,
      );
      console.log("Linked Account Recovered public key: ", recoveredPublicKey);
      console.log("Linked Account Recovered address: ", recoveredAddress);

      const linkedAccountRsaMasterDek = RED.encryptDek(
        recoveredPublicKey,
        decryptedMainRsaKey,
      );
      await this.identityEthersOnchain.storeRsaMasterDekForLinkedAddressOnChain(
        wallet,
        contractConnect,
        recoveredAddress,
        linkedAccountRsaMasterDek,
      );

      //* storing the linked master key in IPFS data
      await this.addLinkedSecondaryRsaMasterKeysIpfsProfileData(wallet, recoveredAddress, linkedAccountRsaMasterDek)

      console.log("RSA master dek for linked account stored successfully")
    } catch (error) {
      throw new Error(
        `Error storing RSA master dek for linked account: ${error}`,
      );
    }
  }

  async getAddressCidOfCurrentSender(wallet: ethers.Wallet) {
    try {
      const cid = await this.identityEthersOnchain.getAddressCidOfCurrentSender(wallet)
      console.log("Address CID:", cid)
      return cid
    } catch (error) {
      throw new Error(`Error fetching sender's cid: ${error}`)
    }
  }


  //todo: come back to this function
  async getCidOfAddress(wallet: ethers.Wallet, address: string){
    try {
      
    } catch (error) {
      throw new Error(`Error fetching cid of address: ${error}`)
    }
  }

  async addLinkedSecondaryRsaMasterKeysIpfsProfileData( wallet: ethers.Wallet, secondaryAddress: string, linkedRsaMasterDEK: string){
    try {
      const oldCid = await this.getAddressCidOfCurrentSender(wallet)
      const oldData = JSON.parse(await ipfsOperator.getFileByCid(oldCid))
      let newData = oldData

      const senderToRsaMasterDEK: SenderToRsaMasterKey = {
        sender: secondaryAddress,
        rsaEncryptedMasterDEK: linkedRsaMasterDEK
      }
      newData.encryptionMetaData!.rsaKeys.rsaEncryptedMasterDEKsForSender.push(senderToRsaMasterDEK)
      const jsonData = JSON.stringify(newData);

      const fileName: string = `${wallet.address}-patient-identity.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );

      console.log("Filebase upload response: ", uploadRequest)
      await this.identityEthersOnchain.updateAddressCid(wallet, cid!)

    } catch (error) {
      throw new Error(`Error replacing profile data to add linked secondary address on Filebase pinning service: ${error}`)
    }
  }


  async unlinkSecondaryAddress(wallet: ethers.Wallet, secondaryAddress: string){
    try{
      const updatedCid = await this.removeLinkedSecondaryRsaMasterKeysIpfsProfileData(wallet, secondaryAddress)

      await this.identityEthersOnchain.unlinkSecondaryAddress(wallet, secondaryAddress, updatedCid)
      console.log("Successful disconnection on linked address")
    }
    catch(error){
      throw new Error(`Error disconnecting secondary address: ${error}`)
    }
  }

  async removeLinkedSecondaryRsaMasterKeysIpfsProfileData(wallet: ethers.Wallet, secondaryAddress: string){
    try {
      const oldCid = await this.getAddressCidOfCurrentSender(wallet)
      const oldData = JSON.parse(await ipfsOperator.getFileByCid(oldCid))
      let newData = oldData

      let senderKeys: SenderToRsaMasterKey[] = newData.encryptionMetaData!.rsaKeys.rsaEncryptedMasterDEKsForSender

      const secondaryAddressExists = senderKeys.some(item => item.sender === secondaryAddress)

      if (!secondaryAddressExists) {
        throw new Error(`Secondary address ${secondaryAddress} does not exist in the linked addresses list`)
      }

      let reservedMasterSenderDEKsForSender = senderKeys.filter(senderKeys => senderKeys.sender !== secondaryAddress)

      newData.encryptionMetaData!.rsaKeys.rsaEncryptedMasterDEKsForSender = reservedMasterSenderDEKsForSender

      const jsonData = JSON.stringify(newData);

      const fileName: string = `${wallet.address}-patient-identity.json`; // using the wallet address as file key
      const { cid, uploadRequest } = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );
      
      console.log("Filebase upload response: ", uploadRequest)
      
      return cid

    } catch (error) {
      throw new Error(`Error replacing profile data to remove linked secondary address on Filebase pinning service: ${error}`)
    }
  }


  async dummyReadPatientData(encryptedData: string, dek: string, iv: string) {
    const decryptedData = await SED.decryptData(encryptedData, dek, iv);
    const decryptedJsonData = JSON.parse(decryptedData!);
    console.log("Decrypted Json data: ", decryptedJsonData);
  }
}

//////* TESTINGS *////////

const identityEthersOnchain = new IdentityEthersOnchain();
const arcaIdentityService = new ArcaIdentityService(identityEthersOnchain);

let patient1Wallet = testWallets[1];
let patient1ContractConnect = testConnects[1];

let admin2Wallet = testWallets[3];
let admin2ContractConnect = testConnects[3];

// arcaIdentityService.registerPatient(
//   patient1Wallet,
//   patient1ContractConnect,
//   "John",
//   "Doe",
//   new Date(),
//   Gender.MALE,
//   "123456789",
//   "123 Main St",
//   EmploymentStatus.STUDENT,
// );

const iv = "89c16532618816bd38342b9170d5f9b4";
const dek = "d49d0fd9328b899ae38204c8c23fd492e6d742529acecc99e62ae4b2d06f7766";
const encryptedData =
  "f8cdc73b1d534d15aecad5fdab488c265faf5c77913950d011ec6084354743e4b3b5f8f34cdf42151c451b38e7827f6880ba7f526cacf563d7a03b2022d5ad3adab145cb32630b9189b1fa8c868ba6c9daabcce415602446b9aa3ba04baa3402abca3b3e6a21265f0f6e640f00c904bc7ee1bc93ead9497d070dd7f290bad45796aa5a9db9375491100498b8edd251d173b0dcda8ce2239d07a911dc4c4c6d0b6d3ff1d76cb41073935231e846318764376401fb6bb5f6a9673411b9f7ffe67f";

// arcaIdentityService.dummyReadPatientData(encryptedData, dek, iv)

let ownerWallet = testWallets[0];
let ownerContractConnect = testConnects[0];

// arcaIdentityService.getIdentityCount(ownerWallet);
// arcaIdentityService.addAdmin(ownerWallet, ownerContractConnect, admin2Wallet.address)
// arcaIdentityService.checkIsAdmin(ownerWallet)

const adminInitMessage = "Hello world";
// arcaIdentityService.createAdminMsgAndSig(adminInitMessage, ownerWallet, ownerContractConnect)
// arcaIdentityService.getAdminMsgAndSigs(ownerWallet);

const ownerSecretKey = ownerWallet.signingKey.privateKey;
const encryptedDekForAdmin =
  "BPOSV3gSjd3U+E+cBu6BjimUEZur4OuqMv8CR9GGnj7yiHsWfdfQzyKfqFjAcJN3L8cfwR0X5ZEjw8ymjmmdh2Kv5WlHxia9LdFxuM4fMEC3oGEONCCXAKxbxZh3vY8jfusY9mw4idLvs/htpt1Egd9lyCfBFtV0L2MqMwK2rNU+xU8TWrHLZcPQAL9cQY7L1Npy4IyTMuTl/VBlWwVZQlQ=";
const encryptedPatientData =
  "920cdd0b2b041d44e1ba4f7385e688d9c603b94a9f2cb40fe806f18023928be026e375910f6a8f652e4371405a1cbace799784a1c3ff70d8949c3504d50fc6cb763cb4774200de259f089a06fcdfe96c9883becc43b08786da1ce6d3fbf59eeb9cb756f6db39eae767d1b7e274c00448fc02f35f427f464af006f5ba8a79b8de65af851434afb4b8f723a624271ef3456dc173f75ce347ef42be75ee91c3ad9dfe9f65e6bd2cf610fcfe7af4b1a9a12287f2b362384f851bd16981df9b3f485e";
const dekIv = "790845267e816c1bae50ab7ce235b816";

// arcaIdentityService.decryptAndReadIPFSPatientData(
//   ownerSecretKey,
//   encryptedDekForAdmin,
//   encryptedPatientData,
//   dekIv
// )

// arcaIdentityService.verifyPatient(ownerWallet, patient1Wallet.address)

// arcaIdentityService.readPatientOnchainData(
//   // ownerWallet,
//   patient1Wallet,
//   patient1Wallet.address,
// );

const patient1SecondaryWallet = testWallets[2];
const patient1SecondaryContractConnect = testConnects[2];
const randomLinkRequestMessage = "Request for unified access";

// arcaIdentityService.linkAddressRequest(
//   patient1SecondaryWallet,
//   patient1SecondaryContractConnect,
//   patient1Wallet.address,
//   randomLinkRequestMessage
// )

const randomApprovalMessage = "I approve the request for unified access";
// arcaIdentityService.approveLinkAddressRequest(
//   patient1Wallet,
//   patient1ContractConnect,
//   patient1SecondaryWallet.address,
//   randomApprovalMessage,
// );


// arcaIdentityService.storeRsaMasterDekForLinkedAccount(
//   patient1Wallet,
//   patient1ContractConnect,
//   "0xb786411fa0e5f61e565b234f19b74afe01e1026fbb48bbcd7f3949bdafaf37b8",
//   "0xc5a7d10b07d96f878e1fcb3750d1427d17fe50a80cf60bd095845f7ccbd39bc4202aecf23748c0df0f9a740a09f5a0e1a88a6f14a16e8fb1bd6590f6d16c8b4d1b"
// )


// arcaIdentityService.unlinkSecondaryAddress(
//   patient1Wallet, 
//   patient1SecondaryWallet.address
// )


// arcaIdentityService. getAddressCidOfCurrentSender(patient1Wallet)

arcaIdentityService.readPatientIpfsData(
  patient1Wallet,
  // patient1SecondaryWallet,
  // ownerWallet,
  // admin2Wallet,
  patient1Wallet.address,
  adminInitMessage
)