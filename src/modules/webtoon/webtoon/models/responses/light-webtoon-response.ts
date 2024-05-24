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
        genres: string[];
    @ApiProperty()
        thumbnail: string; // As dataurl

    constructor(
        id: number,
        title: string,
        language: string,
        author: string,
        genres: string[],
        thumbnail: string,
    ){
        this.id = id;
        this.title = title;
        this.language = language;
        this.author = author;
        this.genres = genres;
        this.thumbnail = thumbnail;
    }
}
