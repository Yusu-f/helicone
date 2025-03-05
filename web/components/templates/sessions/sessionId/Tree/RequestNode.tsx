import { useOrg } from "@/components/layout/org/organizationContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { Row } from "../../../../layout/common/row";
import { clsx } from "../../../../shared/clsx";
import StatusBadge from "../../../requests/statusBadge";

// Unified data structure for request types
const REQUEST_TYPE_CONFIG = {
  LLM: {
    bgColor: "bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-200",
    displayName: "LLM",
  },
  tool: {
    bgColor:
      "bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-200",
    displayName: "Tool",
  },
  vector_db: {
    bgColor:
      "bg-orange-200 dark:bg-orange-900 text-orange-700 dark:text-orange-200",
    displayName: "Vector DB",
  },
};

export function RequestNode(props: {
  isOnboardingRequest: boolean;
  isRequestSingleChild: boolean;
  selectedRequestId: string;
  node: TreeNodeData;
  setCloseChildren: React.Dispatch<React.SetStateAction<boolean>>;
  closeChildren: boolean;
  setSelectedRequestId: (x: string) => void;
  level: number;
  setShowDrawer: (x: boolean) => void;
  label?: string;
}) {
  const {
    isOnboardingRequest,
    node,
    isRequestSingleChild,
    selectedRequestId,
    setCloseChildren,
    closeChildren,
    setSelectedRequestId,
    level,
    setShowDrawer,
    label,
  } = props;

  const promptId = useMemo(() => {
    return node.trace?.request.heliconeMetadata?.customProperties?.[
      "Helicone-Prompt-Id"
    ] as string | undefined;
  }, [node.trace?.request.heliconeMetadata.customProperties]);

  const router = useRouter();

  const org = useOrg();

  const promptData = useQuery({
    queryKey: ["prompt", promptId, org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[2]);
      const prompt = await jawn.POST("/v1/prompt/query", {
        body: {
          filter: {
            prompt_v2: {
              user_defined_id: {
                equals: query.queryKey[1],
              },
            },
          },
        },
      });
      return prompt.data?.data?.[0];
    },
  });

  const modelRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = modelRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [node.trace?.request.model]);

  const type = node.trace?.request.model.startsWith("tool:")
    ? "tool"
    : node.trace?.request.model.startsWith("vector_db")
    ? "vector_db"
    : "LLM";

  // Get the actual model name for display
  const getModelName = () => {
    if (type === "tool") {
      return node.trace?.request.model.split(":")[1];
    } else if (type === "vector_db") {
      return (
        (node.trace?.request.raw.request as any).operation ??
        node.trace?.request.model
      );
    } else {
      return node.trace?.request.model;
    }
  };

  return (
    <div
      className={clsx(
        "flex flex-col dark:bg-slate-900 py-[8px] pl-4 px-4 group-hover:cursor-pointer w-full",
        selectedRequestId === node.trace?.request_id
          ? "bg-sky-100 dark:bg-slate-900 hover:bg-sky-100 dark:hover:bg-slate-800"
          : "bg-white dark:bg-slate-950 group-hover:bg-sky-50 dark:group-hover:bg-slate-800"
      )}
      onClick={() =>
        node.children
          ? setCloseChildren(!closeChildren)
          : setSelectedRequestId(node.trace?.request_id ?? "")
      }
    >
      <Row className="w-full gap-2 items-center">
        <Row className="items-center gap-2 flex-grow min-w-0">
          <div
            className={clsx(
              "flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap",
              REQUEST_TYPE_CONFIG[type as keyof typeof REQUEST_TYPE_CONFIG]
                .bgColor
            )}
          >
            {
              REQUEST_TYPE_CONFIG[type as keyof typeof REQUEST_TYPE_CONFIG]
                .displayName
            }
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={modelRef}
                className="flex-grow flex-shrink-1 max-w-[200px] min-w-[100px] bg-transparent dark:bg-transparent dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 text-xs font-medium rounded-md truncate"
              >
                {label ?? getModelName()}
              </div>
            </TooltipTrigger>
            {isTruncated && (
              <TooltipContent>
                <span>{node.trace?.request.model}</span>
              </TooltipContent>
            )}
          </Tooltip>
          <span className="text-slate-400 dark:text-slate-600 text-[11px] whitespace-nowrap">
            {isRequestSingleChild ? "" : `(${node.duration})`}
          </span>
        </Row>
        <Row className="flex-shrink-0 items-center gap-2">
          {node.trace?.request.heliconeMetadata?.status && (
            <StatusBadge
              statusType={
                node.trace?.request.heliconeMetadata.status.statusType
              }
              errorCode={node.trace?.request.heliconeMetadata.status.code}
            />
          )}
        </Row>
      </Row>
    </div>
  );
}
