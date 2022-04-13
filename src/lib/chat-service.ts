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

  const messagesUrl = createMessagesUrl(threadId, startTime, pageSize);
  const response = await fetch(messagesUrl, {
    headers: {
      authentication: `skypetoken=${skypeToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch messages for thread ${threadId}`);
  }

  // _metadata contains next page syncState (currently not handled)
  const dataWithMetadata = await response.json() as { messages: Message[], _metadata: any };
  console.log('Raw data', dataWithMetadata);
  
  const messages = dataWithMetadata.messages;
  return messages;
}

function createMessagesUrl(threadId: string, startTime: string, pageSize: number): string {
  return `https://apac.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${threadId}/messages?startTime=${startTime}&view=msnp24Equivalent&pageSize=${pageSize}`;
}

