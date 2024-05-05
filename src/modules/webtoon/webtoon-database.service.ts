import fs from "fs";
import JSZip from "jszip";
import CachedWebtoonModel from "./models/models/cached-webtoon.model";
import EpisodeModel from "./models/models/episode.model";
import EpisodeDataModel from "./models/models/episode-data.model";
import {PrismaService} from "../misc/prisma.service";
import {MiscService} from "../misc/misc.service";
import EpisodeResponse from "./models/responses/episode.response";
import EpisodesResponse from "./models/responses/episodes.response";
import EpisodeLineModel from "./models/models/episode-line.model";
import WebtoonResponse from "./models/responses/webtoon.response";
import WebtoonModel from "./models/models/webtoon.model";
import WebtoonDataModel from "./models/models/webtoon-data.model";
import {Injectable} from "@nestjs/common";

@Injectable()
export class WebtoonDatabaseService{


    constructor(
        private readonly prismaService: PrismaService,
        private readonly miscService: MiscService
    ){}

    async saveEpisode(webtoon: CachedWebtoonModel, episode: EpisodeModel, episodeData: EpisodeDataModel): Promise<void>{
        console.log(`Saving episode ${episode.number}...`);
        const dbWebtoon = await this.prismaService.webtoon.findFirst({
            where: {
                title: webtoon.title
            }
        });
        if(!dbWebtoon)
            throw new Error(`Webtoon ${webtoon.title} not found in database.`);
        if(await this.isEpisodeSaved(dbWebtoon.id, episode.number)){
            return;
        }
        // Generate sum for each image
        const imagesSum: string[] = [];
        for(const image of episodeData.images)
            imagesSum.push(this.miscService.getSum(image));
        // Saving
        this.prismaService.$transaction(async(tx) => {
            const imageZipSum: string = await this.saveEpisodeZip(episodeData, imagesSum);
            const oldThumbnailSum: string | null = dbWebtoon.episodes_thumbnails_zip_sum;
            const thumbnailZipSum: string = await this.saveEpisodeThumbnail(dbWebtoon, episodeData.thumbnail);
            // Database saving
            await this.saveEpisodeData(tx, episode, episodeData.thumbnail, dbWebtoon.id, imageZipSum, thumbnailZipSum, imagesSum);
            // Remove old thumbnail zip
            if(oldThumbnailSum)
                fs.rmSync(`./images/webtoons/thumbnails/${oldThumbnailSum}.zip`, {force: true});
            console.log(`Episode ${episode.number} saved!`);
        });
    }

    private async saveEpisodeZip(episodeData: EpisodeDataModel, imagesSum: string[]): Promise<string>{
        const zip: JSZip = new JSZip();
        for(let i = 0; i < imagesSum.length; i++)
            zip.file(`${imagesSum[i]}.webp`, episodeData.images[i]);
        const [zipData, zipSum] = await this.miscService.generateZip(zip);
        fs.mkdirSync("./images/webtoons/episodes", {recursive: true});
        fs.writeFileSync(`./images/webtoons/episodes/${zipSum}.zip`, zipData);
        return zipSum;
    }

    private async saveEpisodeData(tx: any, episode: EpisodeModel, episodeThumbnail: Buffer, webtoonId: number, zipSum: string, thumbnailZipSum: string, imagesSum: string[]): Promise<void>{
        await tx.webtoon.update({
            where: {
                id: webtoonId
            },
            data: {
                episodes_thumbnails_zip_sum: thumbnailZipSum
            }
        });
        const dbEpisode = await tx.episode.create({
            data: {
                title: episode.title,
                webtoon_id: webtoonId,
                number: episode.number,
                thumbnail_sum: this.miscService.getSum(episodeThumbnail),
                images_zip_sum: zipSum
            }
        });
        for(let i = 0; i < imagesSum.length; i++){
            await tx.episodeImage.create({
                data: {
                    episode_id: dbEpisode.id,
                    number: i + 1,
                    sum: imagesSum[i]
                }
            });
        }
    }

    private async saveEpisodeThumbnail(dbWebtoon: any, episodeThumbnail: Buffer): Promise<string>{
        const sum = dbWebtoon.episodes_thumbnails_zip_sum;
        if(!sum){
            const zip: JSZip = new JSZip();
            zip.file(`${this.miscService.getSum(episodeThumbnail)}.webp`, episodeThumbnail);
            const [zipData, zipSum] = await this.miscService.generateZip(zip);
            fs.mkdirSync("./images/webtoons/thumbnails", {recursive: true});
            fs.writeFileSync(`./images/webtoons/thumbnails/${zipSum}.zip`, zipData);
            return zipSum;
        }
        const zip: JSZip = new JSZip();
        const zipData: Buffer = fs.readFileSync(`./images/webtoons/thumbnails/${sum}.zip`);
        await zip.loadAsync(zipData);
        zip.file(`${this.miscService.getSum(episodeThumbnail)}.webp`, episodeThumbnail);
        const [newZipData, newZipSum] = await this.miscService.generateZip(zip);
        fs.writeFileSync(`./images/webtoons/thumbnails/${newZipSum}.zip`, newZipData);
        return newZipSum;
    }

    async saveWebtoon(webtoon: WebtoonModel, webtoonData: WebtoonDataModel): Promise<void>{
        if(await this.isWebtoonSaved(webtoon.title))
            return;
        const thumbnailSum: string = this.saveWebtoonThumbnail(webtoonData.thumbnail);
        const backgroundSum: string = this.saveWebtoonThumbnail(webtoonData.backgroundBanner);
        const topSum: string = this.saveWebtoonThumbnail(webtoonData.topBanner);
        const mobileSum: string = this.saveWebtoonThumbnail(webtoonData.mobileBanner);
        await this.prismaService.webtoon.create({
            data: {
                title: webtoon.title,
                language: webtoon.language,
                author: webtoon.author,
                episodes_thumbnails_zip_sum: null,
                thumbnail_sum: thumbnailSum,
                background_banner_sum: backgroundSum,
                top_banner_sum: topSum,
                mobile_banner_sum: mobileSum
            }
        });
    }

    async isWebtoonSaved(webtoonTitle: string): Promise<boolean>{
        return !!await this.prismaService.webtoon.findFirst({
            where: {
                title: webtoonTitle
            }
        });
    }

    async isEpisodeSaved(webtoonId: number, episodeNumber: number): Promise<boolean>{
        return !!await this.prismaService.episode.findFirst({
            where: {
                webtoon_id: webtoonId,
                number: episodeNumber
            }
        });
    }

    async getLastSavedEpisodeNumber(webtoonTitle: string): Promise<number>{
        const dbWebtoon = await this.prismaService.webtoon.findFirst({
            where: {
                title: webtoonTitle
            }
        });
        if(!dbWebtoon)
            throw new Error(`Webtoon ${webtoonTitle} not found in database.`);
        const lastEpisode = await this.prismaService.episode.findFirst({
            where: {
                webtoon_id: dbWebtoon.id
            },
            orderBy: {
                number: "desc"
            }
        });
        return lastEpisode ? lastEpisode.number : 0;
    }

    async getWebtoonList(): Promise<any[]>{
        return this.prismaService.webtoon.findMany({
            select: {
                title: true,
                language: true
            }
        });
    }

    private saveWebtoonThumbnail(data: Buffer): string{
        const sum = this.miscService.getSum(data);
        fs.mkdirSync("./images/thumbnails", {recursive: true});
        fs.writeFileSync(`./images/thumbnails/${sum}.webp`, data);
        return sum;
    }

    async getWebtoons(): Promise<WebtoonResponse[]>{
        const webtoons = await this.prismaService.webtoon.findMany({
            select: {
                id: true,
                title: true,
                author: true,
                thumbnail_sum: true,
                language: true
            }
        });
        const response: WebtoonResponse[] = [];
        for(const webtoon of webtoons){
            const thumbnail: string = this.miscService.bufferToDataURL(fs.readFileSync(`./images/thumbnails/${webtoon.thumbnail_sum}.webp`));
            response.push(new WebtoonResponse(webtoon.id, webtoon.title, webtoon.language, thumbnail, webtoon.author));
        }
        return response;
    }

    async getEpisodeInfos(webtoonId: number): Promise<EpisodesResponse>{
        const dbWebtoon = await this.prismaService.webtoon.findFirst({
            where: {
                id: webtoonId
            },
            select: {
                title: true,
                author: true,
                background_banner_sum: true,
                top_banner_sum: true,
                mobile_banner_sum: true,
                episodes_thumbnails_zip_sum: true
            }
        });
        if(!dbWebtoon)
            throw new Error(`Webtoon with id ${webtoonId} not found in database.`);
        const episodes = await this.prismaService.episode.findMany({
            where: {
                webtoon_id: webtoonId
            }
        });
        const episodeLines: EpisodeLineModel[] = [];
        const thumbnails: JSZip = await this.miscService.loadZip(`./images/webtoons/thumbnails/${dbWebtoon.episodes_thumbnails_zip_sum}.zip`);
        for(const episode of episodes){
            const thumbnailData: Buffer | undefined = await thumbnails.file(`${episode.thumbnail_sum}.webp`)?.async("nodebuffer");
            if(!thumbnailData)
                throw new Error(`Thumbnail not found in zip for episode ${episode.number}`);
            const thumbnail: string = this.miscService.bufferToDataURL(thumbnailData);
            episodeLines.push(new EpisodeLineModel(thumbnail, episode.title, episode.number));
        }
        return {
            episodes: episodeLines,
            backgroundBanner: this.miscService.bufferToDataURL(fs.readFileSync(`./images/thumbnails/${dbWebtoon.background_banner_sum}.webp`)),
            topBanner: this.miscService.bufferToDataURL(fs.readFileSync(`./images/thumbnails/${dbWebtoon.top_banner_sum}.webp`)),
            mobileBanner: this.miscService.bufferToDataURL(fs.readFileSync(`./images/thumbnails/${dbWebtoon.mobile_banner_sum}.webp`)),
            title: dbWebtoon.title,
        } as EpisodesResponse;
    }

    async getEpisodeImages(webtoonId: number, episodeNumber: number): Promise<EpisodeResponse>{
        const episode = await this.prismaService.episode.findFirst({
            where: {
                webtoon_id: webtoonId,
                number: episodeNumber
            }
        });
        if(!episode)
            throw new Error(`Episode ${episodeNumber} not found for webtoon ${webtoonId} in database.`);
        const images = await this.prismaService.episodeImage.findMany({
            where: {
                episode_id: episode.id
            }
        });
        const zip: JSZip = await this.miscService.loadZip(`./images/webtoons/episodes/${episode.images_zip_sum}.zip`);
        const episodeImages: string[] = [];
        for(const image of images){
            const imageData: Buffer | undefined = await zip.file(`${image.sum}.webp`)?.async("nodebuffer");
            if(!imageData)
                throw new Error(`Image not found in zip for episode ${episodeNumber}`);
            episodeImages.push(this.miscService.bufferToDataURL(imageData));
        }
        return new EpisodeResponse(episode.title, episodeImages);
    }
}
