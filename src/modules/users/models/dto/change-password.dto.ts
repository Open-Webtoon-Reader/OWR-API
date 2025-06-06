import {IsNotEmpty, IsOptional, IsString, Length} from "class-validator";

export class ChangePasswordDto{
    @IsString()
    @IsOptional()
    oldPassword?: string;

    @IsNotEmpty()
    @IsString()
    @Length(8, 255)
    newPassword: string;
}
