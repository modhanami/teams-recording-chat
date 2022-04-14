type FetchConversationMessagesOptions = {
  threadId: string,
  skypeToken: string,
  startTime: string,
  pageSize?: number,
}

export async function fetchConversationMessages<Message = any>({
  threadId,
  skypeToken,
  startTime,
  pageSize = 100,
}: FetchConversationMessagesOptions): Promise<Message[]> {
  console.log(`Thread id: ${threadId}`);
  console.log(`Skype token: ${skypeToken}`);
  console.log(`Start time: ${startTime}`);
  console.log(`Page size: ${pageSize}`);

  const requestIntervalInSecond = 3;
  const fetchedMessages = [];
  let nextUrl = createMessagesUrl(threadId, startTime, pageSize);
  let requestCount = 0;

  while (true) {
    const response = await fetch(nextUrl, {
      headers: {
        authentication: `skypetoken=${skypeToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages for thread ${threadId} on the request no. ${++requestCount}`);
    }

    const parsedDataWithMetadata = await response.json();
    const { messages, _metadata } = parsedDataWithMetadata;
    fetchedMessages.push(...messages);

    console.log(`Fetched ${messages.length} messages. Total: ${fetchedMessages.length}`);

    if (messages.length === 0 || _metadata.syncState === undefined) {
      console.log('No more messages to fetch');
      break;
    }

    nextUrl = _metadata.syncState;

    // wait for 3 second between each request
    console.log(`Waiting for ${requestIntervalInSecond} seconds before next request`);
    await new Promise(resolve => setTimeout(resolve, requestIntervalInSecond * 1000));
  }

  return fetchedMessages;
}

function createMessagesUrl(threadId: string, startTime: string, pageSize: number): string {
  return `https://apac.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${threadId}/messages?startTime=${startTime}&view=msnp24Equivalent&pageSize=${pageSize}`;
}

