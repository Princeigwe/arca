import { ethers } from "ethers";
import { arca_diamond_abi } from "./abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "./abis/arca.identity.facet.abi";
const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);


// const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

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
  combinedABIs: []
  wallet: ethers.Wallet

  constructor(contractAddress: string, combinedABIs: [], wallet: ethers.Wallet) {
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

