import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, ArrowRight, Check, User, MapPin, Heart, Shield, 
  Coins, Home, Users, FileCheck, Eye, ClipboardList 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ============================================================
// TYPE DEFINITIONS - Complete Onboarding Data Model
// ============================================================

interface PreIntakeData {
  referralSource: string;
  referredByName: string;
  referralDate: string;
  eligibilityConfirmed: boolean;
}

interface PersonalIdentityData {
  title: string;
  firstName: string;
  lastName: string;
  otherNames: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationalInsuranceNumber: string;
  nationality: string;
  languagesSpoken: string;
  previousAddress: string;
  maritalStatus: string;
  email: string;
  phone: string;
}

interface DiversityData {
  ethnicity: string;
  religion: string;
  sexualOrientation: string;
  communicationNeeds: string[];
  disabilities: string;
}

interface HealthMedicalData {
  currentMedications: string;
  medicalConditions: string;
  gpName: string;
  gpPhone: string;
  cpnName: string;
  cpnPhone: string;
  psychiatristName: string;
  psychiatristPhone: string;
}

interface RiskSafeguardingData {
  hasCriminalRecord: boolean;
  criminalRecordDetails: string;
  hasDrugUse: boolean;
  drugUseDetails: string;
  hasAlcoholIssue: boolean;
  alcoholDetails: string;
  hasSuicidalThoughts: boolean;
  suicidalThoughtsDetails: string;
  hasSelfHarmHistory: boolean;
  selfHarmDetails: string;
  hasMentalHealth: boolean;
  mentalHealthDetails: string;
  mentalHealthDiagnosis: string;
  prescribedMedication: string;
}

interface FinancialData {
  incomeSource: string;
  benefitType: string;
  benefitAmount: string;
  benefitFrequency: string;
  hasNilIncome: boolean;
  nilIncomeExplanation: string;
  employmentDetails: string;
  debtDetails: string;
  councilAuthorizationAgreed: boolean;
}

interface HousingAllocationData {
  propertyId: string;
  roomId: string;
  startDate: string;
  // Inventory
  hasQuilt: boolean;
  hasPillow: boolean;
  hasDuvetCover: boolean;
  hasFittedSheet: boolean;
  hasWindowDressing: boolean;
  hasWardrobe: boolean;
  hasChestOfDrawers: boolean;
  hasBed: boolean;
  hasMattress: boolean;
  keysIssued: number;
  isCleanAndTidy: boolean;
  floorWallGoodCondition: boolean;
  electricsWorking: boolean;
  structureGoodCondition: boolean;
  inventoryNotes: string;
}

interface SupportFrameworkData {
  supportNeeds: string;
  supportGoals: string;
  hasSocialWorker: boolean;
  socialWorkerDetails: string;
  hasProbationOfficer: boolean;
  probationOfficerName: string;
  probationOfficerPhone: string;
  probationDetails: string;
  // Emergency Contacts
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinAddress: string;
  nextOfKinPhone: string;
  doctorName: string;
  doctorPhone: string;
}

interface LegalConsentsData {
  licenceAgreementSigned: boolean;
  licenceAgreementSignature: string;
  supportAgreementSigned: boolean;
  supportAgreementSignature: string;
  confidentialityWaiverSigned: boolean;
  confidentialityWaiverSignature: string;
  fireEvacuationAcknowledged: boolean;
  fireEvacuationSignature: string;
  serviceChargeAgreementSigned: boolean;
  serviceChargeAgreementSignature: string;
  authorizationFormSigned: boolean;
  authorizationFormSignature: string;
  nilIncomeFormSigned: boolean;
  nilIncomeFormSignature: string;
  photoIdConsentGiven: boolean;
  photoIdConsentType: string;
}

interface Property {
  id: string;
  name: string;
  rooms: Array<{
    id: string;
    roomNumber: string;
    capacity: number;
    _count: {
      tenancies: number;
    };
  }>;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TenantOnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for all 10 steps
  const [preIntake, setPreIntake] = useState<PreIntakeData>({
    referralSource: '',
    referredByName: '',
    referralDate: '',
    eligibilityConfirmed: false,
  });

  const [personalIdentity, setPersonalIdentity] = useState<PersonalIdentityData>({
    title: '',
    firstName: '',
    lastName: '',
    otherNames: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationalInsuranceNumber: '',
    nationality: '',
    languagesSpoken: '',
    previousAddress: '',
    maritalStatus: '',
    email: '',
    phone: '',
  });

  const [diversity, setDiversity] = useState<DiversityData>({
    ethnicity: '',
    religion: '',
    sexualOrientation: '',
    communicationNeeds: [],
    disabilities: '',
  });

  const [healthMedical, setHealthMedical] = useState<HealthMedicalData>({
    currentMedications: '',
    medicalConditions: '',
    gpName: '',
    gpPhone: '',
    cpnName: '',
    cpnPhone: '',
    psychiatristName: '',
    psychiatristPhone: '',
  });

  const [riskSafeguarding, setRiskSafeguarding] = useState<RiskSafeguardingData>({
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
    hasMentalHealth: false,
    mentalHealthDetails: '',
    mentalHealthDiagnosis: '',
    prescribedMedication: '',
  });

  const [financial, setFinancial] = useState<FinancialData>({
    incomeSource: '',
    benefitType: '',
    benefitAmount: '',
    benefitFrequency: '',
    hasNilIncome: false,
    nilIncomeExplanation: '',
    employmentDetails: '',
    debtDetails: '',
    councilAuthorizationAgreed: false,
  });

  const [housingAllocation, setHousingAllocation] = useState<HousingAllocationData>({
    propertyId: '',
    roomId: '',
    startDate: '',
    hasQuilt: false,
    hasPillow: false,
    hasDuvetCover: false,
    hasFittedSheet: false,
    hasWindowDressing: false,
    hasWardrobe: false,
    hasChestOfDrawers: false,
    hasBed: false,
    hasMattress: false,
    keysIssued: 0,
    isCleanAndTidy: false,
    floorWallGoodCondition: false,
    electricsWorking: false,
    structureGoodCondition: false,
    inventoryNotes: '',
  });

  const [supportFramework, setSupportFramework] = useState<SupportFrameworkData>({
    supportNeeds: '',
    supportGoals: '',
    hasSocialWorker: false,
    socialWorkerDetails: '',
    hasProbationOfficer: false,
    probationOfficerName: '',
    probationOfficerPhone: '',
    probationDetails: '',
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinAddress: '',
    nextOfKinPhone: '',
    doctorName: '',
    doctorPhone: '',
  });

  const [legalConsents, setLegalConsents] = useState<LegalConsentsData>({
    licenceAgreementSigned: false,
    licenceAgreementSignature: '',
    supportAgreementSigned: false,
    supportAgreementSignature: '',
    confidentialityWaiverSigned: false,
    confidentialityWaiverSignature: '',
    fireEvacuationAcknowledged: false,
    fireEvacuationSignature: '',
    serviceChargeAgreementSigned: false,
    serviceChargeAgreementSignature: '',
    authorizationFormSigned: false,
    authorizationFormSignature: '',
    nilIncomeFormSigned: false,
    nilIncomeFormSignature: '',
    photoIdConsentGiven: false,
    photoIdConsentType: '',
  });

  // Load properties for step 7
  const { data: propertiesData } = useQuery<{ properties: Property[] }>({
    queryKey: ['/api/properties'],
    enabled: step === 7,
  });

  const selectedProperty = propertiesData?.properties.find(
    (p) => p.id === housingAllocation.propertyId
  );

  const availableRooms = selectedProperty?.rooms.filter((room) => {
    const tenancyCount = room._count?.tenancies ?? 0;
    return tenancyCount < room.capacity;
  }) || [];

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const draft = {
        preIntake,
        personalIdentity,
        diversity,
        healthMedical,
        riskSafeguarding,
        financial,
        housingAllocation,
        supportFramework,
        legalConsents,
        currentStep: step,
      };
      localStorage.setItem('onboarding-draft', JSON.stringify(draft));
    }, 30000);

    return () => clearInterval(interval);
  }, [preIntake, personalIdentity, diversity, healthMedical, riskSafeguarding, financial, housingAllocation, supportFramework, legalConsents, step]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('onboarding-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setPreIntake(parsed.preIntake || preIntake);
        setPersonalIdentity(parsed.personalIdentity || personalIdentity);
        setDiversity(parsed.diversity || diversity);
        setHealthMedical(parsed.healthMedical || healthMedical);
        setRiskSafeguarding(parsed.riskSafeguarding || riskSafeguarding);
        setFinancial(parsed.financial || financial);
        setHousingAllocation(parsed.housingAllocation || housingAllocation);
        setSupportFramework(parsed.supportFramework || supportFramework);
        setLegalConsents(parsed.legalConsents || legalConsents);
        setStep(parsed.currentStep || 1);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // ============================================================
  // VALIDATION FUNCTIONS
  // ============================================================

  const validateStep1 = (): boolean => {
    if (!preIntake.eligibilityConfirmed) {
      toast({
        title: 'Eligibility Not Confirmed',
        description: 'Please confirm tenant eligibility before proceeding',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!personalIdentity.firstName || !personalIdentity.lastName || !personalIdentity.dateOfBirth) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in first name, last name, and date of birth',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    // Diversity is optional
    return true;
  };

  const validateStep4 = (): boolean => {
    // Health/medical is optional
    return true;
  };

  const validateStep5 = (): boolean => {
    // Risk assessment is optional but conditional fields should be filled
    if (riskSafeguarding.hasCriminalRecord && !riskSafeguarding.criminalRecordDetails) {
      toast({
        title: 'Incomplete Information',
        description: 'Please provide details about the criminal record',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep6 = (): boolean => {
    if (financial.hasNilIncome && !financial.nilIncomeExplanation) {
      toast({
        title: 'Explanation Required',
        description: 'Please explain the nil income situation',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep7 = (): boolean => {
    if (!housingAllocation.roomId || !housingAllocation.startDate) {
      toast({
        title: 'Required fields missing',
        description: 'Please select a room and move-in date',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep8 = (): boolean => {
    if (!supportFramework.nextOfKinName) {
      toast({
        title: 'Emergency Contact Required',
        description: 'Please provide next of kin information',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep9 = (): boolean => {
    const requiredConsents = [
      { signed: legalConsents.licenceAgreementSigned, name: 'Licence Agreement' },
      { signed: legalConsents.supportAgreementSigned, name: 'Support Agreement' },
      { signed: legalConsents.confidentialityWaiverSigned, name: 'Confidentiality Waiver' },
      { signed: legalConsents.fireEvacuationAcknowledged, name: 'Fire Evacuation Plan' },
    ];

    const missing = requiredConsents.filter(c => !c.signed);
    if (missing.length > 0) {
      toast({
        title: 'Missing Consents',
        description: `Please sign: ${missing.map(m => m.name).join(', ')}`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // ============================================================
  // NAVIGATION HANDLERS
  // ============================================================

  const handleNext = () => {
    let isValid = false;

    switch (step) {
      case 1: isValid = validateStep1(); break;
      case 2: isValid = validateStep2(); break;
      case 3: isValid = validateStep3(); break;
      case 4: isValid = validateStep4(); break;
      case 5: isValid = validateStep5(); break;
      case 6: isValid = validateStep6(); break;
      case 7: isValid = validateStep7(); break;
      case 8: isValid = validateStep8(); break;
      case 9: isValid = validateStep9(); break;
      default: isValid = true;
    }

    if (isValid) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================
  // FINAL SUBMISSION
  // ============================================================

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Step 1: Create basic tenant record
      const tenantPayload = {
        firstName: personalIdentity.firstName,
        lastName: personalIdentity.lastName,
        email: personalIdentity.email || undefined,
        phone: personalIdentity.phone || undefined,
        dateOfBirth: personalIdentity.dateOfBirth,
        nationalId: personalIdentity.nationalInsuranceNumber || undefined,
      };

      const tenantResponse = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantPayload),
        credentials: 'include',
      });

      if (!tenantResponse.ok) {
        const error = await tenantResponse.json();
        throw new Error(error.error || 'Failed to create tenant');
      }

      const { tenant } = await tenantResponse.json();
      const tenantId = tenant.id;

      // Step 2: Save profile data
      await apiRequest('PUT', `/api/tenants/${tenantId}/profile`, {
        title: personalIdentity.title,
        otherNames: personalIdentity.otherNames,
        placeOfBirth: personalIdentity.placeOfBirth,
        previousAddress: personalIdentity.previousAddress,
        nationality: personalIdentity.nationality,
        languagesSpoken: personalIdentity.languagesSpoken,
        ethnicity: diversity.ethnicity || undefined,
        religion: diversity.religion || undefined,
        sexualOrientation: diversity.sexualOrientation || undefined,
        maritalStatus: personalIdentity.maritalStatus,
        communicationNeeds: diversity.communicationNeeds.join(', '),
        disabilities: diversity.disabilities,
      });

      // Step 3: Save risk assessment
      await apiRequest('PUT', `/api/tenants/${tenantId}/risk-assessment`, riskSafeguarding);

      // Step 4: Save support plan
      await apiRequest('PUT', `/api/tenants/${tenantId}/support-plan`, {
        supportNeeds: supportFramework.supportNeeds,
        supportGoals: supportFramework.supportGoals,
      });

      // Step 5: Save finance
      await apiRequest('PUT', `/api/tenants/${tenantId}/finance`, {
        incomeSource: financial.incomeSource || undefined,
        benefitType: financial.benefitType,
        benefitAmount: financial.benefitAmount ? parseFloat(financial.benefitAmount) : undefined,
        benefitFrequency: financial.benefitFrequency,
        hasNilIncome: financial.hasNilIncome,
        employmentDetails: financial.employmentDetails,
        debtDetails: financial.debtDetails,
      });

      // Step 6: Save consents
      await apiRequest('PUT', `/api/tenants/${tenantId}/consents`, legalConsents);

      // Step 7: Create emergency contact
      if (supportFramework.nextOfKinName) {
        await apiRequest('POST', `/api/tenants/${tenantId}/emergency-contacts`, {
          name: supportFramework.nextOfKinName,
          relationship: supportFramework.nextOfKinRelationship,
          address: supportFramework.nextOfKinAddress,
          phone: supportFramework.nextOfKinPhone,
          isPrimary: true,
        });
      }

      // Step 8: Create inventory log
      await apiRequest('POST', `/api/tenants/${tenantId}/inventory-logs`, {
        roomId: housingAllocation.roomId,
        checkInDate: housingAllocation.startDate,
        hasQuilt: housingAllocation.hasQuilt,
        hasPillow: housingAllocation.hasPillow,
        hasDuvetCover: housingAllocation.hasDuvetCover,
        hasFittedSheet: housingAllocation.hasFittedSheet,
        hasWindowDressing: housingAllocation.hasWindowDressing,
        hasWardrobe: housingAllocation.hasWardrobe,
        hasChestOfDrawers: housingAllocation.hasChestOfDrawers,
        hasBed: housingAllocation.hasBed,
        hasMattress: housingAllocation.hasMattress,
        keysIssued: housingAllocation.keysIssued,
        isCleanAndTidy: housingAllocation.isCleanAndTidy,
        floorWallGoodCondition: housingAllocation.floorWallGoodCondition,
        electricsWorking: housingAllocation.electricsWorking,
        structureGoodCondition: housingAllocation.structureGoodCondition,
        notes: housingAllocation.inventoryNotes,
      });

      // Step 9: Create tenancy
      await apiRequest('POST', `/api/tenants/${tenantId}/tenancies`, {
        tenantId,
        roomId: housingAllocation.roomId,
        startDate: housingAllocation.startDate,
        serviceChargeAmount: 20.00, // Standard £20/week
      });

      // Clear draft from localStorage
      localStorage.removeItem('onboarding-draft');

      toast({
        title: 'Onboarding Complete',
        description: 'Tenant has been successfully onboarded',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      setLocation(`/tenants/${tenantId}`);
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Failed to complete onboarding',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // PROGRESS BAR
  // ============================================================

  const renderProgressBar = () => {
    const steps = [
      { num: 1, icon: ClipboardList, label: 'Pre-Intake' },
      { num: 2, icon: User, label: 'Identity' },
      { num: 3, icon: MapPin, label: 'Diversity' },
      { num: 4, icon: Heart, label: 'Health' },
      { num: 5, icon: Shield, label: 'Risk' },
      { num: 6, icon: Pound, label: 'Finance' },
      { num: 7, icon: Home, label: 'Housing' },
      { num: 8, icon: Users, label: 'Support' },
      { num: 9, icon: FileCheck, label: 'Consents' },
      { num: 10, icon: Eye, label: 'Review' },
    ];

    return (
      <div className="mb-8">
        <div className="hidden md:flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step > s.num
                      ? 'bg-primary text-primary-foreground'
                      : step === s.num
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  data-testid={`step-indicator-${s.num}`}
                >
                  {step > s.num ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs mt-1 text-center">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    step > s.num ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 10</span>
            <Badge variant={step === 10 ? 'default' : 'secondary'}>
              {steps[step - 1]?.label || 'Unknown'}
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(step / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // STEP RENDERERS - TO BE IMPLEMENTED
  // ============================================================

  const renderStep = () => {
    switch (step) {
      case 1: return <div>Step 1: Pre-Intake (Coming Soon)</div>;
      case 2: return <div>Step 2: Personal & Identity (Coming Soon)</div>;
      case 3: return <div>Step 3: Diversity & Communication (Coming Soon)</div>;
      case 4: return <div>Step 4: Health & Medical (Coming Soon)</div>;
      case 5: return <div>Step 5: Risk & Safeguarding (Coming Soon)</div>;
      case 6: return <div>Step 6: Financial Status (Coming Soon)</div>;
      case 7: return <div>Step 7: Housing Allocation (Coming Soon)</div>;
      case 8: return <div>Step 8: Support Framework (Coming Soon)</div>;
      case 9: return <div>Step 9: Legal Agreements (Coming Soon)</div>;
      case 10: return <div>Step 10: Review & Generate (Coming Soon)</div>;
      default: return null;
    }
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tenant Onboarding</h1>
        <p className="text-muted-foreground">Complete all steps to onboard a new resident</p>
      </div>

      {renderProgressBar()}

      <div className="mb-6">
        {renderStep()}
      </div>

      <div className="flex justify-between">
        {step > 1 && (
          <Button variant="outline" onClick={handleBack} data-testid="button-back">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < 10 ? (
          <Button onClick={handleNext} data-testid="button-next">
            Next
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleFinalSubmit} disabled={isSubmitting} data-testid="button-submit">
            {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
          </Button>
        )}
      </div>
    </div>
  );
}
