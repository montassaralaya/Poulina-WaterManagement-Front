import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WaterConsumptionDashboardService, WaterConsumptionResponse } from '../services/water-consumption-dashboard.service';
import { BranchDashboardService, Branch } from '../services/branch-dashboard.service';
import { Subscription } from 'rxjs';
import * as echarts from 'echarts';

@Component({
  selector: 'app-consumption-heatmap-chart',
  standalone: true,
  imports: [
    CommonModule, 
    NgxEchartsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: { echarts: () => import('echarts') }
    }
  ],
  templateUrl: './consumption-heatmap-chart.component.html',
  styleUrls: ['./consumption-heatmap-chart.component.css']
})
export class ConsumptionHeatmapChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedYear: number = new Date().getFullYear();
  
  chartOptions: any = {};
  loading = true;
  error = '';
  private subscriptions = new Subscription();
  private allData: WaterConsumptionResponse[] = [];
  private branches: Branch[] = [];

  constructor(
    private waterConsumptionService: WaterConsumptionDashboardService,
    private branchService: BranchDashboardService
  ) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedYear'] && !changes['selectedYear'].firstChange && this.allData.length > 0) {
      this.processChartData();
    }
  }

  loadChartData(): void {
    this.loading = true;
    this.error = '';

    // Load both consumption data and branches in parallel
    const consumptionSub = this.waterConsumptionService.getAll().subscribe({
      next: (data) => {
        this.allData = data;
        this.loadBranches();
      },
      error: (err) => {
        this.error = 'Failed to load consumption data';
        this.loading = false;
        console.error('Error loading consumption data:', err);
      }
    });

    this.subscriptions.add(consumptionSub);
  }

  private loadBranches(): void {
    const branchSub = this.branchService.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
        this.processChartData();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load branch data';
        this.loading = false;
        console.error('Error loading branch data:', err);
      }
    });

    this.subscriptions.add(branchSub);
  }

  private processChartData(): void {
    const heatmapData = this.generateHeatmapData();
    
    this.chartOptions = {
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        },
        formatter: (params: any) => {
          return `
            <div style="font-weight: 600; margin-bottom: 8px; color: #2c3e50;">${params.data[3]}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #666;">Branch:</span>
              <span style="font-weight: 600; margin-left: 8px;">${params.data[1]}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #666;">Month:</span>
              <span style="font-weight: 600; margin-left: 8px;">${params.data[0]}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Consumption:</span>
              <span style="font-weight: 600; margin-left: 8px; color: #3498db;">${params.data[2].toLocaleString()} m³</span>
            </div>
          `;
        }
      },
      grid: {
        height: '65%',
        top: '15%',
        right: '10%',
        left: '20%',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        splitArea: {
          show: true
        },
        axisLabel: {
          color: '#666',
          fontSize: 11,
          fontWeight: 'bold'
        },
        axisLine: {
          lineStyle: {
            color: '#e4e7ed'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: heatmapData.branchNames,
        splitArea: {
          show: true
        },
        axisLabel: {
          color: '#666',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (value: string) => {
            // Truncate long branch names for better display
            return value.length > 18 ? value.substring(0, 18) + '...' : value;
          }
        },
        axisLine: {
          lineStyle: {
            color: '#e4e7ed'
          }
        }
      },
      visualMap: {
        min: 0,
        max: heatmapData.maxConsumption,
        calculable: true,
        orient: 'vertical',
        left: 'left',
        top: 'center',
        textStyle: {
          color: '#666',
          fontSize: 10
        },
        inRange: {
          color: ['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#0d47a1']
        },
        text: ['High', 'Low'],
        dimension: 2
      },
      series: [{
        name: 'Water Consumption',
        type: 'heatmap',
        data: heatmapData.data,
        label: {
          show: true,
          color: '#2c3e50',
          fontSize: 10,
          fontWeight: 'bold',
          formatter: (params: any) => {
            const value = params.data[2];
            return value > 0 ? this.formatConsumption(value) : '';
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            borderWidth: 2,
            borderColor: '#fff'
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        }
      }]
    };
  }

  private generateHeatmapData(): { data: any[]; branchNames: string[]; maxConsumption: number } {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const branchMap = new Map<string, Map<number, number>>();
    let maxConsumption = 0;

    // Initialize data structure for all branches and months
    this.branches.forEach(branch => {
      const monthMap = new Map<number, number>();
      for (let i = 0; i < 12; i++) {
        monthMap.set(i, 0);
      }
      branchMap.set(branch.id, monthMap);
    });

    // Process consumption data for selected year
    this.allData.forEach(item => {
      const date = new Date(item.readingDate);
      if (date.getFullYear() === this.selectedYear) {
        const monthIndex = date.getMonth();
        const consumption = item.cubicMeters || 0;
        const branchMonthMap = branchMap.get(item.branchId);

        if (branchMonthMap) {
          const currentConsumption = branchMonthMap.get(monthIndex) || 0;
          const newConsumption = currentConsumption + consumption;
          branchMonthMap.set(monthIndex, newConsumption);
          
          if (newConsumption > maxConsumption) {
            maxConsumption = newConsumption;
          }
        }
      }
    });

    // Prepare data for heatmap
    const heatmapData: any[] = [];
    const branchNames: string[] = [];

    // Sort branches by total consumption for better visualization
    const sortedBranches = [...this.branches].sort((a, b) => {
      const aTotal = this.getBranchTotalConsumption(a.id, branchMap);
      const bTotal = this.getBranchTotalConsumption(b.id, branchMap);
      return bTotal - aTotal; // Descending order
    });

    sortedBranches.forEach((branch, branchIndex) => {
      branchNames.push(branch.name);
      const branchMonthMap = branchMap.get(branch.id);

      if (branchMonthMap) {
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const consumption = branchMonthMap.get(monthIndex) || 0;
          heatmapData.push([
            monthIndex, // x axis (month index)
            branchIndex, // y axis (branch index)
            consumption, // value
            `${branch.name} - ${months[monthIndex]}` // display name for tooltip
          ]);
        }
      }
    });

    return {
      data: heatmapData,
      branchNames: branchNames,
      maxConsumption: maxConsumption > 0 ? maxConsumption : 100 // Default max if no data
    };
  }

  private getBranchTotalConsumption(branchId: string, branchMap: Map<string, Map<number, number>>): number {
    const monthMap = branchMap.get(branchId);
    if (!monthMap) return 0;
    
    let total = 0;
    for (let i = 0; i < 12; i++) {
      total += monthMap.get(i) || 0;
    }
    return total;
  }

  private formatConsumption(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value.toString();
  }

  // Helper methods for stats
  getTotalBranches(): number {
    return this.branches.length;
  }

  getActiveBranches(): number {
    if (this.allData.length === 0) return 0;
    
    const activeBranches = new Set<string>();
    this.allData.forEach(item => {
      const date = new Date(item.readingDate);
      if (date.getFullYear() === this.selectedYear) {
        activeBranches.add(item.branchId);
      }
    });
    return activeBranches.size;
  }

  getMostActiveBranch(): string {
    if (this.allData.length === 0 || this.branches.length === 0) return '-';
    
    const branchConsumption = new Map<string, number>();
    
    this.allData.forEach(item => {
      const date = new Date(item.readingDate);
      if (date.getFullYear() === this.selectedYear) {
        const current = branchConsumption.get(item.branchId) || 0;
        branchConsumption.set(item.branchId, current + (item.cubicMeters || 0));
      }
    });

    let maxBranchId = '';
    let maxConsumption = 0;
    
    branchConsumption.forEach((consumption, branchId) => {
      if (consumption > maxConsumption) {
        maxConsumption = consumption;
        maxBranchId = branchId;
      }
    });

    const branch = this.branches.find(b => b.id === maxBranchId);
    return branch ? branch.name : '-';
  }
}