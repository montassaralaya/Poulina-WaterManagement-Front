import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BranchService, CreateBranch } from '../branch.service';
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';

@Component({
  selector: 'app-branch-update',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './branch-update.component.html',
  styleUrls: ['./branch-update.component.css']
})
export class BranchUpdateComponent implements OnInit {
  branchForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  branchId!: string;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.branchId = this.route.snapshot.paramMap.get('id')!;
    
    this.branchForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      address: ['', [Validators.maxLength(200)]],
      latitude: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
      phone: ['']
    });

    // Load existing branch data
    this.branchService.getBranches().subscribe({
      next: (branches) => {
        const branch = branches.find(b => b.id === this.branchId);
        if (branch) {
          this.branchForm.patchValue(branch);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load branch data', err);
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.branchForm.invalid) return;

    this.isSubmitting = true;
    const dto: CreateBranch = { ...this.branchForm.value };

    this.branchService.updateBranch(this.branchId, dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Branch updated successfully!';
        setTimeout(() => this.router.navigate(['branches/list']), 2000);
      },
      error: (err) => {
        console.error('Failed to update branch', err);
        this.isSubmitting = false;
        // Consider adding a user-friendly error message here
      }
    });
  }

  onCancel() {
    if (this.branchForm.dirty) {
      const confirm = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
      if (!confirm) return;
    }
    this.router.navigate(['branches/list']);
  }
}