import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { timeFilterToFilterNode } from "@/services/lib/filters/helpers/filterFunctions";
import { buildFilterWithAuthClickHousePropertiesV2 } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getTotalRequests(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
): Promise<Result<number, string>> {
  const { filter: filterString, argsAcc } =
    await buildFilterWithAuthClickHousePropertiesV2({
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    });
  const query = `

  WITH total_count AS (
    SELECT count(*) as count
    FROM request_response_rmt
    ARRAY JOIN mapKeys(properties) AS key
    WHERE (
      (${filterString})
    )
  )
  SELECT coalesce(sum(count), 0) as count
  FROM total_count
`;

  const res = await dbQueryClickhouse<{
    count: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].count);
}
