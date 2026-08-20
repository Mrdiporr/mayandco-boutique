import { queryOptions } from "@tanstack/react-query";
import { getCatalogue, getStorefront } from "@/lib/store.functions";

export const storefrontQuery = queryOptions({
  queryKey: ["storefront"],
  queryFn: () => getStorefront(),
  staleTime: 30_000,
});

export const catalogueQuery = queryOptions({
  queryKey: ["catalogue"],
  queryFn: () => getCatalogue(),
  staleTime: 30_000,
});
