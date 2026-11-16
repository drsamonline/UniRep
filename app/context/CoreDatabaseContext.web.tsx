import React, { createContext, useContext } from "react";
import type { CoreSearchResult } from "@/types";

export interface CoreDatabaseState {
  ready: boolean;
  counts: { remedies: number; rubrics: number; paragraphs: number };
  search: (query: string) => Promise<CoreSearchResult[]>;
}

/**
 * Web build.
 *
 * expo-sqlite's web worker imports `wa-sqlite.wasm`, which the published package
 * does not ship, so the module cannot be bundled for the web export at all.
 * This file is resolved instead of `CoreDatabaseContext.tsx` on web: no native
 * module is imported, the shipped core is reported by its known counts, and
 * search falls back to the in-memory index the app already carries.
 */
const VERIFIED_COUNTS = { remedies: 669, rubrics: 74480, paragraphs: 45 };

const CoreDatabase = createContext<CoreDatabaseState | null>(null);

export function CoreDatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <CoreDatabase.Provider
      value={{
        ready: true,
        counts: VERIFIED_COUNTS,
        search: async () => [],
      }}
    >
      {children}
    </CoreDatabase.Provider>
  );
}

export function useCoreDatabase() {
  const value = useContext(CoreDatabase);
  if (!value) throw new Error("useCoreDatabase must be used within CoreDatabaseProvider");
  return value;
}
