import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';

// Layout components
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';

// Service
import { WaterConsumptionService } from '../water-consumption.service';

@Component({
  selector: 'app-create-water-consumption',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './create-water-consumption.component.html',
  styleUrls: ['./create-water-consumption.component.scss']
})
export class CreateWaterConsumptionComponent implements OnInit {
  waterConsumptionForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private waterConsumptionService: WaterConsumptionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.waterConsumptionForm = this.fb.group({
      readingDate: [new Date(), Validators.required],
      cubicMeters: [0, [Validators.required, Validators.min(0)]],
      branchId: ['', Validators.required],
      meterId: [''] // optional
    });
  }

  onSubmit() {
    if (this.waterConsumptionForm.invalid) return;

    this.isSubmitting = true;
    this.successMessage = '';

    const dto = {
      ...this.waterConsumptionForm.value,
      readingDate: this.waterConsumptionForm.value.readingDate.toISOString()
    };

    this.waterConsumptionService.create(dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Water consumption record created successfully! Redirecting to list in 3 seconds...';

        // Reset form
        this.waterConsumptionForm.reset({ 
          readingDate: new Date(), 
          cubicMeters: 0, 
          branchId: '', 
          meterId: '' 
        });

        // Navigate back to list after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/waterconsumption/list']);
        }, 3000);
      },
      error: (err: any) => {
        console.error('Failed to create water consumption:', err);
        this.isSubmitting = false;
        // Consider adding a user-friendly error message here
      }
    });
  }

  onCancel() {
    if (this.waterConsumptionForm.dirty) {
      const confirm = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
      if (!confirm) return;
    }
    this.router.navigate(['/waterconsumption/list']);
  }
}