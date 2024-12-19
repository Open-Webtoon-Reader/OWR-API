// noinspection JSUnusedGlobalSymbols

import * as fs from "fs";
import {JSDOM} from "jsdom";
import {ConflictException, Injectable, Logger, NotFoundException} from "@nestjs/common";
import CachedWebtoonModel from "./models/models/cached-webtoon.model";
import WebtoonGenres from "./models/enums/webtoon-genres";
import WebtoonLanguages from "./models/enums/webtoon-languages";
import EpisodeModel from "./models/models/episode.model";
import WebtoonModel from "./models/models/webtoon.model";
import WebtoonBannerModel from "./models/models/webtoon-banner.model";
import {MiscService} from "../../misc/misc.service";

@Injectable()
export class WebtoonParserService{
    private readonly logger: Logger = new Logger(WebtoonParserService.name);
    webtoons: Record<string, CachedWebtoonModel[]> = {};

    constructor(
        private readonly miscService: MiscService,
    ){}

    clearCache(): void{
        if(fs.existsSync("./.cache/webtoons.json"))
            fs.unlinkSync("./.cache/webtoons.json");
        this.webtoons = {};
    }

    async loadCache(): Promise<void>{
        // Load existing cache
        if(fs.existsSync("./.cache/webtoons.json")){
            this.webtoons = JSON.parse(fs.readFileSync("./.cache/webtoons.json").toString());
            const webtoonCount = Object.values(this.webtoons).reduce((acc, val: any) => acc + val.length, 0);
            this.logger.log(`Loaded ${webtoonCount} webtoons from cache!`);
            return;
        }
        this.logger.verbose("Loading webtoon list...");
        // Generate and save cache
        for(const language of Object.values(WebtoonLanguages)){
            this.logger.verbose(`Loading webtoons for language: ${language}`);
            this.webtoons[language] = await this.getWebtoonsFromLanguage(language);
        }
        const webtoonCount = Object.values(this.webtoons).reduce((acc, val: any) => acc + val.length, 0);
        this.logger.verbose(`Loaded ${webtoonCount} webtoons!`);
        // Save cache
        fs.mkdirSync("./.cache", {recursive: true});
        fs.writeFileSync("./.cache/webtoons.json", JSON.stringify(this.webtoons, null, 2));
    }

    private async getWebtoonsFromLanguage(language: string): Promise<CachedWebtoonModel[]>{
        const languageWebtoons: CachedWebtoonModel[] = [];
        const promises: Promise<CachedWebtoonModel[]>[] = [];
        for(const genre of Object.values(WebtoonGenres))
            promises.push(this.getWebtoonsFromGenre(language, genre));
        const genreResults = await Promise.all(promises);
        for(const webtoons of genreResults)
            languageWebtoons.push(...webtoons);
        return this.removeDuplicateWebtoons(languageWebtoons);
    }

    private async getWebtoonsFromGenre(language: string, genre: string): Promise<CachedWebtoonModel[]>{
        const mobileThumbnails = await this.getWebtoonThumbnailFromGenre(language, genre);
        const url = `https://www.webtoons.com/${language}/genres/${genre}`;
        const response = await this.miscService.getAxiosInstance().get(url);
        const document = new JSDOM(response.data).window.document;
        const cards = document.querySelector("ul.card_lst")?.querySelectorAll("li");
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
            let thumbnail = mobileThumbnails.find(t => t.name === title)?.thumbnail;
            if(!thumbnail)
                thumbnail = a.querySelector("img")?.src;
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
            };
            webtoons.push(webtoon);
        }
        return webtoons;
    }

    private async getWebtoonThumbnailFromGenre(language: string, genre: string): Promise<Record<string, string>[]>{
        const mobileThumbnails: Record<string, string>[] = [];
        const mobileUrl = `https://www.webtoons.com/${language}/genres/${genre}`.replace("www.webtoons", "m.webtoons") + "?webtoon-platform-redirect=true";
        const mobileResponse = await this.miscService.getAxiosInstance().get(mobileUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            },
        });
        const mobileDocument = new JSDOM((mobileResponse).data).window.document;
        const className = `genre_${genre.toUpperCase()}_list`;
        const wList = mobileDocument.querySelector(`ul.${className}`)?.querySelectorAll("li");
        if(!wList) return [];
        for(const li of wList){
            const webtoonName = li.querySelector("a")?.querySelector("div.info")?.querySelector("p.subj span")?.textContent;
            const imgLink = li.querySelector("a")?.querySelector("div.pic")?.querySelector("img")?.src;
            if(!webtoonName || !imgLink) continue;
            mobileThumbnails.push({name: webtoonName, thumbnail: imgLink});
        }
        return mobileThumbnails;
    }

    private removeDuplicateWebtoons(webtoons: CachedWebtoonModel[]){
        const webtoonsWithoutDuplicates: CachedWebtoonModel[] = [];
        for(const webtoon of webtoons){
            const existingWebtoon = webtoonsWithoutDuplicates.find(w => w.title === webtoon.title);
            if(existingWebtoon)
                existingWebtoon.genres.push(...webtoon.genres);
            else
                webtoonsWithoutDuplicates.push(webtoon);
        }
        return webtoonsWithoutDuplicates;
    }

    async getWebtoonInfos(webtoon: CachedWebtoonModel): Promise<WebtoonModel>{
        const url = webtoon.link;
        const mobileUrl = url.replace("www.webtoons", "m.webtoons") + "&webtoon-platform-redirect=true";
        const [response, mobileResponse] = await Promise.all([
            this.miscService.getAxiosInstance().get(url),
            this.miscService.getAxiosInstance().get(mobileUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                },
            }),
        ]);
        const document = new JSDOM(response.data).window.document;
        const mobileDocument = new JSDOM(mobileResponse.data).window.document;
        const rawEpCount = document.querySelector("ul#_listUl li a span.tx")?.textContent?.replace("#", "");
        if(!rawEpCount) throw new NotFoundException(`No episode number found for webtoon: ${url}`);
        const epCount = parseInt(rawEpCount);
        return {
            ...webtoon,
            epCount,
            banner: await this.parseWebtoonBanner(document, mobileDocument),
        } as WebtoonModel;
    }

    private async parseWebtoonBanner(webtoonDom: Document, mobileWebtoonDom: Document): Promise<WebtoonBannerModel>{
        const style = webtoonDom.querySelector("div.detail_bg")?.getAttribute("style");
        const backgroundBanner = style?.split("url(")[1].split(")")[0];
        const topBanner = webtoonDom.querySelector("span.thmb")?.querySelector("img")?.src;
        return {
            background: backgroundBanner,
            top: topBanner,
            mobile: await this.parseMobileWebtoonBanner(mobileWebtoonDom),
        } as WebtoonBannerModel;
    }

    private async parseMobileWebtoonBanner(mobileWebtoonDom: Document): Promise<string>{
        const bannerUrl = (mobileWebtoonDom.querySelector("#header")?.getAttribute("style")?.split("url(")[1]?.split(")")[0]) || null;
        if(!bannerUrl) throw new NotFoundException("No banner found on mobile page");
        return bannerUrl;
    }

    async getEpisodes(webtoon: CachedWebtoonModel): Promise<EpisodeModel[]>{
        const baseUrl = webtoon.link.replace(`/list?title_no=${webtoon.id}`, "");
        const url = baseUrl + `/x/viewer?title_no=${webtoon.id}&episode_no=1`;
        const response = await this.miscService.getAxiosInstance().get(url);
        const document = new JSDOM(response.data).window.document;
        const epUl = document.querySelector("div.episode_cont ul");
        const epList = epUl?.querySelectorAll("li");
        if(!epList) throw new NotFoundException(`No episodes found for webtoon: ${url}`);
        const episodes: EpisodeModel[] = [];
        for(const li of epList){
            const a = li.querySelector("a");
            if(!a) continue;
            const link = a.href;
            const thumbnail = a.querySelector("span.thmb img")?.getAttribute("data-url");
            const title = a.querySelector("span.subj")?.textContent;
            if(!title || !link || !thumbnail)
                throw new NotFoundException(`Missing data for episode: ${url}`);
            episodes.push({
                link,
                thumbnail,
                title,
                number: episodes.length + 1,
            } as EpisodeModel);
        }
        return episodes;
    }

    async getEpisodeLinks(webtoon: CachedWebtoonModel, episode: EpisodeModel): Promise<string[]>{
        const baseUrl = webtoon.link.replace(`/list?title_no=${webtoon.id}`, "");
        const url = baseUrl + `/episode-${episode.number}/viewer?title_no=${webtoon.id}&episode_no=${episode.number}`;
        const response = await this.miscService.getAxiosInstance().get(url);
        const htmlContent = response.data;
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        const imagesNode = document.querySelector("div#_imageList");
        const images = imagesNode?.querySelectorAll("img");
        if(!images) throw new NotFoundException(`No images found for episode: ${url}`);
        const links: string[] = [];
        for(let i = 0; i < images.length; i++){
            const image = images[i];
            const link = image.getAttribute("data-url");
            if(!link) throw new NotFoundException(`No link found for image ${i + 1} in episode: ${url}`);
            links.push(link);
        }
        return links;
    }

    findWebtoon(name: string, language: string): CachedWebtoonModel{
        // Try to find one with exact name
        const exactWebtoon: CachedWebtoonModel = this.webtoons[language].find(webtoon => webtoon.title === name);
        if(exactWebtoon)
            return exactWebtoon;
        // Try to find all with lower case
        const lowerCaseWebtoons: CachedWebtoonModel[] = this.webtoons[language].filter(webtoon => webtoon.title.toLowerCase() === name);
        if(lowerCaseWebtoons.length === 1)
            return lowerCaseWebtoons[0];
        // Try with normalized string
        name = this.miscService.normalizeString(name);
        const matchingWebtoons: CachedWebtoonModel[] = this.webtoons[language].filter((webtoon) => {
            const normalizedTitle = this.miscService.normalizeString(webtoon.title);
            return normalizedTitle.includes(name);
        });
        if(matchingWebtoons.length === 0)
            throw new NotFoundException("Webtoon not found");
        else if(matchingWebtoons.length > 1)
            throw new ConflictException("Many webtoons found, please be more specific");
        else
            return matchingWebtoons[0];
    }
}
