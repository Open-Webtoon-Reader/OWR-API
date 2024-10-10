import {Controller, Get, Header, Param} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {WebtoonDatabaseService} from "./webtoon-database.service";
import {WebtoonIdDto} from "./models/dto/webtoon-id.dto";
import {EpisodeIdDto} from "./models/dto/episode-id.dto";
import EpisodeResponse from "./models/responses/episode.response";
import LightWebtoonResponse from "./models/responses/light-webtoon-response";
import {Throttle} from "@nestjs/throttler";
import WebtoonResponse from "./models/responses/webtoon-response";
import EpisodeLineModel from "./models/models/episode-line.model";
import {HttpStatusCode} from "axios";
import RandomThumbnailResponse from "./models/responses/random-thumbnail.response";

@Controller("webtoons")
@ApiTags("Webtoon")
@Throttle({default: {limit: 15, ttl: 60000}})
export class WebtoonController{

    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
    ){}

    @Get()
    @ApiResponse({status: HttpStatusCode.Ok, description: "Returns a list of webtoons", type: LightWebtoonResponse, isArray: true})
    async getRawWebtoonList(): Promise<LightWebtoonResponse[]>{
        return this.webtoonDatabaseService.getWebtoons();
    }

    @Get(":webtoonId")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Returns a webtoon", type: WebtoonResponse})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "Webtoon not found"})
    async getRawWebtoon(@Param() webtoonIdDto: WebtoonIdDto){
        return this.webtoonDatabaseService.getWebtoon(webtoonIdDto.webtoonId);
    }

    @Get(":webtoonId/episodes")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Returns a list of episodes for a webtoon", type: EpisodeLineModel, isArray: true})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "Webtoon not found"})
    async getWebtoonEpisodesNew(@Param() webtoonIdDto: WebtoonIdDto): Promise<EpisodeLineModel[]>{
        return this.webtoonDatabaseService.getEpisodes(webtoonIdDto.webtoonId);
    }

    @Get("episodes/:episodeId")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Returns an episode", type: EpisodeResponse})
    async getEpisode(@Param() episodeIdDto: EpisodeIdDto): Promise<EpisodeResponse>{
        return this.webtoonDatabaseService.getEpisodeInfos(episodeIdDto.episodeId);
    }

    @Get("episodes/:episodeId/images")
    @Header("Cache-Control", "public, max-age=604800000")
    @ApiResponse({status: 200, description: "Returns a list of images for an episode", type: String, isArray: true})
    async getEpisodeImagesNew(@Param() episodeIdDto: EpisodeIdDto): Promise<string[]>{
        return this.webtoonDatabaseService.getEpisodeImages(episodeIdDto.episodeId);
    }

    @Get("thumbnails/random")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Returns a random webtoon thumbnail sum", type: RandomThumbnailResponse})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "No thumbnails found"})
    async getRandomThumbnails(): Promise<RandomThumbnailResponse>{
        return this.webtoonDatabaseService.getRandomThumbnails();
    }
}
