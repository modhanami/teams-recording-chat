import { DriveItemUrlMessage } from "./shared/types";

chrome.webRequest.onCompleted.addListener(function handler(details) {
  console.log('onCompleted');
  console.log(details);

  // the token is from session storage with the key MediaAuthStore<email>-<driveUrl>
  const driveItemUrlWithAuthToken = details.url;
  console.log(`itemUrlWithToken: ${driveItemUrlWithAuthToken}`);

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (typeof tab.id === 'undefined') {
      return;
    }
    chrome.tabs.sendMessage<DriveItemUrlMessage>(tab.id, {
      driveItemUrlWithAuthToken
    });
  });
}, {
  urls: [
    "*://*.sharepoint.com/*/_api/v2.0/drives/*"
  ]
})

export { };

