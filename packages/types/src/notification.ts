import type { ISODateString, MoneyString } from "./common";

/* ─── مركز التنبيهات ───
   يُحسب عند الطلب (on-the-fly) من البيانات الحالية —
   لا يُخزَّن أي شيء ولا يكرر أي سجل. */

export type AppNotificationType =
    | 'LOW_STOCK'
    | 'UNPAID_INVOICES'
    | 'HIGH_BALANCE'
    | 'LINE_UNPAID'
    | 'CASH_DIFFERENCE'
    | 'REVERSALS';

export type AppNotificationSeverity = 'info' | 'warning' | 'critical';

export interface AppNotification {
    id: string;
    type: AppNotificationType;
    severity: AppNotificationSeverity;
    title: string;
    description: string;
    url: string;
    count: number;
    amount?: MoneyString;
    date?: ISODateString;
}

export interface NotificationsResponse {
    notifications: AppNotification[];
    count: number;
    lastCheckedAt: ISODateString;
}
