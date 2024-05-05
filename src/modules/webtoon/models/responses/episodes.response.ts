import EpisodeLineModel from "../models/episode-line.model";

export default class EpisodesResponse{
    episodes: EpisodeLineModel[];
    backgroundBanner: string;
    topBanner: string;
    mobileBanner: string;
    title: string;
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
