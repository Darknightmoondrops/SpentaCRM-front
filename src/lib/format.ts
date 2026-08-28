import { productConfig } from "@/config/product";

export function currency(value: number) {
  return new Intl.NumberFormat(productConfig.locale, {
    style: "currency",
    currency: productConfig.currency,
    maximumFractionDigits: 0,
  }).format(value);
}
