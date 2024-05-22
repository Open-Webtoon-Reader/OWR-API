import {WebtoonDatabaseService} from "./webtoon-database.service";
import {WebtoonDownloaderService} from "./webtoon-downloader.service";
import {WebtoonParserService} from "./webtoon-parser.service";
import CachedWebtoonModel from "./models/models/cached-webtoon.model";
import EpisodeModel from "./models/models/episode.model";
import EpisodeDataModel from "./models/models/episode-data.model";
import {HttpException, Injectable, NotFoundException} from "@nestjs/common";
import WebtoonModel from "./models/models/webtoon.model";
import WebtoonDataModel from "./models/models/webtoon-data.model";
import WebtoonQueue from "../../../common/utils/models/webtoon-queue";
import {HttpStatusCode} from "axios";

@Injectable()
export class DownloadManagerService{

    private cacheLoaded: boolean = false;
    private readonly cachePromise: Promise<void>;
    private readonly queue: WebtoonQueue;
    private currentDownload: CachedWebtoonModel | undefined;

    constructor(
        private readonly webtoonParser: WebtoonParserService,
        private readonly webtoonDatabase: WebtoonDatabaseService,
        private readonly webtoonDownloader: WebtoonDownloaderService,
    ){
        this.queue = new WebtoonQueue();
        this.cachePromise = this.webtoonParser.loadCache();
        this.cachePromise.then(() => this.cacheLoaded = true);
    }

    async awaitCache(): Promise<void>{
        return this.cachePromise;
    }

    async addWebtoonToQueue(webtoonName: string, language = "en"): Promise<void>{
        if(!this.cacheLoaded)
            throw new Error("Cache not loaded.");
        const webtoonOverview: CachedWebtoonModel = this.webtoonParser.findWebtoon(webtoonName, language);
        // If webtoon already in queue, do nothing
        if(this.queue.getElements().find(w => w.title === webtoonOverview.title))
            return;
        // If queue is empty, start download
        this.queue.enqueue(webtoonOverview);
        if(!this.currentDownload)
            this.startDownload().then(() => console.log("Download finished."));
    }

    async updateAllWebtoons(): Promise<void>{
        if(!this.cacheLoaded)
            throw new HttpException("Cache not loaded.", HttpStatusCode.TooEarly);
        for(const webtoonLanguageName of await this.webtoonDatabase.getWebtoonList()){
            const webtoonLanguage: CachedWebtoonModel[] = this.webtoonParser.webtoons[webtoonLanguageName.language];
            this.queue.enqueue(webtoonLanguage.find(w => w.title === webtoonLanguageName.title) as CachedWebtoonModel);
        }
        if(!this.currentDownload)
            this.startDownload().then(() => console.log("Download finished."));
    }

    private async startDownload(): Promise<void>{
        if(!this.cacheLoaded)
            throw new HttpException("Cache not loaded.", HttpStatusCode.TooEarly);
        while(!this.queue.isEmpty()){
            this.currentDownload = this.queue.dequeue();
            if(!this.currentDownload)
                return;
            console.log(`Downloading ${this.currentDownload.title} (${this.currentDownload.language}).`);
            if(!await this.webtoonDatabase.isWebtoonSaved(this.currentDownload.title, this.currentDownload.language)){
                const webtoon: WebtoonModel = await this.webtoonParser.getWebtoonInfos(this.currentDownload);
                const webtoonData: WebtoonDataModel = await this.webtoonDownloader.downloadWebtoon(webtoon);
                await this.webtoonDatabase.saveWebtoon(webtoon, webtoonData);
            }
            const startEpisode: number = await this.webtoonDatabase.getLastSavedEpisodeNumber(this.currentDownload.title, this.currentDownload.language);
            const epList: EpisodeModel[] = await this.webtoonParser.getEpisodes(this.currentDownload);
            for(let i = startEpisode; i < epList.length; i++){
                if(!this.currentDownload)
                    break;
                const epImageLinks: string[] = await this.webtoonParser.getEpisodeLinks(this.currentDownload, epList[i]);
                const episodeData: EpisodeDataModel = await this.webtoonDownloader.downloadEpisode(epList[i], epImageLinks);
                if(!this.currentDownload)
                    break;
                await this.webtoonDatabase.saveEpisode(this.currentDownload, epList[i], episodeData);
            }
        }
        this.currentDownload = undefined;
    }

    getCurrentDownload(): CachedWebtoonModel | undefined{
        if(this.currentDownload)
            return this.currentDownload;
        throw new NotFoundException("No download in progress.");
    }

    getDownloadQueue(): CachedWebtoonModel[]{
        if(!this.currentDownload)
            throw new NotFoundException("No download in progress.");;
        return [this.currentDownload, ...this.queue.getElements()];
    }

    skipCurrentDownload(): void{
        this.currentDownload = undefined;
    }

    clearDownloadQueue(){
        this.queue.clear();
        this.currentDownload = undefined;
    }
}
