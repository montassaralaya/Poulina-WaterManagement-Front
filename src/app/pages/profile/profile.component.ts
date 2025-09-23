import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserService, UserProfile } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule]
})
export class ProfileComponent implements OnInit {
  user: UserProfile | null = null;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    console.log('[Profile] ngOnInit called');
    this.userService.getProfile().subscribe({
      next: (data) => {
        console.log('[Profile] User data loaded:', data);
        this.user = data;
      },
      error: (err) => {
        console.error('[Profile] Failed to load user', err);
        this.user = null;
      }
    });
  }

  goBack() {
    this.router.navigate(['/']); // adjust to your home/dashboard route
  }
}
