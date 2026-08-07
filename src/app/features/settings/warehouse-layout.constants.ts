/** Allowed values from API validation (AddZoneRequest). */
export const ZONE_TYPE_OPTIONS = [
  { label: 'Receiving dock', value: 'ReceivingDock' },
  { label: 'Storage', value: 'Storage' },
  { label: 'Shipping dock', value: 'ShippingDock' },
  { label: 'Staging', value: 'Staging' },
  { label: 'Returns', value: 'Returns' },
  { label: 'Quarantine', value: 'Quarantine' },
] as const;

export const STORAGE_TYPE_OPTIONS = [
  { label: 'Ambient', value: 'Ambient' },
  { label: 'Refrigerated', value: 'Refrigerated' },
  { label: 'Frozen', value: 'Frozen' },
  { label: 'Hazardous', value: 'Hazardous' },
  { label: 'Controlled', value: 'Controlled' },
] as const;
