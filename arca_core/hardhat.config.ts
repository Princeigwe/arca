import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  paths: {
    artifacts: "./artifacts",
  },
  // solidity: "0.8.30",
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      blockGasLimit: 30_000_000,
      gas: "auto"
    },
  },
};

export default config;

