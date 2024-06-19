import {ApiProperty} from "@nestjs/swagger";

export default class EpisodeResponse{
    @ApiProperty()
        title: string;
    @ApiProperty()
        previousEpisodeId?: number;
    @ApiProperty()
        nextEpisodeId?: number;

    constructor(
        title: string,
        previousEpisodeId?: number,
        nextEpisodeId?: number
    ){
        this.title = title;
        this.previousEpisodeId = previousEpisodeId;
        this.nextEpisodeId = nextEpisodeId;
    }
}
