import {ApiProperty} from "@nestjs/swagger";

export class AddWebtoonToQueueDto{
    @ApiProperty()
    name: string;

    @ApiProperty()
    language: string;
}
