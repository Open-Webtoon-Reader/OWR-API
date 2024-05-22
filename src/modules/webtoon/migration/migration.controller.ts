import {Controller, Get, Post} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";


@Controller("migration")
@ApiTags("Migration")
export class MigrationController{
    constructor(){
    }

    @Post("from")
    async migrateFrom(){
        // TODO
    }

    @Get("infos")
    async getMigrationInfos(){

    }

    @Get("images")
    async getMigrationImages(){

    }
}
