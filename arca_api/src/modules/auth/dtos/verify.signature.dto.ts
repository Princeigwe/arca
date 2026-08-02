import {IsString, IsNotEmpty} from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class VerifySignatureDto{  
  @ApiProperty({description: "The supposed wallet address that signed the message", example: "0x1234567890123456789012345678901234567890"})
  @IsNotEmpty()
  @IsString()
  walletAddress: string

  @ApiProperty({description: "The message that was signed", example: "The is the message, I am a user"})
  @IsNotEmpty()
  @IsString()
  message: string

  @ApiProperty({description: "The signature of the wallet address", example: "0x1234567890123456789012345678901234567890"})
  @IsNotEmpty()
  @IsString()
  signature: string
}
