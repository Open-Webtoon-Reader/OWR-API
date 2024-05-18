import EpisodeLineModel from "../models/episode-line.model";
import {ApiProperty} from "@nestjs/swagger";

export default class EpisodeChunkResponse{
    @ApiProperty()
        episodes: EpisodeLineModel[];
    @ApiProperty()
        currentChunk: number;
    @ApiProperty()
        maxChunks: number;

    constructor(
        episodes: EpisodeLineModel[],
        currentChunk: number,
        maxChunks: number
    ){
        this.episodes = episodes;
        this.currentChunk = currentChunk;
        this.maxChunks = maxChunks;
    }
}
