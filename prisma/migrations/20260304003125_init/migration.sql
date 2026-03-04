-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPS', 'SUPPORT', 'VIEWER', 'COMPLIANCE_OFFICER', 'ORG_ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'READY_FOR_TENANCY', 'ACTIVE', 'NOTICE_GIVEN', 'MOVED_OUT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PROOF_OF_ID', 'PROOF_OF_INCOME', 'SUPPORT_PLAN', 'MEDICAL', 'AUTHORIZATION_FORM', 'CONFIDENTIALITY_WAIVER', 'FIRE_EVACUATION', 'LICENCE_AGREEMENT', 'MISSING_PERSON_FORM', 'NIL_INCOME_FORM', 'SERVICE_CHARGE_AGREEMENT', 'SUPPORT_AGREEMENT', 'SUPPORT_NEEDS_ASSESSMENT', 'PHOTO_ID_CONSENT', 'OTHER');

-- CreateEnum
CREATE TYPE "Ethnicity" AS ENUM ('WHITE_BRITISH', 'WHITE_IRISH', 'WHITE_OTHER', 'MIXED_WHITE_BLACK_CARIBBEAN', 'MIXED_WHITE_BLACK_AFRICAN', 'MIXED_WHITE_ASIAN', 'MIXED_OTHER', 'ASIAN_INDIAN', 'ASIAN_PAKISTANI', 'ASIAN_BANGLADESHI', 'ASIAN_OTHER', 'BLACK_CARIBBEAN', 'BLACK_AFRICAN', 'BLACK_OTHER', 'CHINESE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('NO_RELIGION', 'CHRISTIAN', 'MUSLIM', 'HINDU', 'SIKH', 'JEWISH', 'BUDDHIST', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SexualOrientation" AS ENUM ('HETEROSEXUAL', 'HOMOSEXUAL', 'LESBIAN', 'BISEXUAL', 'TRANSGENDER', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('ESA', 'DLA', 'JSA', 'UNIVERSAL_CREDIT', 'HOUSING_BENEFIT', 'NIL_INCOME', 'EMPLOYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('IN_PERSON', 'PHONE_CALL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'AUTHORISED_NON_ATTENDANCE', 'DID_NOT_ATTEND');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('SAFEGUARDING', 'MEDICATION', 'ACCIDENT', 'NEAR_MISS', 'BEHAVIORAL', 'PROPERTY_DAMAGE', 'MISSING_PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('REPORTED', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('CQC_INSPECTION', 'INTERNAL_AUDIT', 'FIRE_SAFETY', 'HEALTH_SAFETY', 'SAFEGUARDING', 'MEDICATION', 'GDPR_COMPLIANCE', 'OTHER');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "address" TEXT,
    "postcode" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'BASIC',
    "billingContact" TEXT,
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "paymentMethod" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "description" TEXT,
    "serviceChargeAmount" DECIMAL(10,2),
    "serviceChargeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "floor" INTEGER,
    "facilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationalInsuranceNumber" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenancies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "serviceChargeAmount" DECIMAL(10,2),
    "endReason" TEXT,
    "endNotes" TEXT,
    "endedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "rejectionReason" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_blobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "encryptedData" BYTEA NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_blobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT,
    "otherNames" TEXT,
    "placeOfBirth" TEXT,
    "previousAddress" TEXT,
    "nationality" TEXT,
    "languagesSpoken" TEXT,
    "ethnicity" "Ethnicity",
    "religion" "Religion",
    "sexualOrientation" "SexualOrientation",
    "maritalStatus" TEXT,
    "currentSituation" TEXT,
    "homelessnessReason" TEXT,
    "disabilities" TEXT,
    "communicationNeeds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_emergency_contacts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_finance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "incomeSource" "IncomeSource",
    "benefitType" TEXT,
    "benefitAmount" DECIMAL(10,2),
    "benefitFrequency" TEXT,
    "hasNilIncome" BOOLEAN NOT NULL DEFAULT false,
    "nilIncomeExplanation" TEXT,
    "councilAuthorizationAgreed" BOOLEAN NOT NULL DEFAULT false,
    "employmentDetails" TEXT,
    "debtDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_finance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_risk_assessments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hasCriminalRecord" BOOLEAN NOT NULL DEFAULT false,
    "criminalRecordDetails" TEXT,
    "hasDrugUse" BOOLEAN NOT NULL DEFAULT false,
    "drugUseDetails" TEXT,
    "hasAlcoholIssue" BOOLEAN NOT NULL DEFAULT false,
    "alcoholDetails" TEXT,
    "hasSuicidalThoughts" BOOLEAN NOT NULL DEFAULT false,
    "suicidalThoughtsDetails" TEXT,
    "hasSelfHarmHistory" BOOLEAN NOT NULL DEFAULT false,
    "selfHarmDetails" TEXT,
    "hasMentalHealth" BOOLEAN NOT NULL DEFAULT false,
    "mentalHealthDetails" TEXT,
    "mentalHealthDiagnosis" TEXT,
    "prescribedMedication" TEXT,
    "hasSocialWorker" BOOLEAN NOT NULL DEFAULT false,
    "socialWorkerDetails" TEXT,
    "hasProbationOfficer" BOOLEAN NOT NULL DEFAULT false,
    "probationOfficerName" TEXT,
    "probationOfficerPhone" TEXT,
    "probationDetails" TEXT,
    "doctorName" TEXT,
    "doctorPhone" TEXT,
    "gpPractice" TEXT,
    "cpnName" TEXT,
    "cpnPhone" TEXT,
    "psychiatristName" TEXT,
    "psychiatristPhone" TEXT,
    "riskNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_support_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supportNeeds" TEXT,
    "supportGoals" TEXT,
    "budgetPlanAgreed" BOOLEAN NOT NULL DEFAULT false,
    "employmentSupport" BOOLEAN NOT NULL DEFAULT false,
    "lifeSkillsSupport" BOOLEAN NOT NULL DEFAULT false,
    "healthSupport" BOOLEAN NOT NULL DEFAULT false,
    "reviewFrequency" TEXT,
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "supportWorkerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_support_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_consents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorizationFormSigned" BOOLEAN NOT NULL DEFAULT false,
    "authorizationFormSignedAt" TIMESTAMP(3),
    "authorizationFormSignature" TEXT,
    "confidentialityWaiverSigned" BOOLEAN NOT NULL DEFAULT false,
    "confidentialityWaiverSignedAt" TIMESTAMP(3),
    "confidentialityWaiverSignature" TEXT,
    "fireEvacuationAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "fireEvacuationAcknowledgedAt" TIMESTAMP(3),
    "fireEvacuationSignature" TEXT,
    "licenceAgreementSigned" BOOLEAN NOT NULL DEFAULT false,
    "licenceAgreementSignedAt" TIMESTAMP(3),
    "licenceAgreementSignature" TEXT,
    "missingPersonFormSigned" BOOLEAN NOT NULL DEFAULT false,
    "missingPersonFormSignedAt" TIMESTAMP(3),
    "missingPersonFormSignature" TEXT,
    "nilIncomeFormSigned" BOOLEAN NOT NULL DEFAULT false,
    "nilIncomeFormSignedAt" TIMESTAMP(3),
    "nilIncomeFormSignature" TEXT,
    "serviceChargeAgreementSigned" BOOLEAN NOT NULL DEFAULT false,
    "serviceChargeAgreementSignedAt" TIMESTAMP(3),
    "serviceChargeAgreementSignature" TEXT,
    "supportAgreementSigned" BOOLEAN NOT NULL DEFAULT false,
    "supportAgreementSignedAt" TIMESTAMP(3),
    "supportAgreementSignature" TEXT,
    "supportNeedsAssessmentSigned" BOOLEAN NOT NULL DEFAULT false,
    "supportNeedsAssessmentSignedAt" TIMESTAMP(3),
    "supportNeedsAssessmentSignature" TEXT,
    "photoIdConsentGiven" BOOLEAN NOT NULL DEFAULT false,
    "photoIdConsentGivenAt" TIMESTAMP(3),
    "photoIdConsentType" TEXT,
    "photoIdConsentSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missing_person_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "height" TEXT,
    "shoeSize" TEXT,
    "clothingSize" TEXT,
    "build" TEXT,
    "distinguishingMarks" TEXT,
    "skinTone" TEXT,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "vehicleDetails" TEXT,
    "potentialRiskDetails" TEXT,
    "likelyDestinations" TEXT,
    "employerOrCollege" TEXT,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missing_person_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT,
    "checkInDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutDate" TIMESTAMP(3),
    "hasQuilt" BOOLEAN NOT NULL DEFAULT false,
    "hasPillow" BOOLEAN NOT NULL DEFAULT false,
    "hasDuvetCover" BOOLEAN NOT NULL DEFAULT false,
    "hasFittedSheet" BOOLEAN NOT NULL DEFAULT false,
    "hasWindowDressing" BOOLEAN NOT NULL DEFAULT false,
    "hasWardrobe" BOOLEAN NOT NULL DEFAULT false,
    "hasChestOfDrawers" BOOLEAN NOT NULL DEFAULT false,
    "hasBed" BOOLEAN NOT NULL DEFAULT false,
    "hasMattress" BOOLEAN NOT NULL DEFAULT false,
    "keysIssued" INTEGER NOT NULL DEFAULT 0,
    "isCleanAndTidy" BOOLEAN NOT NULL DEFAULT false,
    "floorWallGoodCondition" BOOLEAN NOT NULL DEFAULT false,
    "electricsWorking" BOOLEAN NOT NULL DEFAULT false,
    "structureGoodCondition" BOOLEAN NOT NULL DEFAULT false,
    "checkOutClean" BOOLEAN,
    "checkOutDamages" TEXT,
    "notes" TEXT,
    "conditionPhotos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_charge_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "chargeAmount" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(10,2),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_charge_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT NOT NULL,
    "dbsNumber" TEXT,
    "dbsExpiryDate" TIMESTAMP(3),
    "dbsCheckDate" TIMESTAMP(3),
    "trainingRecords" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContact" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "residentId" TEXT,
    "reportedById" TEXT NOT NULL,
    "incidentType" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "witnessDetails" TEXT,
    "actionsTaken" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "auditType" "AuditType" NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "auditorName" TEXT,
    "auditorOrganization" TEXT,
    "findings" TEXT,
    "score" INTEGER,
    "actionPlan" TEXT,
    "evidence" JSONB,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supportWorkerId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "attendanceStatus" "AttendanceStatus" NOT NULL,
    "economicWellbeingNotes" TEXT,
    "enjoyAchieveNotes" TEXT,
    "healthNotes" TEXT,
    "staySafeNotes" TEXT,
    "positiveContributionNotes" TEXT,
    "specificSupportNeeds" TEXT,
    "sessionComments" TEXT,
    "clientSignature" TEXT,
    "supportWorkerSignature" TEXT,
    "nextSessionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_subdomain_key" ON "organizations"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "properties_organizationId_idx" ON "properties"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_propertyId_roomNumber_key" ON "rooms"("propertyId", "roomNumber");

-- CreateIndex
CREATE INDEX "tenants_organizationId_idx" ON "tenants"("organizationId");

-- CreateIndex
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");

-- CreateIndex
CREATE INDEX "documents_tenantId_idx" ON "documents"("tenantId");

-- CreateIndex
CREATE INDEX "documents_sha256Hash_idx" ON "documents"("sha256Hash");

-- CreateIndex
CREATE UNIQUE INDEX "document_blobs_documentId_key" ON "document_blobs"("documentId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_profiles_tenantId_key" ON "tenant_profiles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_finance_tenantId_key" ON "tenant_finance"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_risk_assessments_tenantId_key" ON "tenant_risk_assessments"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_support_plans_tenantId_key" ON "tenant_support_plans"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_consents_tenantId_key" ON "tenant_consents"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "missing_person_profiles_tenantId_key" ON "missing_person_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "inventory_logs_tenantId_idx" ON "inventory_logs"("tenantId");

-- CreateIndex
CREATE INDEX "service_charge_records_tenantId_idx" ON "service_charge_records"("tenantId");

-- CreateIndex
CREATE INDEX "service_charge_records_weekStartDate_idx" ON "service_charge_records"("weekStartDate");

-- CreateIndex
CREATE INDEX "service_charge_records_isPaid_idx" ON "service_charge_records"("isPaid");

-- CreateIndex
CREATE INDEX "staff_organizationId_idx" ON "staff"("organizationId");

-- CreateIndex
CREATE INDEX "staff_dbsExpiryDate_idx" ON "staff"("dbsExpiryDate");

-- CreateIndex
CREATE INDEX "incidents_organizationId_idx" ON "incidents"("organizationId");

-- CreateIndex
CREATE INDEX "incidents_residentId_idx" ON "incidents"("residentId");

-- CreateIndex
CREATE INDEX "incidents_reportedById_idx" ON "incidents"("reportedById");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_reportedAt_idx" ON "incidents"("reportedAt");

-- CreateIndex
CREATE INDEX "compliance_organizationId_idx" ON "compliance"("organizationId");

-- CreateIndex
CREATE INDEX "compliance_auditType_idx" ON "compliance"("auditType");

-- CreateIndex
CREATE INDEX "compliance_status_idx" ON "compliance"("status");

-- CreateIndex
CREATE INDEX "compliance_auditDate_idx" ON "compliance"("auditDate");

-- CreateIndex
CREATE INDEX "support_notes_organizationId_idx" ON "support_notes"("organizationId");

-- CreateIndex
CREATE INDEX "support_notes_tenantId_idx" ON "support_notes"("tenantId");

-- CreateIndex
CREATE INDEX "support_notes_supportWorkerId_idx" ON "support_notes"("supportWorkerId");

-- CreateIndex
CREATE INDEX "support_notes_sessionDate_idx" ON "support_notes"("sessionDate");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_blobs" ADD CONSTRAINT "document_blobs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_profiles" ADD CONSTRAINT "tenant_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_emergency_contacts" ADD CONSTRAINT "tenant_emergency_contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_finance" ADD CONSTRAINT "tenant_finance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_risk_assessments" ADD CONSTRAINT "tenant_risk_assessments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_support_plans" ADD CONSTRAINT "tenant_support_plans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_consents" ADD CONSTRAINT "tenant_consents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missing_person_profiles" ADD CONSTRAINT "missing_person_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_charge_records" ADD CONSTRAINT "service_charge_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_supportWorkerId_fkey" FOREIGN KEY ("supportWorkerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
