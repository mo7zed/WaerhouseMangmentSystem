import { Injectable, inject } from '@angular/core';
import { InventoryItem, BinNode, InventoryFilter, CycleCount, CreateCycleCountDto, ReplenishmentAlert, StockTransfer, SubmitCycleCountResultsDto } from '../../core/models/inventory.model';
import { BaseApiService } from '../../core/services/base-api.service';
import { PagedResponse } from '../../core/models/shared.model';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private api = inject(BaseApiService);

  private mockItems: InventoryItem[] = Array.from({ length: 50 }, (_, i) => ({
    id: `item-${i + 1}`,
    sku: `SKU-${String(i + 1).padStart(4, '0')}`,
    name: ['Laptop Stand Pro', 'USB-C Hub 7-Port', 'Wireless Keyboard', 'Monitor Riser', 'Cable Organizer', 'Desk Pad XL', 'Ergonomic Mouse', 'Webcam HD', 'Headset Pro', 'LED Desk Lamp'][i % 10],
    nameAr: ['حامل لابتوب', 'موزع USB-C', 'لوحة مفاتيح لاسلكية', 'حامل شاشة', 'منظم كابلات', 'حصيرة مكتب', 'فأرة مريحة', 'ويب كام', 'سماعة رأس', 'مصباح مكتب'][i % 10],
    description: 'Premium warehouse item',
    category: ['Electronics', 'FMCG', 'Apparel', 'Machinery', 'Food & Bev'][i % 5],
    warehouseId: 'wh-001',
    warehouseName: 'Riyadh Main WH',
    binId: `bin-${(i % 20) + 1}`,
    binCode: `A-${String(Math.floor(i / 5) + 1).padStart(2, '0')}-${String((i % 5) + 1).padStart(2, '0')}`,
    zoneId: `zone-${(i % 4) + 1}`,
    zoneName: ['Zone A', 'Zone B', 'Zone C', 'Zone D'][i % 4],
    quantity: Math.floor(Math.random() * 500) + 10,
    reservedQty: Math.floor(Math.random() * 50),
    availableQty: Math.floor(Math.random() * 450) + 10,
    uom: ['PCS', 'BOX', 'KG', 'L', 'M'][i % 5],
    weight: Math.random() * 10 + 0.5,
    barcode: `BAR${String(i + 1).padStart(8, '0')}`,
    strategy: ['FIFO', 'FEFO', 'LIFO'][i % 3] as 'FIFO' | 'FEFO' | 'LIFO',
    status: i % 7 === 0 ? 'low_stock' : i % 11 === 0 ? 'out_of_stock' : 'active' as any,
    minThreshold: 20,
    maxThreshold: 500,
    reorderPoint: 50,
    costPrice: Math.random() * 500 + 50,
    sellingPrice: Math.random() * 700 + 80,
    expiryDate: i % 5 === 0 ? new Date(Date.now() + (i * 864000000)) : undefined,
    lotNumber: i % 3 === 0 ? `LOT-${2024}-${String(i + 1).padStart(3, '0')}` : undefined,
    lastUpdated: new Date(Date.now() - i * 3600000),
  }));

  getItems(filter?: InventoryFilter): Observable<PagedResponse<InventoryItem>> {
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 15;
    let items = [...this.mockItems];
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(i => i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
    }
    if (filter?.status) items = items.filter(i => i.status === filter.status);
    if (filter?.category) items = items.filter(i => i.category === filter.category);
    if (filter?.strategy) items = items.filter(i => i.strategy === filter.strategy);
    const total = items.length;
    const start = (page - 1) * limit;
    return of({
      data: items.slice(start, start + limit),
      total, page, limit,
      totalPages: Math.ceil(total / limit)
    }).pipe(delay(300));
  }

  createItem(item: Partial<InventoryItem>): Observable<InventoryItem> {
    const newItem = { ...item, id: `item-${Date.now()}`, lastUpdated: new Date() } as InventoryItem;
    this.mockItems.unshift(newItem);
    return of(newItem).pipe(delay(300));
  }

  updateItem(id: string, item: Partial<InventoryItem>): Observable<InventoryItem> {
    const idx = this.mockItems.findIndex(i => i.id === id);
    if (idx >= 0) this.mockItems[idx] = { ...this.mockItems[idx], ...item, lastUpdated: new Date() };
    return of(this.mockItems[idx]).pipe(delay(300));
  }

  deleteItem(id: string): Observable<void> {
    this.mockItems = this.mockItems.filter(i => i.id !== id);
    return of(void 0).pipe(delay(200));
  }

  getBinTree(): Observable<BinNode[]> {
    return of([
      {
        key: 'wh-001', label: 'Riyadh Main WH', icon: 'pi pi-building',
        data: { type: 'warehouse', code: 'RUH-01', utilization: 68 },
        children: ['A','B','C','D'].map(zone => ({
          key: `zone-${zone}`,
          label: `Zone ${zone}`,
          icon: 'pi pi-sitemap',
          data: { type: 'zone', code: `Z-${zone}`, utilization: Math.floor(Math.random() * 40) + 40 },
          children: Array.from({ length: 5 }, (_, bi) => ({
            key: `bin-${zone}-${bi}`,
            label: `${zone}-${String(bi + 1).padStart(2, '0')}-01`,
            icon: 'pi pi-box',
            data: {
              type: 'bin', code: `${zone}-${String(bi + 1).padStart(2, '0')}-01`,
              capacity: 100, used: Math.floor(Math.random() * 100),
              utilization: Math.floor(Math.random() * 100)
            },
          }))
        }))
      }
    ] as BinNode[]).pipe(delay(200));
  }

  getCycleCounts(warehouseId: string): Observable<CycleCount[]> {
    return this.api.get<CycleCount[]>('cycle-counts', { warehouseId });
  }

  getCycleCountById(id: string): Observable<CycleCount> {
    return this.api.get<CycleCount>(`cycle-counts/${id}`);
  }

  createCycleCount(body: CreateCycleCountDto): Observable<CycleCount> {
    return this.api.post<CycleCount>('cycle-counts', body);
  }

  releaseCycleCount(id: string): Observable<CycleCount> {
    return this.api.post<CycleCount>(`cycle-counts/${id}/release`, {});
  }

  submitCycleCountResults(id: string, body: SubmitCycleCountResultsDto): Observable<CycleCount> {
    return this.api.post<CycleCount>(`cycle-counts/${id}/count-results`, body);
  }

  reconcileCycleCount(id: string): Observable<CycleCount> {
    return this.api.post<CycleCount>(`cycle-counts/${id}/reconcile`, {});
  }

  completeCycleCount(id: string): Observable<CycleCount> {
    return this.api.post<CycleCount>(`cycle-counts/${id}/complete`, {});
  }

  getReplenishmentAlerts(): Observable<ReplenishmentAlert[]> {
    return of(
      this.mockItems
        .filter(i => i.quantity <= i.minThreshold)
        .slice(0, 10)
        .map(i => ({
          id: i.id, itemId: i.id, sku: i.sku, itemName: i.name,
          currentQty: i.quantity, minThreshold: i.minThreshold,
          reorderPoint: i.reorderPoint, suggestedQty: i.maxThreshold - i.quantity,
          priority: i.quantity === 0 ? 'high' : i.quantity < 10 ? 'high' : 'medium' as any,
          warehouseName: i.warehouseName,
        }))
    ).pipe(delay(200));
  }

  transferStock(_transfer: StockTransfer): Observable<any> {
    return of({ success: true }).pipe(delay(400));
  }
}
