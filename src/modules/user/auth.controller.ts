import {Body, Controller, HttpCode, Post, Req, Res} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {AuthService} from "./auth.service";
import {LoginDto} from "./models/dto/login.dto";
import {FastifyReply, FastifyRequest} from "fastify";
import {ConfigService} from "@nestjs/config";
import {HttpStatusCode} from "axios";


@Controller("auth")
@ApiTags("Auth")
export class AuthController{

    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ){}

    @Post("login")
    @HttpCode(HttpStatusCode.NoContent)
    @ApiResponse({status: HttpStatusCode.NoContent, description: "Login successful"})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "User not found"})
    @ApiResponse({status: HttpStatusCode.Unauthorized, description: "Invalid password"})
    @ApiResponse({status: HttpStatusCode.BadRequest, description: "Invalid email format"})
    async login(@Body() body: LoginDto, @Req() request: FastifyRequest, @Res({passthrough: true}) res: FastifyReply){
        const userAgent = request.headers["user-agent"];
        const sessionUUID = await this.authService.loginUser(body.email, body.password, userAgent);
        res.setCookie("session", sessionUUID, {
            httpOnly: true,
            sameSite: "strict",
            secure: this.configService.get("SECURE_COOKIE") === "true",
            path: "/" + this.configService.get("PREFIX"),
        });
    }

}