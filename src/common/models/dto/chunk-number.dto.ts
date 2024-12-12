import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsOptional} from "class-validator";

export class ChunkNumberDto{
    @ApiProperty({required: false})
    @IsOptional()
    @IsInt()
    chunk: number;
}
