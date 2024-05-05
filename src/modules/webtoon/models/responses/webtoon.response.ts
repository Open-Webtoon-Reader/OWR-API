export default class WebtoonResponse{
    id: number;
    title: string;
    language: string;
    thumbnail: string; // As dataurl
    author: string;

    constructor(
        id: number,
        title: string,
        language: string,
        thumbnail: string,
        author: string,
    ){
        this.id = id;
        this.title = title;
        this.language = language;
        this.thumbnail = thumbnail;
        this.author = author;
    }
}
