import { render } from ".";
import { DriveItemUrlMessage } from "./shared/types";
import { querySelectorWait } from "./utils";

chrome.runtime.onMessage.addListener(handleItemUrlMessage);

async function handleItemUrlMessage({ driveItemUrlWithAuthToken }: DriveItemUrlMessage) {
  chrome.runtime.onMessage.removeListener(handleItemUrlMessage);
  console.log('onMessage');
  console.log(driveItemUrlWithAuthToken);


  const response = await fetch(driveItemUrlWithAuthToken);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.dir('data:');
  console.dir(data, { depth: 2 });

  const recordingStartDateTime = data.media.recordingStartDateTime;
  const recordingEndDateTime = data.media.recordingEndDateTime;
  console.log(`recordingStartDateTime: ${recordingStartDateTime}`);
  console.log(`recordingEndDateTime: ${recordingEndDateTime}`);

  const startTime = Math.floor(Date.parse(recordingStartDateTime) / 1000);
  const endTime = Math.floor(Date.parse(recordingEndDateTime) / 1000);
  console.log(`startTime: ${startTime}`);
  console.log(`endTime: ${endTime}`);

  const chatRendererContainer = await querySelectorWait<HTMLDivElement>('[aria-label="Video Player"]');
  const playerContainer = await querySelectorWait<HTMLDivElement>('[aria-label="Video Player"] > div');
  const chatRendererWidth = '360px';
  playerContainer.style.width = `calc(100% - ${chatRendererWidth})`;
  chatRendererContainer.style.position = 'relative';

  const chatRendererRoot = await mountChatRenderer(chatRendererContainer, chatRendererWidth);
  const sharepointFileId = new URL(document.location.href).searchParams.get('id');

  chrome.storage.local.get([sharepointFileId], function (result) {
    const value = result[sharepointFileId];
    console.log('file id: ');
    console.log(sharepointFileId);

    if (!value) {
      console.log('No value');
      return;
    }
    console.log('Value:');
    console.log(value);

    function renderChatMessagesAtCurrentTime(currentTime: number) {
      render(chatRendererRoot, { messages: value, currentTime, startTime: startTime, endTime: endTime, timestampExtractor: (message: any) => message.timestamp });
    }

    renderChatMessagesAtCurrentTime(0);

    observeCurrentTime((currentTime) => {
      console.log(`currentTime: ${currentTime}`);
      renderChatMessagesAtCurrentTime(currentTime);
    });
  });
}

async function observeCurrentTime(callback: (currentTime: number) => void) {
  const msStreamPlayer = await querySelectorWait<HTMLVideoElement>('.vjs-player video');

  msStreamPlayer.addEventListener('timeupdate', function (this, _event) {
    const currentTime = this.currentTime;
    callback(currentTime);
  });
}

async function mountChatRenderer(root: HTMLElement, width: string) {
  const chatRendererElement = document.createElement('div');
  chatRendererElement.id = 'chat-renderer';
  chatRendererElement.style.width = '360px';
  chatRendererElement.style.top = '0';
  chatRendererElement.style.bottom = '0';
  chatRendererElement.style.right = '0';
  chatRendererElement.style.backgroundColor = '#b00335';
  chatRendererElement.style.position = 'absolute';
  root.appendChild(chatRendererElement);
  console.log('chatRendererElement');
  console.log(chatRendererElement);
  console.log('mounted chatRendererElement');

  return chatRendererElement;
}
