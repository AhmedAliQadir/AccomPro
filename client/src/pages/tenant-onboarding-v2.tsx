import { useState, useEffect, useRef } from 'react';
import { useForm, UseFormReturn, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, ArrowRight, Save, CheckCircle, Trash2, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ============================================================
// TYPE DEFINITIONS (Aligned with Backend Schemas)
// ============================================================

// Step 1: Pre-Intake Data (stored in localStorage only, not sent to backend yet)
const preIntakeSchema = z.object({
  referralSource: z.string().min(1, 'Referral source is required'),
  referralDate: z.string().optional(),
  isEmergencyAdmission: z.boolean().default(false),
  eligibilityConfirmed: z.boolean().default(false).refine((val) => val === true, {
    message: 'You must confirm that the applicant meets eligibility criteria before proceeding',
  }),
});

type PreIntakeData = z.infer<typeof preIntakeSchema>;

// Step 2: Personal Identity (aligned with createTenantSchema + tenantProfileSchema)
const personalIdentitySchema = z.object({
  // Core fields (required for tenant creation)
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  email: z.string().email('Valid email required').or(z.literal('')).optional(),
  phone: z.string().optional(),
  
  // Extended profile fields
  title: z.string().optional(),
  nationality: z.string().optional(),
  languagesSpoken: z.string().optional(), // Comma-separated string
  nationalInsuranceNumber: z.string().optional(),
  maritalStatus: z.string().optional(),
  previousAddress: z.string().optional(),
  placeOfBirth: z.string().optional(),
});

type PersonalIdentityData = z.infer<typeof personalIdentitySchema>;

// Step 3: Diversity & Communication (aligned with tenantProfileSchema)
const diversitySchema = z.object({
  ethnicity: z.preprocess(
    (val) => (!val || val === '' || val === null) ? undefined : val,
    z.enum([
      'WHITE_BRITISH', 'WHITE_IRISH', 'WHITE_OTHER',
      'MIXED_WHITE_BLACK_CARIBBEAN', 'MIXED_WHITE_BLACK_AFRICAN', 'MIXED_WHITE_ASIAN', 'MIXED_OTHER',
      'ASIAN_INDIAN', 'ASIAN_PAKISTANI', 'ASIAN_BANGLADESHI', 'ASIAN_OTHER',
      'BLACK_AFRICAN', 'BLACK_CARIBBEAN', 'BLACK_OTHER',
      'CHINESE', 'OTHER', 'PREFER_NOT_TO_SAY'
    ]).optional()
  ),
  religion: z.preprocess(
    (val) => (!val || val === '' || val === null) ? undefined : val,
    z.enum([
      'CHRISTIAN', 'MUSLIM', 'HINDU', 'SIKH', 'JEWISH', 'BUDDHIST',
      'NO_RELIGION', 'OTHER', 'PREFER_NOT_TO_SAY'
    ]).optional()
  ),
  sexualOrientation: z.preprocess(
    (val) => (!val || val === '' || val === null) ? undefined : val,
    z.enum([
      'HETEROSEXUAL', 'HOMOSEXUAL', 'LESBIAN', 'BISEXUAL', 'TRANSGENDER', 'OTHER', 'PREFER_NOT_TO_SAY'
    ]).optional()
  ),
  disabilities: z.string().optional(),
  communicationNeeds: z.string().optional(),
});

type DiversityData = z.infer<typeof diversitySchema>;

// Step 4: Health & Medical (aligned with riskAssessmentSchema)
const healthSchema = z.object({
  hasMentalHealth: z.boolean().default(false),
  mentalHealthDetails: z.string().optional(),
  mentalHealthDiagnosis: z.string().optional(),
  prescribedMedication: z.string().optional(),
  doctorName: z.string().optional(),
  doctorPhone: z.string().optional(),
  gpPractice: z.string().optional(),
  cpnName: z.string().optional(),
  cpnPhone: z.string().optional(),
  psychiatristName: z.string().optional(),
  psychiatristPhone: z.string().optional(),
});

type HealthData = z.infer<typeof healthSchema>;

// Step 5: Risk & Safeguarding (aligned with riskAssessmentSchema)
const riskAssessmentSchema = z.object({
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
  hasSocialWorker: z.boolean().default(false),
  socialWorkerDetails: z.string().optional(),
  hasProbationOfficer: z.boolean().default(false),
  probationOfficerName: z.string().optional(),
  probationOfficerPhone: z.string().optional(),
  probationDetails: z.string().optional(),
  riskNotes: z.string().optional(),
});

type RiskAssessmentData = z.infer<typeof riskAssessmentSchema>;

// Step 6: Financial Status (aligned with financeSchema)
const financialSchema = z.object({
  incomeSource: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.enum([
      'ESA', 'DLA', 'JSA', 'UNIVERSAL_CREDIT', 'HOUSING_BENEFIT', 'NIL_INCOME', 'EMPLOYMENT', 'OTHER'
    ], { errorMap: () => ({ message: 'Please select a valid income source from the dropdown' }) }).optional()
  ),
  benefitType: z.string().optional(),
  benefitAmount: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? undefined : val,
    z.coerce.number().positive().optional()
  ),
  benefitFrequency: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.enum(['WEEKLY', 'FORTNIGHTLY', 'MONTHLY'], { errorMap: () => ({ message: 'Please select a valid payment frequency' }) }).optional()
  ),
  hasNilIncome: z.boolean().default(false),
  nilIncomeExplanation: z.string().optional(),
  councilAuthorizationAgreed: z.boolean().default(false),
  employmentDetails: z.string().optional(),
  debtDetails: z.string().optional(),
});

type FinancialData = z.infer<typeof financialSchema>;

// Step 7: Housing Allocation (aligned with createTenancySchema)
const housingAllocationSchema = z.object({
  propertyId: z.string().min(1, 'Property selection is required'),
  roomId: z.string().min(1, 'Room selection is required'),
  startDate: z.string().min(1, 'Move-in date is required'),
  serviceChargeAmount: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? undefined : val,
    z.coerce.number().min(0, 'Service charge cannot be negative').max(1000, 'Service charge cannot exceed £1000').optional()
  ),
});

type HousingAllocationData = z.infer<typeof housingAllocationSchema>;

// Step 8: Support Framework (aligned with supportPlanSchema)
const supportFrameworkSchema = z.object({
  supportNeeds: z.string().optional(),
  supportGoals: z.string().optional(),
  budgetPlanAgreed: z.boolean().default(false),
  employmentSupport: z.boolean().default(false),
  lifeSkillsSupport: z.boolean().default(false),
  healthSupport: z.boolean().default(false),
  reviewFrequency: z.string().optional(),
  nextReviewDate: z.string().optional(),
  supportWorkerNotes: z.string().optional(),
});

type SupportFrameworkData = z.infer<typeof supportFrameworkSchema>;

// Step 9: Legal Agreements (aligned with consentSchema)
const legalAgreementsSchema = z.object({
  authorizationFormSigned: z.boolean().default(false),
  authorizationFormSignature: z.string().optional(),
  confidentialityWaiverSigned: z.boolean().default(false),
  confidentialityWaiverSignature: z.string().optional(),
  fireEvacuationAcknowledged: z.boolean().default(false),
  fireEvacuationSignature: z.string().optional(),
  licenceAgreementSigned: z.boolean().default(false),
  licenceAgreementSignature: z.string().optional(),
  serviceChargeAgreementSigned: z.boolean().default(false),
  serviceChargeAgreementSignature: z.string().optional(),
  supportAgreementSigned: z.boolean().default(false),
  supportAgreementSignature: z.string().optional(),
});

type LegalAgreementsData = z.infer<typeof legalAgreementsSchema>;

// Step 10: Document Uploads (handled separately, not via form)
enum DocumentType {
  PROOF_OF_ID = 'PROOF_OF_ID',
  PROOF_OF_INCOME = 'PROOF_OF_INCOME',
}

interface UploadedDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY = 'tenant-onboarding-draft';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

const REFERRAL_SOURCES = [
  'Local Authority',
  'Housing Association',
  'Probation Service',
  'Mental Health Services',
  'Drug & Alcohol Services',
  'Self-Referral',
  'Other',
];

const NATIONALITIES = [
  'British',
  'Irish',
  'Other EU',
  'African',
  'Asian',
  'Caribbean',
  'Middle Eastern',
  'Other',
];

const MARITAL_STATUS_OPTIONS = [
  'SINGLE',
  'MARRIED',
  'CIVIL_PARTNERSHIP',
  'DIVORCED',
  'WIDOWED',
  'SEPARATED',
  'PREFER_NOT_TO_SAY',
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Helper function to create Select onValueChange handler with setValue
const createSelectHandler = <T extends Record<string, any>>(
  form: UseFormReturn<T>,
  fieldName: Path<T>,
  transform?: (value: string) => any
) => {
  return (value: string) => {
    const transformedValue = transform ? transform(value) : value;
    form.setValue(fieldName, transformedValue, { shouldValidate: true, shouldDirty: true });
  };
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TenantOnboardingV2() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [tenantId, setTenantId] = useState<string | null>(null); // Track created tenant
  const [showAgeWarning, setShowAgeWarning] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false); // Track hydration completion for autosave
  const [preIntakeData, setPreIntakeData] = useState<PreIntakeData>({
    referralSource: '',
    referralDate: '',
    isEmergencyAdmission: false,
    eligibilityConfirmed: false,
  });

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    
    // Parse date in local timezone to avoid UTC issues
    const [year, month, day] = dateOfBirth.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // If birthday hasn't occurred yet this year, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // ============================================================
  // STEP 1: PRE-INTAKE FORM
  // ============================================================

  const preIntakeForm = useForm<PreIntakeData>({
    resolver: zodResolver(preIntakeSchema),
    defaultValues: preIntakeData,
  });

  // ============================================================
  // STEP 2: PERSONAL IDENTITY FORM
  // ============================================================

  const personalIdentityForm = useForm<PersonalIdentityData>({
    resolver: zodResolver(personalIdentitySchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      title: '',
      nationality: '',
      languagesSpoken: '',
      nationalInsuranceNumber: '',
      maritalStatus: '',
      previousAddress: '',
      placeOfBirth: '',
    },
  });

  // ============================================================
  // CREATE TENANT MUTATION (For Step 2 submission)
  // ============================================================

  const createTenantMutation = useMutation({
    mutationFn: async (data: PersonalIdentityData) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        email: data.email || undefined,
        phone: data.phone || undefined,
        nationalId: data.nationalInsuranceNumber || undefined,
        title: data.title || undefined,
        nationality: data.nationality || undefined,
        languagesSpoken: data.languagesSpoken || undefined,
        previousAddress: data.previousAddress || undefined,
      };
      
      const response = await apiRequest('POST', '/api/tenants', payload);
      return response.json();
    },
    onSuccess: (response) => {
      // Capture the created tenant ID
      const createdTenant = response.tenant || response;
      setTenantId(createdTenant.id);
      
      toast({
        title: 'Tenant Created',
        description: 'Basic tenant profile has been created. Continue with additional details.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      
      // Navigate to Step 3 (Diversity & Communication)
      setStep(3);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tenant',
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // STEP 3: DIVERSITY & COMMUNICATION FORM
  // ============================================================

  const diversityForm = useForm<DiversityData>({
    resolver: zodResolver(diversitySchema),
    defaultValues: {
      ethnicity: null as any,
      religion: null as any,
      sexualOrientation: null as any,
      disabilities: '',
      communicationNeeds: '',
    },
  });

  const updateDiversityMutation = useMutation({
    mutationFn: async (data: DiversityData) => {
      if (!tenantId) throw new Error('No tenant ID');
      const response = await apiRequest('PUT', `/api/tenants/${tenantId}/profile`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Saved',
        description: 'Diversity information has been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      setStep(4);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // STEP 4: HEALTH & MEDICAL FORM
  // ============================================================

  const healthForm = useForm<HealthData>({
    resolver: zodResolver(healthSchema),
    defaultValues: {
      hasMentalHealth: false,
      mentalHealthDetails: '',
      mentalHealthDiagnosis: '',
      prescribedMedication: '',
      doctorName: '',
      doctorPhone: '',
      gpPractice: '',
      cpnName: '',
      cpnPhone: '',
      psychiatristName: '',
      psychiatristPhone: '',
    },
  });

  // Step 4 doesn't submit - health data is combined with risk data in Step 5
  // This is because health fields are part of riskAssessmentSchema in the backend

  // ============================================================
  // STEP 5: RISK & SAFEGUARDING FORM
  // ============================================================

  const riskAssessmentForm = useForm<RiskAssessmentData>({
    resolver: zodResolver(riskAssessmentSchema),
    mode: 'onChange',
    defaultValues: {
      hasCriminalRecord: false,
      criminalRecordDetails: '',
      hasDrugUse: false,
      drugUseDetails: '',
      hasAlcoholIssue: false,
      alcoholDetails: '',
      hasSuicidalThoughts: false,
      suicidalThoughtsDetails: '',
      hasSelfHarmHistory: false,
      selfHarmDetails: '',
      hasSocialWorker: false,
      socialWorkerDetails: '',
      hasProbationOfficer: false,
      probationOfficerName: '',
      probationOfficerPhone: '',
      probationDetails: '',
      riskNotes: '',
    },
  });

  const createRiskAssessmentMutation = useMutation({
    mutationFn: async (data: RiskAssessmentData) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      // Combine health data from Step 4 with risk data from Step 5
      const healthData = healthForm.getValues();
      const combinedData = {
        ...healthData,
        ...data,
      };
      
      const response = await apiRequest('PUT', `/api/tenants/${tenantId}/risk-assessment`, combinedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Saved',
        description: 'Risk assessment and health information have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      setStep(6);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // STEP 6: FINANCIAL STATUS FORM
  // ============================================================

  const financialForm = useForm<FinancialData>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      incomeSource: null as any,
      benefitType: '',
      benefitAmount: undefined,
      benefitFrequency: null as any,
      hasNilIncome: false,
      nilIncomeExplanation: '',
      councilAuthorizationAgreed: false,
      employmentDetails: '',
      debtDetails: '',
    },
  });

  const createFinancialDeclarationMutation = useMutation({
    mutationFn: async (data: FinancialData) => {
      if (!tenantId) throw new Error('No tenant ID');
      const response = await apiRequest('PUT', `/api/tenants/${tenantId}/finance`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Saved',
        description: 'Financial information has been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      setStep(7);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // STEP 7: HOUSING ALLOCATION FORM
  // ============================================================

  const housingAllocationForm = useForm<HousingAllocationData>({
    resolver: zodResolver(housingAllocationSchema),
    defaultValues: {
      propertyId: '',
      roomId: '',
      startDate: '',
      serviceChargeAmount: undefined,
    },
  });

  // Fetch properties with rooms for selection
  const { data: propertiesData } = useQuery<{ properties: any[] }>({
    queryKey: ['/api/properties'],
    enabled: step >= 7, // Fetch when on Step 7 and beyond to support summary displays
  });

  const selectedPropertyId = housingAllocationForm.watch('propertyId');
  const availableRooms = propertiesData?.properties?.find((p: any) => String(p.id) === String(selectedPropertyId))?.rooms || [];

  const createTenancyMutation = useMutation({
    mutationFn: async (data: HousingAllocationData) => {
      if (!tenantId) throw new Error('No tenant ID');
      const payload = {
        tenantId,
        roomId: data.roomId,
        startDate: data.startDate,
        serviceChargeAmount: data.serviceChargeAmount,
      };
      const response = await apiRequest('POST', `/api/tenants/${tenantId}/tenancies`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Saved',
        description: 'Housing allocation has been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      setStep(8);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // STEP 8: SUPPORT FRAMEWORK FORM
  // ============================================================

  const supportFrameworkForm = useForm<SupportFrameworkData>({
    resolver: zodResolver(supportFrameworkSchema),
    defaultValues: {
      supportNeeds: '',
      supportGoals: '',
      budgetPlanAgreed: false,
      employmentSupport: false,
      lifeSkillsSupport: false,
      healthSupport: false,
      reviewFrequency: '',
      nextReviewDate: '',
      supportWorkerNotes: '',
    },
  });

  const createSupportPlanMutation = useMutation({
    mutationFn: async (data: SupportFrameworkData) => {
      if (!tenantId) throw new Error('No tenant ID');
      const response = await apiRequest('PUT', `/api/tenants/${tenantId}/support-plan`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Saved',
        description: 'Support framework has been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      setStep(9);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // STEP 9: LEGAL AGREEMENTS FORM
  // ============================================================

  const legalAgreementsForm = useForm<LegalAgreementsData>({
    resolver: zodResolver(legalAgreementsSchema),
    defaultValues: {
      authorizationFormSigned: false,
      authorizationFormSignature: '',
      confidentialityWaiverSigned: false,
      confidentialityWaiverSignature: '',
      fireEvacuationAcknowledged: false,
      fireEvacuationSignature: '',
      licenceAgreementSigned: false,
      licenceAgreementSignature: '',
      serviceChargeAgreementSigned: false,
      serviceChargeAgreementSignature: '',
      supportAgreementSigned: false,
      supportAgreementSignature: '',
    },
  });

  const createConsentsMutation = useMutation({
    mutationFn: async (data: LegalAgreementsData) => {
      if (!tenantId) throw new Error('No tenant ID');
      const response = await apiRequest('PUT', `/api/tenants/${tenantId}/consents`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Saved',
        description: 'Legal agreements have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      setStep(10);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // STEP 10: DOCUMENT UPLOADS
  // ============================================================

  // Track uploading state for each document type
  const [uploadingProofOfId, setUploadingProofOfId] = useState(false);
  const [uploadingProofOfIncome, setUploadingProofOfIncome] = useState(false);

  // Fetch existing documents for this tenant
  const { data: documentsData, refetch: refetchDocuments } = useQuery<{ documents: UploadedDocument[] }>({
    queryKey: ['/api/documents', tenantId],
    enabled: !!tenantId && step >= 10,
  });

  // Find uploaded documents by type
  const proofOfIdDoc = documentsData?.documents?.find((doc) => doc.type === 'PROOF_OF_ID');
  const proofOfIncomeDoc = documentsData?.documents?.find((doc) => doc.type === 'PROOF_OF_INCOME');

  // Check if both mandatory documents are uploaded
  const documentsComplete = !!proofOfIdDoc && !!proofOfIncomeDoc;

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: DocumentType }) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('isMandatory', 'false');

      const response = await fetch(`/api/documents/${tenantId}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const docTypeName = variables.type === DocumentType.PROOF_OF_ID ? 'Proof of ID' : 'Proof of Income';
      toast({
        title: 'Upload Successful',
        description: `${docTypeName} has been uploaded successfully.`,
      });
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ['/api/documents', tenantId] });
      refetchDocuments();
    },
    onError: (error: any, variables) => {
      const docTypeName = variables.type === DocumentType.PROOF_OF_ID ? 'Proof of ID' : 'Proof of Income';
      toast({
        title: 'Upload Failed',
        description: error.message || `Failed to upload ${docTypeName}`,
        variant: 'destructive',
      });
    },
  });

  // Handle file selection for Proof of ID
  const handleProofOfIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be under 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only PDF, JPG, PNG, DOC, and DOCX files are allowed',
        variant: 'destructive',
      });
      return;
    }

    setUploadingProofOfId(true);
    try {
      await uploadDocumentMutation.mutateAsync({ file, type: DocumentType.PROOF_OF_ID });
    } finally {
      setUploadingProofOfId(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Handle file selection for Proof of Income
  const handleProofOfIncomeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be under 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only PDF, JPG, PNG, DOC, and DOCX files are allowed',
        variant: 'destructive',
      });
      return;
    }

    setUploadingProofOfIncome(true);
    try {
      await uploadDocumentMutation.mutateAsync({ file, type: DocumentType.PROOF_OF_INCOME });
    } finally {
      setUploadingProofOfIncome(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // ============================================================
  // AUTOSAVE TO LOCALSTORAGE
  // ============================================================

  useEffect(() => {
    // Only start autosave after hydration is complete to prevent overwriting draft during validation
    if (!isHydrated) {
      return;
    }

    const saveInterval = setInterval(() => {
      const diversityValues = diversityForm.getValues();
      console.log('DEBUG: diversityForm.getValues() returned:', diversityValues);
      console.log('DEBUG: sexualOrientation specifically:', diversityValues.sexualOrientation);
      
      const housingAllocationValues = housingAllocationForm.getValues();
      console.log('DEBUG: housingAllocationForm.getValues() returned:', housingAllocationValues);
      console.log('DEBUG: serviceChargeAmount type:', typeof housingAllocationValues.serviceChargeAmount, 'value:', housingAllocationValues.serviceChargeAmount);
      
      // Normalize serviceChargeAmount before saving to prevent invalid types
      const normalizedHousingAllocation = {
        ...housingAllocationValues,
        serviceChargeAmount: 
          typeof housingAllocationValues.serviceChargeAmount === 'number'
            ? housingAllocationValues.serviceChargeAmount
            : typeof housingAllocationValues.serviceChargeAmount === 'string' && housingAllocationValues.serviceChargeAmount !== ''
              ? parseFloat(housingAllocationValues.serviceChargeAmount)
              : undefined,
      };
      
      const draftData = {
        step,
        tenantId, // Save tenant ID
        preIntake: preIntakeForm.getValues(),
        personalIdentity: personalIdentityForm.getValues(),
        diversity: diversityValues,
        health: healthForm.getValues(),
        riskAssessment: riskAssessmentForm.getValues(),
        financial: financialForm.getValues(),
        housingAllocation: normalizedHousingAllocation,
        supportFramework: supportFrameworkForm.getValues(),
        legalAgreements: legalAgreementsForm.getValues(),
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      console.log('Autosaved to localStorage:', draftData);
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(saveInterval);
  }, [isHydrated, step, tenantId, preIntakeForm, personalIdentityForm, diversityForm, healthForm, riskAssessmentForm, financialForm, housingAllocationForm, supportFrameworkForm, legalAgreementsForm]);

  // Helper function to normalize string fields (convert non-strings to empty strings)
  const normalizeStringFields = <T extends Record<string, any>>(
    data: T,
    stringFields: (keyof T)[]
  ): T => {
    const normalized = { ...data };
    for (const field of stringFields) {
      const value = normalized[field];
      if (typeof value !== 'string') {
        normalized[field] = '' as any;
      }
    }
    return normalized;
  };

  // Ref to ensure localStorage draft is only loaded ONCE on mount
  const hasHydratedRef = useRef(false);

  // Load draft data on mount (ONLY ONCE) with validation
  useEffect(() => {
    // Guard: Only hydrate once to prevent form resets on every render
    if (hasHydratedRef.current) {
      return;
    }

    const draftJson = localStorage.getItem(STORAGE_KEY);
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson);
        
        // If draft has a tenant ID, validate it exists before restoring
        if (draft.tenantId) {
          // Validate tenant exists
          apiRequest('GET', `/api/tenants/${draft.tenantId}`)
            .then(response => {
              // Check if request succeeded (tenant exists)
              if (response.ok) {
                return response.json();
              } else if (response.status === 404) {
                // Tenant not found - this is the only case where we clear draft
                throw new Error('TENANT_NOT_FOUND');
              } else {
                // Other errors (401, 500, etc) - preserve draft, just don't restore yet
                throw new Error('VALIDATION_ERROR');
              }
            })
            .then(() => {
              // Tenant exists, safe to restore draft
              restoreDraft(draft);
            })
            .catch((error) => {
              if (error.message === 'TENANT_NOT_FOUND') {
                // Only clear draft when tenant is truly missing (404)
                localStorage.removeItem(STORAGE_KEY);
                toast({
                  title: 'Draft Cleared',
                  description: 'Previous draft data no longer valid. Starting fresh.',
                });
                hasHydratedRef.current = true;
                setIsHydrated(true);
              } else {
                // For other errors (network, auth, server), restore draft anyway with warning
                // This prevents autosave from overwriting the draft with blank data
                toast({
                  title: 'Draft Restored (Unverified)',
                  description: 'Could not verify tenant data. Progress restored but may be outdated.',
                  variant: 'destructive',
                });
                restoreDraft(draft); // This will set hasHydratedRef internally
              }
            });
        } else {
          // No tenant ID yet (Step 1 or 2), safe to restore
          restoreDraft(draft);
          hasHydratedRef.current = true;
          setIsHydrated(true);
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
        hasHydratedRef.current = true;
        setIsHydrated(true);
      }
    } else {
      // No draft data found, mark as hydrated anyway to prevent checking again
      hasHydratedRef.current = true;
      setIsHydrated(true);
    }
  }, []);

  // Helper function to restore draft data
  const restoreDraft = (draft: any) => {
    try {
      // Restore step (validate it's within range 1-11)
      if (draft.step && draft.step >= 1 && draft.step <= 11) {
        setStep(draft.step);
      }
      
      // Restore tenant ID if present
      if (draft.tenantId) {
        setTenantId(draft.tenantId);
      }
      
      // Restore form data with normalization
      if (draft.preIntake) {
        preIntakeForm.reset(draft.preIntake);
        setPreIntakeData(draft.preIntake);
      }
      if (draft.personalIdentity) {
        personalIdentityForm.reset(draft.personalIdentity);
      }
      if (draft.diversity) {
        const normalized = normalizeStringFields(draft.diversity, ['disabilities', 'communicationNeeds']);
        diversityForm.reset(normalized);
      }
      if (draft.health) {
        const normalized = normalizeStringFields(draft.health, [
          'mentalHealthDetails',
          'mentalHealthDiagnosis',
          'prescribedMedication',
          'doctorName',
          'doctorPhone',
          'gpPractice',
          'cpnName',
          'cpnPhone',
          'psychiatristName',
          'psychiatristPhone',
        ]);
        healthForm.reset(normalized);
      }
      if (draft.riskAssessment) {
        const normalized = normalizeStringFields(draft.riskAssessment, [
          'criminalRecordDetails',
          'drugUseDetails',
          'alcoholDetails',
          'suicidalThoughtsDetails',
          'selfHarmDetails',
          'socialWorkerDetails',
          'probationOfficerName',
          'probationOfficerPhone',
          'probationDetails',
          'riskNotes',
        ]);
        riskAssessmentForm.reset(normalized);
        console.log('DEBUG: Hydrated riskAssessment from localStorage:', normalized);
      }
      if (draft.financial) {
        financialForm.reset(draft.financial);
      }
      if (draft.housingAllocation) {
        // Normalize serviceChargeAmount to prevent boolean/invalid type contamination
        const normalizedHousingAllocation = {
          ...draft.housingAllocation,
          serviceChargeAmount: 
            typeof draft.housingAllocation.serviceChargeAmount === 'number'
              ? draft.housingAllocation.serviceChargeAmount
              : typeof draft.housingAllocation.serviceChargeAmount === 'string' && draft.housingAllocation.serviceChargeAmount !== ''
                ? parseFloat(draft.housingAllocation.serviceChargeAmount)
                : undefined,
        };
        console.log('DEBUG: Hydrating housingAllocation from localStorage:', draft.housingAllocation);
        console.log('DEBUG: Normalized housingAllocation:', normalizedHousingAllocation);
        housingAllocationForm.reset(normalizedHousingAllocation);
      }
      if (draft.supportFramework && !supportFrameworkForm.formState.isDirty) {
        supportFrameworkForm.reset(draft.supportFramework);
      }
      if (draft.legalAgreements) {
        legalAgreementsForm.reset(draft.legalAgreements);
      }
      
      toast({
        title: 'Draft Restored',
        description: `Restored progress from ${new Date(draft.lastSaved).toLocaleString()}`,
      });
      
      // Mark as hydrated to prevent repeated resets
      hasHydratedRef.current = true;
      setIsHydrated(true);
    } catch (e) {
      console.error('Failed to restore draft:', e);
      hasHydratedRef.current = true;
      setIsHydrated(true);
    }
  };

  // ============================================================
  // NAVIGATION HANDLERS
  // ============================================================

  const handleStep1Submit = (data: PreIntakeData) => {
    setPreIntakeData(data);
    setStep(2);
  };

  const handleStep2Submit = async (data: PersonalIdentityData) => {
    await createTenantMutation.mutateAsync(data);
  };

  const handleStep3Submit = async (data: DiversityData) => {
    await updateDiversityMutation.mutateAsync(data);
  };

  const handleStep4Submit = async (data: HealthData) => {
    // Step 4 doesn't submit to API - just advances to next step
    // Health data will be combined with risk data in Step 5
    setStep(5);
  };

  const handleStep5Submit = async (data: RiskAssessmentData) => {
    await createRiskAssessmentMutation.mutateAsync(data);
  };

  const handleStep6Submit = async (data: FinancialData) => {
    await createFinancialDeclarationMutation.mutateAsync(data);
  };

  const handleStep7Submit = async (data: HousingAllocationData) => {
    await createTenancyMutation.mutateAsync(data);
  };

  const handleStep8Submit = async (data: SupportFrameworkData) => {
    await createSupportPlanMutation.mutateAsync(data);
  };

  const handleStep9Submit = async (data: LegalAgreementsData) => {
    await createConsentsMutation.mutateAsync(data);
  };

  const handleStep10Submit = () => {
    // Step 10 doesn't have a form submission - documents are uploaded immediately
    // Documents are now optional - tenants can upload later if needed
    setStep(11);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleClearDraft = () => {
    // Clear localStorage
    localStorage.removeItem('tenantOnboardingDraft');
    
    // Reset all forms to explicit empty defaults
    preIntakeForm.reset({
      referralSource: '',
      referralDate: '',
      isEmergencyAdmission: false,
      eligibilityConfirmed: false,
    });
    
    personalIdentityForm.reset({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      title: '',
      nationality: '',
      languagesSpoken: '',
      nationalInsuranceNumber: '',
      maritalStatus: '',
      previousAddress: '',
      placeOfBirth: '',
    });
    
    diversityForm.reset({
      ethnicity: null as any,
      religion: null as any,
      sexualOrientation: null as any,
      disabilities: '',
      communicationNeeds: '',
    });
    
    healthForm.reset({
      hasMentalHealth: false,
      mentalHealthDetails: '',
      mentalHealthDiagnosis: '',
      prescribedMedication: '',
      doctorName: '',
      doctorPhone: '',
      gpPractice: '',
      cpnName: '',
      cpnPhone: '',
      psychiatristName: '',
      psychiatristPhone: '',
    });
    
    riskAssessmentForm.reset({
      hasCriminalRecord: false,
      criminalRecordDetails: '',
      hasDrugUse: false,
      drugUseDetails: '',
      hasAlcoholIssue: false,
      alcoholDetails: '',
      hasSuicidalThoughts: false,
      suicidalThoughtsDetails: '',
      hasSelfHarmHistory: false,
      selfHarmDetails: '',
      hasSocialWorker: false,
      socialWorkerDetails: '',
      hasProbationOfficer: false,
      probationOfficerName: '',
      probationOfficerPhone: '',
      probationDetails: '',
      riskNotes: '',
    });
    
    financialForm.reset({
      incomeSource: null as any,
      benefitType: '',
      benefitAmount: undefined,
      benefitFrequency: null as any,
      hasNilIncome: false,
      nilIncomeExplanation: '',
      councilAuthorizationAgreed: false,
      employmentDetails: '',
      debtDetails: '',
    });
    
    housingAllocationForm.reset({
      propertyId: '',
      roomId: '',
      startDate: '',
      serviceChargeAmount: undefined,
    });
    
    supportFrameworkForm.reset({
      supportNeeds: '',
      supportGoals: '',
      budgetPlanAgreed: false,
      employmentSupport: false,
      lifeSkillsSupport: false,
      healthSupport: false,
      reviewFrequency: '',
      nextReviewDate: '',
      supportWorkerNotes: '',
    });
    
    legalAgreementsForm.reset({
      authorizationFormSigned: false,
      authorizationFormSignature: '',
      confidentialityWaiverSigned: false,
      confidentialityWaiverSignature: '',
      fireEvacuationAcknowledged: false,
      fireEvacuationSignature: '',
      licenceAgreementSigned: false,
      licenceAgreementSignature: '',
      serviceChargeAgreementSigned: false,
      serviceChargeAgreementSignature: '',
      supportAgreementSigned: false,
      supportAgreementSignature: '',
    });
    
    // Reset state
    setStep(1);
    setTenantId(null);
    setPreIntakeData({
      referralSource: '',
      referralDate: '',
      isEmergencyAdmission: false,
      eligibilityConfirmed: false,
    });
    
    // Show confirmation
    toast({
      title: 'Draft Cleared',
      description: 'All form data has been cleared. Starting fresh from Step 1.',
    });
  };

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  const renderProgressBar = () => {
    const totalSteps = 11;
    // Progress represents completed steps, so step 1 = 0% complete, step 11 = 91% complete
    const progress = ((step - 1) / totalSteps) * 100;

    return (
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Intake Assessment</CardTitle>
        <CardDescription>Referral information and eligibility confirmation</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...preIntakeForm}>
          <form onSubmit={preIntakeForm.handleSubmit(handleStep1Submit)} className="space-y-6">
            <FormField
              control={preIntakeForm.control}
              name="referralSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Source *</FormLabel>
                  <Select onValueChange={createSelectHandler(preIntakeForm, 'referralSource')} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-referral-source">
                        <SelectValue placeholder="Select referral source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REFERRAL_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={preIntakeForm.control}
              name="referralDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-referral-date"
                      max={new Date().toISOString().split('T')[0]}
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={preIntakeForm.control}
              name="isEmergencyAdmission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      data-testid="checkbox-emergency-admission"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const boolValue = checked === true;
                        preIntakeForm.setValue('isEmergencyAdmission', boolValue, { shouldValidate: true, shouldDirty: true });
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Emergency Admission</FormLabel>
                    <FormDescription>
                      Check if this is an emergency admission requiring immediate accommodation
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={preIntakeForm.control}
              name="eligibilityConfirmed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      data-testid="checkbox-eligibility-confirmed"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const boolValue = checked === true;
                        preIntakeForm.setValue('eligibilityConfirmed', boolValue, { shouldValidate: true, shouldDirty: true });
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Eligibility Confirmed *</FormLabel>
                    <FormDescription>
                      Confirm that the applicant meets eligibility criteria for supported housing
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" data-testid="button-next">
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Personal Identity</CardTitle>
        <CardDescription>Core personal details and identity information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...personalIdentityForm}>
          <form onSubmit={personalIdentityForm.handleSubmit(handleStep2Submit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={personalIdentityForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <Select onValueChange={createSelectHandler(personalIdentityForm, 'title')} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-title">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Miss">Miss</SelectItem>
                        <SelectItem value="Mx">Mx</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalIdentityForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-first-name"
                        placeholder="First name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalIdentityForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-last-name"
                        placeholder="Last name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={personalIdentityForm.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-date-of-birth"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const age = calculateAge(e.target.value);
                          if (age < 18) {
                            setShowAgeWarning(true);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalIdentityForm.control}
                name="nationalInsuranceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National Insurance Number</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-ni-number"
                        placeholder="QQ 12 34 56 A"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={personalIdentityForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        data-testid="input-email"
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalIdentityForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-phone"
                        placeholder="07XXX XXXXXX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={personalIdentityForm.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <Select onValueChange={createSelectHandler(personalIdentityForm, 'nationality')} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-nationality">
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NATIONALITIES.map((nat) => (
                          <SelectItem key={nat} value={nat}>
                            {nat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalIdentityForm.control}
                name="languagesSpoken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages Spoken</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-languages-spoken"
                        placeholder="e.g., English, Polish, Urdu"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Separate multiple languages with commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={personalIdentityForm.control}
                name="placeOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place of Birth</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-place-of-birth"
                        placeholder="City, Country"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalIdentityForm.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={createSelectHandler(personalIdentityForm, 'maritalStatus')} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-marital-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARITAL_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={personalIdentityForm.control}
              name="previousAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Address</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="textarea-previous-address"
                      placeholder="Full address including postcode"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>

              <Button
                type="submit"
                data-testid="button-submit-step2"
                disabled={createTenantMutation.isPending}
              >
                {createTenantMutation.isPending ? (
                  'Creating...'
                ) : (
                  <>
                    Create Tenant & Continue
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Diversity & Communication</CardTitle>
        <CardDescription>Equality monitoring and accessibility needs</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...diversityForm}>
          <form onSubmit={diversityForm.handleSubmit(handleStep3Submit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={diversityForm.control}
                name="ethnicity"
                render={({ field }) => {
                  // Validate that field.value is a valid enum value, otherwise use undefined
                  const validValues = [
                    'WHITE_BRITISH', 'WHITE_IRISH', 'WHITE_OTHER',
                    'MIXED_WHITE_BLACK_CARIBBEAN', 'MIXED_WHITE_BLACK_AFRICAN', 'MIXED_WHITE_ASIAN', 'MIXED_OTHER',
                    'ASIAN_INDIAN', 'ASIAN_PAKISTANI', 'ASIAN_BANGLADESHI', 'ASIAN_OTHER',
                    'BLACK_AFRICAN', 'BLACK_CARIBBEAN', 'BLACK_OTHER',
                    'CHINESE', 'OTHER', 'PREFER_NOT_TO_SAY'
                  ];
                  const safeValue = (field.value && validValues.includes(field.value)) ? field.value : undefined;
                  
                  return (
                    <FormItem>
                      <FormLabel>Ethnicity</FormLabel>
                      <Select 
                        onValueChange={createSelectHandler(diversityForm, 'ethnicity')} 
                        value={safeValue}
                      >
                        <SelectTrigger data-testid="select-ethnicity">
                          <SelectValue placeholder="Select ethnicity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WHITE_BRITISH">White British</SelectItem>
                          <SelectItem value="WHITE_IRISH">White Irish</SelectItem>
                          <SelectItem value="WHITE_OTHER">White Other</SelectItem>
                          <SelectItem value="MIXED_WHITE_BLACK_CARIBBEAN">Mixed White/Black Caribbean</SelectItem>
                          <SelectItem value="MIXED_WHITE_BLACK_AFRICAN">Mixed White/Black African</SelectItem>
                          <SelectItem value="MIXED_WHITE_ASIAN">Mixed White/Asian</SelectItem>
                          <SelectItem value="MIXED_OTHER">Mixed Other</SelectItem>
                          <SelectItem value="ASIAN_INDIAN">Asian Indian</SelectItem>
                          <SelectItem value="ASIAN_PAKISTANI">Asian Pakistani</SelectItem>
                          <SelectItem value="ASIAN_BANGLADESHI">Asian Bangladeshi</SelectItem>
                          <SelectItem value="ASIAN_OTHER">Asian Other</SelectItem>
                          <SelectItem value="BLACK_AFRICAN">Black African</SelectItem>
                          <SelectItem value="BLACK_CARIBBEAN">Black Caribbean</SelectItem>
                          <SelectItem value="BLACK_OTHER">Black Other</SelectItem>
                          <SelectItem value="CHINESE">Chinese</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={diversityForm.control}
                name="religion"
                render={({ field }) => {
                  // Validate that field.value is a valid enum value, otherwise use undefined
                  const validValues = ['CHRISTIAN', 'MUSLIM', 'HINDU', 'SIKH', 'JEWISH', 'BUDDHIST', 'NO_RELIGION', 'OTHER', 'PREFER_NOT_TO_SAY'];
                  const safeValue = (field.value && validValues.includes(field.value)) ? field.value : undefined;
                  
                  return (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <Select 
                        onValueChange={createSelectHandler(diversityForm, 'religion')} 
                        value={safeValue}
                      >
                        <SelectTrigger data-testid="select-religion">
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHRISTIAN">Christian</SelectItem>
                          <SelectItem value="MUSLIM">Muslim</SelectItem>
                          <SelectItem value="HINDU">Hindu</SelectItem>
                          <SelectItem value="SIKH">Sikh</SelectItem>
                          <SelectItem value="JEWISH">Jewish</SelectItem>
                          <SelectItem value="BUDDHIST">Buddhist</SelectItem>
                          <SelectItem value="NO_RELIGION">No religion</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={diversityForm.control}
              name="sexualOrientation"
              render={({ field }) => {
                // Validate that field.value is a valid enum value, otherwise use undefined
                const validValues = ['HETEROSEXUAL', 'HOMOSEXUAL', 'LESBIAN', 'BISEXUAL', 'TRANSGENDER', 'OTHER', 'PREFER_NOT_TO_SAY'];
                const safeValue = (field.value && validValues.includes(field.value)) ? field.value : undefined;
                
                return (
                  <FormItem>
                    <FormLabel>Sexual Orientation</FormLabel>
                    <Select 
                      onValueChange={createSelectHandler(diversityForm, 'sexualOrientation')}
                      value={safeValue}
                    >
                      <SelectTrigger data-testid="select-sexual-orientation">
                        <SelectValue placeholder="Select sexual orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HETEROSEXUAL">Heterosexual</SelectItem>
                        <SelectItem value="HOMOSEXUAL">Homosexual</SelectItem>
                        <SelectItem value="LESBIAN">Lesbian</SelectItem>
                        <SelectItem value="BISEXUAL">Bisexual</SelectItem>
                        <SelectItem value="TRANSGENDER">Transgender</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={diversityForm.control}
              name="disabilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disabilities / Additional Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="textarea-disabilities"
                      placeholder="Please describe any disabilities or additional needs"
                      rows={3}
                      {...field}
                      value={typeof field.value === 'string' ? field.value : ''}
                    />
                  </FormControl>
                  <FormDescription>
                    This helps us provide appropriate support and make reasonable adjustments
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={diversityForm.control}
              name="communicationNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="textarea-communication-needs"
                      placeholder="e.g., British Sign Language interpreter, large print documents, etc."
                      rows={3}
                      {...field}
                      value={typeof field.value === 'string' ? field.value : ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Do you need any specific communication support? (e.g., interpreter, written materials)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>

              <Button
                type="submit"
                data-testid="button-next"
                disabled={updateDiversityMutation.isPending}
              >
                {updateDiversityMutation.isPending ? 'Saving...' : 'Next'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => {
    const hasMentalHealth = healthForm.watch('hasMentalHealth');

    return (
      <Card>
        <CardHeader>
          <CardTitle>Health & Medical Information</CardTitle>
          <CardDescription>Medical history and healthcare provider details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...healthForm}>
            <form onSubmit={healthForm.handleSubmit(handleStep4Submit)} className="space-y-6">
              <FormField
                control={healthForm.control}
                name="hasMentalHealth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-mental-health"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          healthForm.setValue('hasMentalHealth', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Mental Health Condition</FormLabel>
                      <FormDescription>
                        Check if the resident has a diagnosed mental health condition
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {hasMentalHealth && (
                <div className="ml-6 p-4 border rounded-md space-y-4">
                  <FormField
                    control={healthForm.control}
                    name="mentalHealthDiagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-mental-health-diagnosis"
                            placeholder="e.g., Depression, Anxiety, Schizophrenia"
                            {...field}
                            value={typeof field.value === 'string' ? field.value : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={healthForm.control}
                    name="mentalHealthDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-mental-health-details"
                            placeholder="Please provide relevant details"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={healthForm.control}
                    name="prescribedMedication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prescribed Medication</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-prescribed-medication"
                            placeholder="List current medications and dosages"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={healthForm.control}
                  name="doctorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GP Name</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-doctor-name"
                          placeholder="Dr. Smith"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={healthForm.control}
                  name="gpPractice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GP Practice</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-gp-practice"
                          placeholder="Practice name"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={healthForm.control}
                name="doctorPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GP Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-doctor-phone"
                        placeholder="01234 567890"
                        {...field}
                        value={typeof field.value === 'string' ? field.value : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={healthForm.control}
                  name="cpnName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPN (Community Psychiatric Nurse)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-cpn-name"
                          placeholder="CPN name"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={healthForm.control}
                  name="cpnPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPN Phone</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-cpn-phone"
                          placeholder="Phone number"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={healthForm.control}
                  name="psychiatristName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Psychiatrist</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-psychiatrist-name"
                          placeholder="Psychiatrist name"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={healthForm.control}
                  name="psychiatristPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Psychiatrist Phone</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-psychiatrist-phone"
                          placeholder="Phone number"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>

                <Button
                  type="submit"
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  const renderStep5 = () => {
    const hasCriminalRecord = riskAssessmentForm.watch('hasCriminalRecord');
    const hasDrugUse = riskAssessmentForm.watch('hasDrugUse');
    const hasAlcoholIssue = riskAssessmentForm.watch('hasAlcoholIssue');
    const hasSuicidalThoughts = riskAssessmentForm.watch('hasSuicidalThoughts');
    const hasSelfHarmHistory = riskAssessmentForm.watch('hasSelfHarmHistory');
    const hasSocialWorker = riskAssessmentForm.watch('hasSocialWorker');
    const hasProbationOfficer = riskAssessmentForm.watch('hasProbationOfficer');

    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk & Safeguarding Assessment</CardTitle>
          <CardDescription>Confidential risk factors and safeguarding information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...riskAssessmentForm}>
            <form onSubmit={riskAssessmentForm.handleSubmit(handleStep5Submit)} className="space-y-6">
              <FormField
                control={riskAssessmentForm.control}
                name="hasCriminalRecord"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-criminal-record"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          riskAssessmentForm.setValue('hasCriminalRecord', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Criminal Record</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasCriminalRecord && (
                <div className="ml-6 p-4 border rounded-md">
                  <FormField
                    control={riskAssessmentForm.control}
                    name="criminalRecordDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Please provide details</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-criminal-record-details"
                            placeholder="Nature of offense, date, etc."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={riskAssessmentForm.control}
                name="hasDrugUse"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-drug-use"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          riskAssessmentForm.setValue('hasDrugUse', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Drug Use History</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasDrugUse && (
                <div className="ml-6 p-4 border rounded-md">
                  <FormField
                    control={riskAssessmentForm.control}
                    name="drugUseDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Substance type and frequency</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-drug-use-details"
                            placeholder="Type of substances, frequency, treatment status"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={riskAssessmentForm.control}
                name="hasAlcoholIssue"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-alcohol-issue"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          riskAssessmentForm.setValue('hasAlcoholIssue', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Alcohol-Related Issues</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasAlcoholIssue && (
                <div className="ml-6 p-4 border rounded-md">
                  <FormField
                    control={riskAssessmentForm.control}
                    name="alcoholDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alcohol use details</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-alcohol-details"
                            placeholder="Frequency, impact, treatment"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={riskAssessmentForm.control}
                name="hasSuicidalThoughts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-suicidal-thoughts"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          riskAssessmentForm.setValue('hasSuicidalThoughts', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Suicidal Thoughts</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasSuicidalThoughts && (
                <div className="ml-6 p-4 border rounded-md">
                  <FormField
                    control={riskAssessmentForm.control}
                    name="suicidalThoughtsDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details and support in place</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-suicidal-thoughts-details"
                            placeholder="Current status, professional support, coping strategies"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={riskAssessmentForm.control}
                name="hasSelfHarmHistory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-self-harm-history"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          riskAssessmentForm.setValue('hasSelfHarmHistory', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Self-Harm History</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasSelfHarmHistory && (
                <div className="ml-6 p-4 border rounded-md">
                  <FormField
                    control={riskAssessmentForm.control}
                    name="selfHarmDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Self-harm details</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-self-harm-details"
                            placeholder="History, triggers, support mechanisms"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={riskAssessmentForm.control}
                name="hasSocialWorker"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-social-worker"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          riskAssessmentForm.setValue('hasSocialWorker', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Allocated Social Worker</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasSocialWorker && (
                <div className="ml-6 p-4 border rounded-md">
                  <FormField
                    control={riskAssessmentForm.control}
                    name="socialWorkerDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social worker details</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-social-worker-details"
                            placeholder="Name, contact details, department"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={riskAssessmentForm.control}
                name="hasProbationOfficer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-probation-officer"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          riskAssessmentForm.setValue('hasProbationOfficer', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Probation Officer</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasProbationOfficer && (
                <div className="ml-6 p-4 border rounded-md space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={riskAssessmentForm.control}
                      name="probationOfficerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probation Officer Name</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-probation-officer-name"
                              placeholder="Officer name"
                              {...field}
                              value={typeof field.value === 'string' ? field.value : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={riskAssessmentForm.control}
                      name="probationOfficerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probation Officer Phone</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-probation-officer-phone"
                              placeholder="Phone number"
                              {...field}
                              value={typeof field.value === 'string' ? field.value : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={riskAssessmentForm.control}
                    name="probationDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional probation details</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-probation-details"
                            placeholder="Office location, conditions, review dates"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={riskAssessmentForm.control}
                name="riskNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Risk Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        data-testid="textarea-risk-notes"
                        placeholder="Any other relevant risk information"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any additional information that may be relevant to risk assessment and support planning
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>

                <Button
                  type="submit"
                  data-testid="button-next"
                  disabled={createRiskAssessmentMutation.isPending}
                >
                  {createRiskAssessmentMutation.isPending ? 'Saving...' : 'Next'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  const renderStep6 = () => {
    const hasNilIncome = financialForm.watch('hasNilIncome');
    const incomeSource = financialForm.watch('incomeSource');

    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Status & Benefits</CardTitle>
          <CardDescription>Income sources and benefit information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...financialForm}>
            <form onSubmit={financialForm.handleSubmit(handleStep6Submit)} className="space-y-6">
              <FormField
                control={financialForm.control}
                name="incomeSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Income Source *</FormLabel>
                    <Select 
                      onValueChange={createSelectHandler(financialForm, 'incomeSource')} 
                      value={field.value === null ? undefined : field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-income-source">
                          <SelectValue placeholder="Select income source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EMPLOYMENT">Employment</SelectItem>
                        <SelectItem value="UNIVERSAL_CREDIT">Universal Credit</SelectItem>
                        <SelectItem value="JSA">Jobseeker's Allowance (JSA)</SelectItem>
                        <SelectItem value="ESA">Employment and Support Allowance (ESA)</SelectItem>
                        <SelectItem value="DLA">Disability Living Allowance (DLA)</SelectItem>
                        <SelectItem value="HOUSING_BENEFIT">Housing Benefit</SelectItem>
                        <SelectItem value="NIL_INCOME">Nil Income</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {incomeSource && incomeSource !== 'NIL_INCOME' && incomeSource !== 'EMPLOYMENT' && (
                <div className="p-4 border rounded-md space-y-4">
                  <FormField
                    control={financialForm.control}
                    name="benefitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefit Type Details</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-benefit-type"
                            placeholder="e.g., UC with housing element"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={financialForm.control}
                      name="benefitAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefit Amount (£)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              data-testid="input-benefit-amount"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={financialForm.control}
                      name="benefitFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Frequency</FormLabel>
                          <Select 
                            onValueChange={createSelectHandler(financialForm, 'benefitFrequency')} 
                            value={field.value === null ? undefined : field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-benefit-frequency">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="WEEKLY">Weekly</SelectItem>
                              <SelectItem value="FORTNIGHTLY">Fortnightly</SelectItem>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {incomeSource === 'EMPLOYMENT' && (
                <FormField
                  control={financialForm.control}
                  name="employmentDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Details</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="textarea-employment-details"
                          placeholder="Employer name, position, hours, salary"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={financialForm.control}
                name="hasNilIncome"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-has-nil-income"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          financialForm.setValue('hasNilIncome', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Has Nil Income (No income at all)</FormLabel>
                      <FormDescription>
                        Check if the resident currently has no income
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {hasNilIncome && (
                <div className="ml-6 p-4 border rounded-md">
                  <FormField
                    control={financialForm.control}
                    name="nilIncomeExplanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nil Income Explanation *</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-nil-income-explanation"
                            placeholder="Please explain the circumstances"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Required for nil income declaration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={financialForm.control}
                name="debtDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Debt Details</FormLabel>
                    <FormControl>
                      <Textarea
                        data-testid="textarea-debt-details"
                        placeholder="Any outstanding debts, repayment plans, etc."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Information about any debts or financial obligations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={financialForm.control}
                name="councilAuthorizationAgreed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-council-authorization-agreed"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          financialForm.setValue('councilAuthorizationAgreed', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Council Tax Authorization *</FormLabel>
                      <FormDescription>
                        I authorize the organization to contact the local council regarding my housing benefit/council tax support
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>

                <Button
                  type="submit"
                  data-testid="button-next"
                  disabled={createFinancialDeclarationMutation.isPending}
                >
                  {createFinancialDeclarationMutation.isPending ? 'Saving...' : 'Next'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // STEP 7: HOUSING ALLOCATION
  // ============================================================

  const renderStep7 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Housing Allocation</CardTitle>
        <CardDescription>Property and room assignment details</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...housingAllocationForm}>
          <form onSubmit={housingAllocationForm.handleSubmit(handleStep7Submit)} className="space-y-6">
            <FormField
              control={housingAllocationForm.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property *</FormLabel>
                  <Select onValueChange={createSelectHandler(housingAllocationForm, 'propertyId')} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-property">
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {propertiesData?.properties?.map((property: any) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name} - {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={housingAllocationForm.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room *</FormLabel>
                  <Select onValueChange={createSelectHandler(housingAllocationForm, 'roomId')} value={field.value} disabled={!selectedPropertyId}>
                    <FormControl>
                      <SelectTrigger data-testid="select-room">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRooms.map((room: any) => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.roomNumber} (Floor {room.floor || 'Ground'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedPropertyId ? 'Select an available room' : 'Please select a property first'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={housingAllocationForm.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Move-In Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-start-date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={housingAllocationForm.control}
              name="serviceChargeAmount"
              render={({ field }) => {
                const displayValue = typeof field.value === 'number' ? String(field.value) : (field.value || '');
                return (
                  <FormItem>
                    <FormLabel>Service Charge Amount (£/week)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        data-testid="input-service-charge"
                        placeholder="0.00"
                        value={displayValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                            field.onChange(value === '' ? undefined : value);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value && value !== '') {
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed)) {
                              field.onChange(parsed);
                            }
                          }
                          field.onBlur();
                        }}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter amount between £0 and £1000 per week
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack} data-testid="button-back">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button type="submit" data-testid="button-next" disabled={createTenancyMutation.isPending}>
                {createTenancyMutation.isPending ? 'Saving...' : 'Next: Support Framework'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  // ============================================================
  // STEP 8: SUPPORT FRAMEWORK
  // ============================================================

  const renderStep8 = () => {
    // Resolve property and room names from UUIDs
    const housingAllocationData = housingAllocationForm.getValues();
    const selectedProperty = propertiesData?.properties?.find((p: any) => p.id === housingAllocationData.propertyId);
    const selectedRoom = selectedProperty?.rooms?.find((r: any) => r.id === housingAllocationData.roomId);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Framework</CardTitle>
          <CardDescription>Support needs assessment and planning</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Housing Allocation Summary */}
          {selectedProperty && selectedRoom && (
            <div className="mb-6 p-4 bg-muted rounded-md" data-testid="housing-summary">
              <h3 className="font-semibold text-sm mb-2">Housing Allocation</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Property:</strong> {selectedProperty.name} - {selectedProperty.address}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Room:</strong> Room {selectedRoom.roomNumber} (Floor {selectedRoom.floor || 'Ground'})
              </p>
            </div>
          )}

          <Form {...supportFrameworkForm}>
            <form onSubmit={supportFrameworkForm.handleSubmit(handleStep8Submit)} className="space-y-6">
            <FormField
              control={supportFrameworkForm.control}
              name="supportNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="textarea-support-needs"
                      placeholder="Describe the tenant's support needs..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={supportFrameworkForm.control}
              name="supportGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="textarea-support-goals"
                      placeholder="Key goals for support plan..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <p className="text-sm font-medium">Support Areas</p>
              
              <FormField
                control={supportFrameworkForm.control}
                name="budgetPlanAgreed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-budget-plan"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          supportFrameworkForm.setValue('budgetPlanAgreed', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Budget Planning Support</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={supportFrameworkForm.control}
                name="employmentSupport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-employment-support"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          supportFrameworkForm.setValue('employmentSupport', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Employment Support</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={supportFrameworkForm.control}
                name="lifeSkillsSupport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-life-skills"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          supportFrameworkForm.setValue('lifeSkillsSupport', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Life Skills Support</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={supportFrameworkForm.control}
                name="healthSupport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-health-support"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          supportFrameworkForm.setValue('healthSupport', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Health & Wellbeing Support</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={supportFrameworkForm.control}
                name="reviewFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Frequency</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-review-frequency"
                        placeholder="e.g., Weekly, Monthly"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={supportFrameworkForm.control}
                name="nextReviewDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Review Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-next-review-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={supportFrameworkForm.control}
              name="supportWorkerNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Worker Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="textarea-support-notes"
                      placeholder="Additional notes from support worker..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack} data-testid="button-back">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button type="submit" data-testid="button-next" disabled={createSupportPlanMutation.isPending}>
                {createSupportPlanMutation.isPending ? 'Saving...' : 'Next: Legal Agreements'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    );
  };

  // ============================================================
  // STEP 9: LEGAL AGREEMENTS
  // ============================================================

  const renderStep9 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Legal Agreements & Consents</CardTitle>
        <CardDescription>Required documentation and authorizations</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...legalAgreementsForm}>
          <form onSubmit={legalAgreementsForm.handleSubmit(handleStep9Submit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={legalAgreementsForm.control}
                name="authorizationFormSigned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-authorization-form"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          legalAgreementsForm.setValue('authorizationFormSigned', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Authorization Form *</FormLabel>
                      <FormDescription>
                        I authorize the organization to contact relevant agencies on my behalf
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={legalAgreementsForm.control}
                name="confidentialityWaiverSigned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-confidentiality-waiver"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          legalAgreementsForm.setValue('confidentialityWaiverSigned', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Confidentiality Waiver *</FormLabel>
                      <FormDescription>
                        I understand how my personal information will be used and shared
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={legalAgreementsForm.control}
                name="fireEvacuationAcknowledged"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-fire-evacuation"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          legalAgreementsForm.setValue('fireEvacuationAcknowledged', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Fire Evacuation Procedures *</FormLabel>
                      <FormDescription>
                        I have been informed of and understand the fire evacuation procedures
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={legalAgreementsForm.control}
                name="licenceAgreementSigned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-licence-agreement"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          legalAgreementsForm.setValue('licenceAgreementSigned', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Licence Agreement *</FormLabel>
                      <FormDescription>
                        I agree to the terms and conditions of the licence agreement
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={legalAgreementsForm.control}
                name="serviceChargeAgreementSigned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-service-charge"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          legalAgreementsForm.setValue('serviceChargeAgreementSigned', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Service Charge Agreement *</FormLabel>
                      <FormDescription>
                        I understand and agree to the service charge payment terms
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={legalAgreementsForm.control}
                name="supportAgreementSigned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-support-agreement"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const boolValue = checked === true;
                          legalAgreementsForm.setValue('supportAgreementSigned', boolValue, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Support Agreement *</FormLabel>
                      <FormDescription>
                        I agree to actively participate in my support plan
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack} data-testid="button-back">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button type="submit" data-testid="button-next" disabled={createConsentsMutation.isPending}>
                {createConsentsMutation.isPending ? 'Saving...' : 'Next: Document Uploads'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  // ============================================================
  // STEP 10: DOCUMENT UPLOADS
  // ============================================================

  const renderStep10 = () => {
    // Helper to format file size
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Uploads</CardTitle>
          <CardDescription>Upload required identity and income verification documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Document Uploads (Optional)</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You can upload these documents now or add them later from the tenant profile. These documents may be required before move-in.
                  Accepted formats: PDF, JPG, PNG, DOC, DOCX (max 10MB each)
                </p>
              </div>
            </div>
          </div>

          {/* Proof of ID Upload Panel */}
          <div className="border rounded-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Proof of ID</h3>
                <p className="text-sm text-muted-foreground">
                  Valid passport, driver's license, or national ID card
                </p>
              </div>
              {proofOfIdDoc && (
                <CheckCircle className="w-6 h-6 text-green-600" data-testid="status-proof-of-id-uploaded" />
              )}
            </div>

            {proofOfIdDoc ? (
              <div className="bg-muted rounded-md p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium" data-testid="text-proof-of-id-filename">{proofOfIdDoc.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(proofOfIdDoc.fileSize)} • Uploaded {new Date(proofOfIdDoc.uploadedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: <span className="font-medium">{proofOfIdDoc.status}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="replace-proof-of-id">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingProofOfId}
                      onClick={() => document.getElementById('replace-proof-of-id')?.click()}
                      data-testid="button-replace-proof-of-id"
                    >
                      {uploadingProofOfId ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 w-4 h-4" />
                          Replace Document
                        </>
                      )}
                    </Button>
                  </label>
                  <input
                    id="replace-proof-of-id"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleProofOfIdUpload}
                    disabled={uploadingProofOfId}
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-8 text-center space-y-4">
                {uploadingProofOfId ? (
                  <div className="space-y-3">
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" data-testid="loader-proof-of-id" />
                    <p className="font-medium">Uploading...</p>
                    <p className="text-sm text-muted-foreground">Please wait while your document is being uploaded</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <label htmlFor="upload-proof-of-id">
                        <Button
                          type="button"
                          variant="default"
                          disabled={uploadingProofOfId}
                          onClick={() => document.getElementById('upload-proof-of-id')?.click()}
                          data-testid="button-upload-proof-of-id"
                        >
                          <Upload className="mr-2 w-4 h-4" />
                          Choose File
                        </Button>
                      </label>
                      <input
                        id="upload-proof-of-id"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleProofOfIdUpload}
                        disabled={uploadingProofOfId}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        PDF, JPG, PNG, DOC, or DOCX (max 10MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Proof of Income Upload Panel */}
          <div className="border rounded-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Proof of Income</h3>
                <p className="text-sm text-muted-foreground">
                  Benefit letter, payslips, or employment contract
                </p>
              </div>
              {proofOfIncomeDoc && (
                <CheckCircle className="w-6 h-6 text-green-600" data-testid="status-proof-of-income-uploaded" />
              )}
            </div>

            {proofOfIncomeDoc ? (
              <div className="bg-muted rounded-md p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium" data-testid="text-proof-of-income-filename">{proofOfIncomeDoc.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(proofOfIncomeDoc.fileSize)} • Uploaded {new Date(proofOfIncomeDoc.uploadedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: <span className="font-medium">{proofOfIncomeDoc.status}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="replace-proof-of-income">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingProofOfIncome}
                      onClick={() => document.getElementById('replace-proof-of-income')?.click()}
                      data-testid="button-replace-proof-of-income"
                    >
                      {uploadingProofOfIncome ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 w-4 h-4" />
                          Replace Document
                        </>
                      )}
                    </Button>
                  </label>
                  <input
                    id="replace-proof-of-income"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleProofOfIncomeUpload}
                    disabled={uploadingProofOfIncome}
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-8 text-center space-y-4">
                {uploadingProofOfIncome ? (
                  <div className="space-y-3">
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" data-testid="loader-proof-of-income" />
                    <p className="font-medium">Uploading...</p>
                    <p className="text-sm text-muted-foreground">Please wait while your document is being uploaded</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <label htmlFor="upload-proof-of-income">
                        <Button
                          type="button"
                          variant="default"
                          disabled={uploadingProofOfIncome}
                          onClick={() => document.getElementById('upload-proof-of-income')?.click()}
                          data-testid="button-upload-proof-of-income"
                        >
                          <Upload className="mr-2 w-4 h-4" />
                          Choose File
                        </Button>
                      </label>
                      <input
                        id="upload-proof-of-income"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleProofOfIncomeUpload}
                        disabled={uploadingProofOfIncome}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        PDF, JPG, PNG, DOC, or DOCX (max 10MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleBack} data-testid="button-back">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleStep10Submit}
              data-testid="button-next"
            >
              Next: Review & Submit
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // STEP 11: REVIEW & SUBMIT
  // ============================================================

  const renderStep11 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>Review all information and complete onboarding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-6 rounded-md space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-lg">Onboarding Complete!</h3>
          </div>
          <p className="text-muted-foreground">
            You have successfully completed all 10 steps of the tenant onboarding process. All information has been saved.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Pre-Intake</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Personal Identity</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Diversity</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Health & Medical</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Risk Assessment</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Financial Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Housing Allocation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Support Framework</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Legal Agreements</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Document Uploads</span>
            </div>
          </div>
        </div>

        {/* Document Upload Status */}
        {(!proofOfIdDoc || !proofOfIncomeDoc) && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Missing Documents</h4>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  The following documents were not uploaded during onboarding. You can upload them later from the tenant profile, but they may be required before move-in:
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc list-inside space-y-1">
                  {!proofOfIdDoc && <li>Proof of ID (passport, driver's license, or national ID card)</li>}
                  {!proofOfIncomeDoc && <li>Proof of Income (benefit letter, payslips, or employment contract)</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tenantId && (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Tenant ID:</strong> {tenantId}
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleBack} data-testid="button-back">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              toast({
                title: 'Success',
                description: 'Onboarding complete! Returning to dashboard...',
              });
              setTimeout(() => setLocation('/'), 1500);
            }}
            data-testid="button-finish"
          >
            Complete & Return to Dashboard
            <CheckCircle className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      case 8:
        return renderStep8();
      case 9:
        return renderStep9();
      case 10:
        return renderStep10();
      case 11:
        return renderStep11();
      default:
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Invalid step number
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">New Resident Onboarding</h1>
          <p className="text-muted-foreground">
            Complete all steps to register a new resident
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleClearDraft}
          data-testid="button-clear-draft"
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear Draft & Start Fresh
        </Button>
      </div>

      {renderProgressBar()}

      <div className="mb-6">{renderStep()}</div>

      {/* Age Warning Dialog */}
      <AlertDialog open={showAgeWarning} onOpenChange={setShowAgeWarning}>
        <AlertDialogContent data-testid="dialog-age-warning">
          <AlertDialogHeader>
            <AlertDialogTitle>Age Verification Required</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>Tenants under 18 are not eligible for room allocation</strong> in supported housing.
              </p>
              <p>
                Please verify the date of birth is correct before proceeding with the onboarding process.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction data-testid="button-age-warning-ok">
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
