import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import type { CoreSearchResult } from "@/types";

export interface CoreDatabaseState {
  ready: boolean;
  loading: boolean;
  error: string | null;
  counts: { remedies: number; rubrics: number; paragraphs: number };
  search: (query: string) => Promise<CoreSearchResult[]>;
}

const CoreDatabase = createContext<CoreDatabaseState | null>(null);

/**
 * Counts of the shipped core, used where SQLite is not available (web export).
 * They match the single-book build produced by scripts/build_core_db.py
 * (`--books repertorium-publicum-2008`), which is what the app bundles.
 */
const VERIFIED_COUNTS = { remedies: 669, rubrics: 74480, paragraphs: 45 };

/** Characters SQLite's LIKE treats specially, plus anything that is not a word. */
function sanitize(query: string): string {
  return query
    .trim()
    .replace(/[%_\\]/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ");
}

function NativeCoreDatabase({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [counts, setCounts] = useState({ remedies: 0, rubrics: 0, paragraphs: 0 });

  useEffect(() => {
    let active = true;
    void Promise.all([
      db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM remedies"),
      db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM rubrics"),
      db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM chapters"),
    ])
      .then(([remedies, rubrics, chapters]) => {
        if (active) {
          setCounts({
            remedies: remedies?.count ?? 0,
            rubrics: rubrics?.count ?? 0,
            paragraphs: chapters?.count ?? 0,
          });
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setReady(false);
      });
    return () => {
      active = false;
    };
  }, [db]);

  /**
   * Search is a LIKE scan over the precomputed rubric path
   * (`Mind > anxiety > night`), not FTS5: the shipped database has no virtual
   * tables so that it opens in WASM SQLite as well as on the device.
   */
  const search = useCallback(
    async (query: string) => {
      const term = sanitize(query);
      if (!term || !ready) return [];
      try {
        const rows = await db.getAllAsync<{
          chapter: string;
          rubric_id: number;
          path_text: string;
        }>(
          `SELECT c.title AS chapter, r.rubric_id AS rubric_id, r.path_text AS path_text
             FROM rubrics r
             JOIN chapters c ON c.chapter_id = r.chapter_id
            WHERE r.path_text LIKE ?
            ORDER BY length(r.path_text), r.rubric_id
            LIMIT 25`,
          `%${term}%`,
        );
        return rows.map((row) => ({
          bookKey: row.chapter,
          edition: "UniRep",
          paragraphNumber: row.rubric_id,
          content: row.path_text,
        }));
      } catch {
        return [];
      }
    },
    [db, ready],
  );

  return (
    <CoreDatabase.Provider value={{ ready, loading: !ready, error: null, counts, search }}>
      {children}
    </CoreDatabase.Provider>
  );
}

export function CoreDatabaseProvider({ children }: { children: React.ReactNode }) {
  // Web is handled by CoreDatabaseContext.web.tsx (sql.js in WASM), which Metro
  // resolves instead of this file for that platform.
  return (
    <SQLiteProvider
      databaseName="unirep_core.db"
      assetSource={{ assetId: require("../assets/unirep_core.db") }}
      onError={(error) => console.warn("UniRep core database unavailable", error.message)}
    >
      <NativeCoreDatabase>{children}</NativeCoreDatabase>
    </SQLiteProvider>
  );
}

export function useCoreDatabase() {
  const value = useContext(CoreDatabase);
  if (!value) throw new Error("useCoreDatabase must be used within CoreDatabaseProvider");
  return value;
}
