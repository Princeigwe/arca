import { Controller, UseGuards, Body, Post} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UploadRecoveryShareDto } from './dtos/upload.secret.share.dto';
import { RecoveryService } from './recovery.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags("Shamir's Secret Recovery")
@ApiBearerAuth()
@Controller('recovery')
export class RecoveryController {
  constructor(
    private readonly recoveryService: RecoveryService
  ) {}

  @ApiOperation({summary: "Upload a secret share to be retrieved later for wallet recovery"})
  @UseGuards(JwtAuthGuard)
  @Post("upload-secret-share")
  uploadRecoveryShare(@Body() data: UploadRecoveryShareDto) {
    return this.recoveryService.uploadSecretShare(data)
  }
}
