import WebtoonProviderEnum from "../models/enums/webtoon-provider.enum";
import CachedWebtoonModel from "../models/models/cached-webtoon.model";
import WebtoonBannerModel from "../models/models/webtoon-banner.model";
import {Injectable, Logger, NotFoundException} from "@nestjs/common";
import EpisodeModel from "../models/models/episode.model";
import WebtoonModel from "../models/models/webtoon.model";
import {MiscService} from "../../../misc/misc.service";
import {AxiosResponse} from "axios";
import {JSDOM} from "jsdom";

@Injectable()
export class WebtoonProvider{
    private readonly logger: Logger = new Logger(WebtoonProvider.name);
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
    ){}

    async parse(): Promise<Record<string, CachedWebtoonModel[]>>{
        let webtoons: Record<string, CachedWebtoonModel[]> = {};
        this.logger.verbose("(Webtoon) Loading webtoon list...");
        const selectedLanguages: string[] = this.languages.filter(l => process.env.IGNORED_LANGUAGES?.split(";").indexOf(l) === -1);
        // Generate and save cache
        for(const language of selectedLanguages){
            this.logger.verbose(`(Webtoon) Loading webtoons for language: ${language}`);
            webtoons[language] = await this.getWebtoonsFromLanguage(language);
        }
        const webtoonCount = Object.values(webtoons).reduce((acc, val: any) => acc + val.length, 0);
        this.logger.verbose(`(Webtoon) Loaded ${webtoonCount} webtoons!`);
        return webtoons;
    }

    private async getWebtoonsFromLanguage(language: string): Promise<CachedWebtoonModel[]>{
        const languageWebtoons: CachedWebtoonModel[] = [];
        const promises: Promise<CachedWebtoonModel[]>[] = [];
        for(const genre of this.genres){
            promises.push((async() => {
                while(true){
                    try{
                        return await this.getWebtoonsFromGenre(language, genre);
                    }catch(err){
                        this.logger.error(`Erreur lors de la récupération du genre "${genre}":`, err);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            })());
        }
        const genreResults = await Promise.all(promises);
        for(const webtoons of genreResults){
            languageWebtoons.push(...webtoons);
        }

        return this.removeDuplicateWebtoons(languageWebtoons);
    }

    private async getWebtoonsFromGenre(language: string, genre: string): Promise<CachedWebtoonModel[]>{
        const mobileThumbnails = await this.getWebtoonThumbnailFromGenre(language, genre);
        const url = `https://www.webtoons.com/${language}/genres/${genre}`;
        const response = await this.miscService.axiosWithHardTimeout(
            signal =>
                this.miscService.getAxiosInstance().get(url, {
                    signal,
                }),
            20000,
        );
        const document = new JSDOM(response.data).window.document;
        const cards = document.querySelector("ul.webtoon_list")?.querySelectorAll("li");
        if(!cards){
            this.logger.warn(`No webtoons found for genre: ${genre} in language: ${language}`);
            return [];
        }
        const webtoons = [];
        for(const li of cards){
            const a = li.querySelector("a");
            if(!a) continue;
            const title = a.querySelector(".info_text .title")?.textContent;
            const author = a.querySelector(".info_text .author")?.textContent;
            const stars = a.querySelector(".info_text .view_count")?.textContent;
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
                provider: WebtoonProviderEnum.WEBTOON,
            };
            webtoons.push(webtoon);
        }
        return webtoons;
    }

    private async getWebtoonThumbnailFromGenre(language: string, genre: string): Promise<Record<string, string>[]>{
        const mobileThumbnails: Record<string, string>[] = [];
        const mobileUrl = `https://www.webtoons.com/${language}/genres/${genre}`.replace("www.webtoons", "m.webtoons") + "?webtoon-platform-redirect=true";
        const mobileResponse = await this.miscService.axiosWithHardTimeout(
            signal =>
                this.miscService.getAxiosInstance().get(mobileUrl, {
                    signal,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                    },
                }),
            20000,
        );
        const mobileDocument = new JSDOM((mobileResponse).data).window.document;
        const className = `genre_${genre.toUpperCase()}_list`;
        const wList = mobileDocument.querySelector(`ul.${className}`)?.querySelectorAll("li");
        if(!wList) return [];
        for(const li of wList){
            const webtoonName: string = li.querySelector("a")?.querySelector("div.info")?.querySelector("p.subj span")?.textContent;
            const imgLink: string = li.querySelector("a")?.querySelector("div.pic")?.querySelector("img")?.src;
            if(!webtoonName || !imgLink) continue;
            mobileThumbnails.push({name: webtoonName, thumbnail: imgLink});
        }
        return mobileThumbnails;
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
        const url = webtoon.link;
        const mobileUrl = url.replace("www.webtoons", "m.webtoons") + "&webtoon-platform-redirect=true";

        while(true){
            try{
                const [response, mobileResponse] = await Promise.all([
                    this.miscService.axiosWithHardTimeout(
                        signal =>
                            this.miscService.getAxiosInstance().get(url, {signal}),
                        20000,
                    ),
                    this.miscService.axiosWithHardTimeout(
                        signal =>
                            this.miscService.getAxiosInstance().get(mobileUrl, {
                                signal,
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                                },
                            }),
                        20000,
                    ),
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
            }catch(err){
                this.logger.error(`Error while retrieving information for the webtoon "${webtoon.link}":`, err);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private async parseWebtoonBanner(webtoonDom: Document, mobileWebtoonDom: Document): Promise<WebtoonBannerModel>{
        const style = webtoonDom.querySelector("div.detail_bg")?.getAttribute("style");
        const backgroundBanner = style?.split("url(")[1].split(")")[0].replaceAll("'", "");
        const topBanner = webtoonDom.querySelector("span.thmb")?.querySelector("img")?.src.replaceAll("'", "");
        return {
            background: backgroundBanner,
            top: topBanner,
            mobile: await this.parseMobileWebtoonBanner(mobileWebtoonDom),
        } as WebtoonBannerModel;
    }

    private async parseMobileWebtoonBanner(mobileWebtoonDom: Document): Promise<string | undefined>{
        const bannerUrl: string | undefined = (mobileWebtoonDom.querySelector("#header")?.getAttribute("style")?.split("url(")[1]?.split(")")[0]) || undefined;
        return bannerUrl?.replaceAll("'", "");
    }

    async getEpisodes(webtoon: CachedWebtoonModel): Promise<EpisodeModel[]>{
        const baseUrl: string = webtoon.link.replace(`/list?title_no=${webtoon.id}`, "");
        let url: string;
        let response: AxiosResponse;
        let error: Error | undefined;
        let currentEpisode: number = 1;
        do{
            error = undefined;
            url = baseUrl + `/x/viewer?title_no=${webtoon.id}&episode_no=${currentEpisode}`;
            try{
                response = await this.miscService.axiosWithHardTimeout(
                    signal =>
                        this.miscService.getAxiosInstance().get(url, {
                            signal,
                        }),
                    20000,
                );
            }catch(e: any){
                this.logger.debug(`Failed to fetch episode ${currentEpisode}, trying episode  ${currentEpisode + 1}`);
                error = e;
                currentEpisode++;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }while(error);
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
                number: currentEpisode,
            } as EpisodeModel);
            currentEpisode++;
        }
        return episodes;
    }

    async getEpisodeLinks(webtoon: CachedWebtoonModel, episode: EpisodeModel): Promise<string[]>{
        const baseUrl = webtoon.link.replace(`/list?title_no=${webtoon.id}`, "");
        const url = baseUrl + `/episode-${episode.number}/viewer?title_no=${webtoon.id}&episode_no=${episode.number}`;
        const response = await this.miscService.axiosWithHardTimeout(
            signal =>
                this.miscService.getAxiosInstance().get(url, {
                    signal,
                }),
            20000,
        );
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
}
