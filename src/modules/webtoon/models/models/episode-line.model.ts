export default class EpisodeLineModel{
    thumbnail: string;
    title: string;
    number: number;

    constructor(
        thumbnail: string,
        title: string,
        number: number
    ){
        this.thumbnail = thumbnail;
        this.title = title;
        this.number = number;
    }
}
