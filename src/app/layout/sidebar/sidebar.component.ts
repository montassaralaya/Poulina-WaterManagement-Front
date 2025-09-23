import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common'; // ✅ <-- add this
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule], // ✅ <-- add it here
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  openGroups: { [key: string]: boolean } = {
    branches: false,
    water: false
  };

  toggleGroup(group: string) {
    this.openGroups[group] = !this.openGroups[group];
  }

  menu = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    {
      label: 'Branches',
      icon: 'apartment',
      key: 'branches',
      children: [
        { label: 'List Branches', icon: 'list', route: '/branches/list' },
        { label: 'Create Branch', icon: 'add_circle', route: '/branches/create' }
      ]
    },
    {
      label: 'Water Management',
      icon: 'opacity',
      key: 'water',
      children: [
        { label: 'Water Meters', icon: 'settings_input_component', route: '/watermeter/list' },
        { label: 'Consumptions', icon: 'bar_chart', route: '/waterconsumption/list' },
        { label: 'Bills', icon: 'receipt_long', route: '/water-bills/list' }
      ]
    },
    { label: 'Reports', icon: 'bar_chart', route: '/reports' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
    { label: 'Admin', icon: 'admin_panel_settings', route: '/admin' }
  ];
}
