import {WebtoonDatabaseService} from "./webtoon-database.service";
import {WebtoonDownloaderService} from "./webtoon-downloader.service";
import {WebtoonParserService} from "./webtoon-parser.service";
import CachedWebtoonModel from "./models/models/cached-webtoon.model";
import EpisodeModel from "./models/models/episode.model";
import EpisodeDataModel from "./models/models/episode-data.model";
import {HttpException, Injectable, Logger, NotFoundException} from "@nestjs/common";
import WebtoonModel from "./models/models/webtoon.model";
import WebtoonDataModel from "./models/models/webtoon-data.model";
import {HttpStatusCode} from "axios";
import DownloadQueue from "../../../common/utils/models/download-queue";
import {DownloadGateway} from "../../websocket/download.gateway";

@Injectable()
export class DownloadManagerService{

    private readonly logger = new Logger(DownloadManagerService.name);

    private cacheLoaded: boolean = false;
    private cachePromise: Promise<void>;
    private readonly downloadQueue: DownloadQueue;

    constructor(
        private readonly webtoonParser: WebtoonParserService,
        private readonly webtoonDatabase: WebtoonDatabaseService,
        private readonly webtoonDownloader: WebtoonDownloaderService,
        private readonly downloadGateway: DownloadGateway,
    ){
        this.downloadQueue = DownloadQueue.loadQueue();
        // If there are downloads in queue, start download
        let downloadInProgress = false;
        if(this.downloadQueue.getCurrentDownload() || this.downloadQueue.getQueue().length > 0){
            this.downloadQueue.reset();
            downloadInProgress = true;
        }
        this.cachePromise = this.webtoonParser.loadCache();
        this.cachePromise.then(() => {
            this.cacheLoaded = true;
            if(downloadInProgress)
                this.startDownload().then(() => console.log("Download finished."));
        });
    }

    async awaitCache(): Promise<void>{
        return this.cachePromise;
    }

    async refreshCache(): Promise<void>{
        if(!this.cacheLoaded)
            throw new HttpException("Cache already loading.", HttpStatusCode.TooEarly);
        this.cacheLoaded = false;
        this.webtoonParser.clearCache();
        this.cachePromise = this.webtoonParser.loadCache();
        this.cachePromise.then(() => {
            this.cacheLoaded = true;
        });
    }

    async addWebtoonToQueue(webtoonName: string, language = "en"): Promise<void>{
        if(!this.cacheLoaded)
            throw new HttpException("Cache already loading.", HttpStatusCode.TooEarly);
        const webtoonOverview: CachedWebtoonModel = this.webtoonParser.findWebtoon(webtoonName, language);
        // If queue is empty, start download
        this.downloadQueue.enqueue(webtoonOverview);
        if(!this.downloadQueue.getCurrentDownload())
            this.startDownload().then(() => console.log("Download finished."));
    }

    async updateAllWebtoons(): Promise<void>{
        if(!this.cacheLoaded)
            throw new HttpException("Cache not loaded.", HttpStatusCode.TooEarly);
        for(const webtoonLanguageName of await this.webtoonDatabase.getWebtoonList()){
            const webtoonLanguage: CachedWebtoonModel[] = this.webtoonParser.webtoons[webtoonLanguageName.language];
            this.downloadQueue.enqueue(webtoonLanguage.find(w => w.title === webtoonLanguageName.title) as CachedWebtoonModel);
        }
        if(!this.downloadQueue.getCurrentDownload())
            this.startDownload().then(() => console.log("Download finished."));
    }

    private async startDownload(): Promise<void>{
        if(!this.cacheLoaded)
            throw new HttpException("Cache not loaded.", HttpStatusCode.TooEarly);
        while(!this.downloadQueue.isQueueEmpty()){
            await this.cachePromise; // Wait for cache to be loaded if it is cleared
            const currentDownload: CachedWebtoonModel = this.downloadQueue.dequeue();
            if(!currentDownload)
                return;
            this.logger.debug(`Downloading ${this.downloadQueue.getCurrentDownload().title} (${this.downloadQueue.getCurrentDownload().language}).`);
            this.downloadGateway.onDownloadStart(currentDownload);
            if(!await this.webtoonDatabase.isWebtoonSaved(this.downloadQueue.getCurrentDownload().title, this.downloadQueue.getCurrentDownload().language)){
                const webtoon: WebtoonModel = await this.webtoonParser.getWebtoonInfos(this.downloadQueue.getCurrentDownload());
                const webtoonData: WebtoonDataModel = await this.webtoonDownloader.downloadWebtoon(webtoon);
                await this.webtoonDatabase.saveWebtoon(webtoon, webtoonData);
            }
            const startEpisode: number = await this.webtoonDatabase.getLastSavedEpisodeNumber(this.downloadQueue.getCurrentDownload().title, this.downloadQueue.getCurrentDownload().language);
            const epList: EpisodeModel[] = await this.webtoonParser.getEpisodes(this.downloadQueue.getCurrentDownload());
            for(let i = startEpisode; i < epList.length; i++){
                if(!this.downloadQueue.getCurrentDownload()) // If current download is cleared, stop downloading
                    break;
                this.downloadGateway.onDownloadProgress(i / epList.length * 100);
                const epImageLinks: string[] = await this.webtoonParser.getEpisodeLinks(this.downloadQueue.getCurrentDownload(), epList[i]);
                const episodeData: EpisodeDataModel = await this.webtoonDownloader.downloadEpisode(epList[i], epImageLinks);
                await this.webtoonDatabase.saveEpisode(currentDownload, epList[i], episodeData);
            }
        }
        this.downloadQueue.clear();
        this.downloadGateway.onDownloadStart(null);
    }

    getCurrentDownload(): CachedWebtoonModel{
        if(this.downloadQueue.getCurrentDownload())
            return this.downloadQueue.getCurrentDownload();
        throw new NotFoundException("No download in progress.");
    }

    getDownloadQueue(): CachedWebtoonModel[]{
        if(!this.downloadQueue.getCurrentDownload() && this.downloadQueue.getQueue().length === 0)
            throw new NotFoundException("No download in progress.");
        if(this.downloadQueue.getCurrentDownload())
            return [this.downloadQueue.getCurrentDownload(), ...this.downloadQueue.getQueue()];
        return this.downloadQueue.getQueue();
    }

    skipCurrentDownload(): void{
        this.downloadQueue.clearCurrentDownload();
    }

    clearDownloadQueue(){
        this.downloadQueue.clear();
    }
}
