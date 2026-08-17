export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  nameAr: string;
  description?: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  binId: string;
  binCode: string;
  zoneId: string;
  zoneName: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  uom: string;
  weight?: number;
  dimensions?: { l: number; w: number; h: number };
  barcode?: string;
  strategy: 'FIFO' | 'FEFO' | 'LIFO';
  status: 'active' | 'inactive' | 'low_stock' | 'out_of_stock';
  minThreshold: number;
  maxThreshold: number;
  reorderPoint: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate?: Date;
  lotNumber?: string;
  serialNumber?: string;
  lastUpdated: Date;
  imageUrl?: string;
}

export interface StockTransfer {
  id?: string;
  itemId: string;
  sourceBinId: string;
  destinationBinId: string;
  quantity: number;
  reason: string;
  notes?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  createdAt?: Date;
  completedAt?: Date;
}

export interface CycleCount {
  id: string;
  warehouseId: string;
  targetLocations: string[];
  targetItems: string[];
  status: string;
  varianceThreshold: number;
  scheduledDate: string;
  completedDate: string | null;
  initiatedBy: string;
  countTasks: CycleCountTask[];
}

export interface CycleCountTask {
  id?: string;
  itemId?: string;
  locationId?: string;
  expectedQuantity?: number;
  countedQuantity?: number;
  status?: string;
  [key: string]: unknown;
}

export interface CreateCycleCountDto {
  warehouseId: string;
  targetLocationIds: string[];
  targetItemIds: string[];
  varianceThreshold: number;
  scheduledDate: string;
  initiatedBy: string;
}

/** The count-result endpoint accepts one or more task results. */
export interface SubmitCycleCountResultsDto {
  results: Array<{
    countTaskId: string;
    countedQuantity: number;
    [key: string]: unknown;
  }>;
}

export interface LotTracking {
  id: string;
  itemId: string;
  lotNumber: string;
  serialNumber?: string;
  quantity: number;
  expiryDate?: Date;
  manufacturingDate?: Date;
  supplierId?: string;
  status: 'active' | 'expired' | 'quarantine';
  binCode: string;
}

export interface ReplenishmentAlert {
  id: string;
  itemId: string;
  sku: string;
  itemName: string;
  currentQty: number;
  minThreshold: number;
  reorderPoint: number;
  suggestedQty: number;
  priority: 'high' | 'medium' | 'low';
  warehouseName: string;
}

export interface BinNode {
  key: string;
  label: string;
  data: {
    type: 'warehouse' | 'zone' | 'bin';
    code: string;
    capacity?: number;
    used?: number;
    utilization?: number;
  };
  icon: string;
  children?: BinNode[];
}

export interface InventoryFilter {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  category?: string;
  status?: string;
  strategy?: string;
  zoneId?: string;
}
