import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Shipment } from '../../core/models/order.model';

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private mockShipments: Shipment[] = Array.from({ length: 15 }, (_, i) => ({
    id: `shp-${i + 1}`,
    shipmentNumber: `SHP-${String(4000 + i).padStart(4, '0')}`,
    orderId: `ord-${i + 1}`,
    orderNumber: `ORD-2024-${String(8000 + i).padStart(5, '0')}`,
    carrier: ['Aramex', 'DHL', 'SMSA Express', 'Red Sea Logistics', 'FedEx'][i % 5],
    trackingNumber: i % 3 !== 0 ? `TRK${String(100000 + i * 7).padStart(10, '0')}` : undefined,
    status: (['pending', 'dispatched', 'in_transit', 'delivered', 'failed'] as const)[i % 5],
    tmsSyncStatus: (['synced', 'synced', 'pending', 'error'] as const)[i % 4],
    tmsSyncedAt: i % 4 !== 2 ? new Date(Date.now() - i * 3600000) : undefined,
    weight: Math.random() * 30 + 1,
    labelUrl: undefined,
    dispatchedAt: i % 5 !== 0 ? new Date(Date.now() - i * 1800000) : undefined,
    createdAt: new Date(Date.now() - i * 7200000),
  }));

  getShipments(): Observable<Shipment[]> { return of(this.mockShipments).pipe(delay(300)); }

  createShipment(data: any): Observable<Shipment> {
    const s: Shipment = { id: `shp-${Date.now()}`, ...data, status: 'pending', tmsSyncStatus: 'pending', createdAt: new Date() };
    this.mockShipments.unshift(s);
    return of(s).pipe(delay(400));
  }

  dispatch(id: string): Observable<any> {
    const s = this.mockShipments.find(sh => sh.id === id);
    if (s) { s.status = 'dispatched'; s.dispatchedAt = new Date(); }
    return of({ success: true }).pipe(delay(300));
  }

  getTMSSyncStatus(): Observable<any> {
    return of({ lastSync: new Date(Date.now() - 1800000), status: 'ok', errors: 1, synced: 14 }).pipe(delay(200));
  }

  generateLabel(id: string): Observable<Shipment> {
    const s = this.mockShipments.find(sh => sh.id === id);
    if (s) s.labelUrl = `https://labels.tachyon.sa/${s.shipmentNumber}.pdf`;
    return of(s!).pipe(delay(400));
  }
}
