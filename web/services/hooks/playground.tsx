import { Message } from "../../components/templates/requests/chat";
import { NormalizedRequest } from "../../components/templates/requestsV2/builder/abstractRequestBuilder";
import useRequestsPageV2 from "../../components/templates/requestsV2/useRequestsPageV2";

export const getChat = (
  requests: NormalizedRequest[]
): {
  chat: Message[];
  isChat: boolean;
} => {
  console.log("singleRequest", requests[0]);
  let isChat = false;
  if (!requests || requests.length < 1) {
    return {
      chat: [],
      isChat: false,
    };
  }

  const singleRequest = requests[0];

  const getSourceChat = () => {
    if (singleRequest.provider === "ANTHROPIC") {
      const requestBody = JSON.parse(JSON.stringify(singleRequest.requestBody));
      if (requestBody && requestBody.system && requestBody.messages) {
        const systemMessage = {
          role: "system",
          content: requestBody.system,
        };
        requestBody.messages.unshift(systemMessage);
        return JSON.parse(JSON.stringify(requestBody));
      } else {
        return JSON.parse(JSON.stringify(singleRequest.requestBody));
      }
    } else {
      return JSON.parse(JSON.stringify(singleRequest.requestBody));
    }
  };

  const sourceChat = getSourceChat();

  const sourceResponse = JSON.parse(JSON.stringify(requests[0].responseBody));

  if (!Array.isArray(sourceChat.messages)) {
    return {
      chat: [],
      isChat: false,
    };
  }

  const sourcePrompt = [...sourceChat.messages];

  if (
    singleRequest.provider === "ANTHROPIC" &&
    sourceResponse &&
    sourceResponse.content &&
    sourceResponse.content[0] &&
    sourceResponse.content[0].text
  ) {
    sourcePrompt.push({
      role: "assistant",
      content: sourceResponse.content[0].text,
    });
  }

  if (
    sourceResponse &&
    sourceResponse.choices &&
    sourceResponse.choices[0].message &&
    sourceResponse.choices[0].message !== ""
  ) {
    sourcePrompt.push(sourceResponse.choices[0].message);
  }

  // give all the messages in sourcePrompt an id
  sourcePrompt.forEach((message: any, index: number) => {
    message.id = index;
  });

  if (sourcePrompt.length > 1) {
    isChat = true;
  }

  return {
    chat: sourcePrompt,
    isChat,
  };
};

export const usePlaygroundPage = (requestId: string) => {
  const requests = useRequestsPageV2(
    1,
    1,
    [],
    {
      request: {
        id: {
          equals: requestId,
        },
      },
    },
    {},
    false,
    false
  );

  const { chat, isChat } = getChat(requests.requests);

  return {
    isLoading: requests.isDataLoading,
    data: requests.requests,
    chat,
    refetch: requests.refetch,
    hasData: requests.requests && requests.requests.length > 0,
    isChat,
  };
};
