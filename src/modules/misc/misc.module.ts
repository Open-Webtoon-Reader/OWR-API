import {Module} from "@nestjs/common";
import {MiscService} from "./misc.service";
import {PrismaService} from "./prisma.service";
import {VersionController} from "./version.controller";
import {CipherService} from "./cipher.service";

@Module({
    imports: [],
    controllers: [VersionController],
    providers: [MiscService, PrismaService, CipherService],
    exports: [MiscService, PrismaService, CipherService],
})
export class MiscModule{}
