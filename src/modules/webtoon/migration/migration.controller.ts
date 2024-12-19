import {Body, Controller, Delete, Get, Param, Post, Query, Res, StreamableFile, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {MigrationService} from "./migration.service";
import {ReadStream} from "fs";
import {ChunkNumberDto} from "../../../common/models/dto/chunk-number.dto";
import MigrationInfosResponse from "./models/responses/migration-infos.response";
import MigrateFromDto from "./models/dto/migrate-from.dto";
import {AdminGuard} from "../admin/guard/admin.guard";
import {HttpStatusCode} from "axios";

@Controller("migration")
@ApiTags("Migration")
@UseGuards(AdminGuard)
export class MigrationController{
    constructor(
        private readonly migrationService: MigrationService,
    ){}

    @Post("from")
    @ApiBearerAuth()
    async migrateFrom(@Body() migrateFromDto: MigrateFromDto): Promise<void>{
        this.migrationService.migrateFrom(migrateFromDto.url, migrateFromDto.adminKey);
    }

    @Get("infos")
    @ApiResponse({status: HttpStatusCode.Ok, type: MigrationInfosResponse})
    @ApiBearerAuth()
    async getMigrationInfos(): Promise<MigrationInfosResponse>{
        return this.migrationService.getMigrationInfos();
    }

    @Get("images")
    @ApiBearerAuth()
    async getImages(@Query() chunkNumberDto: ChunkNumberDto, @Res({passthrough: true}) _: Response): Promise<StreamableFile>{
        const chunkNumber = chunkNumberDto.chunk || 1;
        const readStream: ReadStream = await this.migrationService.getImages(chunkNumber);
        return new StreamableFile(readStream);
    }

    @Get("database")
    @ApiBearerAuth()
    async getDatabase(@Res({passthrough: true}) _: Response): Promise<StreamableFile>{
        return new StreamableFile(await this.migrationService.getDatabase());
    }

    @Post("to/s3")
    @ApiBearerAuth()
    async migrateToS3(){
        this.migrationService.migrateToS3();
    }

    @Post("to/local")
    @ApiBearerAuth()
    async migrateToLocal(){
        this.migrationService.migrateToLocal();
    }

    @Post("update/:episode_id")
    @ApiBearerAuth()
    async updateEpisode(@Param("episode_id") episodeId: number){
        this.migrationService.reDownloadEpisode(episodeId);
    }

    @Delete("s3")
    @ApiBearerAuth()
    async removeS3(){
        this.migrationService.clearS3();
    }
}
