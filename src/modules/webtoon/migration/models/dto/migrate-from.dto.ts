import {ApiProperty} from "@nestjs/swagger";

export default class MigrateFromDto{
    @ApiProperty()
    url: string;

    @ApiProperty()
    adminKey: string;
}
