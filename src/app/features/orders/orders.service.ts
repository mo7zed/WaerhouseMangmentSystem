import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Order, PickTask, Wave } from '../../core/models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private mockOrders: Order[] = Array.from({ length: 30 }, (_, i) => ({
    id: `ord-${i + 1}`,
    orderNumber: `ORD-2024-${String(8000 + i).padStart(5, '0')}`,
    channel: (['erp', 'ecommerce', 'manual'] as const)[i % 3],
    status: (['new', 'allocated', 'picking', 'packed', 'ready_to_ship', 'shipped', 'delivered'] as const)[i % 7],
    priority: (['high', 'medium', 'low'] as const)[i % 3],
    customerId: `cust-${i + 1}`,
    customerName: ['Al-Rashid Corp.', 'Saud Trading', 'Nour Electronics', 'Madar Retail', 'Gulf Supplies'][i % 5],
    customerAddress: 'Riyadh, KSA',
    lines: [{ id: `ol-${i}`, orderId: `ord-${i + 1}`, itemId: `item-${i + 1}`, sku: `SKU-${String(i + 1).padStart(4, '0')}`, itemName: 'Sample Item', quantity: Math.floor(Math.random() * 10) + 1, pickedQty: 0, uom: 'PCS', status: 'pending' as const }],
    warehouseId: 'wh-001',
    totalItems: Math.floor(Math.random() * 5) + 1,
    totalWeight: Math.random() * 20 + 1,
    createdAt: new Date(Date.now() - i * 3600000 * 4),
    updatedAt: new Date(Date.now() - i * 3600000),
    requiredDate: new Date(Date.now() + (3 - i % 5) * 86400000),
  }));

  private mockPickTasks: PickTask[] = Array.from({ length: 10 }, (_, i) => ({
    id: `pkt-${i + 1}`,
    orderId: `ord-${i + 1}`,
    orderNumber: `ORD-2024-${String(8000 + i).padStart(5, '0')}`,
    assignedTo: `op-${(i % 3) + 1}`,
    assignedToName: ['Mohammed Al-Otaibi', 'Fatima Al-Zahrani', 'Ahmed Al-Rashid'][i % 3],
    status: (['pending', 'in_progress', 'completed'] as const)[i % 3],
    priority: (['high', 'medium', 'low'] as const)[i % 3],
    itemsTotal: Math.floor(Math.random() * 10) + 3,
    itemsPicked: i % 3 === 2 ? Math.floor(Math.random() * 10) + 3 : i % 3 === 1 ? Math.floor(Math.random() * 5) : 0,
    bins: [`A-0${i + 1}-01`, `B-0${i + 2}-02`],
    createdAt: new Date(Date.now() - i * 1800000),
    startedAt: i % 3 !== 0 ? new Date(Date.now() - i * 900000) : undefined,
    completedAt: i % 3 === 2 ? new Date() : undefined,
  }));

  private mockWaves: Wave[] = Array.from({ length: 4 }, (_, i) => ({
    id: `wave-${i + 1}`,
    waveNumber: `WAVE-${String(100 + i).padStart(3, '0')}`,
    status: (['draft', 'released', 'in_progress', 'completed'] as const)[i],
    orderCount: Math.floor(Math.random() * 10) + 3,
    orders: [],
    assignedOperators: ['op-1', 'op-2'],
    warehouseId: 'wh-001',
    createdAt: new Date(Date.now() - i * 3600000 * 8),
    releasedAt: i > 0 ? new Date(Date.now() - i * 3600000 * 4) : undefined,
    completedAt: i === 3 ? new Date() : undefined,
  }));

  getOrders(filter?: any): Observable<{ data: Order[]; total: number }> {
    let list = [...this.mockOrders];
    if (filter?.status) list = list.filter(o => o.status === filter.status);
    if (filter?.channel) list = list.filter(o => o.channel === filter.channel);
    if (filter?.priority) list = list.filter(o => o.priority === filter.priority);
    if (filter?.search) list = list.filter(o => o.orderNumber.includes(filter.search) || o.customerName.toLowerCase().includes(filter.search.toLowerCase()));
    return of({ data: list.slice(0, filter?.limit ?? 20), total: list.length }).pipe(delay(300));
  }

  getPickTasks(): Observable<PickTask[]> {
    return of(this.mockPickTasks).pipe(delay(200));
  }

  getWaves(): Observable<Wave[]> {
    return of(this.mockWaves).pipe(delay(200));
  }

  completePickTask(id: string): Observable<PickTask> {
    const task = this.mockPickTasks.find(t => t.id === id);
    if (task) {
      task.status = 'completed';
      task.itemsPicked = task.itemsTotal;
      task.completedAt = new Date();
    }
    return of(task!).pipe(delay(300));
  }

  releaseWave(id: string): Observable<Wave> {
    const wave = this.mockWaves.find(w => w.id === id);
    if (wave) {
      wave.status = 'released';
      wave.releasedAt = new Date();
    }
    return of(wave!).pipe(delay(300));
  }

  createWave(data: Partial<Wave>): Observable<Wave> {
    const wave: Wave = {
      id: `wave-${Date.now()}`,
      waveNumber: `WAVE-${String(200 + this.mockWaves.length).padStart(3, '0')}`,
      status: 'draft',
      orderCount: data.orderCount ?? 0,
      orders: data.orders ?? [],
      assignedOperators: data.assignedOperators ?? [],
      warehouseId: 'wh-001',
      createdAt: new Date(),
    };
    this.mockWaves.unshift(wave);
    return of(wave).pipe(delay(400));
  }
}
