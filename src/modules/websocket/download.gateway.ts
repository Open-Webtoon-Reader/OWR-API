import {SubscribeMessage, WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import {Server} from "socket.io";
import CachedWebtoonModel from "../webtoon/webtoon/models/models/cached-webtoon.model";

@WebSocketGateway({
    namespace: "download",
    cors: {
        origin: "*",
    }
})
export class DownloadGateway{

    @WebSocketServer() socket: Server;

    @SubscribeMessage("episode/progress")
    public onEpisodeProgress(progress: number){
        this.socket.emit("episode/progress", progress);
    }

    @SubscribeMessage("progress")
    public onDownloadProgress(progress: number){
        this.socket.emit("progress", progress);
    }

    @SubscribeMessage("start")
    public onDownloadStart(webtoon: CachedWebtoonModel){
        this.socket.emit("start", webtoon);
    }
}
