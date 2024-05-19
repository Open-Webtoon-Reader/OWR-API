import {ApiProperty} from "@nestjs/swagger";

export default class ImagesChunkResponse{
    @ApiProperty()
        images: string[];
    @ApiProperty()
        currentChunk: number;
    @ApiProperty()
        maxChunks: number;

    constructor(
        images: string[],
        currentChunk: number,
        maxChunks: number
    ){
        this.images = images;
        this.currentChunk = currentChunk;
        this.maxChunks = maxChunks;
    }
}
