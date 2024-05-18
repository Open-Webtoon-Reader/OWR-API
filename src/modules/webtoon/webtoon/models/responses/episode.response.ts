import {ApiProperty} from "@nestjs/swagger";

export default class EpisodeResponse{
    @ApiProperty()
        title: string;

    constructor(
        title: string,
    ){
        this.title = title;
    }
}
