import {ApiProperty} from "@nestjs/swagger";

export default class EpisodeResponse{
    @ApiProperty()
        title: string;
    @ApiProperty()
        images: string[];

    constructor(
        title: string,
        images: string[]
    ){
        this.title = title;
        this.images = images;
    }
}
