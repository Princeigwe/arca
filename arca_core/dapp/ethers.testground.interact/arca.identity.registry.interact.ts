import { ethers, getAddress } from "ethers";
import { arca_identity_registry_abi } from "../abis/arca.identity.register.abi";

const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const arcaIdentityRegistryAddress =
  "0x67d269191c92Caf3cD7723F116c85e6E9bf55933";
const hardhatPrivateKey1 =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const dummyEOAddressPrivateKey1 =
  process.env.WALLET_PRIVATE_KEY || hardhatPrivateKey1;
const wallet1 = new ethers.Wallet(dummyEOAddressPrivateKey1, provider);

const arcaIdentityRegistryContractConnect1 = new ethers.Contract(
  arcaIdentityRegistryAddress,
  arca_identity_registry_abi,
  wallet1
);

async function registerPatient(
  linkedAddresses?: string[],
  guardiansRequired?: number,
  guardians?: string[]
) {
  try {
    const currentDate = Date.now();

    // converting date string to bytes32
    const dateString = Number(
      new Date(currentDate).toISOString().replace(/\D/g, "").slice(0, 12)
    ).toString();
    const dateHex = ethers.toBeHex(BigInt(dateString));
    const dateBytes32 = ethers.zeroPadValue(dateHex, 32);

    // listening for event
    arcaIdentityRegistryContractConnect1.once(
      "PatientRegisteredEvent",
      (message, patientIdentity) => {
        console.log("EVENT:", message, patientIdentity);
      }
    );

    if (!linkedAddresses && !guardiansRequired && !guardians) {
      const tx = await arcaIdentityRegistryContractConnect1.registerPatient(
        dateBytes32
      );
      await tx.wait();
    }

    if (linkedAddresses && !guardiansRequired && !guardians) {
      // converting strings to Ethereum Owned Addresses
      linkedAddresses.forEach(async (linkedAddress) => {
        getAddress(linkedAddress);
      });

      const tx =
        await arcaIdentityRegistryContractConnect1.registerPatientWithLinkedAddresses(
          linkedAddresses,
          dateBytes32
        );
      await tx.wait();
    }

    if (linkedAddresses && guardiansRequired && guardians) {
      // converting strings to Ethereum Owned Addresses
      linkedAddresses.forEach(async (linkedAddress) => {
        getAddress(linkedAddress);
      });

      guardians.forEach(async (guardian) => {
        getAddress(guardian);
      });

      const tx =
        await arcaIdentityRegistryContractConnect1.registerPatientWithLinkedAddressAndGuardians(
          linkedAddresses,
          guardiansRequired,
          guardians,
          dateBytes32
        );
      await tx.wait();
    }
  } catch (error) {
    console.error("Error registering patient: ", error);
  }
}

async function getIdentityCount() {
  try {
    const response =
      await arcaIdentityRegistryContractConnect1.getIdentityCount();
    console.log("Identity count: ", response);
  } catch (error) {
    console.error("Error fetching identity count:", error);
  }
}

const linkedAddresses = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];

const guardians = [
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
];

// getIdentityCount()
// registerPatient()
// registerPatient(linkedAddresses);
registerPatient(linkedAddresses, 2, guardians);
