import {IsAlphanumeric, IsEmail, IsNotEmpty, IsString, Length} from "class-validator";

export class CreateUserDto{
    @IsString()
    @IsNotEmpty()
    @Length(3, 30)
    @IsAlphanumeric()
    username: string;

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Length(8, 255)
    email: string;

    @IsString()
    @IsNotEmpty()
    @Length(8, 255)
    password: string;
}
