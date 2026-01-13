import { ethers } from "ethers";
import { arca_diamond_abi } from "../abis/arca.diamond.abi";

const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const arcaDiamondAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const hardhatPrivateKey1 =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const dummyEOAddressPrivateKey1 =
  process.env.WALLET_PRIVATE_KEY || hardhatPrivateKey1;
const wallet1 = new ethers.Wallet(dummyEOAddressPrivateKey1, provider);

const arcaDiamondContractConnect1 = new ethers.Contract(
  arcaDiamondAddress,
  arca_diamond_abi,
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
  } catch (error) {
    console.error("Error fetching identity count:", error);
  }
}

getIdentityCount();
