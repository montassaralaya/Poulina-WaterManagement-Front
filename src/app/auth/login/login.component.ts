import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
    
    // Inline Google SVG
    this.iconRegistry.addSvgIconLiteral(
      'google',
      this.sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
          <path fill="#4285F4" d="M488 261.8c0-17.4-1.5-34.1-4.3-50.3H249v95h134.5c-5.8 31.3-23.4 57.8-50 75.6v62.7h80.8c47.3-43.6 73.7-107.9 73.7-183z"/>
          <path fill="#34A853" d="M249 492c67.8 0 124.6-22.4 166-60.9l-80.8-62.7c-22.4 15-51 24-85.2 24-65.4 0-120.8-44.1-140.5-103.4H27.6v64.9C68.8 445 153.3 492 249 492z"/>
          <path fill="#FBBC05" d="M108.5 288c-4.8-14.4-7.6-29.8-7.6-45.5s2.8-31.1 7.6-45.5v-64.9H27.6C10.2 157.8 0 202.5 0 242.5s10.2 84.7 27.6 110.4l80.9-64.9z"/>
          <path fill="#EA4335" d="M249 97.6c35.7 0 67.8 12.3 93.1 36.2l69.7-69.7C373.4 25.2 316.8 0 249 0 153.3 0 68.8 47 27.6 132.1l80.9 64.9C128.2 141.7 183.6 97.6 249 97.6z"/>
        </svg>
      `)
    );

    // Inline Microsoft SVG
    this.iconRegistry.addSvgIconLiteral(
      'microsoft',
      this.sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
          <path fill="#F35325" d="M1 1h10v10H1z"/>
          <path fill="#81BC06" d="M12 1h10v10H12z"/>
          <path fill="#05A6F0" d="M1 12h10v10H1z"/>
          <path fill="#FFBA08" d="M12 12h10v10H12z"/>
        </svg>
      `)
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.snackBar.open(this.errorMessage, 'Dismiss', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.snackBar.open('Login successful! Redirecting...', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Get return URL from query parameters or default to '/dashboard'
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        
        setTimeout(() => {
          this.router.navigateByUrl(returnUrl);
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Invalid email or password.';
        // FIX: Use a fallback message when errorMessage is null
        this.snackBar.open(this.errorMessage || 'Login failed', 'Dismiss', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}