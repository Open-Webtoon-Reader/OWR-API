import {ApiProperty} from "@nestjs/swagger";

export class VersionResponse{
    @ApiProperty()
    version: string;
}
