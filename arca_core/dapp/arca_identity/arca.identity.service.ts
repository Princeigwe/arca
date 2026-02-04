import { EncryptionMetadata, IPFS } from "./entities/base.entity.type";
import { PatientIdentity } from "./entities/patient.identity";
import { Gender } from "./enums/gender.enum";
import { EmploymentStatus } from "./enums/employment.status.enum";
import { IpfsOperator } from "../utils/ipfs.operator";
import { SymmetricEncryptDecrypt } from "../utils/symmetric.encrypt.decrypt";
import { TestWallet, testWallets, testConnects } from "../test.wallets.contract.connects";
import { ContractConnect } from "../test.wallets.contract.connects";
import { ethers } from "ethers";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/arca.identity.facet.abi";
import { RsaEncryptDecrypt } from "../utils/rsa.encrypt.decrypt";
import { IdentityEthersOnchain } from "./identity.ethers.onchain";

// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

const ipfsOperator = new IpfsOperator();

const storageType = PatientIdentity.name;

const SED = new SymmetricEncryptDecrypt();
const RED = new RsaEncryptDecrypt();


export class ArcaIdentityService {
  constructor(
    private identityEthersOnchain: IdentityEthersOnchain
  ){}

  async getIdentityCount(wallet: ethers.Wallet) {
    try {
      return await this.identityEthersOnchain.getIdentityCount(wallet)
    } catch (error) {
      throw new Error(`Error getting identity count from onchain identity facet: ${error}`)
    }
  }


  async createAdminMsgAndSig(message: string, wallet: ethers.Wallet, contractConnect: ethers.Contract) {
    try {
      return await this.identityEthersOnchain.saveAdminInitializationMessageHash(message, wallet, contractConnect)
    } catch (error) {
      throw new Error(`Error creating admin message and signature: ${error}`)
    }
  }


  async getAdminMsgAndSigs(wallet: ethers.Wallet) {
    try {
      return await this.identityEthersOnchain.getAdminInitializationMessageHashesAndSignatures(wallet)
    } catch (error) {
      throw new Error(`Error getting admin message and signature: ${error}`)
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
      const adminMsgAndSigs = await this.identityEthersOnchain.getAdminInitializationMessageHashesAndSignatures(wallet)
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
      const { encryptedData, iv, dek } = (await SED.encryptData(
        plainIdentityJsonData,
      ))!;

      console.log("Encrypted data: ", encryptedData);
      console.log("IV: ", iv);
      
      const senderPk = wallet.signingKey.publicKey
      const adminPk = await this.identityEthersOnchain.selectRandomAdminPublicKey(wallet);
      const rsaEncryptedKeys = RED.dualKeyEncryption(dek, senderPk, adminPk!)!
      const encryptionMetadata: EncryptionMetadata = {
        dekIv: iv,
        rsaKeys: rsaEncryptedKeys
      };
      const data: IPFS = {
        storageType,
        encryptedData,
        encryptedKeys: encryptionMetadata,
      };
      const jsonData = JSON.stringify(data);

      const fileName: string = `Patent-Identity-${firstName}-${lastName}.json`;
      const {cid, uploadRequest} = await ipfsOperator.uploadJsonData(
        fileName,
        jsonData,
      );
      console.log("Filebase upload response: ", uploadRequest)

      // registering patient onchain
      await this.identityEthersOnchain.registerPatientOnChain(wallet, contractConnect, cid!)
      console.log("Patient registration successful")
    } catch (error) {
      throw new Error(`Error registering patient: ${error}`)
    }
  }


  async decryptAndReadIPFSPatientData(
    privateKey: string,
    encryptedDekForAdmin: string,
    encryptedPatientData: string,
    iv: string
  ) {
    try {
      const decryptedRsaDEK = RED.decryptDek(privateKey, encryptedDekForAdmin)
      const decryptedPatientData = SED.decryptData(encryptedPatientData, decryptedRsaDEK, iv)
      console.log("Decrypted patient data:", decryptedPatientData)
    } catch (error) {
      throw new Error(`Error decrypting and reading IPFS patient data: ${error}`)
    }
  }


  async verifyPatient(wallet: ethers.Wallet, patientAddress: string) {
    try {
      await this.identityEthersOnchain.verifyOnchainPatient(wallet, patientAddress)
    } catch (error) {
      throw new Error(`Error verifying patient: ${error}`)
    }
  }

  async dummyReadPatientData(encryptedData: string, dek: string, iv: string) {
    const decryptedData = await SED.decryptData(encryptedData, dek, iv);
    const decryptedJsonData = JSON.parse(decryptedData!);
    console.log("Decrypted Json data: ", decryptedJsonData);
  }
}

//////* TESTINGS *////////

const identityEthersOnchain = new IdentityEthersOnchain()
const arcaIdentityService = new ArcaIdentityService(identityEthersOnchain);

let patient1Wallet = testWallets[1];
let patient1ContractConnect = testConnects[1]

const patient = new PatientIdentity(
  "John",
  "Doe",
  new Date(),
  Gender.MALE,
  "123456789",
  "123 Main St",
  EmploymentStatus.STUDENT,
);
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


let ownerWallet = testWallets[0]
let ownerContractConnect = testConnects[0]

// arcaIdentityService.getIdentityCount(ownerWallet);

const randomMessage = "Hello world"
// arcaIdentityService.createAdminMsgAndSig(randomMessage, ownerWallet, ownerContractConnect)
// arcaIdentityService.getAdminMsgAndSigs(ownerWallet);


const ownerSecretKey = ownerWallet.signingKey.privateKey
const encryptedDekForAdmin = "BPOSV3gSjd3U+E+cBu6BjimUEZur4OuqMv8CR9GGnj7yiHsWfdfQzyKfqFjAcJN3L8cfwR0X5ZEjw8ymjmmdh2Kv5WlHxia9LdFxuM4fMEC3oGEONCCXAKxbxZh3vY8jfusY9mw4idLvs/htpt1Egd9lyCfBFtV0L2MqMwK2rNU+xU8TWrHLZcPQAL9cQY7L1Npy4IyTMuTl/VBlWwVZQlQ="
const encryptedPatientData = "920cdd0b2b041d44e1ba4f7385e688d9c603b94a9f2cb40fe806f18023928be026e375910f6a8f652e4371405a1cbace799784a1c3ff70d8949c3504d50fc6cb763cb4774200de259f089a06fcdfe96c9883becc43b08786da1ce6d3fbf59eeb9cb756f6db39eae767d1b7e274c00448fc02f35f427f464af006f5ba8a79b8de65af851434afb4b8f723a624271ef3456dc173f75ce347ef42be75ee91c3ad9dfe9f65e6bd2cf610fcfe7af4b1a9a12287f2b362384f851bd16981df9b3f485e"
const dekIv = "790845267e816c1bae50ab7ce235b816"

arcaIdentityService.decryptAndReadIPFSPatientData(
  ownerSecretKey,
  encryptedDekForAdmin,
  encryptedPatientData,
  dekIv
)