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

import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';

import { WaterConsumptionService, WaterConsumptionResponse } from '../water-consumption.service';

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
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './display-water-consumption.component.html',
  styleUrls: ['./display-water-consumption.component.scss']
})
export class DisplayWaterConsumptionComponent implements OnInit {
  branchConsumptionsList: {
    branchId: string;
    consumptions: WaterConsumptionResponse[];
  }[] = [];

  originalBranchList: { branchId: string; consumptions: WaterConsumptionResponse[] }[] = [];
  searchTerm: string = '';
  
  displayedColumns: string[] = ['readingDate', 'cubicMeters', 'meterId', 'actions'];
  expandedBranches: Set<string> = new Set();

  constructor(
    private router: Router,
    private waterConsumptionService: WaterConsumptionService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.waterConsumptionService.getAll().subscribe({
      next: (data: WaterConsumptionResponse[]) => {
        const grouped: { [branchId: string]: WaterConsumptionResponse[] } = {};
        data.forEach(item => {
          if (!grouped[item.branchId]) grouped[item.branchId] = [];
          grouped[item.branchId].push(item);
        });

        this.originalBranchList = Object.keys(grouped).map(branchId => ({
          branchId,
          consumptions: grouped[branchId]
        }));
        
        this.applyFilter(); // Apply any existing search filter
        
        // Auto-expand the first branch
        if (this.branchConsumptionsList.length > 0) {
          this.expandedBranches.add(this.branchConsumptionsList[0].branchId);
        }
      },
      error: (err) => {
        console.error('Failed to load water consumption data:', err);
      }
    });
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.branchConsumptionsList = [...this.originalBranchList];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.branchConsumptionsList = this.originalBranchList
      .map(branch => ({
        branchId: branch.branchId,
        consumptions: branch.consumptions.filter(consumption => 
          this.consumptionMatches(consumption, searchTermLower))
      }))
      .filter(branch => 
        branch.branchId.toLowerCase().includes(searchTermLower) || 
        branch.consumptions.length > 0
      );
  }

  consumptionMatches(consumption: WaterConsumptionResponse, term: string): boolean {
    // Check branch ID
    if (consumption.branchId?.toLowerCase().includes(term)) return true;
    
    // Check meter ID
    if (consumption.meterId?.toLowerCase().includes(term)) return true;
    
    // Check meter serial number
    if (consumption.meterSerialNumber?.toLowerCase().includes(term)) return true;
    
    // Check date
    if (consumption.readingDate) {
      const readingDate = new Date(consumption.readingDate);
      const dateString = readingDate.toLocaleDateString();
      if (dateString.toLowerCase().includes(term)) return true;
    }
    
    return false;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  goToCreate(): void {
    this.router.navigate(['/waterconsumption/create']);
  }

  editConsumption(id: string): void {
    this.router.navigate(['waterconsumption/update', id]);
  }

  deleteConsumption(id: string): void {
    if (confirm('Are you sure you want to delete this consumption record?')) {
      this.waterConsumptionService.delete(id).subscribe({
        next: () => {
          alert('Consumption record deleted successfully');
          this.loadData();
        },
        error: (err) => {
          console.error('Failed to delete consumption record:', err);
          alert('Failed to delete consumption record. Please try again.');
        }
      });
    }
  }

  viewChart(branchId: string): void {
    this.router.navigate(['/waterconsumption/chart', branchId]);
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
    if (!branch) return 0;
    
    return branch.consumptions.reduce((total, consumption) => 
      total + (consumption.cubicMeters ?? 0), 0);
  }
}
