export interface InventoryMovement {
  readonly id: string;
  readonly createdAt: string;
  readonly code: string;
  readonly movementType: string;
  readonly productName: string;
  readonly sku: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly quantityDelta: number;
  readonly stockBefore: number;
  readonly stockAfter: number;
  readonly reason: string | null;
  readonly originType: string | null;
}

export interface MovementPage {
  readonly items: readonly InventoryMovement[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}
