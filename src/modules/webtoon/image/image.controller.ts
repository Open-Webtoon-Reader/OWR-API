import {BadRequestException, Controller, Get, Header, Param, Res} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {WebtoonDatabaseService} from "../webtoon/webtoon-database.service";
import {HttpStatusCode} from "axios";
import {ImageSumDto} from "./models/dto/image-sum.dto";
import {Throttle} from "@nestjs/throttler";
import {StorageService} from "../../storage/storage.service";
import {type FastifyReply} from "fastify";

@Controller("image")
@ApiTags("Image")
@Throttle({default: {limit: 400, ttl: 60000}})
export class ImageController{
    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
        private readonly storageService: StorageService,
    ){}

    @Get(":sum")
    @Header("Content-Type", "image/webp")
    @Header("Cache-Control", "public, max-age=2592000000000")
    @ApiResponse({status: HttpStatusCode.Ok, description: "Get image"})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "Not found"})
    @ApiResponse({status: HttpStatusCode.BadRequest, description: "Invalid sha256 sum"})
    getImage(@Param() imageSumDto: ImageSumDto){
        const regex = new RegExp("^[a-f0-9]{64}$");
        if(!regex.test(imageSumDto.sum))
            throw new BadRequestException("Invalid sha256 sum");
        return this.webtoonDatabaseService.loadImage(imageSumDto.sum);
    }

    /**
     * Get the image from a sha256 sum.
     *
     * @throws {200} Get image
     * @throws {302} Redirect to presigned URL
     * @throws {400} Invalid sha256 sum.
     * @throws {404} Not Found
     */
    @Get("v2/:sum")
    async getPresignedImage(@Param() imageSumDto: ImageSumDto, @Res() res: FastifyReply){
        const regex = new RegExp("^[a-f0-9]{64}$");
        if(!regex.test(imageSumDto.sum))
            throw new BadRequestException("Invalid sha256 sum");
        // Set header to image/webp and cache for 30 days
        res.header("Content-Type", "image/webp");
        res.header("Cache-Control", "public, max-age=2592000000000");
        try{
            const presignedUrl: string = await this.storageService.presign(imageSumDto.sum, 60 * 60 * 24 * 7);
            res.status(HttpStatusCode.Found);
            res.redirect(presignedUrl);
        }catch(_: any){
            const image: Buffer = await this.webtoonDatabaseService.loadImage(imageSumDto.sum);
            res.type("image/webp").send(image);
        }
    }
}
