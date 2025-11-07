import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WaterConsumptionDashboardService } from '../services/water-consumption-dashboard.service';
import { Subscription } from 'rxjs';
import * as echarts from 'echarts';

@Component({
  selector: 'app-yearly-consumption-chart',
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
  templateUrl: './yearly-consumption-chart.component.html',
  styleUrls: ['./yearly-consumption-chart.component.css']
})
export class YearlyConsumptionChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedYear: number = new Date().getFullYear();
  
  chartOptions: any = {};
  loading = true;
  error = '';
  private subscriptions = new Subscription();
  private yearlyData: { year: string; consumption: number }[] = [];
  private allData: any[] = [];

  constructor(private waterConsumptionService: WaterConsumptionDashboardService) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedYear'] && !changes['selectedYear'].firstChange) {
      this.processChartData(this.allData);
    }
  }

  loadChartData(): void {
    this.loading = true;
    this.error = '';

    const sub = this.waterConsumptionService.getAll().subscribe({
      next: (data) => {
        this.allData = data;
        this.processChartData(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load consumption data';
        this.loading = false;
        console.error('Error loading consumption data:', err);
      }
    });

    this.subscriptions.add(sub);
  }

  private processChartData(data: any[]): void {
    // Filter data by selected year and group by month
    const monthlyData = this.groupDataByMonth(data);
    
    this.chartOptions = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        },
        formatter: (params: any) => {
          const data = params[0];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; background: ${data.color}; border-radius: 50%;"></span>
              Consumption: <strong>${data.value} m³</strong>
            </div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: monthlyData.map(item => item.month),
        axisLine: {
          lineStyle: {
            color: '#e4e7ed'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: 'Cubic Meters (m³)',
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e4e7ed'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          formatter: '{value} m³'
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Monthly Consumption',
          type: 'bar',
          data: monthlyData.map(item => item.consumption),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#5a6fd8' },
                { offset: 1, color: '#6a4190' }
              ])
            }
          },
          // Removed label configuration to clean up the chart
          label: {
            show: false // This removes the numbers on top of the bars
          }
        }
      ]
    };
  }

  private groupDataByMonth(data: any[]): { month: string; consumption: number }[] {
    const monthMap = new Map<string, number>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize all months with 0
    months.forEach(month => {
      monthMap.set(month, 0);
    });

    // Filter data for selected year and sum by month
    data.forEach(item => {
      const date = new Date(item.readingDate);
      if (date.getFullYear() === this.selectedYear) {
        const monthName = months[date.getMonth()];
        const consumption = item.cubicMeters || 0;
        
        if (monthMap.has(monthName)) {
          monthMap.set(monthName, monthMap.get(monthName)! + consumption);
        }
      }
    });

    return Array.from(monthMap.entries())
      .map(([month, consumption]) => ({ month, consumption }));
  }

  // Helper methods for stats
  getTotalMonths(): number {
    return 12; // Always 12 months
  }

  getTotalConsumption(): number {
    const monthlyData = this.groupDataByMonth(this.allData);
    return monthlyData.reduce((sum, item) => sum + item.consumption, 0);
  }

  getAverageMonthlyConsumption(): number {
    const monthlyData = this.groupDataByMonth(this.allData);
    const total = monthlyData.reduce((sum, item) => sum + item.consumption, 0);
    return monthlyData.length > 0 ? total / monthlyData.length : 0;
  }

  getPeakMonth(): string {
    const monthlyData = this.groupDataByMonth(this.allData);
    if (monthlyData.length === 0) return '-';
    const peak = monthlyData.reduce((max, item) => 
      item.consumption > max.consumption ? item : max
    );
    return peak.month;
  }
}