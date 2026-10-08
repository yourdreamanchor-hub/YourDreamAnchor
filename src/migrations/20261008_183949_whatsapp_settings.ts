import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "base_city" SET DEFAULT 'Mumbai · Bengaluru · Destination';
  ALTER TABLE "site_settings" ADD COLUMN "whatsapp_message" varchar DEFAULT 'Hi Akshay! I found you on your website and would like to check your availability for my celebration.';
  ALTER TABLE "site_settings" ADD COLUMN "show_whats_app_button" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "base_city" SET DEFAULT 'Mumbai, India';
  ALTER TABLE "site_settings" DROP COLUMN "whatsapp_message";
  ALTER TABLE "site_settings" DROP COLUMN "show_whats_app_button";`)
}
