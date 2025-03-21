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
import {FileService} from "../../file/file.service";
import {ConfigService} from "@nestjs/config";
import {WebtoonParserService} from "../webtoon/webtoon-parser.service";
import {WebtoonDownloaderService} from "../webtoon/webtoon-downloader.service";

@Injectable()
export class MigrationService{
    private readonly logger = new Logger(MigrationService.name);

    constructor(
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
        private readonly prismaService: PrismaService,
        private readonly fileService: FileService,
        private readonly configService: ConfigService,
        private readonly webtoonParserService: WebtoonParserService,
        private readonly webtoonDownloaderService: WebtoonDownloaderService,
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

    async migrateToS3(){
        const s3Saver = this.fileService.getS3Saver();
        const dbImageBatchSize = 10000;
        const s3BatchSize = parseInt(this.configService.get("S3_BATCH_SIZE"));
        const imageCount = await this.prismaService.images.count();
        await s3Saver.createBucketIfNotExists();
        for(let i = 0; i < imageCount; i += dbImageBatchSize){
            this.logger.debug(`Migrating images from ${i} to ${i + dbImageBatchSize}`);
            const images = await this.prismaService.images.findMany({
                skip: i,
                take: dbImageBatchSize,
                select: {
                    id: true,
                    sum: true,
                },
            });
            const imageSums = images.map(image => image.sum);
            for(let j = 0; j < imageSums.length; j += s3BatchSize){
                try{
                    this.logger.debug(`Uploading images from ${j} to ${j + s3BatchSize}`);
                    const batch = imageSums.slice(j, j + s3BatchSize);
                    await Promise.all(batch.map(async sum => s3Saver.saveFile(await this.fileService.loadImage(sum), sum)));
                }catch(error){
                    this.logger.error(`Error uploading images from ${j} to ${j + s3BatchSize}: ${error}`);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    j -= s3BatchSize;
                }
            }
        }
        this.logger.debug("Migration to S3 completed!");
    }

    async migrateToLocal(){
        const fileSaver = this.fileService.getFileSaver();
        const dbImageBatchSize = 10000;
        const localBatchSize = parseInt(this.configService.get("S3_BATCH_SIZE"));
        const imageCount = await this.prismaService.images.count();
        for(let i = 0; i < imageCount; i += dbImageBatchSize){
            this.logger.debug(`Migrating images from ${i} to ${i + dbImageBatchSize}`);
            const images = await this.prismaService.images.findMany({
                skip: i,
                take: dbImageBatchSize,
                select: {
                    id: true,
                    sum: true,
                },
            });
            const imageSums = images.map(image => image.sum);
            for(let j = 0; j < imageSums.length; j += localBatchSize){
                try{
                    this.logger.debug(`Saving images from ${j} to ${j + localBatchSize}`);
                    const batch = imageSums.slice(j, j + localBatchSize);
                    await Promise.all(batch.map(async sum => fileSaver.saveFile(await this.fileService.loadImage(sum), sum)));
                }catch(error){
                    this.logger.error(`Error saving images from ${j} to ${j + localBatchSize}: ${error}`);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    j -= localBatchSize;
                }
            }
        }
        this.logger.debug("Migration to local completed!");
    }

    async clearS3(): Promise<void>{
        const s3Saver = this.fileService.getS3Saver();
        await s3Saver.clearBucket();
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
        const webtoonModel = this.webtoonParserService.findWebtoon(webtoon.title, webtoon.language);
        const episodeModels = await this.webtoonParserService.getEpisodes(webtoonModel);
        const episodeModel = episodeModels.find(episodeModel => episodeModel.number === episode.number);
        const imageUrls = await this.webtoonParserService.getEpisodeLinks(webtoonModel, episodeModel);
        const episodeData = await this.webtoonDownloaderService.downloadEpisode(episodeModel, imageUrls);
        await this.webtoonDatabaseService.saveEpisode(webtoonModel, episodeModel, episodeData, episodeModel.number, true);
        console.log(`Episode ${episode.number} of ${webtoon.title} re-downloaded!`);
    }
}
