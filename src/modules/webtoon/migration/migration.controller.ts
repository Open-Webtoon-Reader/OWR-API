import {Controller, Get, Header, Post, Res, StreamableFile} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {MigrationService} from "./migration.service";
import {ReadStream} from "fs";


@Controller("migration")
@ApiTags("Migration")
export class MigrationController{
    constructor(
        private readonly migrationService: MigrationService
    ){}

    @Post("from")
    async migrateFrom(){
        // TODO
    }

    @Get("infos")
    async getMigrationInfos(){
        return this.migrationService.getMigrationInfos();
    }

    @Get("images")
    async getImages(@Res({passthrough: true}) res: Response): Promise<StreamableFile>{
        const readStream: ReadStream = await this.migrationService.getImages(0);
        return new StreamableFile(readStream);
    }

    @Get("database")
    async getDatabase(@Res({passthrough: true}) res: Response): Promise<StreamableFile>{
        return new StreamableFile(await this.migrationService.getDatabase());
    }
}
