import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FilterOption } from '../../../../models/paginated-response.model';
import { ActiveFilters, FilterEvent, FilterValue } from '../../../../types/filter';
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
  @Output() removeFilter = new EventEmitter<string>();

  selectedFilterField = '';
  selectedFilterOperator = 'equals';
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
    if (!this.selectedFilterField || !this.selectedFilterOperator || this.selectedFilterValues.length === 0) {
      alert('Please select a filter field, operator, and at least one value');
      return;
    }

    const filterObjects = this.mapValuesToFilterObjects(this.selectedFilterField, this.selectedFilterValues);
    const operator = this.selectedFilterValues.length > 1 ? 'in' : this.selectedFilterOperator;

    this.applyFilter.emit({
      field: this.getProperFieldPath(this.selectedFilterField),
      operator: operator,
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
    this.selectedFilterOperator = 'equals';
    this.selectedFilterValues = [];
    this.filterDialogRef?.close();
  }

  /**
   * Remove a specific filter by field
   */
  onRemoveFilter(field: string): void {
    this.removeFilter.emit(field);
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
   * Get available operators
   */
  getAvailableOperators(): string[] {
    return ['equals', 'in', 'like', 'starts_with', 'ends_with', 'range', 'gt', 'lt', 'exists', 'not_equals', 'not_in', 'not_like'];
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
   * Get display labels for filter values
   */
  getFilterLabels(filterValues: unknown[]): string[] {
    return filterValues.map(v => {
      if (typeof v === 'string') {
        return v;
      } else if (v && typeof v === 'object' && 'label' in v) {
        return (v as unknown as { label: string }).label;
      }
      return String(v);
    });
  }

  /**
   * Get color class for filter chip
   */
  getFilterChipColorClass(field: string): string {
    const colorMap: Record<string, string> = {
      'location.id': 'chip-color-location',
      'location': 'chip-color-location',
      'name': 'chip-color-name',
      'status': 'chip-color-status',
      'department': 'chip-color-department'
    };
    return colorMap[field] || 'chip-color-default';
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
      'location.id': 'location.id',
      'location.name': 'location.name',
      'name': 'name'
    };
    return fieldMapping[fieldName] || fieldName;
  }
}
