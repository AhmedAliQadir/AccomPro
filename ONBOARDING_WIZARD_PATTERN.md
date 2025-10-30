# Tenant Onboarding Wizard - Implementation Pattern

## Overview

This document provides a comprehensive pattern for implementing the remaining steps (3-10) of the tenant onboarding wizard. Steps 1-2 in `client/src/pages/tenant-onboarding-v2.tsx` serve as the complete reference implementation.

---

## ✅ Reference Implementation: Steps 1-2

### Features Implemented

1. **React Hook Form Integration**: Uses shadcn `Form` components with proper field validation
2. **Zod Validation**: Backend-aligned schemas with type safety
3. **TanStack Query Mutations**: API calls with proper error handling
4. **LocalStorage Autosave**: Every 30 seconds with draft restoration on mount
5. **TypeScript Alignment**: Data types match backend Prisma schemas exactly
6. **Loading States**: Disabled buttons and loading indicators during API calls
7. **Error Handling**: Toast notifications for success/error states
8. **Data-testid Attributes**: All interactive elements have test IDs
9. **Progress Indicator**: Visual progress bar showing completion percentage
10. **Conditional Rendering**: Fields appear based on previous selections

---

## 🔑 Critical State Management

### Tenant ID Management

**CRITICAL**: After Step 2 creates the tenant, all subsequent steps (3-10) need the `tenantId` to target API calls correctly.

```typescript
// In component state
const [tenantId, setTenantId] = useState<string | null>(null);

// In Step 2 mutation onSuccess
onSuccess: (response) => {
  const createdTenant = response.tenant || response;
  setTenantId(createdTenant.id); // CAPTURE THIS!
  setStep(3); // Advance to next step
}

// In autosave
const draftData = {
  step,
  tenantId, // MUST SAVE THIS!
  // ... form values
};

// In restore
if (draft.tenantId) {
  setTenantId(draft.tenantId); // MUST RESTORE THIS!
}

// In subsequent mutations
const updateProfileMutation = useMutation({
  mutationFn: async (data: DiversityData) => {
    if (!tenantId) throw new Error('No tenant ID');
    const response = await apiRequest('PUT', `/api/tenants/${tenantId}/profile`, data);
    return response.json();
  },
});
```

### Step Restoration

**CRITICAL**: Autosave must save AND restore the current step, otherwise users always land on Step 1.

```typescript
// In autosave
const draftData = {
  step, // MUST SAVE CURRENT STEP!
  tenantId,
  // ... form values
};

// In restore (with validation!)
if (draft.step && draft.step >= 1 && draft.step <= 10) {
  setStep(draft.step); // MUST RESTORE STEP!
}
```

---

## 📐 Pattern Structure

### 1. Define Zod Schema (Aligned with Backend)

```typescript
// IMPORTANT: Check backend schemas first!
// Location: server/schemas/onboarding.ts

import { z } from 'zod';

// Example for Step 3: Diversity & Communication
const diversitySchema = z.object({
  ethnicity: z.nativeEnum(Ethnicity).optional(),
  religion: z.nativeEnum(Religion).optional(),
  sexualOrientation: z.nativeEnum(SexualOrientation).optional(),
  disabilities: z.string().optional(),
  communicationNeeds: z.string().optional(), // NOTE: String, not array!
});

type DiversityData = z.infer<typeof diversitySchema>;
```

**Key Points:**
- **Always check backend schemas first** (`server/schemas/onboarding.ts`)
- Match data types exactly (e.g., `languagesSpoken` is `string`, not `string[]`)
- Use `.optional()` for non-required fields
- Use `.min(1, 'Error message')` for required fields

---

### 2. Create React Hook Form

```typescript
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
```

**Key Points:**
- Use `zodResolver` to connect Zod schema
- Provide sensible `defaultValues` for all fields
- Match TypeScript type to schema inference

---

### 3. Create API Mutation

```typescript
const updateDiversityMutation = useMutation({
  mutationFn: async (data: DiversityData & { tenantId: string }) => {
    const { tenantId, ...payload } = data;
    const response = await apiRequest('PUT', `/api/tenants/${tenantId}/profile`, payload);
    return response.json();
  },
  onSuccess: () => {
    toast({
      title: 'Saved',
      description: 'Diversity information has been saved.',
    });
    queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
    // Move to next step
    setStep(step + 1);
  },
  onError: (error: any) => {
    toast({
      title: 'Error',
      description: error.message || 'Failed to save',
      variant: 'destructive',
    });
  },
});
```

**Key Points:**
- Use `apiRequest(method, url, data)` signature
- Include `tenantId` in mutation function if updating existing tenant
- Invalidate relevant queries after success
- Show user feedback with toast notifications
- Move to next step on success

---

### 4. Render Form with shadcn Components

```typescript
const renderStep3 = () => (
  <Card>
    <CardHeader>
      <CardTitle>Diversity & Communication</CardTitle>
      <CardDescription>Equality monitoring and accessibility needs</CardDescription>
    </CardHeader>
    <CardContent>
      <Form {...diversityForm}>
        <form onSubmit={diversityForm.handleSubmit(handleStep3Submit)} className="space-y-6">
          
          {/* Select Field Example */}
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
                    {/* ... more options */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Input Field Example */}
          <FormField
            control={diversityForm.control}
            name="disabilities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disabilities / Additional Needs</FormLabel>
                <FormControl>
                  <Textarea
                    data-testid="textarea-disabilities"
                    placeholder="Please describe..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional description text</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Checkbox Field Example */}
          <FormField
            control={diversityForm.control}
            name="hasSpecialNeeds"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    data-testid="checkbox-special-needs"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Has Special Communication Needs</FormLabel>
                  <FormDescription>
                    Check if resident requires special communication support
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Navigation Buttons */}
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
```

**Key Points:**
- Always use `FormField` from shadcn for each field
- Include `data-testid` on all interactive elements
- Use `<FormMessage />` to show validation errors
- Show loading state during mutation (`isPending`)
- Provide back/next navigation

---

### 5. Implement Autosave to LocalStorage

```typescript
// Already implemented in reference - add each new step's form to the autosave:
useEffect(() => {
  const saveInterval = setInterval(() => {
    const draftData = {
      step,
      preIntake: preIntakeForm.getValues(),
      personalIdentity: personalIdentityForm.getValues(),
      diversity: diversityForm.getValues(),  // ADD THIS
      // ... add all other step forms
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
  }, AUTOSAVE_INTERVAL);

  return () => clearInterval(saveInterval);
}, [step, preIntakeForm, personalIdentityForm, diversityForm]); // ADD FORMS HERE
```

**Key Points:**
- Add each new form to the dependency array
- Save all form values in a single object
- Load values on mount and reset forms

---

## 🗺️ Remaining Steps Roadmap

### Step 3: Diversity & Communication
**Backend Endpoint:** `PUT /api/tenants/:id/profile`  
**Backend Schema:** `tenantProfileSchema` (partial)  
**Key Fields:**
- `ethnicity`: enum (WHITE_BRITISH, WHITE_IRISH, etc.)
- `religion`: enum (CHRISTIAN, MUSLIM, HINDU, etc.)
- `sexualOrientation`: enum (HETEROSEXUAL, GAY_LESBIAN, etc.)
- `communicationNeeds`: **string** (comma-separated, NOT array)
- `disabilities`: string (textarea)

### Step 4: Health & Medical
**Backend Endpoint:** `PUT /api/tenants/:id/profile`  
**Backend Schema:** `tenantProfileSchema` + custom health fields  
**Key Fields:**
- Medical conditions: textarea
- Current medications: textarea
- GP name, practice, phone
- CPN/Psychiatrist name, phone

**Note:** Health data may need separate endpoint if not in tenant profile.

### Step 5: Risk & Safeguarding
**Backend Endpoint:** `POST /api/tenants/:id/risk-assessment`  
**Backend Schema:** `riskAssessmentSchema`  
**Key Fields (with conditional rendering):**
- `hasCriminalRecord`: boolean → shows offence details
- `substanceUse`: boolean → shows substance type/frequency
- `mentalHealthDiagnosis`: boolean → shows diagnosis details
- `selfHarmRisk`: boolean → shows self-harm details

**Conditional Rendering Example:**
```typescript
const hasCriminalRecord = riskForm.watch('hasCriminalRecord');

{hasCriminalRecord && (
  <div className="ml-6 p-4 border rounded-md space-y-4">
    {/* Criminal record detail fields */}
  </div>
)}
```

### Step 6: Financial Status
**Backend Endpoint:** `POST /api/tenants/:id/financial-declaration`  
**Backend Schema:** `financeSchema`  
**Key Fields:**
- `incomeSource`: enum (EMPLOYMENT, UNIVERSAL_CREDIT, etc.)
- `benefitType`: string
- `benefitAmount`: number
- `benefitFrequency`: enum (WEEKLY, FORTNIGHTLY, MONTHLY)
- `hasNilIncome`: boolean → shows `nilIncomeExplanation`
- `councilAuthorizationAgreed`: boolean (checkbox)

**Conditional Rendering:**
```typescript
const hasNilIncome = financialForm.watch('hasNilIncome');

{hasNilIncome && (
  <FormField
    name="nilIncomeExplanation"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Explanation *</FormLabel>
        <FormControl>
          <Textarea {...field} required />
        </FormControl>
      </FormItem>
    )}
  />
)}
```

### Step 7: Housing Allocation & Inventory
**Backend Endpoint:** `POST /api/tenants/:id/inventory-log`  
**Backend Schema:** `inventoryLogSchema`  
**Key Fields:**
- `roomId`: string (UUID) - dropdown of available rooms
- `checkInDate`: date (licence start date)
- Bedding checkboxes: `hasQuilt`, `hasPillow`, `hasDuvetCover`, etc.
- Furniture checkboxes: `hasWardrobe`, `hasChestOfDrawers`, etc.
- `keysIssued`: number
- Room condition checkboxes: `isCleanAndTidy`, `electricsWorking`, etc.
- `notes`: textarea (inventory notes)

**Implementation Note:** Will need to fetch available rooms via:
```typescript
const { data: availableRooms } = useQuery({
  queryKey: ['/api/rooms', { status: 'AVAILABLE' }],
});
```

### Step 8: Support Framework
**Backend Endpoint:** `POST /api/tenants/:id/support-plan`  
**Backend Schema:** `supportPlanSchema` + `emergencyContactSchema`  
**Key Fields:**
- `supportNeeds`: textarea
- `supportGoals`: textarea
- Emergency contact: name, relationship, address, phone

**Mutation Strategy:** May need two mutations:
1. Support plan mutation
2. Emergency contact mutation (separate table)

### Step 9: Legal Agreements & Consents
**Backend Endpoint:** `POST /api/tenants/:id/consents`  
**Backend Schema:** `consentSchema`  
**Key Fields:** (10 agreements total)
- `licenceAgreementSigned`: boolean
- `licenceAgreementSignature`: string (typed name)
- `supportAgreementSigned`: boolean
- `supportAgreementSignature`: string
- ... (repeat for all 10 agreements)
- `photoIdConsentType`: enum ('PROVIDED_ID', 'PERMISSION_TO_PHOTOGRAPH', 'DECLINE')
- `photoIdConsentSignature`: string

**Conditional Logic:**
```typescript
{legalConsents.licenceAgreementSigned && (
  <FormField
    name="licenceAgreementSignature"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Digital Signature *</FormLabel>
        <FormControl>
          <Input {...field} placeholder="Type your full name" required />
        </FormControl>
      </FormItem>
    )}
  />
)}
```

### Step 10: Review & Submit
**Purpose:** Display all collected data for final review  
**No API call on this step** - just display summary  
**Final Submission:** Call all remaining endpoint mutations in sequence

**Implementation Pattern:**
```typescript
const handleFinalSubmit = async () => {
  try {
    // Call all pending endpoint mutations
    await Promise.all([
      // Any endpoints not yet called
    ]);
    
    // Update tenant status to ACTIVE
    await apiRequest('PATCH', `/api/tenants/${tenantId}`, { status: 'ACTIVE' });
    
    // Navigate to tenant detail page
    setLocation(`/tenants/${tenantId}`);
    
    toast({ title: 'Onboarding Complete!' });
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' });
  }
};
```

---

## 📋 Checklist for Each New Step

- [ ] Check backend schema in `server/schemas/onboarding.ts`
- [ ] Create Zod schema aligned with backend (types must match!)
- [ ] Create form with `useForm` + `zodResolver`
- [ ] Create TanStack Query mutation with correct endpoint
- [ ] Render form using shadcn Form components
- [ ] Add `data-testid` to all interactive elements
- [ ] Implement conditional field rendering if needed
- [ ] Add form to autosave `useEffect`
- [ ] Test form submission and API integration
- [ ] Verify validation errors display correctly
- [ ] Check loading states during mutation

---

## ⚠️ CRITICAL REQUIREMENTS

### 1. **Must Track Tenant ID** ❌ BLOCKING
Without `tenantId` in state, Steps 3-10 cannot target the created tenant. This is a BLOCKING issue.

```typescript
// ❌ WRONG: No tenant ID tracking
const [step, setStep] = useState(1);

// ✅ CORRECT: Track tenant ID
const [step, setStep] = useState(1);
const [tenantId, setTenantId] = useState<string | null>(null);
```

### 2. **Must Capture ID from Response** ❌ BLOCKING
Step 2 creates the tenant - you MUST capture the ID from the response.

```typescript
// ❌ WRONG: Doesn't capture ID
onSuccess: (response) => {
  toast({ title: 'Created!' });
  setStep(3);
}

// ✅ CORRECT: Captures ID before advancing
onSuccess: (response) => {
  const createdTenant = response.tenant || response;
  setTenantId(createdTenant.id); // CRITICAL!
  setStep(3);
}
```

### 3. **Must Save AND Restore Step** ❌ BLOCKING
Autosave is useless if it doesn't restore where the user left off.

```typescript
// ❌ WRONG: Saves step but never restores it
const draftData = { step, ...formData };
localStorage.setItem(KEY, JSON.stringify(draftData));

// In restore:
const draft = JSON.parse(localStorage.getItem(KEY));
// Missing: setStep(draft.step);

// ✅ CORRECT: Saves AND restores step
const draftData = { step, tenantId, ...formData };
localStorage.setItem(KEY, JSON.stringify(draftData));

// In restore:
if (draft.step >= 1 && draft.step <= 10) {
  setStep(draft.step); // RESTORE STEP!
}
if (draft.tenantId) {
  setTenantId(draft.tenantId); // RESTORE TENANT ID!
}
```

### 4. **Must Check for Tenant ID Before Mutations**
Steps 3-10 should guard against missing tenant ID.

```typescript
// ✅ CORRECT: Guard against missing tenant ID
const updateProfileMutation = useMutation({
  mutationFn: async (data: DiversityData) => {
    if (!tenantId) {
      throw new Error('No tenant ID - cannot update profile');
    }
    const response = await apiRequest('PUT', `/api/tenants/${tenantId}/profile`, data);
    return response.json();
  },
});
```

---

## 🚨 Common Pitfalls to Avoid

### 1. **Data Type Misalignment**
❌ WRONG:
```typescript
languagesSpoken: z.array(z.string()) // Backend expects string!
```
✅ CORRECT:
```typescript
languagesSpoken: z.string().optional() // Comma-separated string
```

### 2. **Incorrect API Request Format**
❌ WRONG:
```typescript
apiRequest('/api/tenants', { method: 'POST', body: JSON.stringify(data) })
```
✅ CORRECT:
```typescript
apiRequest('POST', '/api/tenants', data)
```

### 3. **Missing FormControl Wrapper**
❌ WRONG:
```typescript
<Input {...field} />
```
✅ CORRECT:
```typescript
<FormControl>
  <Input {...field} />
</FormControl>
```

### 4. **Forgetting to Add to Autosave**
After creating a new form, **must** add it to:
- `useEffect` dependency array
- Draft data object
- Draft restoration logic on mount

### 5. **Missing Validation Messages**
Always include `<FormMessage />` after `FormControl`:
```typescript
<FormControl>
  <Input {...field} />
</FormControl>
<FormMessage /> {/* DON'T FORGET THIS */}
```

---

## 🧪 Testing Pattern

Each step should be tested for:

1. **Form Validation**: Submit with invalid data, check error messages
2. **API Integration**: Submit valid data, verify API call is made
3. **Autosave**: Wait 30 seconds, check localStorage
4. **Draft Restoration**: Refresh page, verify form is restored
5. **Conditional Fields**: Toggle checkboxes, verify fields show/hide
6. **Navigation**: Test back/next buttons
7. **Loading States**: Verify button disables during submission

---

## 📊 Progress Tracking

| Step | Status | Backend Endpoint | Schema |
|------|--------|------------------|--------|
| 1. Pre-Intake | ✅ Complete | N/A (localStorage only) | preIntakeSchema |
| 2. Personal Identity | ✅ Complete | POST /api/tenants | personalIdentitySchema |
| 3. Diversity | ⏳ Pending | PUT /api/tenants/:id/profile | tenantProfileSchema |
| 4. Health | ⏳ Pending | PUT /api/tenants/:id/profile | tenantProfileSchema |
| 5. Risk | ⏳ Pending | POST /api/tenants/:id/risk-assessment | riskAssessmentSchema |
| 6. Financial | ⏳ Pending | POST /api/tenants/:id/financial-declaration | financeSchema |
| 7. Housing | ⏳ Pending | POST /api/tenants/:id/inventory-log | inventoryLogSchema |
| 8. Support | ⏳ Pending | POST /api/tenants/:id/support-plan | supportPlanSchema |
| 9. Legal | ⏳ Pending | POST /api/tenants/:id/consents | consentSchema |
| 10. Review | ⏳ Pending | N/A (display only) | N/A |

---

## 🔄 Next Steps

1. **Implement Steps 3-6** following this exact pattern
2. **Test each step thoroughly** before moving to next
3. **Implement Steps 7-9** with more complex conditional logic
4. **Build Step 10** as comprehensive review + final submission
5. **Add PDF generation** service for signed documents (Task 13)
6. **Run end-to-end tests** using playwright (Task 17)

---

## 💡 Tips for Success

- **Reference Steps 1-2** whenever unsure about implementation details
- **Always check backend schemas first** before writing frontend code
- **Test early and often** - don't build all steps before testing
- **Use TypeScript strictly** - let the type system catch errors
- **Follow shadcn patterns** - don't reinvent form components
- **Keep mutations simple** - one endpoint per mutation function
- **Show user feedback** - always use toast notifications

---

## 📚 Resources

- **Reference Implementation:** `client/src/pages/tenant-onboarding-v2.tsx`
- **Backend Schemas:** `server/schemas/onboarding.ts`
- **API Routes:** `server/routes/tenants.ts`
- **shadcn Form Docs:** [ui.shadcn.com/docs/components/form](https://ui.shadcn.com/docs/components/form)
- **React Hook Form:** [react-hook-form.com](https://react-hook-form.com/)
- **Zod:** [zod.dev](https://zod.dev/)
