import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { BranchService, Branch } from '../branch.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    HttpClientModule,
    RouterModule,
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss']
})
export class BranchListComponent implements OnInit {
  branches: Branch[] = [];
  filteredBranches: Branch[] = [];
  displayedColumns: string[] = ['name', 'address', 'coordinates', 'phone', 'actions'];
  isLoading = false;
  searchTerm = '';

  constructor(private branchService: BranchService, private router: Router) {}

  ngOnInit() {
    this.loadBranches();
  }

  loadBranches() {
    this.isLoading = true;
    this.branchService.getBranches().subscribe({
      next: (data) => {
        this.branches = data;
        this.filteredBranches = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to load branches. Please try again later.');
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    if (!this.searchTerm) {
      this.filteredBranches = this.branches;
      return;
    }

    const searchText = this.searchTerm.toLowerCase();
    this.filteredBranches = this.branches.filter(branch => 
      (branch.name?.toLowerCase() ?? '').includes(searchText) ||
      (branch.address?.toLowerCase() ?? '').includes(searchText) ||
      (branch.phone?.toLowerCase() ?? '').includes(searchText)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredBranches = this.branches;
  }

  deleteBranch(branch: Branch) {
    if (!confirm(`Are you sure you want to delete "${branch.name}"? This action cannot be undone.`)) return;

    this.branchService.deleteBranch(branch).subscribe({
      next: () => {
        alert('✅ Branch deleted successfully');
        this.loadBranches();
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to delete branch. Please try again.');
      }
    });
  }

  goToCreateBranch() {
    this.router.navigate(['/branches/create']);
  }

  editBranch(branch: Branch) {
    this.router.navigate(['/branches/update', branch.id]);
  }
}
