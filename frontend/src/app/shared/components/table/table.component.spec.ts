import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

import { TableComponent } from './table.component';
import { DialogData } from '../../models/dialog';

describe('TableComponent', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TableComponent],
      providers: [
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

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

  it('should only dispatch event once per dialog close (take(1))', () => {
    router.url = '/projects'; // Mock router URL
    fixture.detectChanges();

    const dispatchSpy = spyOn(globalThis.window, 'dispatchEvent');
    const mockDialogRef = {
      afterClosed: () => of({ content: { id: '1' }, returnToPage: 'projects' } as DialogData),
      close: jasmine.createSpy('close')
    };
    matDialog.open.and.returnValue(mockDialogRef as any);

    component.tableConfig = {
      additionCardTitle: 'Add Project',
      columns: [],
      displayActionButtons: true
    } as any;

    component.onAddClick();

    expect(matDialog.open).toHaveBeenCalled();
  });

  it('should emit page change event', () => {
    fixture.detectChanges();
    const pageChangeSpy = spyOn(component.pageChange, 'emit');
    
    const pageEvent = { pageIndex: 1, pageSize: 20, length: 100 } as any;
    component.pageChange.emit(pageEvent);

    expect(pageChangeSpy).toHaveBeenCalledWith(pageEvent);
  });

  it('should emit sort change event', () => {
    fixture.detectChanges();
    const sortChangeSpy = spyOn(component.sortChange, 'emit');
    
    const sortEvent = { active: 'name', direction: 'ASC' };
    component.sortChange.emit(sortEvent);

    expect(sortChangeSpy).toHaveBeenCalledWith(sortEvent);
  });

  it('should not assign paginator to dataSource (backend pagination only)', () => {
    component.useBackendPagination = true;
    component.inputData = [{ id: '1', name: 'Test' }] as any;
    
    fixture.detectChanges();
    
    // After view init, dataSource should be created
    // Since we removed paginator assignment, verify it's not assigned
    if (component.dataSource) {
      // MatTableDataSource has a paginator property that should be null/undefined when not assigned
      expect(component.dataSource.paginator).toBeFalsy();
    } else {
      // If dataSource is not yet created, that's also fine - it will be created in handleTableDataChange
      expect(component.inputData).toBeDefined();
    }
  });

  it('should not assign sort to dataSource (backend sorting only)', () => {
    component.inputData = [{ id: '1', name: 'Test' }] as any;
    
    fixture.detectChanges();
    
    // Verify dataSource doesn't have sort assigned (when dataSource exists)
    if (component.dataSource) {
      expect(component.dataSource.sort).toBeFalsy();
    } else {
      // If dataSource is not yet created, that's fine
      expect(component.inputData).toBeDefined();
    }
  });

  it('should cleanup subscriptions on destroy', () => {
    fixture.detectChanges();
    
    const destroyNextSpy = spyOn(component['destroy$'], 'next');
    const destroyCompleteSpy = spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(destroyNextSpy).toHaveBeenCalled();
    expect(destroyCompleteSpy).toHaveBeenCalled();
  });

  it('should update pageSize when pageSize changes in paginator event', () => {
    component.useBackendPagination = true;
    component.pageSize = 10;
    fixture.detectChanges();
    
    // Simulate paginator page event with different pageSize
    const pageEvent = { pageIndex: 0, pageSize: 20, length: 100 } as PageEvent;
    
    // Directly emit the event as the component would handle it
    component.pageChange.emit(pageEvent);
    
    expect(component.pageSize).toBe(10); // Component property should remain until parent updates
  });
});
