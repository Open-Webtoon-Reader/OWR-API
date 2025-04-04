import {PrismaClient, Users} from "@prisma/client";
import WebtoonGenres from "./../src/modules/webtoon/webtoon/models/enums/webtoon-genres";
import ImageTypes from "./../src/modules/webtoon/webtoon/models/enums/image-types";
import {MiscService} from "../src/modules/misc/misc.service";

// initialize Prisma Client
const prisma = new PrismaClient();
const miscService = new MiscService();

async function main(){
    const gStart = Date.now();
    const webtoon_genres_values = Object.values(WebtoonGenres).map(value => ({name: value}));
    await seed(prisma.genres, webtoon_genres_values);

    const image_types_values = Object.values(ImageTypes).map(value => ({name: value}));
    await seed(prisma.imageTypes, image_types_values);

    const users_values = [
        {
            id: "0195dc7c-f315-7881-b35b-da9cbb6ee4a0",
            username: process.env.ADMIN_USERNAME || "admin",
            email: process.env.ADMIN_EMAIL || "admin@admin.com",
            password: miscService.hashPassword(process.env.ADMIN_PASSWORD || "password@admin.com"),
            jwt_id: miscService.generateRandomBytes(32),
            admin: true,
        } as Users,
    ];
    await idSeed(prisma.users, users_values, false);
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

async function idSeed(table: any, data: any[], update: boolean = true){
    for(let i = 0; i < data.length; i++){
        await table.upsert({
            where: {id: data[i].id},
            update: update
                ? {
                    ...data[i],
                }
                : {},
            create: {
                ...data[i],
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
