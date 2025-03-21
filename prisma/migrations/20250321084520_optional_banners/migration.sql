-- DropForeignKey
ALTER TABLE "webtoons" DROP CONSTRAINT "webtoons_background_banner_id_fkey";

-- DropForeignKey
ALTER TABLE "webtoons" DROP CONSTRAINT "webtoons_mobile_banner_id_fkey";

-- DropForeignKey
ALTER TABLE "webtoons" DROP CONSTRAINT "webtoons_top_banner_id_fkey";

-- AlterTable
ALTER TABLE "webtoons" ALTER COLUMN "background_banner_id" DROP NOT NULL,
ALTER COLUMN "top_banner_id" DROP NOT NULL,
ALTER COLUMN "mobile_banner_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "webtoons" ADD CONSTRAINT "webtoons_background_banner_id_fkey" FOREIGN KEY ("background_banner_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoons" ADD CONSTRAINT "webtoons_top_banner_id_fkey" FOREIGN KEY ("top_banner_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoons" ADD CONSTRAINT "webtoons_mobile_banner_id_fkey" FOREIGN KEY ("mobile_banner_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
