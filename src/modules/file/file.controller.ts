import {Controller, Post, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {AdminGuard} from "../webtoon/admin/guard/admin.guard";
import {FileService} from "./file.service";


@Controller("file")
@ApiTags("File")
@UseGuards(AdminGuard)
export class FileController{

    constructor(
        private readonly fileService: FileService
    ){}

    @Post("integrity")
    @ApiBearerAuth()
    async checkIntegrity(){
        this.fileService.checkIntegrity();
    }
}
