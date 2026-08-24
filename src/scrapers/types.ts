export type StoreId = "lidl" | "plusfresc" | "bonpreuesclat";

export const STORE_LABELS: Record<StoreId, string> = {
  lidl: "Lidl",
  plusfresc: "Plus Fresc",
  bonpreuesclat: "Bonpreu/Esclat",
};

export interface RawOffer {
  productName: string;
  price: number;
  unit?: string;
  url?: string;
}

export interface Scraper {
  store: StoreId;
  /** Descarga las ofertas vigentes de la web del supermercado. */
  fetchOffers(): Promise<RawOffer[]>;
}
