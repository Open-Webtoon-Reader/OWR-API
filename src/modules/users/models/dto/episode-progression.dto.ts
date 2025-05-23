import {IsInt, IsNotEmpty} from "class-validator";

export class EpisodeProgressionDto{
    @IsInt()
    @IsNotEmpty()
    progression: number;
}
