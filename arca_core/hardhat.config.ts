import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  paths: {
    artifacts: "./artifacts"
  },
  solidity: "0.8.30",
};

export default config;
