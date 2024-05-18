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
import {ChunkNumberDto} from "./models/dto/chunk-number.dto";

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

    @Get(":webtoonId")
    @ApiResponse({status: 200, description: "Returns a webtoon", type: WebtoonResponse})
    @ApiResponse({status: 404, description: "Webtoon not found"})
    async getWebtoon(@Param() webtoonIdDto: WebtoonIdDto){
        return this.webtoonDatabaseService.getWebtoon(webtoonIdDto.webtoonId);
    }

    @Get(":webtoonId/episodes")
    @ApiResponse({status: 200, description: "Returns a list of episodes for a webtoon", type: EpisodeChunkResponse})
    @ApiResponse({status: 404, description: "Webtoon not found"})
    async getWebtoonEpisodes(@Param() webtoonIdDto: WebtoonIdDto, @Query() chunkNumberDto: ChunkNumberDto): Promise<EpisodeChunkResponse>{
        const chunk = chunkNumberDto.chunk ?? 1;
        return this.webtoonDatabaseService.getEpisodes(webtoonIdDto.webtoonId, chunk);
    }

    @Get("episodes/:episodeId")
    @ApiResponse({status: 200, description: "Returns an episode", type: EpisodeResponse})
    async getEpisode(@Param() episodeIdDto: EpisodeIdDto): Promise<EpisodeResponse>{
        return this.webtoonDatabaseService.getEpisodeInfos(episodeIdDto.episodeId);
    }

    @Get("episodes/:episodeId/images")
    @ApiResponse({status: 200, description: "Returns a list of images for an episode", type: String, isArray: true})
    async getEpisodeImages(@Param() episodeIdDto: EpisodeIdDto): Promise<string[]>{
        return this.webtoonDatabaseService.getEpisodeImages(episodeIdDto.episodeId);
    }
}
