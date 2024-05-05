-- CreateTable
CREATE TABLE "webtoons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "episodes_thumbnails_zip_sum" TEXT,
    "thumbnail_sum" TEXT NOT NULL,
    "background_banner_sum" TEXT NOT NULL,
    "top_banner_sum" TEXT NOT NULL,
    "mobile_banner_sum" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "webtoon_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "images_zip_sum" TEXT NOT NULL,
    "thumbnail_sum" TEXT NOT NULL,
    CONSTRAINT "episodes_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "episode_images" (
    "episode_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "sum" TEXT NOT NULL,

    PRIMARY KEY ("episode_id", "number"),
    CONSTRAINT "episode_images_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "episodes_webtoon_id_number_key" ON "episodes"("webtoon_id", "number");
