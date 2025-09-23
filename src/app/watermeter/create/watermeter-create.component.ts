import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { WaterMeterService, CreateWaterMeter } from '../watermeter.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-watermeter-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    HttpClientModule,
    CommonModule
  ],
  templateUrl: './watermeter-create.component.html',
  styleUrls: ['./watermeter-create.component.scss']
})
export class WaterMeterCreateComponent {
  waterMeterForm = this.fb.group({
    serialNumber: ['', [Validators.required, Validators.maxLength(50)]],
    branchId: ['', Validators.required],
    status: ['Active'] // default value
  });

  statusOptions: string[] = ['Active', 'Maintenance', 'Disabled'];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private waterMeterService: WaterMeterService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.waterMeterForm.invalid) return;
    this.isSubmitting = true;

    const data = this.waterMeterForm.value as CreateWaterMeter;

    this.waterMeterService.create(data).subscribe({
      next: () => {
        // In a real application, consider using a snackbar/toast instead of alert
        alert('✅ Water meter created successfully');
        this.isSubmitting = false;
        this.router.navigate(['watermeter/list']);
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to create water meter. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  onCancel() {
    if (this.waterMeterForm.dirty) {
      const confirm = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
      if (!confirm) return;
    }
    this.router.navigate(['watermeter/list']);
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