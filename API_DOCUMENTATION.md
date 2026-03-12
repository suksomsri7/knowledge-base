# Knowledge Base API Documentation

## Overview

REST API สำหรับจัดการ Knowledge Base ผ่าน Agent  
Base URL: `http://<host>:3000/api/v1/kb`

## Authentication

ทุก API ต้องส่ง header `x-api-key` ที่ได้จากหน้า Agent Settings

```
x-api-key: your-agent-api-key
```

ถ้าไม่ส่งหรือ key ไม่ถูกต้อง จะได้ `401`:
```json
{ "error": "Invalid or missing API key" }
```

## Response Format

- **Success**: `200` หรือ `201` พร้อม JSON data
- **Error**: `4xx` หรือ `5xx` พร้อม `{ "error": "message", "details": ... }`

---

## 1. Search (ค้นหา)

### `GET /api/v1/kb/search`

ค้นหา Knowledge Items และ Flows ด้วย keyword matching

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | คำค้นหา |
| `limit` | number | No | 3 | จำนวนผลลัพธ์ (max 10) |

**Response:**
```json
{
  "query": "วิธีสมัครสมาชิก",
  "knowledge": {
    "results": [
      {
        "id": "uuid",
        "type": "faq",
        "question": "วิธีสมัครสมาชิก",
        "answer": "เข้าไปที่หน้าเว็บ...",
        "category": "การสมัคร",
        "keywords": ["สมัคร", "register"],
        "tags": ["onboarding"],
        "confidence": 98
      }
    ]
  },
  "flow": {
    "matched": true,
    "id": "uuid",
    "name": "สมัครสมาชิก Flow",
    "firstStep": {
      "id": "uuid",
      "type": "message",
      "message": "สวัสดีครับ...",
      "options": [],
      "isFinal": false
    },
    "confidence": 95
  },
  "threshold": { "answer": 75, "escalate": 40 },
  "recommendation": "auto_answer",
  "disclaimerMessage": null,
  "noAnswerMessage": null
}
```

**recommendation values:**
| Value | Meaning |
|-------|---------|
| `auto_answer` | ตอบได้เลย (confidence >= answer threshold) |
| `use_flow` | ใช้ flow ที่ match |
| `answer_with_disclaimer` | ตอบได้แต่ควรแจ้งเตือนว่าอาจไม่ครบถ้วน |
| `escalate` | ส่งต่อเจ้าหน้าที่ |
| `no_results` | ไม่พบข้อมูล |

---

## 2. Knowledge Items (ฐานความรู้)

### `GET /api/v1/kb/knowledge`

แสดงรายการ Knowledge Items ทั้งหมด

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | หน้า |
| `limit` | number | No | 50 | จำนวนต่อหน้า (max 100) |
| `category_id` | uuid | No | - | กรอง category |
| `type` | string | No | - | กรอง type (`faq`, `info`, `procedure`) |
| `active_only` | boolean | No | true | แสดงเฉพาะ active |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "faq",
      "question": "วิธีสมัครสมาชิก",
      "answer": "เข้าไปที่หน้าเว็บ...",
      "keywords": ["สมัคร"],
      "tags": ["onboarding"],
      "isActive": true,
      "categoryId": "uuid",
      "categoryName": "การสมัคร",
      "source": "manual",
      "createdAt": "2026-03-10T...",
      "updatedAt": "2026-03-10T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "totalPages": 3
  }
}
```

---

### `POST /api/v1/kb/knowledge`

สร้าง Knowledge Item ใหม่

**Request Body:**
```json
{
  "question": "วิธีสมัครสมาชิกทำยังไง",
  "answer": "เข้าไปที่เว็บไซต์ กดปุ่มสมัคร กรอกข้อมูล แล้วยืนยัน email",
  "type": "faq",
  "categoryId": "uuid-of-category",
  "keywords": ["สมัคร", "register", "สมาชิก"],
  "tags": ["onboarding"],
  "isActive": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `question` | string | **Yes** | - | คำถาม (max 500 chars) |
| `answer` | string | **Yes** | - | คำตอบ |
| `type` | string | No | `"faq"` | ประเภท: `faq`, `info`, `procedure` |
| `categoryId` | uuid | No | null | หมวดหมู่ |
| `keywords` | string[] | No | `[]` | คำสำคัญสำหรับค้นหา |
| `tags` | string[] | No | `[]` | tags |
| `isActive` | boolean | No | `true` | เปิด/ปิดใช้งาน |

**Response (201):**
```json
{
  "item": {
    "id": "generated-uuid",
    "type": "faq",
    "question": "วิธีสมัครสมาชิกทำยังไง",
    "answer": "เข้าไปที่เว็บไซต์...",
    "keywords": ["สมัคร", "register", "สมาชิก"],
    "tags": ["onboarding"],
    "isActive": true,
    "categoryId": "uuid",
    "source": "api",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### `GET /api/v1/kb/knowledge/:id`

ดึง Knowledge Item ตาม ID

**Response:**
```json
{
  "item": { ... }
}
```

---

### `PUT /api/v1/kb/knowledge/:id`

แก้ไข Knowledge Item (ส่งเฉพาะ field ที่ต้องการแก้)

**Request Body:**
```json
{
  "question": "คำถามใหม่",
  "answer": "คำตอบใหม่",
  "keywords": ["keyword1", "keyword2"]
}
```

**Response:**
```json
{
  "item": { ... }
}
```

---

### `DELETE /api/v1/kb/knowledge/:id`

ลบ Knowledge Item

**Response:**
```json
{ "message": "Knowledge item deleted" }
```

---

### `PATCH /api/v1/kb/knowledge/:id/toggle`

เปิด/ปิดใช้งาน Knowledge Item

**Request Body:**
```json
{ "isActive": false }
```

**Response:**
```json
{
  "item": { ... }
}
```

---

## 3. Categories (หมวดหมู่)

### `GET /api/v1/kb/categories`

แสดงหมวดหมู่ทั้งหมดพร้อมจำนวน items

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "การสมัคร",
      "slug": "การสมัคร",
      "description": "คำถามเกี่ยวกับการสมัคร",
      "sortOrder": 0,
      "itemCount": 15,
      "createdAt": "..."
    }
  ]
}
```

---

### `POST /api/v1/kb/categories`

สร้างหมวดหมู่ใหม่

**Request Body:**
```json
{
  "name": "การชำระเงิน",
  "description": "คำถามเกี่ยวกับการชำระเงินและการเงิน",
  "sortOrder": 1
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | **Yes** | - | ชื่อหมวดหมู่ (max 100) |
| `description` | string | No | null | คำอธิบาย |
| `sortOrder` | number | No | 0 | ลำดับการแสดงผล |

**Response (201):**
```json
{
  "category": {
    "id": "uuid",
    "name": "การชำระเงิน",
    "slug": "การชำระเงิน",
    ...
  }
}
```

---

### `GET /api/v1/kb/categories/:id`

ดึงข้อมูลหมวดหมู่ตาม ID

---

### `PUT /api/v1/kb/categories/:id`

แก้ไขหมวดหมู่

**Request Body:**
```json
{
  "name": "ชื่อใหม่",
  "description": "คำอธิบายใหม่"
}
```

---

### `DELETE /api/v1/kb/categories/:id`

ลบหมวดหมู่ (knowledge items ที่อยู่ในหมวดนี้จะถูก set category เป็น null)

**Response:**
```json
{ "message": "Category deleted" }
```

---

## 4. Flows (สถานการณ์สนทนา)

### `GET /api/v1/kb/flows`

แสดง Flows ทั้งหมด

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `active_only` | boolean | No | true | แสดงเฉพาะ active |

**Response:**
```json
{
  "flows": [
    {
      "id": "uuid",
      "name": "สมัครสมาชิก",
      "description": "Flow สำหรับแนะนำการสมัคร",
      "triggerKeywords": ["สมัคร", "register"],
      "priority": 10,
      "isActive": true,
      "stepsCount": 5,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### `POST /api/v1/kb/flows`

สร้าง Flow ใหม่

**Request Body:**
```json
{
  "name": "สมัครสมาชิก",
  "description": "Flow สำหรับแนะนำการสมัคร",
  "triggerKeywords": ["สมัคร", "register", "สมัครสมาชิก"],
  "priority": 10,
  "isActive": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | **Yes** | - | ชื่อ flow |
| `description` | string | No | null | คำอธิบาย |
| `triggerKeywords` | string[] | No | `[]` | คำที่จะ trigger flow นี้ |
| `priority` | number | No | 0 | ลำดับความสำคัญ (สูง = สำคัญกว่า) |
| `isActive` | boolean | No | true | เปิด/ปิดใช้งาน |

**Response (201):**
```json
{
  "flow": { ... }
}
```

---

### `GET /api/v1/kb/flows/:id`

ดึง Flow พร้อม Steps ทั้งหมด

**Response:**
```json
{
  "flow": {
    "id": "uuid",
    "name": "สมัครสมาชิก",
    "triggerKeywords": ["สมัคร"],
    "steps": [
      {
        "id": "step-uuid-1",
        "stepOrder": 1,
        "type": "message",
        "message": "สวัสดีครับ ต้องการสมัครสมาชิกใช่ไหมครับ?",
        "options": [
          { "label": "ใช่ครับ", "keywords": ["ใช่"], "nextStepId": "step-uuid-2" },
          { "label": "ไม่ใช่", "keywords": ["ไม่"], "nextStepId": null }
        ],
        "nextStepId": null,
        "isFinal": false
      },
      {
        "id": "step-uuid-2",
        "stepOrder": 2,
        "type": "message",
        "message": "กรุณาเข้าไปที่ example.com/register",
        "options": [],
        "nextStepId": null,
        "isFinal": true
      }
    ]
  }
}
```

---

### `PUT /api/v1/kb/flows/:id`

แก้ไข Flow (ส่งเฉพาะ field ที่ต้องการแก้)

---

### `DELETE /api/v1/kb/flows/:id`

ลบ Flow พร้อม Steps ทั้งหมด

---

### `POST /api/v1/kb/flows/:id/steps`

เพิ่ม Step ใหม่ใน Flow (เพิ่มต่อท้ายอัตโนมัติ)

**Request Body:**
```json
{
  "type": "options",
  "message": "คุณต้องการทำอะไรครับ?",
  "options": [
    { "label": "สมัครสมาชิก", "keywords": ["สมัคร"], "nextStepId": null },
    { "label": "ตรวจสอบสถานะ", "keywords": ["สถานะ"], "nextStepId": null }
  ],
  "isFinal": false
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | **Yes** | - | `message`, `options`, `input`, `end` |
| `message` | string | **Yes** | - | ข้อความของ step |
| `options` | array | No | `[]` | ตัวเลือก (ใช้กับ type `options`) |
| `options[].label` | string | Yes | - | ข้อความตัวเลือก |
| `options[].keywords` | string[] | No | `[]` | คำที่จะ match ตัวเลือกนี้ |
| `options[].nextStepId` | uuid/null | No | null | step ถัดไป |
| `nextStepId` | uuid | No | null | step ถัดไป (สำหรับ type `message`) |
| `isFinal` | boolean | No | false | เป็น step สุดท้ายหรือไม่ |

**Response (201):**
```json
{
  "step": { ... }
}
```

---

### `PUT /api/v1/kb/flows/:id/steps/:stepId`

แก้ไข Step

---

### `DELETE /api/v1/kb/flows/:id/steps/:stepId`

ลบ Step

---

### `GET /api/v1/kb/flow/step/:stepId`

ดึง Step เดียวตาม ID (ใช้ตอน navigate flow)

**Response:**
```json
{
  "step": {
    "id": "uuid",
    "flowId": "uuid",
    "stepOrder": 1,
    "type": "options",
    "message": "...",
    "options": [...],
    "nextStepId": null,
    "isFinal": false
  }
}
```

---

## 5. Escalations (เรื่องที่ส่งต่อ)

### `POST /api/v1/kb/escalate`

สร้าง Escalation ใหม่ (เมื่อ Agent ตอบไม่ได้)

**Request Body:**
```json
{
  "question": "ลูกค้าถามว่า...",
  "customerContext": "ลูกค้าเป็นสมาชิก VIP",
  "aiAttemptedAnswer": "Agent พยายามตอบว่า...",
  "priority": "high",
  "sessionId": "session-123"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `question` | string | **Yes** | - | คำถามที่ตอบไม่ได้ |
| `customerContext` | string | No | - | context ของลูกค้า |
| `aiAttemptedAnswer` | string | No | - | คำตอบที่ Agent พยายามตอบ |
| `priority` | string | No | `"normal"` | `low`, `normal`, `high` |
| `sessionId` | string | No | - | session ID สำหรับ tracking |

**Response (200):**
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Escalation created successfully"
}
```

---

### `GET /api/v1/kb/escalations`

แสดงรายการ Escalations

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | - | กรอง: `pending`, `in_progress`, `resolved`, `dismissed` |
| `priority` | string | No | - | กรอง: `low`, `normal`, `high` |
| `page` | number | No | 1 | หน้า |
| `limit` | number | No | 50 | จำนวนต่อหน้า (max 100) |

**Response:**
```json
{
  "escalations": [
    {
      "id": "uuid",
      "question": "...",
      "customerContext": "...",
      "aiAttemptedAnswer": "...",
      "status": "pending",
      "priority": "high",
      "categoryId": null,
      "categoryName": null,
      "assignedTo": null,
      "assigneeName": null,
      "resolutionType": null,
      "answer": null,
      "adminNotes": null,
      "resolvedAt": null,
      "sessionId": "session-123",
      "createdAt": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 5, "totalPages": 1 }
}
```

---

### `GET /api/v1/kb/escalations/:id`

ดึง Escalation ตาม ID

---

### `PATCH /api/v1/kb/escalations/:id/resolve`

แก้ไข Escalation เป็น resolved (ถ้า `resolutionType` เป็น `"added_to_kb"` จะสร้าง Knowledge Item อัตโนมัติ)

**Request Body:**
```json
{
  "answer": "คำตอบที่ถูกต้อง",
  "resolutionType": "added_to_kb",
  "adminNotes": "เพิ่มเข้า KB แล้ว",
  "categoryId": "uuid-optional",
  "keywords": ["keyword1", "keyword2"]
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `answer` | string | **Yes** | - | คำตอบ |
| `resolutionType` | string | **Yes** | - | `answered`, `added_to_kb`, `redirected`, `not_relevant` |
| `adminNotes` | string | No | null | หมายเหตุ |
| `categoryId` | uuid | No | null | หมวดหมู่ (ใช้เมื่อ added_to_kb) |
| `keywords` | string[] | No | `[]` | keywords (ใช้เมื่อ added_to_kb) |

**Response:**
```json
{
  "message": "Escalation resolved",
  "knowledgeItemId": "uuid-if-added-to-kb"
}
```

---

### `PATCH /api/v1/kb/escalations/:id/dismiss`

ปิด Escalation โดยไม่ต้องตอบ

**Response:**
```json
{ "message": "Escalation dismissed" }
```

---

## 6. Export (ส่งออกข้อมูล)

### `GET /api/v1/kb/export`

Export ข้อมูล Knowledge Items และ Flows ทั้งหมด

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `updated_after` | ISO date | No | - | เฉพาะที่อัปเดตหลังจากวันที่กำหนด |

**Response:**
```json
{
  "agent": "Agent Name",
  "knowledgeItems": [...],
  "flows": [...],
  "totalKnowledgeItems": 50,
  "totalFlows": 3,
  "exportedAt": "2026-03-11T..."
}
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (API key ไม่ถูกต้อง) |
| `404` | Not Found |
| `409` | Conflict (เช่น ชื่อซ้ำ) |
| `500` | Server Error |

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| ค้นหา | `GET` | `/api/v1/kb/search?q=...` |
| รายการ Knowledge | `GET` | `/api/v1/kb/knowledge` |
| สร้าง Knowledge | `POST` | `/api/v1/kb/knowledge` |
| ดู Knowledge | `GET` | `/api/v1/kb/knowledge/:id` |
| แก้ไข Knowledge | `PUT` | `/api/v1/kb/knowledge/:id` |
| ลบ Knowledge | `DELETE` | `/api/v1/kb/knowledge/:id` |
| เปิด/ปิด Knowledge | `PATCH` | `/api/v1/kb/knowledge/:id/toggle` |
| รายการ Categories | `GET` | `/api/v1/kb/categories` |
| สร้าง Category | `POST` | `/api/v1/kb/categories` |
| ดู Category | `GET` | `/api/v1/kb/categories/:id` |
| แก้ไข Category | `PUT` | `/api/v1/kb/categories/:id` |
| ลบ Category | `DELETE` | `/api/v1/kb/categories/:id` |
| รายการ Flows | `GET` | `/api/v1/kb/flows` |
| สร้าง Flow | `POST` | `/api/v1/kb/flows` |
| ดู Flow + Steps | `GET` | `/api/v1/kb/flows/:id` |
| แก้ไข Flow | `PUT` | `/api/v1/kb/flows/:id` |
| ลบ Flow | `DELETE` | `/api/v1/kb/flows/:id` |
| เพิ่ม Step | `POST` | `/api/v1/kb/flows/:id/steps` |
| แก้ไข Step | `PUT` | `/api/v1/kb/flows/:id/steps/:stepId` |
| ลบ Step | `DELETE` | `/api/v1/kb/flows/:id/steps/:stepId` |
| ดึง Step เดียว | `GET` | `/api/v1/kb/flow/step/:stepId` |
| สร้าง Escalation | `POST` | `/api/v1/kb/escalate` |
| รายการ Escalations | `GET` | `/api/v1/kb/escalations` |
| ดู Escalation | `GET` | `/api/v1/kb/escalations/:id` |
| Resolve Escalation | `PATCH` | `/api/v1/kb/escalations/:id/resolve` |
| Dismiss Escalation | `PATCH` | `/api/v1/kb/escalations/:id/dismiss` |
| Export ทั้งหมด | `GET` | `/api/v1/kb/export` |
