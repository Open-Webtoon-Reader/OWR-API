import {Controller, Logger, Post, UseGuards} from "@nestjs/common";
import {UpdateService} from "./update.service";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {HttpStatusCode} from "axios";
import {AuthGuard} from "../../user/guard/auth.guard";
import {AdminGuard} from "../../user/guard/admin.guard";


@Controller("update")
@ApiTags("Update")
@UseGuards(AuthGuard, AdminGuard)
export class UpdateController{

    private readonly logger = new Logger(UpdateController.name);

    constructor(
        private readonly updateService: UpdateService,
    ){}

    @Post("webtoons/thumbnails")
    @ApiBearerAuth()
    @ApiResponse({status: HttpStatusCode.Created, description: "Thumbnails updated"})
    async updateThumbnails(): Promise<void>{
        this.updateService.updateThumbnails().then(() => this.logger.log("Thumbnails updated"));
    }
}
