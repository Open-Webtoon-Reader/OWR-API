import {PrismaClient} from "@prisma/client";
import * as dotenv from "dotenv";
import WebtoonGenres from "./../src/modules/webtoon/webtoon/models/enums/webtoon-genres";
import ImageTypes from "./../src/modules/webtoon/webtoon/models/enums/image-types";

dotenv.config();

// initialize Prisma Client
const prisma = new PrismaClient();

async function main(){
    const gStart = Date.now();
    const webtoon_genres_values = Object.values(WebtoonGenres).map(value => ({name: value}));
    await seed(prisma.genres, webtoon_genres_values);

    const image_types_values = Object.values(ImageTypes).map(value => ({name: value}));
    await seed(prisma.imageTypes, image_types_values);
    console.log(`\n✅  Seeding completed ! (${Date.now() - gStart}ms)`);
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
