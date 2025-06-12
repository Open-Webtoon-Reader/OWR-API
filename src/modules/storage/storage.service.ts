import {Injectable, Logger} from "@nestjs/common";
import {BunFile, Glob, S3Client, S3File, S3ListObjectsResponse} from "bun";
import {MiscService} from "../misc/misc.service";

@Injectable()
export class StorageService{
    private readonly s3Client?: S3Client;
    private readonly logger: Logger = new Logger(StorageService.name);

    constructor(
        private readonly miscService: MiscService,
    ){
        if(process.env.S3_ENDPOINT)
            this.s3Client = new S3Client({
                endpoint: process.env.S3_ENDPOINT,
                bucket: process.env.S3_BUCKET_NAME,
                region: process.env.S3_REGION,
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
            });
    }

    private getFileName(sum: string): string{
        if(this.s3Client)
            return `${sum.substring(0, 2)}/${sum}.webp`;
        return `images/${sum.substring(0, 2)}/${sum}.webp`;
    }

    isS3(): boolean{
        return !!this.s3Client;
    }

    async uploadBuffer(data: Buffer): Promise<string>{
        const sum: string = this.miscService.getSum(data);
        const fileName: string = this.getFileName(sum);
        this.logger.verbose(`Uploading file ${fileName}`);
        let file: BunFile | S3File;
        if(this.s3Client){
            file = this.s3Client.file(fileName);
            await file.write(data, {
                // @ts-ignore
                storageClass: process.env.S3_STORAGE_CLASS || "STANDARD",
            });
        }else{
            file = Bun.file(fileName);
            await file.write(data);
        }
        return sum;
    }

    async downloadBuffer(sum: string): Promise<Buffer>{
        const fileName: string = this.getFileName(sum);
        this.logger.verbose(`Downloading file ${fileName}`);
        if(this.s3Client)
            return Buffer.from(await this.s3Client.file(fileName).arrayBuffer());
        else
            return Buffer.from(await Bun.file(fileName).arrayBuffer());
    }

    async deleteFile(sum: string): Promise<void>{
        const fileName: string = this.getFileName(sum);
        this.logger.verbose(`Deleting file ${fileName}`);
        if(this.s3Client)
            await this.s3Client.delete(fileName);
        else
            await Bun.file(fileName).delete();
    }

    async presign(sum: string, expiresIn: number = 60 * 60): Promise<string>{
        const fileName: string = this.getFileName(sum);
        this.logger.verbose(`Presigning file ${fileName}`);
        if(!this.s3Client)
            throw new Error("S3 client not initialized");
        return this.s3Client.presign(fileName, {
            expiresIn,
        });
    }

    async listFiles(take: number = Infinity, skip: number = 0): Promise<(BunFile | S3File)[]>{
        if(this.s3Client)
            return this.listS3Files(take, skip);
        return this.listLocalFiles(take, skip);
    }

    async listLocalFiles(take: number = Infinity, skip: number = 0): Promise<BunFile[]>{
        const files: BunFile[] = [];
        const glob = new Glob("**/*");
        for(const filePath of glob.scanSync("images"))
            files.push(Bun.file("images/" + filePath));
        return files.slice(skip, take === Infinity ? undefined : take + skip);
    }

    async listS3Files(take: number = Infinity, skip: number = 0): Promise<S3File[]>{
        const files: S3File[] = [];
        let continuationToken: string | undefined;
        let remainingItems: number = take;
        let totalSkipped: number = 0;
        do{
            const s3Files: S3ListObjectsResponse = await this.s3Client.list({
                maxKeys: Math.min(remainingItems + Math.max(0, skip - totalSkipped), 1000),
                continuationToken,
            });
            let itemsToProcess = s3Files.contents || [];
            if(totalSkipped < skip){
                const skipInThisBatch: number = Math.min(skip - totalSkipped, itemsToProcess.length);
                itemsToProcess = itemsToProcess.slice(skipInThisBatch);
                totalSkipped += skipInThisBatch;
            }
            const itemsToTake: number = Math.min(remainingItems, itemsToProcess.length);
            for(const file of itemsToProcess.slice(0, itemsToTake))
                files.push(this.s3Client.file(file.key));
            remainingItems -= itemsToTake;
            continuationToken = s3Files.nextContinuationToken;
        }while(remainingItems > 0 && continuationToken);
        return files;
    }
}
