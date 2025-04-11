import {StorageService} from "./storage.service";
import {MiscModule} from "../misc/misc.module";
import {Module} from "@nestjs/common";

@Module({
    providers: [StorageService],
    exports: [StorageService],
    imports: [MiscModule],
})
export class StorageModule{}
