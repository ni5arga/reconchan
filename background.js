// optional background service worker

let lastReconData = null;

function debugLog(...args) {
  try { console.log('[reconchan background]', ...args); } catch {}
}

debugLog('Background script loaded');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  debugLog('Received message', msg, sender);
  if (msg.type === "RECON_DATA") {
    lastReconData = msg.data;
    debugLog('Stored RECON_DATA', msg.data);
  }
  if (msg.type === "GET_RECON_DATA") {
    if (lastReconData) {
      debugLog('Sending RECON_DATA to popup', lastReconData);
      sendResponse(lastReconData);
    } else {
      debugLog('No RECON_DATA available for GET_RECON_DATA');
      sendResponse(null);
    }
  }
  return true;
});
