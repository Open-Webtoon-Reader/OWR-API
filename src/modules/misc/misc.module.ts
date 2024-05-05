import {Module} from "@nestjs/common";
import {MiscService} from "./misc.service";
import {PrismaService} from "./prisma.service";

@Module({
    imports: [],
    controllers: [],
    providers: [MiscService, PrismaService],
    exports: [MiscService, PrismaService],
})
export class MiscModule{}
