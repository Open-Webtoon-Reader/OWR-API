-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_episodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "webtoon_id" INTEGER NOT NULL,
    "thumbnail_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "episodes_webtoon_id_fkey" FOREIGN KEY ("webtoon_id") REFERENCES "webtoons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "episodes_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_episodes" ("id", "number", "thumbnail_id", "title", "webtoon_id") SELECT "id", "number", "thumbnail_id", "title", "webtoon_id" FROM "episodes";
DROP TABLE "episodes";
ALTER TABLE "new_episodes" RENAME TO "episodes";
CREATE UNIQUE INDEX "episodes_webtoon_id_number_key" ON "episodes"("webtoon_id", "number");
CREATE TABLE "new_webtoons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "thumbnail_id" INTEGER NOT NULL,
    "background_banner_id" INTEGER NOT NULL,
    "top_banner_id" INTEGER NOT NULL,
    "mobile_banner_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webtoons_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "webtoons_background_banner_id_fkey" FOREIGN KEY ("background_banner_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "webtoons_top_banner_id_fkey" FOREIGN KEY ("top_banner_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "webtoons_mobile_banner_id_fkey" FOREIGN KEY ("mobile_banner_id") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_webtoons" ("author", "background_banner_id", "id", "language", "mobile_banner_id", "thumbnail_id", "title", "top_banner_id") SELECT "author", "background_banner_id", "id", "language", "mobile_banner_id", "thumbnail_id", "title", "top_banner_id" FROM "webtoons";
DROP TABLE "webtoons";
ALTER TABLE "new_webtoons" RENAME TO "webtoons";
CREATE UNIQUE INDEX "webtoons_thumbnail_id_key" ON "webtoons"("thumbnail_id");
CREATE UNIQUE INDEX "webtoons_background_banner_id_key" ON "webtoons"("background_banner_id");
CREATE UNIQUE INDEX "webtoons_top_banner_id_key" ON "webtoons"("top_banner_id");
CREATE UNIQUE INDEX "webtoons_mobile_banner_id_key" ON "webtoons"("mobile_banner_id");
CREATE UNIQUE INDEX "webtoons_title_author_language_key" ON "webtoons"("title", "author", "language");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
