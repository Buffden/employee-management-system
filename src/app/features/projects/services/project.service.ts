import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../../../shared/models/project.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apibaseurl}/projects`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  create(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  update(id: string, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 