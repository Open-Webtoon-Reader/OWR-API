import {Module} from "@nestjs/common";
import {ImageController} from "./image.controller";
import {WebtoonModule} from "../webtoon/webtoon.module";
import {StorageModule} from "../../storage/storage.module";

@Module({
    controllers: [ImageController],
    imports: [WebtoonModule, StorageModule],
})
export class ImageModule{}
