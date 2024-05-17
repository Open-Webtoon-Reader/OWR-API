import * as fs from "fs";
import CachedWebtoonModel from "./models/models/cached-webtoon.model";
import EpisodeModel from "./models/models/episode.model";
import EpisodeDataModel from "./models/models/episode-data.model";
import EpisodeResponse from "./models/responses/episode.response";
import EpisodesResponse from "./models/responses/episodes.response";
import EpisodeLineModel from "./models/models/episode-line.model";
import WebtoonResponse from "./models/responses/webtoon.response";
import WebtoonModel from "./models/models/webtoon.model";
import WebtoonDataModel from "./models/models/webtoon-data.model";
import {Injectable, NotFoundException} from "@nestjs/common";
import {PrismaService} from "../../misc/prisma.service";
import {MiscService} from "../../misc/misc.service";
import ImageTypes from "./models/enums/image-types";

@Injectable()
export class WebtoonDatabaseService{


    constructor(
        private readonly prismaService: PrismaService,
        private readonly miscService: MiscService
    ){}

    async saveEpisode(webtoon: CachedWebtoonModel, episode: EpisodeModel, episodeData: EpisodeDataModel): Promise<void>{
        console.log(`Saving episode ${episode.number}...`);
        const dbWebtoon = await this.prismaService.webtoons.findFirst({
            where: {
                title: webtoon.title
            }
        });
        if(!dbWebtoon)
            throw new NotFoundException(`Webtoon ${webtoon.title} not found in database.`);
        if(await this.isEpisodeSaved(dbWebtoon.id, episode.number))
            return;
        // Start prisma transaction
        await this.prismaService.$transaction(async(tx) => {
            const imageTypes = await tx.imageTypes.findMany({
                where: {
                    name: {
                        in: [
                            ImageTypes.EPISODE_THUMBNAIL,
                            ImageTypes.EPISODE_IMAGE
                        ]
                    }
                }
            });
            const thumbnailType = imageTypes.find(type => type.name === ImageTypes.EPISODE_THUMBNAIL);
            const imageType = imageTypes.find(type => type.name === ImageTypes.EPISODE_IMAGE);

            const thumbnailSum: string = this.saveImage(episodeData.thumbnail);
            const dbThumbnail = await tx.images.create({
                data: {
                    sum: thumbnailSum,
                    type_id: thumbnailType.id
                }
            });
            const dbEpisode = await tx.episodes.create({
                data: {
                    title: episode.title,
                    number: episode.number,
                    webtoon_id: dbWebtoon.id,
                    thumbnail_id: dbThumbnail.id
                }
            });
            for(let i = 0; i < episodeData.images.length; i++){
                const imageSum: string = this.saveImage(episodeData.images[i]);
                let dbImage = await tx.images.findUnique({
                    where: {
                        sum: imageSum
                    }
                });
                if(!dbImage)
                    dbImage = await tx.images.create({
                        data: {
                            sum: imageSum,
                            type_id: imageType.id,
                            episode_images: {
                                create: {
                                    number: i,
                                    episode_id: dbEpisode.id
                                }
                            }
                        }
                    });
                else
                    await tx.episodeImages.create({
                        data: {
                            number: i,
                            episode_id: dbEpisode.id,
                            image_id: dbImage.id
                        }
                    });
            }
        });
    }

    async saveWebtoon(webtoon: WebtoonModel, webtoonData: WebtoonDataModel): Promise<void>{
        if(await this.isWebtoonSaved(webtoon.title, webtoon.language))
            return;
        await this.prismaService.$transaction(async(tx) => {
            const genreIds: number[] = [];
            const genres = await tx.genres.findMany();
            for(const genre of webtoon.genres){
                const dbGenre = genres.find(dbGenre => dbGenre.name === genre);
                if(!dbGenre)
                    throw new NotFoundException(`Genre ${genre} not found in database.`);
                genreIds.push(dbGenre.id);
            }

            const imageTypes = await tx.imageTypes.findMany({
                where: {
                    name: {
                        in: [
                            ImageTypes.WEBTOON_THUMBNAIL,
                            ImageTypes.WEBTOON_BACKGROUND_BANNER,
                            ImageTypes.WEBTOON_TOP_BANNER,
                            ImageTypes.WEBTOON_MOBILE_BANNER
                        ]
                    }
                }
            });
            const thumbnailType = imageTypes.find(type => type.name === ImageTypes.WEBTOON_THUMBNAIL);
            const backgroundType = imageTypes.find(type => type.name === ImageTypes.WEBTOON_BACKGROUND_BANNER);
            const topType = imageTypes.find(type => type.name === ImageTypes.WEBTOON_TOP_BANNER);
            const mobileType = imageTypes.find(type => type.name === ImageTypes.WEBTOON_MOBILE_BANNER);

            const thumbnailSum: string = this.saveImage(webtoonData.thumbnail);
            const backgroundSum: string = this.saveImage(webtoonData.backgroundBanner);
            const topSum: string = this.saveImage(webtoonData.topBanner);
            const mobileSum: string = this.saveImage(webtoonData.mobileBanner);

            const dbThumbnail = await tx.images.create({
                data: {
                    sum: thumbnailSum,
                    type_id: thumbnailType.id
                }
            });
            const dbBackground = await tx.images.create({
                data: {
                    sum: backgroundSum,
                    type_id: backgroundType.id
                }
            });
            const dbTop = await tx.images.create({
                data: {
                    sum: topSum,
                    type_id: topType.id
                }
            });
            const dbMobile = await tx.images.create({
                data: {
                    sum: mobileSum,
                    type_id: mobileType.id
                }
            });
            const dbWebtoon = await tx.webtoons.create({
                data: {
                    title: webtoon.title,
                    language: webtoon.language,
                    author: webtoon.author,
                    thumbnail_id: dbThumbnail.id,
                    background_banner_id: dbBackground.id,
                    top_banner_id: dbTop.id,
                    mobile_banner_id: dbMobile.id
                }
            });

            for(const genreId of genreIds){
                await tx.webtoonGenres.create({
                    data: {
                        webtoon_id: dbWebtoon.id,
                        genre_id: genreId
                    }
                });
            }
        });
    }

    async isWebtoonSaved(webtoonTitle: string, language: string): Promise<boolean>{
        return !!await this.prismaService.webtoons.findFirst({
            where: {
                title: webtoonTitle,
                language: language
            }
        });
    }

    async isEpisodeSaved(webtoonId: number, episodeNumber: number): Promise<boolean>{
        return !!await this.prismaService.episodes.findFirst({
            where: {
                webtoon_id: webtoonId,
                number: episodeNumber
            }
        });
    }

    async getLastSavedEpisodeNumber(webtoonTitle: string, language: string): Promise<number>{
        const dbWebtoon = await this.prismaService.webtoons.findFirst({
            where: {
                title: webtoonTitle,
                language: language
            }
        });
        if(!dbWebtoon)
            throw new NotFoundException(`Webtoon ${webtoonTitle} not found in database.`);
        const lastEpisode = await this.prismaService.episodes.findFirst({
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
        return this.prismaService.webtoons.findMany({
            select: {
                title: true,
                language: true
            }
        });
    }

    async getWebtoons(): Promise<WebtoonResponse[]>{
        const webtoons = await this.prismaService.webtoons.findMany({
            include: {
                thumbnail: true
            }
        });
        const response: WebtoonResponse[] = [];
        for(const webtoon of webtoons){
            const thumbnail: string = this.miscService.bufferToDataURL(this.loadImage(webtoon.thumbnail.sum));
            response.push(new WebtoonResponse(webtoon.id, webtoon.title, webtoon.language, thumbnail, webtoon.author));
        }
        return response;
    }

    async getEpisodeInfos(webtoonId: number): Promise<EpisodesResponse>{
        const dbWebtoon = await this.prismaService.webtoons.findFirst({
            where: {
                id: webtoonId
            },
            include: {
                thumbnail: true,
                background_banner: true,
                top_banner: true,
                mobile_banner: true,
            }
        });
        if(!dbWebtoon)
            throw new NotFoundException(`Webtoon with id ${webtoonId} not found in database.`);
        const episodes = await this.prismaService.episodes.findMany({
            where: {
                webtoon_id: webtoonId
            },
            include: {
                thumbnail: true
            },
            orderBy: {
                number: "asc"
            }
        });
        const episodeLines: EpisodeLineModel[] = [];
        const episodeLinesPromises: Promise<EpisodeLineModel>[] = [];
        for(const episode of episodes)
            episodeLinesPromises.push(this.loadEpisodeLine(episode));
        for(const promise of episodeLinesPromises)
            episodeLines.push(await promise);
        return {
            episodes: episodeLines,
            backgroundBanner: this.miscService.bufferToDataURL(this.loadImage(dbWebtoon.background_banner.sum)),
            topBanner: this.miscService.bufferToDataURL(this.loadImage(dbWebtoon.top_banner.sum)),
            mobileBanner: this.miscService.bufferToDataURL(this.loadImage(dbWebtoon.mobile_banner.sum)),
            title: dbWebtoon.title,
        } as EpisodesResponse;
    }

    private async loadEpisodeLine(episode: any): Promise<EpisodeLineModel>{
        const thumbnailData: Buffer | undefined = this.loadImage(episode.thumbnail.sum);
        if(!thumbnailData)
            throw new NotFoundException(`Thumbnail not found for episode ${episode.number}`);
        const thumbnail: string = this.miscService.bufferToDataURL(thumbnailData);
        return new EpisodeLineModel(episode.id, episode.title, episode.number, thumbnail);
    }

    async getEpisodeImages(episodeId: number): Promise<EpisodeResponse>{
        const episode = await this.prismaService.episodes.findFirst({
            where: {
                id: episodeId,
            }
        });
        if(!episode)
            throw new NotFoundException(`Episode ${episodeId} not found in database.`);
        const images = await this.prismaService.episodeImages.findMany({
            where: {
                episode_id: episode.id
            },
            include: {
                image: true
            },
            orderBy: {
                number: "asc"
            }
        });
        const episodeImages: string[] = [];
        for(const image of images){
            const imageData: Buffer | undefined = this.loadImage(image.image.sum);
            if(!imageData)
                throw new NotFoundException(`Image not found for episode ${episodeId}`);
            episodeImages.push(this.miscService.bufferToDataURL(imageData));
        }
        return new EpisodeResponse(episode.title, episodeImages);
    }

    private saveImage(image: Buffer): string{
        if(!fs.existsSync("./images"))
            fs.mkdirSync("./images");
        const imageSum: string = this.miscService.getSum(image);
        const folder = imageSum.substring(0, 2);
        const path = `./images/${folder}`;
        if(!fs.existsSync(path))
            fs.mkdirSync(path);
        fs.writeFileSync(`${path}/${imageSum}.webp`, image);
        return imageSum;
    }

    private loadImage(imageSum: string): Buffer{
        const folder = imageSum.substring(0, 2);
        return fs.readFileSync(`./images/${folder}/${imageSum}.webp`);
    }
}
