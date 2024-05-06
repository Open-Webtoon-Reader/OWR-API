import {ApiProperty} from "@nestjs/swagger";

export default class EpisodeLineModel{
    @ApiProperty()
        id: number;
    @ApiProperty()
        title: string;
    @ApiProperty()
        number: number;
    @ApiProperty()
        thumbnail: string;

    constructor(
        id: number,
        title: string,
        number: number,
        thumbnail: string,
    ){
        this.id = id;
        this.title = title;
        this.number = number;
        this.thumbnail = thumbnail;
    }
}
