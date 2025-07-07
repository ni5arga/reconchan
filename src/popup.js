function debugLog(...args) {
  try { console.log('[reconchan popup]', ...args); } catch {}
}

debugLog('Popup script loaded');

function showLoading() {
  document.getElementById('results').innerHTML = `
    <div class="section" style="text-align:center;min-height:60px;">
      <div class="reconchan-spinner">
        <div></div><div></div><div></div><div></div>
      </div>
      <div style="margin-top:12px;color:#ffb6f9;font-weight:500;">Loading recon data...</div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  showLoading();
  debugLog('Popup DOMContentLoaded');
  chrome.runtime.sendMessage({ type: "GET_RECON_DATA" }, (data) => {
    debugLog('Received data from background', data);
    if (!data) {
      document.getElementById('results').innerHTML = '<div class="section"><em>No data found. Try refreshing the page or reloading the extension.</em></div>';
      debugLog('No data found in popup');
      return;
    }
    renderReconData(data);
  });
});

function createSection(title, items, renderItem) {
  if (!items || !items.length) return '';
  return `<div class="section"><h2>${title}</h2><ul>${items.map(renderItem || (x => `<li>${x}</li>`)).join('')}</ul></div>`;
}

function createSecretsSection(secrets) {
  if (!secrets || !secrets.length) return '';
  return `<div class="section"><h2>Secrets</h2><ul>${secrets.map(s => `<li><b>${s.type}:</b> <code>${s.value}</code></li>`).join('')}</ul></div>`;
}

function createSuspiciousSection(suspicious) {
  if (!suspicious || !suspicious.length) return '';
  return `<div class="section"><h2>Suspicious JS</h2><ul>${suspicious.map(s => `<li><b>${s.type}</b> (${s.count})</li>`).join('')}</ul></div>`;
}

function renderReconData(data) {
  let html = '';
  html += createSection('Frameworks', data.frameworks);
  html += createSection('CDNs', data.cdns);
  html += createSection('Hosting', data.hosting);
  html += createSection('Analytics', data.analytics);
  html += createSection('Other', data.other);
  html += createSection('JS Files', data.scripts, url => `<li><a href="${url}" target="_blank" rel="noopener">${url}</a></li>`);
  html += createSection('Endpoints', data.endpoints, url => `<li><code>${url}</code></li>`);
  html += createSecretsSection(data.secrets);
  html += createSuspiciousSection(data.suspicious);
  if (!html) html = '<div class="section"><em>No results found.</em></div>';
  document.getElementById('results').innerHTML = html;
}

function renderList(selector, items, renderItem, emptyMsg) {
  const ul = document.querySelector(selector + " ul");
  if (!items || items.length === 0) {
    ul.innerHTML = `<li style='color:#aaa;font-style:italic;'>${emptyMsg}</li>`;
    return;
  }
  ul.innerHTML = items.map(renderItem).join("");
}

function renderSecretItem(s) {
  return `<span>${s.type}: <span class='secret-value'>${s.value}</span></span><button class='copy-btn' data-secret="${encodeURIComponent(s.value)}" title="Copy">Copy</button>`;
}

function renderSuspiciousItem(s) {
  return `<li><span style='color:#c00;font-weight:bold;'>${s.type}</span> <span style='color:#888;'>(count: ${s.count})</span></li>`;
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("copy-btn")) {
    const secret = decodeURIComponent(e.target.getAttribute("data-secret"));
    navigator.clipboard.writeText(secret).then(() => {
      e.target.textContent = "Copied!";
      setTimeout(() => (e.target.textContent = "Copy"), 1200);
    });
  }
});