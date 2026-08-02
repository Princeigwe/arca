import { ethers } from "ethers"
import { Injectable, Inject, LoggerService, InternalServerErrorException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { arca_diamond_abi } from "./abis/arca.diamond.abi";
import { arca_identity_facet_abi } from "./abis/arca.identity.abi";
import axios from 'axios'
import { ConfigService } from "@nestjs/config";

const combinedABIs = [...arca_diamond_abi, ...arca_identity_facet_abi];

@Injectable()
export class OnchainService {
  

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    private configService: ConfigService
  ) {}


  /**
   * this function gets the onchain parameters needed to interact with the smart contract from the API
   * @returns 
   */
  async onchainParams(){

    const env = this.configService.get<string>('NODE_ENV')
    const providerUrl = env === 'production'
      ? this.configService.get<string>('LINEA_MAINNET_RPC')
      : env === 'staging'
      ? this.configService.get<string>('LINEA_SEPOLIA_RPC')
      : this.configService.get<string>('HARDHAT_RPC')
    
    const diamondAddress = env == 'production'
      ? this.configService.get<string>('LINEA_MAINNET_DIAMOND_ADDRESS')
      : env == 'staging'
      ? this.configService.get<string>('LINEA_SEPOLIA_DIAMOND_ADDRESS')
      : this.configService.get<string>('LOCAL_DIAMOND_ADDRESS');

    // console.log('diamondAddress', diamondAddress)
    // console.log('provider url:', providerUrl)
    return {
      providerUrl,
      diamondAddress
    }
  }

  async isRegisteredPatient(walletAddress: string) {
    try {
      const {providerUrl, diamondAddress} = await this.onchainParams()

      const provider = new ethers.JsonRpcProvider(providerUrl)
      const diamondContract = new ethers.Contract(diamondAddress, combinedABIs, provider)

      const isRegisteredPatient = await diamondContract.isRegisteredPatient(walletAddress)
      return isRegisteredPatient

    } catch (error) {
      this.logger.error(`Error checking if wallet ${walletAddress} is registered as a patient on Arca: ${error.message}`, error.stack, OnchainService.name)
      throw new InternalServerErrorException('Error checking if wallet is registered on Arca')
    }
  }


  async isRegisteredMedicalGuardian(walletAddress: string){
    try {
      const {providerUrl, diamondAddress} = await this.onchainParams();

      const provider = new ethers.JsonRpcProvider(providerUrl)
      const diamondContract = new ethers.Contract(diamondAddress, combinedABIs, provider)

      const isRegisteredMedicalGuardian = await diamondContract.isRegisteredMedicalGuardian(walletAddress)
      return isRegisteredMedicalGuardian

    } catch (error) {
      this.logger.error(`Error checking if wallet ${walletAddress} is registered as a medical guardian on Arca: ${error.message}`, error.stack, OnchainService.name)
      throw new InternalServerErrorException('Error checking if wallet is registered on Arca')
    }
  }


  /**
   * this function checks if the provided wallet address is registered on the Arca smart contract
   * @param walletAddress - the wallet address to be checked 
   * @returns boolean
   */
  async isWalletAddressRegistered(walletAddress: string){
    try {
      const [existsAsPatient, existsAsMedicalGuardian] = await Promise.all([
        this.isRegisteredPatient(walletAddress),
        this.isRegisteredMedicalGuardian(walletAddress)
      ])

      if(existsAsPatient || existsAsMedicalGuardian){
        return true
      }
      return false
    } catch (error) {
      this.logger.error(`Error checking wallet address exists on Arca: ${error.message}`, error.stack, OnchainService.name)
      throw new InternalServerErrorException('Error checking if wallet address exists on Arca')
    }
  }
}
