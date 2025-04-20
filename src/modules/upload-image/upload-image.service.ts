import { Injectable } from '@nestjs/common';
import { UploadFileDto } from './dto/upload-file.dto';
import * as fs from 'fs'
import * as path from 'path'
import { RemoveFileDto } from './dto/remove-file.dto';

@Injectable()
export class UploadService {

  async uploadFile(payload:UploadFileDto){
    const extName = path.extname(payload.file.originalname)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const filename = payload.file.fieldname + '-' + uniqueSuffix + extName
    const uploadDir = path.join(__dirname,'../../../',payload.destination)
    const fullFilePath = path.join(uploadDir,filename)

    if(!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir,{recursive: true})
    }
    fs.writeFileSync(fullFilePath,payload.file.buffer)
    const imageUrl =  `${payload.destination}/${filename}`
    return {
      imageUrl,
      message: 'File written succesfully!'
    }
  }

  async removeFile(payload: RemoveFileDto){
    const filePath = path.join(__dirname,'../../../',payload.fileName)
    
    const isFileExists = fs.existsSync(filePath)
    if(isFileExists){
      fs.unlinkSync(filePath)
    }
    return {
      message: 'File removed successfully!'
    }
  }

  
}
