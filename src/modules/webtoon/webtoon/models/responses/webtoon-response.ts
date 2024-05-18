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
        thumbnail: string,
        author: string,
        backgroundBanner: string,
        topBanner: string,
        mobileBanner: string,
    ){
        super(id, title, language, thumbnail, author);
        this.backgroundBanner = backgroundBanner;
        this.topBanner = topBanner;
        this.mobileBanner = mobileBanner;
    }
}
