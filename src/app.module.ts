import {Module} from "@nestjs/common";
import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import {TaskModule} from "./modules/task/task.module";
import {WebtoonModule} from "./modules/webtoon/webtoon.module";

@Module({
    imports: [TaskModule, WebtoonModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule{}
