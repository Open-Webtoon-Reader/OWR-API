import {ApiProperty} from "@nestjs/swagger";

export default class RandomThumbnailResponse{
    @ApiProperty()
    thumbnail: string;

    constructor(
        thumbnail: string,
    ){
        this.thumbnail = thumbnail;
    }
}
