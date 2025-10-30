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
      { num: 6, icon: Coins, label: 'Finance' },
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
  // STEP RENDERERS
  // ============================================================

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Intake Information</CardTitle>
        <CardDescription>How did this person come to us?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="referral-source">Referral Source *</Label>
          <Select 
            value={preIntake.referralSource} 
            onValueChange={(value) => updatePreIntake({ referralSource: value })}
          >
            <SelectTrigger id="referral-source" data-testid="select-referral-source">
              <SelectValue placeholder="Select referral source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOCIAL_SERVICES">Social Services</SelectItem>
              <SelectItem value="PROBATION">Probation Service</SelectItem>
              <SelectItem value="MENTAL_HEALTH_TEAM">Mental Health Team</SelectItem>
              <SelectItem value="HOUSING_ASSOCIATION">Housing Association</SelectItem>
              <SelectItem value="HOMELESS_CHARITY">Homeless Charity</SelectItem>
              <SelectItem value="SELF_REFERRAL">Self-Referral</SelectItem>
              <SelectItem value="FAMILY_FRIEND">Family/Friend</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {preIntake.referralSource === 'OTHER' && (
          <div className="space-y-2">
            <Label htmlFor="referral-other">Please Specify</Label>
            <Input
              id="referral-other"
              data-testid="input-referral-other"
              value={preIntake.referralOther || ''}
              onChange={(e) => updatePreIntake({ referralOther: e.target.value })}
              placeholder="Specify referral source"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="referrer-name">Referrer Name</Label>
          <Input
            id="referrer-name"
            data-testid="input-referrer-name"
            value={preIntake.referrerName || ''}
            onChange={(e) => updatePreIntake({ referrerName: e.target.value })}
            placeholder="Name of person who referred"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="referrer-contact">Referrer Contact</Label>
          <Input
            id="referrer-contact"
            data-testid="input-referrer-contact"
            value={preIntake.referrerContact || ''}
            onChange={(e) => updatePreIntake({ referrerContact: e.target.value })}
            placeholder="Email or phone number"
          />
        </div>

        <div className="space-y-3">
          <Label>Eligibility Criteria</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="eligible-age"
                data-testid="checkbox-eligible-age"
                checked={preIntake.eligibleAge}
                onCheckedChange={(checked) => updatePreIntake({ eligibleAge: !!checked })}
              />
              <label htmlFor="eligible-age" className="text-sm cursor-pointer">
                Aged 18+ and eligible for supported housing
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="eligible-support"
                data-testid="checkbox-eligible-support"
                checked={preIntake.eligibleSupport}
                onCheckedChange={(checked) => updatePreIntake({ eligibleSupport: !!checked })}
              />
              <label htmlFor="eligible-support" className="text-sm cursor-pointer">
                Requires low-level support (can live semi-independently)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="eligible-housing"
                data-testid="checkbox-eligible-housing"
                checked={preIntake.eligibleHousing}
                onCheckedChange={(checked) => updatePreIntake({ eligibleHousing: !!checked })}
              />
              <label htmlFor="eligible-housing" className="text-sm cursor-pointer">
                Homeless or in housing need
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="intake-notes">Initial Assessment Notes</Label>
          <Textarea
            id="intake-notes"
            data-testid="textarea-intake-notes"
            value={preIntake.notes || ''}
            onChange={(e) => updatePreIntake({ notes: e.target.value })}
            placeholder="Any immediate observations or concerns..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Personal Identity</CardTitle>
        <CardDescription>Extended personal details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Select
              value={personalIdentity.title || ''}
              onValueChange={(value) => updatePersonalIdentity({ title: value })}
            >
              <SelectTrigger id="title" data-testid="select-title">
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MR">Mr</SelectItem>
                <SelectItem value="MRS">Mrs</SelectItem>
                <SelectItem value="MISS">Miss</SelectItem>
                <SelectItem value="MS">Ms</SelectItem>
                <SelectItem value="MX">Mx</SelectItem>
                <SelectItem value="DR">Dr</SelectItem>
                <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="other-names">Other Names / Aliases</Label>
            <Input
              id="other-names"
              data-testid="input-other-names"
              value={personalIdentity.otherNames || ''}
              onChange={(e) => updatePersonalIdentity({ otherNames: e.target.value })}
              placeholder="Nicknames, previous surnames, etc."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="place-of-birth">Place of Birth</Label>
            <Input
              id="place-of-birth"
              data-testid="input-place-of-birth"
              value={personalIdentity.placeOfBirth || ''}
              onChange={(e) => updatePersonalIdentity({ placeOfBirth: e.target.value })}
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality *</Label>
            <Select
              value={personalIdentity.nationality || ''}
              onValueChange={(value) => updatePersonalIdentity({ nationality: value })}
            >
              <SelectTrigger id="nationality" data-testid="select-nationality">
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRITISH">British</SelectItem>
                <SelectItem value="IRISH">Irish</SelectItem>
                <SelectItem value="OTHER_EU">Other EU</SelectItem>
                <SelectItem value="AFRICAN">African</SelectItem>
                <SelectItem value="ASIAN">Asian</SelectItem>
                <SelectItem value="CARIBBEAN">Caribbean</SelectItem>
                <SelectItem value="MIDDLE_EASTERN">Middle Eastern</SelectItem>
                <SelectItem value="AMERICAN">American</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="languages-spoken">Languages Spoken</Label>
          <Input
            id="languages-spoken"
            data-testid="input-languages-spoken"
            value={personalIdentity.languagesSpoken || ''}
            onChange={(e) => updatePersonalIdentity({ languagesSpoken: e.target.value })}
            placeholder="e.g., English, Urdu, Polish (comma-separated)"
          />
          <p className="text-xs text-muted-foreground">Separate multiple languages with commas</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marital-status">Marital Status</Label>
          <Select
            value={personalIdentity.maritalStatus || ''}
            onValueChange={(value) => updatePersonalIdentity({ maritalStatus: value })}
          >
            <SelectTrigger id="marital-status" data-testid="select-marital-status">
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Single</SelectItem>
              <SelectItem value="MARRIED">Married</SelectItem>
              <SelectItem value="CIVIL_PARTNERSHIP">Civil Partnership</SelectItem>
              <SelectItem value="DIVORCED">Divorced</SelectItem>
              <SelectItem value="WIDOWED">Widowed</SelectItem>
              <SelectItem value="SEPARATED">Separated</SelectItem>
              <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previous-address">Previous Address</Label>
          <Textarea
            id="previous-address"
            data-testid="textarea-previous-address"
            value={personalIdentity.previousAddress || ''}
            onChange={(e) => updatePersonalIdentity({ previousAddress: e.target.value })}
            placeholder="Full address including postcode"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Diversity & Communication</CardTitle>
        <CardDescription>Equality monitoring and accessibility needs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          This information is optional and used solely for equality monitoring purposes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ethnicity">Ethnicity</Label>
            <Select
              value={diversity.ethnicity || ''}
              onValueChange={(value) => updateDiversity({ ethnicity: value })}
            >
              <SelectTrigger id="ethnicity" data-testid="select-ethnicity">
                <SelectValue placeholder="Select ethnicity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WHITE_BRITISH">White British</SelectItem>
                <SelectItem value="WHITE_IRISH">White Irish</SelectItem>
                <SelectItem value="WHITE_OTHER">White Other</SelectItem>
                <SelectItem value="MIXED_WHITE_BLACK_CARIBBEAN">Mixed: White & Black Caribbean</SelectItem>
                <SelectItem value="MIXED_WHITE_BLACK_AFRICAN">Mixed: White & Black African</SelectItem>
                <SelectItem value="MIXED_WHITE_ASIAN">Mixed: White & Asian</SelectItem>
                <SelectItem value="MIXED_OTHER">Mixed: Other</SelectItem>
                <SelectItem value="ASIAN_INDIAN">Asian: Indian</SelectItem>
                <SelectItem value="ASIAN_PAKISTANI">Asian: Pakistani</SelectItem>
                <SelectItem value="ASIAN_BANGLADESHI">Asian: Bangladeshi</SelectItem>
                <SelectItem value="ASIAN_CHINESE">Asian: Chinese</SelectItem>
                <SelectItem value="ASIAN_OTHER">Asian: Other</SelectItem>
                <SelectItem value="BLACK_CARIBBEAN">Black: Caribbean</SelectItem>
                <SelectItem value="BLACK_AFRICAN">Black: African</SelectItem>
                <SelectItem value="BLACK_OTHER">Black: Other</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
                <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Select
              value={diversity.religion || ''}
              onValueChange={(value) => updateDiversity({ religion: value })}
            >
              <SelectTrigger id="religion" data-testid="select-religion">
                <SelectValue placeholder="Select religion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHRISTIAN">Christian</SelectItem>
                <SelectItem value="MUSLIM">Muslim</SelectItem>
                <SelectItem value="HINDU">Hindu</SelectItem>
                <SelectItem value="SIKH">Sikh</SelectItem>
                <SelectItem value="JEWISH">Jewish</SelectItem>
                <SelectItem value="BUDDHIST">Buddhist</SelectItem>
                <SelectItem value="NO_RELIGION">No Religion</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
                <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sexual-orientation">Sexual Orientation</Label>
          <Select
            value={diversity.sexualOrientation || ''}
            onValueChange={(value) => updateDiversity({ sexualOrientation: value })}
          >
            <SelectTrigger id="sexual-orientation" data-testid="select-sexual-orientation">
              <SelectValue placeholder="Select sexual orientation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HETEROSEXUAL">Heterosexual</SelectItem>
              <SelectItem value="GAY_LESBIAN">Gay/Lesbian</SelectItem>
              <SelectItem value="BISEXUAL">Bisexual</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
              <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Communication Needs</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comm-large-print"
                data-testid="checkbox-comm-large-print"
                checked={diversity.communicationNeeds.includes('LARGE_PRINT')}
                onCheckedChange={(checked) => {
                  const updated = checked
                    ? [...diversity.communicationNeeds, 'LARGE_PRINT']
                    : diversity.communicationNeeds.filter(n => n !== 'LARGE_PRINT');
                  updateDiversity({ communicationNeeds: updated });
                }}
              />
              <label htmlFor="comm-large-print" className="text-sm cursor-pointer">
                Large Print
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comm-braille"
                data-testid="checkbox-comm-braille"
                checked={diversity.communicationNeeds.includes('BRAILLE')}
                onCheckedChange={(checked) => {
                  const updated = checked
                    ? [...diversity.communicationNeeds, 'BRAILLE']
                    : diversity.communicationNeeds.filter(n => n !== 'BRAILLE');
                  updateDiversity({ communicationNeeds: updated });
                }}
              />
              <label htmlFor="comm-braille" className="text-sm cursor-pointer">
                Braille
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comm-bsl"
                data-testid="checkbox-comm-bsl"
                checked={diversity.communicationNeeds.includes('BSL_MAKATON')}
                onCheckedChange={(checked) => {
                  const updated = checked
                    ? [...diversity.communicationNeeds, 'BSL_MAKATON']
                    : diversity.communicationNeeds.filter(n => n !== 'BSL_MAKATON');
                  updateDiversity({ communicationNeeds: updated });
                }}
              />
              <label htmlFor="comm-bsl" className="text-sm cursor-pointer">
                BSL / Makaton
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comm-interpreter"
                data-testid="checkbox-comm-interpreter"
                checked={diversity.communicationNeeds.includes('INTERPRETER')}
                onCheckedChange={(checked) => {
                  const updated = checked
                    ? [...diversity.communicationNeeds, 'INTERPRETER']
                    : diversity.communicationNeeds.filter(n => n !== 'INTERPRETER');
                  updateDiversity({ communicationNeeds: updated });
                }}
              />
              <label htmlFor="comm-interpreter" className="text-sm cursor-pointer">
                Translation / Interpreter
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="disabilities">Disabilities / Additional Needs</Label>
          <Textarea
            id="disabilities"
            data-testid="textarea-disabilities"
            value={diversity.disabilities || ''}
            onChange={(e) => updateDiversity({ disabilities: e.target.value })}
            placeholder="Please describe any disabilities or additional needs..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Health & Medical Information</CardTitle>
        <CardDescription>Current health status and healthcare providers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="medical-conditions">Current Medical Conditions</Label>
          <Textarea
            id="medical-conditions"
            data-testid="textarea-medical-conditions"
            value={healthMedical.medicalConditions || ''}
            onChange={(e) => updateHealthMedical({ medicalConditions: e.target.value })}
            placeholder="List any current medical conditions or diagnoses..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="medications">Current Medications</Label>
          <Textarea
            id="medications"
            data-testid="textarea-medications"
            value={healthMedical.currentMedications || ''}
            onChange={(e) => updateHealthMedical({ currentMedications: e.target.value })}
            placeholder="List all current medications, dosages, and frequencies..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gp-name">GP Name</Label>
            <Input
              id="gp-name"
              data-testid="input-gp-name"
              value={healthMedical.gpName || ''}
              onChange={(e) => updateHealthMedical({ gpName: e.target.value })}
              placeholder="Dr. Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gp-practice">GP Practice</Label>
            <Input
              id="gp-practice"
              data-testid="input-gp-practice"
              value={healthMedical.gpPractice || ''}
              onChange={(e) => updateHealthMedical({ gpPractice: e.target.value })}
              placeholder="Practice name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gp-phone">GP Phone Number</Label>
          <Input
            id="gp-phone"
            data-testid="input-gp-phone"
            value={healthMedical.gpPhone || ''}
            onChange={(e) => updateHealthMedical({ gpPhone: e.target.value })}
            placeholder="020 XXXX XXXX"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpn-name">CPN / Psychiatrist Name (if applicable)</Label>
            <Input
              id="cpn-name"
              data-testid="input-cpn-name"
              value={healthMedical.cpnName || ''}
              onChange={(e) => updateHealthMedical({ cpnName: e.target.value })}
              placeholder="Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpn-phone">CPN / Psychiatrist Phone</Label>
            <Input
              id="cpn-phone"
              data-testid="input-cpn-phone"
              value={healthMedical.cpnPhone || ''}
              onChange={(e) => updateHealthMedical({ cpnPhone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Risk & Safeguarding</CardTitle>
        <CardDescription>Sensitive information to ensure resident and community safety</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          All information is treated confidentially and used solely for risk management and support planning.
        </p>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="criminal-record"
              data-testid="checkbox-criminal-record"
              checked={riskSafeguarding.hasCriminalRecord}
              onCheckedChange={(checked) => updateRiskSafeguarding({ hasCriminalRecord: !!checked })}
            />
            <label htmlFor="criminal-record" className="text-sm font-medium cursor-pointer">
              Has unspent criminal record
            </label>
          </div>

          {riskSafeguarding.hasCriminalRecord && (
            <div className="ml-6 space-y-4 p-4 border rounded-md">
              <div className="space-y-2">
                <Label htmlFor="offence-nature">Nature of Offence</Label>
                <Input
                  id="offence-nature"
                  data-testid="input-offence-nature"
                  value={riskSafeguarding.offenceNature || ''}
                  onChange={(e) => updateRiskSafeguarding({ offenceNature: e.target.value })}
                  placeholder="e.g., Theft, Assault"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offence-date">Date of Offence</Label>
                <Input
                  id="offence-date"
                  type="date"
                  data-testid="input-offence-date"
                  value={riskSafeguarding.offenceDate || ''}
                  onChange={(e) => updateRiskSafeguarding({ offenceDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sentence-details">Sentence Details</Label>
                <Textarea
                  id="sentence-details"
                  data-testid="textarea-sentence-details"
                  value={riskSafeguarding.sentenceDetails || ''}
                  onChange={(e) => updateRiskSafeguarding({ sentenceDetails: e.target.value })}
                  placeholder="Length of sentence, probation status, etc."
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="substance-use"
              data-testid="checkbox-substance-use"
              checked={riskSafeguarding.substanceUse}
              onCheckedChange={(checked) => updateRiskSafeguarding({ substanceUse: !!checked })}
            />
            <label htmlFor="substance-use" className="text-sm font-medium cursor-pointer">
              Current or past substance use issues
            </label>
          </div>

          {riskSafeguarding.substanceUse && (
            <div className="ml-6 space-y-4 p-4 border rounded-md">
              <div className="space-y-2">
                <Label htmlFor="substance-type">Type of Substance</Label>
                <Input
                  id="substance-type"
                  data-testid="input-substance-type"
                  value={riskSafeguarding.substanceType || ''}
                  onChange={(e) => updateRiskSafeguarding({ substanceType: e.target.value })}
                  placeholder="e.g., Alcohol, Cannabis, Opiates"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="substance-frequency">Frequency of Use</Label>
                <Input
                  id="substance-frequency"
                  data-testid="input-substance-frequency"
                  value={riskSafeguarding.substanceFrequency || ''}
                  onChange={(e) => updateRiskSafeguarding({ substanceFrequency: e.target.value })}
                  placeholder="e.g., Daily, Weekly, Occasional"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mental-health-diagnosis"
              data-testid="checkbox-mental-health-diagnosis"
              checked={riskSafeguarding.mentalHealthDiagnosis}
              onCheckedChange={(checked) => updateRiskSafeguarding({ mentalHealthDiagnosis: !!checked })}
            />
            <label htmlFor="mental-health-diagnosis" className="text-sm font-medium cursor-pointer">
              Mental health diagnosis
            </label>
          </div>

          {riskSafeguarding.mentalHealthDiagnosis && (
            <div className="ml-6 space-y-4 p-4 border rounded-md">
              <div className="space-y-2">
                <Label htmlFor="diagnosis-details">Diagnosis Details</Label>
                <Textarea
                  id="diagnosis-details"
                  data-testid="textarea-diagnosis-details"
                  value={riskSafeguarding.diagnosisDetails || ''}
                  onChange={(e) => updateRiskSafeguarding({ diagnosisDetails: e.target.value })}
                  placeholder="Diagnosed conditions, treatment history..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="self-harm-risk"
              data-testid="checkbox-self-harm-risk"
              checked={riskSafeguarding.selfHarmRisk}
              onCheckedChange={(checked) => updateRiskSafeguarding({ selfHarmRisk: !!checked })}
            />
            <label htmlFor="self-harm-risk" className="text-sm font-medium cursor-pointer">
              History of self-harm or suicidal thoughts
            </label>
          </div>

          {riskSafeguarding.selfHarmRisk && (
            <div className="ml-6 space-y-4 p-4 border rounded-md">
              <div className="space-y-2">
                <Label htmlFor="self-harm-details">Details & Support in Place</Label>
                <Textarea
                  id="self-harm-details"
                  data-testid="textarea-self-harm-details"
                  value={riskSafeguarding.selfHarmDetails || ''}
                  onChange={(e) => updateRiskSafeguarding({ selfHarmDetails: e.target.value })}
                  placeholder="When, how, current support strategies..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional-risks">Additional Risk Factors</Label>
          <Textarea
            id="additional-risks"
            data-testid="textarea-additional-risks"
            value={riskSafeguarding.additionalRisks || ''}
            onChange={(e) => updateRiskSafeguarding({ additionalRisks: e.target.value })}
            placeholder="Any other risks or safeguarding concerns..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep6 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Financial Status & Benefits</CardTitle>
        <CardDescription>Income sources and benefit entitlements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="income-source">Primary Income Source</Label>
          <Select
            value={financial.incomeSource || ''}
            onValueChange={(value) => updateFinancial({ incomeSource: value })}
          >
            <SelectTrigger id="income-source" data-testid="select-income-source">
              <SelectValue placeholder="Select income source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYMENT">Employment</SelectItem>
              <SelectItem value="UNIVERSAL_CREDIT">Universal Credit</SelectItem>
              <SelectItem value="ESA">ESA (Employment Support Allowance)</SelectItem>
              <SelectItem value="PIP">PIP (Personal Independence Payment)</SelectItem>
              <SelectItem value="JSA">JSA (Jobseeker's Allowance)</SelectItem>
              <SelectItem value="DLA">DLA (Disability Living Allowance)</SelectItem>
              <SelectItem value="PENSION">State Pension</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
              <SelectItem value="NONE">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="benefit-type">Benefit Type</Label>
            <Input
              id="benefit-type"
              data-testid="input-benefit-type"
              value={financial.benefitType || ''}
              onChange={(e) => updateFinancial({ benefitType: e.target.value })}
              placeholder="e.g., UC, ESA, PIP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="benefit-amount">Amount (£)</Label>
            <Input
              id="benefit-amount"
              type="number"
              step="0.01"
              data-testid="input-benefit-amount"
              value={financial.benefitAmount || ''}
              onChange={(e) => updateFinancial({ benefitAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="benefit-frequency">Frequency</Label>
            <Select
              value={financial.benefitFrequency || ''}
              onValueChange={(value) => updateFinancial({ benefitFrequency: value })}
            >
              <SelectTrigger id="benefit-frequency" data-testid="select-benefit-frequency">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="FORTNIGHTLY">Fortnightly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="nil-income"
              data-testid="checkbox-nil-income"
              checked={financial.hasNilIncome}
              onCheckedChange={(checked) => updateFinancial({ hasNilIncome: !!checked })}
            />
            <label htmlFor="nil-income" className="text-sm font-medium cursor-pointer">
              Resident has nil income (no regular income source)
            </label>
          </div>

          {financial.hasNilIncome && (
            <div className="ml-6 space-y-2 p-4 border rounded-md">
              <Label htmlFor="nil-income-explanation">Explanation *</Label>
              <Textarea
                id="nil-income-explanation"
                data-testid="textarea-nil-income-explanation"
                value={financial.nilIncomeExplanation || ''}
                onChange={(e) => updateFinancial({ nilIncomeExplanation: e.target.value })}
                placeholder="Please explain the resident's current financial situation and any planned applications for benefits..."
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="employment-details">Employment / Education Details</Label>
          <Textarea
            id="employment-details"
            data-testid="textarea-employment-details"
            value={financial.employmentDetails || ''}
            onChange={(e) => updateFinancial({ employmentDetails: e.target.value })}
            placeholder="Current employment, education, training, or job-seeking status..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="debt-details">Known Debts / Arrears</Label>
          <Textarea
            id="debt-details"
            data-testid="textarea-debt-details"
            value={financial.debtDetails || ''}
            onChange={(e) => updateFinancial({ debtDetails: e.target.value })}
            placeholder="Any outstanding debts, rent arrears, or payment plans..."
            rows={2}
          />
        </div>

        <div className="border-t pt-4 space-y-4">
          <h3 className="font-semibold">Service Charge & Authorizations</h3>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm mb-2">
              <strong>Standard Service Charge:</strong> £20.00 per week
            </p>
            <p className="text-sm text-muted-foreground">
              Covers utilities, communal area maintenance, and support services.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="council-authorization"
              data-testid="checkbox-council-authorization"
              checked={financial.councilAuthorizationAgreed}
              onCheckedChange={(checked) => updateFinancial({ councilAuthorizationAgreed: !!checked })}
            />
            <label htmlFor="council-authorization" className="text-sm cursor-pointer">
              I authorize Birmingham City Council to verify benefit entitlement and process housing benefit claims
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
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
