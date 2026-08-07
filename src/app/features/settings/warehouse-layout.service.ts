import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';
import {
  CreateAisleDto,
  CreateAisleResponse,
  CreateRackDto,
  CreateRackResponse,
  CreateShelfDto,
  CreateShelfResponse,
  CreateZoneDto,
  CreateZoneResponse,
} from './warehouse-layout.model';

@Injectable({ providedIn: 'root' })
export class WarehouseLayoutService {
  private api = inject(BaseApiService);

  createZone(warehouseId: string, body: CreateZoneDto): Observable<CreateZoneResponse> {
    return this.api.post<CreateZoneResponse>(`warehouses/${warehouseId}/zones`, body);
  }

  createAisle(
    warehouseId: string,
    zoneId: string,
    body: CreateAisleDto
  ): Observable<CreateAisleResponse> {
    return this.api.post<CreateAisleResponse>(
      `warehouses/${warehouseId}/zones/${zoneId}/aisles`,
      body
    );
  }

  createRack(
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    body: CreateRackDto
  ): Observable<CreateRackResponse> {
    return this.api.post<CreateRackResponse>(
      `warehouses/${warehouseId}/zones/${zoneId}/aisles/${aisleId}/racks`,
      body
    );
  }

  createShelf(
    warehouseId: string,
    zoneId: string,
    aisleId: string,
    rackId: string,
    body: CreateShelfDto
  ): Observable<CreateShelfResponse> {
    return this.api.post<CreateShelfResponse>(
      `warehouses/${warehouseId}/zones/${zoneId}/aisles/${aisleId}/racks/${rackId}/shelves`,
      body
    );
  }
}
