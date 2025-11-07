import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import * as echarts from 'echarts';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Layout components
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';

import { WaterConsumptionService, WaterConsumptionResponse } from '../water-consumption.service';
import { BranchDashboardService, Branch } from '../../dashboard/services/branch-dashboard.service';
import { WaterMeterDashboardService, WaterMeterResponse } from '../../dashboard/services/water-meter-dashboard.service';

interface MeterData {
  meterId: string;
  meterSerialNumber: string;
  consumptions: WaterConsumptionResponse[];
  color: string;
}

interface ChartPeriod {
  label: string;
  value: '7d' | '30d' | '90d' | '1y' | 'all';
}

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxEchartsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    RouterLink,
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: { echarts: () => import('echarts') }
    }
  ],
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private waterService = inject(WaterConsumptionService);
  private branchService = inject(BranchDashboardService);
  private waterMeterService = inject(WaterMeterDashboardService);
  private snackBar = inject(MatSnackBar);

  // Component state
  branchId!: string;
  branchName: string = 'Loading...';
  chartOptions: any;
  isLoading = true;
  isRefreshing = false;
  hasData = false;
  
  // Data
  meterData: MeterData[] = [];
  allConsumptionData: WaterConsumptionResponse[] = [];
  
  // User controls
  selectedMeter: string = 'all';
  viewMode: 'combined' | 'individual' = 'combined';
  chartType: 'line' | 'bar' = 'line';
  selectedPeriod: ChartPeriod['value'] = 'all';
  showTrendLine: boolean = false;
  
  // Chart periods
  chartPeriods: ChartPeriod[] = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last Year', value: '1y' },
    { label: 'All Time', value: 'all' }
  ];

  // Color palette
  private colorPalette = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad',
    '#27ae60', '#2980b9', '#f1c40f', '#e67e22', '#7f8c8d'
  ];

  // ECharts theme
  private chartTheme = {
    backgroundColor: '#ffffff',
    textStyle: {
      fontFamily: 'Roboto, "Helvetica Neue", sans-serif'
    }
  };

  ngOnInit(): void {
    this.branchId = this.route.snapshot.paramMap.get('branchId')!;
    this.loadBranchDetails();
    this.loadChartData();
  }

  ngOnDestroy(): void {
    // Clean up chart instances if needed
  }

  private loadBranchDetails(): void {
    this.branchService.getBranches().subscribe({
      next: (branches: Branch[]) => {
        const branch = branches.find(b => b.id === this.branchId);
        this.branchName = branch ? branch.name : `Branch ${this.branchId}`;
      },
      error: (err) => {
        console.error('Error loading branch details:', err);
        this.branchName = `Branch ${this.branchId}`;
      }
    });
  }

  loadChartData(): void {
    this.isLoading = true;
    this.waterService.getAll().subscribe({
      next: (data: WaterConsumptionResponse[]) => {
        this.allConsumptionData = data;
        this.processChartData();
        this.isLoading = false;
        this.isRefreshing = false;
        
        this.snackBar.open('Chart data updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
      error: (err) => {
        console.error('Error loading chart data', err);
        this.isLoading = false;
        this.isRefreshing = false;
        this.hasData = false;
        
        this.snackBar.open('Error loading chart data', 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadChartData();
  }

  private processChartData(): void {
    const branchData = this.allConsumptionData.filter(d => d.branchId === this.branchId);

    if (branchData.length === 0) {
      this.hasData = false;
      return;
    }

    this.hasData = true;
    this.processMeterData(branchData);
    this.updateChart();
  }

  private processMeterData(data: WaterConsumptionResponse[]): void {
    const meterGroups: { [key: string]: WaterConsumptionResponse[] } = {};
    
    data.forEach(consumption => {
      const meterKey = consumption.meterId || 'unknown';
      if (!meterGroups[meterKey]) {
        meterGroups[meterKey] = [];
      }
      meterGroups[meterKey].push(consumption);
    });

    this.meterData = Object.keys(meterGroups).map((meterKey, index) => {
      const consumptions = meterGroups[meterKey];
      consumptions.sort((a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime());

      // Get meter details
      const meterSerialNumber = consumptions[0]?.meterSerialNumber || 
                               this.getMeterSerialNumber(meterKey) || 
                               `Meter ${meterKey}`;

      return {
        meterId: meterKey,
        meterSerialNumber,
        consumptions: this.filterDataByPeriod(consumptions),
        color: this.colorPalette[index % this.colorPalette.length]
      };
    });

    // Update selected meter if current selection is invalid
    if (this.viewMode === 'individual' && !this.meterData.find(m => m.meterId === this.selectedMeter)) {
      this.selectedMeter = this.meterData.length > 0 ? this.meterData[0].meterId : 'all';
    }
  }

  private filterDataByPeriod(data: WaterConsumptionResponse[]): WaterConsumptionResponse[] {
    if (this.selectedPeriod === 'all') return data;

    const now = new Date();
    const cutoffDate = new Date();

    switch (this.selectedPeriod) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return data.filter(consumption => 
      new Date(consumption.readingDate) >= cutoffDate
    );
  }

  private getMeterSerialNumber(meterId: string): string {
    // This would typically come from a meter service
    return `Meter-${meterId.substring(0, 8)}`;
  }

  private updateChart(): void {
    if (this.viewMode === 'combined') {
      this.createCombinedChart();
    } else {
      this.createIndividualChart();
    }
  }

  private createCombinedChart(): void {
    const allDates = this.getAllUniqueDates();
    
    const series = this.meterData.map(meter => {
      const consumptionMap = new Map<string, number>();
      meter.consumptions.forEach(consumption => {
        const date = new Date(consumption.readingDate);
        const dateKey = date.toISOString().split('T')[0];
        consumptionMap.set(dateKey, consumption.cubicMeters ?? 0);
      });

      const alignedData = allDates.map(date => {
        return consumptionMap.has(date) ? consumptionMap.get(date)! : null;
      });

      const baseSeries: any = {
        name: meter.meterSerialNumber,
        type: this.chartType,
        data: alignedData,
        smooth: this.chartType === 'line',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: meter.color,
          width: 3
        },
        itemStyle: {
          color: meter.color
        },
        emphasis: {
          focus: 'series',
          scale: true
        },
        connectNulls: false
      };

      // Add area style for line charts
      if (this.chartType === 'line') {
        baseSeries.areaStyle = this.meterData.length === 1 ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: this.hexToRgba(meter.color, 0.3) },
            { offset: 1, color: this.hexToRgba(meter.color, 0.1) }
          ])
        } : undefined;
      }

      // Add trend line if enabled
      if (this.showTrendLine && this.chartType === 'line') {
        const trendData = this.calculateTrendLine(alignedData);
        baseSeries.markLine = {
          data: [
            {
              coord: [0, trendData.start]
            }, 
            {
              coord: [alignedData.length - 1, trendData.end]
            }
          ],
          lineStyle: {
            color: meter.color,
            type: 'dashed',
            width: 2
          },
          symbol: 'none',
          silent: true
        };
      }

      return baseSeries;
    });

    this.chartOptions = {
      ...this.chartTheme,
      title: {
        text: `Water Consumption – ${this.branchName}`,
        subtext: `${this.meterData.length} Water Meter${this.meterData.length !== 1 ? 's' : ''} • ${this.getPeriodLabel()}`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#7f8c8d'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        textStyle: {
          color: '#2c3e50'
        },
        formatter: (params: any) => {
          const date = new Date(params[0].axisValue);
          const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
          });
          
          let html = `
            <div style="font-weight: bold; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0e0e0;">
              ${formattedDate}
            </div>
          `;
          
          params.forEach((param: any) => {
            const value = param.value === null ? 
              '<span style="color: #95a5a6;">No data</span>' : 
              `<span style="font-weight: 600;">${param.value} m³</span>`;
              
            html += `
              <div style="display: flex; align-items: center; justify-content: space-between; margin: 4px 0; min-width: 200px;">
                <div style="display: flex; align-items: center;">
                  <span style="display: inline-block; width: 12px; height: 12px; background: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
                  <span>${param.seriesName}</span>
                </div>
                <div>${value}</div>
              </div>
            `;
          });
          return html;
        }
      },
      legend: {
        data: this.meterData.map(meter => meter.meterSerialNumber),
        top: '12%',
        type: 'scroll',
        pageIconColor: '#3498db',
        pageTextStyle: {
          color: '#7f8c8d'
        }
      },
      xAxis: {
        type: 'category',
        data: allDates,
        name: 'Date',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          rotate: 45,
          color: '#7f8c8d',
          formatter: (value: string) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            });
          }
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Cubic Meters (m³)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          color: '#7f8c8d'
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      series: series,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '25%',
        containLabel: true
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          bottom: '5%',
          height: 20,
          handleSize: '100%',
          handleStyle: {
            color: '#3498db'
          },
          textStyle: {
            color: '#7f8c8d'
          }
        }
      ]
    };
  }

  private createIndividualChart(): void {
    const meter = this.meterData.find(m => m.meterId === this.selectedMeter);

    if (!meter) return;

    const dateSet = new Set<string>();
    meter.consumptions.forEach(c => {
      const date = new Date(c.readingDate);
      const dateKey = date.toISOString().split('T')[0];
      dateSet.add(dateKey);
    });
    const uniqueDates = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const consumptionMap = new Map<string, number>();
    meter.consumptions.forEach(c => {
      const date = new Date(c.readingDate);
      const dateKey = date.toISOString().split('T')[0];
      consumptionMap.set(dateKey, c.cubicMeters ?? 0);
    });

    const consumptions = uniqueDates.map(date => consumptionMap.get(date) ?? 0);

    const seriesConfig: any = {
      data: consumptions,
      type: this.chartType,
      smooth: this.chartType === 'line',
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        color: meter.color,
        width: 3
      },
      itemStyle: {
        color: meter.color
      }
    };

    if (this.chartType === 'line') {
      seriesConfig.areaStyle = {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: this.hexToRgba(meter.color, 0.3) },
          { offset: 1, color: this.hexToRgba(meter.color, 0.1) }
        ])
      };
    }

    if (this.showTrendLine && this.chartType === 'line') {
      const trendData = this.calculateTrendLine(consumptions);
      seriesConfig.markLine = {
        data: [
          {
            coord: [0, trendData.start]
          }, 
          {
            coord: [consumptions.length - 1, trendData.end]
          }
        ],
        lineStyle: {
          color: meter.color,
          type: 'dashed',
          width: 2
        },
        symbol: 'none',
        silent: true
      };
    }

    this.chartOptions = {
      ...this.chartTheme,
      title: {
        text: `Water Consumption – ${meter.meterSerialNumber}`,
        subtext: `${this.branchName} • ${this.getPeriodLabel()}`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#7f8c8d'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        textStyle: {
          color: '#2c3e50'
        },
        formatter: (params: any) => {
          const date = new Date(params[0].axisValue);
          const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
          });
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">${formattedDate}</div>
            <div>${params[0].data} m³</div>
          `;
        }
      },
      xAxis: {
        type: 'category',
        data: uniqueDates,
        name: 'Date',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          rotate: 45,
          color: '#7f8c8d',
          formatter: (value: string) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            });
          }
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Cubic Meters (m³)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          color: '#7f8c8d'
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      series: [seriesConfig],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          bottom: '5%',
          height: 20,
          handleSize: '100%',
          handleStyle: {
            color: '#3498db'
          },
          textStyle: {
            color: '#7f8c8d'
          }
        }
      ]
    };
  }

  private getAllUniqueDates(): string[] {
    const allDates = new Set<string>();
    
    this.meterData.forEach(meter => {
      meter.consumptions.forEach(consumption => {
        const date = new Date(consumption.readingDate);
        const dateKey = date.toISOString().split('T')[0];
        allDates.add(dateKey);
      });
    });
    
    return Array.from(allDates).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  }

  private calculateTrendLine(data: (number | null)[]): { start: number; end: number } {
    const validData = data.filter(d => d !== null) as number[];
    if (validData.length < 2) return { start: 0, end: 0 };

    const x = validData.map((_, i) => i);
    const y = validData;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      start: intercept,
      end: intercept + slope * (n - 1)
    };
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Make this method public for template access
  public getPeriodLabel(): string {
    const period = this.chartPeriods.find(p => p.value === this.selectedPeriod);
    return period ? period.label : 'All Time';
  }

  // Add missing methods that are called in the template
  public getDateRange(): string {
    if (this.meterData.length === 0 || !this.hasData) return 'No data available';
    
    let allDates: Date[] = [];
    this.meterData.forEach(meter => {
      meter.consumptions.forEach(consumption => {
        if (consumption.readingDate) {
          allDates.push(new Date(consumption.readingDate));
        }
      });
    });

    if (allDates.length === 0) return 'No data available';

    allDates.sort((a, b) => a.getTime() - b.getTime());
    const start = allDates[0];
    const end = allDates[allDates.length - 1];

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  public getHighestConsumption(): number {
    let highest = 0;
    this.meterData.forEach(meter => {
      meter.consumptions.forEach(consumption => {
        const consumptionValue = consumption.cubicMeters ?? 0;
        if (consumptionValue > highest) {
          highest = consumptionValue;
        }
      });
    });
    return highest;
  }

  // Add chart init method
  onChartInit(ec: any): void {
    // Chart initialization logic if needed
    console.log('Chart initialized', ec);
  }

  // User interaction methods
  onViewModeChange(): void {
    if (this.viewMode === 'individual' && this.meterData.length > 0) {
      this.selectedMeter = this.meterData[0].meterId;
    }
    this.updateChart();
  }

  onMeterSelectionChange(): void {
    this.updateChart();
  }

  onChartTypeChange(): void {
    this.updateChart();
  }

  onPeriodChange(): void {
    this.processChartData();
  }

  onTrendLineToggle(): void {
    this.updateChart();
  }

  exportChart(): void {
    this.snackBar.open('Export feature coming soon!', 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  // Statistics methods
  getMeterStats(meter: MeterData): { total: number; average: number; records: number; max: number; min: number } {
    const consumptions = meter.consumptions.map(c => c.cubicMeters ?? 0);
    const total = consumptions.reduce((sum, current) => sum + current, 0);
    const average = consumptions.length > 0 ? total / consumptions.length : 0;
    const max = consumptions.length > 0 ? Math.max(...consumptions) : 0;
    const min = consumptions.length > 0 ? Math.min(...consumptions) : 0;
    
    return {
      total,
      average,
      records: consumptions.length,
      max,
      min
    };
  }

  getTotalBranchConsumption(): number {
    return this.meterData.reduce((total, meter) => {
      return total + meter.consumptions.reduce((meterTotal, c) => meterTotal + (c.cubicMeters ?? 0), 0);
    }, 0);
  }

  getTotalMeters(): number {
    return this.meterData.length;
  }

  getTotalRecords(): number {
    return this.meterData.reduce((total, meter) => total + meter.consumptions.length, 0);
  }

  getAverageConsumption(): number {
    const total = this.getTotalBranchConsumption();
    const records = this.getTotalRecords();
    return records > 0 ? total / records : 0;
  }
}