import {IsNotEmpty, IsString} from "class-validator";

export class LoginDto{
    @IsString()
    @IsNotEmpty()
    usernameOrEmail: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
