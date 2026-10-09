import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reels_media_source" AS ENUM('upload', 'youtube');
  CREATE TYPE "public"."enum_reels_orientation" AS ENUM('portrait', 'landscape');
  ALTER TABLE "reels" ALTER COLUMN "video_id" DROP NOT NULL;
  ALTER TABLE "reels" ADD COLUMN "media_source" "enum_reels_media_source" DEFAULT 'upload' NOT NULL;
  ALTER TABLE "reels" ADD COLUMN "orientation" "enum_reels_orientation" DEFAULT 'portrait' NOT NULL;
  ALTER TABLE "reels" ADD COLUMN "youtube_url" varchar;`)

  // Verified against Akshay's channel and YouTube oEmbed. Existing clips and editor content stay intact.
  await db.execute(sql`
    INSERT INTO "reels" ("title", "category", "location", "media_source", "orientation",
      "youtube_url", "caption", "featured", "order")
    SELECT film.title, film.category::"enum_reels_category", film.location, 'youtube',
      film.orientation::"enum_reels_orientation", film.url, film.caption, true, film.position
    FROM (VALUES
      ('Harshita Gupta & Shrey Chabbra', 'haldi', 'Jim Corbett, Uttarakhand', 'portrait',
       'https://www.youtube.com/watch?v=zR7TZuHqzy8',
       'Akshay hosting the haldi ceremony of Harshita Gupta and Shrey Chabbra.', -30),
      ('Tarika & Dhruv', 'wedding', NULL, 'landscape',
       'https://www.youtube.com/watch?v=TzoFugiu4Go',
       'The wedding of Tarika and Dhruv, hosted by Akshay.', -20),
      ('Sangeet, Haldi & Wedding Carnival', 'wedding', NULL, 'landscape',
       'https://www.youtube.com/watch?v=U9jM_swbcy0',
       'Sangeet, haldi and wedding carnival celebrations with Akshay on the mic.', -10)
    ) AS film(title, category, location, orientation, url, caption, position)
    WHERE NOT EXISTS (SELECT 1 FROM "reels" existing WHERE existing.youtube_url = film.url);

    UPDATE "site_settings" SET "youtube" = 'https://www.youtube.com/@akshaytakalkarr'
    WHERE "youtube" IS NULL OR trim("youtube") = '';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "reels" WHERE "video_id" IS NULL OR "media_source" = 'youtube') THEN
        RAISE EXCEPTION 'Export or convert YouTube reels to uploaded videos before rolling back; rollback will not discard films.';
      END IF;
    END $$;
  ALTER TABLE "reels" ALTER COLUMN "video_id" SET NOT NULL;
  ALTER TABLE "reels" DROP COLUMN "media_source";
  ALTER TABLE "reels" DROP COLUMN "orientation";
  ALTER TABLE "reels" DROP COLUMN "youtube_url";
  DROP TYPE "public"."enum_reels_media_source";
  DROP TYPE "public"."enum_reels_orientation";`)
}
