import {Module} from "@nestjs/common";
import {TaskModule} from "./modules/task/task.module";
import {ConfigModule} from "@nestjs/config";
import {WebtoonModule} from "./modules/webtoon/webtoon/webtoon.module";
import {AdminModule} from "./modules/webtoon/admin/admin.module";

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        TaskModule,
        WebtoonModule,
        AdminModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule{}
