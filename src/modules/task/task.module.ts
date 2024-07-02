import {Module} from "@nestjs/common";
import {WebtoonUpdateTask} from "./webtoon_update.task";
import {WebtoonModule} from "../webtoon/webtoon/webtoon.module";
import {SessionCleaningTask} from "./session-cleaning.task";
import {UserModule} from "../user/user.module";

@Module({
    providers: [WebtoonUpdateTask, SessionCleaningTask],
    imports: [WebtoonModule, UserModule],
})
export class TaskModule{}
