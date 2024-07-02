import {Injectable, Logger} from "@nestjs/common";
import {Cron} from "@nestjs/schedule";
import {AuthService} from "../user/auth.service";

@Injectable()
export class SessionCleaningTask{

    private readonly logger = new Logger(SessionCleaningTask.name);

    constructor(
        private readonly authService: AuthService,
    ){}

    @Cron("0 0 0 * * *")
    async handleCron(){
        // Called every day at 00:00
        const count = await this.authService.cleanSessions();
        this.logger.debug(`Cleaned ${count} sessions`);
    }
}
