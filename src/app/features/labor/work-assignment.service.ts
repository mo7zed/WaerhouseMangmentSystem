import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';
import { CreateWorkAssignmentDto, WorkAssignment } from './work-assignment.model';

@Injectable({ providedIn: 'root' })
export class WorkAssignmentService {
  private api = inject(BaseApiService);
  private readonly endpoint = 'labor/assignments';

  getAssignments(warehouseId: string): Observable<WorkAssignment[]> {
    return this.api.get<WorkAssignment[]>(this.endpoint, { warehouseId });
  }

  getAssignment(id: string): Observable<WorkAssignment> {
    return this.api.get<WorkAssignment>(`${this.endpoint}/${id}`);
  }

  createAssignment(body: CreateWorkAssignmentDto): Observable<WorkAssignment> {
    return this.api.post<WorkAssignment>(this.endpoint, body);
  }

  assign(id: string, body: Record<string, unknown> = {}): Observable<WorkAssignment> {
    return this.action(id, 'assign', body);
  }

  accept(id: string): Observable<WorkAssignment> {
    return this.action(id, 'accept');
  }

  start(id: string): Observable<WorkAssignment> {
    return this.action(id, 'start');
  }

  complete(id: string): Observable<WorkAssignment> {
    return this.action(id, 'complete');
  }

  fail(id: string, body: Record<string, unknown> = {}): Observable<WorkAssignment> {
    return this.action(id, 'fail', body);
  }

  cancel(id: string, body: Record<string, unknown> = {}): Observable<WorkAssignment> {
    return this.action(id, 'cancel', body);
  }

  reassign(id: string, body: Record<string, unknown> = {}): Observable<WorkAssignment> {
    return this.action(id, 'reassign', body);
  }

  balance(body: Record<string, unknown> = {}): Observable<WorkAssignment[]> {
    return this.api.post<WorkAssignment[]>(`${this.endpoint}/balance`, body);
  }

  private action(id: string, action: string, body: Record<string, unknown> = {}): Observable<WorkAssignment> {
    return this.api.post<WorkAssignment>(`${this.endpoint}/${id}/${action}`, body);
  }
}
