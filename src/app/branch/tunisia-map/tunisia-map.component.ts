import { Component, AfterViewInit, inject, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { BranchService, Branch } from '../branch.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

interface MapRegion {
  name: string;
  bounds: [[number, number], [number, number]];
  color: string;
}

@Component({
  selector: 'app-tunisia-map',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './tunisia-map.component.html',
  styleUrls: ['./tunisia-map.component.css']
})
export class TunisiaMapComponent implements AfterViewInit, OnInit, OnDestroy {
  private map: any;
  private markerCluster: any;
  private platformId = inject(PLATFORM_ID);
  private snackBar = inject(MatSnackBar);

  branches: Branch[] = [];
  filteredBranches: Branch[] = [];
  mappedBranchesCount = 0;
  isLoading = false;
  selectedBranch: Branch | null = null;
  searchTerm = '';
  selectedRegion: string = 'all';
  viewMode: 'map' | 'list' | 'split' = 'split';
  isMapFullscreen = false;
  userLocation: { lat: number; lng: number } | null = null;

  // Tunisia regions data
  regions: MapRegion[] = [
    { name: 'Tunis', bounds: [[36.7, 10.0], [36.9, 10.3]], color: '#3498db' },
    { name: 'Sfax', bounds: [[34.5, 10.4], [34.8, 10.8]], color: '#e74c3c' },
    { name: 'Sousse', bounds: [[35.8, 10.4], [36.1, 10.7]], color: '#2ecc71' },
    { name: 'Gabès', bounds: [[33.8, 9.8], [34.0, 10.2]], color: '#f39c12' },
    { name: 'Bizerte', bounds: [[37.0, 9.5], [37.4, 9.9]], color: '#9b59b6' },
    { name: 'Kairouan', bounds: [[35.5, 9.9], [35.8, 10.3]], color: '#1abc9c' }
  ];

  constructor(private branchService: BranchService) {}

  ngOnInit() {
    this.loadBranches();
  }

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      await this.initMap();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private async initMap(): Promise<void> {
    const L = await import('leaflet');
    // Import marker cluster plugin - use .catch to handle potential import errors
    await import('leaflet.markercluster').catch(err => {
      console.warn('Leaflet marker cluster plugin not available:', err);
    });

    this.map = L.map('map', {
      center: [34.0, 9.0],
      zoom: 6,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: true
    });

    // Set bounds for Tunisia
    const bounds = L.latLngBounds(
      L.latLng(30.0, 7.0),
      L.latLng(38.0, 12.0)
    );
    this.map.setMaxBounds(bounds);

    // Add different tile layers
    const baseLayers = {
      "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }),
      "Satellite": L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google'
      }),
      "Light": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 20
      })
    };

    baseLayers["OpenStreetMap"].addTo(this.map);

    // Add layer control
    L.control.layers(baseLayers).addTo(this.map);

    // Initialize marker cluster if available, otherwise use feature group
    if ((L as any).markerClusterGroup) {
      this.markerCluster = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true
      });
      this.map.addLayer(this.markerCluster);
    } else {
      console.warn('MarkerClusterGroup not available, using FeatureGroup instead');
      this.markerCluster = L.featureGroup();
      this.map.addLayer(this.markerCluster);
    }

    this.addBranchMarkers(L);
    this.addRegionOverlays(L);

    // Add scale control
    L.control.scale({ imperial: false }).addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 300);

    // Add map event listeners
    this.map.on('click', () => {
      this.selectedBranch = null;
    });

    this.showNotification('Map loaded successfully. Click on branches to see details.');
  }

  private addBranchMarkers(L: any): void {
    // Clear existing markers
    this.markerCluster.clearLayers();

    const branchIcon = L.divIcon({
      html: '<div class="custom-marker"><mat-icon class="marker-icon">business</mat-icon></div>',
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    const selectedBranchIcon = L.divIcon({
      html: '<div class="custom-marker selected"><mat-icon class="marker-icon">business</mat-icon></div>',
      className: 'custom-div-icon selected',
      iconSize: [50, 50],
      iconAnchor: [25, 50]
    });

    this.filteredBranches.forEach(branch => {
      if (branch.latitude && branch.longitude) {
        const isSelected = this.selectedBranch?.id === branch.id;
        const marker = L.marker([branch.latitude, branch.longitude], { 
          icon: isSelected ? selectedBranchIcon : branchIcon 
        });

        const popupContent = this.createPopupContent(branch);
        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'branch-popup-custom'
        });

        marker.on('click', (e: any) => {
          this.selectedBranch = branch;
          // Update all markers to use regular icon except the selected one
          this.markerCluster.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) {
              layer.setIcon(branchIcon);
            }
          });
          marker.setIcon(selectedBranchIcon);
          this.map.setView([branch.latitude!, branch.longitude!], 15);
        });

        marker.on('popupopen', () => {
          this.selectedBranch = branch;
        });

        this.markerCluster.addLayer(marker);
      }
    });

    // Fit bounds to show all markers
    if (this.filteredBranches.filter(b => b.latitude && b.longitude).length > 0) {
      const group = L.featureGroup(
        this.filteredBranches
          .filter(b => b.latitude && b.longitude)
          .map(b => L.marker([b.latitude!, b.longitude!]))
      );
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private createPopupContent(branch: Branch): string {
    return `
      <div class="branch-popup">
        <h3>${branch.name}</h3>
        <div class="popup-details">
          <p><strong>📍 Address:</strong> ${branch.address || 'N/A'}</p>
          <p><strong>📞 Phone:</strong> ${branch.phone || 'N/A'}</p>
          <p><strong>🌐 Coordinates:</strong> ${branch.latitude?.toFixed(4)}, ${branch.longitude?.toFixed(4)}</p>
        </div>
      </div>
    `;
  }

  private addRegionOverlays(L: any): void {
    this.regions.forEach(region => {
      const rectangle = L.rectangle(region.bounds, {
        color: region.color,
        weight: 2,
        fillOpacity: 0.1,
        className: 'region-overlay'
      });

      rectangle.bindTooltip(region.name, {
        permanent: false,
        direction: 'center',
        className: 'region-tooltip'
      });

      rectangle.on('click', () => {
        this.selectedRegion = region.name;
        this.applyFilters();
        this.map.fitBounds(region.bounds);
      });

      rectangle.addTo(this.map);
    });
  }

  loadBranches() {
    this.isLoading = true;
    this.branchService.getBranches().subscribe({
      next: (data) => {
        this.branches = data;
        this.filteredBranches = [...this.branches];
        this.mappedBranchesCount = this.branches.filter(b => b.latitude && b.longitude).length;
        this.isLoading = false;

        if (this.map) {
          this.addBranchMarkers((window as any).L);
        }

        this.showNotification(`${this.branches.length} branches loaded successfully`);
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.isLoading = false;
        this.showNotification('Error loading branches. Please try again.', 'error');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.branches];

    // Apply search filter
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(branch =>
        branch.name.toLowerCase().includes(searchTermLower) ||
        (branch.address || '').toLowerCase().includes(searchTermLower) ||
        (branch.phone || '').toLowerCase().includes(searchTermLower)
      );
    }

    // Apply region filter
    if (this.selectedRegion !== 'all') {
      const region = this.regions.find(r => r.name === this.selectedRegion);
      if (region) {
        filtered = filtered.filter(branch => {
          if (!branch.latitude || !branch.longitude) return false;
          const [southWest, northEast] = region.bounds;
          return branch.latitude >= southWest[0] && branch.latitude <= northEast[0] &&
                 branch.longitude >= southWest[1] && branch.longitude <= northEast[1];
        });
      }
    }

    this.filteredBranches = filtered;

    if (this.map) {
      this.addBranchMarkers((window as any).L);
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRegion = 'all';
    this.applyFilters();
    this.showAllBranches();
  }

  zoomToBranch(branch: Branch): void {
    if (branch.latitude && branch.longitude) {
      this.selectedBranch = branch;
      this.map.setView([branch.latitude, branch.longitude], 15);

      // Open popup for the selected branch
      this.markerCluster.eachLayer((layer: any) => {
        if (layer instanceof (window as any).L.Marker) {
          const latLng = layer.getLatLng();
          if (latLng.lat === branch.latitude && latLng.lng === branch.longitude) {
            layer.openPopup();
          }
        }
      });
    }
  }

  showAllBranches(): void {
    const L = (window as any).L;
    if (this.filteredBranches.filter(b => b.latitude && b.longitude).length > 0 && L) {
      const group = L.featureGroup(
        this.filteredBranches
          .filter(b => b.latitude && b.longitude)
          .map(b => L.marker([b.latitude!, b.longitude!]))
      );
      this.map.fitBounds(group.getBounds().pad(0.1));
      this.selectedBranch = null;
    }
  }

  toggleMapFullscreen(): void {
    this.isMapFullscreen = !this.isMapFullscreen;
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  locateUser(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          const L = (window as any).L;
          L.marker([this.userLocation.lat, this.userLocation.lng])
            .addTo(this.map)
            .bindPopup('Your current location')
            .openPopup();

          this.map.setView([this.userLocation.lat, this.userLocation.lng], 13);
          this.showNotification('Your location has been added to the map');
        },
        (error) => {
          console.error('Error getting location:', error);
          this.showNotification('Unable to get your location. Please check permissions.', 'error');
        }
      );
    } else {
      this.showNotification('Geolocation is not supported by this browser.', 'error');
    }
  }

  exportMapData(): void {
    const data = {
      branches: this.filteredBranches,
      timestamp: new Date().toISOString(),
      totalBranches: this.filteredBranches.length,
      mappedBranches: this.mappedBranchesCount
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `branches-map-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    this.showNotification('Map data exported successfully');
  }

  calculateStats() {
    const mapped = this.branches.filter(b => b.latitude && b.longitude).length;
    const unmapped = this.branches.length - mapped;
    const byRegion = this.regions.map(region => {
      const count = this.branches.filter(branch => {
        if (!branch.latitude || !branch.longitude) return false;
        const [southWest, northEast] = region.bounds;
        return branch.latitude >= southWest[0] && branch.latitude <= northEast[0] &&
               branch.longitude >= southWest[1] && branch.longitude <= northEast[1];
      }).length;
      return { name: region.name, count };
    });

    return { mapped, unmapped, byRegion };
  }

  // Helper method to get region color for template
  getRegionColor(regionName: string): string {
    const region = this.regions.find(r => r.name === regionName);
    return region ? region.color : '#cccccc';
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar']
    });
  }

  // Getters for template
  get activeFiltersCount(): number {
    let count = 0;
    if (this.searchTerm) count++;
    if (this.selectedRegion !== 'all') count++;
    return count;
  }

  get stats() {
    return this.calculateStats();
  }
}