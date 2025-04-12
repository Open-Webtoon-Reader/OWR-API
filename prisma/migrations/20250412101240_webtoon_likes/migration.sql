-- CreateTable
CREATE TABLE "webtoon_likes" (
    "user_id" TEXT NOT NULL,
    "webtoon_id" INTEGER NOT NULL,

    CONSTRAINT "webtoon_likes_pkey" PRIMARY KEY ("user_id","webtoon_id")
);

-- AddForeignKey
ALTER TABLE "webtoon_likes" ADD CONSTRAINT "webtoon_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoon_likes" ADD CONSTRAINT "webtoon_likes_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
