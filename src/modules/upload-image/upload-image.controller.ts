import {
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload-image.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { RemoveFileDto } from './dto/remove-file.dto';

@ApiTags('Upload')
@Controller({ version: "1", path: "uploads" })
export class UploadController {

  constructor(private service: UploadService) { }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi file yaratish' })
  @ApiConsumes("multipart/form-data")
  @Post('/add')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Body() payload: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.service.uploadFile({ ...payload, file });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'mavjud faylni o\'chirish' })
  @Delete('/remove')
  async removeFile(
    @Body() payload: RemoveFileDto,
  ) {
    return this.service.removeFile(payload);
  }
}
