import { ethers } from "ethers";
import { arca_diamond_abi } from "./abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "./abis/arca.identity.facet.abi";
const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

export class TestWallet{
  privateKey: string

  constructor(privateKey: string) {
    this.privateKey = privateKey
  }

  getWallet() {
    const wallet = new ethers.Wallet(this.privateKey, provider)
    return wallet
  }
}


export class ContractConnect{
  contractAddress: string
  combinedABIs: any
  wallet: ethers.Wallet

  constructor(contractAddress: string, combinedABIs: any, wallet: ethers.Wallet) {
    this.contractAddress = contractAddress
    this.combinedABIs = combinedABIs
    this.wallet = wallet
  }

  connect() {
    const connection = new ethers.Contract(
      this.contractAddress,
      this.combinedABIs,
      this.wallet,
    );
    return connection
  }
}


// const ownerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// const ownerWallet = new TestWallet(ownerPrivateKey)

const ownerPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
let ownerWalletInit = new TestWallet(ownerPrivateKey);
let ownerWallet = ownerWalletInit.getWallet();
let ownerContractConnectInit = new ContractConnect(arcaDiamondAddress, combinedABIs, ownerWallet);
let ownerContractConnect = ownerContractConnectInit.connect()

const patient1PrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
let patient1WalletInit = new TestWallet(patient1PrivateKey);
let patient1Wallet = patient1WalletInit.getWallet();
let patient1ContractConnectInit = new ContractConnect(arcaDiamondAddress, combinedABIs, patient1Wallet)
let patient1ContractConnect = patient1ContractConnectInit.connect()

export const testWallets = [ownerWallet, patient1Wallet]

export const testConnects = [ownerContractConnect, patient1ContractConnect]

