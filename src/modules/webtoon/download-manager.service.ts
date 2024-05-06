import WebtoonQueue from "../../common/utils/models/webtoon-queue";
import {WebtoonDatabaseService} from "./webtoon-database.service";
import {WebtoonDownloaderService} from "./webtoon-downloader.service";
import {WebtoonParserService} from "./webtoon-parser.service";
import CachedWebtoonModel from "./models/models/cached-webtoon.model";
import EpisodeModel from "./models/models/episode.model";
import EpisodeDataModel from "./models/models/episode-data.model";
import {Injectable} from "@nestjs/common";
import WebtoonModel from "./models/models/webtoon.model";
import WebtoonDataModel from "./models/models/webtoon-data.model";

@Injectable()
export class DownloadManagerService{

    private cacheLoaded: boolean = false;
    private readonly cachePromise: Promise<void>;
    private readonly queue: WebtoonQueue;

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
        const webtoonOverview: CachedWebtoonModel = this.webtoonParser.findWebtoon(this.webtoonParser.webtoons[language], webtoonName);
        // If webtoon already in queue, do nothing
        if(this.queue.getElements().find(w => w.title === webtoonOverview.title))
            return;
        // If queue is empty, start download
        const empty: boolean = this.queue.isEmpty();
        this.queue.enqueue(webtoonOverview);
        if(empty)
            this.startDownload().then(() => console.log("Download finished."));
    }

    async updateAllWebtoons(): Promise<void>{
        if(!this.cacheLoaded)
            throw new Error("Cache not loaded.");
        for(const webtoonLanguageName of await this.webtoonDatabase.getWebtoonList()){
            const webtoonLanguage: CachedWebtoonModel[] = this.webtoonParser.webtoons[webtoonLanguageName.language];
            const empty: boolean = this.queue.isEmpty();
            this.queue.enqueue(webtoonLanguage.find(w => w.title === webtoonLanguageName.title) as CachedWebtoonModel);
            if(empty)
                this.startDownload().then(() => console.log("Download finished."));
        }
    }

    private async startDownload(): Promise<void>{
        while(!this.queue.isEmpty()){
            const webtoonOverview: CachedWebtoonModel | undefined = this.queue.dequeue();
            if(!webtoonOverview)
                return;
            if(!await this.webtoonDatabase.isWebtoonSaved(webtoonOverview.title)){
                const webtoon: WebtoonModel = await this.webtoonParser.getWebtoonInfos(webtoonOverview);
                const webtoonData: WebtoonDataModel = await this.webtoonDownloader.downloadWebtoon(webtoon);
                await this.webtoonDatabase.saveWebtoon(webtoon, webtoonData);
            }
            const startEpisode: number = await this.webtoonDatabase.getLastSavedEpisodeNumber(webtoonOverview.title);
            const epList: EpisodeModel[] = await this.webtoonParser.getEpisodes(webtoonOverview);
            for(let i = startEpisode; i < epList.length; i++){
                const epImageLinks: string[] = await this.webtoonParser.getEpisodeLinks(webtoonOverview, epList[i]);
                const episodeData: EpisodeDataModel = await this.webtoonDownloader.downloadEpisode(epList[i], epImageLinks);
                await this.webtoonDatabase.saveEpisode(webtoonOverview, epList[i], episodeData);
            }
        }
    }
}
