export interface TeamMemberRow {
  readonly profileId: string;
  readonly name: string;
  readonly sales: number;
  readonly amount: number;
  readonly units: number;
  readonly averageTicket: number;
  readonly unitsPerSale: number;
  readonly discounts: number;
  readonly cancelled: number;
  readonly cancelledAmount: number;
  readonly hours: number | null;
  readonly shifts: number;
  readonly shiftsWithoutCheckout: number;
  readonly amountPerHour: number | null;
  readonly salesPerHour: number | null;
  readonly share: number;
}

export interface TeamReportSummary {
  readonly members: number;
  readonly sales: number;
  readonly amount: number;
  readonly hours: number | null;
  readonly amountPerHour: number | null;
  readonly bestPerHourName: string | null;
  readonly bestPerHour: number | null;
  readonly discounts: number;
  readonly cancelled: number;
  readonly cancelledAmount: number;
  readonly shiftsWithoutCheckout: number;
}

export interface TeamReport {
  readonly from: string;
  readonly to: string;
  readonly attendanceEnabled: boolean;
  readonly maxShiftHours: number;
  readonly minHoursForRate: number;
  readonly summary: TeamReportSummary;
  readonly members: readonly TeamMemberRow[];
}
