import { ethers } from "ethers";
import { arca_diamond_abi } from "./abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "./abis/arca.identity.facet.abi";
import { arca_access_control_facet_abi } from "./abis/arca.access.control.facet.abi";
const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const arcaDiamondAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi, ...arca_access_control_facet_abi];

export class TestWallet {
  privateKey: string;

  constructor(privateKey: string) {
    this.privateKey = privateKey;
  }

  getWallet() {
    const wallet = new ethers.Wallet(this.privateKey, provider);
    return wallet;
  }
}

export class ContractConnect {
  contractAddress: string;
  combinedABIs: any;
  wallet: ethers.Wallet;

  constructor(
    contractAddress: string,
    combinedABIs: any,
    wallet: ethers.Wallet,
  ) {
    this.contractAddress = contractAddress;
    this.combinedABIs = combinedABIs;
    this.wallet = wallet;
  }

  connect() {
    const connection = new ethers.Contract(
      this.contractAddress,
      this.combinedABIs,
      this.wallet,
    );
    return connection;
  }
}

// const ownerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// const ownerWallet = new TestWallet(ownerPrivateKey)

const ownerPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // account 0
let ownerWalletInit = new TestWallet(ownerPrivateKey);
let ownerWallet = ownerWalletInit.getWallet();
let ownerContractConnectInit = new ContractConnect(
  arcaDiamondAddress,
  combinedABIs,
  ownerWallet,
);
let ownerContractConnect = ownerContractConnectInit.connect();


const admin2PrivateKey = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" // account 3
let admin2WalletInit = new TestWallet(admin2PrivateKey);
let admin2Wallet = admin2WalletInit.getWallet();
let admin2ContractConnectInit = new ContractConnect(
  arcaDiamondAddress,
  combinedABIs,
  admin2Wallet,
);
let admin2ContractConnect = admin2ContractConnectInit.connect();

const patient1PrivateKey =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // account 1
let patient1WalletInit = new TestWallet(patient1PrivateKey);
let patient1Wallet = patient1WalletInit.getWallet();
let patient1ContractConnectInit = new ContractConnect(
  arcaDiamondAddress,
  combinedABIs,
  patient1Wallet,
);
let patient1ContractConnect = patient1ContractConnectInit.connect();

const patient1SecondaryPrivateKey =
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"; // account 2
let patient1SecondaryWalletInit = new TestWallet(patient1SecondaryPrivateKey);
let patient1SecondaryWallet = patient1SecondaryWalletInit.getWallet();
let patient1SecondaryContractConnectInit = new ContractConnect(
  arcaDiamondAddress,
  combinedABIs,
  patient1SecondaryWallet,
);
let patient1SecondaryContractConnect = patient1SecondaryContractConnectInit.connect();


// const primaryMedicalGuardianPrivateKey = "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" // account 4
const primaryMedicalGuardianPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" // used on the mobile app
let primaryMedicalGuardianWalletInit = new TestWallet(primaryMedicalGuardianPrivateKey);
let primaryMedicalGuardianWallet = primaryMedicalGuardianWalletInit.getWallet();
let primaryMedicalGuardianContractConnectInit = new ContractConnect(
  arcaDiamondAddress,
  combinedABIs,
  primaryMedicalGuardianWallet,
);
let primaryMedicalGuardianContractConnect = primaryMedicalGuardianContractConnectInit.connect();


const secondMedicalGuardianPrivateKey = "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba" // account 5
let secondMedicalGuardianWalletInit = new TestWallet(secondMedicalGuardianPrivateKey);
let secondMedicalGuardianWallet = secondMedicalGuardianWalletInit.getWallet();
let secondMedicalGuardianContractConnectInit = new ContractConnect(
  arcaDiamondAddress,
  combinedABIs,
  secondMedicalGuardianWallet,
);
let secondaryMedicalGuardianContractConnect = secondMedicalGuardianContractConnectInit.connect();


// custom generated wallet for testing wallet generation functionality
const generatedWalletPrivateKey = "0xa320d83b0f50496f9187150b0ffafd4c90fffe8c33c65208ba706925841078f1"
const generatedWalletAddress = "0xD3e5873c1095b3c526BBE68F9D3b19a3Ce8E5861"
const generatedWalletMnemonics = "card gospel priority open during happy advance soft cloth arrange aspect palace"
const generatedWalletInit = new TestWallet(generatedWalletPrivateKey);
const generatedWallet = generatedWalletInit.getWallet();
const generatedWalletContractConnectInit = new ContractConnect(
  arcaDiamondAddress,
  combinedABIs,
  generatedWallet,
)
const generatedWalletContractConnect = generatedWalletContractConnectInit.connect()



const patientGeneratedWalletPrivateKey='6185e7df3bda46b8cc5cdfed3160e84ce9455c0bf31fa02df8e4b4ef9031a0b5'
const patientGeneratedWalletAddress='0x3a110E029Aa9eEaadd3E863b74eADDc784E209F0'
const patientGeneratedWalletMnemonics='vivid idle sorry crisp erosion picnic opera fetch enroll drama rural diploma'
const patientGeneratedWalletInit = new TestWallet(patientGeneratedWalletPrivateKey);
const patientGeneratedWallet = patientGeneratedWalletInit.getWallet();
const patientGeneratedWalletContractConnectInit = new ContractConnect(
  arcaDiamondAddress,
  combinedABIs,
  patientGeneratedWallet,
)
const patientGeneratedWalletContractConnect = patientGeneratedWalletContractConnectInit.connect()


export const testWallets = [
  ownerWallet, 
  patient1Wallet, 
  patient1SecondaryWallet, 
  admin2Wallet,
  primaryMedicalGuardianWallet,
  secondMedicalGuardianWallet,
  generatedWallet,
  patientGeneratedWallet
];


export const testConnects = [
  ownerContractConnect,
  patient1ContractConnect,
  patient1SecondaryContractConnect,
  admin2ContractConnect,
  primaryMedicalGuardianContractConnect,
  secondaryMedicalGuardianContractConnect,
  generatedWalletContractConnect,
  patientGeneratedWalletContractConnect
];
