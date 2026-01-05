import { ethers } from "ethers";
import { arca_identity_registry_abi } from "../abis/arca.identity.register.abi";

const dotenv = require("dotenv")
dotenv.config()

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545"
const provider = new ethers.JsonRpcProvider(providerUrl)

const arcaIdentityRegistryAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const hardhatPrivateKey1 = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const dummyEOAddressPrivateKey1 = process.env.WALLET_PRIVATE_KEY || hardhatPrivateKey1
const wallet1 = new ethers.Wallet(dummyEOAddressPrivateKey1, provider)


const arcaIdentityRegistryContractConnect1 = new ethers.Contract(
  arcaIdentityRegistryAddress,
  arca_identity_registry_abi,
  wallet1
)

async function registerPatient() { }


async function getIdentityCount() {
  try {
    const response = await arcaIdentityRegistryContractConnect1.getIdentityCount()
    console.log("Identity count: ", response)
  } catch (error) {
    console.error("Error fetching identity count:", error)
  }
}


getIdentityCount()