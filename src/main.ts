import {FastifyAdapter, NestFastifyApplication} from "@nestjs/platform-fastify";
import {CustomValidationPipe} from "./common/pipes/custom-validation.pipe";
import {LoggerMiddleware} from "./common/middlewares/logger.middleware";
import {SwaggerTheme, SwaggerThemeNameEnum} from "swagger-themes";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import fastifyHelmet from "@fastify/helmet";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {Logger} from "@nestjs/common";
import * as process from "process";
import * as dotenv from "dotenv";
import {FastifyListenOptions} from "fastify/types/instance";

dotenv.config();

const logger: Logger = new Logger("App");

async function bootstrap(){
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({exposeHeadRoutes: true}),
    );
    await loadServer(app);
    const port = process.env.PORT || 4000;
    // @ts-ignore
    await app.listen({
        port: port,
        host: "0.0.0.0",
    } as FastifyListenOptions);
    app.enableShutdownHooks();
    logger.log(`Listening on http://0.0.0.0:${port}`);
}

async function loadServer(server: NestFastifyApplication){
    // Config
    server.setGlobalPrefix(process.env.PREFIX);
    server.enableCors({
        origin: "*",
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
    SwaggerModule.setup("api", server, document, {
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

    server.useGlobalPipes(new CustomValidationPipe());
}

bootstrap();
