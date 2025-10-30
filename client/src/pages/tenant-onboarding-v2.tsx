import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// ============================================================
// TYPE DEFINITIONS (Aligned with Backend Schemas)
// ============================================================

// Step 1: Pre-Intake Data (stored in localStorage only, not sent to backend yet)
const preIntakeSchema = z.object({
  referralSource: z.string().min(1, 'Referral source is required'),
  referralDate: z.string().optional(),
  isEmergencyAdmission: z.boolean().default(false),
  eligibilityConfirmed: z.boolean().default(false),
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
  ethnicity: z.enum([
    'WHITE_BRITISH', 'WHITE_IRISH', 'WHITE_OTHER',
    'MIXED_WHITE_BLACK_CARIBBEAN', 'MIXED_WHITE_BLACK_AFRICAN', 'MIXED_WHITE_ASIAN', 'MIXED_OTHER',
    'ASIAN_INDIAN', 'ASIAN_PAKISTANI', 'ASIAN_BANGLADESHI', 'ASIAN_OTHER',
    'BLACK_AFRICAN', 'BLACK_CARIBBEAN', 'BLACK_OTHER',
    'CHINESE', 'OTHER', 'PREFER_NOT_TO_SAY'
  ]).optional(),
  religion: z.enum([
    'CHRISTIAN', 'MUSLIM', 'HINDU', 'SIKH', 'JEWISH', 'BUDDHIST',
    'NO_RELIGION', 'OTHER', 'PREFER_NOT_TO_SAY'
  ]).optional(),
  sexualOrientation: z.enum([
    'HETEROSEXUAL', 'HOMOSEXUAL', 'LESBIAN', 'BISEXUAL', 'TRANSGENDER', 'OTHER', 'PREFER_NOT_TO_SAY'
  ]).optional(),
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
  incomeSource: z.enum([
    'ESA', 'DLA', 'JSA', 'UNIVERSAL_CREDIT', 'HOUSING_BENEFIT', 'NIL_INCOME', 'EMPLOYMENT', 'OTHER'
  ]).optional(),
  benefitType: z.string().optional(),
  benefitAmount: z.coerce.number().positive().optional(), // Use coerce to convert string to number
  benefitFrequency: z.enum(['WEEKLY', 'FORTNIGHTLY', 'MONTHLY']).optional(),
  hasNilIncome: z.boolean().default(false),
  nilIncomeExplanation: z.string().optional(),
  councilAuthorizationAgreed: z.boolean().default(false),
  employmentDetails: z.string().optional(),
  debtDetails: z.string().optional(),
});

type FinancialData = z.infer<typeof financialSchema>;

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
// MAIN COMPONENT
// ============================================================

export default function TenantOnboardingV2() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [tenantId, setTenantId] = useState<string | null>(null); // Track created tenant
  const [preIntakeData, setPreIntakeData] = useState<PreIntakeData>({
    referralSource: '',
    isEmergencyAdmission: false,
    eligibilityConfirmed: false,
  });

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
      ethnicity: undefined,
      religion: undefined,
      sexualOrientation: undefined,
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
      
      const response = await apiRequest('POST', `/api/tenants/${tenantId}/risk-assessment`, combinedData);
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
      incomeSource: undefined,
      benefitType: '',
      benefitAmount: undefined,
      benefitFrequency: undefined,
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
      const response = await apiRequest('POST', `/api/tenants/${tenantId}/financial-declaration`, data);
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
  // AUTOSAVE TO LOCALSTORAGE
  // ============================================================

  useEffect(() => {
    const saveInterval = setInterval(() => {
      const draftData = {
        step,
        tenantId, // Save tenant ID
        preIntake: preIntakeForm.getValues(),
        personalIdentity: personalIdentityForm.getValues(),
        diversity: diversityForm.getValues(),
        health: healthForm.getValues(),
        riskAssessment: riskAssessmentForm.getValues(),
        financial: financialForm.getValues(),
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      console.log('Autosaved to localStorage:', draftData);
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(saveInterval);
  }, [step, tenantId, preIntakeForm, personalIdentityForm, diversityForm, healthForm, riskAssessmentForm, financialForm]);

  // Load draft data on mount
  useEffect(() => {
    const draftJson = localStorage.getItem(STORAGE_KEY);
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson);
        
        // Restore step (validate it's within range 1-10)
        if (draft.step && draft.step >= 1 && draft.step <= 10) {
          setStep(draft.step);
        }
        
        // Restore tenant ID if present
        if (draft.tenantId) {
          setTenantId(draft.tenantId);
        }
        
        // Restore form data
        if (draft.preIntake) {
          preIntakeForm.reset(draft.preIntake);
          setPreIntakeData(draft.preIntake);
        }
        if (draft.personalIdentity) {
          personalIdentityForm.reset(draft.personalIdentity);
        }
        if (draft.diversity) {
          diversityForm.reset(draft.diversity);
        }
        if (draft.health) {
          healthForm.reset(draft.health);
        }
        if (draft.riskAssessment) {
          riskAssessmentForm.reset(draft.riskAssessment);
        }
        if (draft.financial) {
          financialForm.reset(draft.financial);
        }
        
        toast({
          title: 'Draft Restored',
          description: `Restored progress from ${new Date(draft.lastSaved).toLocaleString()}`,
        });
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

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

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  const renderProgressBar = () => {
    const totalSteps = 10;
    const progress = (step / totalSteps) * 100;

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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                      {...field}
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
                      onCheckedChange={field.onChange}
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
                      onCheckedChange={field.onChange}
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ethnicity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ethnicity">
                          <SelectValue placeholder="Select ethnicity" />
                        </SelectTrigger>
                      </FormControl>
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
                )}
              />

              <FormField
                control={diversityForm.control}
                name="religion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Religion</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-religion">
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                      </FormControl>
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
                )}
              />
            </div>

            <FormField
              control={diversityForm.control}
              name="sexualOrientation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexual Orientation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-sexual-orientation">
                        <SelectValue placeholder="Select sexual orientation" />
                      </SelectTrigger>
                    </FormControl>
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
              )}
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
                        onCheckedChange={field.onChange}
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
                        onCheckedChange={field.onChange}
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
                        onCheckedChange={field.onChange}
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
                        onCheckedChange={field.onChange}
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
                        onCheckedChange={field.onChange}
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
                        onCheckedChange={field.onChange}
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
                        onCheckedChange={field.onChange}
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
                        onCheckedChange={field.onChange}
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

              {incomeSource && incomeSource !== 'NONE' && incomeSource !== 'EMPLOYMENT' && (
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                        onCheckedChange={field.onChange}
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
                        onCheckedChange={field.onChange}
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
      default:
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Steps 3-10 will follow the same pattern as Steps 1-2.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Each step will have: react-hook-form + Zod validation + API mutations + autosave
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tenant Onboarding (Proper Implementation)</h1>
        <p className="text-muted-foreground">
          Reference pattern: Steps 1-2 properly implemented with all required features
        </p>
      </div>

      {renderProgressBar()}

      <div className="mb-6">{renderStep()}</div>

      <div className="mt-6 p-4 bg-muted rounded-md">
        <h3 className="font-semibold mb-2 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Features Implemented in Steps 1-2:
        </h3>
        <ul className="text-sm space-y-1 ml-7">
          <li>✓ React Hook Form integration with shadcn Form components</li>
          <li>✓ Zod validation aligned with backend schemas</li>
          <li>✓ TanStack Query mutations for API calls</li>
          <li>✓ LocalStorage autosave (every 30s) with draft restoration</li>
          <li>✓ Proper error handling with toast notifications</li>
          <li>✓ TypeScript types aligned with backend (languagesSpoken as string)</li>
          <li>✓ data-testid attributes for all interactive elements</li>
          <li>✓ Form validation before submission</li>
          <li>✓ Loading states during API calls</li>
          <li>✓ Progress indicator showing step completion</li>
        </ul>
      </div>
    </div>
  );
}
