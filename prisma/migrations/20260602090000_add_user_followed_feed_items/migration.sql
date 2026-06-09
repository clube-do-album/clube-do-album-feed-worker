-- AlterEnum
ALTER TYPE "feed_item_type" ADD VALUE IF NOT EXISTS 'USER_FOLLOWED';

-- AlterTable
ALTER TABLE "feed_items" ALTER COLUMN "album_id" DROP NOT NULL;
ALTER TABLE "feed_items" ADD COLUMN IF NOT EXISTS "target_user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "feed_items_type_user_id_target_user_id_occurred_at_key"
ON "feed_items"("type", "user_id", "target_user_id", "occurred_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feed_items_target_user_id_created_at_idx"
ON "feed_items"("target_user_id", "created_at");
