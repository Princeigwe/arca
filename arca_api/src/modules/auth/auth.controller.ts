import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifySignatureDto } from './dtos/verify.signature.dto';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @ApiOperation({summary: "Verifies a signature to return an access token of API operations"})
  @ApiBody({type: VerifySignatureDto})
  @Post('signature-verification')
  async verifySignature(
    @Body() body: VerifySignatureDto
  ){
    return await this.authService.verifySignature(
      body.walletAddress,
      body.message,
      body.signature
    )
  }
}
