# 06 — DEPENDENCY MAP & INTERACTION TOPOLOGY (نقشه وابستگی‌ها و تعاملات)
## گراف وابستگی‌های ماژول‌ها، شعاع اثر تغییرات و نقاط بحرانی اتصال

---

## 1. CROSS-MODULE TOPOLOGY & DATA LINEAGE (گراف جریان اطلاعات و وابستگی‌ها)

```mermaid
graph TD
    AUTH["Auth & Multi-Tenancy (P01)"] --> USERS["Users & RBAC (P27)"]
    AUTH --> ORG["Organization Settings (P28)"]
    
    CAMP["Campaigns Lifecycle (P05-P07)"] --> PLAT["Ad Platforms (P08)"]
    CAMP --> AUD["Audiences (P12)"]
    CAMP --> LAND["Landing & UTM (P13)"]
    
    COST["Costs Management (P09)"] --> CAMP
    COST --> PLAT
    
    DASH["Executive Dashboard (P04)"] --> CAMP
    DASH --> COST
    DASH --> LEADS["Leads Inbox & Board (P14-P15)"]
    
    LEADS --> CAMP
    LEADS --> LAND
    WP["WordPress Webhooks (P29)"] --> LEADS
    
    TASKS["Task Management (P19)"] --> CAMP
    TASKS --> LEADS
    TASKS --> SOP["SOP Knowledge (P23)"]
    
    CALENDAR["Calendar (P20)"] --> CAMP
    CALENDAR --> WEBINAR["Webinars (P18)"]
    CALENDAR --> TASKS
```

---

## 2. CRITICAL BOTTLENECK ANALYSIS (تحلیل نقاط حساس و شعاع اثر)

1. **`auth-context.tsx` & `useAuth()`**: هرگونه تغییر ناسازگار در این کانتکست باعث از کار افتادن کل صفحات برنامه و نوار ناوبری می‌شود (Blast Radius: 100%).
2. **`permissions.ts` (`can`, `canAccessRoute`)**: کنترل‌کننده اصلی ماسک کردن شماره تلفن‌ها، نمایش دکمه‌ها و فیلتر منوها (Blast Radius: 90%).
3. **`persian-date.ts`**: هسته محاسبات فیلترهای زمانی، سال کبیسه شمسی و تبدیل به میلادی (Blast Radius: 85%).
4. **`Campaign` Entity**: ارتباط دهنده هزینه‌ها، لیدها، وبینارها، تسک‌ها و رویدادهای تقویم (Blast Radius: 75%).
