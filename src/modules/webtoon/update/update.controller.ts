import {Controller, HttpStatus, Logger, Post, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UpdateService} from "./update.service";
import {AuthGuard} from "@nestjs/passport";

@Controller("update")
@ApiTags("Update")
@UseGuards(AuthGuard("admin-jwt"))
export class UpdateController{
    private readonly logger = new Logger(UpdateController.name);

    constructor(
        private readonly updateService: UpdateService,
    ){}

    @Post("webtoons/thumbnails")
    @ApiBearerAuth()
    @ApiResponse({status: HttpStatus.CREATED, description: "Thumbnails updated"})
    async updateThumbnails(): Promise<void>{
        this.updateService.updateThumbnails().then(() => this.logger.log("Thumbnails updated"));
    }
}
