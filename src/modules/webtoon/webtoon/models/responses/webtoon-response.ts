import {ApiProperty} from "@nestjs/swagger";
import LightWebtoonResponse from "./light-webtoon-response";

export default class WebtoonResponse extends LightWebtoonResponse{
    @ApiProperty()
        backgroundBanner: string;
    @ApiProperty()
        topBanner: string;
    @ApiProperty()
        mobileBanner: string;

    constructor(
        id: number,
        title: string,
        language: string,
        author: string,
        genres: string[],
        thumbnail: string,
        backgroundBanner: string,
        topBanner: string,
        mobileBanner: string,
    ){
        super(id, title, language, author, genres, thumbnail);
        this.backgroundBanner = backgroundBanner;
        this.topBanner = topBanner;
        this.mobileBanner = mobileBanner;
    }
}
