import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsNotEmpty} from "class-validator";

export class EpisodeIdDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
        episodeId: number;
}
