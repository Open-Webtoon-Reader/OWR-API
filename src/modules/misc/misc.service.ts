import {Injectable} from "@nestjs/common";
import {createHash} from "crypto";
import * as JSZip from "jszip";
import * as fs from "fs";
import * as sharp from "sharp";
import WebtoonStarModel from "../webtoon/webtoon/models/models/webtoon-star.model";
import axios, {AxiosInstance} from "axios";


@Injectable()
export class MiscService{

    private readonly axiosInstance: AxiosInstance;

    private readonly userAgents: string[] = [
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.112 Safari/535.1",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:109.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
    ];

    constructor(){
        this.axiosInstance = axios.create({});
        this.randomUserAgentChange(1);
    }

    randomUserAgentChange(probability: number = 0){
        if(Math.random() > probability)
            return;
        this.axiosInstance.defaults.headers.common["User-Agent"] = this.userAgents[this.randomInt(0, this.userAgents.length - 1)];
    }

    getAxiosInstance(){
        this.randomUserAgentChange(0.1);
        return this.axiosInstance;
    }

    randomInt(min: number, max: number): number{
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    normalizeString(str: string): string{
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    getSum(data: Buffer): string{
        return createHash("sha256").update(data).digest("hex");
    }

    /**
     * @deprecated
     * @param zip
     */
    async generateZip(zip: JSZip): Promise<[Buffer, string]>{
        const zipBuffer = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        const zipSum = this.getSum(zipBuffer);
        return [zipBuffer, zipSum];
    }

    async loadZip(path: string){
        const zipData = fs.readFileSync(path);
        const zip = new JSZip();
        await zip.loadAsync(zipData);
        return zip;
    }

    async convertImageToWebp(image: Buffer): Promise<Buffer>{
        return await sharp(image).webp({
            preset: "picture",
            effort: 6,
            smartSubsample: false,
            quality: 80,
            nearLossless: false,
            lossless: false,
            alphaQuality: 100,
        }).toBuffer();
    }

    async downloadImage(url: string, referer: string = "https://www.webtoons.com/fr/"): Promise<Buffer>{
        const response = await this.getAxiosInstance().get(url, {
            responseType: "arraybuffer",
            headers: {
                "Referer": referer
            }
        });
        return response.data as Buffer;
    }

    async convertThumbnail(url: string){
        const webpImage: Buffer = await this.downloadImage(url);
        return await sharp(webpImage).resize(240, 240, {
            fit: "cover",
            position: "center"
        }).toBuffer();
    }

    parseWebtoonStars(stars: string): WebtoonStarModel{
        // TODO: Fix dutch space and comma issue
        stars = stars.replace(" ", " ");
        let copy = stars;
        copy = copy.replace(",", ".");
        copy = copy.replace(" ", "");
        let multiplier = 1;
        if(copy.endsWith("M") || copy.endsWith("JT")){
            multiplier = 1000000;
            copy = copy.replace("M", "");
            copy = copy.replace("JT", "");
        }
        const parsed = parseFloat(copy) * multiplier;
        return {
            raw: stars,
            value: parsed
        } as WebtoonStarModel;
    }

    bufferToDataURL(buffer: Buffer): string{
        return `data:image/webp;base64,${buffer.toString("base64")}`;
    }
}
