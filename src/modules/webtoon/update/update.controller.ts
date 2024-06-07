import {Controller, Logger, Post, UseGuards} from "@nestjs/common";
import {UpdateService} from "./update.service";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {AdminGuard} from "../admin/guard/admin.guard";


@Controller("update")
@ApiTags("Update")
@UseGuards(AdminGuard)
export class UpdateController{

    private readonly logger = new Logger(UpdateController.name);

    constructor(
        private readonly updateService: UpdateService,
    ){}

    @Post("webtoons/thumbnails")
    @ApiBearerAuth()
    async updateThumbnails(): Promise<void>{
        this.updateService.updateThumbnails().then(() => this.logger.log("Thumbnails updated"));
    }
}
