import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, Upload, User, Home, FileText, Eye, Wallet, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

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

interface TenantFormData {
  // Core fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  
  // Profile fields
  title: string;
  nationality: string;
  previousAddress: string;
  languagesSpoken: string;
}

interface FinancialInfo {
  benefitType: string;
  benefitFrequency: string;
  benefitAmount: string;
}

interface ContactInfo {
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinAddress: string;
  nextOfKinPhone: string;
  doctorName: string;
  doctorPhone: string;
  hasProbationOfficer: boolean;
  probationOfficerName: string;
  probationOfficerPhone: string;
}

interface RoomAssignment {
  propertyId: string;
  roomId: string;
  startDate: string;
  serviceChargeAmount: string;
}

interface DocumentUpload {
  file: File;
  type: string;
  isMandatory: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'PROOF_OF_ID', label: 'Proof of ID', mandatory: true },
  { value: 'PROOF_OF_INCOME', label: 'Proof of Income', mandatory: true },
  { value: 'REFERENCE_LETTER', label: 'Reference Letter', mandatory: false },
  { value: 'MEDICAL_REPORT', label: 'Medical Report', mandatory: false },
  { value: 'OTHER', label: 'Other', mandatory: false },
];

export default function TenantOnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const [tenantData, setTenantData] = useState<TenantFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationalId: '',
    title: '',
    nationality: '',
    previousAddress: '',
    languagesSpoken: '',
  });

  const [financialInfo, setFinancialInfo] = useState<FinancialInfo>({
    benefitType: '',
    benefitFrequency: '',
    benefitAmount: '',
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinAddress: '',
    nextOfKinPhone: '',
    doctorName: '',
    doctorPhone: '',
    hasProbationOfficer: false,
    probationOfficerName: '',
    probationOfficerPhone: '',
  });

  const [roomAssignment, setRoomAssignment] = useState<RoomAssignment>({
    propertyId: '',
    roomId: '',
    startDate: '',
    serviceChargeAmount: '',
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: propertiesData } = useQuery<{ properties: Property[] }>({
    queryKey: ['/api/properties'],
    enabled: step === 2,
  });

  const selectedProperty = propertiesData?.properties.find(
    (p) => p.id === roomAssignment.propertyId
  );

  const availableRooms = selectedProperty?.rooms.filter((room) => {
    const tenancyCount = room._count?.tenancies ?? 0;
    return tenancyCount < room.capacity;
  }) || [];

  const handleStep1Next = () => {
    if (!tenantData.firstName || !tenantData.lastName || !tenantData.dateOfBirth) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!roomAssignment.roomId || !roomAssignment.startDate) {
      toast({
        title: 'Required fields missing',
        description: 'Please select a room and start date',
        variant: 'destructive',
      });
      return;
    }
    setStep(3);
  };

  const handleStep3Next = () => {
    // Financial info is optional
    setStep(4);
  };

  const handleStep4Next = () => {
    // Contact info is optional
    setStep(5);
  };

  const handleStep5Next = () => {
    const mandatoryDocs = DOCUMENT_TYPES.filter(dt => dt.mandatory);
    const uploadedMandatoryTypes = new Set(
      documents.filter(d => d.isMandatory).map(d => d.type)
    );

    const missingMandatory = mandatoryDocs.filter(
      dt => !uploadedMandatoryTypes.has(dt.value)
    );

    if (missingMandatory.length > 0) {
      toast({
        title: 'Mandatory documents missing',
        description: `Please upload: ${missingMandatory.map(d => d.label).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setStep(6);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string, isMandatory: boolean) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setDocuments(prev => [...prev.filter(d => d.type !== type), { file, type, isMandatory }]);
    toast({
      title: 'File uploaded',
      description: `${file.name} ready to submit`,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create tenant with all related data
      const tenantPayload = {
        ...tenantData,
        ...financialInfo,
        benefitAmount: financialInfo.benefitAmount ? parseFloat(financialInfo.benefitAmount) : undefined,
        ...contactInfo,
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

      // Create tenancy
      const tenancyPayload = {
        tenantId: tenant.id,
        roomId: roomAssignment.roomId,
        startDate: roomAssignment.startDate,
        serviceChargeAmount: roomAssignment.serviceChargeAmount
          ? parseFloat(roomAssignment.serviceChargeAmount)
          : undefined,
      };

      const tenancyResponse = await fetch(`/api/tenants/${tenant.id}/tenancies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenancyPayload),
        credentials: 'include',
      });

      if (!tenancyResponse.ok) {
        throw new Error('Failed to create tenancy');
      }

      // Upload documents
      for (const doc of documents) {
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('type', doc.type);
        formData.append('isMandatory', doc.isMandatory.toString());

        await fetch(`/api/documents/${tenant.id}/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }

      toast({
        title: 'Tenant created successfully',
        description: 'Tenant has been onboarded',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      setLocation(`/tenants/${tenant.id}`);
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Failed to create tenant',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { num: 1, icon: User, label: 'Personal' },
      { num: 2, icon: Home, label: 'Room' },
      { num: 3, icon: Wallet, label: 'Financial' },
      { num: 4, icon: Users, label: 'Contacts' },
      { num: 5, icon: Upload, label: 'Documents' },
      { num: 6, icon: Eye, label: 'Review' },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
              <span className="text-xs mt-1 text-center hidden sm:block">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${
                  step > s.num ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Details
        </CardTitle>
        <CardDescription>Enter tenant's basic information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Select
              value={tenantData.title}
              onValueChange={(value) => setTenantData({ ...tenantData, title: value })}
            >
              <SelectTrigger data-testid="select-title">
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr">Mr</SelectItem>
                <SelectItem value="Mrs">Mrs</SelectItem>
                <SelectItem value="Ms">Ms</SelectItem>
                <SelectItem value="Miss">Miss</SelectItem>
                <SelectItem value="Mx">Mx</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              data-testid="input-first-name"
              value={tenantData.firstName}
              onChange={(e) => setTenantData({ ...tenantData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              data-testid="input-last-name"
              value={tenantData.lastName}
              onChange={(e) => setTenantData({ ...tenantData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              data-testid="input-dob"
              value={tenantData.dateOfBirth}
              onChange={(e) => setTenantData({ ...tenantData, dateOfBirth: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationalId">National Insurance Number</Label>
            <Input
              id="nationalId"
              data-testid="input-national-id"
              value={tenantData.nationalId}
              onChange={(e) => setTenantData({ ...tenantData, nationalId: e.target.value })}
              placeholder="AB123456C"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              data-testid="input-nationality"
              value={tenantData.nationality}
              onChange={(e) => setTenantData({ ...tenantData, nationality: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="input-email"
              value={tenantData.email}
              onChange={(e) => setTenantData({ ...tenantData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              data-testid="input-phone"
              value={tenantData.phone}
              onChange={(e) => setTenantData({ ...tenantData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="previousAddress">Previous Address</Label>
            <Textarea
              id="previousAddress"
              data-testid="input-previous-address"
              value={tenantData.previousAddress}
              onChange={(e) => setTenantData({ ...tenantData, previousAddress: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="languagesSpoken">Languages Spoken and Written</Label>
            <Input
              id="languagesSpoken"
              data-testid="input-languages"
              value={tenantData.languagesSpoken}
              onChange={(e) => setTenantData({ ...tenantData, languagesSpoken: e.target.value })}
              placeholder="e.g., English, Spanish, French"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleStep1Next} data-testid="button-next-step1">
            Next
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Room Assignment
        </CardTitle>
        <CardDescription>Assign tenant to a room</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="property">
              Property <span className="text-destructive">*</span>
            </Label>
            <Select
              value={roomAssignment.propertyId}
              onValueChange={(value) =>
                setRoomAssignment({ ...roomAssignment, propertyId: value, roomId: '' })
              }
            >
              <SelectTrigger data-testid="select-property">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {propertiesData?.properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">
              Room Number <span className="text-destructive">*</span>
            </Label>
            <Select
              value={roomAssignment.roomId}
              onValueChange={(value) =>
                setRoomAssignment({ ...roomAssignment, roomId: value })
              }
              disabled={!roomAssignment.propertyId}
            >
              <SelectTrigger data-testid="select-room">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.length === 0 && roomAssignment.propertyId ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No available rooms
                  </div>
                ) : (
                  availableRooms.map((room) => {
                    const occupancy = room._count?.tenancies ?? 0;
                    const capacity = room.capacity;
                    const available = capacity - occupancy;
                    return (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.roomNumber} - {available}/{capacity} available
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {roomAssignment.propertyId && availableRooms.length === 0 && (
              <p className="text-sm text-destructive">
                All rooms in this property are currently occupied
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">
              Move-in Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              data-testid="input-start-date"
              value={roomAssignment.startDate}
              onChange={(e) =>
                setRoomAssignment({ ...roomAssignment, startDate: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceChargeAmount">Service Charge (£/week)</Label>
            <Input
              id="serviceChargeAmount"
              type="number"
              step="0.01"
              data-testid="input-service-charge"
              value={roomAssignment.serviceChargeAmount}
              onChange={(e) =>
                setRoomAssignment({ ...roomAssignment, serviceChargeAmount: e.target.value })
              }
              placeholder="95.00"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back-step2">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleStep2Next} data-testid="button-next-step2">
            Next
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Financial Information
        </CardTitle>
        <CardDescription>Enter benefit and income details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="benefitType">Type of Benefit</Label>
            <Select
              value={financialInfo.benefitType}
              onValueChange={(value) =>
                setFinancialInfo({ ...financialInfo, benefitType: value })
              }
            >
              <SelectTrigger data-testid="select-benefit-type">
                <SelectValue placeholder="Select benefit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESA">ESA (Employment and Support Allowance)</SelectItem>
                <SelectItem value="DLA">DLA (Disability Living Allowance)</SelectItem>
                <SelectItem value="JSA">JSA (Jobseeker's Allowance)</SelectItem>
                <SelectItem value="UNIVERSAL_CREDIT">Universal Credit</SelectItem>
                <SelectItem value="HOUSING_BENEFIT">Housing Benefit</SelectItem>
                <SelectItem value="NIL_INCOME">Nil Income</SelectItem>
                <SelectItem value="EMPLOYMENT">Employment</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefitFrequency">How Often Paid</Label>
            <Select
              value={financialInfo.benefitFrequency}
              onValueChange={(value) =>
                setFinancialInfo({ ...financialInfo, benefitFrequency: value })
              }
            >
              <SelectTrigger data-testid="select-benefit-frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                <SelectItem value="Four Weekly">Four Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefitAmount">Amount (£)</Label>
            <Input
              id="benefitAmount"
              type="number"
              step="0.01"
              data-testid="input-benefit-amount"
              value={financialInfo.benefitAmount}
              onChange={(e) =>
                setFinancialInfo({ ...financialInfo, benefitAmount: e.target.value })
              }
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(2)} data-testid="button-back-step3">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleStep3Next} data-testid="button-next-step3">
            Next
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Emergency & Professional Contacts
        </CardTitle>
        <CardDescription>Next of kin and professional support contacts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Next of Kin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextOfKinName">Name</Label>
              <Input
                id="nextOfKinName"
                data-testid="input-next-of-kin-name"
                value={contactInfo.nextOfKinName}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, nextOfKinName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextOfKinRelationship">Relationship</Label>
              <Input
                id="nextOfKinRelationship"
                data-testid="input-next-of-kin-relationship"
                value={contactInfo.nextOfKinRelationship}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, nextOfKinRelationship: e.target.value })
                }
                placeholder="e.g., Mother, Brother, Friend"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nextOfKinAddress">Address</Label>
              <Textarea
                id="nextOfKinAddress"
                data-testid="input-next-of-kin-address"
                value={contactInfo.nextOfKinAddress}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, nextOfKinAddress: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextOfKinPhone">Contact Number</Label>
              <Input
                id="nextOfKinPhone"
                type="tel"
                data-testid="input-next-of-kin-phone"
                value={contactInfo.nextOfKinPhone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, nextOfKinPhone: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Medical Professional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doctorName">Doctor Name / Practice</Label>
              <Input
                id="doctorName"
                data-testid="input-doctor-name"
                value={contactInfo.doctorName}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, doctorName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorPhone">Doctor Phone</Label>
              <Input
                id="doctorPhone"
                type="tel"
                data-testid="input-doctor-phone"
                value={contactInfo.doctorPhone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, doctorPhone: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Probation Officer</h3>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="hasProbationOfficer"
              data-testid="checkbox-has-probation"
              checked={contactInfo.hasProbationOfficer}
              onCheckedChange={(checked) =>
                setContactInfo({ ...contactInfo, hasProbationOfficer: checked as boolean })
              }
            />
            <Label htmlFor="hasProbationOfficer">Tenant has a probation officer</Label>
          </div>

          {contactInfo.hasProbationOfficer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="probationOfficerName">Probation Officer Name</Label>
                <Input
                  id="probationOfficerName"
                  data-testid="input-probation-name"
                  value={contactInfo.probationOfficerName}
                  onChange={(e) =>
                    setContactInfo({ ...contactInfo, probationOfficerName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="probationOfficerPhone">Probation Officer Phone</Label>
                <Input
                  id="probationOfficerPhone"
                  type="tel"
                  data-testid="input-probation-phone"
                  value={contactInfo.probationOfficerPhone}
                  onChange={(e) =>
                    setContactInfo({ ...contactInfo, probationOfficerPhone: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(3)} data-testid="button-back-step4">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleStep4Next} data-testid="button-next-step4">
            Next
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Document Upload
        </CardTitle>
        <CardDescription>
          Upload required documents (marked with *)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => {
          const uploadedDoc = documents.find((d) => d.type === docType.value);

          return (
            <div key={docType.value} className="space-y-2">
              <Label htmlFor={`doc-${docType.value}`}>
                {docType.label}
                {docType.mandatory && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`doc-${docType.value}`}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  data-testid={`input-upload-${docType.value.toLowerCase()}`}
                  onChange={(e) => handleFileUpload(e, docType.value, docType.mandatory)}
                  className="flex-1"
                />
                {uploadedDoc && (
                  <Badge variant="secondary" data-testid={`badge-uploaded-${docType.value.toLowerCase()}`}>
                    {uploadedDoc.file.name}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(4)} data-testid="button-back-step5">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleStep5Next} data-testid="button-next-step5">
            Next
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep6 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Review & Submit
        </CardTitle>
        <CardDescription>Review all information before submitting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Personal Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {tenantData.title && <div><span className="text-muted-foreground">Title:</span> {tenantData.title}</div>}
            <div><span className="text-muted-foreground">Name:</span> {tenantData.firstName} {tenantData.lastName}</div>
            <div><span className="text-muted-foreground">DOB:</span> {tenantData.dateOfBirth}</div>
            {tenantData.nationalId && <div><span className="text-muted-foreground">NI Number:</span> {tenantData.nationalId}</div>}
            {tenantData.nationality && <div><span className="text-muted-foreground">Nationality:</span> {tenantData.nationality}</div>}
            {tenantData.email && <div><span className="text-muted-foreground">Email:</span> {tenantData.email}</div>}
            {tenantData.phone && <div><span className="text-muted-foreground">Phone:</span> {tenantData.phone}</div>}
            {tenantData.languagesSpoken && <div className="col-span-2"><span className="text-muted-foreground">Languages:</span> {tenantData.languagesSpoken}</div>}
            {tenantData.previousAddress && <div className="col-span-2"><span className="text-muted-foreground">Previous Address:</span> {tenantData.previousAddress}</div>}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Room Assignment</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Property:</span> {selectedProperty?.name}</div>
            <div><span className="text-muted-foreground">Room:</span> {availableRooms.find(r => r.id === roomAssignment.roomId)?.roomNumber}</div>
            <div><span className="text-muted-foreground">Start Date:</span> {roomAssignment.startDate}</div>
            {roomAssignment.serviceChargeAmount && <div><span className="text-muted-foreground">Service Charges:</span> £{roomAssignment.serviceChargeAmount}</div>}
          </div>
        </div>

        {(financialInfo.benefitType || financialInfo.benefitAmount) && (
          <div>
            <h3 className="font-semibold mb-2">Financial Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {financialInfo.benefitType && <div><span className="text-muted-foreground">Benefit Type:</span> {financialInfo.benefitType}</div>}
              {financialInfo.benefitFrequency && <div><span className="text-muted-foreground">Frequency:</span> {financialInfo.benefitFrequency}</div>}
              {financialInfo.benefitAmount && <div><span className="text-muted-foreground">Amount:</span> £{financialInfo.benefitAmount}</div>}
            </div>
          </div>
        )}

        {(contactInfo.nextOfKinName || contactInfo.doctorName || contactInfo.hasProbationOfficer) && (
          <div>
            <h3 className="font-semibold mb-2">Contacts</h3>
            <div className="space-y-2 text-sm">
              {contactInfo.nextOfKinName && (
                <div>
                  <span className="text-muted-foreground">Next of Kin:</span> {contactInfo.nextOfKinName}
                  {contactInfo.nextOfKinRelationship && ` (${contactInfo.nextOfKinRelationship})`}
                  {contactInfo.nextOfKinPhone && ` - ${contactInfo.nextOfKinPhone}`}
                </div>
              )}
              {contactInfo.doctorName && (
                <div><span className="text-muted-foreground">Doctor:</span> {contactInfo.doctorName}
                  {contactInfo.doctorPhone && ` - ${contactInfo.doctorPhone}`}
                </div>
              )}
              {contactInfo.hasProbationOfficer && (
                <div><span className="text-muted-foreground">Probation Officer:</span> {contactInfo.probationOfficerName || 'Yes'}
                  {contactInfo.probationOfficerPhone && ` - ${contactInfo.probationOfficerPhone}`}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Documents ({documents.length})</h3>
          <div className="flex flex-wrap gap-2">
            {documents.map((doc) => {
              const docType = DOCUMENT_TYPES.find((dt) => dt.value === doc.type);
              return (
                <Badge key={doc.type} variant="secondary" data-testid={`review-doc-${doc.type.toLowerCase()}`}>
                  {docType?.label || doc.type}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(5)} data-testid="button-back-step6">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            data-testid="button-submit-onboarding"
          >
            {isSubmitting ? 'Creating...' : 'Create Tenant'}
            <Check className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">New Tenant Onboarding</h1>
          <p className="text-muted-foreground mt-2">Complete all steps to onboard a new tenant</p>
        </div>

        {renderProgressBar()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </div>
    </div>
  );
}
