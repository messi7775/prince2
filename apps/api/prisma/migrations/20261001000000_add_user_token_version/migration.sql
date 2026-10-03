-- Add per-user token version for session invalidation.
ALTER TABLE "public"."users"
ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
