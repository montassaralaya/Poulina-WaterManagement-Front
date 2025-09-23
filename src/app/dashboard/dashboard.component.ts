import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    
        MatIconModule,
        MatButtonModule,
        HeaderComponent,
        FooterComponent,
        SidebarComponent,
        RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  title = 'Poulina-WaterManagement-Front';
  isLoggedIn = false; // Change to true to see dashboard
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
  constructor(private router: Router) {}


}
