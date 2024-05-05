import {Module} from "@nestjs/common";
import {WebtoonController} from "./webtoon.controller";
import {WebtoonParserService} from "./webtoon-parser.service";
import {MiscModule} from "../misc/misc.module";
import {WebtoonDownloaderService} from "./webtoon-downloader.service";
import {WebtoonDatabaseService} from "./webtoon-database.service";
import {DownloadManagerService} from "./download-manager.service";

@Module({
    imports: [MiscModule],
    controllers: [WebtoonController],
    providers: [WebtoonParserService, WebtoonDownloaderService, WebtoonDatabaseService, DownloadManagerService],
})
export class WebtoonModule{}
