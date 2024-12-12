import {ReadStream} from "fs";

export interface Saver{
    // eslint-disable-next-line @/no-unused-vars
    saveFile(data: Buffer, fileName: string): Promise<void>;
    // eslint-disable-next-line @/no-unused-vars
    getFile(fileName: string): Promise<ReadStream>;
    // eslint-disable-next-line @/no-unused-vars
    removeFile(fileName: string): Promise<void>;
}
