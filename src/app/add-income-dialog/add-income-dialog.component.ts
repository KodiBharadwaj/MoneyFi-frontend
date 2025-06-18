import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';

interface IncomeSource {
  id: number;
  source: string;
  amount: number;
  date: string;
  category: string;
  recurring: boolean;
  is_deleted: boolean;
}
@Component({
  selector: 'app-add-income-dialog',
  templateUrl: './add-income-dialog.component.html',
  styleUrls: ['./add-income-dialog.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    CommonModule
  ]
})
export class AddIncomeDialogComponent {
  incomeSource = {
    source: '',
    amount: '',
    date: new Date(),
    category: '',
    recurring: false,
  };

  dialogTitle: string;
  flag : boolean = false;
  incomeData : any;

  constructor(
    private httpClient:HttpClient,
    private router:Router,
    private toastr:ToastrService,
    public dialogRef: MatDialogRef<AddIncomeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    const dialogData = data || {};

    if (dialogData.isUpdate) {
      this.dialogTitle = 'Update Income';
      this.incomeSource = { ...dialogData };
      this.flag = true;

       this.incomeData = {
        id:dialogData.id,
        source:dialogData.source,
        date:dialogData.date,
        recurring:dialogData.recurring,
        category:dialogData.category,
        is_deleted:dialogData.is_deleted
      };
    } else {
      this.dialogTitle = 'Add New Income';
      this.incomeSource = {
        source: '',
        amount: '',
        date: new Date(),
        category: '',
        recurring: false,
      };
    }
  }

  baseUrl = environment.BASE_URL;
  today : Date = new Date();

  isValid(): boolean {
    return (
      this.incomeSource.source.trim() !== '' &&
      this.incomeSource.amount !== '' &&
      this.incomeSource.date !== null &&
      this.incomeSource.category.trim() !== ''
    );
  }

  capitalizeFirstLetter() {
    if (this.incomeSource.source && this.incomeSource.source.length > 0) {
      this.incomeSource.source = this.incomeSource.source.charAt(0).toUpperCase() + this.incomeSource.source.slice(1);
    }
  }
  

  onSave() {
    if (this.isValid()) {

      const incomeDataUpdated = {
        ...this.incomeData,
        amount:this.incomeSource.amount
      };
      
      if(this.flag == false){
        this.dialogRef.close(this.incomeSource);
      }
      else {
        this.httpClient.post<IncomeSource[]>(`${this.baseUrl}/api/v1/income/incomeUpdateCheck`, incomeDataUpdated).subscribe({
          next: (result) => {
            if (result) {
              this.dialogRef.close(this.incomeSource);
            } else {
              this.toastr.warning("Income can't be reduced too low due to expenses");
            }
          },
          error: (error) => {
            console.error('Failed to load income data:', error);
          }
        });
      }

    } else {
      alert('Please fill in all required fields before saving.');
    }
  }


  onCancel() {
    this.dialogRef.close();
  }
}
