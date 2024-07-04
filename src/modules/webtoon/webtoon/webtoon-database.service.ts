import * as fs from "fs";
import CachedWebtoonModel from "./models/models/cached-webtoon.model";
import EpisodeModel from "./models/models/episode.model";
import EpisodeDataModel from "./models/models/episode-data.model";
import EpisodeResponse from "./models/responses/episode.response";
import EpisodeLineModel from "./models/models/episode-line.model";
import LightWebtoonResponse from "./models/responses/light-webtoon-response";
import WebtoonModel from "./models/models/webtoon.model";
import WebtoonDataModel from "./models/models/webtoon-data.model";
import {Injectable, Logger, NotFoundException} from "@nestjs/common";
import {PrismaService} from "../../misc/prisma.service";
import {MiscService} from "../../misc/misc.service";
import ImageTypes from "./models/enums/image-types";
import WebtoonResponse from "./models/responses/webtoon-response";
import MigrationInfosResponse from "../migration/models/responses/migration-infos.response";

@Injectable()
export class WebtoonDatabaseService{

    private readonly CHUNK_SIZE: number = 10;
    private readonly MIGRATION_CHUNK_SIZE: number = 15000;

    private readonly logger = new Logger(WebtoonDatabaseService.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly miscService: MiscService
    ){}

    async saveEpisode(webtoon: CachedWebtoonModel, episode: EpisodeModel, episodeData: EpisodeDataModel): Promise<void>{
        this.logger.debug(`Saving episode ${episode.number}...`);
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

            // Save images
            const imagesSum: string[] = episodeData.images.map((image: Buffer) => this.saveImage(image));
            let dbImages: any[] = await tx.images.findMany({
                where: {
                    sum: {
                        in: imagesSum
                    }
                }
            });
            const imagesToSave: any[] = [];
            for(let i: number = 0; i < imagesSum.length; i++){
                if(!dbImages.find(dbImage => dbImage.sum === imagesSum[i]))
                    imagesToSave.push({
                        sum: imagesSum[i],
                        type_id: imageType.id,
                    });
            }
            await tx.images.createMany({
                data: imagesToSave
            });
            dbImages = await tx.images.findMany({
                where: {
                    sum: {
                        in: imagesSum
                    }
                }
            });
            // Re-order dbImages to match imagesSum order
            dbImages.sort((a: any, b: any) => {
                return imagesSum.indexOf(a.sum) - imagesSum.indexOf(b.sum);
            });

            // Create episodeImages
            await tx.episodeImages.createMany({
                data: dbImages.map((dbImage: any, index: number) => {
                    return {
                        number: index,
                        episode_id: dbEpisode.id,
                        image_id: dbImage.id
                    };
                })
            });




            // Change webtoon updated_at
            await tx.webtoons.update({
                where: {
                    id: dbWebtoon.id
                },
                data: {
                    updated_at: new Date()
                }
            });
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

    /**
     * Get webtoons title and language for internal use
     */
    async getWebtoonList(): Promise<any[]>{
        return this.prismaService.webtoons.findMany({
            select: {
                title: true,
                language: true
            }
        });
    }

    async getWebtoons(): Promise<LightWebtoonResponse[]>{
        const webtoons: any[] = await this.prismaService.webtoons.findMany({
            orderBy: {
                title: "asc"
            },
            include: {
                thumbnail: true,
                genres: {
                    include: {
                        genre: true
                    }
                }
            }
        });
        const response: LightWebtoonResponse[] = [];
        for(const webtoon of webtoons){
            const {isNew, hasNewEpisodes} = this.checkWebtoonNews(webtoon);
            response.push(new LightWebtoonResponse(
                webtoon.id,
                webtoon.title,
                webtoon.language,
                webtoon.author,
                webtoon.genres.map((genre: any) => genre.genre.name),
                isNew,
                hasNewEpisodes,
                webtoon.thumbnail.sum,
            ));
        }
        return response;
    }

    private checkWebtoonNews(webtoon: any){
        // Mark isNew if webtoon is created in the last 7 days
        const isNew: boolean = new Date().getTime() - new Date(webtoon.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
        // Mark hasNewEpisodes if webtoon is updated in the last 1 day
        const hasNewEpisodes: boolean = new Date().getTime() - new Date(webtoon.updated_at).getTime() < 2 * 24 * 60 * 60 * 1000;
        return {isNew, hasNewEpisodes};
    }

    private checkEpisodeNews(episode: any){
        return new Date().getTime() - new Date(episode.created_at).getTime() < 2 * 24 * 60 * 60 * 1000;
    }

    async getWebtoon(webtoonId: number){
        const webtoon: any = await this.prismaService.webtoons.findFirst({
            where: {
                id: webtoonId
            },
            include: {
                thumbnail: true,
                background_banner: true,
                top_banner: true,
                mobile_banner: true,
                genres: {
                    include: {
                        genre: true
                    }
                }
            }
        });
        if(!webtoon)
            throw new NotFoundException(`Webtoon with id ${webtoonId} not found in database.`);
        const {isNew, hasNewEpisodes} = this.checkWebtoonNews(webtoon);
        return new WebtoonResponse(
            webtoon.id,
            webtoon.title,
            webtoon.language,
            webtoon.author,
            webtoon.genres.map((genre: any) => genre.genre.name),
            isNew,
            hasNewEpisodes,
            webtoon.thumbnail.sum,
            webtoon.background_banner.sum,
            webtoon.top_banner.sum,
            webtoon.mobile_banner.sum
        );
    }

    async getEpisodes(webtoonId: number): Promise<EpisodeLineModel[]>{
        const dbWebtoon: any = await this.prismaService.webtoons.findFirst({
            where: {
                id: webtoonId
            }
        });
        if(!dbWebtoon)
            throw new NotFoundException(`Webtoon with id ${webtoonId} not found in database.`);
        const episodes: any[] = await this.prismaService.episodes.findMany({
            where: {
                webtoon_id: webtoonId
            },
            include: {
                thumbnail: true
            },
            orderBy: {
                number: "desc"
            },
        });
        const episodeLines: EpisodeLineModel[] = [];
        for(const episode of episodes)
            episodeLines.push(new EpisodeLineModel(episode.id, episode.title, episode.number, this.checkEpisodeNews(episode), episode.thumbnail.sum));
        return episodeLines;
    }

    async getEpisodeInfos(episodeId: number): Promise<EpisodeResponse>{
        const episode: any = await this.prismaService.episodes.findFirst({
            where: {
                id: episodeId
            }
        });
        if(!episode)
            throw new NotFoundException(`Episode with id ${episodeId} not found in database.`);
        let previousEpisodeId: number;
        let nextEpisodeId: number;
        if(episode.number > 1){
            const previousEpisode = await this.prismaService.episodes.findFirst({
                where: {
                    webtoon_id: episode.webtoon_id,
                    number: episode.number - 1
                }
            });
            if(previousEpisode)
                previousEpisodeId = previousEpisode.id;
        }
        const nextEpisode = await this.prismaService.episodes.findFirst({
            where: {
                webtoon_id: episode.webtoon_id,
                number: episode.number + 1
            }
        });
        if(nextEpisode)
            nextEpisodeId = nextEpisode.id;
        return new EpisodeResponse(episode.title, previousEpisodeId, nextEpisodeId);
    }

    async getEpisodeImages(episodeId: number): Promise<string[]>{
        const episode: any = await this.prismaService.episodes.findFirst({
            where: {
                id: episodeId
            }
        });
        if(!episode)
            throw new NotFoundException(`Episode with id ${episodeId} not found in database.`);
        const dbImages: any[] = await this.prismaService.episodeImages.findMany({
            where: {
                episode_id: episodeId
            },
            include: {
                image: true
            },
            orderBy: {
                number: "asc"
            },
        });
        const images: string[] = [];
        for(const image of dbImages)
            images.push(image.image.sum);
        return images;
    }

    async getMigrationInfos(): Promise<MigrationInfosResponse>{
        const imageCount: number = await this.prismaService.images.count();
        const chunkCount: number = Math.ceil(imageCount / this.MIGRATION_CHUNK_SIZE);
        return new MigrationInfosResponse(imageCount, chunkCount);
    }

    async getImages(chunkNumber: number): Promise<Record<string, Buffer>>{
        const dbImages: any[] = await this.prismaService.images.findMany({
            skip: (chunkNumber - 1) * this.MIGRATION_CHUNK_SIZE,
            take: this.MIGRATION_CHUNK_SIZE
        });
        const images: Record<string, Buffer> = {};
        for(const image of dbImages)
            images[image.sum] = this.loadImage(image.sum);
        return images;
    }

    saveImage(image: Buffer): string{
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

    loadImage(imageSum: string): Buffer{
        const folder = imageSum.substring(0, 2);
        return fs.readFileSync(`./images/${folder}/${imageSum}.webp`);
    }

    removeImage(imageSum: string): void{
        const folder = imageSum.substring(0, 2);
        fs.rmSync(`./images/${folder}/${imageSum}.webp`);
    }

    async getRandomThumbnails(){
        const webtoons: any[] = await this.prismaService.webtoons.findMany({
            include: {
                thumbnail: true
            }
        });
        if(!webtoons.length)
            throw new NotFoundException("No thumbnails found in database.");
        const randomWebtoon: any = webtoons[Math.floor(Math.random() * webtoons.length)];
        return {
            thumbnail: randomWebtoon.thumbnail.sum
        };
    }
}
