import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { CoreSearchResult } from "@/types";
import type { Database } from "sql.js";

export interface CoreDatabaseState {
  ready: boolean;
  loading: boolean;
  error: string | null;
  counts: { remedies: number; rubrics: number; paragraphs: number };
  search: (query: string) => Promise<CoreSearchResult[]>;
}

/**
 * Web build.
 *
 * `expo-sqlite` cannot be bundled for web (its worker imports a `wa-sqlite.wasm`
 * the package does not ship), so the browser reads the same core database with
 * sql.js instead. The database and the sql.js WASM binary are copied next to the
 * exported bundle by `scripts/finish-web-build.mjs`; both are resolved relative
 * to the document, so the build works at `/`, `/app/` or any sub-path.
 */
const CoreDatabase = createContext<CoreDatabaseState | null>(null);
const FALLBACK_COUNTS = { remedies: 669, rubrics: 74480, paragraphs: 45 };

function assetUrl(name: string): string {
  const base = typeof document !== "undefined" ? document.baseURI : "http://localhost/";
  return new URL(name, base).href;
}

function sanitize(query: string): string {
  return query
    .trim()
    .replace(/[%_\\]/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ");
}

export function CoreDatabaseProvider({ children }: { children: React.ReactNode }) {
  const dbRef = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState(FALLBACK_COUNTS);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [initSqlJs, response] = await Promise.all([
          import("sql.js").then((mod) => mod.default),
          fetch(assetUrl("unirep_core.db")),
        ]);
        if (!response.ok) throw new Error(`core database: HTTP ${response.status}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        const SQL = await initSqlJs({ locateFile: (file: string) => assetUrl(file) });
        const db = new SQL.Database(bytes);

        const count = (sql: string) => {
          const result = db.exec(sql);
          return Number(result[0]?.values?.[0]?.[0] ?? 0);
        };

        if (active) {
          dbRef.current = db;
          setCounts({
            remedies: count("SELECT COUNT(*) FROM remedies"),
            rubrics: count("SELECT COUNT(*) FROM rubrics"),
            paragraphs: count("SELECT COUNT(*) FROM chapters"),
          });
          setReady(true);
          setError(null);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "core database unavailable");
          setReady(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const search = useCallback(async (query: string) => {
    const db = dbRef.current;
    const term = sanitize(query);
    if (!db || !term) return [];
    try {
      const statement = db.prepare(
        `SELECT c.title, r.rubric_id, r.path_text
           FROM rubrics r
           JOIN chapters c ON c.chapter_id = r.chapter_id
          WHERE r.path_text LIKE ?
          ORDER BY length(r.path_text), r.rubric_id
          LIMIT 25`,
      );
      statement.bind([`%${term}%`]);
      const rows: CoreSearchResult[] = [];
      while (statement.step()) {
        const row = statement.getAsObject() as { title: string; rubric_id: number; path_text: string };
        rows.push({
          bookKey: row.title,
          edition: "UniRep",
          paragraphNumber: Number(row.rubric_id),
          content: row.path_text,
        });
      }
      statement.free();
      return rows;
    } catch {
      return [];
    }
  }, []);

  return (
    <CoreDatabase.Provider value={{ ready, loading, error, counts, search }}>
      {children}
    </CoreDatabase.Provider>
  );
}

export function useCoreDatabase() {
  const value = useContext(CoreDatabase);
  if (!value) throw new Error("useCoreDatabase must be used within CoreDatabaseProvider");
  return value;
}
