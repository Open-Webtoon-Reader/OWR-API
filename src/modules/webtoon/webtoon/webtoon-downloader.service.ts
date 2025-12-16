import EpisodeModel from "./models/models/episode.model";
import EpisodeDataModel from "./models/models/episode-data.model";
import WebtoonDataModel from "./models/models/webtoon-data.model";
import WebtoonModel from "./models/models/webtoon.model";
import {Injectable, Logger} from "@nestjs/common";
import {MiscService} from "../../misc/misc.service";
import {DownloadGateway} from "../../websocket/download.gateway";

@Injectable()
export class WebtoonDownloaderService{
    private readonly logger = new Logger(WebtoonDownloaderService.name);

    constructor(
        private readonly miscService: MiscService,
        private readonly downloadGatewayService: DownloadGateway,
    ){}

    async downloadEpisode(episode: EpisodeModel, imageUrls: string[]): Promise<EpisodeDataModel>{
        this.logger.debug(`Downloading episode ${episode.number}...`);
        const startTime = Date.now();
        const thumbnail: Buffer = await this.miscService.downloadImage(episode.thumbnail);
        const conversionPromises: Promise<Buffer>[] = [];
        let downloadedCount = 0;

        const interval = setInterval(() => {
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const imagesPerSecond = downloadedCount / elapsedSeconds;
            this.logger.debug(`Downloading ${downloadedCount} of ${imageUrls.length} images (${(imagesPerSecond).toFixed(2)} images/s)...`);
            this.downloadGatewayService.onEpisodeProgress((downloadedCount / imageUrls.length) * 100);
        }, 1000);

        for(let i = 0; i < imageUrls.length; i++){
            const url = imageUrls[i];
            let image: Buffer;
            let error = false;
            while(!error){
                try{
                    image = await this.miscService.downloadImage(url, episode.link);
                    error = true;
                }catch(_: any){
                    this.logger.warn(`Error downloading image ${i + 1} for episode ${episode.number}, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, this.miscService.randomInt(500, 1500)));
                }
            }
            conversionPromises.push(this.miscService.convertImageToWebp(image));
            downloadedCount++;
            await new Promise(resolve => setTimeout(resolve, this.miscService.randomInt(50, 200)));
        }

        clearInterval(interval);
        this.logger.debug(`Downloaded ${downloadedCount}/${imageUrls.length} images in ${((Date.now() - startTime) / 1000).toFixed(2)} seconds.`);
        this.downloadGatewayService.onEpisodeProgress(100);

        // Convert all images to webp
        const convertedImages: Buffer[] = await Promise.all(conversionPromises);
        this.logger.debug(`Download complete for episode ${episode.number}!`);
        return {
            thumbnail,
            images: convertedImages,
        } as EpisodeDataModel;
    }

    async downloadWebtoon(webtoon: WebtoonModel): Promise<WebtoonDataModel>{
        const downloadPromises: Promise<Buffer>[] = [];
        downloadPromises.push(this.miscService.convertWebtoonThumbnail(webtoon.thumbnail));
        if(webtoon.banner.background)
            downloadPromises.push(this.miscService.downloadImage(webtoon.banner.background));
        else
            downloadPromises.push(undefined);
        downloadPromises.push(this.miscService.downloadImage(webtoon.banner.top));
        if(webtoon.banner.mobile)
            downloadPromises.push(this.miscService.downloadImage(webtoon.banner.mobile));
        else
            downloadPromises.push(undefined);
        const images: Buffer[] = await Promise.all(downloadPromises);
        const conversionPromises: Promise<Buffer>[] = [];
        for(let i = 0; i < images.length; i++)
            if(images[i])
                conversionPromises.push(this.miscService.convertImageToWebp(images[i]));
            else
                conversionPromises.push(undefined);
        const [thumbnail, background, top, mobile] = await Promise.all(conversionPromises);
        return {
            thumbnail,
            backgroundBanner: background,
            topBanner: top,
            mobileBanner: mobile,
        } as WebtoonDataModel;
    }
}
