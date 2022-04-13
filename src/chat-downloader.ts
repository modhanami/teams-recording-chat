import { fetchConversationMessages } from "./lib/chat-service";
import { ChatMessage } from "./shared/types";
import { querySelectorAllWait, querySelectorWait } from "./utils";

function getSkypeTokenFromLocalStorage() {
  const latestOid = localStorage.getItem('ts.latestOid');
  const authSkypeTokenValue = JSON.parse(localStorage.getItem(`ts.${latestOid}.auth.skype.token`));
  return authSkypeTokenValue.skypeToken;
}

function isLinkChildOf(link: string, expectedParentId: string) {
  return link.indexOf(expectedParentId) > -1;
}

function exportJsonStringToFile(jsonString: string, fileName: string) {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement('a');

  tempLink.href = url;
  tempLink.download = fileName;

  tempLink.click();
  URL.revokeObjectURL(url);
  tempLink.remove();
}

async function getThreadElements() {
  const container = await querySelectorWait<HTMLDivElement>('.ts-message-list-container');
  console.log('Container');
  console.log(container);
  let threadElements = Array.from(await querySelectorAllWait<HTMLDivElement>('.ts-message-list-item'));
  console.log('Thread elements');
  console.log(threadElements);

  return threadElements;
}

function makeDownloadButtonOnClickHandler(parentMessageId: string) {
  return async () => {
    const currentUrl = window.location.href;
    const threadIdKey = 'threadId';
    const queryStringStartIndex = currentUrl.indexOf(threadIdKey);
    const parsedQueryString = new URLSearchParams(currentUrl.substring(queryStringStartIndex));
    const threadId = parsedQueryString.get(threadIdKey);
    const skypeToken = getSkypeTokenFromLocalStorage();

    const messages = await fetchConversationMessages<BaseTeamsMessage>({
      threadId,
      skypeToken,
      startTime: parentMessageId, // start from the parent message
    });

    const sortedMessages = messages.sort((a, b) => a.sequenceId - b.sequenceId);

    console.log('Before filtering & transforming');
    console.log(sortedMessages);

    const filteredMessagesFirstPass = sortedMessages.filter(message => {
      const isChild = isLinkChildOf(message.conversationLink, parentMessageId)
      const isDeleted = !!message.properties.deletetime;

      return isChild && !isDeleted;
    });

    const recordedMeetingMessage = filteredMessagesFirstPass.find(message => message.contenttype === 'RichText/Media_CallRecording' && message.properties?.atp);
    console.log('Recorded meeting message', recordedMeetingMessage);
    if (!recordedMeetingMessage) {
      console.log('This meeting is not recorded');
      return;
    }

    const sharepointUrl = JSON.parse(recordedMeetingMessage.properties.atp)[0].URL;
    console.log('url: ', sharepointUrl);
    const sharepointFileId = decodeURIComponent(new URL(sharepointUrl).pathname);
    console.log('id: ', sharepointFileId);

    const filteredMessagesSecondPass = filteredMessagesFirstPass.filter(message => {
      const isText = message.contenttype === 'text';
      return isText;
    });

    const transformedMessages = filteredMessagesSecondPass.map(mapTeamsMessageToChatRendererCompatible);

    console.log('After filtering & transforming');
    console.log(transformedMessages);

    const storageKey = `${sharepointFileId}`;
    chrome.storage.local.set({ [storageKey]: transformedMessages }, () => {
      console.log('Saved to chrome.storage', storageKey);
      console.log(transformedMessages);
    });
  }
}

type BaseTeamsMessage = {
  id: string,
  content: string,
  imdisplayname: string,
  sequenceId: number,
  conversationLink: string,
  contenttype: string,
  properties: {
    deletetime: number,
    atp: string,
    emotions: {
      key: string,
      users: {
        mri: string,
        time: number,
      }[],
    }[],
  },
};

function mapTeamsMessageToChatRendererCompatible(message: BaseTeamsMessage): ChatMessage {
  const properties = message.properties;

  return {
    id: message.id,
    content: message.content,
    timestamp: Math.floor(Number(message.id) / 1000),
    sender: message.imdisplayname,
    emotions: (properties.emotions || []).map((emotion) => {
      return {
        name: emotion.key,
        users: emotion.users.map(user => {
          return {
            mri: user.mri,
            timestamp: Math.floor(user.time / 1000),
          }
        })
      }
    })
  }
}

function addDownloadChatButtonToThreadElement(threadElement: HTMLElement): void {
  console.log('Thread element');
  console.log(threadElement);
  const threadTopRowElement = threadElement.querySelector('.message-body-top-row')
  console.log('Thread top row element');
  console.log(threadTopRowElement);

  // just a divider or smth
  if (!threadTopRowElement) {
    return;
  }

  // thread element's first child is somehow contains the id prefixed with 't' (<div class="clearfix" id="t1642856185642">)
  const id = threadElement.children[0].id.slice(1);
  console.log('id');
  console.log(id);

  const downloadButton = document.createElement('button');
  downloadButton.innerText = id;
  downloadButton.classList.add('download-button');

  const handleClick = makeDownloadButtonOnClickHandler(id);
  downloadButton.addEventListener('click', handleClick);

  chatDownloaderStates.downloadButtons.push(downloadButton);
  chatDownloaderStates.handlers.push(handleClick);
  threadTopRowElement.appendChild(downloadButton);
}

// wrap states to prevent collisions
const chatDownloaderStates = (() => {
  let downloadButtons: HTMLButtonElement[] = [];
  let handlers: (() => void)[] = [];

  async function start() {
    (await getThreadElements()).forEach(addDownloadChatButtonToThreadElement);
  }

  function stop() {
    chatDownloaderStates.downloadButtons.forEach((button, index) => {
      button.removeEventListener('click', chatDownloaderStates.handlers[index]);
    });

    chatDownloaderStates.downloadButtons.forEach(button => {
      button.remove();
    });
  }

  function restart() {
    stop();
    start();
  }

  return {
    downloadButtons,
    handlers,
    start,
    stop,
    restart,
  }
})();

(async () => {
  chatDownloaderStates.start();
})()

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
