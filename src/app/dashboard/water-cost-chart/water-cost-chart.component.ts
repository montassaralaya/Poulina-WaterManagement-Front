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
  selector: 'app-water-cost-chart',
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
  templateUrl: './water-cost-chart.component.html',
  styleUrls: ['./water-cost-chart.component.css']
})
export class WaterCostChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedYear: number = new Date().getFullYear();
  
  chartOptions: any = {};
  loading = true;
  error = '';
  private subscriptions = new Subscription();
  private monthlyData: { month: string; cost: number }[] = [];
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
        this.error = 'Failed to load cost data';
        this.loading = false;
        console.error('Error loading cost data:', err);
      }
    });

    this.subscriptions.add(sub);
  }

  private processChartData(data: any[]): void {
    this.monthlyData = this.groupDataByMonth(data);
    
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
              Cost: <strong>$${data.value.toFixed(2)}</strong>
            </div>
          `;
        }
      },
      legend: {
        show: false
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
        boundaryGap: false,
        data: this.monthlyData.map(item => item.month),
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
        name: 'Cost ($)',
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
          formatter: '${value}'
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
          name: 'Water Cost',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: '#f093fb'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(240, 147, 251, 0.6)' },
              { offset: 1, color: 'rgba(245, 87, 108, 0.2)' }
            ])
          },
          itemStyle: {
            color: '#f5576c',
            borderColor: '#fff',
            borderWidth: 2
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#f5576c',
              borderColor: '#fff',
              borderWidth: 3
            }
          },
          data: this.monthlyData.map(item => item.cost),
          markPoint: {
            data: [
              { type: 'max', name: 'Max', symbolSize: 60 },
              { type: 'min', name: 'Min', symbolSize: 60 }
            ],
            label: {
              color: '#fff',
              fontSize: 10
            }
          }
        }
      ]
    };
  }

  private groupDataByMonth(data: any[]): { month: string; cost: number }[] {
    const monthMap = new Map<string, number>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize all months with 0
    months.forEach(month => {
      monthMap.set(month, 0);
    });

    // Filter data for selected year and sum by month
    data.forEach(item => {
      if (item.waterCost && item.waterCost > 0) {
        const date = new Date(item.readingDate);
        if (date.getFullYear() === this.selectedYear) {
          const monthName = months[date.getMonth()];
          const cost = item.waterCost;

          if (monthMap.has(monthName)) {
            monthMap.set(monthName, monthMap.get(monthName)! + cost);
          }
        }
      }
    });

    return Array.from(monthMap.entries())
      .map(([month, cost]) => ({ month, cost }));
  }

  // Helper methods for stats
  getPeriod(): string {
    return this.selectedYear.toString();
  }

  getTotalCost(): number {
    return this.monthlyData.reduce((sum, item) => sum + item.cost, 0);
  }

  getAverageMonthlyCost(): number {
    const totalCost = this.getTotalCost();
    const monthsWithData = this.monthlyData.filter(item => item.cost > 0).length;
    return monthsWithData > 0 ? totalCost / monthsWithData : 0;
  }

  getPeakMonth(): string {
    if (this.monthlyData.length === 0) return '-';
    const peak = this.monthlyData.reduce((max, item) => 
      item.cost > max.cost ? item : max
    );
    return peak.month;
  }
}