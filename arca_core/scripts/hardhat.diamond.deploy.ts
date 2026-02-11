import "@nomiclabs/hardhat-ethers";

import hre, { ethers } from "hardhat";

async function hardhatDeployDiamond() {
  // deploying on hardhat

  const accounts = await hre.ethers.getSigners();
  const contractOwner = accounts[0];

  const arcaIdentityFacetCut = {
    facetAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    action: 0,
    functionSelectors: [
      '0x70480275', 
      '0x8bf6cdd9',
      '0xd953689d', 
      '0xf37aa5d0',
      '0x7c6dcd2e', 
      '0x3a60c386',
      '0x652cec06', 
      '0x8ddc4e68',
      '0xcfd549f7', 
      '0x0892beb7',
      '0x1b3780d1', 
      '0x6d8dbf9a',
      '0x1785f53c', 
      '0x5adc56ec',
      '0xd4c9de30', 
      '0xe47584b1',
      '0x63fa311a'
    ]
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
