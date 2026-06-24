import { useCallback, useContext, useState } from "react";
import type { SearchRequest } from "../../../application/context/search/SearchRequest.js";
import type { SearchResponse } from "../../../application/context/search/SearchResponse.js";
import { SearchResultLimit } from "../../../application/context/search/SearchResultLimit.js";
import { StateReaderContext } from "./StateReaderContext.js";
import type { StateSnapshot } from "./StateSnapshot.js";

export interface GlobalSearchSnapshot extends StateSnapshot<SearchResponse> {
  readonly search: (query: string) => Promise<void>;
}

export function useGlobalSearch(): GlobalSearchSnapshot {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.searchController;
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const search = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      setLastQuery(trimmedQuery);

      if (trimmedQuery.length === 0 || controller === undefined) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const request: SearchRequest = {
          criteria: {
            query: trimmedQuery,
            limit: SearchResultLimit.DEFAULT,
          },
        };
        const response = await controller.handle(request);
        setData(response);
        setError(null);
      } catch (caughtError) {
        setError(toError(caughtError));
      } finally {
        setLoading(false);
      }
    },
    [controller],
  );

  const refresh = useCallback(async () => {
    await search(lastQuery);
  }, [lastQuery, search]);

  return {
    data,
    error,
    loading,
    refresh,
    search,
  };
}

function toError(caughtError: unknown): Error {
  if (caughtError instanceof Error) {
    return caughtError;
  }

  return new Error(String(caughtError));
}
