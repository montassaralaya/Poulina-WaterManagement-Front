import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { UserService, UserProfile } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    HttpClientModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  username = 'Loading...';
  isAuthenticated = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
  }

  checkAuthentication(): void {
    this.authService.debugToken();
    
    this.isAuthenticated = this.authService.isAuthenticated();
    console.log('[Header] Authentication status:', this.isAuthenticated);
    
    if (this.isAuthenticated) {
      this.loadUser();
    } else {
      this.username = 'Guest';
      console.log('[Header] User not authenticated, showing Guest');
    }
  }

  loadUser(): void {
  console.log('[Header] Loading user profile...');
  
  // First try to get user from token (fallback)
  const userFromToken = this.authService.getUserFromToken();
  if (userFromToken) {
    this.username = userFromToken.username;
    console.log('[Header] Set username from token:', userFromToken.username);
  }
  
  // Then try API call
  this.userService.getProfile().subscribe({
    next: (user: UserProfile) => {
      console.log('[Header] User profile loaded successfully:', user);
      
      // Only update if we got real data from API
      if (user.username && user.username !== 'User') {
        this.username = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username;
      }
    },
    error: (error) => {
      console.error('[Header] Failed to load user profile:', error);
      // Username is already set from token, so we don't need to do anything
    }
  });
}

  goToProfile(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    console.log('[Header] Logging out user');
    this.authService.removeToken();
    this.isAuthenticated = false;
    this.username = 'Guest';
    this.router.navigate(['/login']);
  }

  debugAuth(): void {
    console.log('=== AUTH DEBUG INFO ===');
    this.authService.debugToken();
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('Current route:', this.router.url);
    this.loadUser();
  }
  testBackend(): void {
  this.authService.testBackendConnection();
}
}