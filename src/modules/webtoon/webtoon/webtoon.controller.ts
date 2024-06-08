import {Controller, Get, Param, Query} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {WebtoonDatabaseService} from "./webtoon-database.service";
import {WebtoonIdDto} from "./models/dto/webtoon-id.dto";
import {EpisodeIdDto} from "./models/dto/episode-id.dto";
import EpisodeResponse from "./models/responses/episode.response";
import LightWebtoonResponse from "./models/responses/light-webtoon-response";
import {Throttle} from "@nestjs/throttler";
import WebtoonResponse from "./models/responses/webtoon-response";
import EpisodeChunkResponse from "./models/responses/episode-chunk.response";
import {ChunkNumberDto} from "../../../common/models/dto/chunk-number.dto";
import ImagesChunkResponse from "./models/responses/images-chunk.response";
import EpisodeLineModel from "./models/models/episode-line.model";

@Controller("webtoons")
@ApiTags("Webtoon")
@Throttle({default: {limit: 15, ttl: 60000}})
export class WebtoonController{

    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
    ){}

    @Get()
    @ApiResponse({status: 200, description: "Returns a list of webtoons", type: LightWebtoonResponse, isArray: true})
    async getWebtoonList(): Promise<LightWebtoonResponse[]>{
        return this.webtoonDatabaseService.getWebtoons();
    }

    @Get("raw")
    @ApiResponse({status: 200, description: "Returns a list of webtoons", type: LightWebtoonResponse, isArray: true})
    async getRawWebtoonList(): Promise<LightWebtoonResponse[]>{
        return this.webtoonDatabaseService.getRawWebtoons();
    }

    @Get(":webtoonId")
    @ApiResponse({status: 200, description: "Returns a webtoon", type: WebtoonResponse})
    @ApiResponse({status: 404, description: "Webtoon not found"})
    async getWebtoon(@Param() webtoonIdDto: WebtoonIdDto){
        return this.webtoonDatabaseService.getWebtoon(webtoonIdDto.webtoonId);
    }

    @Get(":webtoonId/raw")
    @ApiResponse({status: 200, description: "Returns a webtoon", type: WebtoonResponse})
    @ApiResponse({status: 404, description: "Webtoon not found"})
    async getRawWebtoon(@Param() webtoonIdDto: WebtoonIdDto){
        return this.webtoonDatabaseService.getRawWebtoon(webtoonIdDto.webtoonId);
    }

    @Get(":webtoonId/episodes")
    @Throttle({default: {limit: 100, ttl: 60000}})
    @ApiResponse({status: 200, description: "Returns a list of episodes for a webtoon", type: EpisodeChunkResponse})
    @ApiResponse({status: 404, description: "Webtoon not found"})
    async getWebtoonEpisodes(@Param() webtoonIdDto: WebtoonIdDto, @Query() chunkNumberDto: ChunkNumberDto): Promise<EpisodeChunkResponse>{
        const chunk = chunkNumberDto.chunk ?? 1;
        return this.webtoonDatabaseService.getEpisodes(webtoonIdDto.webtoonId, chunk);
    }

    @Get(":webtoonId/episodes/raw")
    @Throttle({default: {limit: 100, ttl: 60000}})
    @ApiResponse({status: 200, description: "Returns a list of episodes for a webtoon", type: EpisodeLineModel, isArray: true})
    @ApiResponse({status: 404, description: "Webtoon not found"})
    async getWebtoonEpisodesNew(@Param() webtoonIdDto: WebtoonIdDto): Promise<EpisodeLineModel[]>{
        return this.webtoonDatabaseService.getRawEpisodes(webtoonIdDto.webtoonId);
    }

    @Get("episodes/:episodeId")
    @ApiResponse({status: 200, description: "Returns an episode", type: EpisodeResponse})
    async getEpisode(@Param() episodeIdDto: EpisodeIdDto): Promise<EpisodeResponse>{
        return this.webtoonDatabaseService.getEpisodeInfos(episodeIdDto.episodeId);
    }

    @Get("episodes/:episodeId/images")
    @ApiResponse({status: 200, description: "Returns a list of images for an episode", type: ImagesChunkResponse})
    async getEpisodeImages(@Param() episodeIdDto: EpisodeIdDto, @Query() chunkNumberDto: ChunkNumberDto): Promise<ImagesChunkResponse>{
        const chunk = chunkNumberDto.chunk ?? 1;
        return this.webtoonDatabaseService.getEpisodeImages(episodeIdDto.episodeId, chunk);
    }

    @Get("episodes/:episodeId/images/raw")
    @ApiResponse({status: 200, description: "Returns a list of images for an episode", type: String, isArray: true})
    async getEpisodeImagesNew(@Param() episodeIdDto: EpisodeIdDto): Promise<string[]>{
        return this.webtoonDatabaseService.getRawEpisodeImages(episodeIdDto.episodeId);
    }
}
