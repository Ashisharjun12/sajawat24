import { useEffect } from "react";
import { useCategoriesQuery } from "@/module/catalog/hooks/use-categories-query";
import { useCatalogStore } from "@/store/catalog.store";

/** Mirrors TanStack Query category data into Zustand for existing selectors. */
export function CatalogQuerySync() {
  const { data, isLoading, isError, isSuccess } = useCategoriesQuery();

  useEffect(() => {
    if (isLoading) {
      useCatalogStore.setState({ status: "loading" });
      return;
    }
    if (isError) {
      useCatalogStore.setState({ status: "error" });
      return;
    }
    if (isSuccess) {
      useCatalogStore.setState({
        categories: data ?? [],
        status: "ready",
      });
    }
  }, [data, isLoading, isError, isSuccess]);

  return null;
}
