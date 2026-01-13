import { ethers } from "ethers";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/aarca.identity.facet.abi";


const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const arcaDiamondAddress = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

const hardhatPrivateKey1 =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const dummyEOAddressPrivateKey1 = process.env.WALLET_PRIVATE_KEY || hardhatPrivateKey1;
const wallet1 = new ethers.Wallet(dummyEOAddressPrivateKey1, provider);

const arcaDiamondContractConnect1 = new ethers.Contract(
  arcaDiamondAddress,
  arca_diamond_abi,
  wallet1
);

const ownerPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider)
const arcaDiamondContractOwnerConnect = new ethers.Contract(
  arcaDiamondAddress,
  arca_diamond_abi,
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
    // arcaDiamondContractConnect1.once(
    //   "PatientRegisteredEvent",
    //   (message, patientIdentity) => {
    //     console.log("EVENT:", message, patientIdentity);
    //   }
    // );
    const txOption = {
      to: arcaDiamondAddress,
      data: "0x652cec06",
    };
    const response = await wallet1.sendTransaction(txOption);
    console.log("Transaction sent: ", response.hash);

    const receipt = await response.wait();
    console.log("Transaction receipts: Identity count: ", receipt);
    const events = receipt?.logs
    console.log("Events: ", events)
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
    // arcaDiamondContractConnect1.once(
    //   "OwnershipTransferredEvent",
    //   (previousOwner, newOwner) => {
    //     console.log(`Successful transfer. Previous owner: ${previousOwner} to ${newOwner}`)
    //   }
    // )
    await arcaDiamondContractOwnerConnect.transferOwnership(address)
  } catch (error) {
    console.log("Error transferring ownership:", error)
  }
}

const newOwner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

// getIdentityCount();
getContractOwner()

// transferOwnership(newOwner)
