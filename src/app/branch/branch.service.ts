import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Branch {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

// For typing in form submission
export type CreateBranch = Omit<Branch, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private apiUrl = 'https://localhost:7076/api/branches'; // backend API

  constructor(private http: HttpClient) {}

  create(branch: CreateBranch): Observable<any> {
    return this.http.post(this.apiUrl, branch);
  }
  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.apiUrl);
  }

  updateBranch(id: string, branch: CreateBranch) {
  return this.http.put(`${this.apiUrl}/${id}`, branch);
}

  deleteBranch(branch: Branch) {
  return this.http.delete(`${this.apiUrl}/${branch.id}`);
}
}
