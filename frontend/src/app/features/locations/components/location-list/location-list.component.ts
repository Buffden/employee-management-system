import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TableComponent],
  providers: [LocationService, HttpClient],
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.css'],
})
export class LocationListComponent implements OnInit {
  locations: Location[] = [];
  tableData: TableCellData[] = [];
  tableConfig = locationListConfig;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  private isRefreshing = false; // Guard to prevent duplicate refresh calls

  // Custom handler for location name click - opens edit dialog
  onLocationNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'name') {
      // Check if user has permission to edit (HR Manager or Admin)
      if (this.canEditLocation()) {
        this.openEditDialog(row as Location);
      } else {
        // If no edit permission, just show details view
        this.openViewDialog(row as Location);
      }
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

  ngOnInit(): void {
    // Load with default sort from config
    const defaultSortColumn = this.tableConfig.defaultSortColumn;
    const defaultSortDir = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    this.loadLocations(0, this.pageSize, defaultSortColumn, defaultSortDir);
    
    // Listen only for add operations from table component (edit/delete handled by afterClosed())
    globalThis.window.addEventListener('locationAdded', () => {
      this.loadLocations(this.currentPage, this.pageSize);
    });
  }

  loadLocations(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
    this.locationService.queryLocations(page, size, sortBy, sortDir).subscribe({
      next: (response: PaginatedResponse<Location>) => {
        this.locations = response.content || [];
        this.currentPage = response.page || 0;
        this.pageSize = response.size || 10;
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        
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
    const sortDir = event.direction === 'ASC' || event.direction === 'asc' ? 'ASC' : 'DESC';
    this.loadLocations(this.currentPage, this.pageSize, event.active, sortDir);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLocations(this.currentPage, this.pageSize);
  }
}

