export default class EpisodeDataModel{
    images: Buffer[];
    thumbnail: Buffer;

    constructor(images: Buffer[], thumbnail: Buffer){
        this.images = images;
        this.thumbnail = thumbnail;
    }
}
