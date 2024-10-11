import {ReadStream} from "fs";

export interface Saver{
    saveFile(data: Buffer, fileName: string): Promise<void>;
    getFile(fileName: string): Promise<ReadStream>;
    removeFile(fileName: string): Promise<void>;
}
