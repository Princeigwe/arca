import { Inject, Injectable, LoggerService, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ethers } from "ethers"
import { OnchainService } from '../onchain/onchain.service';


@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    private readonly jwtService: JwtService,
    private readonly onchainService: OnchainService
  ) {}

    async generateWalletAccessToken(walletAddress: string){
    try {
      const payload = {
        walletAddress: walletAddress,
        iss: 'arca-auth-service',
        aud: 'arca-api',
        iat: Math.floor(Date.now() / 1000),
        // exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      }
      const token = this.jwtService.sign(payload)
      return token
    } catch (error) {
      this.logger.error(`Error generating wallet access token: ${error.message}`, error.stack, AuthService.name);
      throw new InternalServerErrorException("Error generating wallet access token");
    }
  }



  /**
   * this function verifies the signature of a smart contract user, which returns an access token, used to interact with their off-chain data on the REST API
   * @param walletAddress - the wallet address of the current user
   * @param message - the message that was signed by the user
   * @param signature - the signature to verify wallet is owned by the legit user
   * @returns - an access token
   */
  async verifySignature(walletAddress: string, message: string, signature: string){
    try {
      const isWalletAddressRegistered = await this.onchainService.isWalletAddressRegistered(walletAddress)
      if(!isWalletAddressRegistered){
        throw new HttpException('Wallet address is not registered on Arca', HttpStatus.BAD_REQUEST)
      }

      const recoveredWalletAddress = ethers.verifyMessage(message, signature)
      if(recoveredWalletAddress == walletAddress){
        const accessToken = await this.generateWalletAccessToken(walletAddress)
        return {
          accessToken: accessToken,
          walletAddress: walletAddress,
        }
      }
      throw new HttpException("Invalid signature", HttpStatus.BAD_REQUEST)
    } catch (error) {
      this.logger.error(`Error verifying signature: ${error.message}`, error.stack, AuthService.name)
      if(error instanceof HttpException){
        throw error
      }
      throw new InternalServerErrorException("Error verifying signature")
    }
  }

}
