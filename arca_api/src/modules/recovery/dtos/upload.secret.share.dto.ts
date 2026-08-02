import {IsString, IsNotEmpty} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'


export class UploadRecoveryShareDto{
  @ApiProperty({description: "The wallet address that owns the secret share", example: "0x1234567890123456789012345678901234567890"})
  @IsNotEmpty()
  @IsString()
  walletAddress: string

  @ApiProperty({description: "The secret share to be uploaded", example: "924348f575a636cc094684c0d14922cee"})
  @IsNotEmpty()
  @IsString()
  secretShare: string
}