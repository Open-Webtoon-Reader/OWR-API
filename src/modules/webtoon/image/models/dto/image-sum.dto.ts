import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty, IsString} from "class-validator";

export class ImageSumDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
        sum: string;
}
