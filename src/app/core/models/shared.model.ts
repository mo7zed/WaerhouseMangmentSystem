export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KpiCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: number;
  trendLabel?: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  fill?: boolean;
  tension?: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: Date;
  details?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface Warehouse {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  address: string;
  city: string;
  country: string;
  strategy: 'FIFO' | 'FEFO' | 'LIFO';
  active: boolean;
}

export interface Zone {
  id: string;
  warehouseId: string;
  name: string;
  nameAr: string;
  code: string;
  type: string;
}

export interface Bin {
  id: string;
  zoneId: string;
  warehouseId: string;
  code: string;
  aisle: string;
  shelf: string;
  position: string;
  maxCapacity: number;
  currentCapacity: number;
  active: boolean;
}
