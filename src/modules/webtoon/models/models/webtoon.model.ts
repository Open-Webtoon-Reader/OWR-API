import CachedWebtoonModel from "./cached-webtoon.model";
import WebtoonBannerModel from "./webtoon-banner.model";
import WebtoonStarModel from "./webtoon-star.model";

export default class WebtoonModel extends CachedWebtoonModel{
    epCount: number;
    banner: WebtoonBannerModel;

    constructor(
        title: string,
        author: string,
        link: string,
        thumbnail: string,
        stars: WebtoonStarModel,
        genres: string[],
        id: string,
        language: string,
        epCount: number,
        banner: WebtoonBannerModel
    ){
        super(title, author, link, thumbnail, stars, genres, id, language);
        this.epCount = epCount;
        this.banner = banner;
    }
}
