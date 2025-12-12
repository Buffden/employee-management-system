import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { Location, LocationFormField } from '../../../../shared/models/location.model';
import { FormMode } from '../../../../shared/models/table';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { defaultTableConfig } from '../../../../shared/components/table/table.config';
import { LocationService } from '../../services/location.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './location-form.component.html',
  styleUrls: ['./location-form.component.css']
})
export class LocationFormComponent implements OnInit {
  @Input() location: DialogData | undefined;
  @Output() locationResponse: EventEmitter<DialogData> = new EventEmitter<DialogData>();

  FormFields: LocationFormField[] = [];
  initialFormValues = {};
  mode: FormMode = FormMode.ADD;
  isSubmitting = false;
  errorMessage: string | null = null;
  locationForm = new FormGroup({
    name: new FormControl(''),
    address: new FormControl(''),
    city: new FormControl(''),
    state: new FormControl(''),
    country: new FormControl('USA'),
    postalCode: new FormControl(''),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly locationService: LocationService,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.location?.config.mode === 'edit') {
      this.loadLocationDetails();
    }
    
    // Clear error message when user starts typing
    this.locationForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = null;
      }
    });
  }

  initForm() {
    this.FormFields = this.createFormFields();
    this.locationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      address: ['', Validators.maxLength(255)],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: ['', [Validators.required, Validators.maxLength(100)]],
      country: ['USA', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', Validators.maxLength(20)],
    });
  }

  createFormFields(): LocationFormField[] {
    return [
      {
        label: 'Location Name',
        formControlName: 'name',
        placeholder: 'Enter location name',
        errorMessage: 'Location name is required (max 100 characters)',
        required: true
      },
      {
        label: 'Address',
        formControlName: 'address',
        placeholder: 'Enter address (optional)',
        errorMessage: 'Address must not exceed 255 characters',
      },
      {
        label: 'City',
        formControlName: 'city',
        placeholder: 'Enter city',
        errorMessage: 'City is required (max 100 characters)',
        required: true
      },
      {
        label: 'State',
        formControlName: 'state',
        placeholder: 'Enter state',
        errorMessage: 'State is required (max 100 characters)',
        required: true
      },
      {
        label: 'Country',
        formControlName: 'country',
        placeholder: 'Enter country',
        errorMessage: 'Country is required (max 100 characters)',
        required: true
      },
      {
        label: 'Postal Code',
        formControlName: 'postalCode',
        placeholder: 'Enter postal code (optional)',
        errorMessage: 'Postal code must not exceed 20 characters',
      },
    ];
  }

  loadLocationDetails() {
    const content = this.location!.content;
    if (content && 'name' in content && 'city' in content) {
      const location = content as unknown as Location;
      this.locationForm?.patchValue({
        name: location.name,
        address: location.address || '',
        city: location.city,
        state: location.state,
        country: location.country || 'USA',
        postalCode: location.postalCode || '',
      });
      this.initialFormValues = this.locationForm.getRawValue();
    }
  }

  onSubmit() {
    if (this.locationForm.invalid || this.isSubmitting) {
      return;
    }

    // Clear previous error
    this.errorMessage = null;
    this.isSubmitting = true;
    
    if (this.location?.config.mode === 'add') {
      this.addLocation();
    } else {
      this.updateLocation(this.location as DialogData);
    }
  }

  addLocation() {
    // Clean the form data - ensure all required fields are present
    const formValue = this.locationForm.getRawValue();
    
    // Validate required fields are not empty after trimming
    const name = (formValue.name || '').trim();
    const city = (formValue.city || '').trim();
    const state = (formValue.state || '').trim();
    const country = (formValue.country || 'USA').trim();
    
    if (!name || !city || !state || !country) {
      console.error('Required fields are missing or empty');
      this.isSubmitting = false;
      return;
    }
    
    // Build the request payload matching the backend DTO exactly
    // Only include optional fields if they have values (omit null/empty)
    const locationData: Record<string, string> = {
      name: name,
      city: city,
      state: state,
      country: country,
    };
    
    // Add optional fields only if they have values
    const address = formValue.address?.trim();
    if (address) {
      locationData['address'] = address;
    }
    
    const postalCode = formValue.postalCode?.trim();
    if (postalCode) {
      locationData['postalCode'] = postalCode;
    }
    
    console.log('Sending location data:', JSON.stringify(locationData, null, 2));
    
    this.locationService.addLocation(locationData).subscribe({
      next: (response: Location) => {
        console.log('Location added successfully:', response);
        this.isSubmitting = false;
        // Emit the response with the saved location data
        this.locationResponse.emit({ 
          title: this.location?.title || '',
          content: response,
          viewController: this.location?.viewController || overlayType.NODATA,
          config: this.location?.config || defaultTableConfig,
          returnToPage: this.location?.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error adding location:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        
        // Extract error message for display
        let errorMsg = '';
        
        if (error.error) {
          console.error('Error message:', error.error.message);
          console.error('Error details:', JSON.stringify(error.error, null, 2));
          
          // Handle validation errors
          if (error.error.fieldErrors && error.error.fieldErrors.length > 0) {
            console.error('Validation errors:', error.error.fieldErrors);
            const fieldErrors = error.error.fieldErrors.map((fe: { field: string; message: string }) => 
              `${fe.field}: ${fe.message}`
            ).join(', ');
            errorMsg = `Validation failed: ${fieldErrors}`;
            error.error.fieldErrors.forEach((fieldError: { field: string; rejectedValue: unknown; message: string }) => {
              console.error(`Field: ${fieldError.field}, Value: ${fieldError.rejectedValue}, Message: ${fieldError.message}`);
            });
          } else if (error.error.message) {
            // Handle business rule errors (like duplicate name)
            errorMsg = error.error.message;
          } else {
            errorMsg = 'Failed to add location. Please check the console for details.';
          }
        } else {
          errorMsg = 'Failed to add location. Unknown error occurred.';
        }
        
        this.errorMessage = errorMsg;
        this.isSubmitting = false;
        
        // Don't close dialog on error - let user see and fix the issue
        console.error('Error message to display:', this.errorMessage);
      }
    });
  }

  updateLocation(location: DialogData) {
    // Clean the form data - ensure all required fields are present
    const formValue = this.locationForm.getRawValue();
    
    // Validate required fields are not empty after trimming
    const name = (formValue.name || '').trim();
    const city = (formValue.city || '').trim();
    const state = (formValue.state || '').trim();
    const country = (formValue.country || 'USA').trim();
    
    if (!name || !city || !state || !country) {
      console.error('Required fields are missing or empty');
      this.isSubmitting = false;
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    
    const locationId = (location.content as Location)?.id;
    
    if (!locationId) {
      console.error('Location ID is required for update');
      this.isSubmitting = false;
      this.errorMessage = 'Location ID is missing.';
      return;
    }

    // Build the request payload matching the backend DTO exactly
    // Only include optional fields if they have values (omit null/empty)
    const locationData: Record<string, string | number> = {
      name: name,
      city: city,
      state: state,
      country: country,
    };
    
    // Add optional fields only if they have values
    const address = formValue.address?.trim();
    if (address) {
      locationData['address'] = address;
    }
    
    const postalCode = formValue.postalCode?.trim();
    if (postalCode) {
      locationData['postalCode'] = postalCode;
    }
    
    console.log('Updating location with data:', JSON.stringify(locationData, null, 2));

    this.locationService.updateLocation(locationId, locationData as Partial<Location>).subscribe({
      next: (response: Location) => {
        console.log('Location updated successfully:', response);
        this.isSubmitting = false;
        // Emit the response with the updated location data
        this.locationResponse.emit({ 
          title: location.title || '',
          content: response,
          viewController: location.viewController || overlayType.NODATA,
          config: location.config || defaultTableConfig,
          returnToPage: location.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error updating location:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        
        // Extract error message for display
        let errorMsg = '';
        
        if (error.error) {
          console.error('Error message:', error.error.message);
          console.error('Error details:', JSON.stringify(error.error, null, 2));
          
          // Handle validation errors
          if (error.error.fieldErrors && error.error.fieldErrors.length > 0) {
            console.error('Validation errors:', error.error.fieldErrors);
            const fieldErrors = error.error.fieldErrors.map((fe: { field: string; message: string }) => 
              `${fe.field}: ${fe.message}`
            ).join(', ');
            errorMsg = `Validation failed: ${fieldErrors}`;
            error.error.fieldErrors.forEach((fieldError: { field: string; rejectedValue: unknown; message: string }) => {
              console.error(`Field: ${fieldError.field}, Value: ${fieldError.rejectedValue}, Message: ${fieldError.message}`);
            });
          } else if (error.error.message) {
            // Handle business rule errors (like duplicate name)
            errorMsg = error.error.message;
          } else {
            errorMsg = 'Failed to update location. Please check the console for details.';
          }
        } else {
          errorMsg = 'Failed to update location. Unknown error occurred.';
        }
        
        this.errorMessage = errorMsg;
        this.isSubmitting = false;
        
        // Don't close dialog on error - let user see and fix the issue
        console.error('Error message to display:', this.errorMessage);
      }
    });
  }

  dialogClose() {
    this.locationResponse.emit({ 
      title: this.location?.title || '',
      content: {},
      viewController: this.location?.viewController || overlayType.NODATA,
      config: this.location?.config || defaultTableConfig
    } as DialogData);
  }

  isFieldInvalid(field: LocationFormField): boolean {
    const control = this.locationForm.get(field.formControlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isSubmitDisabled(): boolean {
    return this.locationForm.invalid || this.isSubmitting;
  }

  submitButtonText(): string {
    return this.location?.config.mode === 'edit' ? 'Update Location' : 'Create Location';
  }

  canDeleteLocation(): boolean {
    return (this.location?.config.mode === 'edit') && 
           (this.authService.isAdmin() || this.authService.isHRManager());
  }

  onDeleteClick(): void {
    if (!this.location?.content || !('id' in this.location.content)) {
      console.error('Location ID is required for deletion');
      return;
    }

    const locationId = (this.location.content as Location).id;
    const locationName = (this.location.content as Location).name || 'this location';

    // Open confirmation dialog
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Location',
        message: `Are you sure you want to delete "${locationName}"?`,
        warning: 'This action is irreversible and cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.deleteLocation(locationId);
      }
    });
  }

  deleteLocation(locationId: string): void {
    this.isSubmitting = true;
    this.errorMessage = null;

    this.locationService.deleteLocation(locationId).subscribe({
      next: () => {
        console.log('Location deleted successfully');
        this.isSubmitting = false;
        // Emit success response to close dialog and refresh list
        const deletedLocation = { id: locationId, deleted: true } as Partial<Location>;
        this.locationResponse.emit({
          title: this.location?.title || '',
          content: deletedLocation as Location,
          viewController: this.location?.viewController || overlayType.NODATA,
          config: this.location?.config || defaultTableConfig,
          returnToPage: this.location?.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error deleting location:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        
        let errorMsg = 'Failed to delete location. ';
        
        if (error.error) {
          if (error.error.message) {
            errorMsg += error.error.message;
          } else {
            errorMsg += 'Please check the console for details.';
          }
        } else {
          errorMsg += 'Unknown error occurred.';
        }
        
        this.errorMessage = errorMsg;
        this.isSubmitting = false;
      }
    });
  }
}

