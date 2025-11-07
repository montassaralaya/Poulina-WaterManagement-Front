import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string; // optional if this item has children
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  openGroups: { [key: string]: boolean } = {};

  toggleGroup(group: string) {
    this.openGroups[group] = !this.openGroups[group];
  }

  menu: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    {
      label: 'Branches',
      icon: 'apartment',
      children: [
        { label: 'List Branches', icon: 'list', route: '/branches/list' },
        { label: 'Create Branch', icon: 'add_circle', route: '/branches/create' },
        { label: 'Branches Map', icon: 'map', route: '/branches-map' }
      ]
    },
    {
      label: 'Water Management',
      icon: 'opacity',
      children: [
        {
          label: 'Water Meters',
          icon: 'settings_input_component',
          children: [
            { label: 'List Meters', icon: 'list', route: '/watermeter/list' },
            { label: 'Add Meter', icon: 'add', route: '/watermeter/create' }
          ]
        },
        {
          label: 'Consumptions',
          icon: 'bar_chart',
          children: [
            { label: 'List Consumptions', icon: 'list', route: '/waterconsumption/list' },
            { label: 'Add Manually', icon: 'add', route: '/waterconsumption/create' }
          ]
        },
        {
          label: 'Water Bills',
          icon: 'receipt_long',
          children: [
            { label: 'List Bills', icon: 'list', route: '/water-bills/list' },
            { label: 'Add via OCR', icon: 'upload_file', route: '/water-bills/create-ocr' }
          ]
        }
      ]
    },
    { label: 'Reports', icon: 'bar_chart', route: '/reports' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
    { label: 'Admin', icon: 'admin_panel_settings', route: '/admin' }
  ];
}
