import { Module } from '@nestjs/common';
import { UploadController } from './upload-image.controller';
import { UploadService } from './upload-image.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports:[UploadService]
})
export class UploadImageModule {}
