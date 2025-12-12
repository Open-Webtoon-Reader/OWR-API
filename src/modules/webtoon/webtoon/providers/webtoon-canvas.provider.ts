import WebtoonProviderEnum from "../models/enums/webtoon-provider.enum";
import CachedWebtoonModel from "../models/models/cached-webtoon.model";
import {Injectable, Logger, NotFoundException} from "@nestjs/common";
import {MiscService} from "../../../misc/misc.service";
import EpisodeModel from "../models/models/episode.model";
import WebtoonModel from "../models/models/webtoon.model";
import {WebtoonProvider} from "./webtoon.provider";
import {JSDOM} from "jsdom";

@Injectable()
export class WebtoonCanvasProvider{
    private readonly logger: Logger = new Logger(WebtoonCanvasProvider.name);
    private readonly languages: string[] = ["fr", "en", "es", "zh-hant", "th", "de", "id"];
    private readonly genres: string[] = [
        "drama", "fantasy", "comedy", "action", "slice_of_life", "romance",
        "super_hero", "thriller", "sports", "sf", "horror", "tiptoon",
        "local", "school", "martial_arts", "bl_gl", "romance_m", "time_slip",
        "city_office", "mystery", "heartwarming", "shonen", "eastern_palace",
        "web_novel", "western_palace", "adaptation", "supernatural",
        "historical", "romantic_fantasy",
    ];

    constructor(
        private readonly miscService: MiscService,
        private readonly webtoonProvider: WebtoonProvider,
    ){}

    async parse(): Promise<Record<string, CachedWebtoonModel[]>>{
        this.logger.verbose("(Webtoon) Loading webtoon list...");
        const selectedLanguages: string[] = this.languages.filter(l => process.env.IGNORED_LANGUAGES?.split(";").indexOf(l) === -1);
        const entries = await Promise.all(
            selectedLanguages.map(async(language) => {
                this.logger.verbose(`(Webtoon Canvas) Loading webtoons for language: ${language}`);
                const webtoons = await this.getWebtoonsFromLanguage(language);
                return [language, webtoons] as [string, CachedWebtoonModel[]];
            }),
        );
        const webtoons = Object.fromEntries(entries);
        const webtoonCount = Object.values(webtoons).reduce((acc, val) => acc + val.length, 0);
        this.logger.verbose(`(Webtoon Canvas) Loaded ${webtoonCount} webtoons!`);
        return webtoons;
    }

    private async getWebtoonsFromLanguage(language: string): Promise<CachedWebtoonModel[]>{
        const languageWebtoons: CachedWebtoonModel[] = [];
        for(const genre of this.genres){
            this.logger.verbose(`(Webtoon Canvas) [${language}] Loading webtoons from genre: ${genre}`);
            languageWebtoons.push(...(await this.getWebtoonsFromGenre(language, genre)));
        }
        return this.removeDuplicateWebtoons(languageWebtoons);
    }

    private async getPageCountFromGenre(
        language: string,
        genre: string,
    ): Promise<number>{
        const url = `https://www.webtoons.com/${language}/canvas/list?genreTab=${genre.toUpperCase()}&page=999999999`;
        const response = await this.miscService.getAxiosInstance().get(url);
        const document = new JSDOM(response.data).window.document;

        const paginate = document.querySelector("div.paginate");
        if(!paginate){
            throw new NotFoundException(`No pagination found for genre: ${genre}`);
        }

        const pageNumbers = Array.from(
            paginate.querySelectorAll("a span"),
        )
            .map(span => span.textContent?.trim())
            .filter(text => text && /^\d+$/.test(text))
            .map(text => Number(text));

        if(pageNumbers.length === 0){
            throw new NotFoundException(`No page numbers found for genre: ${genre}`);
        }

        return Math.max(...pageNumbers);
    }

    private async getWebtoonsFromGenre(language: string, genre: string): Promise<CachedWebtoonModel[]>{
        let error: Error;
        let pageCount: number;
        do{
            error = undefined;
            try{
                pageCount = await this.getPageCountFromGenre(language, genre);
            }catch(e){
                error = e;
                console.log(e);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }while(error);
        pageCount = Math.min(parseInt(process.env.WEBTOON_CANVAS_MAX_PAGES || "999999999"), pageCount);
        const webtoons: CachedWebtoonModel[] = [];
        let currentBatchSize = 10;
        let batchStart = 1;

        while(batchStart <= pageCount){
            const batchEnd: number = Math.min(batchStart + currentBatchSize - 1, pageCount);
            this.logger.debug(`(Webtoon Canvas) [${language}] Loading webtoons from genre: ${genre} - pages ${batchStart} to ${batchEnd}`);
            try{
                const batchPromises: Promise<CachedWebtoonModel[]>[] = [];
                for(let i: number = batchStart; i <= batchEnd; i++)
                    batchPromises.push(this.getWebtoonsFromGenrePage(language, genre, i));
                const batchResults: CachedWebtoonModel[][] = await Promise.all(batchPromises);
                for(const page of batchResults)
                    webtoons.push(...page);
                await new Promise(resolve => setTimeout(resolve, this.miscService.randomInt(2300, 2700)));
                batchStart += currentBatchSize;
            }catch(e){
                this.logger.error(`(Webtoon Canvas) [${language}] Error while loading webtoons from genre: ${genre} - ${e.message}`);
                currentBatchSize = Math.max(1, Math.floor(currentBatchSize - 1));
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        return webtoons;
    }

    private async getWebtoonsFromGenrePage(language: string, genre: string, page: number): Promise<CachedWebtoonModel[]>{
        const url = `https://www.webtoons.com/${language}/canvas/list?genreTab=${genre.toUpperCase()}&sortOrder=LIKEIT&page=${page}`;
        const response = await this.miscService.getAxiosInstance().get(url);
        const document = new JSDOM(response.data).window.document;
        const cards = document.querySelector("div.challenge_lst")?.querySelector("ul")?.querySelectorAll("li");
        if(!cards) throw new NotFoundException(`No cards found for genre: ${genre}`);
        const webtoons = [];
        for(const li of cards){
            const a = li.querySelector("a");
            if(!a) continue;
            const title = a.querySelector("p.subj")?.textContent;
            const author = a.querySelector("p.author")?.textContent;
            const stars = a.querySelector("p.grade_area")?.querySelector("em")?.textContent;
            const link = a.href;
            const id = link.split("?title_no=")[1];
            const thumbnail = a.querySelector("span")?.querySelector("img")?.src;
            if(!title || !author || !stars || !link || !thumbnail || !id)
                throw new NotFoundException(`Missing data for webtoon: ${url}`);
            const webtoon: CachedWebtoonModel = {
                title,
                author,
                link,
                thumbnail,
                stars: this.miscService.parseWebtoonStars(stars),
                genres: [genre],
                id,
                language,
                provider: WebtoonProviderEnum.WEBTOON_CANVAS,
            };
            webtoons.push(webtoon);
        }
        return webtoons;
    }

    private removeDuplicateWebtoons(webtoons: CachedWebtoonModel[]): CachedWebtoonModel[]{
        const webtoonsWithoutDuplicates: CachedWebtoonModel[] = [];
        for(const webtoon of webtoons){
            const existingWebtoon: CachedWebtoonModel = webtoonsWithoutDuplicates.find(w => w.title === webtoon.title);
            if(existingWebtoon)
                existingWebtoon.genres.push(...webtoon.genres);
            else
                webtoonsWithoutDuplicates.push(webtoon);
        }
        return webtoonsWithoutDuplicates;
    }

    async getWebtoonInfos(webtoon: CachedWebtoonModel): Promise<WebtoonModel>{
        return await this.webtoonProvider.getWebtoonInfos(webtoon);
    }

    async getEpisodes(webtoon: CachedWebtoonModel): Promise<EpisodeModel[]>{
        return await this.webtoonProvider.getEpisodes(webtoon);
    }

    async getEpisodeLinks(webtoon: CachedWebtoonModel, episode: EpisodeModel): Promise<string[]>{
        return await this.webtoonProvider.getEpisodeLinks(webtoon, episode);
    }
}
