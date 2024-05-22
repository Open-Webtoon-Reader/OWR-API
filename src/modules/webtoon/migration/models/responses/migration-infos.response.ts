import {ApiProperty} from "@nestjs/swagger";

export default class MigrationInfosResponse{
    @ApiProperty()
        imageCount: number;
    @ApiProperty()
        chunkNumber: number;

    constructor(imageCount: number, chunkNumber: number){
        this.imageCount = imageCount;
        this.chunkNumber = chunkNumber;
    }
}
