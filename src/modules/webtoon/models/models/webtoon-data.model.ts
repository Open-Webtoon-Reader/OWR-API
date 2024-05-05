export default class WebtoonDataModel{
    thumbnail: Buffer;
    backgroundBanner: Buffer;
    topBanner: Buffer;
    mobileBanner: Buffer;

    constructor(thumbnail: Buffer, backgroundBanner: Buffer, topBanner: Buffer, mobileBanner: Buffer){
        this.thumbnail = thumbnail;
        this.backgroundBanner = backgroundBanner;
        this.topBanner = topBanner;
        this.mobileBanner = mobileBanner;
    }
}
