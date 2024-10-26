import {Module} from "@nestjs/common";
import {DownloadGateway} from "./download.gateway";

@Module({
    providers: [DownloadGateway],
    exports: [DownloadGateway],
})
export class WebsocketModule{}
