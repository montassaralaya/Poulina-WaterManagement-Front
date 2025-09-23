import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { WaterConsumptionService, WaterConsumptionResponse } from '../water-consumption.service';

// Material components
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';

import { Chart, ChartDataset, ChartOptions, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-branch-water-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule
  ],
  templateUrl: './branch-water-chart.component.html',
  styleUrls: ['./branch-water-chart.component.scss']
})
export class BranchWaterChartComponent implements OnInit {
  branchId!: string;
  waterConsumptions: WaterConsumptionResponse[] = [];
  filteredConsumptions: WaterConsumptionResponse[] = [];
  chart!: Chart<'line', { x: Date; y: number }[], unknown>;
  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private waterConsumptionService: WaterConsumptionService
  ) {}

  ngOnInit(): void {
    this.branchId = this.route.snapshot.paramMap.get('branchId')!;
    this.loadData();
  }

  loadData(): void {
    this.waterConsumptionService.getAll().subscribe({
      next: (data) => {
        this.waterConsumptions = data
          .filter(c => c.branchId === this.branchId)
          .sort(
            (a, b) =>
              new Date(a.readingDate).getTime() -
              new Date(b.readingDate).getTime()
          );

        this.filteredConsumptions = [...this.waterConsumptions];

        if (this.waterConsumptions.length > 0) {
          const latestDate = new Date(
            this.waterConsumptions[this.waterConsumptions.length - 1].readingDate
          );
          this.endDate = new Date(latestDate);
          this.startDate = new Date(latestDate);
          this.startDate.setDate(this.startDate.getDate() - 30);
        }

        this.renderChart();
      },
      error: (err) =>
        console.error('Failed to load water consumption data:', err)
    });
  }

  filterData(): void {
    if (!this.startDate || !this.endDate) {
      this.filteredConsumptions = [...this.waterConsumptions];
    } else {
      this.filteredConsumptions = this.waterConsumptions.filter(c => {
        const readingDate = new Date(c.readingDate);
        return readingDate >= this.startDate! && readingDate <= this.endDate!;
      });
    }
    this.renderChart();
  }

  resetFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.filteredConsumptions = [...this.waterConsumptions];
    this.renderChart();
  }

  renderChart(): void {
    const ctx = document.getElementById('waterChart') as HTMLCanvasElement;
    if (this.chart) this.chart.destroy();
    if (this.filteredConsumptions.length === 0) return;

    const groupedByMeter: { [meterKey: string]: WaterConsumptionResponse[] } = {};
    this.filteredConsumptions.forEach(c => {
      const meterKey = c.meterSerialNumber || c.meterId || 'Unknown Meter';
      if (!groupedByMeter[meterKey]) groupedByMeter[meterKey] = [];
      groupedByMeter[meterKey].push(c);
    });

    const datasets: ChartDataset<'line', { x: Date; y: number }[]>[] =
      Object.keys(groupedByMeter).map((meterKey, index) => {
        const colors = [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(153, 102, 255, 1)'
        ];

        return {
          label: `Meter ${meterKey}`,
          data: groupedByMeter[meterKey].map(c => ({
            x: new Date(c.readingDate),
            y: c.cubicMeters
          })),
          fill: false,
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length],
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        };
      });

    const config: ChartConfiguration<'line', { x: Date; y: number }[]> = {
      type: 'line', // ✅ must be 'line' literal
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 14 } }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} m³`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'dd MMM yyyy',
              displayFormats: { day: 'MMM dd' }
            },
            title: {
              display: true,
              text: 'Date',
              font: { size: 14, weight: 'bold' }
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cubic Meters (m³)',
              font: { size: 14, weight: 'bold' }
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          }
        }
      }
    };

    this.chart = new Chart<'line', { x: Date; y: number }[]>(ctx, config);
  }

  getTotalConsumption(): number {
    return this.filteredConsumptions.reduce(
      (total, consumption) => total + consumption.cubicMeters,
      0
    );
  }

  getAverageConsumption(): number {
    return this.filteredConsumptions.length > 0
      ? this.getTotalConsumption() / this.filteredConsumptions.length
      : 0;
  }

  getMeterCount(): number {
    const meters = new Set();
    this.filteredConsumptions.forEach(c => {
      meters.add(c.meterSerialNumber || c.meterId);
    });
    return meters.size;
  }

  getReadingCount(): number {
    return this.filteredConsumptions.length;
  }
  goBack(): void {
  this.router.navigate(['/waterconsumption/list']);
}
}

