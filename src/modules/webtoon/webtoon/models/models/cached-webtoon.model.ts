import WebtoonProviderEnum from "../enums/webtoon-provider.enum";
import WebtoonStarModel from "./webtoon-star.model";

export default class CachedWebtoonModel{
    title: string;
    author: string;
    link: string;
    thumbnail: string;
    stars: WebtoonStarModel;
    genres: string[];
    id: string;
    language: string;
    provider: WebtoonProviderEnum;

    constructor(
        title: string,
        author: string,
        link: string,
        thumbnail: string,
        stars: WebtoonStarModel,
        genres: string[],
        id: string,
        language: string,
        provider: WebtoonProviderEnum,
    ){
        this.title = title;
        this.author = author;
        this.link = link;
        this.thumbnail = thumbnail;
        this.stars = stars;
        this.genres = genres;
        this.id = id;
        this.language = language;
        this.provider = provider;
    }
}
