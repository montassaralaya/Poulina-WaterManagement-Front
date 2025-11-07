import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';

import { WaterConsumptionDashboardService, WaterConsumptionResponse } from './services/water-consumption-dashboard.service';
import { BranchDashboardService, Branch } from './services/branch-dashboard.service';
import { WaterMeterDashboardService, WaterMeterResponse } from './services/water-meter-dashboard.service';

// Import chart components
import { YearlyConsumptionChartComponent } from './yearly-consumption-chart/yearly-consumption-chart.component';
import { WaterCostChartComponent } from './water-cost-chart/water-cost-chart.component';
import { ConsumptionHeatmapChartComponent } from './consumption-heatmap-chart/consumption-heatmap-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatTabsModule, // Add MatTabsModule
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    RouterModule,
    YearlyConsumptionChartComponent,
    WaterCostChartComponent,
    ConsumptionHeatmapChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  title = 'Poulina-WaterManagement-Front';
  isLoggedIn = false;

  // Dashboard statistics
  totalConsumption: number = 0;
  totalBranches: number = 0;
  totalRecords: number = 0;
  averageConsumption: number = 0;
  totalWaterCost: number = 0;
  isLoading: boolean = true;

  // Year selection
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  // Chart tabs
  selectedChartTab = 0;
  chartTabs = [
    { label: '📊 Monthly Consumption', icon: 'bar_chart', component: 'consumption' },
    { label: '💰 Cost Analysis', icon: 'trending_up', component: 'cost' },
    { label: '🌡️ Branch Heatmap', icon: 'grid_on', component: 'heatmap' }
  ];

  // Recent activity data
  recentActivity: any[] = [];
  allData: WaterConsumptionResponse[] = [];

  // Branch and Water Meter data
  branches: Map<string, Branch> = new Map();
  waterMeters: Map<string, WaterMeterResponse> = new Map();

  constructor(
    private router: Router,
    private waterConsumptionService: WaterConsumptionDashboardService,
    private branchService: BranchDashboardService,
    private waterMeterService: WaterMeterDashboardService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    Promise.all([
      this.loadWaterConsumptionData(),
      this.loadBranchData(),
      this.loadWaterMeterData()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private loadWaterConsumptionData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.waterConsumptionService.getAll().subscribe({
        next: (data: WaterConsumptionResponse[]) => {
          this.allData = data;
          this.calculateStatistics(data);
          this.extractAvailableYears(data);
          this.generateRecentActivity(data);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load water consumption data:', err);
          reject(err);
        }
      });
    });
  }

  private loadBranchData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.branchService.getBranches().subscribe({
        next: (branches: Branch[]) => {
          this.branches.clear();
          branches.forEach(branch => {
            this.branches.set(branch.id, branch);
          });
          resolve();
        },
        error: (err) => {
          console.error('Failed to load branch data:', err);
          reject(err);
        }
      });
    });
  }

  private loadWaterMeterData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.waterMeterService.getAll().subscribe({
        next: (waterMeters: WaterMeterResponse[]) => {
          this.waterMeters.clear();
          waterMeters.forEach(meter => {
            this.waterMeters.set(meter.id, meter);
          });
          resolve();
        },
        error: (err: any) => {
          console.error('Failed to load water meter data:', err);
          reject(err);
        }
      });
    });
  }

  private extractAvailableYears(data: WaterConsumptionResponse[]): void {
    const years = new Set<number>();

    data.forEach(item => {
      const date = new Date(item.readingDate);
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    });

    this.availableYears = Array.from(years).sort((a, b) => b - a);

    if (this.availableYears.length === 0) {
      this.availableYears.push(new Date().getFullYear());
    }

    if (this.availableYears.length > 0) {
      this.selectedYear = this.availableYears[0];
    }
  }

  private calculateStatistics(data: WaterConsumptionResponse[]): void {
    this.totalConsumption = data.reduce((total, item) => total + (item.cubicMeters || 0), 0);
    this.totalWaterCost = data.reduce((total, item) => total + (item.waterCost || 0), 0);
    const uniqueBranches = new Set(data.map(item => item.branchId));
    this.totalBranches = uniqueBranches.size;
    this.totalRecords = data.length;
    this.averageConsumption = this.totalRecords > 0 ? this.totalConsumption / this.totalRecords : 0;
  }

  onYearChange(): void {
    console.log('Year changed to:', this.selectedYear);
  }

  onChartTabChange(event: any): void {
    this.selectedChartTab = event.index;
    console.log('Chart tab changed to:', this.chartTabs[event.index].label);
  }

  private generateRecentActivity(data: WaterConsumptionResponse[]): void {
    // Sort descending by readingDate and get the 5 most recent
    const sortedData = data
      .slice()
      .sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime())
      .slice(0, 5);

    this.recentActivity = sortedData.map(item => {
      const date = new Date(item.readingDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let timeAgo: string;
      if (diffDays === 1) {
        timeAgo = 'Today';
      } else if (diffDays === 2) {
        timeAgo = 'Yesterday';
      } else if (diffDays <= 7) {
        timeAgo = `${diffDays - 1} days ago`;
      } else {
        timeAgo = date.toLocaleDateString();
      }

      // Get branch and meter details
      const branch = this.branches.get(item.branchId);
      const meter = this.waterMeters.get(item.meterId || '');

      return {
        type: this.getActivityType(item),
        message: this.getActivityMessage(item, branch, meter),
        time: timeAgo,
        icon: this.getActivityIcon(item),
        consumption: item,
        branch: branch,
        meter: meter
      };
    });
  }

  private getActivityType(consumption: WaterConsumptionResponse): string {
    if (consumption.cubicMeters && consumption.cubicMeters > 100) {
      return 'high_consumption';
    } else if (consumption.note && consumption.note.toLowerCase().includes('alert')) {
      return 'alert';
    } else {
      return 'reading';
    }
  }

  private getActivityMessage(consumption: WaterConsumptionResponse, branch?: Branch, meter?: WaterMeterResponse): string {
    const branchName = branch?.name || consumption.branchId;
    const meterInfo = meter?.serialNumber || consumption.meterSerialNumber || consumption.meterId || 'Unknown Meter';

    if (consumption.cubicMeters && consumption.cubicMeters > 100) {
      return `High consumption at ${branchName} - ${meterInfo} (${consumption.cubicMeters} m³)`;
    } else if (consumption.note) {
      return `Note: ${consumption.note} - ${branchName}`;
    } else {
      return `Reading recorded at ${branchName} - ${meterInfo} (${consumption.cubicMeters} m³)`;
    }
  }

  private getActivityIcon(consumption: WaterConsumptionResponse): string {
    switch (this.getActivityType(consumption)) {
      case 'high_consumption':
        return 'warning';
      case 'alert':
        return 'notification_important';
      default:
        return 'assignment';
    }
  }

  getSelectedYearConsumption(): number {
    if (!this.allData) return 0;
    return this.allData
      .filter(item => {
        const date = new Date(item.readingDate);
        return date.getFullYear() === this.selectedYear;
      })
      .reduce((sum, item) => sum + (item.cubicMeters || 0), 0);
  }

  getSelectedYearCost(): number {
    if (!this.allData) return 0;
    return this.allData
      .filter(item => {
        const date = new Date(item.readingDate);
        return date.getFullYear() === this.selectedYear;
      })
      .reduce((sum, item) => sum + (item.waterCost || 0), 0);
  }

  getActiveAlerts(): number {
    return 0; // Placeholder - can be implemented later
  }

  getRecordsInSelectedYear(): number {
    if (!this.allData) return 0;
    return this.allData.filter(item => {
      const date = new Date(item.readingDate);
      return date.getFullYear() === this.selectedYear;
    }).length;
  }

  getBranchesInSelectedYear(): number {
    if (!this.allData) return 0;
    const branches = new Set();
    this.allData.forEach(item => {
      const date = new Date(item.readingDate);
      if (date.getFullYear() === this.selectedYear) {
        branches.add(item.branchId);
      }
    });
    return branches.size;
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}