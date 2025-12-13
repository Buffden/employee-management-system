import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, ControlValueAccessor } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, Subject, takeUntil, Observable } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

export interface TypeaheadConfig<T = any> {
  // Search function that returns Observable<T[]>
      searchFn: (searchTerm: string, filters?: Record<string, unknown>) => Observable<T[]>;
  // Function to get item by ID
  getByIdFn?: (id: string) => Observable<T>;
  // Function to display the selected item
  displayFn: (item: T | null) => string;
  // Function to get the ID from an item
  getIdFn: (item: T) => string;
  // Optional: Custom template for displaying items in dropdown
  itemTemplate?: (item: T) => string;
  // Minimum characters before searching (default: 2)
  minSearchLength?: number;
  // Debounce time in ms (default: 300)
  debounceTime?: number;
  // No results message (default: 'No results found')
  noResultsMessage?: string;
}

@Component({
  selector: 'app-typeahead',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule, MatAutocompleteModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TypeaheadComponent),
      multi: true
    }
  ],
  templateUrl: './typeahead.component.html',
  styleUrls: ['./typeahead.component.css']
})
export class TypeaheadComponent<T = any> implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() config!: TypeaheadConfig<T>;
  @Input() placeholder = 'Search...';
  @Input() required = false;
  @Input() label = 'Select';
  @Input() disabled = false;
  @Input() filters?: Record<string, unknown>; // Optional filters to pass to search function
  
  @Output() itemSelected = new EventEmitter<T | null>();

  searchControl = new FormControl<T | string | null>(null);
  filteredItems: T[] = [];
  selectedItem: T | null = null;
  isLoading = false;
  private readonly destroy$ = new Subject<void>();
  
  // Map to store items by their ID for quick lookup
  private readonly itemsById = new Map<string, T>();

  // ControlValueAccessor implementation
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {}

  // Arrow function to preserve 'this' context for displayWith
  displayItemFn = (item: T | string | null | undefined): string => {
    // If item is undefined or null, try to use selectedItem
    if ((item === null || item === undefined) && this.selectedItem) {
      return this.config?.displayFn(this.selectedItem) || '';
    }
    return this.displayItem(item);
  };

  ngOnInit(): void {
    if (!this.config) {
      console.error('TypeaheadComponent: config is required');
      return;
    }

    const minLength = this.config.minSearchLength ?? 2;
    const debounce = this.config.debounceTime ?? 300;

    // Debounce search input and fetch items
    this.searchControl.valueChanges
      .pipe(
        debounceTime(debounce),
        distinctUntilChanged(),
        switchMap((searchTerm: T | string | null) => {
          // If searchTerm is an object (selected item), don't search
          if (searchTerm && typeof searchTerm !== 'string') {
            this.filteredItems = [];
            return of([]);
          }
          const searchString = searchTerm as string | null;
          if (!searchString || searchString.trim().length < minLength) {
            this.filteredItems = [];
            return of([]);
          }
          this.isLoading = true;
          return this.config.searchFn(searchString.trim(), this.filters).pipe(
            catchError((error) => {
              console.error('Typeahead search error:', error);
              this.isLoading = false;
              return of([]);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((items: T[]) => {
        this.filteredItems = items;
        // Store items in map for quick lookup by ID
        items.forEach(item => {
          const id = this.config.getIdFn(item);
          this.itemsById.set(id, item);
        });
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayItem(item: T | string | null | undefined): string {
    if (!this.config) {
      return '';
    }
    
    // If item is null/undefined, try to use selectedItem
    if (item === null || item === undefined) {
      if (this.selectedItem) {
        return this.config.displayFn(this.selectedItem);
      }
      return '';
    }
    
    // If item is a string (ID), try to find the actual item
    if (typeof item === 'string') {
      const foundItem = this.itemsById.get(item) ?? this.selectedItem;
      if (foundItem) {
        return this.config.displayFn(foundItem);
      }
      return '';
    }
    
    // If item is the actual object, use it directly
    return this.config.displayFn(item);
  }

  onItemSelected(item: T | null): void {
    if (!item) {
      this.selectedItem = null;
      this.searchControl.setValue(null, { emitEvent: false });
      this.onChange(null);
      this.itemSelected.emit(null);
      return;
    }
    
    this.selectedItem = item;
    const value = this.config.getIdFn(item);
    
    // Store the item in the map for displayWith lookup
    this.itemsById.set(value, item);
    
    // Update the form control value first (this triggers displayWith)
    this.searchControl.setValue(item, { emitEvent: false });
    
    // Then notify parent form of the ID change
    this.onChange(value);
    this.itemSelected.emit(item);
  }

  onInputBlur(): void {
    this.onTouched();
    
    // If search control doesn't match selected item, restore it
    if (this.selectedItem && this.searchControl.value !== this.displayItem(this.selectedItem)) {
      const minLength = this.config.minSearchLength ?? 2;
      // User might be typing, so don't clear if they're still searching
      const currentValue = this.searchControl.value;
      if (!currentValue || (typeof currentValue === 'string' && currentValue.trim().length < minLength)) {
        this.searchControl.setValue(this.selectedItem, { emitEvent: false });
      }
    }
  }

  clearSelection(): void {
    this.selectedItem = null;
    this.searchControl.setValue(null);
    this.onChange(null);
    this.itemSelected.emit(null);
  }

  getItemDisplay(item: T): string {
    if (this.config.itemTemplate) {
      return this.config.itemTemplate(item);
    }
    return this.displayItem(item);
  }

  // Helper method to check if search control value is a string and meets minimum length
  isSearchValueValid(): boolean {
    const value = this.searchControl.value;
    if (!value || typeof value !== 'string') {
      return false;
    }
    const minLength = this.config?.minSearchLength ?? 2;
    return value.length >= minLength;
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    if (value) {
      // Check if we already have this item in our map
      const existingItem = this.itemsById.get(value);
      if (existingItem) {
        this.selectedItem = existingItem;
        this.searchControl.setValue(existingItem, { emitEvent: false });
        return;
      }
      
      // Check if selectedItem matches the value
      if (this.selectedItem) {
        const selectedId = this.config.getIdFn(this.selectedItem);
        if (selectedId === value) {
          this.itemsById.set(value, this.selectedItem);
          this.searchControl.setValue(this.selectedItem, { emitEvent: false });
          return;
        }
      }
      
      // Load item by ID if value is provided and getByIdFn is configured
      if (this.config.getByIdFn) {
        this.config.getByIdFn(value).subscribe({
          next: (item) => {
            this.selectedItem = item;
            // Store in map for displayWith
            this.itemsById.set(value, item);
            // Set the item object as the form control value so displayWith works
            this.searchControl.setValue(item, { emitEvent: false });
          },
          error: () => {
            // If item not found, clear selection
            this.selectedItem = null;
            this.searchControl.setValue(null);
          }
        });
      } else {
        // If no getByIdFn, we can't load the item, so clear
        this.selectedItem = null;
        this.searchControl.setValue(null);
      }
    } else {
      this.selectedItem = null;
      this.searchControl.setValue(null);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }
}

