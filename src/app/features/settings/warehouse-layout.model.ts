export interface CreateZoneDto {
  code: string;
  name: string;
  zoneType: string;
  storageType: string;
  tempMinCelsius: number;
  tempMaxCelsius: number;
  humidityMinPercent: number;
  humidityMaxPercent: number;
}

export interface CreateZoneResponse {
  warehouseId: string;
  zoneId: string;
}

export interface CreateAisleDto {
  code: string;
}

export interface CreateAisleResponse {
  warehouseId: string;
  zoneId: string;
  aisleId: string;
}

export interface CreateRackDto {
  code: string;
}

export interface CreateRackResponse {
  warehouseId: string;
  zoneId: string;
  aisleId: string;
  rackId: string;
}

export interface CreateShelfDto {
  code: string;
  level: number;
}

export interface CreateShelfResponse {
  warehouseId: string;
  zoneId: string;
  aisleId: string;
  rackId: string;
  shelfId: string;
}

export interface WarehouseLayoutContext {
  warehouseId: string;
  zoneId?: string;
  aisleId?: string;
  rackId?: string;
  shelfId?: string;
}
