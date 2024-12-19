import {IsInt, IsNotEmpty} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class WebtoonIdDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
    webtoonId: number;
}
