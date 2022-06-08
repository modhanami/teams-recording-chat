import { createReplyChainManagerConnection, queryReplyChainMessages } from "./lib/replychain-manager";
import { BaseReplyChainMessage, ChatMessage } from "./shared/types";
import { querySelectorAllWait } from "./utils";

function makeDownloadButtonOnClickHandler(db: IDBDatabase, parentMessageId: string, threadId: string) {
  return async () => {
    const messages = await queryReplyChainMessages(db, threadId, parentMessageId);

    const sortedMessages = messages.sort((a, b) => a.sequenceId - b.sequenceId);

    console.log('Before filtering & transforming');
    console.log(sortedMessages);

    const filteredMessagesFirstPass = sortedMessages.filter(message => {
      const isDeleted = !!message.properties.deletetime;
      return !isDeleted;
    });

    const recordedMeetingMessage = filteredMessagesFirstPass.find((message) => {
      const isMediaRecordingMessage = message.messageType === 'RichText/Media_CallRecording';
      const hasAtp = !!message.properties.atp;

      return isMediaRecordingMessage && hasAtp;
    });

    console.log('Recorded meeting message', recordedMeetingMessage);

    if (!recordedMeetingMessage) {
      console.log('This meeting is not recorded');
      return;
    }

    const sharepointUrl = JSON.parse(recordedMeetingMessage.properties.atp)[0].URL;
    console.log('Sharepoint URL: ', sharepointUrl);
    const sharepointFileId = decodeURIComponent(new URL(sharepointUrl).pathname);
    console.log('Sharepoint ID: ', sharepointFileId);

    const filteredMessagesSecondPass = filteredMessagesFirstPass.filter(message => {
      const isUserMessage = ["RichText/Html", "Text"].includes(message.messageType);
      return isUserMessage;
    });

    const transformedMessages = filteredMessagesSecondPass.map(mapTeamsMessageToChatRendererCompatible);

    console.log('After filtering & transforming');
    console.log(transformedMessages);

    // save transformed messages for this sharepoint file (to be picked up by the chat renderer)
    chrome.storage.local.set({ [sharepointFileId]: transformedMessages }, () => {
      console.log(`Saved ${transformedMessages.length} messages to storage for ${sharepointFileId}`);
    });
  }
}


function getThreadIdFromUrl(url: string) {
  const threadIdKey = 'threadId';
  const queryStringStartIndex = url.indexOf(threadIdKey);
  const parsedQueryString = new URLSearchParams(url.substring(queryStringStartIndex));
  const threadId = parsedQueryString.get(threadIdKey);

  return threadId;
}

function mapTeamsMessageToChatRendererCompatible(message: BaseReplyChainMessage): ChatMessage {
  return {
    id: message.id,
    content: message.content,
    timestamp: Math.floor(Number(message.originalArrivalTime) / 1000),
    sender: message.imDisplayName,
    emotions: (message.properties.emotions || []).map((emotion) => {
      return {
        name: emotion.key,
        users: emotion.users.map(user => {
          return {
            mri: user.mri,
            timestamp: Math.floor(Number(user.time) / 1000),
          }
        })
      }
    }),
  }
}


function makeDownloadButton(text: string) {
  const button = document.createElement('button');
  button.textContent = text;
  button.classList.add('download-button');
  button.style.color = '#000';

  return button;
}


let downloadButtons: HTMLButtonElement[] = [];
let handlers: (() => void)[] = [];
const threadId = getThreadIdFromUrl(window.location.href);

async function start() {
  const threadElements = await getThreadElements();

  const activeUserProfile = getMSALActiveUserProfileFromLocalStorage();
  let db: IDBDatabase;
  try {
    db = await createReplyChainManagerConnection(activeUserProfile.tid, activeUserProfile.oid);
    console.log('Connected to reply chain manager');
  } catch (e) {
    console.log('Failed to connect to reply chain manager');
    console.log(e);
    return;
  }

  for (let threadElement of threadElements) {
    const entrypoint = getThreadElementEntrypoint(threadElement);

    if (!entrypoint) {
      continue;
    }

    // thread element's first child contains the parent message id
    // prefixed with 't' (<div class="clearfix" id="t1642856185642">)
    const parentMessageId = threadElement.firstElementChild.id.slice(1);

    const downloadButton = makeDownloadButton(parentMessageId);
    const handleClick = makeDownloadButtonOnClickHandler(db, parentMessageId, threadId);

    downloadButton.addEventListener('click', handleClick);

    downloadButtons.push(downloadButton);
    handlers.push(handleClick);
    entrypoint.appendChild(downloadButton);
  }
}

function getMSALActiveUserProfileFromLocalStorage(): { tid: string, oid: string } {
  const activeUserProfile = JSON.parse(localStorage.getItem('msal.activeUserProfile'));
  return activeUserProfile;
}

async function getThreadElements() {
  return Array.from(await querySelectorAllWait<HTMLDivElement>('.ts-message-list-item'));
}

function getThreadElementEntrypoint(threadElement: HTMLDivElement) {
  return threadElement.querySelector('.message-body-top-row');
}

function stop() {
  downloadButtons.forEach((button, index) => {
    button.removeEventListener('click', handlers[index]);
  });

  downloadButtons.forEach(button => {
    button.remove();
  });
}

function restart() {
  stop();
  start();
}

start();
