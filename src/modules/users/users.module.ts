import {Module} from "@nestjs/common";
import {UsersController} from "./users.controller";
import {UsersService} from "./users.service";
import {MiscModule} from "../misc/misc.module";
import {JwtStrategy} from "./strategies/jwt.strategy";
import {ConfigService} from "@nestjs/config";
import {JwtModule} from "@nestjs/jwt";
import {AdminJwtStrategy} from "./strategies/admin-jwt.strategy";

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>("APP_SECRET"),
                signOptions: {
                    expiresIn: "30d",
                    algorithm: "HS512",
                    issuer: "OWR",
                },
                verifyOptions: {
                    algorithms: ["HS512"],
                    issuer: "OWR",
                },
            }),
        }),
        MiscModule,
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        JwtStrategy,
        AdminJwtStrategy,
    ],
    exports: [UsersService],
})
export class UsersModule{}
