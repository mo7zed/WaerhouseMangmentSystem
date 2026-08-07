import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Return } from '../../core/models/order.model';

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private mockReturns: Return[] = Array.from({ length: 12 }, (_, i) => ({
    id: `ret-${i + 1}`,
    rmaNumber: `RMA-${String(200 + i).padStart(4, '0')}`,
    orderId: `ord-${i + 1}`,
    orderNumber: `ORD-2024-${String(8000 + i).padStart(5, '0')}`,
    customerId: `cust-${i + 1}`,
    customerName: ['Al-Rashid Corp.', 'Saud Trading', 'Nour Electronics', 'Madar Retail'][i % 4],
    status: (['requested', 'received', 'inspected', 'dispositioned', 'completed'] as const)[i % 5],
    reasonCode: ['DEFECTIVE', 'WRONG_ITEM', 'DAMAGED', 'NO_LONGER_NEEDED', 'LATE_DELIVERY'][i % 5],
    reasonDescription: ['Product defective on arrival', 'Wrong item shipped', 'Damaged in transit', 'Customer no longer needs', 'Delivered too late'][i % 5],
    items: [{
      id: `ri-${i}`, returnId: `ret-${i + 1}`, itemId: `item-${i + 1}`,
      sku: `SKU-${String(i + 1).padStart(4, '0')}`, itemName: 'Sample Item',
      quantity: Math.floor(Math.random() * 5) + 1, uom: 'PCS',
      condition: (['good', 'damaged', 'defective'] as const)[i % 3],
      disposition: i % 5 >= 3 ? (['restock', 'refurbish', 'discard', 'quarantine'] as const)[i % 4] : undefined,
    }],
    createdAt: new Date(Date.now() - i * 3600000 * 6),
    completedAt: i % 5 === 4 ? new Date() : undefined,
  }));

  getReturns(): Observable<Return[]> {
    return of([...this.mockReturns]).pipe(delay(300));
  }

  createReturn(data: Partial<Return>): Observable<Return> {
    const r: Return = {
      id: `ret-${Date.now()}`,
      rmaNumber: `RMA-${String(300 + this.mockReturns.length).padStart(4, '0')}`,
      orderId: data.orderId ?? '',
      orderNumber: data.orderNumber ?? '',
      customerId: data.customerId ?? '',
      customerName: data.customerName ?? '',
      status: 'requested',
      reasonCode: data.reasonCode ?? 'DEFECTIVE',
      reasonDescription: data.reasonDescription ?? '',
      items: data.items ?? [],
      createdAt: new Date(),
    };
    this.mockReturns.unshift(r);
    return of(r).pipe(delay(400));
  }

  updateDisposition(id: string, itemId: string, disposition: Return['items'][0]['disposition']): Observable<Return> {
    const ret = this.mockReturns.find(r => r.id === id);
    if (ret) {
      const item = ret.items.find(i => i.id === itemId);
      if (item) item.disposition = disposition;
      if (ret.items.every(i => i.disposition)) {
        ret.status = 'dispositioned';
      }
    }
    return of(ret!).pipe(delay(300));
  }

  completeReturn(id: string): Observable<Return> {
    const ret = this.mockReturns.find(r => r.id === id);
    if (ret) {
      ret.status = 'completed';
      ret.completedAt = new Date();
    }
    return of(ret!).pipe(delay(300));
  }
}
