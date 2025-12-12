import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="confirmation-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p class="message">{{ data.message }}</p>
        <p *ngIf="data.warning" class="warning">{{ data.warning }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      padding: 0;
    }
    
    h2[mat-dialog-title] {
      margin: 0 0 16px 0;
      color: #333;
    }
    
    mat-dialog-content {
      padding: 16px 24px;
      min-height: 80px;
    }
    
    .message {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #333;
    }
    
    .warning {
      margin: 12px 0 0 0;
      padding: 12px;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      color: #856404;
      font-size: 14px;
      font-weight: 500;
    }
    
    mat-dialog-actions {
      padding: 8px 24px 16px;
      margin: 0;
    }
    
    button {
      margin-left: 8px;
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

