# คู่มือการติดตั้ง Knowledge Base

เอกสารนี้อธิบายการ Deploy โปรเจกต์ Knowledge Base

---

## A. Deploy บน Vercel + Neon + Bunny

### 1. สร้าง Neon Database

- ไปที่ [neon.tech](https://neon.tech) สมัครและสร้างโปรเจกต์
- Copy connection string (รูปแบบ `postgresql://user:pass@host.region.neon.tech/neondb?sslmode=require`)

### 2. สร้าง Bunny Storage Zone

- ไปที่ [bunny.net](https://bunny.net) สมัครและสร้าง Storage Zone
- เปิด Pull Zone และ Enable CDN
- เก็บค่า: Storage Zone name, Storage API Key, Storage Endpoint, CDN URL

### 3. Deploy บน Vercel

```bash
# Clone และ push ไปยัง GitHub
git clone <repo-url>
cd knowledge-base
git push origin main

# Import project ใน Vercel Dashboard
# ตั้งค่า Environment Variables:
```

| Variable | ค่า | หมายเหตุ |
|----------|-----|----------|
| `DATABASE_URL` | Connection string จาก Neon | |
| `AUTH_SECRET` | `openssl rand -base64 32` | สร้างใหม่ |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | จะได้หลัง deploy |
| `BUNNY_STORAGE_ZONE` | ชื่อ Zone | จาก Bunny |
| `BUNNY_API_KEY` | API Key | จาก Bunny Storage |
| `BUNNY_STORAGE_ENDPOINT` | `https://storage.bunnycdn.com` | |
| `BUNNY_CDN_URL` | `https://your-zone.b-cdn.net` | CDN URL จาก Bunny |

### 4. Setup Database หลัง Deploy

```bash
# Push schema (ใช้ DATABASE_URL จาก Neon)
DATABASE_URL=postgresql://...@xxx.neon.tech/neondb?sslmode=require npx drizzle-kit push

# สร้าง Admin
DATABASE_URL=postgresql://...@xxx.neon.tech/neondb?sslmode=require npx tsx scripts/seed.ts
```

---

## B. Deploy บน VPS (Docker) — Self-hosted

---

### สิ่งที่ต้องเตรียม

- **VPS** ที่ติดตั้ง Docker และ Docker Compose (เช่น Hostinger VPS)
- **Node.js 20+** บน host (สำหรับคำสั่ง db:push และ seed ครั้งแรก) — ถ้าไม่มี ติดตั้งด้วย `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`
- **โดเมน** (ถ้าต้องการใช้ HTTPS) - ไม่บังคับ
- **SSH access** เข้า VPS

---

## 1. ติดตั้ง Docker บน VPS

### Ubuntu / Debian

```bash
# อัปเดตระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Docker
curl -fsSL https://get.docker.com | sh

# เพิ่ม user เข้า docker group (ไม่ต้อง sudo)
sudo usermod -aG docker $USER

# ติดตั้ง Docker Compose (v2)
sudo apt install docker-compose-plugin -y

# ออกจาก session แล้วเข้าใหม่ หรือ
newgrp docker
```

### ตรวจสอบการติดตั้ง

```bash
docker --version
docker compose version
```

---

## 2. Clone โปรเจกต์และเตรียมไฟล์

```bash
# Clone โปรเจกต์ (เปลี่ยนเป็น repo ของคุณ)
git clone https://github.com/YOUR_USERNAME/knowledge-base.git
cd knowledge-base

# คัดลอกไฟล์ env ตัวอย่าง
cp .env.example .env

# แก้ไข .env ด้วย nano หรือ vim
nano .env
```

---

## 3. การตั้งค่า Environment (.env)

แก้ไขไฟล์ `.env` ให้เหมาะสม:

**กรณีใช้ Neon (แนะนำ — เหมือน Vercel):**
```env
DATABASE_URL=postgresql://user:pass@host.region.neon.tech/neondb?sslmode=require
AUTH_SECRET=YOUR_RANDOM_32_CHAR_SECRET
NEXTAUTH_URL=https://your-domain.com
APP_PORT=3000
BUNNY_STORAGE_ZONE=your-zone
BUNNY_API_KEY=your-api-key
BUNNY_STORAGE_ENDPOINT=https://storage.bunnycdn.com
BUNNY_CDN_URL=https://your-zone.b-cdn.net
```

> **หมายเหตุ:** โค้ดใช้ Neon driver — Docker ต้องใช้ Neon เป็น database (ตั้ง `DATABASE_URL` เป็น Neon connection string)

### สร้าง AUTH_SECRET

```bash
openssl rand -base64 32
```

คัดลอกผลลัพธ์ไปวางใน `AUTH_SECRET`

### ตัวอย่าง NEXTAUTH_URL

| สถานการณ์ | ค่า NEXTAUTH_URL |
|-----------|------------------|
| ทดสอบ local | `http://localhost:3000` |
| บน VPS | `http://YOUR_VPS_IP:3000` |
| ใช้โดเมน | `https://kb.yourdomain.com` |

---

## 4. Build และรัน

```bash
# Build และรัน
docker compose up -d --build

# ตรวจสอบสถานะ
docker compose ps

# ดู logs
docker compose logs -f app
```

เมื่อ build สำเร็จ คุณจะเห็น container 2 ตัว:
- `knowledge-base-db-1` (PostgreSQL)
- `knowledge-base-app-1` (Next.js)

---

## 5. สร้าง Database Schema และ Admin User

รอให้ DB พร้อมประมาณ 10–20 วินาที แล้วรันคำสั่งจาก**โฟลเดอร์โปรเจกต์บน VPS** (ใช้ `localhost` แทน `db` เพราะรันจาก host):

```bash
# Push schema ไปยัง database (ใช้ localhost เพราะรันจาก host)
DATABASE_URL=postgresql://kb_user:YOUR_PASSWORD@localhost:5432/knowledge_base npx drizzle-kit push

# สร้าง Super Admin ( username: superadmin, password: @Superadmin252322 )
DATABASE_URL=postgresql://kb_user:YOUR_PASSWORD@localhost:5432/knowledge_base npx tsx scripts/seed.ts
```

แทนที่ `YOUR_PASSWORD` ด้วยค่า `POSTGRES_PASSWORD` จากไฟล์ `.env`

**สำคัญ:** หลังจากสร้าง Admin แล้ว ให้เข้าไปเปลี่ยนรหัสผ่านในระบบทันที

---

## 6. เข้าใช้งาน

- เปิดเบราว์เซอร์ไปที่ `http://YOUR_VPS_IP:3000` (หรือ `https://your-domain.com`)
- Login ด้วย `superadmin` / `@Superadmin252322`
- เปลี่ยนรหัสผ่านใน Profile
- สร้าง Brand, Agent แล้ว copy API Key สำหรับ OpenClaw

---

## 7. คำสั่งที่มีประโยชน์

```bash
# หยุด
docker compose down

# หยุด และลบ volumes (ข้อมูล DB หาย!)
docker compose down -v

# Restart
docker compose restart

# ดู logs แบบ real-time
docker compose logs -f app

# เข้า shell ของ app container
docker compose exec app sh

# Backup PostgreSQL
docker compose exec db pg_dump -U kb_user knowledge_base > backup.sql

# Restore
cat backup.sql | docker compose exec -T db psql -U kb_user knowledge_base
```

---

## 8. ตั้งค่า Nginx + HTTPS (ถ้าใช้โดเมน)

### ติดตั้ง Nginx และ Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### สร้าง Nginx config

```bash
sudo nano /etc/nginx/sites-available/knowledge-base
```

เนื้อหา (เปลี่ยน `kb.yourdomain.com` เป็นโดเมนของคุณ):

```nginx
server {
    listen 80;
    server_name kb.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/knowledge-base /etc/nginx/sites-enabled/

# ทดสอบ config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# ขอ SSL certificate
sudo certbot --nginx -d kb.yourdomain.com
```

### แก้ไข .env หลังได้ HTTPS

```env
NEXTAUTH_URL=https://kb.yourdomain.com
```

จากนั้น restart app:

```bash
docker compose restart app
```

---

## 9. Firewall (แนะนำ)

```bash
# อนุญาต SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# ถ้าเข้า direct port 3000
sudo ufw allow 3000

sudo ufw enable
```

---

## 10. แก้ปัญหาเบื้องต้น

### App ไม่ start / Crash loop

```bash
docker compose logs app
```

เช็ค:
- `DATABASE_URL` ถูกต้องหรือไม่
- `AUTH_SECRET` มีค่าหรือไม่
- DB container สร้างแล้วและ healthy หรือยัง

### ไม่สามารถเชื่อมต่อ DB

```bash
# ทดสอบ connection จาก app container
docker compose exec app sh
# ใน shell: (ถ้ามี psql)
# หรือรอให้ db healthcheck ผ่านก่อน start app
```

### Port 3000 ถูกใช้งานอยู่

แก้ `APP_PORT` ใน `.env` เป็น port อื่น เช่น `3001`

### Build ล้มเหลว

```bash
# ล้าง cache แล้ว build ใหม่
docker compose build --no-cache
```

---

## สรุป Quick Start

```bash
git clone <repo-url> && cd knowledge-base
cp .env.example .env
nano .env   # แก้ POSTGRES_PASSWORD, AUTH_SECRET, NEXTAUTH_URL
docker compose up -d --build
sleep 15
# รันจาก host (แทน YOUR_PASSWORD ด้วย POSTGRES_PASSWORD จาก .env)
DATABASE_URL=postgresql://kb_user:YOUR_PASSWORD@localhost:5432/knowledge_base npx drizzle-kit push
DATABASE_URL=postgresql://kb_user:YOUR_PASSWORD@localhost:5432/knowledge_base npx tsx scripts/seed.ts
# เข้า http://YOUR_IP:3000
```
