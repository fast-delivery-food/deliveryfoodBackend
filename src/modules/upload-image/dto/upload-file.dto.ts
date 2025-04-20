import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UploadFileDto {
    @ApiProperty({
        type:String,
        required: true
    })
    @IsString()
    @IsNotEmpty()
    destination: string


    @ApiProperty({
        type: String,
        format:'binary',
        required: true
    })
    file: any;

}
