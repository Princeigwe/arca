import { ethers } from "ethers";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/aarca.identity.facet.abi";


const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi]

const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const hardhatPrivateKey1 =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const dummyEOAddressPrivateKey1 = process.env.WALLET_PRIVATE_KEY || hardhatPrivateKey1;
const wallet1 = new ethers.Wallet(dummyEOAddressPrivateKey1, provider);

const arcaDiamondContractConnect1 = new ethers.Contract(
  arcaDiamondAddress,
  combinedABIs,
  wallet1
);

const ownerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider)
const arcaDiamondContractOwnerConnect = new ethers.Contract(
  arcaDiamondAddress,
  arca_identity_facet_abi,
  ownerWallet
)


const arcaIdentityRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

const arcaIdentityFacetContractConnect1 = new ethers.Contract(
  arcaIdentityRegistryAddress,
  arca_identity_facet_abi,
  wallet1
);

async function getIdentityCount() {
  try {
    const txOption = {
      to: arcaDiamondAddress,
      data: ethers.id('getIdentityCount()').substring(0, 10)
    };
    const response = await wallet1.call(txOption);
    const result = ethers.AbiCoder.defaultAbiCoder().decode(['uint256', 'uint256'], response);
    console.log(result)

  } catch (error) {
    console.error("Error fetching identity count:", error);
  }
}


async function getContractOwner() {
  try {
    const response = await arcaDiamondContractConnect1.getCurrentOwner()
    console.log("Contract owner: ", response)
  } catch (error) {
    console.error("Error fetching Arca Diamond owner: ", error)
  }
}


async function transferOwnership(address: string) {
  try {
    await arcaDiamondContractOwnerConnect.transferOwnership(address)
  } catch (error) {
    console.log("Error transferring ownership:", error)
  }
}


async function getDiamondFacets(){
  try {
    const response = await arcaDiamondContractOwnerConnect.facets()
    console.log("Facets: ", response)
  } catch (error) {
    console.log("Error fetching diamond facets: ", error)
  }
}

const newOwner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

getIdentityCount();
// getContractOwner()

// transferOwnership(newOwner)

// getDiamondFacets()
