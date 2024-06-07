import {Injectable} from "@nestjs/common";
import {PrismaService} from "../../misc/prisma.service";
import {WebtoonParserService} from "../webtoon/webtoon-parser.service";
import CachedWebtoonModel from "../webtoon/models/models/cached-webtoon.model";
import {MiscService} from "../../misc/misc.service";
import {WebtoonDatabaseService} from "../webtoon/webtoon-database.service";
import ImageTypes from "../webtoon/models/enums/image-types";


@Injectable()
export class UpdateService{

    constructor(
        private readonly prismaService: PrismaService,
        private readonly webtoonParser: WebtoonParserService,
        private readonly miscService: MiscService,
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
    ){}

    async updateThumbnails(): Promise<void>{
        this.webtoonParser.clearCache();
        await this.webtoonParser.loadCache();
        const dbWebtoons: any[] = await this.prismaService.webtoons.findMany({
            select: {
                id: true,
                title: true,
                language: true,
                thumbnail_id: true
            }
        });
        const thumbnailsToDelete: number[] = dbWebtoons.map(webtoon => webtoon.thumbnail_id);
        // Save new thumbnails
        const dbThumbnailType = await this.prismaService.imageTypes.findFirst({
            where: {
                name: ImageTypes.WEBTOON_THUMBNAIL
            },
            select: {
                id: true
            }
        });
        for(const webtoon of dbWebtoons){
            const cachedWebtoon: CachedWebtoonModel = this.webtoonParser.findWebtoon(webtoon.title, webtoon.language);
            const thumbnail: Buffer = await this.miscService.convertThumbnail(cachedWebtoon.thumbnail);
            const sum: string = this.webtoonDatabaseService.saveImage(thumbnail);
            const dbThumbnail = await this.prismaService.images.create({
                data: {
                    sum: sum,
                    type_id: dbThumbnailType.id
                }
            });
            await this.prismaService.webtoons.update({
                where: {
                    id: webtoon.id
                },
                data: {
                    thumbnail_id: dbThumbnail.id
                }
            });
        }

        // Delete old thumbnails
        for(const thumbnailId of thumbnailsToDelete){
            const deletedImage = await this.prismaService.images.delete({
                where: {
                    id: thumbnailId
                }
            });
            this.webtoonDatabaseService.removeImage(deletedImage.sum);
        }
    }

}
