import {PrismaClient} from "@prisma/client";
import * as dotenv from "dotenv";
import WebtoonGenres from "./../src/modules/webtoon/webtoon/models/enums/webtoon-genres";
import ImageTypes from "./../src/modules/webtoon/webtoon/models/enums/image-types";
import UserTypes from "../src/modules/user/models/enums/user-types";
import {CipherService} from "../src/modules/misc/cipher.service";

dotenv.config();

// initialize Prisma Client
const prisma = new PrismaClient();
const cipherService = new CipherService();

async function main(){
    const webtoonGenresValues = Object.values(WebtoonGenres).map(value => ({name: value}));
    await seed(prisma.genres, webtoonGenresValues);

    const imageTypesValues = Object.values(ImageTypes).map(value => ({name: value}));
    await seed(prisma.imageTypes, imageTypesValues);

    const userTypesValues = Object.values(UserTypes).map(value => ({name: value}));
    await seed(prisma.userTypes, userTypesValues);

    await prisma.users.upsert({
        where: {id: 1},
        update: {},
        create: {
            id: 1,
            email: "root@example.org",
            password: await cipherService.hash("root"),
            username: "root",
            type_id: 1,
        },
    });
}

async function seed(table: any, data: any[]){
    for(let i = 1; i <= data.length; i++){
        await table.upsert({
            where: {id: i},
            update: {
                ...data[i - 1],
            },
            create: {
                ...data[i - 1],
            },
        });
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async() => {
    await prisma.$disconnect();
});
