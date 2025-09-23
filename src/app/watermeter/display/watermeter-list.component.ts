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
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BranchMeters {
  branchId: string;
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
  displayedColumns: string[] = ['serialNumber', 'status', 'installationDate', 'actions'];
  expandedBranches: Set<string> = new Set();
  searchTerm = '';

  constructor(
    private waterMeterService: WaterMeterService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadWaterMeters();
  }

  loadWaterMeters() {
    this.waterMeterService.getAll().subscribe({
      next: (data) => {
        const grouped: { [key: string]: WaterMeterResponse[] } = {};
        data.forEach(meter => {
          if (!grouped[meter.branchId]) grouped[meter.branchId] = [];
          grouped[meter.branchId].push(meter);
        });
        this.branchMetersList = Object.keys(grouped).map(branchId => ({
          branchId,
          meters: grouped[branchId]
        }));
        
        this.filteredBranchMetersList = [...this.branchMetersList];
        
        // Auto-expand the first branch
        if (this.branchMetersList.length > 0) {
          this.expandedBranches.add(this.branchMetersList[0].branchId);
        }
      },
      error: (err) => console.error('Failed to load water meters:', err)
    });
  }

  applyFilter() {
    if (!this.searchTerm) {
      this.filteredBranchMetersList = [...this.branchMetersList];
      return;
    }

    const searchText = this.searchTerm.toLowerCase();
    this.filteredBranchMetersList = this.branchMetersList
      .map(branch => ({
        branchId: branch.branchId,
        meters: branch.meters.filter(meter => 
          meter.serialNumber.toLowerCase().includes(searchText) ||
          meter.status.toLowerCase().includes(searchText) ||
          branch.branchId.toLowerCase().includes(searchText)
        )
      }))
      .filter(branch => branch.meters.length > 0);
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredBranchMetersList = [...this.branchMetersList];
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
    return this.branchMetersList.reduce((total, branch) => total + branch.meters.length, 0);
  }

  getFilteredMeters(): number {
    return this.filteredBranchMetersList.reduce((total, branch) => total + branch.meters.length, 0);
  }

  getActiveMeters(): number {
    return this.branchMetersList.reduce((total, branch) => {
      return total + branch.meters.filter(m => m.status.toLowerCase() === 'active').length;
    }, 0);
  }

  getInactiveMeters(): number {
    return this.branchMetersList.reduce((total, branch) => {
      return total + branch.meters.filter(m => m.status.toLowerCase() === 'inactive').length;
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
}