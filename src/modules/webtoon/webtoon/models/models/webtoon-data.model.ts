export default class WebtoonDataModel{
    thumbnail: Buffer;
    backgroundBanner?: Buffer;
    topBanner: Buffer;
    mobileBanner?: Buffer;

    constructor(thumbnail: Buffer, backgroundBanner: Buffer | undefined, topBanner: Buffer, mobileBanner: Buffer | undefined){
        this.thumbnail = thumbnail;
        this.backgroundBanner = backgroundBanner;
        this.topBanner = topBanner;
        this.mobileBanner = mobileBanner;
    }
}
