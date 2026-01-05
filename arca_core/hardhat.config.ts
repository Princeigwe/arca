import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  paths: {
    artifacts: "./artifacts",
  },
  solidity: "0.8.30",
  networks: {
    hardhat: {
      blockGasLimit: 30_000_000,
      gas: "auto",
    },
  },
};

export default config;

