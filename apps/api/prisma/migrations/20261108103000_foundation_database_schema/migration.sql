-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'marketing_manager', 'campaign_manager', 'sales_agent', 'content_creator', 'client');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('toman', 'rial');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'invited', 'inactive');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'planned', 'active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "CampaignHealth" AS ENUM ('healthy', 'needs_attention', 'critical');

-- CreateEnum
CREATE TYPE "LeadStatusGroup" AS ENUM ('open', 'won', 'lost');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('ad_click', 'landing_visit', 'form_submit', 'call', 'note', 'status_change', 'assignment', 'purchase', 'rejection');

-- CreateEnum
CREATE TYPE "LeadCallStatus" AS ENUM ('successful', 'no_answer', 'busy', 'rescheduled');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'waiting', 'done', 'overdue');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TaskRelatedType" AS ENUM ('campaign', 'webinar', 'lead', 'sop', 'equipment', 'meeting');

-- CreateEnum
CREATE TYPE "CostSource" AS ENUM ('manual', 'import');

-- CreateEnum
CREATE TYPE "PlatformRetrievalMethod" AS ENUM ('manual', 'api', 'import');

-- CreateEnum
CREATE TYPE "EquipmentReadinessStatus" AS ENUM ('ready', 'incomplete', 'not_procured');

-- CreateEnum
CREATE TYPE "WebinarStatus" AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "SmsDeliveryStatus" AS ENUM ('pending', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "SopStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('submitted', 'reviewing', 'approved', 'rejected', 'implemented');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('upvote', 'downvote');

-- CreateEnum
CREATE TYPE "MetricDirection" AS ENUM ('higher_is_better', 'lower_is_better');

-- CreateEnum
CREATE TYPE "ImportDataType" AS ENUM ('leads', 'costs', 'contacts');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'success', 'warning', 'alert');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "mobile" VARCHAR(20),
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "avatarUrl" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "logoUrl" VARCHAR(500),
    "currency" "Currency" NOT NULL DEFAULT 'toman',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Tehran',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'campaign_manager',
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID,
    "tokenHash" VARCHAR(255) NOT NULL,
    "userAgent" VARCHAR(500),
    "ipAddress" VARCHAR(45),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_taxonomies" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "taxonomyType" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_taxonomies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100) NOT NULL DEFAULT 'digital',
    "objective" VARCHAR(100) NOT NULL DEFAULT 'lead',
    "channel" VARCHAR(100) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "health" "CampaignHealth" NOT NULL DEFAULT 'healthy',
    "budget" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "startDate" DATE,
    "endDate" DATE,
    "ownerId" UUID,
    "targetLeads" INTEGER,
    "targetSales" DECIMAL(12,2),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "retrievalMethod" "PlatformRetrievalMethod" NOT NULL DEFAULT 'manual',
    "icon" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_platform_allocations" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "platformId" UUID NOT NULL,
    "allocatedBudget" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "targetCount" INTEGER,
    "actualSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "actualCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_platform_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_audiences" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "gender" VARCHAR(20),
    "interests" TEXT,
    "location" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_audiences" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "targetAudienceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(200),
    "template" VARCHAR(100),
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "leadsCount" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "connectionStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utm_links" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    "landingPageId" UUID,
    "platformId" UUID,
    "originalUrl" VARCHAR(1000) NOT NULL,
    "utmSource" VARCHAR(100) NOT NULL,
    "utmMedium" VARCHAR(100) NOT NULL,
    "utmCampaign" VARCHAR(100) NOT NULL,
    "utmTerm" VARCHAR(100),
    "utmContent" VARCHAR(100),
    "finalUrl" VARCHAR(1500) NOT NULL,
    "clicksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utm_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_categories" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    "platformId" UUID,
    "categoryId" UUID,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "count" INTEGER,
    "source" "CostSource" NOT NULL DEFAULT 'manual',
    "createdById" UUID,
    "importJobId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status_configs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "group" "LeadStatusGroup" NOT NULL DEFAULT 'open',
    "color" VARCHAR(50),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_status_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "city" VARCHAR(100),
    "source" VARCHAR(100) NOT NULL DEFAULT 'manual',
    "campaignId" UUID,
    "platformId" UUID,
    "utmSource" VARCHAR(100),
    "utmMedium" VARCHAR(100),
    "utmCampaign" VARCHAR(100),
    "utmTerm" VARCHAR(100),
    "utmContent" VARCHAR(100),
    "statusKey" VARCHAR(100) NOT NULL DEFAULT 'new',
    "statusConfigId" UUID,
    "assignedToId" UUID,
    "salesValue" DECIMAL(12,2),
    "lostReason" VARCHAR(255),
    "nextFollowUpAt" TIMESTAMP(3),
    "nextFollowUpNote" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "details" TEXT,
    "actorUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_calls" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "callerUserId" UUID NOT NULL,
    "status" "LeadCallStatus" NOT NULL DEFAULT 'successful',
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "recordingUrl" VARCHAR(500),
    "callDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_campaigns" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "senderNumber" VARCHAR(50) NOT NULL,
    "messageText" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "costAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" "SmsStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_recipients" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "smsCampaignId" UUID NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "status" "SmsDeliveryStatus" NOT NULL DEFAULT 'pending',
    "deliveredAt" TIMESTAMP(3),
    "replyText" TEXT,
    "repliedAt" TIMESTAMP(3),
    "convertedLeadId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinars" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "presenterName" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(100) NOT NULL,
    "webinarDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "registrationUrl" VARCHAR(500),
    "bannerUrl" VARCHAR(500),
    "status" "WebinarStatus" NOT NULL DEFAULT 'scheduled',
    "capacity" INTEGER,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "attendedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_attendees" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "webinarId" UUID NOT NULL,
    "leadId" UUID,
    "fullName" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webinar_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "dueDate" DATE,
    "assigneeId" UUID,
    "createdById" UUID NOT NULL,
    "relatedType" "TaskRelatedType",
    "relatedId" UUID,
    "sopId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_subtasks" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "color" VARCHAR(50),
    "eventType" VARCHAR(50) NOT NULL DEFAULT 'meeting',
    "relatedType" "TaskRelatedType",
    "relatedId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_items" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_templates" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_template_items" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "equipmentItemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "equipment_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_equipments" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "equipmentItemId" UUID NOT NULL,
    "campaignId" UUID,
    "webinarId" UUID,
    "status" "EquipmentReadinessStatus" NOT NULL DEFAULT 'not_procured',
    "responsibleId" UUID,
    "dueDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(255),
    "attendeesSummary" VARCHAR(500),
    "summary" TEXT,
    "notes" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_action_items" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "meetingId" UUID NOT NULL,
    "taskId" UUID,
    "description" TEXT NOT NULL,
    "assigneeId" UUID,
    "dueDate" DATE,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sops" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "currentVersion" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "status" "SopStatus" NOT NULL DEFAULT 'draft',
    "authorId" UUID NOT NULL,
    "approverId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_versions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sopId" UUID NOT NULL,
    "versionNumber" VARCHAR(20) NOT NULL,
    "changeSummary" VARCHAR(500),
    "content" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sop_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "software" VARCHAR(100),
    "type" VARCHAR(50) NOT NULL,
    "url" VARCHAR(1000),
    "durationMinutes" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_progress" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    "taskId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "status" "IdeaStatus" NOT NULL DEFAULT 'submitted',
    "outcomeNotes" TEXT,
    "authorId" UUID NOT NULL,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_votes" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "ideaId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "voteType" "VoteType" NOT NULL DEFAULT 'upvote',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_metrics" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "formula" TEXT,
    "direction" "MetricDirection" NOT NULL DEFAULT 'higher_is_better',
    "targetValue" DECIMAL(12,2) NOT NULL,
    "actualValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit" VARCHAR(50) NOT NULL,
    "period" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_alert_rules" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "kpiMetricId" UUID,
    "metricName" VARCHAR(100) NOT NULL,
    "condition" VARCHAR(20) NOT NULL,
    "thresholdValue" DECIMAL(12,2) NOT NULL,
    "severity" VARCHAR(50) NOT NULL DEFAULT 'warning',
    "message" VARCHAR(500) NOT NULL,
    "suggestedAction" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "dataType" "ImportDataType" NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fieldMapping" TEXT,
    "duplicateHandling" VARCHAR(50),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'pending',
    "createdById" UUID NOT NULL,
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "userId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "userId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" UUID,
    "details" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordpress_integrations" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "siteUrl" VARCHAR(500) NOT NULL,
    "apiKeyHash" VARCHAR(255) NOT NULL,
    "webhookSecret" VARCHAR(255) NOT NULL,
    "leadMappingConfig" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wordpress_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordpress_webhook_logs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "wordpressIntegrationId" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "reason" TEXT,
    "payloadSummary" TEXT,
    "ipAddress" VARCHAR(45),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wordpress_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organization_memberships_userId_idx" ON "organization_memberships"("userId");

-- CreateIndex
CREATE INDEX "organization_memberships_organizationId_role_idx" ON "organization_memberships"("organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_organizationId_userId_key" ON "organization_memberships"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_organizationId_idx" ON "sessions"("organizationId");

-- CreateIndex
CREATE INDEX "organization_taxonomies_organizationId_taxonomyType_idx" ON "organization_taxonomies"("organizationId", "taxonomyType");

-- CreateIndex
CREATE UNIQUE INDEX "organization_taxonomies_organizationId_taxonomyType_key_key" ON "organization_taxonomies"("organizationId", "taxonomyType", "key");

-- CreateIndex
CREATE INDEX "notification_preferences_organizationId_userId_idx" ON "notification_preferences"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_organizationId_userId_eventType_key" ON "notification_preferences"("organizationId", "userId", "eventType");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_idx" ON "campaigns"("organizationId");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_status_idx" ON "campaigns"("organizationId", "status");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_health_idx" ON "campaigns"("organizationId", "health");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_ownerId_idx" ON "campaigns"("organizationId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_id_organizationId_key" ON "campaigns"("id", "organizationId");

-- CreateIndex
CREATE INDEX "platforms_organizationId_idx" ON "platforms"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_id_organizationId_key" ON "platforms"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_organizationId_code_key" ON "platforms"("organizationId", "code");

-- CreateIndex
CREATE INDEX "campaign_platform_allocations_organizationId_idx" ON "campaign_platform_allocations"("organizationId");

-- CreateIndex
CREATE INDEX "campaign_platform_allocations_campaignId_idx" ON "campaign_platform_allocations"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_platform_allocations_platformId_idx" ON "campaign_platform_allocations"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_platform_allocations_campaignId_platformId_key" ON "campaign_platform_allocations"("campaignId", "platformId");

-- CreateIndex
CREATE INDEX "target_audiences_organizationId_idx" ON "target_audiences"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "target_audiences_id_organizationId_key" ON "target_audiences"("id", "organizationId");

-- CreateIndex
CREATE INDEX "campaign_audiences_organizationId_idx" ON "campaign_audiences"("organizationId");

-- CreateIndex
CREATE INDEX "campaign_audiences_campaignId_idx" ON "campaign_audiences"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_audiences_targetAudienceId_idx" ON "campaign_audiences"("targetAudienceId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_audiences_campaignId_targetAudienceId_key" ON "campaign_audiences"("campaignId", "targetAudienceId");

-- CreateIndex
CREATE INDEX "landing_pages_organizationId_idx" ON "landing_pages"("organizationId");

-- CreateIndex
CREATE INDEX "landing_pages_campaignId_idx" ON "landing_pages"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_id_organizationId_key" ON "landing_pages"("id", "organizationId");

-- CreateIndex
CREATE INDEX "utm_links_organizationId_idx" ON "utm_links"("organizationId");

-- CreateIndex
CREATE INDEX "utm_links_campaignId_idx" ON "utm_links"("campaignId");

-- CreateIndex
CREATE INDEX "utm_links_landingPageId_idx" ON "utm_links"("landingPageId");

-- CreateIndex
CREATE INDEX "utm_links_platformId_idx" ON "utm_links"("platformId");

-- CreateIndex
CREATE INDEX "cost_categories_organizationId_idx" ON "cost_categories"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_categories_id_organizationId_key" ON "cost_categories"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_categories_organizationId_code_key" ON "cost_categories"("organizationId", "code");

-- CreateIndex
CREATE INDEX "costs_organizationId_idx" ON "costs"("organizationId");

-- CreateIndex
CREATE INDEX "costs_organizationId_date_idx" ON "costs"("organizationId", "date");

-- CreateIndex
CREATE INDEX "costs_campaignId_idx" ON "costs"("campaignId");

-- CreateIndex
CREATE INDEX "costs_platformId_idx" ON "costs"("platformId");

-- CreateIndex
CREATE INDEX "costs_categoryId_idx" ON "costs"("categoryId");

-- CreateIndex
CREATE INDEX "costs_importJobId_idx" ON "costs"("importJobId");

-- CreateIndex
CREATE INDEX "lead_status_configs_organizationId_idx" ON "lead_status_configs"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_status_configs_id_organizationId_key" ON "lead_status_configs"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_status_configs_organizationId_key_key" ON "lead_status_configs"("organizationId", "key");

-- CreateIndex
CREATE INDEX "leads_organizationId_idx" ON "leads"("organizationId");

-- CreateIndex
CREATE INDEX "leads_organizationId_statusKey_idx" ON "leads"("organizationId", "statusKey");

-- CreateIndex
CREATE INDEX "leads_organizationId_assignedToId_idx" ON "leads"("organizationId", "assignedToId");

-- CreateIndex
CREATE INDEX "leads_organizationId_mobile_idx" ON "leads"("organizationId", "mobile");

-- CreateIndex
CREATE INDEX "leads_campaignId_idx" ON "leads"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_id_organizationId_key" ON "leads"("id", "organizationId");

-- CreateIndex
CREATE INDEX "lead_activities_organizationId_idx" ON "lead_activities"("organizationId");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_idx" ON "lead_activities"("leadId");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_createdAt_idx" ON "lead_activities"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_calls_organizationId_idx" ON "lead_calls"("organizationId");

-- CreateIndex
CREATE INDEX "lead_calls_leadId_idx" ON "lead_calls"("leadId");

-- CreateIndex
CREATE INDEX "lead_calls_callerUserId_idx" ON "lead_calls"("callerUserId");

-- CreateIndex
CREATE INDEX "sms_campaigns_organizationId_idx" ON "sms_campaigns"("organizationId");

-- CreateIndex
CREATE INDEX "sms_campaigns_campaignId_idx" ON "sms_campaigns"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "sms_campaigns_id_organizationId_key" ON "sms_campaigns"("id", "organizationId");

-- CreateIndex
CREATE INDEX "sms_recipients_organizationId_idx" ON "sms_recipients"("organizationId");

-- CreateIndex
CREATE INDEX "sms_recipients_smsCampaignId_idx" ON "sms_recipients"("smsCampaignId");

-- CreateIndex
CREATE INDEX "sms_recipients_mobile_idx" ON "sms_recipients"("mobile");

-- CreateIndex
CREATE INDEX "sms_recipients_convertedLeadId_idx" ON "sms_recipients"("convertedLeadId");

-- CreateIndex
CREATE INDEX "webinars_organizationId_idx" ON "webinars"("organizationId");

-- CreateIndex
CREATE INDEX "webinars_campaignId_idx" ON "webinars"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "webinars_id_organizationId_key" ON "webinars"("id", "organizationId");

-- CreateIndex
CREATE INDEX "webinar_attendees_organizationId_idx" ON "webinar_attendees"("organizationId");

-- CreateIndex
CREATE INDEX "webinar_attendees_webinarId_idx" ON "webinar_attendees"("webinarId");

-- CreateIndex
CREATE INDEX "webinar_attendees_leadId_idx" ON "webinar_attendees"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_attendees_webinarId_mobile_key" ON "webinar_attendees"("webinarId", "mobile");

-- CreateIndex
CREATE INDEX "tasks_organizationId_idx" ON "tasks"("organizationId");

-- CreateIndex
CREATE INDEX "tasks_organizationId_status_idx" ON "tasks"("organizationId", "status");

-- CreateIndex
CREATE INDEX "tasks_organizationId_assigneeId_idx" ON "tasks"("organizationId", "assigneeId");

-- CreateIndex
CREATE INDEX "tasks_relatedType_relatedId_idx" ON "tasks"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "tasks_sopId_idx" ON "tasks"("sopId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_id_organizationId_key" ON "tasks"("id", "organizationId");

-- CreateIndex
CREATE INDEX "task_subtasks_organizationId_idx" ON "task_subtasks"("organizationId");

-- CreateIndex
CREATE INDEX "task_subtasks_taskId_idx" ON "task_subtasks"("taskId");

-- CreateIndex
CREATE INDEX "task_comments_organizationId_idx" ON "task_comments"("organizationId");

-- CreateIndex
CREATE INDEX "task_comments_taskId_idx" ON "task_comments"("taskId");

-- CreateIndex
CREATE INDEX "calendar_events_organizationId_idx" ON "calendar_events"("organizationId");

-- CreateIndex
CREATE INDEX "calendar_events_organizationId_startDate_endDate_idx" ON "calendar_events"("organizationId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "equipment_items_organizationId_idx" ON "equipment_items"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_items_id_organizationId_key" ON "equipment_items"("id", "organizationId");

-- CreateIndex
CREATE INDEX "equipment_templates_organizationId_idx" ON "equipment_templates"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_templates_id_organizationId_key" ON "equipment_templates"("id", "organizationId");

-- CreateIndex
CREATE INDEX "equipment_template_items_organizationId_idx" ON "equipment_template_items"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_template_items_templateId_equipmentItemId_key" ON "equipment_template_items"("templateId", "equipmentItemId");

-- CreateIndex
CREATE INDEX "event_equipments_organizationId_idx" ON "event_equipments"("organizationId");

-- CreateIndex
CREATE INDEX "event_equipments_organizationId_status_idx" ON "event_equipments"("organizationId", "status");

-- CreateIndex
CREATE INDEX "event_equipments_campaignId_idx" ON "event_equipments"("campaignId");

-- CreateIndex
CREATE INDEX "event_equipments_webinarId_idx" ON "event_equipments"("webinarId");

-- CreateIndex
CREATE INDEX "event_equipments_dueDate_idx" ON "event_equipments"("dueDate");

-- CreateIndex
CREATE INDEX "meetings_organizationId_idx" ON "meetings"("organizationId");

-- CreateIndex
CREATE INDEX "meetings_campaignId_idx" ON "meetings"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_id_organizationId_key" ON "meetings"("id", "organizationId");

-- CreateIndex
CREATE INDEX "meeting_action_items_organizationId_idx" ON "meeting_action_items"("organizationId");

-- CreateIndex
CREATE INDEX "meeting_action_items_meetingId_idx" ON "meeting_action_items"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_action_items_taskId_idx" ON "meeting_action_items"("taskId");

-- CreateIndex
CREATE INDEX "sops_organizationId_idx" ON "sops"("organizationId");

-- CreateIndex
CREATE INDEX "sops_organizationId_status_idx" ON "sops"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sops_id_organizationId_key" ON "sops"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "sops_organizationId_code_key" ON "sops"("organizationId", "code");

-- CreateIndex
CREATE INDEX "sop_versions_organizationId_idx" ON "sop_versions"("organizationId");

-- CreateIndex
CREATE INDEX "sop_versions_sopId_idx" ON "sop_versions"("sopId");

-- CreateIndex
CREATE UNIQUE INDEX "sop_versions_sopId_versionNumber_key" ON "sop_versions"("sopId", "versionNumber");

-- CreateIndex
CREATE INDEX "learning_resources_organizationId_idx" ON "learning_resources"("organizationId");

-- CreateIndex
CREATE INDEX "learning_resources_organizationId_category_idx" ON "learning_resources"("organizationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "learning_resources_id_organizationId_key" ON "learning_resources"("id", "organizationId");

-- CreateIndex
CREATE INDEX "user_learning_progress_organizationId_idx" ON "user_learning_progress"("organizationId");

-- CreateIndex
CREATE INDEX "user_learning_progress_userId_idx" ON "user_learning_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_learning_progress_userId_resourceId_key" ON "user_learning_progress"("userId", "resourceId");

-- CreateIndex
CREATE INDEX "ideas_organizationId_idx" ON "ideas"("organizationId");

-- CreateIndex
CREATE INDEX "ideas_organizationId_status_idx" ON "ideas"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ideas_campaignId_idx" ON "ideas"("campaignId");

-- CreateIndex
CREATE INDEX "ideas_taskId_idx" ON "ideas"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "ideas_id_organizationId_key" ON "ideas"("id", "organizationId");

-- CreateIndex
CREATE INDEX "idea_votes_organizationId_idx" ON "idea_votes"("organizationId");

-- CreateIndex
CREATE INDEX "idea_votes_ideaId_idx" ON "idea_votes"("ideaId");

-- CreateIndex
CREATE UNIQUE INDEX "idea_votes_ideaId_userId_key" ON "idea_votes"("ideaId", "userId");

-- CreateIndex
CREATE INDEX "kpi_metrics_organizationId_idx" ON "kpi_metrics"("organizationId");

-- CreateIndex
CREATE INDEX "kpi_metrics_campaignId_idx" ON "kpi_metrics"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_metrics_id_organizationId_key" ON "kpi_metrics"("id", "organizationId");

-- CreateIndex
CREATE INDEX "kpi_alert_rules_organizationId_idx" ON "kpi_alert_rules"("organizationId");

-- CreateIndex
CREATE INDEX "kpi_alert_rules_kpiMetricId_idx" ON "kpi_alert_rules"("kpiMetricId");

-- CreateIndex
CREATE INDEX "import_jobs_organizationId_idx" ON "import_jobs"("organizationId");

-- CreateIndex
CREATE INDEX "import_jobs_organizationId_status_idx" ON "import_jobs"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "import_jobs_id_organizationId_key" ON "import_jobs"("id", "organizationId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_organizationId_idx" ON "notifications"("organizationId");

-- CreateIndex
CREATE INDEX "user_activity_logs_organizationId_idx" ON "user_activity_logs"("organizationId");

-- CreateIndex
CREATE INDEX "user_activity_logs_userId_idx" ON "user_activity_logs"("userId");

-- CreateIndex
CREATE INDEX "user_activity_logs_entityType_entityId_idx" ON "user_activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "user_activity_logs_createdAt_idx" ON "user_activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "wordpress_integrations_organizationId_idx" ON "wordpress_integrations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "wordpress_integrations_id_organizationId_key" ON "wordpress_integrations"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "wordpress_integrations_organizationId_siteUrl_key" ON "wordpress_integrations"("organizationId", "siteUrl");

-- CreateIndex
CREATE INDEX "wordpress_webhook_logs_organizationId_idx" ON "wordpress_webhook_logs"("organizationId");

-- CreateIndex
CREATE INDEX "wordpress_webhook_logs_wordpressIntegrationId_idx" ON "wordpress_webhook_logs"("wordpressIntegrationId");

-- CreateIndex
CREATE INDEX "wordpress_webhook_logs_receivedAt_idx" ON "wordpress_webhook_logs"("receivedAt");

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_taxonomies" ADD CONSTRAINT "organization_taxonomies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platforms" ADD CONSTRAINT "platforms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_platform_allocations" ADD CONSTRAINT "campaign_platform_allocations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_platform_allocations" ADD CONSTRAINT "campaign_platform_allocations_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_platform_allocations" ADD CONSTRAINT "campaign_platform_allocations_platformId_organizationId_fkey" FOREIGN KEY ("platformId", "organizationId") REFERENCES "platforms"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_audiences" ADD CONSTRAINT "campaign_audiences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_audiences" ADD CONSTRAINT "campaign_audiences_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_audiences" ADD CONSTRAINT "campaign_audiences_targetAudienceId_organizationId_fkey" FOREIGN KEY ("targetAudienceId", "organizationId") REFERENCES "target_audiences"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utm_links" ADD CONSTRAINT "utm_links_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utm_links" ADD CONSTRAINT "utm_links_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utm_links" ADD CONSTRAINT "utm_links_landingPageId_organizationId_fkey" FOREIGN KEY ("landingPageId", "organizationId") REFERENCES "landing_pages"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utm_links" ADD CONSTRAINT "utm_links_platformId_organizationId_fkey" FOREIGN KEY ("platformId", "organizationId") REFERENCES "platforms"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_categories" ADD CONSTRAINT "cost_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_platformId_organizationId_fkey" FOREIGN KEY ("platformId", "organizationId") REFERENCES "platforms"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_categoryId_organizationId_fkey" FOREIGN KEY ("categoryId", "organizationId") REFERENCES "cost_categories"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_importJobId_organizationId_fkey" FOREIGN KEY ("importJobId", "organizationId") REFERENCES "import_jobs"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status_configs" ADD CONSTRAINT "lead_status_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_platformId_organizationId_fkey" FOREIGN KEY ("platformId", "organizationId") REFERENCES "platforms"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_statusConfigId_organizationId_fkey" FOREIGN KEY ("statusConfigId", "organizationId") REFERENCES "lead_status_configs"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_organizationId_fkey" FOREIGN KEY ("leadId", "organizationId") REFERENCES "leads"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_calls" ADD CONSTRAINT "lead_calls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_calls" ADD CONSTRAINT "lead_calls_leadId_organizationId_fkey" FOREIGN KEY ("leadId", "organizationId") REFERENCES "leads"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_calls" ADD CONSTRAINT "lead_calls_callerUserId_fkey" FOREIGN KEY ("callerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_recipients" ADD CONSTRAINT "sms_recipients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_recipients" ADD CONSTRAINT "sms_recipients_smsCampaignId_organizationId_fkey" FOREIGN KEY ("smsCampaignId", "organizationId") REFERENCES "sms_campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_recipients" ADD CONSTRAINT "sms_recipients_convertedLeadId_organizationId_fkey" FOREIGN KEY ("convertedLeadId", "organizationId") REFERENCES "leads"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinars" ADD CONSTRAINT "webinars_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinars" ADD CONSTRAINT "webinars_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_attendees" ADD CONSTRAINT "webinar_attendees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_attendees" ADD CONSTRAINT "webinar_attendees_webinarId_organizationId_fkey" FOREIGN KEY ("webinarId", "organizationId") REFERENCES "webinars"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_attendees" ADD CONSTRAINT "webinar_attendees_leadId_organizationId_fkey" FOREIGN KEY ("leadId", "organizationId") REFERENCES "leads"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sopId_organizationId_fkey" FOREIGN KEY ("sopId", "organizationId") REFERENCES "sops"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_taskId_organizationId_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "tasks"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_taskId_organizationId_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "tasks"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_items" ADD CONSTRAINT "equipment_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_templates" ADD CONSTRAINT "equipment_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_template_items" ADD CONSTRAINT "equipment_template_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_template_items" ADD CONSTRAINT "equipment_template_items_templateId_organizationId_fkey" FOREIGN KEY ("templateId", "organizationId") REFERENCES "equipment_templates"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_template_items" ADD CONSTRAINT "equipment_template_items_equipmentItemId_organizationId_fkey" FOREIGN KEY ("equipmentItemId", "organizationId") REFERENCES "equipment_items"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_equipments" ADD CONSTRAINT "event_equipments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_equipments" ADD CONSTRAINT "event_equipments_equipmentItemId_organizationId_fkey" FOREIGN KEY ("equipmentItemId", "organizationId") REFERENCES "equipment_items"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_equipments" ADD CONSTRAINT "event_equipments_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_equipments" ADD CONSTRAINT "event_equipments_webinarId_organizationId_fkey" FOREIGN KEY ("webinarId", "organizationId") REFERENCES "webinars"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_equipments" ADD CONSTRAINT "event_equipments_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_meetingId_organizationId_fkey" FOREIGN KEY ("meetingId", "organizationId") REFERENCES "meetings"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_taskId_organizationId_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "tasks"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_versions" ADD CONSTRAINT "sop_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_versions" ADD CONSTRAINT "sop_versions_sopId_organizationId_fkey" FOREIGN KEY ("sopId", "organizationId") REFERENCES "sops"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_versions" ADD CONSTRAINT "sop_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_resourceId_organizationId_fkey" FOREIGN KEY ("resourceId", "organizationId") REFERENCES "learning_resources"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_taskId_organizationId_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "tasks"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_votes" ADD CONSTRAINT "idea_votes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_votes" ADD CONSTRAINT "idea_votes_ideaId_organizationId_fkey" FOREIGN KEY ("ideaId", "organizationId") REFERENCES "ideas"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_votes" ADD CONSTRAINT "idea_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_metrics" ADD CONSTRAINT "kpi_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_metrics" ADD CONSTRAINT "kpi_metrics_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_alert_rules" ADD CONSTRAINT "kpi_alert_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_alert_rules" ADD CONSTRAINT "kpi_alert_rules_kpiMetricId_organizationId_fkey" FOREIGN KEY ("kpiMetricId", "organizationId") REFERENCES "kpi_metrics"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_integrations" ADD CONSTRAINT "wordpress_integrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_webhook_logs" ADD CONSTRAINT "wordpress_webhook_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_webhook_logs" ADD CONSTRAINT "wordpress_webhook_logs_wordpressIntegrationId_organization_fkey" FOREIGN KEY ("wordpressIntegrationId", "organizationId") REFERENCES "wordpress_integrations"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Seed and Backfill Strategy (MIN-04)
-- ============================================================================

-- Seed Default Organization for backward compatibility and tenant safety
INSERT INTO "organizations" ("id", "name", "slug", "currency", "timezone", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', 'toman', 'Asia/Tehran', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Backfill existing unassigned records to Default Organization (if any exist during migration)
UPDATE "campaigns"
SET "organizationId" = '00000000-0000-0000-0000-000000000001'
WHERE "organizationId" IS NULL;
