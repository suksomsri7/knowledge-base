import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Migrating: rename email -> username ...");

  await sql`ALTER TABLE users RENAME COLUMN email TO username`;
  console.log("  Column renamed.");

  await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique`;
  console.log("  Old unique constraint dropped.");

  await sql`ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username)`;
  console.log("  New unique constraint added.");

  console.log("Migration complete!");
}

migrate().catch(console.error);
