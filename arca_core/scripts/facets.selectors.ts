import { ethers } from "ethers";
import { arca_identity_facet_abi } from "../dapp/abis/arca.identity.facet.abi";
import { arca_access_control_facet_abi } from "../dapp/abis/arca.access.control.facet.abi";

const dotenv = require("dotenv");
dotenv.config();

const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
const provider = new ethers.JsonRpcProvider(providerUrl);


function getArcaAccessControlFacetDetails() {
  const arcaAccessControlFacetAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const arcaAccessControlFacetInterface = new ethers.Interface(arca_access_control_facet_abi);

  const selectors: { [key: string]: string } = {};
  const selectorsBytes: string[] = [];
  
  arcaAccessControlFacetInterface.fragments.forEach((fragment) => {
    if (ethers.FunctionFragment.isFunction(fragment)) {
      selectors[fragment.name] = fragment.selector;
      selectorsBytes.push(fragment.selector);
    }
  });
  
  console.log(" ")
  console.log("Arca Access Control Facet Details ");
  console.log("Arca Access Control Facet Address: ", arcaAccessControlFacetAddress);
  console.log("Function Names to Selectors: ", selectors);
  console.log("Function Selectors: ", selectorsBytes);
}

function getArcaIdentityFacetDetails() {
  const arcaIdentityFacetAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const arcaIdentityFacetInterface = new ethers.Interface(arca_identity_facet_abi);

  const selectors: { [key: string]: string } = {};
  const selectorsBytes: string[] = [];
  
  arcaIdentityFacetInterface.fragments.forEach((fragment) => {
    if (ethers.FunctionFragment.isFunction(fragment)) {
      selectors[fragment.name] = fragment.selector;
      selectorsBytes.push(fragment.selector);
    }
  });
  
  console.log(" ")
  console.log("Arca Identity Facet Details ");
  console.log("Arca Identity Facet Address: ", arcaIdentityFacetAddress);
  console.log("Function Names to Selectors: ", selectors);
  console.log("Function Selectors: ", selectorsBytes);
}


getArcaAccessControlFacetDetails();
getArcaIdentityFacetDetails();