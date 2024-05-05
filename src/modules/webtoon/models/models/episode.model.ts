export default class EpisodeModel{
    link: string;
    thumbnail: string;
    title: string;
    number: number;

    constructor(
        link: string,
        thumbnail: string,
        title: string,
        number: number
    ){
        this.link = link;
        this.thumbnail = thumbnail;
        this.title = title;
        this.number = number;
    }
}
