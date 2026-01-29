import { ethers } from "ethers";
import { arca_identity_facet_abi } from "../abis/aarca.identity.facet.abi";

const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);

const arcaIdentityFacetAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const hardhatPrivateKey1 = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const dummyEOAddressPrivateKey1 =
  process.env.WALLET_PRIVATE_KEY || hardhatPrivateKey1;
const wallet1 = new ethers.Wallet(dummyEOAddressPrivateKey1, provider);

// GETTING FUNCTION SELECTORS OF THE ARCA IDENTITY REGISTRY FACET

const iFace = new ethers.Interface(arca_identity_facet_abi);
const selectors: { [key: string]: string } = {};
const selectorsBytes: string[] = []

iFace.fragments.forEach((fragment) => {
  if (ethers.FunctionFragment.isFunction(fragment)) {
    selectors[fragment.name] = fragment.selector;
    selectorsBytes.push(fragment.selector);
  }
});


console.log( "Function Names to Selectors: ", selectors);
console.log("Function Selectors: ", selectorsBytes)
