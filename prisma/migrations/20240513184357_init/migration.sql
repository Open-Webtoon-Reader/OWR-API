-- CreateTable
CREATE TABLE "image_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sum" TEXT NOT NULL,
    "type_id" INTEGER NOT NULL,
    CONSTRAINT "images_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "image_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "genres" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "webtoon_genres" (
    "webtoon_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    PRIMARY KEY ("webtoon_id", "genre_id"),
    CONSTRAINT "webtoon_genres_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "webtoon_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webtoons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "thumbnail_id" INTEGER NOT NULL,
    "background_banner_id" INTEGER NOT NULL,
    "top_banner_id" INTEGER NOT NULL,
    "mobile_banner_id" INTEGER NOT NULL,
    CONSTRAINT "webtoons_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "webtoons_background_banner_id_fkey" FOREIGN KEY ("background_banner_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "webtoons_top_banner_id_fkey" FOREIGN KEY ("top_banner_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "webtoons_mobile_banner_id_fkey" FOREIGN KEY ("mobile_banner_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "webtoon_id" INTEGER NOT NULL,
    "thumbnail_id" INTEGER NOT NULL,
    CONSTRAINT "episodes_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "episodes_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "episode_images" (
    "number" INTEGER NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "image_id" INTEGER NOT NULL,

    PRIMARY KEY ("episode_id", "number"),
    CONSTRAINT "episode_images_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "episode_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
