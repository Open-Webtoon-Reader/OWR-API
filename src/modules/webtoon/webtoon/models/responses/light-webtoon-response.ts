import {ApiProperty} from "@nestjs/swagger";

export default class LightWebtoonResponse{
    @ApiProperty()
        id: number;
    @ApiProperty()
        title: string;
    @ApiProperty()
        language: string;
    @ApiProperty()
        author: string;
    @ApiProperty()
        thumbnail: string; // As dataurl

    constructor(
        id: number,
        title: string,
        language: string,
        thumbnail: string,
        author: string,
    ){
        this.id = id;
        this.title = title;
        this.language = language;
        this.thumbnail = thumbnail;
        this.author = author;
    }
}
