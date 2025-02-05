import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useOrg } from "../../components/layout/org/organizationContext";
import { HeliconeRequest } from "../../lib/api/request/request";
import { getJawnClient } from "../../lib/clients/jawn";
import { Result } from "../../lib/result";
import { FilterNode } from "../lib/filters/filterDefs";
import { placeAssetIdValues } from "../lib/requestTraverseHelper";
import { SortLeafRequest } from "../lib/sorts/requests/sorts";
import { ok } from "assert";

function formatDateForClickHouse(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function processFilter(filter: any): any {
  if (typeof filter !== "object" || filter === null) {
    return filter;
  }

  const result: any = Array.isArray(filter) ? [] : {};

  for (const key in filter) {
    if (key === "gte" || key === "lte") {
      result[key] = formatDateForClickHouse(new Date(filter[key]));
    } else if (typeof filter[key] === "object") {
      result[key] = processFilter(filter[key]);
    } else {
      result[key] = filter[key];
    }
  }

  return result;
}

interface RequestBodyContent {
  request: any;
  response: any;
}

const requestBodyCache = new Map<string, RequestBodyContent>();

export const useGetRequestWithBodies = (requestId: string) => {
  const org = useOrg();

  return useQuery({
    queryKey: ["single-request", requestId, org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const response = await jawn.GET(`/v1/request/{requestId}`, {
        params: {
          path: {
            requestId,
          },
        },
      });
      if (!response.data?.data?.signed_body_url) return response.data;
      if (response.data.data && response.data.data.signed_body_url) {
        const contentResponse = await fetch(response.data.data.signed_body_url);
        if (contentResponse.ok) {
          const text = await contentResponse.text();
          let content = JSON.parse(text);
          if (response.data?.data?.asset_urls) {
            content = placeAssetIdValues(
              response.data?.data?.asset_urls,
              content
            );
          }
          requestBodyCache.set(response.data?.data?.request_id, content);
          if (requestBodyCache.size > 1000) {
            requestBodyCache.clear();
          }
          response.data.data.response_body = content.response;
          response.data.data.request_body = content.request;
        }
      }

      return response.data as Result<HeliconeRequest, string>;
    },
    enabled: !!requestId && !!org?.currentOrg?.id,
  });
};

export const useGetRequestsWithBodies = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  isLive: boolean = false,
  isCached: boolean = false
) => {
  const org = useOrg();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "requestsData",
      currentPage,
      currentPageSize,
      advancedFilter,
      sortLeaf,
      isCached,
      org?.currentOrg?.id,
    ],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const advancedFilter = query.queryKey[3];
      const sortLeaf = query.queryKey[4];
      const isCached = query.queryKey[5];
      const orgId = query.queryKey[6] as string;
      const jawn = getJawnClient(orgId);

      const response = await jawn.POST("/v1/request/query-clickhouse", {
        body: {
          filter: advancedFilter as any,
          offset: (currentPage - 1) * currentPageSize,
          limit: currentPageSize,
          sort: sortLeaf as any,
          isCached: isCached as any,
        },
      });

      return response.data as Result<HeliconeRequest[], string>;
    },
    refetchOnWindowFocus: false,
    refetchInterval: isLive ? 1_000 : false,
    keepPreviousData: true,
  });

  const requestsWithSignedUrls = useMemo(() => data?.data ?? [], [data]);

  const urlQueries = useQueries({
    queries: requestsWithSignedUrls.map((request) => ({
      queryKey: ["request-content", request.signed_body_url],
      queryFn: async () => {
        if (requestBodyCache.has(request.request_id)) {
          return requestBodyCache.get(request.request_id);
        }
        if (!request.signed_body_url) return null;
        const contentResponse = await fetch(request.signed_body_url);
        if (contentResponse.ok) {
          const text = await contentResponse.text();
          let content = JSON.parse(text);
          if (request.asset_urls) {
            content = placeAssetIdValues(request.asset_urls, content);
          }
          requestBodyCache.set(request.request_id, content);
          if (requestBodyCache.size > 1000) {
            requestBodyCache.clear();
          }
          return content;
        }
        return null;
      },
      keepPreviousData: true,
      enabled: !!request.signed_body_url,
    })),
  });

  const requests = useMemo(() => {
    return requestsWithSignedUrls.map((request, index) => {
      const content = urlQueries[index].data;
      if (!content) return request;

      let updatedRequest = {
        ...request,
        request_body: content.request,
        response_body: content.response,
      };

      return updatedRequest;
    });
  }, [requestsWithSignedUrls, urlQueries]);

  const isUrlsFetching = urlQueries.some((query) => query.isFetching);

  return {
    isLoading: isLoading,
    refetch,
    isRefetching: isRefetching || isUrlsFetching,
    requests: requests,
    completedQueries: urlQueries.filter((query) => query.isSuccess).length,
    totalQueries: requestsWithSignedUrls.length,
  };
};

const useGetRequests = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  isCached: boolean = false,
  isLive: boolean = false
) => {
  return {
    requests: useGetRequestsWithBodies(
      currentPage,
      currentPageSize,
      advancedFilter,
      sortLeaf,
      isLive,
      isCached
    ),
    count: useQuery({
      queryKey: [
        "requestsCount",
        currentPage,
        currentPageSize,
        advancedFilter,
        sortLeaf,
        isCached,
      ],
      queryFn: async (query) => {
        const advancedFilter = query.queryKey[3];
        const isCached = query.queryKey[5];
        const processedFilter = processFilter(advancedFilter);
        return await fetch("/api/request/count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: processedFilter,
            isCached,
          }),
        }).then((res) => res.json() as Promise<Result<number, string>>);
      },
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 2_000 : false,
      // cache the count for 5 minutes
      cacheTime: 5 * 60 * 1000,
    }),
  };
};

const useGetRequestCountClickhouse = (
  startDateISO: string,
  endDateISO: string,
  orgId?: string
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [`org-count`, orgId, startDateISO, endDateISO],
    queryFn: async (query) => {
      const organizationId = query.queryKey[1];
      const startDate = query.queryKey[2];
      const endDate = query.queryKey[3];

      const data = await fetch(`/api/request/ch/count`, {
        method: "POST",
        body: JSON.stringify({
          filter: {
            left: {
              request_response_rmt: {
                request_created_at: {
                  gte: startDate,
                },
              },
            },
            operator: "and",
            right: {
              request_response_rmt: {
                request_created_at: {
                  lte: endDate,
                },
              },
            },
          },
          organization_id: organizationId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
      return data;
    },
    refetchOnWindowFocus: false,
  });
  return {
    count: data,
    isLoading,
    refetch,
  };
};

export { useGetRequestCountClickhouse, useGetRequests };
