import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CountUpDirective } from '../shared/directives/count-up.directive';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';

interface FinancialSummary {
  income: number;
  expenses: number;
  availableBalance : number;
  budget: number;
  netWorth: number;
  budgetProgress: number;
  goalsProgress: number;
  username: string;
}

interface Budget {
  id: number;
  category: string;
  moneyLimit: number;
  currentSpending: number;
  remaining:number;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatProgressBarModule, 
    MatIconModule,
    MatButtonModule,
    CountUpDirective
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {
  
  summary: FinancialSummary = {
    income: 0,
    expenses: 0,
    availableBalance : 0,
    budget: 0,
    netWorth: 0,
    budgetProgress: 0,
    goalsProgress: 0,
    username: ''
  };

  thisMonth = new Date().getMonth() + 1; // Current month in 1-based index
  thisYear = new Date().getFullYear(); // Current year

  constructor(private router: Router, private httpClient:HttpClient, private toastr:ToastrService) {}
  baseUrl = environment.BASE_URL;

  ngOnInit() {
    this.loadFinancialData();
  }

  private loadFinancialData() {

    this.httpClient.get(`${this.baseUrl}/api/v1/userProfile/getName`, {responseType : 'text'}).subscribe({
      next : (userName : string) => {
        this.summary.username = userName;
      },
      error : (error) => {
        console.log('Failed to get the user name', error);
      }
    })

    this.httpClient.get<number>(`${this.baseUrl}/api/v1/income/availableBalance`).subscribe({
      next : (availableBalance) => {
        this.summary.availableBalance = availableBalance;
      },
      error : (error) => {
        console.log('Failed to get the income details', error);
      }
    })

    this.httpClient.get<number>(`${this.baseUrl}/api/v1/expense/totalExpense/${this.thisMonth}/${this.thisYear}`).subscribe({
      next : (totalExpense) => {
        this.summary.expenses = totalExpense;
      },
      error : (error) => {
        console.log('Failed to get the expense details', error);
      }
    })


    this.httpClient.get<Budget[]>(`${this.baseUrl}/api/v1/budget/getBudgetDetails/all/${this.thisMonth}/${this.thisYear}`).subscribe({
      next : (budgetList) => {
        const totalBudget = budgetList.reduce((acc, budget) => acc + budget.moneyLimit, 0);
        this.summary.budget = totalBudget;
      },
      error : (error) => {
        console.log('Failed to get the total goal income details', error);
      }
    })

    this.httpClient.get<number>(`${this.baseUrl}/api/v1/budget/budgetProgress/${this.thisMonth}/${this.thisYear}`).subscribe({
      next : (totalBudgetIncome) => {
        this.summary.budgetProgress = parseFloat((totalBudgetIncome * 100).toFixed(2));;
      },
      error : (error) => {
        console.log('Failed to get the budget progress details', error);
      }
    })


    this.httpClient.get<number>(`${this.baseUrl}/api/v1/goal/totalCurrentGoalIncome`).subscribe({
      next : (totalCurrentGoalIncome) => {
        this.summary.netWorth = totalCurrentGoalIncome;
        
        this.httpClient.get<number>(`${this.baseUrl}/api/v1/goal/totalTargetGoalIncome`).subscribe({
          next: (totalTargetGoalIncome) => {
            this.summary.goalsProgress = parseFloat(((totalCurrentGoalIncome/totalTargetGoalIncome)*100).toFixed(2))
          }
        })
      },
      error : (error) => {
        console.log('Failed to get the total goal income details', error);
      }
    })
  }


  addExpenses() {
    this.router.navigate(['dashboard/expenses']);
  }

  createBudget() {
    this.router.navigate(['dashboard/budgets']);
  }

  viewAnalysis() {
    this.router.navigate(['dashboard/analysis']);
  }

}