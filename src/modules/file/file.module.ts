import {Module} from "@nestjs/common";
import {FileService} from "./file.service";
import {MiscModule} from "../misc/misc.module";
import {FileController} from "./file.controller";

@Module({
    exports: [FileService],
    imports: [MiscModule],
    providers: [FileService],
    controllers: [FileController]
})
export class FileModule{}

