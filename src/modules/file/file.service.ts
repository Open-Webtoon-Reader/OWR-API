import {Injectable, NotFoundException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {PrismaService} from "../misc/prisma.service";
import {MiscService} from "../misc/misc.service";
import {Saver} from "./saver/saver";
import {S3Saver} from "./saver/s3.saver";
import {FileSaver} from "./saver/file.saver";

@Injectable()
export class FileService{

    private readonly saver: Saver;

    constructor(
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
        private readonly cipherService: MiscService,
    ){
        if(this.configService.get("FILESYSTEM") === "s3")
            this.saver = new S3Saver(
                this.configService.get("S3_ENDPOINT"),
                this.configService.get("S3_PORT"),
                this.configService.get("S3_USE_SSL") === "true",
                this.configService.get("S3_REGION"),
                this.configService.get("S3_ACCESS_KEY"),
                this.configService.get("S3_SECRET_KEY"),
                this.configService.get("S3_BUCKET_NAME")
            );
        else
            this.saver = new FileSaver("images");
    }

    async saveImage(data: Buffer): Promise<string>{
        const sum = this.cipherService.getSum(data);
        await this.saver.saveFile(data, sum);
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
    }
}
