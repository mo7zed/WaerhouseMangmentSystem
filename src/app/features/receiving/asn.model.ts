export interface ApiAsnLine {
  id: string;
  itemId: string;
  sku: string;
  itemName: string;
  expectedQuantity: number;
  receivedQuantity: number;
  uomCode: string;
  uomName: string;
  lotNumber?: string | null;
  expirationDate?: string | null;
  isFullyReceived: boolean;
}

export interface ApiAsn {
  id: string;
  warehouseId: string;
  supplierId: string;
  supplierName: string;
  expectedArrivalDate: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  lines: ApiAsnLine[];
}

export interface CreateAsnLineDto {
  itemId: string;
  sku: string;
  itemName: string;
  expectedQuantity: number;
  uomCode: string;
  uomName: string;
  lotNumber?: string;
  expirationDate?: string;
}

export interface CreateAsnDto {
  warehouseId: string;
  supplierId: string;
  supplierName: string;
  expectedArrivalDate: string;
  notes?: string;
  lines: CreateAsnLineDto[];
}
