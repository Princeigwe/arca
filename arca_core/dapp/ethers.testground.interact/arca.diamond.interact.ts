import { ethers } from "ethers";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "../abis/arca.identity.facet.abi";

const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const hardhatPrivateKey2 =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const dummyEOAddressPrivateKey1 =
  process.env.WALLET_PRIVATE_KEY || hardhatPrivateKey2;
const wallet1 = new ethers.Wallet(dummyEOAddressPrivateKey1, provider);

const arcaDiamondContractConnect1 = new ethers.Contract(
  arcaDiamondAddress,
  combinedABIs,
  wallet1,
);

// diamond-to-owner connection
const ownerPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);
const arcaDiamondContractOwnerConnect = new ethers.Contract(
  arcaDiamondAddress,
  combinedABIs,
  ownerWallet,
);

const arcaIdentityRegistryAddress =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function getIdentityCount() {
  try {
    const txOption = {
      to: arcaDiamondAddress,
      data: ethers.id("getIdentityCount()").substring(0, 10),
    };
    const response = await wallet1.call(txOption); // fallback call for a view function with call()
    const result = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint256", "uint256"],
      response,
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
      },
    );

    // converting unix date to bytes32
    const unixTimestampInSeconds = Math.floor(Date.now() / 1000).toString(); //unix timestamp in seconds
    console.log("Unix Timestamp in second:", unixTimestampInSeconds);

    const unixTimestampSecondsBytes32 = ethers.encodeBytes32String(
      unixTimestampInSeconds,
    );

    const cid = "123456";
    const cidBytes32 = ethers.encodeBytes32String(cid);

    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("registerPatient", [
      unixTimestampSecondsBytes32,
      cidBytes32,
    ]);
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
    arcaDiamondContractConnect1.once("AdminAddedEvent", (message, admin) => {
      console.log(`Event received: ${message}`, admin);
    });
    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("addAdmin", [address]);
    const txOption = {
      to: arcaDiamondAddress,
      data: data,
    };
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
      data: data,
    };
    const response = await wallet1.call(txOption);

    // decoding ABI encoded returned data
    const [isAdmin] = iFace.decodeFunctionResult("checkIsAdmin", response);

    console.log("Is admin: ", isAdmin);
  } catch (error) {
    console.error("Error checking if admin: ", error);
  }
}

async function saveAdminInitializationMessageHash(
  randomMessage: string,
  wallet: ethers.Wallet,
  contractConnect: ethers.Contract,
) {
  try {
    contractConnect.once(
      "AdminInitializationMessageHashWrittenEvent",
      (message, writer, customMessageHash) => {
        const data = {
          message,
          writer,
          customMessageHash,
        };
        console.log(`Event data:`, data);
      },
    );

    const signature = await wallet.signMessage(randomMessage);
    const messageHash = ethers.hashMessage(randomMessage);
    console.log("Message hash:", messageHash);

    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const messageHashData = iFace.encodeFunctionData(
      "saveAdminInitializationMessageHash",
      [messageHash, signature],
    );

    const txOption = {
      to: arcaDiamondAddress,
      data: messageHashData,
    };
    await wallet.sendTransaction(txOption);
    console.log("Transaction successful");
  } catch (error) {
    console.error("Error saving admin initialization hash:", error);
  }
}

async function testRetrievePublicKey(messageHash: string, signature: string) {
  const recoveredPublicKey = ethers.SigningKey.recoverPublicKey(
    messageHash,
    signature,
  );
  const recoveredAddress = ethers.recoverAddress(messageHash, signature);
  console.log("retrieved data:", { recoveredPublicKey, recoveredAddress });
}

async function verifyPatientIdentity(address: string) {
  try {
    arcaDiamondContractConnect1.once(
      "PatientIdentityVerifiedEvent",
      (message, patient) => {
        console.log(`Event received: ${message}`, patient);
      },
    );
    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("verifyPatientIdentity", [address]);
    const txOption = {
      to: arcaDiamondAddress,
      data: data,
    };
    await ownerWallet.sendTransaction(txOption);
  } catch (error) {
    console.error("Error verifying patient identity: ", error);
  }
}

async function getPatientIdentity(address: string) {
  try {
    arcaDiamondContractConnect1.once(
      "PatientIdentityFetchedEvent",
      (message, patient) => {
        console.log(`Event received: ${message}`, patient);
      },
    );
    const iFace = new ethers.Interface(arca_identity_facet_abi);
    const data = iFace.encodeFunctionData("getPatientIdentity", [address]);
    const txOption = {
      to: arcaDiamondAddress,
      data: data,
    };
    await wallet1.sendTransaction(txOption);
  } catch (error) {
    console.log("Error fetching patient identity: ", error);
  }
}

async function removeFacet(facetAddress: string, functionSelectors: string[]) {
  try {
    const facetCut = [
      {
        facetAddress: facetAddress,
        action: 2,
        functionSelectors: functionSelectors,
      },
    ];
    const response = await arcaDiamondContractOwnerConnect.diamondCut(facetCut);
    await response.wait();
  } catch (error) {
    console.error("Error removing facet: ", error);
  }
}

async function addFacet(facetAddress: string, functionSelectors: string[]) {
  try {
    const facetCut = [
      {
        facetAddress: facetAddress,
        action: 0,
        functionSelectors: functionSelectors,
      },
    ];
    const response = await arcaDiamondContractOwnerConnect.diamondCut(facetCut);
    await response.wait();
  } catch (error) {
    console.error("Error adding facet: ", error);
  }
}

const newOwner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const newAdmin = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// getIdentityCount();
// getContractOwner()
// registerPatient()

// transferOwnership(newOwner)

getDiamondFacets()

// addAdmin(newAdmin)
// checkIsAdmin("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

const randomMessage = "Hello world";
// saveAdminInitializationMessageHash(randomMessage, ownerWallet, arcaDiamondContractOwnerConnect)

const messageHash =
  "0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede";
const signature =
  "0x15a3fe3974ebe469b00e67ad67bb3860ad3fc3d739287cdbc4ba558ce7130bee205e5e38d6ef156f1ff6a4df17bfa72a1e61c429f92613f3efbc58394d00c9891b";
// testRetrievePublicKey(messageHash, signature);

// verifyPatientIdentity("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
// getPatientIdentity("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")

// facet address to remove must be the zero address
const facetToRemove = ethers.ZeroAddress;
const functionSelectorsToRemove = [
  '0x70480275',
  '0xd953689d',
  '0x7c6dcd2e',
  '0x652cec06',
  '0xcfd549f7',
  '0x68761954',
  '0x059611c4',
  '0x36135b30',
  '0x1785f53c',
  '0x5adc56ec',
  '0x63fa311a'
];
// removeFacet(facetToRemove, functionSelectorsToRemove)

// facet address to add
const facetToAdd = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
const functionSelectorsToAdd =  [
  '0x70480275',
  '0xd953689d',
  '0x7c6dcd2e',
  '0x652cec06',
  '0xcfd549f7',
  '0x841673ec',
  '0xeee394b8',
  '0x3ea93bf9',
  '0x1785f53c',
  '0x5adc56ec',
  '0x63fa311a'
];
// addFacet(facetToAdd, functionSelectorsToAdd)
