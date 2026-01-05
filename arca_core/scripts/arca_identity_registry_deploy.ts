import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
// import '@nomicfoundation/hardhat-ethers'

// import { ethers } from 'hardhat';
import hre from 'hardhat';


async function main() {

  const ArcaIdentityRegistry = await hre.ethers.getContractFactory("ArcaIdentityRegistry")
  const contract = await ArcaIdentityRegistry.deploy();
  
  console.log("ArcaIdentityRegistry address: ", await contract.getAddress())
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })