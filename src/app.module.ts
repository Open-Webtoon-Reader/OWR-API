import {Module} from "@nestjs/common";
import {TaskModule} from "./modules/task/task.module";
import {ConfigModule} from "@nestjs/config";
import {WebtoonModule} from "./modules/webtoon/webtoon/webtoon.module";
import {AdminModule} from "./modules/webtoon/admin/admin.module";
import {ThrottlerGuard, ThrottlerModule} from "@nestjs/throttler";
import {APP_GUARD} from "@nestjs/core";
import {MigrationModule} from "./modules/webtoon/migration/migration.module";
import {ScheduleModule} from "@nestjs/schedule";

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
