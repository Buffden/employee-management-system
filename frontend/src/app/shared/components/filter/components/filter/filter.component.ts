import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FilterOption } from '../../../../models/paginated-response.model';
import { ActiveFilters, FilterEvent, FilterValue, RemoveFilterEvent } from '../../../../types/filter';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent {
  @Input() availableFilters: Record<string, FilterOption[]> = {};
  @Input() activeFilters: ActiveFilters[] = [];
  @Input() allowFiltering = true;

  @Output() applyFilter = new EventEmitter<FilterEvent>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() removeFilter = new EventEmitter<RemoveFilterEvent>();

  selectedFilterField = '';
  selectedFilterValues: string[] = [];
  private filterDialogRef?: MatDialogRef<unknown>;

  constructor(private matDialog: MatDialog) { }

  /**
   * Open filter dialog with template
   */
  openFilterDialog(template: TemplateRef<unknown>): void {
    this.filterDialogRef = this.matDialog.open(template, {
      width: '720px',
      autoFocus: false
    });
  }

  /**
   * Apply filter and close dialog
   */
  applyFilterAndClose(): void {
    if (!this.selectedFilterField || this.selectedFilterValues.length === 0) {
      alert('Please select a filter field and at least one value');
      return;
    }

    const filterObjects = this.mapValuesToFilterObjects(this.selectedFilterField, this.selectedFilterValues);

    this.applyFilter.emit({
      field: this.getProperFieldPath(this.selectedFilterField),
      values: filterObjects,
      displayField: this.selectedFilterField
    });

    this.filterDialogRef?.close();
  }

  /**
   * Clear all filters and close dialog
   */
  clearFiltersAndClose(): void {
    this.clearFilters.emit();
    this.selectedFilterField = '';
    this.selectedFilterValues = [];
    this.filterDialogRef?.close();
  }

  /**
   * Remove a specific filter by field
   */
  onRemoveFilter(field: string, value: unknown): void {
    this.removeFilter.emit({ field, value });
  }

  /**
   * Toggle filter value selection
   */
  toggleFilterValue(value: string): void {
    const index = this.selectedFilterValues.indexOf(value);
    if (index > -1) {
      this.selectedFilterValues.splice(index, 1);
    } else {
      this.selectedFilterValues.push(value);
    }
  }

  /**
   * Check if filter value is selected
   */
  isFilterValueSelected(value: string): boolean {
    return this.selectedFilterValues.includes(value);
  }



  /**
   * Get available filter fields
   */
  getAvailableFilterFields(): string[] {
    return Object.keys(this.availableFilters) || ['name', 'location', 'status'];
  }

  /**
   * Handle filter field change
   */
  onFilterFieldChange(): void {
    this.selectedFilterValues = [];
  }

  /**
   * Get display label for a single filter value
   */
  getFilterLabel(filterValue: unknown): string {
    if (typeof filterValue === 'string') {
      return filterValue;
    }

    if (filterValue && typeof filterValue === 'object' && 'label' in filterValue) {
      return (filterValue as { label: string }).label;
    }

    return String(filterValue);
  }

  /**
   * Map selected filter values to filter objects with id+label
   */
  private mapValuesToFilterObjects(fieldName: string, labels: string[]): FilterValue[] {
    const filterOptions = this.availableFilters[fieldName];
    if (!filterOptions) {
      console.warn(`No filter options found for field: ${fieldName}`);
      return labels.map(label => ({ id: label, label: label }));
    }

    return labels.map(label => {
      const option = filterOptions.find(opt => opt.label === label || opt.value === label);
      return {
        id: option ? option.id : label,
        label: label
      };
    });
  }

  /**
   * Get proper field path for backend filtering
   */
  private getProperFieldPath(fieldName: string): string {
    const fieldMapping: Record<string, string> = {
      'locations': 'location.id',
      'location': 'location.id',
      'departments': 'department.id',
      'department': 'department.id',
      'designations': 'designation',
      'designation': 'designation'
    };
    return fieldMapping[fieldName] || fieldName;
  }
}
