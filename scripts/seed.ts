import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const neonSql = neon(process.env.DATABASE_URL!);
const db = drizzle(neonSql);

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("admin123", 12);

  await db.execute(
    sql`INSERT INTO users (email, password_hash, display_name, is_super_admin, is_active)
        VALUES (${`admin@admin.com`}, ${passwordHash}, ${"Super Admin"}, ${true}, ${true})
        ON CONFLICT (email) DO NOTHING`
  );

  console.log("Super Admin created:");
  console.log("  Email: admin@admin.com");
  console.log("  Password: admin123");
  console.log("");
  console.log("Seed complete!");
}

seed().catch(console.error);
