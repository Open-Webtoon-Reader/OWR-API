import {Body, Controller, Get, Post, Query, Res, StreamableFile} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {MigrationService} from "./migration.service";
import {ReadStream} from "fs";
import {ChunkNumberDto} from "../../../common/models/dto/chunk-number.dto";
import MigrationInfosResponse from "./models/responses/migration-infos.response";
import MigrateFromDto from "./models/dto/migrate-from.dto";


@Controller("migration")
@ApiTags("Migration")
export class MigrationController{
    constructor(
        private readonly migrationService: MigrationService
    ){}

    @Post("from")
    async migrateFrom(@Body() migrateFromDto: MigrateFromDto): Promise<void>{
        return this.migrationService.migrateFrom(migrateFromDto.url, migrateFromDto.adminKey);
    }

    @Get("infos")
    async getMigrationInfos(): Promise<MigrationInfosResponse>{
        return this.migrationService.getMigrationInfos();
    }

    @Get("images")
    async getImages(@Query() chunkNumberDto: ChunkNumberDto, @Res({passthrough: true}) _: Response): Promise<StreamableFile>{
        const chunkNumber = chunkNumberDto.chunk || 1;
        const readStream: ReadStream = await this.migrationService.getImages(chunkNumber);
        return new StreamableFile(readStream);
    }

    @Get("database")
    async getDatabase(@Res({passthrough: true}) _: Response): Promise<StreamableFile>{
        return new StreamableFile(await this.migrationService.getDatabase());
    }
}
