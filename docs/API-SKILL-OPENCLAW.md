# KB API Skill — สำหรับ OpenClaw Agent

Skill สำหรับ AI Agent ใน OpenClaw.ai ในการเรียกใช้ Knowledge Base API เพื่อค้นหาคำตอบ, ดำเนินตาม Flow, และ escalate คำถามที่ตอบไม่ได้

---

## Environment Variables

| Name | คำอธิบาย |
|------|----------|
| `KB_URL` | `https://kb.suksomsri.cloud` |
| `KB_API_KEY` | API Key ของ Agent (ดูจาก Agent Settings ใน KB Admin) |

---

## API 1: KB Search — ค้นหาคำตอบ

เรียก API นี้ **ทุกครั้ง** ที่ลูกค้าถามคำถาม

```
GET {KB_URL}/api/v1/kb/search?q={query}&limit=3
Header: X-API-Key: {KB_API_KEY}
```

### สิ่งที่ต้องทำก่อนเรียก

- แปลคำถามเป็น **ภาษาไทย**
- **รวมบริบท** จากบทสนทนาก่อนหน้าเข้ากับคำถาม
  - ถ้าลูกค้าถาม "ราคาเท่าไหร่?" และก่อนหน้าคุยเรื่อง "ทริปเกาะพีพี"
  - query = "ราคาทริปเกาะพีพี" (ไม่ใช่ "ราคาเท่าไหร่?")

### Response ที่ได้

```json
{
  "query": "...",
  "knowledge": { "results": [...] },
  "flow": { "matched": true/false, ... },
  "recommendation": "auto_answer | answer_with_disclaimer | use_flow | escalate | no_results",
  "disclaimerMessage": "...",
  "noAnswerMessage": "..."
}
```

### recommendation — วิธีปฏิบัติ

#### use_flow
Flow ตรงกัน (confidence สูง)
1. ใช้ `flow.firstStep.message` + `flow.firstStep.options` เริ่มสนทนา
2. ส่งให้ Boss ยืนยันทาง Telegram พร้อม confidence
3. เมื่อลูกค้าเลือก option → เรียก API 2 (Flow Step) ด้วย `option.nextStepId`
4. ทำซ้ำจนถึง step ที่ `isFinal = true`

#### auto_answer
Knowledge ตรงกัน (confidence >= answerThreshold)
1. ใช้ `knowledge.results[0].answer` เป็นคำตอบ
2. ส่งคำตอบ + confidence ให้ Boss ยืนยันทาง Telegram
3. รอ Boss approve แล้วแปลตามภาษาลูกค้า → ส่ง Boss ยืนยันคำแปล → ส่งลูกค้า

#### answer_with_disclaimer
Knowledge พอตรง (confidence >= escalateThreshold แต่ < answerThreshold)
1. ใช้ `knowledge.results[0].answer` + `disclaimerMessage`
2. ส่งคำตอบ + disclaimer + confidence ให้ Boss ยืนยันทาง Telegram
3. รอ Boss approve แล้วแปลตามภาษาลูกค้า → ส่ง Boss ยืนยันคำแปล → ส่งลูกค้า

#### escalate
Knowledge ไม่ค่อยตรง (confidence > 0 แต่ < escalateThreshold)
1. ส่งคำถาม + confidence ให้ Boss ทาง Telegram
2. เรียก **API 3 (Escalate)** เพื่อบันทึกคำถาม
3. แจ้งลูกค้าด้วย `noAnswerMessage`
4. รอ Boss ตอบกลับทาง Telegram

#### no_results
ไม่เจอคำตอบเลย (confidence = 0)
1. ส่งคำถามให้ Boss ทาง Telegram
2. เรียก **API 3 (Escalate)** เพื่อบันทึกคำถาม
3. แจ้งลูกค้าด้วย `noAnswerMessage`
4. รอ Boss ตอบกลับทาง Telegram

---

## API 2: Flow Step — ดึง Step ถัดไป

เรียก API นี้เมื่อลูกค้าเลือก option ใน Flow

```
GET {KB_URL}/api/v1/kb/flow/step/{stepId}
Header: X-API-Key: {KB_API_KEY}
```

- `stepId` คือ `nextStepId` จาก option ที่ลูกค้าเลือก

### Response

```json
{
  "step": {
    "id": "...",
    "type": "question",
    "message": "ต้องการไปวันไหนครับ?",
    "options": [...],
    "nextStepId": null,
    "isFinal": false
  }
}
```

### ขั้นตอน

1. ส่ง `step.message` + `step.options` ให้ Boss ยืนยัน
2. เมื่อ Boss approve → แปลตามภาษาลูกค้า → ส่งลูกค้า
3. ลูกค้าเลือก option → เรียก API 2 ซ้ำด้วย `option.nextStepId`
4. ถ้า `step.isFinal = true` → จบ Flow

---

## API 3: Escalate — บันทึกคำถามที่ตอบไม่ได้

เรียก API นี้เมื่อ recommendation = `escalate` หรือ `no_results`

```
POST {KB_URL}/api/v1/kb/escalate
Header: X-API-Key: {KB_API_KEY}
Content-Type: application/json

Body:
{
  "question": "คำถามเป็นภาษาไทย",
  "customerContext": "บริบทจากบทสนทนา",
  "aiAttemptedAnswer": "คำตอบที่ AI ลองตอบ (ถ้ามี)",
  "priority": "normal",
  "sessionId": "session-id (ถ้ามี)"
}
```

### Body Fields

| Field | Required | คำอธิบาย |
|-------|----------|----------|
| `question` | YES | คำถามของลูกค้า (ภาษาไทย) |
| `customerContext` | NO | บริบท เช่น "ลูกค้าสนใจทริปทะเล" |
| `aiAttemptedAnswer` | NO | คำตอบที่ AI ลองให้ |
| `priority` | NO | `"low"` / `"normal"` / `"high"` (default: normal) |
| `sessionId` | NO | ใช้ติดตาม session |

### Response

```json
{
  "id": "escalation-uuid",
  "status": "pending",
  "message": "Escalation created successfully"
}
```

คำถามจะไปปรากฏที่หน้า **Escalations** ใน KB Admin ให้ Boss ตรวจสอบ

---

## สรุป Flow การทำงานของ Agent

```
ลูกค้าส่งข้อความ (WhatsApp)
│
├─ แปลเป็นไทย + รวมบริบท
│
├─ เรียก API 1: GET /api/v1/kb/search?q={คำถามรวมบริบท}
│
├─ ดู recommendation:
│   │
│   ├─ use_flow ──────────── ใช้ flow.firstStep → ส่ง Boss ยืนยัน
│   │                         ลูกค้าเลือก option → API 2 (Flow Step)
│   │                         ทำซ้ำจน isFinal = true
│   │
│   ├─ auto_answer ────────── ส่งคำตอบ + confidence → Boss ยืนยัน
│   │
│   ├─ answer_with_disclaimer ส่งคำตอบ + disclaimer + confidence → Boss ยืนยัน
│   │
│   ├─ escalate ───────────── ส่งคำถามให้ Boss + เรียก API 3 (Escalate)
│   │
│   └─ no_results ─────────── ส่งคำถามให้ Boss + เรียก API 3 (Escalate)
│
├─ Boss ยืนยัน/แก้ไขทาง Telegram
│
├─ แปลคำตอบตามภาษาลูกค้า → ส่ง Boss ยืนยันคำแปล
│
└─ Boss approve → ส่งคำตอบกลับลูกค้า (WhatsApp)
```

---

## กฎสำคัญ

1. **ห้ามตอบลูกค้าเองโดยไม่ผ่านการยืนยันจาก Boss**
2. **แปลคำถามเป็นไทย** เสมอก่อนค้น KB
3. **ส่ง confidence score** ให้ Boss ทุกครั้ง
4. **แปลคำตอบ** ตามภาษาที่ลูกค้าใช้ก่อนส่ง → Boss ยืนยันคำแปลก่อน
5. เมื่อ recommendation = `escalate` หรือ `no_results` → **ต้องเรียก API 3 ทุกครั้ง**
6. **รวมบริบท** จากบทสนทนาก่อนหน้าเสมอ ก่อนส่ง query ไป search
