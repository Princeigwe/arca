import { EncryptionKeys, IPFS } from "./entities/base.entity.type";
import { PatientIdentity } from "./entities/patient.identity";
import { Gender } from "./enums/gender.enum";
import { EmploymentStatus } from "./enums/employment.status.enum";
import { IpfsOperator } from "../utils/ipfs.operator";
import { SymmetricEncryptDecrypt } from "../utils/symmetric.encrypt.decrypt";
import { TestWallet } from "../test.wallets.contract.connects";
import { ContractConnect } from "../test.wallets.contract.connects";
import { ethers } from "ethers";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/arca.identity.facet.abi";

// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];


const ipfsOperator = new IpfsOperator();

const storageType = PatientIdentity.name;

const SED = new SymmetricEncryptDecrypt();

export class ArcaIdentityService {

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
      console.error(`Error getting identity count from diamond contract: ${error}`)
    }
  }


  async registerPatient(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender,
    nationalID: string,
    homeAddress: string,
    employmentStatus: EmploymentStatus,
  ) {
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
    const { encryptedData, iv } = (await SED.encryptData(plainIdentityJsonData))!;

    console.log("Encrypted data: ", encryptedData);
    console.log("IV: ", iv);
    // const encryptedKeys: EncryptionKeys = {};
    // const data: IPFS = {
    //   storageType,
    //   encryptedData,
    //   // encryptedKeys
    // };
    // const jsonData = JSON.stringify(data);

    // const fileName: string = `Patent-Identity-${firstName}-${lastName}.json`;
    // const uploadJsonData = await ipfsOperator.uploadJsonData(
    //   fileName,
    //   jsonData,
    // );
    // console.log("Filebase upload response: ", uploadJsonData);
  }


  async dummyReadPatientData(encryptedData: string, dek: string, iv: string) {
    const decryptedData = await SED.decryptData(encryptedData, dek, iv);
    const decryptedJsonData = JSON.parse(decryptedData!);
    console.log("Decrypted Json data: ", decryptedJsonData);
  }
}




//////* TESTINGS *////////

const arcaIdentityService = new ArcaIdentityService();

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
//   "John",
//   "Doe",
//   new Date(),
//   Gender.MALE,
//   "123456789",
//   "123 Main St",
//   EmploymentStatus.STUDENT,
// );

const iv = "89c16532618816bd38342b9170d5f9b4"
const dek = "d49d0fd9328b899ae38204c8c23fd492e6d742529acecc99e62ae4b2d06f7766"
const encryptedData = "f8cdc73b1d534d15aecad5fdab488c265faf5c77913950d011ec6084354743e4b3b5f8f34cdf42151c451b38e7827f6880ba7f526cacf563d7a03b2022d5ad3adab145cb32630b9189b1fa8c868ba6c9daabcce415602446b9aa3ba04baa3402abca3b3e6a21265f0f6e640f00c904bc7ee1bc93ead9497d070dd7f290bad45796aa5a9db9375491100498b8edd251d173b0dcda8ce2239d07a911dc4c4c6d0b6d3ff1d76cb41073935231e846318764376401fb6bb5f6a9673411b9f7ffe67f"


// arcaIdentityService.dummyReadPatientData(encryptedData, dek, iv)

const ownerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
let ownerWalletInit = new TestWallet(ownerPrivateKey)
let ownerWallet = ownerWalletInit.getWallet()

arcaIdentityService.getIdentityCount(ownerWallet)