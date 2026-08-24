export type StoreId = "lidl" | "aldi" | "plusfresc" | "esclat";

export const STORE_LABELS: Record<StoreId, string> = {
  lidl: "Lidl",
  aldi: "Aldi",
  plusfresc: "Plus Fresc",
  esclat: "Esclat",
};

export interface RawOffer {
  productName: string;
  price: number;
  unit?: string;
  validUntil?: string;
  url?: string;
}

export interface Scraper {
  store: StoreId;
  /** Descarga las ofertas vigentes de la web del supermercado. */
  fetchOffers(): Promise<RawOffer[]>;
}
