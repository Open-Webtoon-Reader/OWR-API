import {Controller, Get, Header, Param} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {WebtoonDatabaseService} from "../webtoon/webtoon-database.service";
import {HttpStatusCode} from "axios";
import {ImageSumDto} from "./models/dto/image-sum.dto";


@Controller("image")
@ApiTags("Image")
export class ImageController{

    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
    ){}

    @Get(":sum")
    @Header("Content-Type", "image/webp")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Get image"})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "Not found"})
    getImage(@Param() imageSumDto: ImageSumDto){
        return this.webtoonDatabaseService.loadImage(imageSumDto.sum);
    }
}
