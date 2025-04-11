import {Module} from "@nestjs/common";
import {WebtoonController} from "./webtoon.controller";
import {WebtoonParserService} from "./webtoon-parser.service";
import {WebtoonDownloaderService} from "./webtoon-downloader.service";
import {WebtoonDatabaseService} from "./webtoon-database.service";
import {DownloadManagerService} from "./download-manager.service";
import {MiscModule} from "../../misc/misc.module";
import {WebsocketModule} from "../../websocket/websocket.module";
import {WebtoonProvider} from "./providers/webtoon.provider";
import {WebtoonCanvasProvider} from "./providers/webtoon-canvas.provider";
import {StorageModule} from "../../storage/storage.module";

@Module({
    imports: [
        MiscModule,
        WebsocketModule,
        StorageModule,
    ],
    controllers: [
        WebtoonController,
    ],
    providers: [
        WebtoonCanvasProvider,
        WebtoonProvider,
        WebtoonParserService,
        WebtoonDownloaderService,
        WebtoonDatabaseService,
        DownloadManagerService,
    ],
    exports: [
        DownloadManagerService,
        WebtoonDatabaseService,
        WebtoonParserService,
        WebtoonDownloaderService,
    ],
})
export class WebtoonModule{}
