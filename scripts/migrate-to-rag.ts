import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

const neonSql = neon(process.env.DATABASE_URL!);
const db = drizzle(neonSql);

async function migrate() {
  console.log("Starting RAG migration...\n");

  // Step 1: Create agents table
  console.log("1. Creating agents table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL,
      description TEXT,
      api_key VARCHAR(100) UNIQUE NOT NULL,
      answer_threshold INTEGER NOT NULL DEFAULT 75,
      escalate_threshold INTEGER NOT NULL DEFAULT 40,
      disclaimer_message TEXT DEFAULT 'ข้อมูลอาจไม่ครบถ้วน กรุณาติดต่อเจ้าหน้าที่หากต้องการข้อมูลเพิ่มเติม',
      no_answer_message TEXT DEFAULT 'ขออภัย ขอส่งเรื่องให้เจ้าหน้าที่ตรวจสอบให้ครับ',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS agents_brand_slug_idx ON agents(brand_id, slug)
  `);

  // Step 2: Drop old categories constraints and modify
  console.log("2. Modifying categories table...");
  await db.execute(sql`DROP INDEX IF EXISTS categories_brand_slug_idx`);
  await db.execute(sql`ALTER TABLE categories DROP COLUMN IF EXISTS parent_id`);
  await db.execute(sql`ALTER TABLE categories DROP COLUMN IF EXISTS icon`);

  // Check if brand_id column exists and rename to agent_id
  const colCheck = await db.execute(sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'brand_id'
  `);
  if (colCheck.rows.length > 0) {
    await db.execute(sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_brand_id_brands_id_fk`);
    await db.execute(sql`ALTER TABLE categories RENAME COLUMN brand_id TO agent_id`);
  }

  // Step 3: Create knowledge_items table
  console.log("3. Creating knowledge_items table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS knowledge_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'faq',
      question VARCHAR(500) NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT[] DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      source VARCHAR(20) NOT NULL DEFAULT 'manual',
      escalation_id UUID,
      created_by UUID REFERENCES users(id),
      updated_by UUID REFERENCES users(id),
      review_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Step 4: Create flows table
  console.log("4. Creating flows table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS flows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
      priority INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Step 5: Create flow_steps table
  console.log("5. Creating flow_steps table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS flow_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
      step_order INTEGER NOT NULL,
      type VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      options JSONB DEFAULT '[]',
      next_step_id UUID,
      is_final BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Step 6: Create escalations table
  console.log("6. Creating escalations table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS escalations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      customer_context TEXT,
      ai_attempted_answer TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      priority VARCHAR(10) NOT NULL DEFAULT 'normal',
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      resolution_type VARCHAR(20),
      answer TEXT,
      admin_notes TEXT,
      resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
      resolved_at TIMESTAMPTZ,
      session_id VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Step 7: Create kb_api_logs table
  console.log("7. Creating kb_api_logs table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS kb_api_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      endpoint VARCHAR(50) NOT NULL,
      query TEXT,
      results_count INTEGER DEFAULT 0,
      top_confidence INTEGER,
      recommendation VARCHAR(30),
      response_ms INTEGER,
      ip_address INET,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Step 8: Drop old tables
  console.log("8. Dropping old tables...");
  await db.execute(sql`DROP TABLE IF EXISTS article_versions CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS attachments CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS articles CASCADE`);

  // Step 9: Add FK constraint for categories -> agents (if not exists)
  console.log("9. Adding FK constraints...");
  try {
    await db.execute(sql`
      ALTER TABLE categories ADD CONSTRAINT categories_agent_id_agents_id_fk 
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    `);
  } catch {
    // constraint may already exist
  }
  try {
    await db.execute(sql`
      CREATE UNIQUE INDEX categories_agent_slug_idx ON categories(agent_id, slug)
    `);
  } catch {
    // index may already exist
  }

  console.log("\nMigration complete!");
}

migrate().catch(console.error);
