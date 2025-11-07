import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

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
    MatSelectModule,
    MatExpansionModule,
    HttpClientModule,
    RouterModule,
    DecimalPipe,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.css']
})
export class BranchListComponent implements OnInit, OnDestroy {
  branches: Branch[] = [];
  filteredBranches: Branch[] = [];
  displayedColumns: string[] = ['name', 'address', 'coordinates', 'phone', 'actions'];
  isLoading = false;
  
  // Advanced Search Filters
  searchFilters = {
    name: '',
    address: '',
    phone: '',
    searchType: 'all'
  };

  // Search type options
  searchTypeOptions = [
    { value: 'all', label: 'Search All Fields' },
    { value: 'name', label: 'Name Only' },
    { value: 'address', label: 'Address Only' },
    { value: 'phone', label: 'Phone Only' }
  ];

  // Advanced search panel state
  isAdvancedSearchOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    private branchService: BranchService, 
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadBranches();
    this.setupSearchDebounce();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearchDebounce() {
    // Debounce search input for better performance
    // This would be connected to form controls in a real implementation
  }

  loadBranches() {
    this.isLoading = true;
    this.branchService.getBranches().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.branches = data;
        this.filteredBranches = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.showNotification('❌ Failed to load branches. Please try again later.', 'error');
        this.isLoading = false;
      }
    });
  }

  applyAdvancedFilter() {
    if (!this.hasActiveFilters()) {
      this.filteredBranches = this.branches;
      return;
    }

    const searchText = this.searchFilters.name.toLowerCase() || 
                      this.searchFilters.address.toLowerCase() || 
                      this.searchFilters.phone.toLowerCase();

    this.filteredBranches = this.branches.filter(branch => {
      switch (this.searchFilters.searchType) {
        case 'name':
          return (branch.name?.toLowerCase() ?? '').includes(searchText);
        
        case 'address':
          return (branch.address?.toLowerCase() ?? '').includes(searchText);
        
        case 'phone':
          return (branch.phone?.toLowerCase() ?? '').includes(searchText);
        
        case 'all':
        default:
          return (
            (branch.name?.toLowerCase() ?? '').includes(searchText) ||
            (branch.address?.toLowerCase() ?? '').includes(searchText) ||
            (branch.phone?.toLowerCase() ?? '').includes(searchText)
          );
      }
    });
  }

  onFilterChange() {
    if (this.searchFilters.name || this.searchFilters.address || this.searchFilters.phone) {
      this.applyAdvancedFilter();
    } else {
      this.filteredBranches = this.branches;
    }
  }

  clearAllFilters() {
    this.searchFilters = {
      name: '',
      address: '',
      phone: '',
      searchType: 'all'
    };
    this.filteredBranches = this.branches;
  }

  hasActiveFilters(): boolean {
    return this.searchFilters.name !== '' || 
           this.searchFilters.address !== '' || 
           this.searchFilters.phone !== '';
  }

  getSearchFieldPlaceholder(): string {
    switch (this.searchFilters.searchType) {
      case 'name': return 'Search by branch name';
      case 'address': return 'Search by address';
      case 'phone': return 'Search by phone number';
      default: return 'Search in all fields';
    }
  }

  deleteBranch(branch: Branch) {
    if (!confirm(`Are you sure you want to delete "${branch.name}"? This action cannot be undone.`)) return;

    this.branchService.deleteBranch(branch).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showNotification('✅ Branch deleted successfully', 'success');
        this.loadBranches();
      },
      error: (err) => {
        console.error('Failed to delete branch:', err);
        this.showNotification('❌ Failed to delete branch. Please try again.', 'error');
      }
    });
  }

  goToCreateBranch() {
    this.router.navigate(['/branches/create']);
  }

  editBranch(branch: Branch) {
    this.router.navigate(['/branches/update', branch.id]);
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}