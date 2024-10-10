import {Readable} from "stream";
import * as Minio from "minio";
import {Saver} from "./saver";
import {ReadStream} from "fs";

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

    private async createBucketIfNotExists(): Promise<void>{
        if(this.bucketExists)
            return;
        try{
            const bucketExists = await this.s3Client.bucketExists(this.bucketName);
            if(!bucketExists)
                await this.s3Client.makeBucket(this.bucketName);
        }catch (e){
            console.log(e);
        }
        this.bucketExists = true;
    }

    async saveFile(data: Buffer, sum: string): Promise<void>{
        await this.createBucketIfNotExists();
        await this.s3Client.putObject(this.bucketName, `${sum.substring(0, 2)}/${sum}.webp`, data);
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
}
