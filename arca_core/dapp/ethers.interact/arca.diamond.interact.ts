import { ethers } from "ethers";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/aarca.identity.facet.abi";

const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

const arcaDiamondAddress = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";


const hardhatPrivateKey2 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";


const dummyEOAddressPrivateKey1 = process.env.WALLET_PRIVATE_KEY || hardhatPrivateKey2;
const wallet1 = new ethers.Wallet(dummyEOAddressPrivateKey1, provider);

const arcaDiamondContractConnect1 = new ethers.Contract(
  arcaDiamondAddress,
  combinedABIs,
  wallet1
);

// diamond-to-owner connection
const ownerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);
const arcaDiamondContractOwnerConnect = new ethers.Contract(
  arcaDiamondAddress,
  combinedABIs,
  ownerWallet
);

const arcaIdentityRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function getIdentityCount() {
  try {
    const txOption = {
      to: arcaDiamondAddress,
      data: ethers.id("getIdentityCount()").substring(0, 10),
    };
    const response = await wallet1.call(txOption); // fallback call for a view function with call()
    const result = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint256", "uint256"],
      response
    );
    console.log(result);
  } catch (error) {
    console.error("Error fetching identity count:", error);
  }
}

async function registerPatient() {
  try {
    arcaDiamondContractConnect1.once(
      "PatientRegisteredEvent",
      (message, patient) => {
        console.log(`Event received: ${message}`, patient);
      }
    );
    const currentDate = Date.now();

    // converting date string to bytes32
    const dateString = Number(
      new Date(currentDate).toISOString().replace(/\D/g, "").slice(0, 12)
    ).toString();
    console.log("Date string:", dateString);
    const dateHex = ethers.toBeHex(BigInt(dateString));
    const dateBytes32 = ethers.zeroPadValue(dateHex, 32);

    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("registerPatient", [dateBytes32]);
    const txOption = {
      to: arcaDiamondAddress,
      data: data,
    };
    const response = await wallet1.sendTransaction(txOption);
    await response.wait();
  } catch (error) {
    console.error("Error registering patient: ", error);
  }
}

async function getContractOwner() {
  try {
    const response = await arcaDiamondContractConnect1.getCurrentOwner();
    console.log("Contract owner: ", response);
  } catch (error) {
    console.error("Error fetching Arca Diamond owner: ", error);
  }
}

async function transferOwnership(address: string) {
  try {
    await arcaDiamondContractOwnerConnect.transferOwnership(address);
  } catch (error) {
    console.log("Error transferring ownership:", error);
  }
}

async function getDiamondFacets() {
  try {
    const response = await arcaDiamondContractOwnerConnect.facets();
    console.log("Facets: ", response);
  } catch (error) {
    console.log("Error fetching diamond facets: ", error);
  }
}

async function addAdmin(address: string) {
  try {
    arcaDiamondContractConnect1.once("AdminAddedEvent",
      (message, admin) => {
        console.log(`Event received: ${message}`, admin);
      })
    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("addAdmin", [address]);
    const txOption = {
      to: arcaDiamondAddress,
      data: data
    }
    const response = await ownerWallet.sendTransaction(txOption);
    await response.wait();
  } catch (error) {
    console.log("Error adding admin: ", error);
  }
}


async function checkIsAdmin(address: string) {
  try {
    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("checkIsAdmin", [address]);
    const txOption = {
      to: arcaDiamondAddress,
      data: data
    }
    const response = await wallet1.call(txOption);

    // decoding ABI encoded returned data
    const [isAdmin] = iFace.decodeFunctionResult(
      "checkIsAdmin",
      response
    );

    console.log("Is admin: ", isAdmin)
  } catch (error) {
    console.error("Error checking if admin: ", error)
  }
}


async function verifyPatientIdentity(address: string) {
  try {
    arcaDiamondContractConnect1.once("PatientIdentityVerifiedEvent", (message, patient) => {
      console.log(`Event received: ${message}`, patient);
    })
    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("verifyPatientIdentity", [address]);
    const txOption = {
      to: arcaDiamondAddress,
      data: data
    }
    await ownerWallet.sendTransaction(txOption);
  } catch (error) {
    console.error("Error verifying patient identity: ", error)
  }
}

async function getPatientIdentity(address: string) {
  try {
    arcaDiamondContractConnect1.once("PatientIdentityFetchedEvent", (message, patient) => {
      console.log(`Event received: ${message}`, patient);
    })
    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("getPatientIdentity", [address])
    const txOption = {
      to: arcaDiamondAddress,
      data: data
    }
    await wallet1.sendTransaction(txOption)
  } catch (error) {
    console.log("Error fetching patient identity: ", error)
  }
}


async function removeFacet(facetAddress: string, functionSelectors: string[]) {
  try {
    const facetCut = [
      {
        facetAddress: facetAddress,
        action: 2,
        functionSelectors: functionSelectors
      }
    ]
    const response = await arcaDiamondContractOwnerConnect.diamondCut(facetCut);
    await response.wait();
  } catch (error) {
    console.error("Error removing facet: ", error)
  }
}


async function addFacet(facetAddress: string, functionSelectors: string[]) {
  try {
    const facetCut = [
      {
        facetAddress: facetAddress,
        action: 0,
        functionSelectors: functionSelectors
      }
    ]
    const response = await arcaDiamondContractOwnerConnect.diamondCut(facetCut);
    await response.wait();
  } catch (error) {
    console.error("Error adding facet: ", error)
  }
}

const newOwner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const newAdmin = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

// getIdentityCount();
// getContractOwner()
// registerPatient()

// transferOwnership(newOwner)

getDiamondFacets()

// addAdmin(newAdmin)
// checkIsAdmin("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

// verifyPatientIdentity("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
// getPatientIdentity("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")

// facet address to remove must be the zero address
const facetToRemove = ethers.ZeroAddress
const functionSelectorsToRemove = [
      '0x70480275',
      '0xd953689d',
      '0x652cec06',
      '0xcfd549f7',
      '0x8ebc10d9',
      '0x87c636c2',
      '0x90a29085',
      '0x1785f53c',
      '0x63fa311a'
    ]
// removeFacet(facetToRemove, functionSelectorsToRemove)

// facet address to add
const facetToAdd = "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE"
const functionSelectorsToAdd = [
'0x70480275',
'0xd953689d',
'0x652cec06',
'0xcfd549f7',
'0x8ebc10d9',
'0x87c636c2',
'0x90a29085',
'0x1785f53c',
'0x63fa311a'
]
// addFacet(facetToAdd, functionSelectorsToAdd)