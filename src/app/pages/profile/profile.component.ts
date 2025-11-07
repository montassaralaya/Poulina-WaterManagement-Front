import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService, UserProfile } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class ProfileComponent implements OnInit {
  user: UserProfile | null = null;
  isLoading = true;

  constructor(
    private userService: UserService, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('[Profile] ngOnInit called');
    this.loadUserProfile();
  }

  // In your profile component
loadUserProfile(): void {
  this.isLoading = true;
  
  // Get user data from token first (immediate)
  const userFromToken = this.authService.getUserFromToken();
  if (userFromToken) {
    this.user = userFromToken;
    console.log('[Profile] Set user from token:', userFromToken);
  }
  
  // Then try API call
  this.userService.getProfile().subscribe({
    next: (data) => {
      this.isLoading = false;
      console.log('[Profile] User data loaded from API:', data);
      
      // Only update if we got real data from API
      if (data && data.id !== 'unknown') {
        this.user = data;
      }
    },
    error: (err) => {
      this.isLoading = false;
      console.error('[Profile] Failed to load user from API', err);
      // User data is already set from token, so no action needed
    }
  });
}

  goBack() {
    this.router.navigate(['/dashboard']); // change if your route is different
  }
}
