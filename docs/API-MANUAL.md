# Knowledge Base API Manual

**Base URL:** `https://kb.suksomsri.cloud`
**Version:** v1
**Authentication:** ทุก endpoint ต้องส่ง API Key ผ่าน Header `X-API-Key`

---

## Authentication

ทุก request ต้องมี Header:

```
X-API-Key: {your-agent-api-key}
```

API Key สามารถดูและ regenerate ได้ที่หน้า **Settings** ของ Agent ใน Admin Panel

### Error Response (401)

```json
{
  "error": "Invalid or missing API key"
}
```

---

## Endpoints

| # | Method | Endpoint | คำอธิบาย |
|---|--------|----------|----------|
| 1 | GET | `/api/v1/kb/search` | ค้นหา Knowledge + Flow |
| 2 | GET | `/api/v1/kb/flow/step/{stepId}` | ดึง Flow Step ถัดไป |
| 3 | POST | `/api/v1/kb/escalate` | สร้างคำถามที่ตอบไม่ได้ (Pending Escalation) |
| 4 | GET | `/api/v1/kb/export` | Export ข้อมูล KB ทั้งหมด |

---

## 1. KB Search

ค้นหา Knowledge Items และ Flows พร้อมกัน พร้อมให้ recommendation ว่าควรดำเนินการอย่างไร

### Request

```
GET /api/v1/kb/search?q={query}&limit={limit}
```

| Parameter | Type | Required | Default | คำอธิบาย |
|-----------|------|----------|---------|----------|
| `q` | string | YES | - | คำค้นหา (แนะนำภาษาไทย) |
| `limit` | number | NO | 3 | จำนวนผลลัพธ์ Knowledge สูงสุด (max: 10) |

### Headers

```
X-API-Key: {your-api-key}
```

### cURL Example

```bash
curl -X GET "https://kb.suksomsri.cloud/api/v1/kb/search?q=ราคาทริปเกาะพีพี&limit=3" \
  -H "X-API-Key: ka_xxxxx..."
```

### Response (200)

```json
{
  "query": "ราคาทริปเกาะพีพี",
  "knowledge": {
    "results": [
      {
        "id": "uuid",
        "type": "faq",
        "question": "ทริปเกาะพีพีราคาเท่าไหร่?",
        "answer": "ทริปเกาะพีพี ราคา 1,500 บาท/ท่าน รวมอาหารกลางวัน",
        "category": "ข้อมูลทริป",
        "keywords": ["พีพี", "ราคา", "ทริป"],
        "tags": ["ทริปยอดนิยม"],
        "confidence": 85
      }
    ]
  },
  "flow": {
    "matched": true,
    "id": "uuid",
    "name": "จองทริป",
    "firstStep": {
      "id": "step-uuid",
      "type": "question",
      "message": "สนใจทริปไหนครับ?",
      "options": [
        { "label": "เกาะพีพี", "keywords": ["พีพี"], "nextStepId": "step-2-uuid" },
        { "label": "เกาะเจมส์บอนด์", "keywords": ["เจมส์บอนด์"], "nextStepId": "step-2-uuid" }
      ],
      "isFinal": false
    },
    "confidence": 95
  },
  "threshold": {
    "answer": 75,
    "escalate": 40
  },
  "recommendation": "use_flow",
  "disclaimerMessage": "ข้อมูลอาจไม่ครบถ้วน กรุณาติดต่อเจ้าหน้าที่",
  "noAnswerMessage": "ขอส่งเรื่องให้เจ้าหน้าที่ตรวจสอบให้ครับ"
}
```

### Response Fields

| Field | Type | คำอธิบาย |
|-------|------|----------|
| `query` | string | คำค้นที่ส่งมา |
| `knowledge.results` | array | รายการ Knowledge Items ที่ตรงกัน (เรียงตาม confidence จากมากไปน้อย) |
| `knowledge.results[].id` | string | ID ของ knowledge item |
| `knowledge.results[].type` | string | ประเภท: `"faq"`, `"info"`, `"procedure"` |
| `knowledge.results[].question` | string | คำถาม/หัวข้อ |
| `knowledge.results[].answer` | string | คำตอบ/เนื้อหา |
| `knowledge.results[].category` | string \| null | ชื่อหมวดหมู่ |
| `knowledge.results[].keywords` | string[] \| null | คำสำคัญ |
| `knowledge.results[].tags` | string[] \| null | แท็ก |
| `knowledge.results[].confidence` | number | คะแนนความมั่นใจ (0–98) |
| `flow` | object | ผลลัพธ์ Flow ที่ตรงกัน |
| `flow.matched` | boolean | มี Flow ที่ตรงหรือไม่ |
| `flow.id` | string | ID ของ Flow (ถ้า matched) |
| `flow.name` | string | ชื่อ Flow (ถ้า matched) |
| `flow.firstStep` | object | Step แรกของ Flow |
| `flow.confidence` | number | คะแนนความมั่นใจ (0–95) |
| `threshold.answer` | number | ค่า Answer Threshold ที่ตั้งไว้ |
| `threshold.escalate` | number | ค่า Escalate Threshold ที่ตั้งไว้ |
| `recommendation` | string | คำแนะนำการดำเนินการ (ดูตารางด้านล่าง) |
| `disclaimerMessage` | string \| undefined | ข้อความ disclaimer (เมื่อ recommendation = `answer_with_disclaimer`) |
| `noAnswerMessage` | string \| undefined | ข้อความเมื่อตอบไม่ได้ (เมื่อ recommendation = `escalate` หรือ `no_results`) |

### Recommendation Values

| recommendation | เงื่อนไข | ความหมาย |
|----------------|---------|----------|
| `use_flow` | flowConfidence >= answerThreshold | ตรงกับ Flow → ใช้ flow steps |
| `auto_answer` | knowledgeConfidence >= answerThreshold | ตรงกับ Knowledge มั่นใจสูง → ตอบได้เลย |
| `answer_with_disclaimer` | confidence >= escalateThreshold แต่ < answerThreshold | พอตรง แต่ไม่มั่นใจเต็มที่ → ตอบ + แนบ disclaimer |
| `escalate` | confidence > 0 แต่ < escalateThreshold | ไม่ค่อยตรง → ส่งให้ admin ตรวจสอบ |
| `no_results` | confidence = 0 | ไม่เจอเลย → ส่งให้ admin |

### Error Responses

| Status | Body | เหตุผล |
|--------|------|--------|
| 400 | `{ "error": "Query parameter 'q' is required" }` | ไม่ส่ง q หรือ q ว่าง |
| 401 | `{ "error": "Invalid or missing API key" }` | API Key ไม่ถูกต้อง |

---

## 2. Flow Step

ดึงข้อมูล Flow Step ถัดไป (ใช้เมื่อ recommendation = `use_flow` และลูกค้าเลือก option)

### Request

```
GET /api/v1/kb/flow/step/{stepId}
```

| Parameter | Type | Required | คำอธิบาย |
|-----------|------|----------|----------|
| `stepId` | string (UUID) | YES | ID ของ step ถัดไป (จาก option.nextStepId) |

### Headers

```
X-API-Key: {your-api-key}
```

### cURL Example

```bash
curl -X GET "https://kb.suksomsri.cloud/api/v1/kb/flow/step/step-uuid-here" \
  -H "X-API-Key: ka_xxxxx..."
```

### Response (200)

```json
{
  "step": {
    "id": "step-uuid",
    "flowId": "flow-uuid",
    "stepOrder": 2,
    "type": "question",
    "message": "ต้องการไปวันไหนครับ? (กรุณาระบุวันที่)",
    "options": [
      { "label": "เลือกวัน", "keywords": [], "nextStepId": "step-3-uuid" }
    ],
    "nextStepId": null,
    "isFinal": false
  }
}
```

### Response Fields

| Field | Type | คำอธิบาย |
|-------|------|----------|
| `step.id` | string | ID ของ step นี้ |
| `step.flowId` | string | ID ของ Flow ที่สังกัด |
| `step.stepOrder` | number | ลำดับ step |
| `step.type` | string | ประเภท step: `"question"`, `"message"`, `"action"` |
| `step.message` | string | ข้อความที่แสดงให้ลูกค้า |
| `step.options` | array | ตัวเลือก (label, keywords, nextStepId) |
| `step.nextStepId` | string \| null | step ถัดไป (ถ้าไม่มี options) |
| `step.isFinal` | boolean | true = step สุดท้าย (จบ flow) |

### Flow Usage Pattern

```
1. Search API → recommendation = "use_flow"
   ├── ใช้ flow.firstStep
   │
2. ส่ง firstStep.message + options ให้ลูกค้า
   │
3. ลูกค้าเลือก option → GET /api/v1/kb/flow/step/{option.nextStepId}
   │
4. ส่ง step.message + options ให้ลูกค้า
   │
5. ทำซ้ำ step 3–4 จนกว่า isFinal = true
```

### Error Responses

| Status | Body | เหตุผล |
|--------|------|--------|
| 401 | `{ "error": "Invalid or missing API key" }` | API Key ไม่ถูกต้อง |
| 404 | `{ "error": "Step not found" }` | stepId ไม่ถูกต้อง หรือไม่ใช่ของ agent นี้ |

---

## 3. Escalate

สร้าง Pending Escalation เมื่อ KB ไม่มีคำตอบ (recommendation = `escalate` หรือ `no_results`)

### Request

```
POST /api/v1/kb/escalate
Content-Type: application/json
```

### Headers

```
X-API-Key: {your-api-key}
Content-Type: application/json
```

### Body

```json
{
  "question": "คำถามที่ลูกค้าถาม",
  "customerContext": "บริบทจากบทสนทนา เช่น ลูกค้าคุยเรื่องทริปเกาะพีพี",
  "aiAttemptedAnswer": "คำตอบที่ AI ลองตอบ (ถ้ามี)",
  "priority": "normal",
  "sessionId": "session-id-for-tracking"
}
```

| Field | Type | Required | Default | คำอธิบาย |
|-------|------|----------|---------|----------|
| `question` | string | YES | - | คำถามที่ตอบไม่ได้ (min 1 char) |
| `customerContext` | string | NO | null | บริบทจากการสนทนา |
| `aiAttemptedAnswer` | string | NO | null | คำตอบที่ AI พยายามตอบ |
| `priority` | string | NO | `"normal"` | ความสำคัญ: `"low"`, `"normal"`, `"high"` |
| `sessionId` | string | NO | null | ID ของ session (ใช้ติดตาม) |

### cURL Example

```bash
curl -X POST "https://kb.suksomsri.cloud/api/v1/kb/escalate" \
  -H "X-API-Key: ka_xxxxx..." \
  -H "Content-Type: application/json" \
  -d '{
    "question": "มีทริปดำน้ำลึกไหม?",
    "customerContext": "ลูกค้าสนใจทริปทางทะเล",
    "priority": "normal"
  }'
```

### Response (200)

```json
{
  "id": "escalation-uuid",
  "status": "pending",
  "message": "Escalation created successfully"
}
```

### Error Responses

| Status | Body | เหตุผล |
|--------|------|--------|
| 400 | `{ "error": "Invalid JSON body" }` | Body ไม่ใช่ JSON |
| 400 | `{ "error": "Invalid request", "details": {...} }` | ข้อมูลไม่ถูก format |
| 401 | `{ "error": "Invalid or missing API key" }` | API Key ไม่ถูกต้อง |

---

## 4. Export

Export ข้อมูล Knowledge Items และ Flows ทั้งหมดของ Agent (รองรับ incremental sync)

### Request

```
GET /api/v1/kb/export?updated_after={ISO-datetime}
```

| Parameter | Type | Required | คำอธิบาย |
|-----------|------|----------|----------|
| `updated_after` | ISO 8601 datetime | NO | ดึงเฉพาะข้อมูลที่อัปเดตหลังเวลานี้ (incremental sync) |

### Headers

```
X-API-Key: {your-api-key}
```

### cURL Example — Full export

```bash
curl -X GET "https://kb.suksomsri.cloud/api/v1/kb/export" \
  -H "X-API-Key: ka_xxxxx..."
```

### cURL Example — Incremental sync

```bash
curl -X GET "https://kb.suksomsri.cloud/api/v1/kb/export?updated_after=2026-03-08T00:00:00Z" \
  -H "X-API-Key: ka_xxxxx..."
```

### Response (200)

```json
{
  "agent": "Shark",
  "knowledgeItems": [
    {
      "id": "uuid",
      "type": "faq",
      "question": "เช็คอินกี่โมง?",
      "answer": "เช็คอิน 14:00 ครับ",
      "keywords": ["เช็คอิน", "เวลา"],
      "tags": ["ข้อมูลทั่วไป"],
      "categoryName": "ข้อมูลโรงแรม",
      "updatedAt": "2026-03-08T10:30:00.000Z"
    }
  ],
  "flows": [
    {
      "id": "uuid",
      "name": "จองทริป",
      "triggerKeywords": ["จอง", "จองทริป", "book trip"],
      "steps": [
        {
          "id": "step-uuid",
          "order": 1,
          "type": "question",
          "message": "สนใจทริปไหนครับ?",
          "options": [...],
          "nextStepId": null,
          "isFinal": false
        }
      ]
    }
  ],
  "totalKnowledgeItems": 15,
  "totalFlows": 2,
  "exportedAt": "2026-03-08T12:00:00.000Z"
}
```

### Error Responses

| Status | Body | เหตุผล |
|--------|------|--------|
| 401 | `{ "error": "Invalid or missing API key" }` | API Key ไม่ถูกต้อง |
