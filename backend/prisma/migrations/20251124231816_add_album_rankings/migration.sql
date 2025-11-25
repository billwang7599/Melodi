-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "top_song_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "album_id" TEXT;

-- CreateTable
CREATE TABLE "album_rankings" (
    "id" BIGSERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "spotify_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "album_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "album_rankings_post_id_rank_key" ON "album_rankings"("post_id", "rank");

-- AddForeignKey
ALTER TABLE "album_rankings" ADD CONSTRAINT "album_rankings_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

