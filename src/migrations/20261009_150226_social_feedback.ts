import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import feedback from '../content/social-feedback.json'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_testimonials_audience" AS ENUM('celebration', 'industry', 'community');
  CREATE TYPE "public"."enum_testimonials_source_platform" AS ENUM('instagram', 'youtube', 'other');
  ALTER TABLE "testimonials" ADD COLUMN "audience" "enum_testimonials_audience" DEFAULT 'celebration' NOT NULL;
  ALTER TABLE "testimonials" ADD COLUMN "source_platform" "enum_testimonials_source_platform" DEFAULT 'other' NOT NULL;
  ALTER TABLE "testimonials" ADD COLUMN "source_handle" varchar;
  ALTER TABLE "testimonials" ADD COLUMN "source_url" varchar;
  ALTER TABLE "testimonials" ADD COLUMN "source_id" varchar;
  ALTER TABLE "testimonials" ADD COLUMN "featured" boolean DEFAULT true;
  CREATE UNIQUE INDEX "testimonials_source_id_idx" ON "testimonials" USING btree ("source_id");`)

  // Add original source attribution without replacing an editor's changed quote or other content.
  for (const comment of feedback) {
    if (comment.legacyQuote) {
      await db.execute(sql`
        UPDATE "testimonials" SET "quote" = ${comment.quote},
          "audience" = ${comment.audience}::"enum_testimonials_audience",
          "source_platform" = ${comment.sourcePlatform}::"enum_testimonials_source_platform",
          "source_handle" = ${comment.sourceHandle}, "source_url" = ${comment.sourceUrl},
          "source_id" = ${comment.sourceId}
        WHERE "id" = (
          SELECT "id" FROM "testimonials" WHERE "source_id" IS NULL
            AND "name" = ${comment.name} AND "quote" = ${comment.legacyQuote}
          ORDER BY "id" LIMIT 1
        ) AND NOT EXISTS (SELECT 1 FROM "testimonials" WHERE "source_id" = ${comment.sourceId});
      `)
    }
    await db.execute(sql`
      INSERT INTO "testimonials" ("quote", "name", "event", "audience", "source_platform",
        "source_handle", "source_url", "source_id", "featured", "order")
      SELECT ${comment.quote}, ${comment.name}, ${comment.event},
        ${comment.audience}::"enum_testimonials_audience",
        ${comment.sourcePlatform}::"enum_testimonials_source_platform",
        ${comment.sourceHandle}, ${comment.sourceUrl}, ${comment.sourceId}, true, ${comment.order}
      WHERE NOT EXISTS (SELECT 1 FROM "testimonials" WHERE "source_id" = ${comment.sourceId});
    `)
  }
  await db.execute(sql`
    UPDATE "home" SET "testimonials_heading" = 'What people *said.*'
    WHERE "testimonials_heading" = 'What the families *said.*';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "testimonials" WHERE "source_id" IS NOT NULL
        OR "source_url" IS NOT NULL OR "source_handle" IS NOT NULL
        OR "audience" <> 'celebration' OR "featured" = false) THEN
        RAISE EXCEPTION 'Export feedback and its source attribution before rolling back; rollback will not discard editor content.';
      END IF;
    END $$;
  DROP INDEX "testimonials_source_id_idx";
  ALTER TABLE "testimonials" DROP COLUMN "audience";
  ALTER TABLE "testimonials" DROP COLUMN "source_platform";
  ALTER TABLE "testimonials" DROP COLUMN "source_handle";
  ALTER TABLE "testimonials" DROP COLUMN "source_url";
  ALTER TABLE "testimonials" DROP COLUMN "source_id";
  ALTER TABLE "testimonials" DROP COLUMN "featured";
  DROP TYPE "public"."enum_testimonials_audience";
  DROP TYPE "public"."enum_testimonials_source_platform";`)
}
