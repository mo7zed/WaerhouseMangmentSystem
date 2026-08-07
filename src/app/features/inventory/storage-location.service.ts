import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';
import {
  BlockStorageLocationDto,
  CreateStorageLocationDto,
  StorageLocation,
} from './storage-location.model';

@Injectable({ providedIn: 'root' })
export class StorageLocationService {
  private api = inject(BaseApiService);

  getStorageLocations(warehouseId: string): Observable<StorageLocation[]> {
    return this.api.get<StorageLocation[]>('storage-locations', { warehouseId });
  }

  getStorageLocationById(id: string): Observable<StorageLocation> {
    return this.api.get<StorageLocation>(`storage-locations/${id}`);
  }

  createStorageLocation(warehouseId: string, body: CreateStorageLocationDto): Observable<StorageLocation> {
    return this.api.post<StorageLocation>(`warehouses/${warehouseId}/storage-locations`, body);
  }

  blockStorageLocation(id: string, reason: string): Observable<void> {
    const body: BlockStorageLocationDto = { reason };
    return this.api.post<void>(`storage-locations/${id}/block`, body);
  }

  releaseStorageLocation(id: string): Observable<void> {
    return this.api.post<void>(`storage-locations/${id}/release`, {});
  }
}
