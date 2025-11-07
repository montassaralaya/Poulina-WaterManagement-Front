import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateWaterMeter {
  serialNumber: string;
  branchId: string;
  status?: 'Active' | 'Maintenance' | 'Disabled';
  installedAt?: Date | null;
  lastMaintenance?: Date | null;
  meterType?: string | null;
}

export interface WaterMeterResponse {
  id: string;
  serialNumber: string;
  status: string;
  branchId: string;
  installedAt?: Date | null;
  lastMaintenance?: Date | null;
  meterType?: string | null;
}

@Injectable({ providedIn: 'root' })
export class WaterMeterDashboardService {
  private apiUrl = 'https://localhost:7162/api/WaterMeters'; // adjust to your backend

  constructor(private http: HttpClient) {}

  create(data: CreateWaterMeter): Observable<WaterMeterResponse> {
    return this.http.post<WaterMeterResponse>(this.apiUrl, data);
  }

  getAll(): Observable<WaterMeterResponse[]> {
    return this.http.get<WaterMeterResponse[]>(this.apiUrl);
  }

  getById(id: string): Observable<WaterMeterResponse> {
    return this.http.get<WaterMeterResponse>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: CreateWaterMeter): Observable<WaterMeterResponse> {
    return this.http.put<WaterMeterResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
