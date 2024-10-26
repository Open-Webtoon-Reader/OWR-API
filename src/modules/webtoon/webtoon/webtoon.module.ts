import {Module} from "@nestjs/common";
import {WebtoonController} from "./webtoon.controller";
import {WebtoonParserService} from "./webtoon-parser.service";
import {WebtoonDownloaderService} from "./webtoon-downloader.service";
import {WebtoonDatabaseService} from "./webtoon-database.service";
import {DownloadManagerService} from "./download-manager.service";
import {MiscModule} from "../../misc/misc.module";
import {FileModule} from "../../file/file.module";
import {WebsocketModule} from "../../websocket/websocket.module";

@Module({
    imports: [MiscModule, FileModule, WebsocketModule],
    controllers: [WebtoonController],
    providers: [WebtoonParserService, WebtoonDownloaderService, WebtoonDatabaseService, DownloadManagerService],
    exports: [DownloadManagerService, WebtoonDatabaseService, WebtoonParserService, WebtoonDownloaderService],
})
export class WebtoonModule{}
