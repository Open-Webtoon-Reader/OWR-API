import {Injectable, Logger} from "@nestjs/common";
import {createReadStream, ReadStream} from "fs";
import {WebtoonDatabaseService} from "../webtoon/webtoon-database.service";
import * as JSZip from "jszip";
import {Readable} from "stream";
import MigrationInfosResponse from "./models/responses/migration-infos.response";
import axios from "axios";
import {PrismaService} from "../../misc/prisma.service";
import * as fs from "node:fs";
import * as https from "node:https";

@Injectable()
export class MigrationService{

    private readonly logger = new Logger(MigrationService.name);

    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
        private readonly prismaService: PrismaService
    ){}

    async migrateFrom(url: string, adminKey: string){
        this.logger.debug(`Start migration from ${url}`)
        // Get migration infos using axios from the url
        const response = await axios.get(url + "/api/v1/migration/infos", {
            headers: {
                "Authorization": "Bearer " + adminKey
            },
            httpsAgent: new https.Agent({rejectUnauthorized: false})
        });
        const migrationInfos: MigrationInfosResponse = response.data;
        // Migrate the data
        for(let i = 1; i <= migrationInfos.chunkNumber; i++){
            this.logger.debug(`Downloading images from chunk ${i}/${migrationInfos.chunkNumber}`);
            const imageZipBuffer: Buffer = await this.downloadFile(`${url}/api/v1/migration/images?chunk=${i}`, adminKey);
            const imageZip: JSZip = await JSZip.loadAsync(imageZipBuffer);
            const images: Record<string, Buffer> = {};
            this.logger.debug(`Unzipping images from chunk ${i}/${migrationInfos.chunkNumber}`);
            for(const [fileName, file] of Object.entries(imageZip.files))
                images[fileName] = await file.async("nodebuffer");
            this.logger.debug(`Saving images from chunk ${i}/${migrationInfos.chunkNumber}`);
            for(const buffer of Object.values(images))
                this.webtoonDatabaseService.saveImage(buffer);
            this.logger.debug(`Chunk ${i}/${migrationInfos.chunkNumber} migrated!`);
        }
        // Database migration
        this.logger.debug("Migrating database");
        await this.prismaService.onModuleDestroy();
        const databaseBuffer: Buffer = await this.downloadFile(`${url}/api/v1/migration/database`, adminKey);
        fs.writeFileSync("./prisma/database.db", databaseBuffer);
        await this.prismaService.onModuleInit();
        this.logger.debug("Database migrated!");
    }

    async getMigrationInfos(): Promise<MigrationInfosResponse>{
        return this.webtoonDatabaseService.getMigrationInfos();
    }

    async getImages(chunkNumber: number): Promise<ReadStream>{
        const images: Record<string, Buffer> = await this.webtoonDatabaseService.getImages(chunkNumber);
        const zip: JSZip = new JSZip();
        for(const [name, buffer] of Object.entries(images))
            zip.file(name, buffer);
        const zipBuffer: Buffer = await zip.generateAsync({type: "nodebuffer"});
        return Readable.from(zipBuffer) as ReadStream;
    }

    async getDatabase(): Promise<ReadStream>{
        return createReadStream("./prisma/database.db");
    }

    private async downloadFile(fileUrl: string, adminKey: string): Promise<Buffer>{
        try {
            const response = await axios.get(fileUrl, {
                responseType: "stream",
                headers: {
                    "Authorization": "Bearer " + adminKey
                },
                httpsAgent: new https.Agent({rejectUnauthorized: false})
            });

            return new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                response.data.on("data", (chunk: Buffer) => {
                    chunks.push(chunk);
                });

                response.data.on("end", () => {
                    resolve(Buffer.concat(chunks));
                });

                response.data.on("error", (error: Error) => {
                    reject(error);
                });
            });
        } catch (error){
            console.error(`Error downloading the file: ${error}`);
            throw error;
        }
    }
}
