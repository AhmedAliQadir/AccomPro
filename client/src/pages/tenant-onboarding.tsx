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
import { ArrowLeft, ArrowRight, Check, Upload, User, Home, FileText, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  supportLevel: string;
  medicalNotes: string;
  emergencyContact: string;
}

interface RoomAssignment {
  propertyId: string;
  roomId: string;
  startDate: string;
  rentAmount: string;
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
    supportLevel: '',
    medicalNotes: '',
    emergencyContact: '',
  });

  const [roomAssignment, setRoomAssignment] = useState<RoomAssignment>({
    propertyId: '',
    roomId: '',
    startDate: '',
    rentAmount: '',
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

  const availableRooms = selectedProperty?.rooms.filter(
    (room) => room._count.tenancies < room.capacity
  ) || [];

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string, isMandatory: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF, JPG, and PNG files are allowed',
        variant: 'destructive',
      });
      return;
    }

    setDocuments([...documents, { file, type, isMandatory }]);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const mandatoryDocsUploaded = DOCUMENT_TYPES
      .filter((dt) => dt.mandatory)
      .every((dt) => documents.some((doc) => doc.type === dt.value));

    if (!mandatoryDocsUploaded) {
      toast({
        title: 'Mandatory documents required',
        description: 'Please upload all mandatory documents',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tenantResponse = await apiRequest('POST', '/api/tenants', tenantData);
      const tenantResult = await tenantResponse.json();
      const tenantId = tenantResult.tenant.id;

      const tenancyResponse = await apiRequest('POST', `/api/tenants/${tenantId}/tenancies`, {
        tenantId,
        roomId: roomAssignment.roomId,
        startDate: roomAssignment.startDate,
        rentAmount: roomAssignment.rentAmount ? parseFloat(roomAssignment.rentAmount) : undefined,
      });

      for (const doc of documents) {
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('type', doc.type);
        formData.append('isMandatory', doc.isMandatory.toString());

        await fetch(`/api/documents/${tenantId}/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });

      toast({
        title: 'Tenant created successfully',
        description: 'The tenant has been onboarded',
      });

      setLocation(`/tenants/${tenantId}`);
    } catch (error: any) {
      toast({
        title: 'Failed to create tenant',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" onClick={() => setLocation('/tenants')} className="mb-4" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tenants
        </Button>
        <h1 className="text-3xl font-bold">New Tenant Onboarding</h1>
        <p className="text-muted-foreground mt-1">
          Complete all steps to onboard a new tenant
        </p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`h-1 flex-1 ${
                  s < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
            <CardDescription>
              Enter the tenant's personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={tenantData.firstName}
                  onChange={(e) => setTenantData({ ...tenantData, firstName: e.target.value })}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={tenantData.lastName}
                  onChange={(e) => setTenantData({ ...tenantData, lastName: e.target.value })}
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={tenantData.email}
                  onChange={(e) => setTenantData({ ...tenantData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={tenantData.phone}
                  onChange={(e) => setTenantData({ ...tenantData, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={tenantData.dateOfBirth}
                  onChange={(e) => setTenantData({ ...tenantData, dateOfBirth: e.target.value })}
                  required
                  data-testid="input-dob"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID</Label>
                <Input
                  id="nationalId"
                  value={tenantData.nationalId}
                  onChange={(e) => setTenantData({ ...tenantData, nationalId: e.target.value })}
                  data-testid="input-national-id"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportLevel">Support Level</Label>
              <Input
                id="supportLevel"
                value={tenantData.supportLevel}
                onChange={(e) => setTenantData({ ...tenantData, supportLevel: e.target.value })}
                placeholder="e.g., High, Medium, Low"
                data-testid="input-support-level"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalNotes">Medical Notes</Label>
              <Textarea
                id="medicalNotes"
                value={tenantData.medicalNotes}
                onChange={(e) => setTenantData({ ...tenantData, medicalNotes: e.target.value })}
                data-testid="input-medical-notes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Textarea
                id="emergencyContact"
                value={tenantData.emergencyContact}
                onChange={(e) => setTenantData({ ...tenantData, emergencyContact: e.target.value })}
                data-testid="input-emergency-contact"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleStep1Next} data-testid="button-next-step1">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Room Assignment
            </CardTitle>
            <CardDescription>
              Assign the tenant to a room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <Select
                value={roomAssignment.propertyId}
                onValueChange={(value) => setRoomAssignment({ ...roomAssignment, propertyId: value, roomId: '' })}
              >
                <SelectTrigger id="property" data-testid="select-property">
                  <SelectValue placeholder="Select a property" />
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

            {roomAssignment.propertyId && (
              <div className="space-y-2">
                <Label htmlFor="room">Room *</Label>
                <Select
                  value={roomAssignment.roomId}
                  onValueChange={(value) => setRoomAssignment({ ...roomAssignment, roomId: value })}
                >
                  <SelectTrigger id="room" data-testid="select-room">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.roomNumber} (Capacity: {room.capacity}, Occupied: {room._count.tenancies})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableRooms.length === 0 && (
                  <p className="text-sm text-destructive">No available rooms in this property</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={roomAssignment.startDate}
                  onChange={(e) => setRoomAssignment({ ...roomAssignment, startDate: e.target.value })}
                  required
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Rent Amount (£)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  step="0.01"
                  value={roomAssignment.rentAmount}
                  onChange={(e) => setRoomAssignment({ ...roomAssignment, rentAmount: e.target.value })}
                  data-testid="input-rent-amount"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back-step2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleStep2Next} data-testid="button-next-step2">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Upload required documents for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DOCUMENT_TYPES.map((docType) => {
              const uploaded = documents.find((d) => d.type === docType.value);
              return (
                <div key={docType.value} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Label>{docType.label}</Label>
                      {docType.mandatory && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {uploaded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(documents.indexOf(uploaded))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {uploaded ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{uploaded.file.name}</span>
                      <span>({(uploaded.file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ) : (
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, docType.value, docType.mandatory)}
                      data-testid={`input-document-${docType.value.toLowerCase()}`}
                    />
                  )}
                </div>
              );
            })}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(2)} data-testid="button-back-step3">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(4)} data-testid="button-next-step3">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Review & Submit
            </CardTitle>
            <CardDescription>
              Review all information before submitting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Personal Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {tenantData.firstName} {tenantData.lastName}</div>
                <div><span className="text-muted-foreground">DOB:</span> {tenantData.dateOfBirth}</div>
                {tenantData.email && <div><span className="text-muted-foreground">Email:</span> {tenantData.email}</div>}
                {tenantData.phone && <div><span className="text-muted-foreground">Phone:</span> {tenantData.phone}</div>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Room Assignment</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Property:</span> {selectedProperty?.name}</div>
                <div><span className="text-muted-foreground">Room:</span> {selectedProperty?.rooms.find(r => r.id === roomAssignment.roomId)?.roomNumber}</div>
                <div><span className="text-muted-foreground">Start Date:</span> {roomAssignment.startDate}</div>
                {roomAssignment.rentAmount && <div><span className="text-muted-foreground">Rent:</span> £{roomAssignment.rentAmount}</div>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Documents ({documents.length})</h3>
              <div className="space-y-1">
                {documents.map((doc, index) => (
                  <div key={index} className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{doc.file.name}</span>
                    <Badge variant={doc.isMandatory ? 'default' : 'outline'} className="text-xs">
                      {DOCUMENT_TYPES.find(dt => dt.value === doc.type)?.label}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(3)} data-testid="button-back-step4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? 'Creating...' : 'Create Tenant'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
