-- CreateEnum
CREATE TYPE "feed_item_type" AS ENUM ('ALBUM_RATED');

-- CreateTable
CREATE TABLE "feed_items" (
    "id" TEXT NOT NULL,
    "type" "feed_item_type" NOT NULL DEFAULT 'ALBUM_RATED',
    "user_id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "message" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feed_items_type_user_id_album_id_occurred_at_key" ON "feed_items"("type", "user_id", "album_id", "occurred_at");

-- CreateIndex
CREATE INDEX "feed_items_user_id_created_at_idx" ON "feed_items"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "feed_items_album_id_created_at_idx" ON "feed_items"("album_id", "created_at");
