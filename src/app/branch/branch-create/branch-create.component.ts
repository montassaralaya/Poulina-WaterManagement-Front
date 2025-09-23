import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { BranchService, CreateBranch } from '../branch.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-branch-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    HttpClientModule
  ],
  templateUrl: './branch-create.component.html',
  styleUrls: ['./branch-create.component.scss']
})
export class BranchCreateComponent {
  branchForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.maxLength(200)]],
    latitude: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
    phone: ['']
  });

  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private branchService: BranchService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.branchForm.invalid) return;
    this.isSubmitting = true;

    const branchData = this.branchForm.value as CreateBranch;

    this.branchService.create(branchData).subscribe({
      next: () => {
        // In a real application, consider using a snackbar/toast instead of alert
        alert('✅ Branch created successfully');
        this.isSubmitting = false;
        this.router.navigate(['branches/list']);
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to create branch. Please try again.');
        this.isSubmitting = false;
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