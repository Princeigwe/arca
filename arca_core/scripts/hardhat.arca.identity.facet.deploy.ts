import "@nomiclabs/hardhat-ethers";

import hre from "hardhat";

async function hardhatDeployArcaIdentityFacet() {
  // deploying on hardhat

  const accounts = await hre.ethers.getSigners();
  const contractOwner = accounts[0];

  const ArcaIdentityRegistry = await hre.ethers.getContractFactory('ArcaIdentityRegistry')
  const diamondContract = await ArcaIdentityRegistry.deploy()

  console.log("ArcaIdentityRegistry Facet address: ", await diamondContract.getAddress())

}


hardhatDeployArcaIdentityFacet()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
