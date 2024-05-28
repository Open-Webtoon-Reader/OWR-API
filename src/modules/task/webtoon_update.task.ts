import {Injectable} from "@nestjs/common";
import {Cron} from "@nestjs/schedule";
import {DownloadManagerService} from "../webtoon/webtoon/download-manager.service";


@Injectable()
export class WebtoonUpdateTask{

    constructor(
        private readonly downloadManagerService: DownloadManagerService
    ){}

    @Cron("0 0 17 * * *")
    async handleCron(){
        // Called every day at 17:00
        this.downloadManagerService.updateAllWebtoons();
    }
}
