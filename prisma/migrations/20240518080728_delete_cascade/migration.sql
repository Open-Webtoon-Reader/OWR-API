-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_webtoon_genres" (
    "webtoon_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    PRIMARY KEY ("webtoon_id", "genre_id"),
    CONSTRAINT "webtoon_genres_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "webtoon_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_webtoon_genres" ("genre_id", "webtoon_id") SELECT "genre_id", "webtoon_id" FROM "webtoon_genres";
DROP TABLE "webtoon_genres";
ALTER TABLE "new_webtoon_genres" RENAME TO "webtoon_genres";
CREATE TABLE "new_episode_images" (
    "number" INTEGER NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "image_id" INTEGER NOT NULL,

    PRIMARY KEY ("episode_id", "number"),
    CONSTRAINT "episode_images_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "episode_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_episode_images" ("episode_id", "image_id", "number") SELECT "episode_id", "image_id", "number" FROM "episode_images";
DROP TABLE "episode_images";
ALTER TABLE "new_episode_images" RENAME TO "episode_images";
CREATE TABLE "new_episodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "webtoon_id" INTEGER NOT NULL,
    "thumbnail_id" INTEGER NOT NULL,
    CONSTRAINT "episodes_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "episodes_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_episodes" ("id", "number", "thumbnail_id", "title", "webtoon_id") SELECT "id", "number", "thumbnail_id", "title", "webtoon_id" FROM "episodes";
DROP TABLE "episodes";
ALTER TABLE "new_episodes" RENAME TO "episodes";
CREATE UNIQUE INDEX "episodes_webtoon_id_number_key" ON "episodes"("webtoon_id", "number");
PRAGMA foreign_key_check("webtoon_genres");
PRAGMA foreign_key_check("episode_images");
PRAGMA foreign_key_check("episodes");
PRAGMA foreign_keys=ON;
