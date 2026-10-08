import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "inquiries" ADD COLUMN "ip_hash" varchar;
  CREATE INDEX "inquiries_ip_hash_idx" ON "inquiries" USING btree ("ip_hash");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "inquiries_ip_hash_idx";
  ALTER TABLE "inquiries" DROP COLUMN "ip_hash";`)
}
