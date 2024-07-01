import {BadRequestException, Controller, Get, Header, Param} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {WebtoonDatabaseService} from "../webtoon/webtoon-database.service";
import {HttpStatusCode} from "axios";
import {ImageSumDto} from "./models/dto/image-sum.dto";
import {SkipThrottle} from "@nestjs/throttler";


@Controller("image")
@ApiTags("Image")
export class ImageController{

    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
    ){}

    @Get(":sum")
    @Header("Content-Type", "image/webp")
    @Header("Cache-Control", "public, max-age=2592000")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Get image"})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "Not found"})
    @ApiResponse({status: HttpStatusCode.BadRequest, description: "Invalid sha256 sum"})
    @SkipThrottle()
    getImage(@Param() imageSumDto: ImageSumDto){
        const regex = new RegExp("^[a-f0-9]{64}$");
        if(!regex.test(imageSumDto.sum))
            throw new BadRequestException("Invalid sha256 sum");
        return this.webtoonDatabaseService.loadImage(imageSumDto.sum);
    }
}
