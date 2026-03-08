import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const neonSql = neon(process.env.DATABASE_URL!);
const db = drizzle(neonSql);

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("@Superadmin252322", 12);

  await db.execute(
    sql`INSERT INTO users (username, password_hash, display_name, is_super_admin, is_active)
        VALUES (${`superadmin`}, ${passwordHash}, ${"Super Admin"}, ${true}, ${true})
        ON CONFLICT (username) DO NOTHING`
  );

  console.log("Super Admin created:");
  console.log("  Username: superadmin");
  console.log("  Password: @Superadmin252322");
  console.log("");
  console.log("Seed complete!");
}

seed().catch(console.error);
