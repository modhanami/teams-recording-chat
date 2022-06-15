import { createReplyChainManagerConnection, queryReplyChainMessages } from "./lib/replychain-manager";
import { BaseReplyChainMessage, ChatMessage } from "./shared/types";
import { querySelectorAllWait } from "./utils";

function makeDownloadButtonOnClickHandler(db: IDBDatabase, threadId: string, parentMessageId: string) {
  return async () => {
    const allMessages = await queryReplyChainMessages(db, threadId, parentMessageId);

    console.log('Raw messages from IndexedDB');
    console.log(allMessages);

    const recordedMeetingMessage = allMessages.find((message) => {
      const isMediaRecordingMessage = message.messageType === 'RichText/Media_CallRecording';
      const hasAtpProperty = !!message.properties.atp; // has info about the corresponding sharepoint file

      return isMediaRecordingMessage && hasAtpProperty;
    });

    if (recordedMeetingMessage === undefined) {
      console.log('This meeting is not recorded');
      return;
    } else {
      console.log('Recorded meeting message', recordedMeetingMessage);
    }

    const sharepointUrl = JSON.parse(recordedMeetingMessage.properties.atp)[0].URL;
    console.log('Sharepoint URL: ', sharepointUrl);
    const sharepointFileId = decodeURIComponent(new URL(sharepointUrl).pathname);
    console.log('Sharepoint ID: ', sharepointFileId);

    const notDeletedMessages = allMessages.filter(message => {
      const hasDeletedProperty = !!message.properties.deletetime;
      return !hasDeletedProperty;
    });

    const sortedMessages = notDeletedMessages.sort((a, b) => a.sequenceId - b.sequenceId);

    const userMessages = sortedMessages.filter(message => {
      const isUserMessage = ["RichText/Html", "Text"].includes(message.messageType);
      return isUserMessage;
    });

    const transformedMessages = userMessages.map(mapTeamsMessageToChatRendererCompatible);

    console.log('Filtered & transformed messages');
    console.log(transformedMessages);

    // save transformed messages for this sharepoint file (to be picked up by the chat renderer)
    chrome.storage.local.set({ [sharepointFileId]: transformedMessages }, () => {
      console.log(`Saved ${transformedMessages.length} messages to storage for ${sharepointFileId}`);
    });
  }
}


function extractThreadIdFromUrl(url: string) {
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

async function createDBConnection(tid: string, oid: string) {
  try {
    const db = await createReplyChainManagerConnection(tid, oid);
    console.log('Connected to reply chain manager');
    return db;
  } catch (e) {
    console.log('Failed to connect to reply chain manager');
    console.log(e);
    return;
  }
}

function getMSALActiveUserProfileFromLocalStorage(): { tid: string, oid: string } {
  const activeUserProfile = JSON.parse(localStorage.getItem('msal.activeUserProfile'));
  return activeUserProfile;
}

async function getThreadElements(): Promise<Element[]> {
  return Array.from(await querySelectorAllWait<Element>('.ts-message-list-item'));
}

function unmountDownloadButtons() {
  downloadButtons.forEach((button, index) => {
    button.removeEventListener('click', handlers[index]);
  });

  downloadButtons.forEach(button => {
    button.remove();
  });
}

async function mountDownloadButtons() {
  const activeProfile = getMSALActiveUserProfileFromLocalStorage();
  const db = await createDBConnection(activeProfile.tid, activeProfile.oid);
  const threadElements = await getThreadElements();
  const threadId = extractThreadIdFromUrl(window.location.href);

  for (const threadElement of threadElements) {
    // thread element's first child contains the parent message id
    // prefixed with 't' (<div class="clearfix" id="t1642856185642">)
    const parentMessageId = threadElement.firstElementChild.id.slice(1);

    const downloadButton = makeDownloadButton(parentMessageId);
    const handleClick = makeDownloadButtonOnClickHandler(db, threadId, parentMessageId);

    downloadButton.addEventListener('click', handleClick);

    const downloadButtonEntrypoint = threadElement.querySelector('.message-body-top-row');
    downloadButtonEntrypoint.appendChild(downloadButton);

    downloadButtons.push(downloadButton);
    handlers.push(handleClick);
  }
}

mountDownloadButtons();