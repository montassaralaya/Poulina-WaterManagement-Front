import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateWaterMeter {
  serialNumber: string;
  branchId: string;
  status?: 'Active' | 'Maintenance' | 'Disabled';
}

export interface WaterMeterResponse {
  id: string;
  serialNumber: string;
  status: string;
  branchId: string;
}

@Injectable({ providedIn: 'root' })
export class WaterMeterService {
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
