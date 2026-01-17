import { Component, Input, OnChanges, SimpleChanges, ViewChild, Output, EventEmitter, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { ActionButtonObject, Column, FormMode, SortDirection, TableConfig, TableCellData } from '../../models/table';
import { defaultTableConfig } from './table.config';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayDialogComponent } from '../overlay-dialog/overlay-dialog.component';
import { SharedModule } from '../../shared.module';
import { NoDataComponent } from '../no-data/no-data.component';
import { Router } from '@angular/router';
import { filter, take, takeUntil, Subject, Subscription } from 'rxjs';
import { DialogData } from '../../models/dialog';
import { FilterOption } from '../../models/paginated-response.model';
import { AuthService } from '../../../core/services/auth.service';
import { FilterDialogComponent } from '../filter/components/filter-dialog/filter-dialog.component';
import { ActiveFilters, FilterEvent, RemoveFilterEvent } from '../../types/filter';

@Component({
  selector: 'app-table',
  imports: [MatTableModule, MatSortModule, CommonModule, SharedModule, NoDataComponent, FilterDialogComponent],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() inputData: TableCellData[] = [];
  @Input() tableConfig: TableConfig = defaultTableConfig;
  @Input() linkClickHandler?: (row: TableCellData, colKey: string) => void;
  @Input() totalElements = 0;
  @Input() useBackendPagination = false;
  @Input() currentPageIndex = 0;
  @Input() pageSize = 10;
  @Input() filters: Record<string, FilterOption[]> = {};
  @Input() activeFilters: ActiveFilters[] = [];
  @Input() enableAddButton = false;
  @Input() hasNext = false;
  @Input() hasPrevious = false;
  @Input() editActionHandler?: (row: TableCellData) => void;
  @Input() deleteActionHandler?: (row: TableCellData) => void;
  @Input() returnToPage?: string;
  @Input() loading = false;
  @Output() sortChange = new EventEmitter<{ active: string; direction: string }>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() applyFilter = new EventEmitter<FilterEvent>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() removeFilter = new EventEmitter<RemoveFilterEvent>();

  displayedColumns: string[] = [];
  dataSource!: MatTableDataSource<TableCellData>;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  dialogRef: MatDialogRef<OverlayDialogComponent> | undefined;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  @ViewChild(FilterDialogComponent) filterDialogComponent!: FilterDialogComponent;

  private destroy$ = new Subject<void>();
  private paginatorSubscription?: Subscription;
  private sortSubscription?: Subscription;
  private currentSortState: { active: string; direction: 'asc' | 'desc' } | null = null;

  constructor(
    public matDialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableConfig']) {
      this.handleTableConfig(changes['tableConfig'].currentValue);
    }

    if (changes['inputData']) {
      this.handleTableDataChange(changes['inputData'].currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    
    setTimeout(() => {
      if (this.sort && this.dataSource) {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
          return 0;
        };
      }
      if (this.paginator && this.dataSource && !this.useBackendPagination) {
        this.dataSource.paginator = this.paginator;
      }
      
      this.setupSortAndPagination();
      
      if (this.tableConfig.defaultSortColumn && this.sort) {
        const sortDirection = this.tableConfig.defaultSortDirection === SortDirection.DESC ? 'desc' : 'asc';
        this.sort.sort({ id: this.tableConfig.defaultSortColumn, start: sortDirection, disableClear: true });
      }
      
      if (this.sort) {
        this.sort.disableClear = true;
      }
    }, 0);
  }

  setupSortAndPagination(): void {
    if (this.sortSubscription) {
      this.sortSubscription.unsubscribe();
    }
    if (this.paginatorSubscription) {
      this.paginatorSubscription.unsubscribe();
    }

    if (this.sort) {
      this.sortSubscription = this.sort.sortChange.pipe(
        takeUntil(this.destroy$)
      ).subscribe((sort: Sort) => {
        if (!sort.active || sort.active.trim() === '') {
          return;
        }
        
        if (!sort.direction || sort.direction.trim() === '') {
          return;
        }
        
        const column = this.tableConfig.columns?.find(col => col.key === sort.active);
        if (column && column.sortable !== false) {
          const normalizedDirection = (sort.direction || '').toLowerCase().trim();
          
          let direction: 'ASC' | 'DESC';
          if (this.currentSortState && this.currentSortState.active === sort.active) {
            direction = this.currentSortState.direction === 'asc' ? 'DESC' : 'ASC';
          } else {
            direction = normalizedDirection === 'desc' ? 'DESC' : 'ASC';
          }
          
          this.currentSortState = {
            active: sort.active,
            direction: direction === 'DESC' ? 'desc' : 'asc'
          };
          
          this.sortChange.emit({
            active: sort.active,
            direction: direction
          });
        }
      });
    }

    if (this.paginator && this.useBackendPagination) {
      this.paginatorSubscription = this.paginator.page.pipe(
        takeUntil(this.destroy$)
      ).subscribe((pageEvent: PageEvent) => {
        if (pageEvent.pageSize !== this.pageSize) {
          this.pageSize = pageEvent.pageSize;
        }
        this.pageChange.emit(pageEvent);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.paginatorSubscription) {
      this.paginatorSubscription.unsubscribe();
    }
    if (this.sortSubscription) {
      this.sortSubscription.unsubscribe();
    }
  }

  handleTableConfig(config: TableConfig): void {
    this.addActionColumn();
    this.displayedColumns = config.columns?.map((column: Column) => column.key) || [];
    this.pageSizeOptions = config.pageSizeOptions ?? defaultTableConfig.pageSizeOptions ?? [];
  }

  addActionColumn() {
    if (!this.tableConfig?.columns) {
      return;
    }

    const hasActionColumn = this.tableConfig.columns.some((col: Column) => col.type === 'actionButtons');
    
    if (this.tableConfig.displayActionButtons && !hasActionColumn) {
      this.tableConfig.columns = [...this.tableConfig.columns, ActionButtonObject];
    } else if (!this.tableConfig.displayActionButtons && hasActionColumn) {
      this.tableConfig.columns = this.tableConfig.columns.filter((col: Column) => col.type !== 'actionButtons');
    }
  }

  handleTableDataChange(tabData: TableCellData[]): void {
    const genTableData = tabData.map((data: TableCellData) => {
      if ('firstName' in data && 'lastName' in data) {
        return {
          ...data,
          name: data.firstName + ' ' + data.lastName,
        };
      } else if ('name' in data) {
        return {
          ...data,
          name: data.name,
        };
      } else {
        return data;
      }
    });
    
    const currentSortActive = this.sort?.active || null;
    const currentSortDirection = this.sort?.direction || null;
    
    this.dataSource = new MatTableDataSource<TableCellData>(genTableData);
    
    if (this.sort) {
      this.dataSource.sort = this.sort;
      if (currentSortActive && currentSortDirection) {
        this.sort.sort({ id: currentSortActive, start: currentSortDirection as 'asc' | 'desc', disableClear: true });
      }
    }
    if (this.paginator && !this.useBackendPagination) {
      this.dataSource.paginator = this.paginator;
    }
    
    this.cdr.detectChanges();
    setTimeout(() => {
      this.setupSortAndPagination();
    }, 0);
  }

  isColSticky(column: Column): boolean {
    const stickyColumns = this.tableConfig.columns?.filter((col: Column) => col.isSticky);
    return stickyColumns?.includes(column) || false;
  }

  getColClass(column: Column, index: number): string {
    if (this.tableConfig.displayActionButtons && index === (this.tableConfig.columns?.length ?? 0) - 1) {
      return 'sticky-column-right';
    }
    if (column.isSticky) {
      const stickyIndex = this.tableConfig.columns?.filter((col) => col.isSticky).indexOf(column) ?? -1;
      return `sticky-column-left sticky-left-${stickyIndex}`;
    }
    return '';
  }

  onLinkClick(column: TableCellData): void {
    this.dialogClose();
    this.dialogRef = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: this.tableConfig.detailsCardTitle,
        content: column,
        viewController: this.tableConfig.viewController,
        config: this.tableConfig
      }
    });
    this.dialogRef.afterClosed().subscribe(result => {
      console.log('table component link afterClosed', result);
    });
  }

  onActionClick(action: string, data: TableCellData): void {
    console.log('action', action, data);
  }

  onEditAction(row: TableCellData): void {
    if (this.editActionHandler) {
      this.editActionHandler(row);
      return;
    }
    this.dialogClose();
    this.dialogRef = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: this.tableConfig.editCardTitle,
        content: row,
        viewController: this.tableConfig.editController,
        config: {
          ...this.tableConfig,
          mode: FormMode.EDIT
        },
        returnToPage: this.returnToPage,
        filters: this.filters
      } as DialogData
    });
  }

  onDeleteAction(row: TableCellData): void {
    if (this.deleteActionHandler) {
      this.deleteActionHandler(row);
      return;
    }

    console.warn('Delete action requested but no deleteActionHandler provided to table component');
  }

  onAddClick(): void {
    if (!this.canAddItem()) {
      return;
    }
    this.dialogClose();
    this.tableConfig.mode = FormMode.ADD;
    const currentUrl = this.router.url;
    let returnToPage: string | undefined;
    if (currentUrl.includes('/locations')) {
      returnToPage = 'locations';
    } else if (currentUrl.includes('/departments')) {
      returnToPage = 'departments';
    } else if (currentUrl.includes('/projects')) {
      returnToPage = 'projects';
    }
    
    this.dialogRef = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: this.tableConfig.additionCardTitle,
        content: {},
        viewController: this.tableConfig.additionController,
        config: this.tableConfig,
        returnToPage: returnToPage,
        filters: this.filters
      }
    });
    this.dialogRef.afterClosed().pipe(
      filter(result => !!result),
      take(1)
    ).subscribe((isClosedWithData: DialogData) => {
      if (isClosedWithData.content && 'id' in isClosedWithData.content) {
        if (this.tableConfig.additionCardTitle === 'Add Department' && isClosedWithData.returnToPage !== 'dashboard') {
          globalThis.window.dispatchEvent(new CustomEvent('departmentAdded'));
        } else if (this.tableConfig.additionCardTitle === 'Add Location' && isClosedWithData.returnToPage !== 'dashboard') {
          globalThis.window.dispatchEvent(new CustomEvent('locationAdded'));
        } else if (this.tableConfig.additionCardTitle === 'Add Employee' && isClosedWithData.returnToPage !== 'dashboard') {
          globalThis.window.dispatchEvent(new CustomEvent('employeeAdded'));
        } else if (this.tableConfig.additionCardTitle === 'Add Project' && isClosedWithData.returnToPage !== 'dashboard') {
          globalThis.window.dispatchEvent(new CustomEvent('projectAdded'));
        }
      }
    });
  }

  dialogClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }


  noData(): boolean {
    return !this.dataSource?.data?.length;
  }

  canAddItem(): boolean {
    if (!this.tableConfig.allowedRolesForAdd || this.tableConfig.allowedRolesForAdd.length === 0) {
      return this.tableConfig.allowAddButton ?? false;
    }
    return this.authService.hasAnyRole(this.tableConfig.allowedRolesForAdd);
  }

  getAddButtonTooltip(): string {
    if (this.canAddItem()) {
      return '';
    }
    if (this.tableConfig.addButtonTooltip) {
      return this.tableConfig.addButtonTooltip;
    }
    const roles = this.tableConfig.allowedRolesForAdd?.join(', ') || 'admins';
    return `This feature is only available for ${roles}`;
  }

  handleLinkClick(row: TableCellData, colKey: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.linkClickHandler) {
      this.linkClickHandler(row, colKey);
    } else {
      this.onLinkClick(row);
    }
  }

  onApplyFilter(filterEvent: FilterEvent): void {
    this.applyFilter.emit(filterEvent);
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }

  onRemoveFilter(event: RemoveFilterEvent): void {
    this.removeFilter.emit(event);
  }
}
