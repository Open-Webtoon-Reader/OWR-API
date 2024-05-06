import EpisodeLineModel from "../models/episode-line.model";
import {ApiProperty} from "@nestjs/swagger";

export default class EpisodesResponse{
    @ApiProperty()
        episodes: EpisodeLineModel[];
    @ApiProperty()
        backgroundBanner: string;
    @ApiProperty()
        topBanner: string;
    @ApiProperty()
        mobileBanner: string;
    @ApiProperty()
        title: string;
    @ApiProperty()
        author: string;

    constructor(
        episodes: EpisodeLineModel[],
        backgroundBanner: string,
        topBanner: string,
        mobileBanner: string,
        title: string,
        author: string
    ){
        this.episodes = episodes;
        this.backgroundBanner = backgroundBanner;
        this.topBanner = topBanner;
        this.mobileBanner = mobileBanner;
        this.title = title;
        this.author = author;
    }

}
