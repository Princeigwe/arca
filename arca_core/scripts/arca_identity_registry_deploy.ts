import { ethers } from "hardhat";
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account address: ", deployer.address)

  const ArcaIdentityRegistry = await ethers.getContractFactory("ArcaIdentityRegistry")
  const contract = await ArcaIdentityRegistry.deploy();
  
  console.log("ArcaIdentityRegistry address: ", await contract.getAddress())
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })