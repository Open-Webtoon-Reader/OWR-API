import {Module} from "@nestjs/common";
import {MiscService} from "./misc.service";
import {PrismaService} from "./prisma.service";
import {VersionController} from "./version.controller";

@Module({
    controllers: [
        VersionController,
    ],
    providers: [
        MiscService,
        PrismaService,
    ],
    exports: [
        MiscService,
        PrismaService,
    ],
})
export class MiscModule{}
