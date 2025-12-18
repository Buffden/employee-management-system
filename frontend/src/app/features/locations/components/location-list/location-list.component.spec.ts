import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { LocationListComponent } from './location-list.component';
import { LocationService } from '../../services/location.service';
import { PaginatedResponse } from '../../../../shared/models/paginated-response.model';
import { Location } from '../../../../shared/models/location.model';

describe('LocationListComponent', () => {
  let component: LocationListComponent;
  let fixture: ComponentFixture<LocationListComponent>;
  let locationService: jasmine.SpyObj<LocationService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const mockLocations: Location[] = [
    {
      id: '1',
      name: 'Location 1',
      address: '123 Main St',
      city: 'City',
      state: 'State',
      country: 'Country',
      zipCode: '12345'
    } as Location
  ];

  const mockPaginatedResponse: PaginatedResponse<Location> = {
    content: mockLocations,
    totalElements: 1,
    totalPages: 1,
    page: 0,
    size: 10,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const locationServiceSpy = jasmine.createSpyObj('LocationService', ['queryLocations']);
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [LocationListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: LocationService, useValue: locationServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LocationListComponent);
    component = fixture.componentInstance;
    locationService = TestBed.inject(LocationService) as jasmine.SpyObj<LocationService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    locationService.queryLocations.and.returnValue(of(mockPaginatedResponse));

    // Mock dialog ref
    const mockDialogRef = {
      afterClosed: () => of(null),
      close: jasmine.createSpy('close')
    };
    matDialog.open.and.returnValue(mockDialogRef as any);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default sort from config', () => {
    fixture.detectChanges();

    expect(component.currentSortColumn).toBe('name');
    expect(component.currentSortDirection).toBe('ASC');
    expect(locationService.queryLocations).toHaveBeenCalledWith(
      0,
      10,
      'name',
      'ASC'
    );
  });

  it('should load locations on init', () => {
    fixture.detectChanges();

    expect(locationService.queryLocations).toHaveBeenCalled();
    expect(component.locations.length).toBe(1);
    expect(component.totalElements).toBe(1);
  });

  it('should handle sort change and reset to page 0', () => {
    fixture.detectChanges();
    component.currentPage = 2; // Simulate being on page 2
    locationService.queryLocations.calls.reset();
    locationService.queryLocations.and.returnValue(of(mockPaginatedResponse));

    component.onSortChange({ active: 'name', direction: 'DESC' });

    expect(component.currentSortColumn).toBe('name');
    expect(component.currentSortDirection).toBe('DESC');
    expect(component.currentPage).toBe(0); // Should reset to page 0
    expect(locationService.queryLocations).toHaveBeenCalledWith(
      0,
      10,
      'name',
      'DESC'
    );
  });

  it('should normalize sort direction to uppercase', () => {
    fixture.detectChanges();
    locationService.queryLocations.calls.reset();
    locationService.queryLocations.and.returnValue(of(mockPaginatedResponse));

    component.onSortChange({ active: 'name', direction: 'asc' }); // lowercase

    expect(component.currentSortDirection).toBe('ASC');
    expect(locationService.queryLocations).toHaveBeenCalledWith(
      0,
      10,
      'name',
      'ASC'
    );
  });

  it('should handle page change and preserve sort state', () => {
    fixture.detectChanges();
    component.currentSortColumn = 'name';
    component.currentSortDirection = 'DESC';
    locationService.queryLocations.calls.reset();
    locationService.queryLocations.and.returnValue(of(mockPaginatedResponse));

    component.onPageChange({ pageIndex: 1, pageSize: 20 });

    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(20);
    // Verify service was called with correct sort parameters
    expect(locationService.queryLocations).toHaveBeenCalledWith(
      1,
      20,
      'name',
      'DESC' // Should preserve sort state
    );
  });

  it('should reset to page 0 when page size changes', () => {
    fixture.detectChanges();
    component.currentPage = 2;
    component.pageSize = 10;
    component.currentSortColumn = 'name';
    component.currentSortDirection = 'ASC';
    locationService.queryLocations.calls.reset();
    locationService.queryLocations.and.returnValue(of(mockPaginatedResponse));

    component.onPageChange({ pageIndex: 2, pageSize: 25 }); // pageSize changed

    expect(component.currentPage).toBe(0); // Should reset to page 0
    expect(component.pageSize).toBe(25);
    // Verify service was called with correct sort parameters
    expect(locationService.queryLocations).toHaveBeenCalledWith(
      0,
      25,
      'name',
      'ASC' // Should preserve sort state
    );
  });

  it('should cleanup event listener on destroy', () => {
    fixture.detectChanges();
    
    const removeEventListenerSpy = spyOn(globalThis.window, 'removeEventListener');

    component.ngOnDestroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('locationAdded', jasmine.any(Function));
  });
});
