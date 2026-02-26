-- CreateTable
CREATE TABLE "ai_chat_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_chat_memories_user_id_created_at_idx" ON "ai_chat_memories"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_chat_memories" ADD CONSTRAINT "ai_chat_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

