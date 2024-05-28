import {FastifyAdapter, NestFastifyApplication} from "@nestjs/platform-fastify";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {RawServerDefault} from "fastify";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import * as process from "process";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as os from "os";
import {SwaggerTheme, SwaggerThemeNameEnum} from "swagger-themes";
import {LoggerMiddleware} from "./common/middlewares/logger.middleware";
import {Logger} from "@nestjs/common";
import {CustomValidationPipe} from "./common/pipes/custom-validation.pipe";

dotenv.config();

const logger: Logger = new Logger("App");

async function bootstrap(){
    switch (process.env.SERVER_TYPE){
        case "http":
            await startHttpServer();
            break;
        case "https":
            await startHttpsServer();
            break;
        default:
            logger.error("Invalid SERVER_TYPE");
            process.exit(1);
    }
}

function getServerAddress(bindAddress: string, port: string | number, protocol: string){
    if(bindAddress === "0.0.0.0"){
        const ifaces = os.networkInterfaces();
        Object.keys(ifaces).forEach(function(ifname){
            let alias = 0;
            ifaces[ifname].forEach(function(iface){
                if("IPv4" !== iface.family || iface.internal !== false)
                    return;
                if(alias >= 1)
                    bindAddress = iface.address;
                else
                    bindAddress = iface.address;
                ++alias;
            });
        });
    }
    return `${protocol}://${bindAddress}:${port}`;
}

function logServerStart(bindAddress: string, port: string | number, protocol: string){
    logger.log(`Server started on ${getServerAddress(bindAddress, port, protocol)}`);
}

async function startHttpServer(){
    const httpApp = await NestFactory.create<NestFastifyApplication>(AppModule , new FastifyAdapter({exposeHeadRoutes: true}));
    await loadServer(httpApp, getServerAddress(process.env.BIND_ADDRESS, process.env.HTTP_PORT, "http"));
    await httpApp.listen(process.env.HTTP_PORT, process.env.BIND_ADDRESS);
    logServerStart(process.env.BIND_ADDRESS, process.env.HTTP_PORT, "http");
}

async function startHttpsServer(){
    const httpsOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_FILE),
        cert: fs.readFileSync(process.env.SSL_CERT_FILE),
    };
    const httpsApp = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({https: httpsOptions}));
    await loadServer(httpsApp, getServerAddress(process.env.BIND_ADDRESS, process.env.HTTP_PORT, "https"));
    await httpsApp.listen(process.env.HTTPS_PORT, process.env.BIND_ADDRESS);
    logServerStart(process.env.BIND_ADDRESS, process.env.HTTPS_PORT, "https");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadServer(server: NestFastifyApplication<RawServerDefault>, serverAddress: string){
    // Config
    server.setGlobalPrefix(process.env.PREFIX);
    server.enableCors({
        origin: "*",
    });

    // Middlewares
    server.use(new LoggerMiddleware().use);

    // Swagger
    const config = new DocumentBuilder()
        .setTitle("Phoenix API")
        .setDescription("Documentation for the Phoenix API")
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
