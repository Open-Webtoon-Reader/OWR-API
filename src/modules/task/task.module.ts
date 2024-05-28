import {Module} from "@nestjs/common";
import {WebtoonUpdateTask} from "./webtoon_update.task";
import {WebtoonModule} from "../webtoon/webtoon/webtoon.module";

@Module({
    providers: [WebtoonUpdateTask],
    imports: [WebtoonModule]
})
export class TaskModule{}
