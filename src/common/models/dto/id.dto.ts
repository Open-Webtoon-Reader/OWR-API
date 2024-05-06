import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsNotEmpty} from "class-validator";

export class IdDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
        id: number;
}
