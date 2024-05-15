import EpisodeModel from "./models/models/episode.model";
import EpisodeDataModel from "./models/models/episode-data.model";
import WebtoonDataModel from "./models/models/webtoon-data.model";
import WebtoonModel from "./models/models/webtoon.model";
import {Injectable} from "@nestjs/common";
import {MiscService} from "../../misc/misc.service";

@Injectable()
export class WebtoonDownloaderService{

    constructor(
        private readonly miscService: MiscService,
    ){}

    async downloadEpisode(episode: EpisodeModel, imageUrls: string[]): Promise<EpisodeDataModel>{
        console.log(`Downloading episode ${episode.number}...`);
        const thumbnail: Buffer = await this.miscService.downloadImage(episode.thumbnail);
        const conversionPromises: Promise<Buffer>[] = [];
        for (let i = 0; i < imageUrls.length; i++){
            console.log(`Downloading image ${i + 1}/${imageUrls.length}...`);
            const url = imageUrls[i];
            const image = await this.miscService.downloadImage(url, episode.link);
            conversionPromises.push(this.miscService.convertImageToWebp(image));
            await new Promise(resolve => setTimeout(resolve, this.miscService.randomInt(50, 200)));
        }
        // Convert all images to webp
        console.log("Converting images to webp...");
        const convertedImages: Buffer[] = await Promise.all(conversionPromises);
        console.log(`Download complete for episode ${episode.number}!`);
        return {
            thumbnail,
            images: convertedImages
        } as EpisodeDataModel;
    }

    async downloadWebtoon(webtoon: WebtoonModel): Promise<WebtoonDataModel>{
        const downloadPromises: Promise<Buffer>[] = [];
        downloadPromises.push(this.miscService.downloadImage(webtoon.thumbnail));
        downloadPromises.push(this.miscService.downloadImage(webtoon.banner.background));
        downloadPromises.push(this.miscService.downloadImage(webtoon.banner.top));
        downloadPromises.push(this.miscService.downloadImage(webtoon.banner.mobile));
        const images: Buffer[] = await Promise.all(downloadPromises);
        const conversionPromises: Promise<Buffer>[] = [];
        for (let i = 0; i < images.length; i++)
            conversionPromises.push(this.miscService.convertImageToWebp(images[i]));
        const [thumbnail, background, top, mobile] = await Promise.all(conversionPromises);
        return {
            thumbnail,
            backgroundBanner: background,
            topBanner: top,
            mobileBanner: mobile,
        } as WebtoonDataModel;
    }
}
