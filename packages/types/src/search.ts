import type { MoneyString, UUID } from "./common";

export type SearchResultType =
    | "DISTRIBUTOR"
    | "PACKAGE"
    | "SALE"
    | "LINE"
    | "EXPENSE"
    | "PAYMENT";

export interface SearchResult {
    id: UUID;
    type: SearchResultType;
    title: string;
    subtitle: string | null;
    amount: MoneyString | null;
    url: string;
}

export interface SearchResponse {
    results: SearchResult[];
}
