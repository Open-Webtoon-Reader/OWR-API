import {Module} from "@nestjs/common";
import {TaskModule} from "./modules/task/task.module";
import {ConfigModule} from "@nestjs/config";
import {WebtoonModule} from "./modules/webtoon/webtoon/webtoon.module";
import {AdminModule} from "./modules/webtoon/admin/admin.module";
import {ThrottlerGuard, ThrottlerModule} from "@nestjs/throttler";
import {APP_GUARD} from "@nestjs/core";
import {MigrationModule} from "./modules/webtoon/migration/migration.module";
import {ScheduleModule} from "@nestjs/schedule";
import {UpdateModule} from "./modules/webtoon/update/update.module";
import {ImageModule} from "./modules/webtoon/image/image.module";

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 50,
        }]),
        ScheduleModule.forRoot(),
        TaskModule,
        WebtoonModule,
        AdminModule,
        MigrationModule,
        UpdateModule,
        ImageModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard
        }
    ],
})
export class AppModule{}
