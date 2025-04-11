import MigrationInfosResponse from "./models/responses/migration-infos.response";
import {WebtoonDownloaderService} from "../webtoon/webtoon-downloader.service";
import CachedWebtoonModel from "../webtoon/models/models/cached-webtoon.model";
import {Injectable, InternalServerErrorException, Logger} from "@nestjs/common";
import {WebtoonDatabaseService} from "../webtoon/webtoon-database.service";
import EpisodeDataModel from "../webtoon/models/models/episode-data.model";
import {WebtoonParserService} from "../webtoon/webtoon-parser.service";
import EpisodeModel from "../webtoon/models/models/episode.model";
import {StorageService} from "../../storage/storage.service";
import {PrismaService} from "../../misc/prisma.service";
import {createReadStream, ReadStream} from "fs";
import * as https from "node:https";
import {Readable} from "stream";
import * as JSZip from "jszip";
import * as fs from "node:fs";
import axios from "axios";
import {BunFile, S3File} from "bun";

@Injectable()
export class MigrationService{
    private readonly logger = new Logger(MigrationService.name);

    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
        private readonly prismaService: PrismaService,
        private readonly webtoonParserService: WebtoonParserService,
        private readonly webtoonDownloaderService: WebtoonDownloaderService,
        private readonly storageService: StorageService,
    ){}

    async migrateFrom(url: string, adminKey: string){
        this.logger.debug(`Start migration from ${url}`);
        // Get migration infos using axios from the url
        const response = await axios.get(url + "/api/v1/migration/infos", {
            headers: {
                Authorization: "Bearer " + adminKey,
            },
            httpsAgent: new https.Agent({rejectUnauthorized: false}),
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
                await this.webtoonDatabaseService.saveImage(buffer);
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
        try{
            const response = await axios.get(fileUrl, {
                responseType: "stream",
                headers: {
                    Authorization: "Bearer " + adminKey,
                },
                httpsAgent: new https.Agent({rejectUnauthorized: false}),
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
        }catch(error){
            console.error(`Error downloading the file: ${error}`);
            throw error;
        }
    }

    async migrateToS3(): Promise<void>{
        this.logger.log("Migrating to S3...");
        if(!this.storageService.isS3())
            throw new InternalServerErrorException("Storage service is not S3");
        async function writeFile(storageService: StorageService, file: BunFile): Promise<void>{
            await storageService.uploadBuffer(Buffer.from(await file.arrayBuffer()));
        }
        const batchSize = 1000;
        const files: BunFile[] = await this.storageService.listLocalFiles();
        for(let i: number = 0; i < files.length; i += batchSize){
            const batch: BunFile[] = files.slice(i, i + batchSize);
            const uploadPromises: Promise<void>[] = batch.map((file: BunFile) => writeFile(this.storageService, file));
            await Promise.all(uploadPromises);
        }
        this.logger.log("Migration to s3 completed!");
    }

    async migrateToLocal(): Promise<void>{
        this.logger.log("Migrating to local...");
        async function writeFile(file: S3File): Promise<void>{
            await Bun.file(`images/${file.name}`).write(await file.arrayBuffer());
        }
        if(!this.storageService.isS3())
            throw new InternalServerErrorException("Storage service is not S3");
        const batchSize = 1000;
        const files: S3File[] = await this.storageService.listS3Files();
        for(let i: number = 0; i < files.length; i += batchSize){
            const batch: S3File[] = files.slice(i, i + batchSize);
            const uploadPromises: Promise<void>[] = batch.map((file: S3File) => writeFile(file));
            await Promise.all(uploadPromises);
        }
        this.logger.log("Migration to local completed!");
    }

    async clearS3(): Promise<void>{
        if(process.env.NODE_ENV === "production")
            throw new InternalServerErrorException("You cannot clear S3 in production");
        this.logger.warn("Clearing S3...");
        const batchSize = 1000;
        const files: S3File[] = await this.storageService.listFiles() as S3File[];
        for(let i: number = 0; i < files.length; i += batchSize){
            const batch: S3File[] = files.slice(i, i + batchSize);
            const deletePromises: Promise<void>[] = batch.map((file: S3File) => file.delete());
            await Promise.all(deletePromises);
        }
        this.logger.warn("S3 cleared!");
    }

    async reDownloadEpisode(episodeId: number){
        const episode = await this.prismaService.episodes.findUnique({
            where: {
                id: episodeId,
            },
        });
        const webtoon = await this.prismaService.webtoons.findUnique({
            where: {
                id: episode.webtoon_id,
            },
        });
        const webtoonModel: CachedWebtoonModel = this.webtoonParserService.findWebtoon(webtoon.title, webtoon.language);
        const episodeModel: EpisodeModel = (await this.webtoonParserService.getEpisodes(webtoonModel))[episode.number - 1];
        const imageUrls: string[] = await this.webtoonParserService.getEpisodeLinks(webtoonModel, episodeModel);
        const episodeData: EpisodeDataModel = await this.webtoonDownloaderService.downloadEpisode(episodeModel, imageUrls);
        await this.webtoonDatabaseService.saveEpisode(webtoonModel, episodeModel, episodeData, episode.number, true);
        console.log(`Episode ${episode.number} of ${webtoon.title} re-downloaded!`);
    }
}
