import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FilterComponent } from '../filter/filter.component';
import { ActiveFilters, FilterEvent } from '../../../../types/filter';
import { FilterOption } from '../../../../models/paginated-response.model';

@Component({
  selector: 'app-filter-dialog',
  imports: [FilterComponent],
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.css']
})
export class FilterDialogComponent {
  @Input() filters: Record<string, FilterOption[]> = {};
  @Input() activeFilters: ActiveFilters[] = [];
  
  @Output() applyFilter = new EventEmitter<FilterEvent>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() removeFilter = new EventEmitter<string>();

  @ViewChild(FilterComponent) filterComponent!: FilterComponent;

  constructor() {
    console.log('FilterDialogComponent initialized');
    console.log('Available filters:', this.filters);
    console.log('Active filters:', this.activeFilters);
  }

  // Method to handle apply filter from child filter component
  onApplyFilter(event: FilterEvent): void {
    this.applyFilter.emit(event);
  }

  // Method to handle remove filter from child filter component
  onRemoveFilter(field: string): void {
    this.removeFilter.emit(field);
  }

  // Method to handle clear filters from child filter component
  onClearFilters(): void {
    this.clearFilters.emit();
  }

}
