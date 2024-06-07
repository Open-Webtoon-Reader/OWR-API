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
import EpisodeChunkResponse from "./models/responses/episode-chunk.response";
import ImagesChunkResponse from "./models/responses/images-chunk.response";
import MigrationInfosResponse from "../migration/models/responses/migration-infos.response";

@Injectable()
export class WebtoonDatabaseService{

    private readonly CHUNK_SIZE: number = 10;
    private readonly MIGRATION_CHUNK_SIZE: number = 10000;

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

    async getWebtoons(): Promise<LightWebtoonResponse[]>{
        const webtoons: any = await this.prismaService.webtoons.findMany({
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
            const thumbnail: string = this.miscService.bufferToDataURL(this.loadImage(webtoon.thumbnail.sum));
            response.push(new LightWebtoonResponse(
                webtoon.id,
                webtoon.title,
                webtoon.language,
                webtoon.author,
                webtoon.genres.map((genre: any) => genre.genre.name),
                thumbnail
            ));
        }
        return response;
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
        const thumbnail: string = this.miscService.bufferToDataURL(this.loadImage(webtoon.thumbnail.sum));
        const backgroundBanner: string = this.miscService.bufferToDataURL(this.loadImage(webtoon.background_banner.sum));
        const topBanner: string = this.miscService.bufferToDataURL(this.loadImage(webtoon.top_banner.sum));
        const mobileBanner: string = this.miscService.bufferToDataURL(this.loadImage(webtoon.mobile_banner.sum));
        return new WebtoonResponse(
            webtoon.id,
            webtoon.title,
            webtoon.language,
            webtoon.author,
            webtoon.genres.map((genre: any) => genre.genre.name),
            thumbnail,
            backgroundBanner,
            topBanner,
            mobileBanner
        );
    }

    async getEpisodes(webtoonId: number, chunkNumber: number): Promise<EpisodeChunkResponse>{
        const dbWebtoon: any = await this.prismaService.webtoons.findFirst({
            where: {
                id: webtoonId
            }
        });
        if(!dbWebtoon)
            throw new NotFoundException(`Webtoon with id ${webtoonId} not found in database.`);
        const episodeCount: number = await this.prismaService.episodes.count({
            where: {
                webtoon_id: webtoonId
            }
        });
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
            skip: (chunkNumber - 1) * this.CHUNK_SIZE,
            take: this.CHUNK_SIZE
        });
        const episodeLines: EpisodeLineModel[] = [];
        for(const episode of episodes){
            const thumbnail: string = this.miscService.bufferToDataURL(this.loadImage(episode.thumbnail.sum));
            episodeLines.push(new EpisodeLineModel(episode.id, episode.title, episode.number, thumbnail));
        }
        return new EpisodeChunkResponse(episodeLines, chunkNumber, Math.ceil(episodeCount / this.CHUNK_SIZE));
    }

    async getEpisodeInfos(episodeId: number): Promise<EpisodeResponse>{
        const episode: any = await this.prismaService.episodes.findFirst({
            where: {
                id: episodeId
            }
        });
        if(!episode)
            throw new NotFoundException(`Episode with id ${episodeId} not found in database.`);
        return new EpisodeResponse(episode.title);
    }

    async getEpisodeImages(episodeId: number, chunkNumber: number): Promise<ImagesChunkResponse>{
        const episode: any = await this.prismaService.episodes.findFirst({
            where: {
                id: episodeId
            }
        });
        if(!episode)
            throw new NotFoundException(`Episode with id ${episodeId} not found in database.`);
        const imagesCount: number = await this.prismaService.episodeImages.count({
            where: {
                episode_id: episodeId
            }
        });
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
            skip: (chunkNumber - 1) * this.CHUNK_SIZE,
            take: this.CHUNK_SIZE
        });
        const images: string[] = [];
        for(const image of dbImages)
            images.push(this.miscService.bufferToDataURL(this.loadImage(image.image.sum)));
        return new ImagesChunkResponse(images, chunkNumber, Math.ceil(imagesCount / this.CHUNK_SIZE));
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

    private loadImage(imageSum: string): Buffer{
        const folder = imageSum.substring(0, 2);
        return fs.readFileSync(`./images/${folder}/${imageSum}.webp`);
    }

    removeImage(imageSum: string): void{
        const folder = imageSum.substring(0, 2);
        fs.rmSync(`./images/${folder}/${imageSum}.webp`);
    }
}
