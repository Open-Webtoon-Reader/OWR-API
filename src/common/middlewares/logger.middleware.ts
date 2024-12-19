import {Injectable, Logger, NestMiddleware} from "@nestjs/common";
import {FastifyReply, FastifyRequest} from "fastify";

@Injectable()
export class LoggerMiddleware implements NestMiddleware{
    static logger: Logger = new Logger(LoggerMiddleware.name);

    use(req: FastifyRequest["raw"], res: FastifyReply["raw"], next: () => void){
        const startTime = Date.now();
        res.on("finish", () => {
            const path = req.url;
            try{
                let httpOrHttps;
                if(!req.connection.localPort)
                    httpOrHttps = "H2";
                else
                    httpOrHttps = req.connection.localPort.toString() === process.env.HTTPS_PORT ? "HTTPS" : "HTTP";
                const method = req.method;
                if(method === "OPTIONS")
                    return;
                const statusCode = res.statusCode;
                const duration = Date.now() - startTime;
                const resSize: any = res.getHeader("Content-Length") || "0";
                // const nRes = res as any;
                // const resSize = nRes._contentLength || "0";
                const intResSize = parseInt(resSize);
                LoggerMiddleware.logger.log(`${httpOrHttps} ${method} ${path} ${statusCode} ${duration}ms ${intResSize}`);
                LoggerMiddleware.requestTimeLogger(path, method, duration);
            }catch(e){
                LoggerMiddleware.logger.warn(`Can't log route ${path} : ${e}`);
            }
        });
        next();
    }

    static requestTimeLogger(path: string, method: string, ms: number){
        switch (method){
            case "GET":
                if(ms > 750)
                    LoggerMiddleware.logger.warn(`GET (${path}) request took more than 750ms (${ms}ms)`);
                break;
            case "POST":
                if(ms > 1500)
                    LoggerMiddleware.logger.warn(`POST (${path}) request took more than 1500ms (${ms}ms)`);
                break;
            case "PUT":
                if(ms > 1500)
                    LoggerMiddleware.logger.warn(`PUT (${path}) request took more than 1500ms (${ms}ms)`);
                break;
            case "PATCH":
                if(ms > 500)
                    LoggerMiddleware.logger.warn(`PATCH (${path}) request took more than 500ms (${ms}ms)`);
                break;
            case "DELETE":
                if(ms > 500)
                    LoggerMiddleware.logger.warn(`DELETE (${path}) request took more than 500ms (${ms}ms)`);
                break;
        }
    }
}
