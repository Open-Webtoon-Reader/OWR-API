import CachedWebtoonModel from "../../../modules/webtoon/webtoon/models/models/cached-webtoon.model";
import * as fs from "node:fs";

export default class DownloadQueue{
    queuedDownloads: CachedWebtoonModel[];
    currentDownload: CachedWebtoonModel | undefined;

    constructor(){
        this.queuedDownloads = [];
        this.currentDownload = undefined;
    }

    reset(){
        if(this.currentDownload)
            this.queuedDownloads.unshift(this.currentDownload);
    }

    enqueue(element: CachedWebtoonModel): void{
        if(this.isInQueue(element))
            return;
        this.queuedDownloads.push(element);
        this.saveQueue();
    }

    dequeue(): CachedWebtoonModel | null{
        if(this.isQueueEmpty())
            return null;
        this.currentDownload = this.queuedDownloads.shift();
        this.saveQueue();
        return this.currentDownload;
    }

    isInQueue(element: CachedWebtoonModel): boolean{
        return this.queuedDownloads.find(w => w.title === element.title && w.language === element.language) !== undefined;
    }

    isQueueEmpty(): boolean{
        return this.queuedDownloads.length === 0;
    }

    clear(): void{
        this.queuedDownloads = [];
        this.currentDownload = undefined;
        this.saveQueue();
    }

    clearCurrentDownload(): void{
        this.currentDownload = undefined;
        this.saveQueue();
    }

    getQueue(): CachedWebtoonModel[]{
        return this.queuedDownloads;
    }

    getCurrentDownload(): CachedWebtoonModel | undefined{
        return this.currentDownload;
    }

    saveQueue(): void{
        const jsonQueue = JSON.stringify(this, null, 2);
        fs.writeFileSync("./.cache/download_queue.json", jsonQueue);
    }

    static loadQueue(): DownloadQueue{
        if(!fs.existsSync("./.cache/download_queue.json"))
            return new DownloadQueue();
        const queueFile: Buffer = fs.readFileSync("./.cache/download_queue.json");
        const queue = JSON.parse(queueFile.toString());
        const webtoonQueue = new DownloadQueue();
        webtoonQueue.queuedDownloads = queue.queuedDownloads;
        webtoonQueue.currentDownload = queue.currentDownload;
        return webtoonQueue;
    }
}
