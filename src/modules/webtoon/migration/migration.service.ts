import {Injectable} from "@nestjs/common";
import {createReadStream, ReadStream} from "fs";
import {WebtoonDatabaseService} from "../webtoon/webtoon-database.service";

@Injectable()
export class MigrationService{
    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService
    ){}

    async getMigrationInfos(){

    }

    async getImages(chunkNumber: number): Promise<ReadStream>{
        return null;
    }

    async getDatabase(): Promise<ReadStream>{
        return createReadStream("./prisma/database.db");
    }
}
