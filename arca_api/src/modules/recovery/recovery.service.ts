import { Injectable, HttpException, HttpStatus, LoggerService, InternalServerErrorException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RecoveryShare } from './recovery.shamir.share.entity';
import { AesEncryptionService } from '../../utils/aes.encryption.service';
import { UploadRecoveryShareDto } from './dtos/upload.secret.share.dto';
import * as crypto from 'crypto'
import { ethers } from "ethers"

@Injectable()
export class RecoveryService {

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    @InjectRepository(RecoveryShare) private recoveryShareRepo: Repository<RecoveryShare>,
    private readonly aesEncryptionService: AesEncryptionService
  ) {}


  async uploadSecretShare(data: UploadRecoveryShareDto){
    try {
      const walletAddressHash = crypto.createHash('sha256').update(data.walletAddress).digest('hex')
      const existingShare = await this.recoveryShareRepo.findOne({
        where: {
          walletAddressHash: walletAddressHash
        }
      })

      if(existingShare){
        throw new HttpException("Secret share already exists for this wallet address", HttpStatus.BAD_REQUEST)
      }

      const encryptedShare = await this.aesEncryptionService.encrypt(data.secretShare)

      const recoveryShare = this.recoveryShareRepo.create({
        walletAddressHash: walletAddressHash,
        encryptedShare: encryptedShare
      })

      await this.recoveryShareRepo.save(recoveryShare)

      return {
        message: "Secret share uploaded successfully"
      }
    } catch (error) {
      this.logger.error(`Error uploading secret share: ${error.message}`, error.stack, RecoveryService.name)
      if(error instanceof HttpException){
        throw error
      }
      throw new InternalServerErrorException("Error uploading secret share")
    }
  }
}
