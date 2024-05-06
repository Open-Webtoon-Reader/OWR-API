import {Controller, Get} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {VersionResponse} from "./models/responses/version.response";
import {ConfigService} from "@nestjs/config";


@Controller("version")
@ApiTags("Version")
export class VersionController{

    constructor(
        private readonly configService: ConfigService,
    ){}

    @Get()
    @ApiResponse({status: 200, description: "Returns the version of the application", type: VersionResponse})
    getVersion(): VersionResponse{
        return {version: this.configService.get<string>("npm_package_version")};
    }
}
