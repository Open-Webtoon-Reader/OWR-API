export default class EpisodeResponse{
    title: string;
    images: string[];

    constructor(
        title: string,
        images: string[]
    ){
        this.title = title;
        this.images = images;
    }
}
