import {Controller, Post, UseGuards} from "@nestjs/common";
import {UpdateService} from "./update.service";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {AdminGuard} from "../admin/guard/admin.guard";


@Controller("update")
@ApiTags("Update")
@UseGuards(AdminGuard)
export class UpdateController{
    constructor(
        private readonly updateService: UpdateService,
    ){}

    @Post("webtoons/thumbnails")
    @ApiBearerAuth()
    async updateThumbnails(): Promise<void>{
        await this.updateService.updateThumbnails();
    }
}
