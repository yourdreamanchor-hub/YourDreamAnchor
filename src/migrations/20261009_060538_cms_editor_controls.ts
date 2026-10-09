import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_hero_films_source" AS ENUM('wedding', 'sangeet', 'haldi', 'games', 'upload');
  CREATE TYPE "public"."enum_home_marquee_section" AS ENUM('auto', 'none', 'about', 'services', 'moments', 'gallery', 'games', 'destinations', 'love', 'contact');
  CREATE TYPE "public"."enum_home_games_background_style" AS ENUM('celebration', 'upload', 'plain');
  CREATE TYPE "public"."enum_site_settings_navigation_section" AS ENUM('about', 'services', 'moments', 'gallery', 'games', 'destinations', 'love', 'contact');
  CREATE TYPE "public"."enum_site_settings_logo_style" AS ENUM('monogram', 'upload');
  CREATE TABLE "home_hero_films" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "source" "enum_home_hero_films_source" DEFAULT 'upload' NOT NULL,
    "enabled" boolean DEFAULT true,
    "video_id" integer,
    "poster_id" integer,
    "mobile_video_id" integer,
    "mobile_poster_id" integer
  );

  CREATE TABLE "site_settings_navigation" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "section" "enum_site_settings_navigation_section" NOT NULL
  );

  ALTER TABLE "home" ALTER COLUMN "hero_headline" SET DEFAULT 'Akshay R Takalkar';
  ALTER TABLE "home_marquee" ADD COLUMN "section" "enum_home_marquee_section" DEFAULT 'auto';
  ALTER TABLE "home" ADD COLUMN "hero_auto_play" boolean DEFAULT true;
  ALTER TABLE "home" ADD COLUMN "services_kicker" varchar DEFAULT 'Ceremonies';
  ALTER TABLE "home" ADD COLUMN "moments_kicker" varchar DEFAULT 'Moments';
  ALTER TABLE "home" ADD COLUMN "gallery_kicker" varchar DEFAULT 'Gallery';
  ALTER TABLE "home" ADD COLUMN "games_background_style" "enum_home_games_background_style" DEFAULT 'celebration';
  ALTER TABLE "home" ADD COLUMN "games_background_id" integer;
  ALTER TABLE "home" ADD COLUMN "destinations_kicker" varchar DEFAULT 'Where we’ve celebrated';
  ALTER TABLE "home" ADD COLUMN "testimonials_kicker" varchar DEFAULT 'Kind words';
  ALTER TABLE "home" ADD COLUMN "contact_kicker" varchar DEFAULT 'Bookings';
  ALTER TABLE "site_settings" ADD COLUMN "logo_style" "enum_site_settings_logo_style" DEFAULT 'monogram';
  ALTER TABLE "site_settings" ADD COLUMN "booking_label" varchar DEFAULT 'Book a date';
  ALTER TABLE "site_settings" ADD COLUMN "footer_note" varchar DEFAULT 'All celebrations reserved.';
  ALTER TABLE "site_settings" ADD COLUMN "show_logo_intro" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "scroll_animations" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "header_logo_transition" boolean DEFAULT true;
  ALTER TABLE "home_hero_films" ADD CONSTRAINT "home_hero_films_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_films" ADD CONSTRAINT "home_hero_films_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_films" ADD CONSTRAINT "home_hero_films_mobile_video_id_media_id_fk" FOREIGN KEY ("mobile_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_films" ADD CONSTRAINT "home_hero_films_mobile_poster_id_media_id_fk" FOREIGN KEY ("mobile_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_films" ADD CONSTRAINT "home_hero_films_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_navigation" ADD CONSTRAINT "site_settings_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_hero_films_order_idx" ON "home_hero_films" USING btree ("_order");
  CREATE INDEX "home_hero_films_parent_id_idx" ON "home_hero_films" USING btree ("_parent_id");
  CREATE INDEX "home_hero_films_video_idx" ON "home_hero_films" USING btree ("video_id");
  CREATE INDEX "home_hero_films_poster_idx" ON "home_hero_films" USING btree ("poster_id");
  CREATE INDEX "home_hero_films_mobile_video_idx" ON "home_hero_films" USING btree ("mobile_video_id");
  CREATE INDEX "home_hero_films_mobile_poster_idx" ON "home_hero_films" USING btree ("mobile_poster_id");
  CREATE INDEX "site_settings_navigation_order_idx" ON "site_settings_navigation" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_parent_id_idx" ON "site_settings_navigation" USING btree ("_parent_id");
  ALTER TABLE "home" ADD CONSTRAINT "home_games_background_id_media_id_fk" FOREIGN KEY ("games_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_games_games_background_idx" ON "home" USING btree ("games_background_id");`)

  // Carry the visible lineup into the editor without replacing a previously chosen custom video.
  await db.execute(sql`
    INSERT INTO "home_hero_films" ("_order", "_parent_id", "id", "label", "source", "enabled")
    SELECT film.position, home.id, 'hero-' || home.id || '-' || film.source, film.label,
      film.source::"enum_home_hero_films_source", true
    FROM "home" home
    JOIN "media" media ON media.id = home.hero_video_id
    CROSS JOIN (VALUES (1, 'Wedding', 'wedding'), (2, 'Sangeet', 'sangeet'),
      (3, 'Haldi', 'haldi'), (4, 'Games', 'games')) AS film(position, label, source)
    WHERE media.filename IN ('hero-loop.mp4', 'hero-loop-1.mp4', 'hero-quality-v1.mp4');

    INSERT INTO "home_hero_films" ("_order", "_parent_id", "id", "label", "source", "enabled", "video_id", "poster_id")
    SELECT 1, home.id, 'hero-' || home.id || '-upload', 'Highlights', 'upload', true,
      home.hero_video_id, home.hero_poster_id
    FROM "home" home JOIN "media" media ON media.id = home.hero_video_id
    WHERE media.filename NOT IN ('hero-loop.mp4', 'hero-loop-1.mp4', 'hero-quality-v1.mp4');

    INSERT INTO "site_settings_navigation" ("_order", "_parent_id", "id", "label", "section")
    SELECT link.position, settings.id, 'nav-' || settings.id || '-' || link.section, link.label,
      link.section::"enum_site_settings_navigation_section"
    FROM "site_settings" settings
    CROSS JOIN (VALUES (1, 'About', 'about'), (2, 'Ceremonies', 'services'), (3, 'Moments', 'moments'),
      (4, 'Gallery', 'gallery'), (5, 'Games', 'games'), (6, 'Kind words', 'love')) AS link(position, label, section);

    UPDATE "site_settings" settings SET "logo_style" = 'upload'
    FROM "media" media WHERE settings.logo_id = media.id
      AND media.filename !~ '^(logo-avatar(-[0-9]+)?[.]jpg|anchor-monogram-v1(-[0-9]+)?[.]svg)$';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_hero_films" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_navigation" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_hero_films" CASCADE;
  DROP TABLE "site_settings_navigation" CASCADE;
  ALTER TABLE "home" DROP CONSTRAINT "home_games_background_id_media_id_fk";

  DROP INDEX "home_games_games_background_idx";
  ALTER TABLE "home" ALTER COLUMN "hero_headline" SET DEFAULT 'Every celebration deserves a voice.';
  ALTER TABLE "home_marquee" DROP COLUMN "section";
  ALTER TABLE "home" DROP COLUMN "hero_auto_play";
  ALTER TABLE "home" DROP COLUMN "services_kicker";
  ALTER TABLE "home" DROP COLUMN "moments_kicker";
  ALTER TABLE "home" DROP COLUMN "gallery_kicker";
  ALTER TABLE "home" DROP COLUMN "games_background_style";
  ALTER TABLE "home" DROP COLUMN "games_background_id";
  ALTER TABLE "home" DROP COLUMN "destinations_kicker";
  ALTER TABLE "home" DROP COLUMN "testimonials_kicker";
  ALTER TABLE "home" DROP COLUMN "contact_kicker";
  ALTER TABLE "site_settings" DROP COLUMN "logo_style";
  ALTER TABLE "site_settings" DROP COLUMN "booking_label";
  ALTER TABLE "site_settings" DROP COLUMN "footer_note";
  ALTER TABLE "site_settings" DROP COLUMN "show_logo_intro";
  ALTER TABLE "site_settings" DROP COLUMN "scroll_animations";
  ALTER TABLE "site_settings" DROP COLUMN "header_logo_transition";
  DROP TYPE "public"."enum_home_hero_films_source";
  DROP TYPE "public"."enum_home_marquee_section";
  DROP TYPE "public"."enum_home_games_background_style";
  DROP TYPE "public"."enum_site_settings_navigation_section";
  DROP TYPE "public"."enum_site_settings_logo_style";`)
}
