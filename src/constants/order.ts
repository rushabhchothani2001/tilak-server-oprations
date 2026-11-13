export const BOX_PLY = ['3-ply', '5-ply'] as const;
export type BoxPly = (typeof BOX_PLY)[number];

export const PAPER_TYPES = ['printed', 'plain'] as const;
export type PaperType = (typeof PAPER_TYPES)[number];

/** Only applies when paperType is "printed". */
export const PRINT_TYPES = ['4-color', 'single-color'] as const;
export type PrintType = (typeof PRINT_TYPES)[number];

export const SIZE_UNITS = ['inch', 'mm', 'cm'] as const;
export type SizeUnit = (typeof SIZE_UNITS)[number];

/** Statuses a worker can set from the manufacturing module, in process order. */
export const WORKER_STATUSES = [
  'paper_cutting_in_process',
  'paper_import_from_outside',
  'liner_in_process',
  'liner_process_completed',
  'packaging_in_process',
  'ready_to_shipment',
] as const;

/** Every status an order can be in. "order_placed" is set automatically on creation. */
export const ORDER_STATUSES = ['order_placed', ...WORKER_STATUSES] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** GST added to the order amount when "Applicable GST" is Yes. */
export const GST_RATE_PERCENT = 5;

/** When an order reaches this status the worker must record the produced quantity. */
export const FINAL_STATUS: OrderStatus = 'ready_to_shipment';
