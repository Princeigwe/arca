import "@nomiclabs/hardhat-ethers";

import hre, { ethers } from "hardhat";

async function hardhatDeployDiamond() {
  // deploying on hardhat

  const accounts = await hre.ethers.getSigners();
  const contractOwner = accounts[0];

  const arcaIdentityFacetCut = {
    facetAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    action: 0,
    functionSelectors: [
      "0x70480275",
      "0xd953689d",
      "0x652cec06",
      "0xcfd549f7",
      "0x8ebc10d9",
      "0x87c636c2",
      "0x90a29085",
      "0x1785f53c",
      "0x63fa311a"
    ],
  };

  const facetCutList = [arcaIdentityFacetCut];

  const diamondArgs = {
    owner: contractOwner.address,
  };

  const ArcaDiamond = await ethers.getContractFactory("ArcaDiamond");
  const diamondContract = await ArcaDiamond.deploy(facetCutList, diamondArgs);
  await diamondContract.waitForDeployment();
  console.log("ArcaDiamond address: ", await diamondContract.getAddress());
  console.log("ArcaDiamond owner: ", contractOwner.address);
}

hardhatDeployDiamond()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
