import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { initialCityPages } from '../content/city-pages'
import { defaultSeoDescription, defaultSeoTitle } from '../lib/seo'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_city_pages_city" AS ENUM('mumbai', 'bengaluru');
  CREATE TABLE "city_pages_questions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar NOT NULL,
    "answer" varchar NOT NULL
  );

  CREATE TABLE "city_pages" (
    "id" serial PRIMARY KEY NOT NULL,
    "city" "enum_city_pages_city" NOT NULL,
    "published" boolean DEFAULT false,
    "headline" varchar NOT NULL,
    "intro" varchar NOT NULL,
    "image_id" integer,
    "image_caption" varchar,
    "services_heading" varchar NOT NULL,
    "moments_heading" varchar NOT NULL,
    "moments_intro" varchar,
    "planning_heading" varchar NOT NULL,
    "planning_body" varchar NOT NULL,
    "contact_heading" varchar NOT NULL,
    "contact_body" varchar,
    "meta_title" varchar NOT NULL,
    "meta_description" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "site_settings" ALTER COLUMN "meta_title" SET DEFAULT 'Wedding & Event Anchor in Mumbai & Bengaluru | Your Dream Anchor';
  ALTER TABLE "site_settings" ALTER COLUMN "meta_description" SET DEFAULT 'Akshay R Takalkar, wedding anchor and emcee in Mumbai and Bengaluru. Explore real wedding, haldi, sangeet and reception films, and check your celebration date.';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "city_pages_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "google_site_verification" varchar;
  ALTER TABLE "city_pages_questions" ADD CONSTRAINT "city_pages_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_pages" ADD CONSTRAINT "city_pages_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "city_pages_questions_order_idx" ON "city_pages_questions" USING btree ("_order");
  CREATE INDEX "city_pages_questions_parent_id_idx" ON "city_pages_questions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "city_pages_city_idx" ON "city_pages" USING btree ("city");
  CREATE INDEX "city_pages_image_idx" ON "city_pages" USING btree ("image_id");
  CREATE INDEX "city_pages_updated_at_idx" ON "city_pages" USING btree ("updated_at");
  CREATE INDEX "city_pages_created_at_idx" ON "city_pages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_city_pages_fk" FOREIGN KEY ("city_pages_id") REFERENCES "public"."city_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_city_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("city_pages_id");`)

  // Replace only untouched starting copy. Preserve any SEO text an editor has already written.
  await db.execute(sql`
    UPDATE "site_settings" SET "meta_title" = ${defaultSeoTitle}, "updated_at" = now()
    WHERE "meta_title" IS NULL OR trim("meta_title") = ''
      OR "meta_title" = 'Your Dream Anchor — Akshay R Takalkar, Wedding & Event Anchor';
  `)
  await db.execute(sql`
    UPDATE "site_settings" SET "meta_description" = ${defaultSeoDescription}, "updated_at" = now()
    WHERE "meta_description" IS NULL OR trim("meta_description") = ''
      OR "meta_description" = 'Wedding anchor and emcee for haldi, sangeet, weddings and celebrations across India. Games, music and a crowd that never sits down.';
  `)
  // Use the migration's transaction. Photos are resolved from the editable home page at render time.
  for (const data of initialCityPages) {
    const existing = await payload.count({
      collection: 'city-pages',
      where: { city: { equals: data.city } },
      req,
    })
    if (!existing.totalDocs) await payload.create({ collection: 'city-pages', data, req })
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "city_pages") OR EXISTS (
        SELECT 1 FROM "site_settings" WHERE coalesce("google_site_verification", '') <> ''
      ) THEN
        RAISE EXCEPTION 'Export city pages and remove their records and Google verification token before rollback; editor content will not be discarded.';
      END IF;
    END $$;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_city_pages_fk";
   ALTER TABLE "city_pages_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_pages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "city_pages_questions" CASCADE;
  DROP TABLE "city_pages" CASCADE;

  DROP INDEX "payload_locked_documents_rels_city_pages_id_idx";
  ALTER TABLE "site_settings" ALTER COLUMN "meta_title" SET DEFAULT 'Your Dream Anchor — Akshay R Takalkar, Wedding & Event Anchor';
  ALTER TABLE "site_settings" ALTER COLUMN "meta_description" SET DEFAULT 'Wedding anchor and emcee for haldi, sangeet, weddings and celebrations across India. Games, music and a crowd that never sits down.';
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "city_pages_id";
  ALTER TABLE "site_settings" DROP COLUMN "google_site_verification";
  DROP TYPE "public"."enum_city_pages_city";`)
}
