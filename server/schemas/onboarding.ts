import { z } from 'zod';
import { Ethnicity, Religion, SexualOrientation, IncomeSource } from '@prisma/client';

// ===== TENANT PROFILE SCHEMA =====
export const tenantProfileSchema = z.object({
  title: z.string().optional(),
  otherNames: z.string().optional(),
  placeOfBirth: z.string().optional(),
  previousAddress: z.string().optional(),
  nationality: z.string().optional(),
  languagesSpoken: z.string().optional(),
  ethnicity: z.nativeEnum(Ethnicity).optional(),
  religion: z.nativeEnum(Religion).optional(),
  sexualOrientation: z.nativeEnum(SexualOrientation).optional(),
  maritalStatus: z.string().optional(),
  currentSituation: z.string().optional(),
  homelessnessReason: z.string().optional(),
  disabilities: z.string().optional(),
  communicationNeeds: z.string().optional(),
});

export type TenantProfileInput = z.infer<typeof tenantProfileSchema>;

// ===== RISK ASSESSMENT SCHEMA =====
export const riskAssessmentSchema = z.object({
  hasCriminalRecord: z.boolean().default(false),
  criminalRecordDetails: z.string().optional(),
  hasDrugUse: z.boolean().default(false),
  drugUseDetails: z.string().optional(),
  hasAlcoholIssue: z.boolean().default(false),
  alcoholDetails: z.string().optional(),
  hasSuicidalThoughts: z.boolean().default(false),
  suicidalThoughtsDetails: z.string().optional(),
  hasSelfHarmHistory: z.boolean().default(false),
  selfHarmDetails: z.string().optional(),
  hasMentalHealth: z.boolean().default(false),
  mentalHealthDetails: z.string().optional(),
  mentalHealthDiagnosis: z.string().optional(),
  prescribedMedication: z.string().optional(),
  hasSocialWorker: z.boolean().default(false),
  socialWorkerDetails: z.string().optional(),
  hasProbationOfficer: z.boolean().default(false),
  probationOfficerName: z.string().optional(),
  probationOfficerPhone: z.string().optional(),
  probationDetails: z.string().optional(),
  doctorName: z.string().optional(),
  doctorPhone: z.string().optional(),
  gpPractice: z.string().optional(),
  cpnName: z.string().optional(),
  cpnPhone: z.string().optional(),
  psychiatristName: z.string().optional(),
  psychiatristPhone: z.string().optional(),
  riskNotes: z.string().optional(),
});

export type RiskAssessmentInput = z.infer<typeof riskAssessmentSchema>;

// ===== SUPPORT PLAN SCHEMA =====
export const supportPlanSchema = z.object({
  supportNeeds: z.string().optional(),
  supportGoals: z.string().optional(),
  budgetPlanAgreed: z.boolean().default(false),
  employmentSupport: z.boolean().default(false),
  lifeSkillsSupport: z.boolean().default(false),
  healthSupport: z.boolean().default(false),
  reviewFrequency: z.string().optional(),
  lastReviewDate: z.string().or(z.date()).transform(val => val ? new Date(val) : null).optional(),
  nextReviewDate: z.string().or(z.date()).transform(val => val ? new Date(val) : null).optional(),
  supportWorkerNotes: z.string().optional(),
});

export type SupportPlanInput = z.infer<typeof supportPlanSchema>;

// ===== FINANCE SCHEMA =====
export const financeSchema = z.object({
  incomeSource: z.nativeEnum(IncomeSource).optional(),
  benefitType: z.string().optional(),
  benefitAmount: z.number().positive().optional(),
  benefitFrequency: z.string().optional(),
  hasNilIncome: z.boolean().default(false),
  nilIncomeExplanation: z.string().optional(),
  councilAuthorizationAgreed: z.boolean().default(false),
  employmentDetails: z.string().optional(),
  debtDetails: z.string().optional(),
});

export type FinanceInput = z.infer<typeof financeSchema>;

// ===== CONSENT SCHEMA =====
export const consentSchema = z.object({
  authorizationFormSigned: z.boolean().default(false),
  authorizationFormSignature: z.string().optional(),
  confidentialityWaiverSigned: z.boolean().default(false),
  confidentialityWaiverSignature: z.string().optional(),
  fireEvacuationAcknowledged: z.boolean().default(false),
  fireEvacuationSignature: z.string().optional(),
  licenceAgreementSigned: z.boolean().default(false),
  licenceAgreementSignature: z.string().optional(),
  missingPersonFormSigned: z.boolean().default(false),
  missingPersonFormSignature: z.string().optional(),
  nilIncomeFormSigned: z.boolean().default(false),
  nilIncomeFormSignature: z.string().optional(),
  serviceChargeAgreementSigned: z.boolean().default(false),
  serviceChargeAgreementSignature: z.string().optional(),
  supportAgreementSigned: z.boolean().default(false),
  supportAgreementSignature: z.string().optional(),
  supportNeedsAssessmentSigned: z.boolean().default(false),
  supportNeedsAssessmentSignature: z.string().optional(),
  photoIdConsentGiven: z.boolean().default(false),
  photoIdConsentType: z.enum(['PROVIDED_ID', 'PERMISSION_TO_PHOTOGRAPH', 'DECLINE']).optional(),
  photoIdConsentSignature: z.string().optional(),
});

export type ConsentInput = z.infer<typeof consentSchema>;

// ===== MISSING PERSON PROFILE SCHEMA =====
export const missingPersonProfileSchema = z.object({
  height: z.string().optional(),
  shoeSize: z.string().optional(),
  clothingSize: z.string().optional(),
  build: z.string().optional(),
  distinguishingMarks: z.string().optional(),
  skinTone: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  vehicleDetails: z.string().optional(),
  potentialRiskDetails: z.string().optional(),
  likelyDestinations: z.string().optional(),
  employerOrCollege: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type MissingPersonProfileInput = z.infer<typeof missingPersonProfileSchema>;

// ===== INVENTORY LOG SCHEMA =====
export const inventoryLogSchema = z.object({
  roomId: z.string().uuid().optional(),
  checkInDate: z.string().or(z.date()).transform(val => new Date(val)),
  checkOutDate: z.string().or(z.date()).transform(val => val ? new Date(val) : null).optional(),
  hasQuilt: z.boolean().default(false),
  hasPillow: z.boolean().default(false),
  hasDuvetCover: z.boolean().default(false),
  hasFittedSheet: z.boolean().default(false),
  hasWindowDressing: z.boolean().default(false),
  hasWardrobe: z.boolean().default(false),
  hasChestOfDrawers: z.boolean().default(false),
  hasBed: z.boolean().default(false),
  hasMattress: z.boolean().default(false),
  keysIssued: z.number().int().min(0).default(0),
  isCleanAndTidy: z.boolean().default(false),
  floorWallGoodCondition: z.boolean().default(false),
  electricsWorking: z.boolean().default(false),
  structureGoodCondition: z.boolean().default(false),
  checkOutClean: z.boolean().optional(),
  checkOutDamages: z.string().optional(),
  notes: z.string().optional(),
  conditionPhotos: z.array(z.string()).optional(),
});

export type InventoryLogInput = z.infer<typeof inventoryLogSchema>;

// ===== SERVICE CHARGE RECORD SCHEMA =====
export const serviceChargeRecordSchema = z.object({
  weekStartDate: z.string().or(z.date()).transform(val => new Date(val)),
  weekEndDate: z.string().or(z.date()).transform(val => new Date(val)),
  chargeAmount: z.number().positive(),
  isPaid: z.boolean().default(false),
  paidAt: z.string().or(z.date()).transform(val => val ? new Date(val) : null).optional(),
  paidAmount: z.number().positive().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'BENEFITS', 'OTHER']).optional(),
  notes: z.string().optional(),
});

export type ServiceChargeRecordInput = z.infer<typeof serviceChargeRecordSchema>;

// ===== EMERGENCY CONTACT SCHEMA =====
export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
