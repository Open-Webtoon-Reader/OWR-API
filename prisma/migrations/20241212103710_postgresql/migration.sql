-- CreateTable
CREATE TABLE "image_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "image_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "sum" TEXT NOT NULL,
    "type_id" INTEGER NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webtoon_genres" (
    "webtoon_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "webtoon_genres_pkey" PRIMARY KEY ("webtoon_id","genre_id")
);

-- CreateTable
CREATE TABLE "webtoons" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "thumbnail_id" INTEGER NOT NULL,
    "background_banner_id" INTEGER NOT NULL,
    "top_banner_id" INTEGER NOT NULL,
    "mobile_banner_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webtoons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "webtoon_id" INTEGER NOT NULL,
    "thumbnail_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_images" (
    "number" INTEGER NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "image_id" INTEGER NOT NULL,

    CONSTRAINT "episode_images_pkey" PRIMARY KEY ("episode_id","number")
);

-- CreateIndex
CREATE UNIQUE INDEX "images_sum_key" ON "images"("sum");

-- CreateIndex
CREATE UNIQUE INDEX "webtoons_thumbnail_id_key" ON "webtoons"("thumbnail_id");

-- CreateIndex
CREATE UNIQUE INDEX "webtoons_background_banner_id_key" ON "webtoons"("background_banner_id");

-- CreateIndex
CREATE UNIQUE INDEX "webtoons_top_banner_id_key" ON "webtoons"("top_banner_id");

-- CreateIndex
CREATE UNIQUE INDEX "webtoons_mobile_banner_id_key" ON "webtoons"("mobile_banner_id");

-- CreateIndex
CREATE UNIQUE INDEX "webtoons_title_author_language_key" ON "webtoons"("title", "author", "language");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_webtoon_id_number_key" ON "episodes"("webtoon_id", "number");

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "image_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoon_genres" ADD CONSTRAINT "webtoon_genres_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoon_genres" ADD CONSTRAINT "webtoon_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoons" ADD CONSTRAINT "webtoons_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoons" ADD CONSTRAINT "webtoons_background_banner_id_fkey" FOREIGN KEY ("background_banner_id") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoons" ADD CONSTRAINT "webtoons_top_banner_id_fkey" FOREIGN KEY ("top_banner_id") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoons" ADD CONSTRAINT "webtoons_mobile_banner_id_fkey" FOREIGN KEY ("mobile_banner_id") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_images" ADD CONSTRAINT "episode_images_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_images" ADD CONSTRAINT "episode_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
