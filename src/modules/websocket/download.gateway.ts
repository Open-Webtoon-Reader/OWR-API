import {SubscribeMessage, WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import {Server} from "socket.io";
import {AsyncApiSub} from "nestjs-asyncapi";
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
    @AsyncApiSub({
        channel: "download/episode/progress",
        message: {
            payload: Number,
        },
    })
    public onEpisodeProgress(progress: number){
        this.socket.emit("episode/progress", progress);
    }

    @SubscribeMessage("progress")
    @AsyncApiSub({
        channel: "download/progress",
        message: {
            payload: Number,
        },
    })
    public onDownloadProgress(progress: number){
        this.socket.emit("progress", progress);
    }

    @SubscribeMessage("start")
    @AsyncApiSub({
        channel: "download/start",
        message: {
            payload: CachedWebtoonModel,
        },
    })
    public onDownloadStart(webtoon: CachedWebtoonModel){
        this.socket.emit("start", webtoon);
    }
}
