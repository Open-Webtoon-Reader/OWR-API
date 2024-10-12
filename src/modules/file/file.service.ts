import {Injectable, NotFoundException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {PrismaService} from "../misc/prisma.service";
import {MiscService} from "../misc/misc.service";
import {Saver} from "./saver/saver";
import {S3Saver} from "./saver/s3.saver";
import {FileSaver} from "./saver/file.saver";
import * as fs from "node:fs";
import {BucketItem} from "minio";

@Injectable()
export class FileService{

    private readonly saver: Saver;
    private readonly secondarySaver: Saver;

    constructor(
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
        private readonly cipherService: MiscService,
    ){
        if(this.configService.get("FILESYSTEM") === "both"){
            this.saver = this.getS3Saver();
            this.secondarySaver = this.getFileSaver();
        }else if(this.configService.get("FILESYSTEM") === "s3")
            this.saver = this.getS3Saver();
        else
            this.saver = this.getFileSaver();
    }

    getS3Saver(){
        return new S3Saver(
            this.configService.get("S3_ENDPOINT"),
            this.configService.get("S3_PORT"),
            this.configService.get("S3_USE_SSL") === "true",
            this.configService.get("S3_REGION"),
            this.configService.get("S3_ACCESS_KEY"),
            this.configService.get("S3_SECRET_KEY"),
            this.configService.get("S3_BUCKET_NAME")
        );
    }

    getFileSaver(){
        return new FileSaver("images");
    }

    async saveImage(data: Buffer): Promise<string>{
        const sum = this.cipherService.getSum(data);
        await this.saver.saveFile(data, sum);
        if(this.configService.get("FILESYSTEM") === "both")
            await this.secondarySaver.saveFile(data, sum);
        return sum;
    }

    async loadImage(sum: string): Promise<Buffer>{
        try{
            const stream = await this.saver.getFile(sum);
            return await new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                stream.on("data", (chunk: Buffer) => chunks.push(chunk));
                stream.on("end", () => resolve(Buffer.concat(chunks)));
                stream.on("error", reject);
            });
        }catch(e){
            throw new NotFoundException("Image not found");
        }
    }

    async removeImage(sum: string): Promise<void>{
        await this.saver.removeFile(sum);
        if(this.configService.get("FILESYSTEM") === "both")
            await this.secondarySaver.removeFile(sum);
    }

    async checkIntegrity(){
        if(this.configService.get("FILESYSTEM") === "both"){
            await this.checkS3Integrity();
            await this.checkLocalIntegrity();
        }else if(this.configService.get("FILESYSTEM") === "s3")
            await this.checkS3Integrity();
        else
            await this.checkLocalIntegrity();
    }

    private async checkLocalIntegrity(){
        function checkIntegrityRecursive(path: string){
            const files = fs.readdirSync(path);
            for(const file of files){
                const filePath = `${path}/${file}`;
                const stats = fs.statSync(filePath);
                if(stats.isDirectory())
                    checkIntegrityRecursive(filePath);
                else if(stats.size === 0)
                    console.log(filePath);
            }
        }
        checkIntegrityRecursive("images");
        console.log("Integrity check finished");
    }

    private async checkS3Integrity(){
        const saver: S3Saver = this.saver as S3Saver;
        const objectsList: BucketItem[] = await saver.listObjects();
        for(const obj of objectsList)
            if(obj.size === 0)
                console.log(obj.name);
        console.log("Integrity check finished");
    }
}
