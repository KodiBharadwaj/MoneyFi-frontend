import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AddGoalDialogComponent } from '../add-goal-dialog/add-goal-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CountUpDirective } from '../shared/directives/count-up.directive';
import { AddAmountGoalComponent } from '../add-amount-goal/add-amount-goal.component';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { environment } from '../../environments/environment';

interface Goal {
  id: number;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  deadLine: Date;
  category: string;
  goalStatus : string;
  daysRemaining : number;
  progressPercentage : number;
  icon: string;
  color: string
}

interface inputGoal {
  id: number;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  deadLine: Date;
  category: string;
  goalStatus: string;
  daysRemaining : number;
  progressPercentage : number;
}

@Component({
  selector: 'app-goals',
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss'],
  standalone: true,
  imports: [CommonModule, CountUpDirective]
})
export class GoalsComponent {

  constructor(private httpClient:HttpClient, private dialog: MatDialog, private router:Router, private toastr:ToastrService){};
  baseUrl = environment.BASE_URL;

  goals: Goal[] = [];
  loading: boolean = false;

  totalGoalSavings : number = 0;
  availableBalance : number = 0;
  totalGoalTargetAmount : number = 0;

  month : number = 0;
  year : number = 0;

  ngOnInit() {
    this.loadIncomeFunction();
    this.loadGoals();
  }

  loadIncomeFunction(){
    const currentDate = new Date();
    this.month = currentDate.getMonth()+1;
    this.year = currentDate.getFullYear();
  }

  
  loadGoals() {
    this.loading = true;

    this.httpClient.get<inputGoal[]>(`${this.baseUrl}/api/v1/goal/getGoalDetails`).subscribe({
      next: (data) => {
        // console.log(data);
        let amount = 0;
        if (data && data.length > 0) {

          this.goals = data.map(goal => {
            const convertedGoal = this.modelConverterFunction(goal);
            amount = amount + goal.currentAmount;
            this.loading = false;
            // console.log(amount);
            return convertedGoal;
          });
        } else {
          this.goals = [];
          this.toastr.warning('No goal data is available.', 'No Data');
          this.loading = false;
        }
        this.totalGoalSavings = amount;

        this.httpClient.get<number>(`${this.baseUrl}/api/v1/income/availableBalance`).subscribe({
          next : (availableBalance) => {
            this.availableBalance = availableBalance;
          },
          error : (error) => {
            console.log('Failed to get the overall available income details', error);
          }
        })

        this.httpClient.get<number>(`${this.baseUrl}/api/v1/goal/totalTargetGoalIncome`).subscribe({
          next: (totalTargetGoalIncome) => {
            this.totalGoalTargetAmount = totalTargetGoalIncome;
          }, 
          error : (error) => {
            console.log('Failed to get the total goal target amount', error);
          }
        })

      },
      error: (error) => {
        this.loading = false;
        console.error('Failed to load goal data:', error);
        if(error.status === 401){
            if (error.error === 'TokenExpired') {
              alert('Your session has expired. Please login again.');
              sessionStorage.removeItem('moneyfi.auth');
              this.router.navigate(['/']);
            } else if(error.error === 'Token is blacklisted'){
              alert('Your session has expired. Please login again.');
              sessionStorage.removeItem('moneyfi.auth');
              this.router.navigate(['/']);
            }
            else if(error.error === 'AuthorizationFailed'){
              alert('Service Unavailable!! Please try later');
            }
          } else if (error.status === 503){
            alert('Service Unavailable!! Please try later');
          }
      },
    });
  }

  addGoal() {
    const dialogRef = this.dialog.open(AddGoalDialogComponent, {
      width: '500px',
      panelClass: 'income-dialog',
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if(result.targetAmount > result.currentAmount){

          const formattedDate = this.formatDate(result.deadLine);
          const goalData = {
            ...result,
            deadLine:formattedDate,
          };

          if(goalData.currentAmount < this.availableBalance){
            this.httpClient.post<inputGoal>(`${this.baseUrl}/api/v1/goal/saveGoal`, goalData).subscribe({
              next: (newGoal) => {
                // const newGoalConverted = this.modelConverterFunction(newGoal); 
                // this.goals.push(newGoalConverted); 
                this.loadGoals();
                this.toastr.success('Goal ' + newGoal.goalName + ' added successfully');
              },
              error: (error) => {
                console.error('Failed to add goal data:', error);
                if(error.status === 401){
                  if (error.error === 'TokenExpired') {
                    alert('Your session has expired. Please login again.');
                    sessionStorage.removeItem('moneyfi.auth');
                    this.router.navigate(['/']);
                  } else if(error.error === 'Token is blacklisted'){
                    alert('Your session has expired. Please login again.');
                    sessionStorage.removeItem('moneyfi.auth');
                    this.router.navigate(['/']);
                  }
                  else if(error.error === 'AuthorizationFailed'){
                    alert('Service Unavailable!! Please try later');
                  }
                } else if (error.status === 503){
                  alert('Service Unavailable!! Please try later');
                }
              },
              complete: () => {
                this.loading = false;
              },
            });

          } else {
            alert("Cannot add the goal! Entered amount is greater than the available amount")
          }

        } else {
          this.toastr.warning("Target Amount is less than Initial amount");
        }
      }
    });
  }

  addAmount(id: number) {

    const dialogRef = this.dialog.open(AddAmountGoalComponent, {
      width: '300px',
      data: { id }
    });


    dialogRef.afterClosed().subscribe((amount) => {
      if (amount !== undefined && amount > 0 && amount < this.availableBalance) {

        this.httpClient.post<inputGoal>(`${this.baseUrl}/api/v1/goal/${id}/addAmount/${amount}`, null).subscribe({
            next: (response) => {
              
              this.toastr.success('Amount added successully');
              this.loadGoals();
            },
            error: (error) => {
              console.error('Error adding amount:', error);
              if(error.status === 401){
                if (error.error === 'TokenExpired') {
                  alert('Your session has expired. Please login again.');
                  sessionStorage.removeItem('moneyfi.auth');
                  this.router.navigate(['/']);
                } else if(error.error === 'Token is blacklisted'){
                  alert('Your session has expired. Please login again.');
                  sessionStorage.removeItem('moneyfi.auth');
                  this.router.navigate(['/']);
                }
                else if(error.error === 'AuthorizationFailed'){
                  alert('Service Unavailable!! Please try later');
                }
              } else if (error.status === 503){
                alert('Service Unavailable!! Please try later');
              }
            }
          });
      }else {
        alert("Entered money is greater than the remaining amount")
      }
    });
  }
  

  updateGoal(goal: any) {
    const dialogRef = this.dialog.open(AddGoalDialogComponent, {
      width: '500px',
      panelClass: 'income-dialog',
      data: { ...goal, isUpdate: true }, 
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {

        const formattedDate = this.formatDate(result.deadLine);
        const goalData = {
          ...result, 
          deadLine:formattedDate,
        };
        
        this.httpClient.put<any>(`${this.baseUrl}/api/v1/goal/${goal.id}`, goalData).subscribe({
          next: (updatedGoal) => {
            // const newGoalConverted = this.modelConverterFunction(updatedGoal); 
            // this.goals.push(newGoalConverted); 
            
            this.toastr.success("Goal " + updatedGoal.goalName + " has been updated");
            this.loadGoals();
          },
          error: (error) => {
            console.error('Failed to update goal data:', error);
            if(error.status === 401){
              if (error.error === 'TokenExpired') {
                alert('Your session has expired. Please login again.');
                sessionStorage.removeItem('moneyfi.auth');
                this.router.navigate(['/']);
              } else if(error.error === 'Token is blacklisted'){
                alert('Your session has expired. Please login again.');
                sessionStorage.removeItem('moneyfi.auth');
                this.router.navigate(['/']);
              }
              else if(error.error === 'AuthorizationFailed'){
                alert('Service Unavailable!! Please try later');
              }
            } else if (error.status === 503){
              alert('Service Unavailable!! Please try later');
            }
          },
          complete: () => {
            this.loading = false;
          },
        });
        
      }
    });
  }


  formatDate(date: string): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

 
  modelConverterFunction(data: inputGoal): Goal {
    let icon = '';
    let color = '';
    
    if (data.category === 'Vacation') {
      icon = 'fa-plane';
      color = '#2196F3';
    } else if (data.category === 'Savings') {
      icon = 'fa-shield-alt';
      color = '#4CAF50';
    } else if (data.category === 'Vehicle') {
      icon = 'fa-car';
      color = '#FF9800';
    } else if (data.category === 'Health') {
      icon = 'fa-heartbeat';
      color = '#E91E63';
    } else if (data.category === 'Education') {
      icon = 'fa-graduation-cap';
      color = '#673AB7';
    } else if (data.category === 'Home') {
      icon = 'fa-home';
      color = '#009688';
    } else if (data.category === 'Investments') { 
      icon = 'fa-chart-line'; 
      color = '#3F51B5';      
    } else if (data.category === 'Electronics') {
      icon = 'fa-laptop'; 
      color = '#00BCD4'; 
    } else {
      icon = 'fa-globe'; 
      color = '#607D8B'; 
    }
  
    return {
      id: data.id,
      goalName: data.goalName,
      currentAmount: data.currentAmount,
      targetAmount: data.targetAmount,
      deadLine: new Date(data.deadLine),
      category: data.category,
      goalStatus : data.goalStatus,
      daysRemaining : data.daysRemaining,
      progressPercentage : data.progressPercentage,
      icon: icon,
      color: color
    };
  } 

  deleteGoal(goalId : number){
    // console.log(goalId);
    const goalDataFetch = this.goals.find(i => i.id === goalId);
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      panelClass: 'custom-dialog-container',
      data: {...goalDataFetch, isGoal:true},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.httpClient.delete<void>(`${this.baseUrl}/api/v1/goal/${goalId}`)
        .subscribe({
          next: () => {
            // console.log(`Expense with ID ${goalId} deleted successfully.`);
            this.toastr.warning("Goal " + goalDataFetch?.goalName +" has been deleted");
            this.loadGoals(); // Reload the data after successful deletion
            this.loadIncomeFunction();
          },
          error: (err) => {
            console.error('Error deleting goal:', err);
          }
        });
      }
    });

  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

}