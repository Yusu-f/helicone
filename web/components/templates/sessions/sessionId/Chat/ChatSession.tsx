import React, { useState } from "react";
import { useGetRequests } from "../../../../../services/hooks/requests";

import { Row } from "../../../../layout/common/row";
import { Col } from "../../../../layout/common/col";
import RequestDrawerV2 from "../../../requests/requestDrawerV2";
import { useGetPropertiesV2 } from "../../../../../services/hooks/propertiesV2";
import FeedbackButtons from "../../../feedback/thumbsUpThumbsDown";
import StatusBadge from "../../../requests/statusBadge";
import { CustomPropertiesCard } from "../../../requests/customProperties";
import { FaChevronRight } from "react-icons/fa";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { RenderHeliconeRequest } from "@/components/templates/requests/RenderHeliconeRequest";

interface ChatSessionProps {
  requests: ReturnType<typeof useGetRequests>;
}

const ChatSession: React.FC<ChatSessionProps> = ({ requests }) => {
  const sortedRequests = [...(requests.requests.requests ?? [])].sort(
    (a, b) =>
      new Date(a.request_created_at).getTime() -
      new Date(b.request_created_at).getTime()
  );

  const [requestDrawerRequest, setRequestDrawerRequest] = useState<
    MappedLLMRequest | undefined
  >(undefined);
  const [open, setOpen] = useState(false);

  const properties = useGetPropertiesV2(() => []);

  return (
    <div className="chat-session">
      {sortedRequests.map((request, idx) => {
        const mappedRequest = heliconeRequestToMappedContent(request);
        return (
          <Row
            key={request.request_id}
            className="request-item mb-4 shadow-sm border-y border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <div className="flex-1">
              <RenderHeliconeRequest
                heliconeRequest={request}
                hideTopBar={true}
                messageSlice={idx === 0 ? undefined : "lastTwo"}
                className={""}
              />
            </div>
            <div className="lg:min-w-[350px] p-5 rounded-lg bg-slate-100 dark:bg-black">
              <Col className="justify-between h-full">
                <Col className="gap-y-2">
                  <Row className="justify-between mb-2 w-full">
                    <StatusBadge
                      statusType={
                        mappedRequest.heliconeMetadata.status.statusType
                      }
                      errorCode={mappedRequest.heliconeMetadata.status.code}
                    />
                    <FeedbackButtons
                      requestId={mappedRequest.id}
                      defaultValue={
                        mappedRequest.heliconeMetadata.scores &&
                        mappedRequest.heliconeMetadata.scores[
                          "helicone-score-feedback"
                        ]
                          ? Number(
                              mappedRequest.heliconeMetadata.scores[
                                "helicone-score-feedback"
                              ]
                            ) === 1
                            ? true
                            : false
                          : null
                      }
                    />
                  </Row>

                  <Row className="justify-between flex-wrap">
                    <div className="text-sm text-slate-500 dark:text-slate-200 font-medium w-full sm:w-auto">
                      Created at
                    </div>
                    <i className="text-sm font-light text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                      {new Date(request.request_created_at).toLocaleString()}
                    </i>
                  </Row>
                  <Row className="justify-between flex-wrap">
                    <div className="text-sm text-slate-500 dark:text-slate-200 font-medium">
                      Cost
                    </div>
                    <div className="text-sm font-light text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                      $ {mappedRequest.heliconeMetadata.cost}
                    </div>
                  </Row>
                  <Row className="justify-between flex-wrap">
                    <div className="text-sm text-slate-500 dark:text-slate-200 font-medium">
                      Latency
                    </div>
                    <div className="text-sm font-light text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                      {mappedRequest.heliconeMetadata.latency} ms
                    </div>
                  </Row>
                  <Col className="justify-between flex-wrap">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                      Custom Properties
                    </div>
                    {mappedRequest.heliconeMetadata.customProperties &&
                      properties.properties &&
                      properties.properties.length > 0 && (
                        <CustomPropertiesCard
                          customProperties={Object.entries(
                            mappedRequest.heliconeMetadata.customProperties
                          )
                            .filter(
                              ([key]) => !key.includes("Helicone-Session")
                            )
                            .reduce((acc, [key, value]) => {
                              acc[key] = value as string;
                              return acc;
                            }, {} as Record<string, string>)}
                          properties={properties.properties}
                        />
                      )}
                  </Col>
                </Col>
                <Row className="justify-end mt-4">
                  <button
                    className="text-sm flex items-center text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={() => {
                      setRequestDrawerRequest(mappedRequest);
                      setOpen(true);
                    }}
                  >
                    <span className="mr-1 font-medium">View more</span>{" "}
                    <FaChevronRight />
                  </button>
                </Row>
              </Col>
            </div>
          </Row>
        );
      })}
      <RequestDrawerV2
        open={open}
        setOpen={(open) => setOpen(open)}
        request={requestDrawerRequest}
        properties={properties.properties}
      />
    </div>
  );
};

export default ChatSession;
