import {Injectable, Logger} from "@nestjs/common";
import {PrismaService} from "../../misc/prisma.service";
import {WebtoonParserService} from "../webtoon/webtoon-parser.service";
import CachedWebtoonModel from "../webtoon/models/models/cached-webtoon.model";
import {MiscService} from "../../misc/misc.service";
import {WebtoonDatabaseService} from "../webtoon/webtoon-database.service";
import ImageTypes from "../webtoon/models/enums/image-types";


@Injectable()
export class UpdateService{

    private readonly logger = new Logger(UpdateService.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly webtoonParser: WebtoonParserService,
        private readonly miscService: MiscService,
        private readonly webtoonDatabaseService: WebtoonDatabaseService,
    ){}

    async updateThumbnails(): Promise<void>{
        this.webtoonParser.clearCache();
        await this.webtoonParser.loadCache();
        await this.prismaService.$transaction(async(tx) => {
            const dbWebtoons: any[] = await tx.webtoons.findMany({
                select: {
                    id: true,
                    title: true,
                    language: true,
                    thumbnail_id: true
                }
            });
            const thumbnailsToDelete: number[] = dbWebtoons.map(webtoon => webtoon.thumbnail_id);

            // Save new thumbnails
            const dbThumbnailType = await tx.imageTypes.findFirst({
                where: {
                    name: ImageTypes.WEBTOON_THUMBNAIL
                },
                select: {
                    id: true
                }
            });
            for(const webtoon of dbWebtoons){
                this.logger.debug(`Updating thumbnail for webtoon ${webtoon.title} (${webtoon.language})`);
                const cachedWebtoon: CachedWebtoonModel = this.webtoonParser.findWebtoon(webtoon.title, webtoon.language);
                const thumbnail: Buffer = await this.miscService.convertWebtoonThumbnail(cachedWebtoon.thumbnail);
                const sum: string = this.webtoonDatabaseService.saveImage(thumbnail);
                // Check if thumbnail already exists
                let dbThumbnail = await tx.images.findFirst({
                    where: {
                        sum: sum
                    }
                });
                if(dbThumbnail)
                    thumbnailsToDelete.splice(thumbnailsToDelete.indexOf(dbThumbnail.id), 1);
                else
                    dbThumbnail = await tx.images.create({
                        data: {
                            sum: sum,
                            type_id: dbThumbnailType.id
                        }
                    });
                // Update webtoon thumbnail
                await tx.webtoons.update({
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
                const deletedImage = await tx.images.delete({
                    where: {
                        id: thumbnailId
                    }
                });
                this.webtoonDatabaseService.removeImage(deletedImage.sum);
            }
        });
    }
}
