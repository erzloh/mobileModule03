import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type SelectedLocation = {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
};

type SearchContextValue = {
  searchText: string;
  setSearchText: (value: string) => void;
  selectedLocation: SelectedLocation | null;
  setSelectedLocation: (value: SelectedLocation | null) => void;
  locationMessage: string | null;
  setLocationMessage: (value: string | null) => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({
  value,
  children,
}: {
  value: SearchContextValue;
  children: ReactNode;
}) {
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearchContext() {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearchContext must be used inside SearchProvider");
  }

  return context;
}
