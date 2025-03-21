import {Readable} from "stream";
import * as Minio from "minio";
import {Saver} from "./saver";
import {ReadStream} from "fs";
import {BucketItem} from "minio";

export class S3Saver implements Saver{
    private readonly s3Client: Minio.Client;
    private readonly bucketName: string;
    private bucketExists: boolean = false;

    constructor(endpoint: string, port: number, useSSL: boolean, region: string, accessKey: string, secretKey: string, bucketName: string){
        this.s3Client = new Minio.Client({
            endPoint: endpoint,
            port,
            useSSL,
            accessKey,
            secretKey,
            region,
        });
        this.bucketName = bucketName;
    }

    public async createBucketIfNotExists(): Promise<void>{
        if(this.bucketExists)
            return;
        try{
            const bucketExists = await this.s3Client.bucketExists(this.bucketName);
            if(!bucketExists)
                await this.s3Client.makeBucket(this.bucketName);
        }catch(e){
            console.log(e);
        }
        this.bucketExists = true;
    }

    async saveFile(data: Buffer, sum: string): Promise<void>{
        await this.createBucketIfNotExists();
        try{
            // @ts-ignore
            await this.s3Client.putObject(this.bucketName, `${sum.substring(0, 2)}/${sum}.webp`, data, {
                "x-amz-storage-class": process.env.S3_STORAGE_CLASS,
            });
        }catch(e){
            console.log(`Error saving file ${sum}:`);
            console.log(e);
        }
    }

    async getFile(sum: string): Promise<ReadStream>{
        await this.createBucketIfNotExists();
        const readable: Readable = await this.s3Client.getObject(this.bucketName, `${sum.substring(0, 2)}/${sum}.webp`);
        return readable as ReadStream;
    }

    async removeFile(sum: string): Promise<void>{
        await this.createBucketIfNotExists();
        await this.s3Client.removeObject(this.bucketName, `${sum.substring(0, 2)}/${sum}.webp`);
    }

    async clearBucket(){
        const objectsList = [];

        // @ts-ignore
        const objectsStream = this.s3Client.listObjects(this.bucketName, "", true, {IncludeVersion: true});
        objectsStream.on("data", function(obj){
            objectsList.push(obj);
        });
        objectsStream.on("error", function(e){
            return console.log(e);
        });
        objectsStream.on("end", async() => {
            const batchSize = parseInt(process.env.S3_BATCH_SIZE);
            console.log(`Preparing to clear ${objectsList.length} objects from the bucket`);
            for(let i = 0; i < objectsList.length; i += batchSize){
                const batch = objectsList.slice(i, i + batchSize);
                console.log(`Clearing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} objects`);
                try{
                    await this.s3Client.removeObjects(this.bucketName, batch);
                    console.log(`Batch ${Math.floor(i / batchSize) + 1} cleared successfully`);
                }catch(error){
                    console.error(`Error clearing batch ${Math.floor(i / batchSize) + 1}:`, error);
                }
            }
            console.log("Bucket cleared");
        });
    }

    async listObjects(): Promise<BucketItem[]>{
        const objectsList = [];
        const objectsStream = this.s3Client.listObjects(this.bucketName, "", true);
        return new Promise<BucketItem[]>((resolve, reject) => {
            objectsStream.on("data", obj => objectsList.push(obj));
            objectsStream.on("end", () => resolve(objectsList));
            objectsStream.on("error", reject);
        });
    }
}
