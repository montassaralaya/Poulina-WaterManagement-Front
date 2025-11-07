import { Component, OnInit } from '@angular/core';
import { WaterMeterService, WaterMeterResponse } from '../watermeter.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
import { FormsModule } from '@angular/forms';
import { BranchDashboardService, Branch } from '../../dashboard/services/branch-dashboard.service';

interface BranchMeters {
  branchId: string;
  branchName: string;
  meters: WaterMeterResponse[];
}

@Component({
  selector: 'app-watermeter-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
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
    FooterComponent,
    FormsModule
  ],
  templateUrl: './watermeter-list.component.html',
  styleUrls: ['./watermeter-list.component.scss']
})
export class WaterMeterListComponent implements OnInit {
  branchMetersList: BranchMeters[] = [];
  filteredBranchMetersList: BranchMeters[] = [];
  originalBranchMetersList: BranchMeters[] = [];
  
  // Filter properties
  selectedStatus: string | null = null;
  selectedBranch: string | null = null;
  selectedMeterType: string | null = null;
  installationDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  maintenanceDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  serialNumberSearch: string = '';
  
  // Filter options
  availableStatuses: string[] = ['Active', 'Inactive', 'Maintenance'];
  availableBranches: { id: string; name: string }[] = [];
  availableMeterTypes: string[] = ['Digital', 'Analog', 'Smart', 'Mechanical'];
  
  // UI state
  displayedColumns: string[] = [
    'serialNumber',
    'status',
    'branchName',
    'installedAt',
    'lastMaintenance',
    'meterType',
    'actions'
  ];
  expandedBranches: Set<string> = new Set();
  filterPanelExpanded = false;
  activeFiltersCount = 0;

  // Branch map for quick lookups
  private branchesMap: Map<string, Branch> = new Map();

  constructor(
    private waterMeterService: WaterMeterService,
    private branchService: BranchDashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBranches();
  }

  private loadBranches(): void {
    this.branchService.getBranches().subscribe({
      next: (branches: Branch[]) => {
        this.branchesMap.clear();
        this.availableBranches = [];
        branches.forEach(branch => {
          this.branchesMap.set(branch.id, branch);
          this.availableBranches.push({ id: branch.id, name: branch.name });
        });
        this.loadWaterMeters();
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.loadWaterMeters();
      }
    });
  }

  loadWaterMeters() {
    this.waterMeterService.getAll().subscribe({
      next: (data) => {
        // Convert date strings to Date objects
        data.forEach(meter => {
          meter.installedAt = meter.installedAt ? new Date(meter.installedAt) : null;
          meter.lastMaintenance = meter.lastMaintenance ? new Date(meter.lastMaintenance) : null;
        });

        // Group by branchId and include branch names
        const grouped: { [key: string]: WaterMeterResponse[] } = {};
        data.forEach(meter => {
          if (!grouped[meter.branchId]) grouped[meter.branchId] = [];
          grouped[meter.branchId].push(meter);
        });

        this.originalBranchMetersList = Object.keys(grouped).map(branchId => ({
          branchId,
          branchName: this.getBranchName(branchId),
          meters: grouped[branchId]
        }));
        
        this.applyAllFilters();
        
        // Auto-expand the first branch
        if (this.branchMetersList.length > 0) {
          this.expandedBranches.add(this.branchMetersList[0].branchId);
        }
      },
      error: (err) => console.error('Failed to load water meters:', err)
    });
  }

  private getBranchName(branchId: string): string {
    const branch = this.branchesMap.get(branchId);
    return branch ? branch.name : `Branch ${branchId}`;
  }

  applyAllFilters(): void {
    let filteredList = [...this.originalBranchMetersList];

    // Apply serial number search
    if (this.serialNumberSearch) {
      const searchTermLower = this.serialNumberSearch.toLowerCase();
      filteredList = filteredList
        .map(branch => ({
          ...branch,
          meters: branch.meters.filter(meter => 
            meter.serialNumber.toLowerCase().includes(searchTermLower))
        }))
        .filter(branch => branch.meters.length > 0);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        meters: branch.meters.filter(meter => 
          meter.status.toLowerCase() === this.selectedStatus!.toLowerCase()
        )
      })).filter(branch => branch.meters.length > 0);
    }

    // Apply branch filter
    if (this.selectedBranch) {
      filteredList = filteredList.filter(branch => 
        branch.branchId === this.selectedBranch
      );
    }

    // Apply meter type filter
    if (this.selectedMeterType) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        meters: branch.meters.filter(meter => 
          meter.meterType?.toLowerCase() === this.selectedMeterType!.toLowerCase()
        )
      })).filter(branch => branch.meters.length > 0);
    }

    // Apply installation date range filter
    if (this.installationDateRange.start || this.installationDateRange.end) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        meters: branch.meters.filter(meter => {
          if (!meter.installedAt) return false;
          const installedDate = new Date(meter.installedAt);
          
          let startMatch = true;
          let endMatch = true;
          
          if (this.installationDateRange.start) {
            startMatch = installedDate >= this.installationDateRange.start;
          }
          if (this.installationDateRange.end) {
            const endDate = new Date(this.installationDateRange.end);
            endDate.setHours(23, 59, 59, 999);
            endMatch = installedDate <= endDate;
          }
          
          return startMatch && endMatch;
        })
      })).filter(branch => branch.meters.length > 0);
    }

    // Apply maintenance date range filter
    if (this.maintenanceDateRange.start || this.maintenanceDateRange.end) {
      filteredList = filteredList.map(branch => ({
        ...branch,
        meters: branch.meters.filter(meter => {
          if (!meter.lastMaintenance) return false;
          const maintenanceDate = new Date(meter.lastMaintenance);
          
          let startMatch = true;
          let endMatch = true;
          
          if (this.maintenanceDateRange.start) {
            startMatch = maintenanceDate >= this.maintenanceDateRange.start;
          }
          if (this.maintenanceDateRange.end) {
            const endDate = new Date(this.maintenanceDateRange.end);
            endDate.setHours(23, 59, 59, 999);
            endMatch = maintenanceDate <= endDate;
          }
          
          return startMatch && endMatch;
        })
      })).filter(branch => branch.meters.length > 0);
    }

    this.branchMetersList = filteredList;
    this.updateActiveFiltersCount();
  }

  updateActiveFiltersCount(): void {
    this.activeFiltersCount = 0;
    if (this.serialNumberSearch) this.activeFiltersCount++;
    if (this.selectedStatus) this.activeFiltersCount++;
    if (this.selectedBranch) this.activeFiltersCount++;
    if (this.selectedMeterType) this.activeFiltersCount++;
    if (this.installationDateRange.start || this.installationDateRange.end) this.activeFiltersCount++;
    if (this.maintenanceDateRange.start || this.maintenanceDateRange.end) this.activeFiltersCount++;
  }

  clearAllFilters(): void {
    this.serialNumberSearch = '';
    this.selectedStatus = null;
    this.selectedBranch = null;
    this.selectedMeterType = null;
    this.installationDateRange = { start: null, end: null };
    this.maintenanceDateRange = { start: null, end: null };
    this.applyAllFilters();
  }

  getFilterSummary(): string {
    const filters = [];
    if (this.serialNumberSearch) filters.push(`Serial: "${this.serialNumberSearch}"`);
    if (this.selectedStatus) filters.push(`Status: ${this.selectedStatus}`);
    if (this.selectedBranch) {
      const branch = this.availableBranches.find(b => b.id === this.selectedBranch);
      filters.push(`Branch: ${branch?.name}`);
    }
    if (this.selectedMeterType) filters.push(`Type: ${this.selectedMeterType}`);
    if (this.installationDateRange.start || this.installationDateRange.end) {
      const dates = [];
      if (this.installationDateRange.start) dates.push(`From: ${this.installationDateRange.start.toLocaleDateString()}`);
      if (this.installationDateRange.end) dates.push(`To: ${this.installationDateRange.end.toLocaleDateString()}`);
      filters.push(`Installation: ${dates.join(' - ')}`);
    }
    if (this.maintenanceDateRange.start || this.maintenanceDateRange.end) {
      const dates = [];
      if (this.maintenanceDateRange.start) dates.push(`From: ${this.maintenanceDateRange.start.toLocaleDateString()}`);
      if (this.maintenanceDateRange.end) dates.push(`To: ${this.maintenanceDateRange.end.toLocaleDateString()}`);
      filters.push(`Maintenance: ${dates.join(' - ')}`);
    }

    return filters.length > 0 ? filters.join(' • ') : 'No filters applied';
  }

  editMeter(id: string) {
    this.router.navigate(['/watermeter/edit', id]);
  }

  deleteMeter(id: string) {
    if (!confirm('Are you sure you want to delete this water meter?')) return;
    this.waterMeterService.delete(id).subscribe({
      next: () => {
        alert('Water meter deleted successfully');
        this.loadWaterMeters();
      },
      error: (err) => {
        console.error('Failed to delete water meter:', err);
        alert('Failed to delete water meter. Please try again.');
      }
    });
  }

  goToCreate() {
    this.router.navigate(['/watermeter/create']);
  }

  toggleBranch(branchId: string) {
    if (this.expandedBranches.has(branchId)) {
      this.expandedBranches.delete(branchId);
    } else {
      this.expandedBranches.add(branchId);
    }
  }

  isBranchExpanded(branchId: string): boolean {
    return this.expandedBranches.has(branchId);
  }

  getTotalMeters(): number {
    return this.originalBranchMetersList.reduce((total, branch) => total + branch.meters.length, 0);
  }

  getFilteredMeters(): number {
    return this.branchMetersList.reduce((total, branch) => total + branch.meters.length, 0);
  }

  getActiveMeters(): number {
    return this.originalBranchMetersList.reduce((total, branch) => {
      return total + branch.meters.filter(m => m.status.toLowerCase() === 'active').length;
    }, 0);
  }

  getInactiveMeters(): number {
    return this.originalBranchMetersList.reduce((total, branch) => {
      return total + branch.meters.filter(m => m.status.toLowerCase() === 'inactive').length;
    }, 0);
  }

  getMaintenanceMeters(): number {
    return this.originalBranchMetersList.reduce((total, branch) => {
      return total + branch.meters.filter(m => m.status.toLowerCase() === 'maintenance').length;
    }, 0);
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'check_circle';
      case 'inactive': return 'cancel';
      case 'maintenance': return 'build';
      default: return 'help';
    }
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}