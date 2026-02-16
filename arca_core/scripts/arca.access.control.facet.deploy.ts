import "@nomiclabs/hardhat-ethers";

import hre from "hardhat";


async function hardhatDeployArcaAccessControlFacet() {
    const  ArcaAccessControl = await hre.ethers.getContractFactory('ArcaAccessControl')
    const arcaAccessControlCOntract = await ArcaAccessControl.deploy()

    console.log("ArcaAccessControl Facet address: ", await arcaAccessControlCOntract.getAddress())

}

hardhatDeployArcaAccessControlFacet()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })