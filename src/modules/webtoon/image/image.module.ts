import {Module} from "@nestjs/common";
import {ImageController} from "./image.controller";
import {WebtoonModule} from "../webtoon/webtoon.module";

@Module({
    controllers: [ImageController],
    imports: [WebtoonModule],
})
export class ImageModule{}
