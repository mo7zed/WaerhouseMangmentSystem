import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ASN, PutawayTask } from '../../core/models/order.model';
import { BaseApiService } from '../../core/services/base-api.service';
import { ApiAsn, CreateAsnDto } from './asn.model';

@Injectable({ providedIn: 'root' })
export class ReceivingService {
  private api = inject(BaseApiService);

  private mockPutawayTasks: PutawayTask[] = Array.from({ length: 8 }, (_, i) => ({
    id: `put-${i + 1}`,
    asnId: `asn-${(i % 4) + 1}`,
    itemId: `item-${i + 1}`,
    sku: `SKU-${String(i + 1).padStart(4, '0')}`,
    itemName: ['Laptop Stand Pro', 'USB-C Hub', 'Wireless Keyboard', 'Monitor Riser'][i % 4],
    quantity: Math.floor(Math.random() * 50) + 10,
    uom: 'PCS',
    suggestedBin: `A-${String(i + 1).padStart(2, '0')}-01`,
    confirmedBin: undefined,
    status: (i % 3 === 0 ? 'completed' : 'pending') as 'pending' | 'completed',
    assignedTo: i % 2 === 0 ? 'op-1' : 'op-2',
  }));

  getPendingASNs(warehouseId: string): Observable<ASN[]> {
    return this.api
      .get<ApiAsn[]>('asns/pending', { warehouseId })
      .pipe(map(list => list.map(asn => this.mapApiAsn(asn))));
  }

  createASN(body: CreateAsnDto): Observable<ASN> {
    return this.api.post<ApiAsn>('asns', body).pipe(map(asn => this.mapApiAsn(asn)));
  }

  receiveASN(id: string, _data: unknown): Observable<ASN> {
    return of({ id } as ASN).pipe(delay(400));
  }

  getPutawayTasks(): Observable<PutawayTask[]> {
    return of(this.mockPutawayTasks).pipe(delay(200));
  }

  completePutaway(id: string, binCode: string): Observable<{ success: boolean }> {
    const task = this.mockPutawayTasks.find(t => t.id === id);
    if (task) {
      task.status = 'completed';
      task.confirmedBin = binCode;
    }
    return of({ success: true }).pipe(delay(300));
  }

  private mapApiAsn(asn: ApiAsn): ASN {
    return {
      id: asn.id,
      asnNumber: asn.id.slice(0, 8).toUpperCase(),
      supplierId: asn.supplierId,
      supplierName: asn.supplierName,
      status: this.normalizeStatus(asn.status),
      expectedDate: asn.expectedArrivalDate,
      items: (asn.lines ?? []).map(line => ({
        id: line.id,
        asnId: asn.id,
        itemId: line.itemId,
        sku: line.sku,
        itemName: line.itemName,
        expectedQty: line.expectedQuantity,
        receivedQty: line.receivedQuantity,
        damagedQty: 0,
        uom: line.uomName || line.uomCode,
        uomCode: line.uomCode,
        uomName: line.uomName,
        lotNumber: line.lotNumber ?? undefined,
        expirationDate: line.expirationDate ?? undefined,
        isFullyReceived: line.isFullyReceived,
      })),
      warehouseId: asn.warehouseId,
      notes: asn.notes ?? undefined,
      createdAt: asn.createdAt,
    };
  }

  private normalizeStatus(status: string): ASN['status'] {
    const normalized = status.toLowerCase().replace(/\s+/g, '_');
    const map: Record<string, ASN['status']> = {
      confirmed: 'expected',
      expected: 'expected',
      partially_received: 'partially_received',
      partial: 'partially_received',
      complete: 'complete',
      completed: 'complete',
      cancelled: 'cancelled',
      canceled: 'cancelled',
    };
    return map[normalized] ?? 'expected';
  }
}
