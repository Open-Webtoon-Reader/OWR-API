import {Module} from "@nestjs/common";
import {FileService} from "./file.service";
import {MiscModule} from "../misc/misc.module";

@Module({
    exports: [FileService],
    imports: [MiscModule],
    providers: [FileService]
})
export class FileModule{}

