import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WaterMeterService, CreateWaterMeter, WaterMeterResponse } from '../watermeter.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';

@Component({
  selector: 'app-watermeter-update',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './watermeter-update.component.html',
  styleUrls: ['./watermeter-update.component.scss']
})
export class WaterMeterUpdateComponent implements OnInit {
  waterMeterForm = this.fb.group({
    serialNumber: ['', [Validators.required, Validators.maxLength(50)]],
    branchId: ['', Validators.required],
    status: ['Active', Validators.required]
  });

  statusOptions: string[] = ['Active', 'Maintenance', 'Disabled'];
  isSubmitting = false;
  meterId!: string;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private waterMeterService: WaterMeterService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.meterId = this.route.snapshot.paramMap.get('id')!;
    this.loadWaterMeter();
  }

  loadWaterMeter() {
    this.waterMeterService.getById(this.meterId).subscribe({
      next: (data: WaterMeterResponse) => {
        this.waterMeterForm.patchValue({
          serialNumber: data.serialNumber,
          branchId: data.branchId,
          status: data.status
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load water meter data:', err);
        alert('Failed to load water meter data. Please try again.');
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.waterMeterForm.invalid) return;
    this.isSubmitting = true;

    const data = this.waterMeterForm.value as CreateWaterMeter;

    this.waterMeterService.update(this.meterId, data).subscribe({
      next: () => {
        alert('✅ Water meter updated successfully');
        this.isSubmitting = false;
        this.router.navigate(['/watermeter/list']);
      },
      error: (err) => {
        console.error('Failed to update water meter:', err);
        alert('❌ Failed to update water meter. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  onCancel() {
    if (this.waterMeterForm.dirty) {
      const confirm = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
      if (!confirm) return;
    }
    this.router.navigate(['/watermeter/list']);
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'check_circle';
      case 'maintenance': return 'build';
      case 'disabled': return 'block';
      default: return 'help';
    }
  }
}