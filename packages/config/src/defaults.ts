import type { MoneyString } from "@prince-net/types";

/**
 * القيم الافتراضية التي تُزرع في قاعدة البيانات عند أول Seed.
 * Browser-safe — يمكن استيرادها في Frontend لعرض previsualization.
 */

export interface DefaultPackage {
    name: string;
    price: MoneyString;
    dataSizeMb: number;
    hours: number;
    color: string;
}

export const DEFAULT_PACKAGES: ReadonlyArray<DefaultPackage> = [
    {
        name: "باقة 100 ريال",
        price: "100",
        dataSizeMb: 350,
        hours: 5,
        color: "blue",
    },
    {
        name: "باقة 200 ريال",
        price: "200",
        dataSizeMb: 700,
        hours: 10,
        color: "orange",
    },
    {
        name: "باقة 250 ريال",
        price: "250",
        dataSizeMb: 800,
        hours: 12,
        color: "teal",
    },
    {
        name: "باقة 500 ريال",
        price: "500",
        dataSizeMb: 2000,
        hours: 30,
        color: "green",
    },
    {
        name: "باقة 1000 ريال",
        price: "1000",
        dataSizeMb: 4000,
        hours: 60,
        color: "purple",
    },
] as const;

export const DEFAULT_SETTINGS = {
    networkName: "Prince Net",
    currencyName: "ريال",
    currencySymbol: "ر.ي",
    lowStockThreshold: 10,
} as const;
