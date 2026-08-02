import { Module } from '@nestjs/common';
import { RecoveryService } from './recovery.service';
import { RecoveryController } from './recovery.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecoveryShare } from './recovery.shamir.share.entity';
import { AesEncryptionService } from '../../utils/aes.encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecoveryShare])
  ],
  providers: [RecoveryService, AesEncryptionService],
  controllers: [RecoveryController],
  exports: [RecoveryService]
})
export class RecoveryModule {}
