import {FastifyAdapter, NestFastifyApplication} from "@nestjs/platform-fastify";
import {LoggerMiddleware} from "./common/middlewares/logger.middleware";
import {SwaggerTheme, SwaggerThemeNameEnum} from "swagger-themes";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {FastifyListenOptions} from "fastify/types/instance";
import fastifyHelmet from "@fastify/helmet";
import {RawServerDefault} from "fastify";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {Logger} from "@nestjs/common";
import * as process from "process";

const logger: Logger = new Logger("App");

async function bootstrap(){
    const app: NestFastifyApplication<RawServerDefault> = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({exposeHeadRoutes: true}),
    );
    await loadServer(app);
    // @ts-ignore
    await app.listen({
        port: process.env.PORT || 4000,
        host: "0.0.0.0",
    } as FastifyListenOptions);
    app.enableShutdownHooks();
}

async function loadServer(server: NestFastifyApplication){
    // Config
    server.setGlobalPrefix(process.env.PREFIX || "");
    server.enableCors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    // Middlewares
    server.use(new LoggerMiddleware().use);
    await server.register(fastifyHelmet as any, {
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
    } as any);

    // Swagger
    const config = new DocumentBuilder()
        .setTitle("OWR API")
        .setDescription("Documentation for the OWR API")
        .setVersion(process.env.npm_package_version)
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(server, config);
    const theme = new SwaggerTheme();
    const customCss = theme.getBuffer(SwaggerThemeNameEnum.DARK);
    SwaggerModule.setup(process.env.PREFIX || "", server, document, {
        swaggerOptions: {
            filter: true,
            displayRequestDuration: true,
            persistAuthorization: true,
            docExpansion: "none",
            tagsSorter: "alpha",
            operationsSorter: "method",
        },
        customCss,
    });
}

bootstrap().then(() => {
    logger.log(`Listening on http://0.0.0.0:${process.env.PORT || 4000}`);
});
