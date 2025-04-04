import {Controller, Post, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {FileService} from "./file.service";
import {AuthGuard} from "@nestjs/passport";

@Controller("file")
@ApiTags("File")
@UseGuards(AuthGuard("admin-jwt"))
export class FileController{
    constructor(
        private readonly fileService: FileService,
    ){}

    @Post("integrity")
    @ApiBearerAuth()
    async checkIntegrity(){
        this.fileService.checkIntegrity();
    }
}
