import {Body, Controller, Delete, Get, HttpCode, Post, UseGuards} from "@nestjs/common";
import CachedWebtoonModel from "../webtoon/models/models/cached-webtoon.model";
import {DownloadManagerService} from "../webtoon/download-manager.service";
import {AddWebtoonToQueueDto} from "./models/dto/add-webtoon-to-queue.dto";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {HttpStatusCode} from "axios";
import {UsersService} from "../../users/users.service";

@Controller("admin")
@ApiTags("Admin")
@UseGuards(AuthGuard("admin-jwt"))
export class AdminController{
    constructor(
        private readonly downloadManagerService: DownloadManagerService,
        private readonly usersService: UsersService,
    ){}

    @Post("queue")
    @ApiBearerAuth()
    @ApiResponse({status: HttpStatusCode.Created, description: "Adds a webtoon to the download queue"})
    @ApiResponse({status: HttpStatusCode.TooEarly, description: "Cache not loaded."})
    async addWebtoonToQueue(@Body() addWebtoonToQueueDto: AddWebtoonToQueueDto): Promise<void>{
        return this.downloadManagerService.addWebtoonToQueue(addWebtoonToQueueDto.name, addWebtoonToQueueDto.language);
    }

    @Post("update/all")
    @ApiBearerAuth()
    @ApiResponse({status: HttpStatusCode.Created, description: "Updates all webtoons in the database"})
    @ApiResponse({status: HttpStatusCode.TooEarly, description: "Cache not loaded."})
    async updateAllWebtoons(): Promise<void>{
        return this.downloadManagerService.updateAllWebtoons();
    }

    @Get("current-download")
    @ApiBearerAuth()
    @ApiResponse({status: HttpStatusCode.Ok, description: "Returns the current download"})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "No download in progress"})
    async getCurrentDownload(): Promise<CachedWebtoonModel>{
        return this.downloadManagerService.getCurrentDownload();
    }

    @Get("queue")
    @ApiBearerAuth()
    @ApiResponse({status: HttpStatusCode.Ok, description: "Returns the current download queue"})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "No download in progress"})
    async getQueue(): Promise<CachedWebtoonModel[]>{
        return this.downloadManagerService.getDownloadQueue();
    }

    @Delete("current-download")
    @ApiBearerAuth()
    @HttpCode(HttpStatusCode.NoContent)
    @ApiResponse({status: HttpStatusCode.NoContent, description: "Cancels the current download"})
    async cancelCurrentDownload(): Promise<void>{
        return this.downloadManagerService.skipCurrentDownload();
    }

    @Delete("queue")
    @ApiBearerAuth()
    @HttpCode(HttpStatusCode.NoContent)
    @ApiResponse({status: HttpStatusCode.NoContent, description: "Clears the download queue"})
    async clearQueue(): Promise<void>{
        return this.downloadManagerService.clearDownloadQueue();
    }

    @Post("refresh-cache")
    @ApiBearerAuth()
    @ApiResponse({status: HttpStatusCode.Created, description: "Refreshes the cache"})
    async refreshCache(): Promise<void>{
        return this.downloadManagerService.refreshCache();
    }
}
