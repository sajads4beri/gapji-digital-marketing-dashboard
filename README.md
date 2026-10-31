# Gapji Digital Marketing Dashboard

Monorepo با **NestJS** (بک‌اند)، **Next.js** (فرانت‌اند) و **PostgreSQL** (دیتابیس) با استفاده از `npm workspaces`.

## ساختار دایرتری

```
gapji-digital-marketing-dashboard/
├── apps/
│   ├── api/              # NestJS backend (Port 3001)
│   └── web/              # Next.js frontend (Port 3000)
├── packages/
│   └── shared/           # تایپ‌ها و유틸یتهای مشترک
├── docker-compose.yml    # PostgreSQL
├── package.json          # npm workspaces root
├── tsconfig.json
├── .env.example
└── README.md
```

## پیش‌نیازها

- Node.js >= 18
- Docker & Docker Compose (برای دیتابیس)

## اجرا در حالت توسعه

### ۱. کلون و نصب وابستگی‌ها
```bash
cd d:\gapji-digital-marketing-dashboard
npm install
```

### ۲. راه‌اندازی PostgreSQL
```bash
npm run db:up
```

### ۳. تنظیم متغیرهای محیطی
```bash
copy .env.example .env
```

### ۴. اجرا همزمان بک‌اند و فرانت‌اند
```bash
npm run dev
```

- API: http://localhost:3001 (Swagger: /docs)
- Web: http://localhost:3000

### ۵. جداگانه اجرا
```bash
# فقط بک‌اند
npm run dev:api

# فقط فرانت‌اند
npm run dev:web
```

## Docker Compose

```bash
# اجرا
docker-compose up -d

# متوقف کردن
docker-compose down
```

## اسکریپت‌های مفید

| اسکریپت | توضیح |
|---------|---------|
| `npm run dev` | اجرا همزمان API و Web |
| `npm run dev:api` | فقط BakeND در حالت watch |
| `npm run dev:web` | فقط FrontEnd در حالت dev |
| `npm run build` | Build هر دو پروژه |
| `npm run db:up` | راه‌اندازی PostgreSQL با Docker |
| `npm run db:down` | متوقف کردن دیتابیس |

## نقاط importantes API

- `GET /api/campaigns` — لیست تمام کمپین‌ها
- `GET /api/campaigns/stats` — آمار داشبورد
- `GET /api/campaigns/:id` — جزئیات یک کمپین
- `POST /api/campaigns` — ایجاد کمپین جدید
- `PATCH /api/campaigns/:id` — ویرایش کمپین
- `DELETE /api/campaigns/:id` — حذف کمپین

## لایسنس

MIT
