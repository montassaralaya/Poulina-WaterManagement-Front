import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';

import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';

import { WaterConsumptionService, WaterConsumptionResponse } from '../water-consumption.service';
import { BranchDashboardService, Branch } from '../../dashboard/services/branch-dashboard.service';
import { WaterMeterDashboardService, WaterMeterResponse } from '../../dashboard/services/water-meter-dashboard.service';

interface BranchConsumptionData {
  branchId: string;
  branchName: string;
  consumptions: WaterConsumptionResponse[];
}

@Component({
  selector: 'app-display-water-consumption',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './display-water-consumption.component.html',
  styleUrls: ['./display-water-consumption.component.scss']
})
export class DisplayWaterConsumptionComponent implements OnInit {
  // Data properties
  branchConsumptionsList: BranchConsumptionData[] = [];
  originalBranchList: BranchConsumptionData[] = [];
  
  // Filter properties
  selectedYear: number | null = null;
  selectedMeter: string | null = null;
  selectedBranch: string | null = null;
  dateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  minConsumption: number | null = null;
  maxConsumption: number | null = null;
  selectedSource: string | null = null;
  
  // Filter options
  availableYears: number[] = [];
  availableMeters: { id: string; serialNumber: string }[] = [];
  availableBranches: { id: string; name: string }[] = [];
  availableSources: string[] = ['OCR', 'Manual'];
  
  // UI state
  displayedColumns: string[] = [
    'readingDate', 
    'cubicMeters', 
    'waterCost', 
    'source', 
    'previousReading', 
    'note', 
    'meterSerialNumber', 
    'actions'
  ];
  expandedBranches: Set<string> = new Set();
  filterPanelExpanded = false;
  activeFiltersCount = 0;

  // Service maps
  private branchesMap: Map<string, Branch> = new Map();
  private waterMetersMap: Map<string, WaterMeterResponse> = new Map();

  constructor(
    private router: Router,
    private waterConsumptionService: WaterConsumptionService,
    private branchService: BranchDashboardService,
    private waterMeterService: WaterMeterDashboardService
  ) {}

  ngOnInit(): void {
    this.loadBranchesAndMeters();
  }

  // Data loading methods
  private loadBranchesAndMeters(): void {
    Promise.all([
      this.loadBranches(),
      this.loadWaterMeters()
    ]).then(() => {
      this.loadConsumptionData();
    }).catch(error => {
      console.error('Failed to load initial data:', error);
    });
  }

  private loadBranches(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.branchService.getBranches().subscribe({
        next: (branches: Branch[]) => {
          this.branchesMap.clear();
          this.availableBranches = [];
          branches.forEach(branch => {
            this.branchesMap.set(branch.id, branch);
            this.availableBranches.push({ id: branch.id, name: branch.name });
          });
          resolve();
        },
        error: (err) => {
          console.error('Failed to load branches:', err);
          reject(err);
        }
      });
    });
  }

  private loadWaterMeters(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.waterMeterService.getAll().subscribe({
        next: (waterMeters: WaterMeterResponse[]) => {
          this.waterMetersMap.clear();
          this.availableMeters = [];
          waterMeters.forEach(meter => {
            this.waterMetersMap.set(meter.id, meter);
            this.availableMeters.push({ id: meter.id, serialNumber: meter.serialNumber });
          });
          resolve();
        },
        error: (err) => {
          console.error('Failed to load water meters:', err);
          reject(err);
        }
      });
    });
  }

  private loadConsumptionData(): void {
    this.waterConsumptionService.getAll().subscribe({
      next: (data: WaterConsumptionResponse[]) => {
        const grouped: { [branchId: string]: WaterConsumptionResponse[] } = {};
        const years = new Set<number>();
        
        data.forEach(item => {
          if (!grouped[item.branchId]) grouped[item.branchId] = [];
          
          // Extract year from reading date
          if (item.readingDate) {
            const year = new Date(item.readingDate).getFullYear();
            years.add(year);
          }
          
          // Enhance consumption record with additional details
          const enhancedItem = {
            ...item,
            branchName: this.getBranchName(item.branchId),
            meterSerialNumber: this.getMeterSerialNumber(item.meterId)
          };
          
          grouped[item.branchId].push(enhancedItem);
        });

        this.availableYears = Array.from(years).sort((a, b) => b - a);
        this.originalBranchList = Object.keys(grouped).map(branchId => ({
          branchId,
          branchName: this.getBranchName(branchId),
          consumptions: grouped[branchId]
        }));
        
        this.applyAllFilters();
        if (this.branchConsumptionsList.length > 0) {
          this.expandedBranches.add(this.branchConsumptionsList[0].branchId);
        }
      },
      error: (err) => console.error('Failed to load water consumption data:', err)
    });
  }

  // Filter methods
  applyAllFilters(): void {
    let filteredList = [...this.originalBranchList];

    // Apply year filter
    if (this.selectedYear) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        consumptions: branch.consumptions.filter(consumption => {
          if (!consumption.readingDate) return false;
          const year = new Date(consumption.readingDate).getFullYear();
          return year === this.selectedYear;
        })
      })).filter(branch => branch.consumptions.length > 0);
    }

    // Apply meter filter
    if (this.selectedMeter) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        consumptions: branch.consumptions.filter(consumption => 
          consumption.meterId === this.selectedMeter
        )
      })).filter(branch => branch.consumptions.length > 0);
    }

    // Apply branch filter
    if (this.selectedBranch) {
      filteredList = filteredList.filter(branch => 
        branch.branchId === this.selectedBranch
      );
    }

    // Apply date range filter
    if (this.dateRange.start || this.dateRange.end) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        consumptions: branch.consumptions.filter(consumption => {
          if (!consumption.readingDate) return false;
          const readingDate = new Date(consumption.readingDate);
          
          let startMatch = true;
          let endMatch = true;
          
          if (this.dateRange.start) {
            startMatch = readingDate >= this.dateRange.start;
          }
          if (this.dateRange.end) {
            const endDate = new Date(this.dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            endMatch = readingDate <= endDate;
          }
          
          return startMatch && endMatch;
        })
      })).filter(branch => branch.consumptions.length > 0);
    }

    // Apply consumption range filter
    if (this.minConsumption !== null || this.maxConsumption !== null) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        consumptions: branch.consumptions.filter(consumption => {
          const cubicMeters = consumption.cubicMeters || 0;
          let minMatch = true;
          let maxMatch = true;
          
          if (this.minConsumption !== null) {
            minMatch = cubicMeters >= this.minConsumption;
          }
          if (this.maxConsumption !== null) {
            maxMatch = cubicMeters <= this.maxConsumption;
          }
          
          return minMatch && maxMatch;
        })
      })).filter(branch => branch.consumptions.length > 0);
    }

    // Apply source filter
    if (this.selectedSource) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        consumptions: branch.consumptions.filter(consumption => 
          consumption.source === this.selectedSource
        )
      })).filter(branch => branch.consumptions.length > 0);
    }

    this.branchConsumptionsList = filteredList;
    this.updateActiveFiltersCount();
  }

  updateActiveFiltersCount(): void {
    this.activeFiltersCount = 0;
    if (this.selectedYear) this.activeFiltersCount++;
    if (this.selectedMeter) this.activeFiltersCount++;
    if (this.selectedBranch) this.activeFiltersCount++;
    if (this.dateRange.start || this.dateRange.end) this.activeFiltersCount++;
    if (this.minConsumption !== null || this.maxConsumption !== null) this.activeFiltersCount++;
    if (this.selectedSource) this.activeFiltersCount++;
  }

  clearAllFilters(): void {
    this.selectedYear = null;
    this.selectedMeter = null;
    this.selectedBranch = null;
    this.dateRange = { start: null, end: null };
    this.minConsumption = null;
    this.maxConsumption = null;
    this.selectedSource = null;
    this.applyAllFilters();
  }

  // Helper methods
  private getBranchName(branchId: string): string {
    const branch = this.branchesMap.get(branchId);
    return branch ? branch.name : `Branch ${branchId}`;
  }

  private getMeterSerialNumber(meterId?: string): string {
    if (!meterId) return 'N/A';
    const meter = this.waterMetersMap.get(meterId);
    return meter ? meter.serialNumber : `Meter ${meterId}`;
  }

  getBranchAddress(branchId: string): string {
    const branch = this.branchesMap.get(branchId);
    return branch?.address || 'No address available';
  }

  getFilterSummary(): string {
    const filters = [];
    if (this.selectedYear) filters.push(`Year: ${this.selectedYear}`);
    if (this.selectedMeter) {
      const meter = this.availableMeters.find(m => m.id === this.selectedMeter);
      filters.push(`Meter: ${meter?.serialNumber}`);
    }
    if (this.selectedBranch) {
      const branch = this.availableBranches.find(b => b.id === this.selectedBranch);
      filters.push(`Branch: ${branch?.name}`);
    }
    if (this.selectedSource) filters.push(`Source: ${this.selectedSource}`);
    if (this.minConsumption !== null || this.maxConsumption !== null) {
      const range = [];
      if (this.minConsumption !== null) range.push(`Min: ${this.minConsumption}m³`);
      if (this.maxConsumption !== null) range.push(`Max: ${this.maxConsumption}m³`);
      filters.push(`Consumption: ${range.join(' - ')}`);
    }
    if (this.dateRange.start || this.dateRange.end) {
      const dates = [];
      if (this.dateRange.start) dates.push(`From: ${this.dateRange.start.toLocaleDateString()}`);
      if (this.dateRange.end) dates.push(`To: ${this.dateRange.end.toLocaleDateString()}`);
      filters.push(`Date: ${dates.join(' - ')}`);
    }

    return filters.length > 0 ? filters.join(' • ') : 'No filters applied';
  }

  // UI interaction methods
  editConsumption(id: string): void {
    this.router.navigate(['waterconsumption/update', id]);
  }

  deleteConsumption(id: string): void {
    if (confirm('Are you sure you want to delete this consumption record?')) {
      this.waterConsumptionService.delete(id).subscribe({
        next: () => {
          alert('Consumption record deleted successfully');
          this.loadConsumptionData();
        },
        error: (err) => {
          console.error('Failed to delete consumption record:', err);
          alert('Failed to delete consumption record. Please try again.');
        }
      });
    }
  }

  viewChart(branchId: string): void {
    this.router.navigate(['/waterconsumption/charts', branchId]);
  }

  toggleBranch(branchId: string): void {
    if (this.expandedBranches.has(branchId)) {
      this.expandedBranches.delete(branchId);
    } else {
      this.expandedBranches.add(branchId);
    }
  }

  isBranchExpanded(branchId: string): boolean {
    return this.expandedBranches.has(branchId);
  }

  // Statistics methods
  getTotalConsumptions(): number {
    return this.branchConsumptionsList.reduce((total, branch) => total + branch.consumptions.length, 0);
  }

  getTotalBranches(): number {
    return this.branchConsumptionsList.length;
  }

  getTotalConsumption(): number {
    return this.branchConsumptionsList.reduce((total, branch) => {
      return total + branch.consumptions.reduce((branchTotal, consumption) => 
        branchTotal + (consumption.cubicMeters ?? 0), 0);
    }, 0);
  }

  getBranchTotalConsumption(branchId: string): number {
    const branch = this.branchConsumptionsList.find(b => b.branchId === branchId);
    return branch ? branch.consumptions.reduce((total, c) => total + (c.cubicMeters ?? 0), 0) : 0;
  }
}