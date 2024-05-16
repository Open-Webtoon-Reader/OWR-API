import {Controller, Get, Param} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {WebtoonDatabaseService} from "./webtoon-database.service";
import {WebtoonIdDto} from "./models/dto/webtoon-id.dto";
import {EpisodeIdDto} from "./models/dto/episode-id.dto";
import EpisodesResponse from "./models/responses/episodes.response";
import EpisodeResponse from "./models/responses/episode.response";
import WebtoonResponse from "./models/responses/webtoon.response";
import {Throttle} from "@nestjs/throttler";


@Controller("webtoons")
@ApiTags("Webtoon")
@Throttle({default: {limit: 15, ttl: 60000}})
export class WebtoonController{

    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
    ){}

    @Get()
    @ApiResponse({status: 200, description: "Returns a list of webtoons", type: WebtoonResponse, isArray: true})
    async getWebtoonList(): Promise<WebtoonResponse[]>{
        return this.webtoonDatabaseService.getWebtoons();
    }

    @Get(":webtoonId/episodes")
    @ApiResponse({status: 200, description: "Returns a list of episodes for a webtoon", type: EpisodesResponse})
    async getWebtoonEpisodes(@Param() webtoonIdDto: WebtoonIdDto): Promise<EpisodesResponse>{
        return this.webtoonDatabaseService.getEpisodeInfos(webtoonIdDto.webtoonId);
    }

    @Get("episodes/:episodeId/images")
    @ApiResponse({status: 200, description: "Returns a list of images for an episode", type: EpisodeResponse})
    async getEpisodeImages(@Param() episodeIdDto: EpisodeIdDto): Promise<EpisodeResponse>{
        return this.webtoonDatabaseService.getEpisodeImages(episodeIdDto.episodeId);
    }
}
