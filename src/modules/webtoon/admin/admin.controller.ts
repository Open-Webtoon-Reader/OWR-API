import {Body, Controller, Post} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {DownloadManagerService} from "../webtoon/download-manager.service";
import {AddWebtoonToQueueDto} from "./models/dto/add-webtoon-to-queue.dto";
import {HttpStatusCode} from "axios";


@Controller("admin")
@ApiTags("Admin")
export class AdminController{

    constructor(
        private readonly downloadManagerService: DownloadManagerService,
    ){}

    @Post("queue")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Adds a webtoon to the download queue"})
    @ApiResponse({status: HttpStatusCode.TooEarly, description: "Cache not loaded."})
    async addWebtoonToQueue(@Body() addWebtoonToQueueDto: AddWebtoonToQueueDto): Promise<void>{
        return this.downloadManagerService.addWebtoonToQueue(addWebtoonToQueueDto.name, addWebtoonToQueueDto.language);
    }

    @Post("update/all")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Updates all webtoons in the database"})
    @ApiResponse({status: HttpStatusCode.TooEarly, description: "Cache not loaded."})
    async updateAllWebtoons(): Promise<void>{
        return this.downloadManagerService.updateAllWebtoons();
    }
}
