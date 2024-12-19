import {Saver} from "./saver";
import * as fs from "fs";
import {createReadStream, ReadStream} from "fs";

export class FileSaver implements Saver{
    private readonly uploadFolderName: string;

    constructor(uploadFolderName: string){
        this.uploadFolderName = uploadFolderName;
    }

    async saveFile(data: Buffer, sum: string): Promise<void>{
        const path = `./${this.uploadFolderName}/${sum.substring(0, 2)}`;
        if(!fs.existsSync(path)){
            fs.mkdirSync(path, {
                recursive: true,
            });
        }
        fs.writeFileSync(`${path}/${sum}.webp`, data);
    }

    async getFile(sum: string): Promise<ReadStream>{
        return createReadStream(`./${this.uploadFolderName}/${sum.substring(0, 2)}/${sum}.webp`);
    }

    async removeFile(sum: string): Promise<void>{
        fs.unlinkSync(`./${this.uploadFolderName}/${sum.substring(0, 2)}/${sum}.webp`);
    }
}
