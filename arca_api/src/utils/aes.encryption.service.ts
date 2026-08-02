import { Injectable, LoggerService, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import * as AesEncryption from 'aes-encryption'

const aes = new AesEncryption()

@Injectable()
export class AesEncryptionService {

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    private configService: ConfigService
  ){}

  async encrypt(plainData: string){
    try {
      const encryptionKey = this.configService.get<string>('ENCRYPTION_SECRET_KEY')
      aes.setSecretKey(encryptionKey)

      const cipherText = await aes.encrypt(plainData)
      return cipherText

    } catch (error) {
      this.logger.error(`Error encrypting plain data: ${error.message}`, error.stack)
    }
  }


  async decrypt(encryptedData: string){
    try {
      const encryptionKey = this.configService.get<string>('ENCRYPTION_SECRET_KEY')
      aes.setSecretKey(encryptionKey)

      const plainText = await aes.decrypt(encryptedData)
      return plainText
    } catch (error) {
      this.logger.error(`Error decrypting cipher text: ${error.message}`, error.stack)
    }
  }
}


