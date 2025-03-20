// noinspection JSUnusedGlobalSymbols

import * as fs from "fs";
import {ConflictException, Injectable, Logger, NotFoundException} from "@nestjs/common";
import CachedWebtoonModel from "./models/models/cached-webtoon.model";
import WebtoonLanguages from "./models/enums/webtoon-languages";
import {MiscService} from "../../misc/misc.service";
import EpisodeModel from "./models/models/episode.model";
import {WebtoonProvider} from "./providers/webtoon.provider";
import WebtoonProviderEnum from "./models/enums/webtoon-provider.enum";
import WebtoonModel from "./models/models/webtoon.model";

@Injectable()
export class WebtoonParserService{
    private readonly logger: Logger = new Logger(WebtoonParserService.name);
    webtoons: Record<string, CachedWebtoonModel[]> = {};

    constructor(
        private readonly miscService: MiscService,
        private readonly webtoonProvider: WebtoonProvider,
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
            const webtoonCount: number = Object.values(this.webtoons)
                .reduce((acc: number, val: CachedWebtoonModel[]) => acc + val.length, 0);
            this.logger.log(`Loaded ${webtoonCount} webtoons from cache!`);
            return;
        }
        this.logger.verbose("Loading webtoon list...");
        // Generate and save cache
        const webtoons: Record<string, CachedWebtoonModel[]> = await this.webtoonProvider.parse();
        for(const language of Object.values(WebtoonLanguages)){
            this.logger.verbose(`Loading webtoons for language: ${language}`);
            if(!this.webtoons[language])
                this.webtoons[language] = [];
            this.webtoons[language] = [...this.webtoons[language], ...webtoons[language]];
        }
        const webtoonCount = Object.values(this.webtoons)
            .reduce((acc, val: any) => acc + val.length, 0);
        this.logger.verbose(`Loaded ${webtoonCount} webtoons!`);
        // Save cache
        fs.mkdirSync("./.cache", {recursive: true});
        fs.writeFileSync("./.cache/webtoons.json", JSON.stringify(this.webtoons, null, 2));
    }

    async getWebtoonInfos(webtoon: CachedWebtoonModel): Promise<WebtoonModel>{
        switch (webtoon.provider){
            case WebtoonProviderEnum.WEBTOON:
                return this.webtoonProvider.getWebtoonInfos(webtoon);
        }
    }

    async getEpisodes(webtoon: CachedWebtoonModel): Promise<EpisodeModel[]>{
        switch (webtoon.provider){
            case WebtoonProviderEnum.WEBTOON:
                return this.webtoonProvider.getEpisodes(webtoon);
        }
    }

    async getEpisodeLinks(webtoon: CachedWebtoonModel, episode: EpisodeModel): Promise<string[]>{
        switch (webtoon.provider){
            case WebtoonProviderEnum.WEBTOON:
                return this.webtoonProvider.getEpisodeLinks(webtoon, episode);
        }
    }

    findWebtoon(name: string, language: string): CachedWebtoonModel{
        // Try to find one with exact name
        const exactWebtoon: CachedWebtoonModel = this.webtoons[language]
            .find((webtoon: CachedWebtoonModel) => webtoon.title === name);
        if(exactWebtoon)
            return exactWebtoon;
        // Try to find all with lower case
        const lowerCaseWebtoons: CachedWebtoonModel[] = this.webtoons[language]
            .filter((webtoon: CachedWebtoonModel) => webtoon.title.toLowerCase() === name);
        if(lowerCaseWebtoons.length === 1)
            return lowerCaseWebtoons[0];
        // Try with normalized string
        name = this.miscService.normalizeString(name);
        const matchingWebtoons: CachedWebtoonModel[] = this.webtoons[language]
            .filter((webtoon: CachedWebtoonModel) => {
                const normalizedTitle: string = this.miscService.normalizeString(webtoon.title);
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
