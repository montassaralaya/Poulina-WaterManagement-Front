import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Layout components
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';

// Service
import { WaterConsumptionService } from '../water-consumption.service';

@Component({
  selector: 'app-update-water-consumption',
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
    MatProgressSpinnerModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './update-water-consumption.component.html',
  styleUrls: ['./update-water-consumption.component.scss']
})
export class UpdateWaterConsumptionComponent implements OnInit {
  waterConsumptionForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  consumptionId!: string;
  isLoading = true;

  sourceOptions: string[] = ['Well', 'Municipal', 'Recycled', 'Other'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private service: WaterConsumptionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.consumptionId = this.route.snapshot.paramMap.get('id')!;
    this.buildForm();
    this.loadConsumption();
  }

  buildForm() {
    this.waterConsumptionForm = this.fb.group({
      readingDate: [new Date(), Validators.required],
      cubicMeters: [0, [Validators.required, Validators.min(0)]],
      branchId: ['', Validators.required],
      meterId: [''],
      waterCost: [0, [Validators.min(0)]],
      source: ['', Validators.required],
      previousReading: [0, [Validators.min(0)]],
      note: ['']
    });
  }

  loadConsumption() {
    this.service.getById(this.consumptionId).subscribe({
      next: (data: any) => {
        this.waterConsumptionForm.patchValue({
          readingDate: new Date(data.readingDate),
          cubicMeters: data.cubicMeters,
          branchId: data.branchId,
          meterId: data.meterId || '',
          waterCost: data.waterCost ?? 0,
          source: data.source || '',
          previousReading: data.previousReading ?? 0,
          note: data.note || ''
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load water consumption data:', err);
        this.isLoading = false;
      }
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

    this.service.update(this.consumptionId, dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Water consumption record updated successfully! Redirecting to list in 3 seconds...';
        setTimeout(() => this.router.navigate(['/waterconsumption/list']), 3000);
      },
      error: (err) => {
        console.error('Failed to update water consumption:', err);
        this.isSubmitting = false;
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
