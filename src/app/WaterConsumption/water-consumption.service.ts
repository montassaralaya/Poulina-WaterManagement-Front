import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Create DTO for Water Consumption
export interface WaterConsumptionCreate {
  readingDate: string;
  cubicMeters: number;
  branchId: string;
  meterId?: string;
  waterCost?: number | null;
  source?: 'OCR' | 'Manual';
  previousReading?: number | null;
  note?: string | null;
}

// Response DTO
export interface WaterConsumptionResponse {
  id: string;
  readingDate: string;
  cubicMeters: number;
  branchId: string;
  meterId?: string;
  meterSerialNumber?: string;
  waterCost?: number | null;
  source?: 'OCR' | 'Manual';
  previousReading?: number | null;
  note?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WaterConsumptionService {
  private apiUrl = 'https://localhost:7162/api/WaterConsumptions';

  constructor(private http: HttpClient) {}

  // Get all consumptions (flat list)
  getAll(): Observable<WaterConsumptionResponse[]> {
    return this.http.get<WaterConsumptionResponse[]>(this.apiUrl);
  }

  // Get consumptions grouped by branch
  getAllConsumptionsGroupedByBranch(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/grouped-by-branch`);
  }

  // Get one by ID
  getById(id: string): Observable<WaterConsumptionResponse> {
    return this.http.get<WaterConsumptionResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new consumption
  create(data: WaterConsumptionCreate): Observable<WaterConsumptionResponse> {
    return this.http.post<WaterConsumptionResponse>(this.apiUrl, data);
  }

  // Update existing consumption
  update(id: string, data: WaterConsumptionCreate): Observable<WaterConsumptionResponse> {
    return this.http.put<WaterConsumptionResponse>(`${this.apiUrl}/${id}`, data);
  }

  // Delete consumption
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
