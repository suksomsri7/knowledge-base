import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const BASE = "http://localhost:3000";

async function main() {
  // 1. Get an API key from DB
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT api_key, name FROM agents WHERE is_active = true LIMIT 1`;

  if (rows.length === 0) {
    console.log("❌ No active agents found. Create an agent first via the admin UI.");
    return;
  }

  const API_KEY = rows[0].api_key;
  console.log(`✅ Using agent: "${rows[0].name}" (key: ${API_KEY.slice(0, 12)}...)\n`);

  const headers = { "x-api-key": API_KEY, "Content-Type": "application/json" };
  let passed = 0;
  let failed = 0;

  async function test(name: string, method: string, url: string, body?: unknown, expectStatus = 200) {
    try {
      const opts: RequestInit = { method, headers };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${BASE}${url}`, opts);
      const json = await res.json();
      if (res.status === expectStatus) {
        console.log(`  ✅ ${method} ${url} → ${res.status}`);
        passed++;
        return json;
      } else {
        console.log(`  ❌ ${method} ${url} → ${res.status} (expected ${expectStatus})`, JSON.stringify(json).slice(0, 120));
        failed++;
        return json;
      }
    } catch (e: any) {
      console.log(`  ❌ ${method} ${url} → ERROR: ${e.message}`);
      failed++;
      return null;
    }
  }

  // --- AUTH TEST (use bad key) ---
  console.log("=== Auth ===");
  try {
    const badRes = await fetch(`${BASE}/api/v1/kb/knowledge`, {
      headers: { "x-api-key": "bad-key-12345", "Content-Type": "application/json" },
    });
    if (badRes.status === 401) {
      console.log(`  ✅ GET /api/v1/kb/knowledge (bad key) → 401`);
      passed++;
    } else {
      console.log(`  ❌ GET /api/v1/kb/knowledge (bad key) → ${badRes.status} (expected 401)`);
      failed++;
    }
  } catch (e: any) {
    console.log(`  ❌ Auth test error: ${e.message}`);
    failed++;
  }

  // --- CATEGORIES ---
  console.log("\n=== Categories ===");
  const catRes = await test("Create category", "POST", "/api/v1/kb/categories",
    { name: "Test Category API", description: "Created by test script" }, 201);
  const catId = catRes?.category?.id;

  await test("List categories", "GET", "/api/v1/kb/categories");

  if (catId) {
    await test("Get category", "GET", `/api/v1/kb/categories/${catId}`);
    await test("Update category", "PUT", `/api/v1/kb/categories/${catId}`,
      { name: "Updated Category", description: "Updated" });
  }

  // --- KNOWLEDGE ---
  console.log("\n=== Knowledge ===");
  const knRes = await test("Create knowledge", "POST", "/api/v1/kb/knowledge", {
    question: "ทดสอบคำถาม API",
    answer: "นี่คือคำตอบทดสอบจาก API",
    type: "faq",
    keywords: ["ทดสอบ", "test"],
    categoryId: catId || undefined,
  }, 201);
  const knId = knRes?.item?.id;

  await test("List knowledge", "GET", "/api/v1/kb/knowledge");
  await test("List with filter", "GET", "/api/v1/kb/knowledge?type=faq&page=1&limit=5");

  if (knId) {
    await test("Get knowledge", "GET", `/api/v1/kb/knowledge/${knId}`);
    await test("Update knowledge", "PUT", `/api/v1/kb/knowledge/${knId}`,
      { answer: "คำตอบที่แก้ไขแล้ว", keywords: ["updated", "test"] });
    await test("Toggle off", "PATCH", `/api/v1/kb/knowledge/${knId}/toggle`, { isActive: false });
    await test("Toggle on", "PATCH", `/api/v1/kb/knowledge/${knId}/toggle`, { isActive: true });
  }

  // --- SEARCH ---
  console.log("\n=== Search ===");
  await test("Search", "GET", "/api/v1/kb/search?q=ทดสอบ&limit=3");

  // --- FLOWS ---
  console.log("\n=== Flows ===");
  const flowRes = await test("Create flow", "POST", "/api/v1/kb/flows", {
    name: "Test Flow API",
    triggerKeywords: ["ทดสอบflow", "testflow"],
    priority: 5,
  }, 201);
  const flowId = flowRes?.flow?.id;

  await test("List flows", "GET", "/api/v1/kb/flows");

  if (flowId) {
    await test("Get flow", "GET", `/api/v1/kb/flows/${flowId}`);
    await test("Update flow", "PUT", `/api/v1/kb/flows/${flowId}`,
      { name: "Updated Flow", triggerKeywords: ["updated"] });

    // Steps
    const stepRes = await test("Add step", "POST", `/api/v1/kb/flows/${flowId}/steps`, {
      type: "message",
      message: "สวัสดีครับ นี่คือ test step",
      isFinal: false,
    }, 201);
    const stepId = stepRes?.step?.id;

    if (stepId) {
      await test("Get step", "GET", `/api/v1/kb/flow/step/${stepId}`);
      await test("Update step", "PUT", `/api/v1/kb/flows/${flowId}/steps/${stepId}`,
        { message: "ข้อความที่แก้ไขแล้ว", isFinal: true });
      await test("Delete step", "DELETE", `/api/v1/kb/flows/${flowId}/steps/${stepId}`);
    }
  }

  // --- ESCALATIONS ---
  console.log("\n=== Escalations ===");
  const escRes = await test("Create escalation", "POST", "/api/v1/kb/escalate", {
    question: "คำถามทดสอบ escalation",
    customerContext: "ลูกค้า VIP",
    aiAttemptedAnswer: "AI พยายามตอบแต่ไม่แน่ใจ",
    priority: "high",
    sessionId: "test-session-001",
  });
  const escId = escRes?.id;

  await test("List escalations", "GET", "/api/v1/kb/escalations");
  await test("Filter escalations", "GET", "/api/v1/kb/escalations?status=pending&priority=high");

  if (escId) {
    await test("Get escalation", "GET", `/api/v1/kb/escalations/${escId}`);
    await test("Resolve escalation", "PATCH", `/api/v1/kb/escalations/${escId}/resolve`, {
      answer: "คำตอบจากเจ้าหน้าที่",
      resolutionType: "added_to_kb",
      keywords: ["escalation", "resolved"],
    });
  }

  // --- EXPORT ---
  console.log("\n=== Export ===");
  await test("Export all", "GET", "/api/v1/kb/export");

  // --- CLEANUP ---
  console.log("\n=== Cleanup ===");
  if (knId) await test("Delete knowledge", "DELETE", `/api/v1/kb/knowledge/${knId}`);
  if (flowId) await test("Delete flow", "DELETE", `/api/v1/kb/flows/${flowId}`);
  if (catId) await test("Delete category", "DELETE", `/api/v1/kb/categories/${catId}`);

  // --- SUMMARY ---
  console.log(`\n${"=".repeat(40)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  if (failed === 0) console.log("\n🎉 All API tests passed!");
  else console.log(`\n⚠️  ${failed} test(s) failed!`);
}

main().catch(console.error);
