import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableCellData, FormMode } from '../../../../shared/models/table';
import { LocationService } from '../../services/location.service';
import { locationListConfig } from './location-list.config';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '../../../../shared/models/location.model';
import { PaginatedResponse } from '../../../../shared/models/paginated-response.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { filter } from 'rxjs';
import { take } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TableComponent],
  providers: [LocationService, HttpClient],
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.css'],
})
export class LocationListComponent implements OnInit, OnDestroy {
  locations: Location[] = [];
  tableData: TableCellData[] = [];
  tableConfig = locationListConfig;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;
  currentSortColumn = '';
  currentSortDirection = 'ASC';
  private isRefreshing = false; // Guard to prevent duplicate refresh calls
  private locationAddedHandler?: () => void; // Store handler reference for cleanup

  // Custom handler for location name click - navigates to location details page
  onLocationNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'name' && row.id) {
      this.router.navigate(['/locations', row.id]);
    }
  };

  constructor(
    private readonly locationService: LocationService,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  canEditLocation(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  ngOnInit(): void {
    // Enable action buttons for admins and HR managers
    this.tableConfig.displayActionButtons = this.canEditLocation();
    
    // Load with default sort from config
    if (this.tableConfig.defaultSortColumn) {
      this.currentSortColumn = this.tableConfig.defaultSortColumn;
      this.currentSortDirection = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    }
    this.loadLocations(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    
    // Listen only for add operations from table component (edit/delete handled by afterClosed())
    // Store handler reference so we can remove it later
    this.locationAddedHandler = () => {
      this.loadLocations(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    };
    
    globalThis.window.addEventListener('locationAdded', this.locationAddedHandler);
  }

  openEditDialog(location: Location): void {
    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.tableConfig.editCardTitle,
        content: location,
        viewController: overlayType.EDITLOCATION,
        config: {
          ...this.tableConfig,
          mode: FormMode.EDIT
        },
        returnToPage: 'locations'
      } as DialogData
    });

    // Use take(1) to ensure the subscription only fires once
    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && 'id' in result.content),
      take(1)
    ).subscribe(() => {
      // Guard to prevent duplicate refresh calls
      if (this.isRefreshing) {
        return;
      }
      this.isRefreshing = true;
      
      // Refresh the location list after update or delete
      this.loadLocations(this.currentPage, this.pageSize);
      
      // Reset flag after a short delay to allow the refresh to complete
      setTimeout(() => {
        this.isRefreshing = false;
      }, 500);
    });
  }

  openViewDialog(location: Location): void {
    this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.tableConfig.detailsCardTitle,
        content: location,
        viewController: overlayType.DISPLAYLOCATION,
        config: this.tableConfig
      } as DialogData
    });
  }


  ngOnDestroy(): void {
    // Clean up event listener to prevent memory leaks and duplicate calls
    if (this.locationAddedHandler) {
      globalThis.window.removeEventListener('locationAdded', this.locationAddedHandler);
      this.locationAddedHandler = undefined;
    }
  }

  loadLocations(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
    this.locationService.queryLocations(page, size, sortBy, sortDir).subscribe({
      next: (response: PaginatedResponse<Location>) => {
        this.locations = response.content || [];
        this.currentPage = response.page || 0;
        this.pageSize = response.size || 10;
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.hasNext = response.hasNext ?? false;
        this.hasPrevious = response.hasPrevious ?? false;
        
        this.tableData = this.locations?.map(loc => ({
          ...loc,
          name: loc.name,
          city: loc.city || '',
          state: loc.state || '',
          country: loc.country || 'USA',
          address: loc.address || '',
          postalCode: loc.postalCode || '',
        }));
      },
      error: () => {
        // Error handled by global error handler or service
      }
    });
  }

  onSortChange(event: { active: string; direction: string }): void {
    this.currentSortColumn = event.active;
    this.currentSortDirection = event.direction === 'ASC' || event.direction === 'asc' ? 'ASC' : 'DESC';
    // Reset to first page when sorting changes
    this.currentPage = 0;
    this.loadLocations(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    // Reset to first page if page size changed
    const pageSizeChanged = this.pageSize !== event.pageSize;
    this.currentPage = pageSizeChanged ? 0 : event.pageIndex;
    this.pageSize = event.pageSize;
    // Use current sort settings when loading
    this.loadLocations(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  openDeleteDialog(location: Location): void {
    const locationName = location.name || 'this location';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Location',
        message: `Are you sure you want to delete "${locationName}"?`,
        warning: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result && location.id) {
        this.locationService.deleteLocation(location.id).subscribe({
          next: () => {
            this.loadLocations(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
          },
          error: (error: unknown) => {
            console.error('Error deleting location:', error);
            alert('Failed to delete location. Please try again.');
          }
        });
      }
    });
  }

  // Handler methods for table component
  onEditAction = (row: TableCellData): void => {
    const location = row as unknown as Location;
    this.openEditDialog(location);
  }

  onDeleteAction = (row: TableCellData): void => {
    const location = row as unknown as Location;
    this.openDeleteDialog(location);
  }
}

