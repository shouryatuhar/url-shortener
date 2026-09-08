// ==========================================================================
// smolurl — Client-side Application Logic
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('shorten-form');
  const longUrlInput = document.getElementById('long-url');
  const customAliasInput = document.getElementById('custom-alias');
  const expiresAtInput = document.getElementById('expires-at');
  const submitBtn = document.getElementById('submit-btn');
  const pasteBtn = document.getElementById('paste-btn');
  const originPrefix = document.getElementById('origin-prefix');

  // Result Elements
  const resultCard = document.getElementById('result-card');
  const shortUrlLink = document.getElementById('short-url-link');
  const copyBtn = document.getElementById('copy-btn');
  const copyText = document.getElementById('copy-text');
  const copyIcon = document.getElementById('copy-icon');
  const visitBtn = document.getElementById('visit-btn');
  const resultLongUrl = document.getElementById('result-long-url');
  const resultClicks = document.getElementById('result-clicks');
  const resultExpiresRow = document.getElementById('result-expires-row');
  const resultExpires = document.getElementById('result-expires');
  const resultQrBox = document.getElementById('result-qr-box');
  const downloadQrBtn = document.getElementById('download-qr-btn');

  // Table Elements
  const linksTableBody = document.getElementById('links-table-body');
  const linksCount = document.getElementById('links-count');
  const refreshStatsBtn = document.getElementById('refresh-stats-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // Modal Elements
  const qrModal = document.getElementById('qr-modal');
  const modalQrUrl = document.getElementById('modal-qr-url');
  const modalQrContainer = document.getElementById('modal-qr-container');
  const modalDownloadBtn = document.getElementById('modal-download-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // Toast Element
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  // Active state
  let currentQrCode = null;
  let modalQrCode = null;
  let activeModalUrl = '';
  let activeModalCode = '';
  let toastTimer = null;

  // Initialize display
  const host = window.location.host;
  if (originPrefix) {
    originPrefix.textContent = host ? `${host}/` : '/';
  }

  // Load history from localStorage
  let history = loadHistory();
  renderHistoryTable();

  // --------------------------------------------------------------------------
  // Form Submission
  // --------------------------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let longUrl = longUrlInput.value.trim();
    if (!longUrl) return;

    // Prepend https:// if user omitted protocol
    if (!/^https?:\/\//i.test(longUrl)) {
      longUrl = 'https://' + longUrl;
      longUrlInput.value = longUrl;
    }

    // Basic URL format validation
    try {
      new URL(longUrl);
    } catch {
      showToast('Please enter a valid URL (e.g. https://example.com)', '⚠️');
      longUrlInput.focus();
      return;
    }

    const customAlias = customAliasInput.value.trim() || undefined;
    if (customAlias && !/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
      showToast('Alias can only contain letters, numbers, hyphens and underscores', '⚠️');
      customAliasInput.focus();
      return;
    }

    const expiresAtRaw = expiresAtInput.value;
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : undefined;

    // Loading State
    setLoading(true);

    try {
      const response = await fetch('/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl, customAlias, expiresAt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      // Success
      displayResult(data);
      saveToHistory(data);
      renderHistoryTable();
      showToast('Short URL generated successfully!', '✨');

      // Clear input fields
      customAliasInput.value = '';
      expiresAtInput.value = '';
      document.getElementById('toggle-options')?.removeAttribute('open');

    } catch (err) {
      showToast(err.message || 'Something went wrong', '⚠️');
    } finally {
      setLoading(false);
    }
  });

  // Shortcut key: Cmd+Enter or Ctrl+Enter to submit
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (document.activeElement === longUrlInput || 
          document.activeElement === customAliasInput || 
          document.activeElement === expiresAtInput) {
        form.requestSubmit();
      }
    }
  });

  // --------------------------------------------------------------------------
  // Paste Button Helper
  // --------------------------------------------------------------------------
  pasteBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          longUrlInput.value = text.trim();
          longUrlInput.focus();
          showToast('Pasted from clipboard!', '📋');
        }
      } else {
        longUrlInput.focus();
      }
    } catch {
      longUrlInput.focus();
    }
  });

  // --------------------------------------------------------------------------
  // Display Result Card
  // --------------------------------------------------------------------------
  function displayResult(data) {
    const origin = window.location.origin;
    const fullShortUrl = `${origin}/${data.short_code}`;

    shortUrlLink.textContent = fullShortUrl;
    shortUrlLink.href = fullShortUrl;
    visitBtn.href = fullShortUrl;
    resultLongUrl.textContent = data.long_url;
    resultLongUrl.title = data.long_url;
    resultClicks.textContent = data.clicks ?? 0;

    if (data.expires_at) {
      resultExpiresRow.style.display = 'flex';
      resultExpires.textContent = new Date(data.expires_at).toLocaleString();
    } else {
      resultExpiresRow.style.display = 'none';
    }

    // Generate QR Code
    resultQrBox.innerHTML = '';
    currentQrCode = new QRCode(resultQrBox, {
      text: fullShortUrl,
      width: 140,
      height: 140,
      colorDark: '#222222',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });

    // Reveal card
    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --------------------------------------------------------------------------
  // Copy to Clipboard
  // --------------------------------------------------------------------------
  copyBtn.addEventListener('click', async () => {
    const textToCopy = shortUrlLink.textContent;
    if (!textToCopy) return;

    await copyTextToClipboard(textToCopy);
    copyText.textContent = 'Copied!';
    copyIcon.textContent = '✓';
    setTimeout(() => {
      copyText.textContent = 'Copy';
      copyIcon.textContent = '📋';
    }, 2000);
  });

  async function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Copied to clipboard!', '✓');
    } catch {
      showToast('Failed to copy', '⚠️');
    }
  }

  // --------------------------------------------------------------------------
  // Download QR Code
  // --------------------------------------------------------------------------
  downloadQrBtn.addEventListener('click', () => {
    if (!currentQrCode) return;
    const canvas = currentQrCode.getCanvas();
    if (canvas) {
      downloadCanvas(canvas, `smolurl-qr.png`);
    }
  });

  function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('QR Code downloaded!', '⬇');
  }

  // --------------------------------------------------------------------------
  // Local History Management
  // --------------------------------------------------------------------------
  function loadHistory() {
    try {
      const stored = localStorage.getItem('smolurl_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveToHistory(item) {
    // Check if short_code already exists
    history = history.filter(i => (i.short_code || i.shortCode) !== item.short_code);
    history.unshift({
      short_code: item.short_code,
      long_url: item.long_url,
      clicks: item.clicks ?? 0,
      created_at: item.created_at || new Date().toISOString(),
      expires_at: item.expires_at || null,
    });
    // Keep top 30
    if (history.length > 30) history = history.slice(0, 30);
    try {
      localStorage.setItem('smolurl_history', JSON.stringify(history));
    } catch (e) {
      console.warn('localStorage save failed', e);
    }
  }

  function renderHistoryTable() {
    linksCount.textContent = history.length;

    if (history.length === 0) {
      linksTableBody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <span class="empty-state-icon">📭</span>
              <span>No shortened links yet. Create your first smol link above!</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const origin = window.location.origin;

    linksTableBody.innerHTML = history.map(item => {
      const code = item.short_code || item.shortCode;
      const fullUrl = `${origin}/${code}`;
      const clicks = item.clicks ?? 0;
      const cleanDest = formatUrlDisplay(item.long_url);

      return `
        <tr data-code="${escapeHtml(code)}">
          <td class="td-short">
            <a href="${escapeHtml(fullUrl)}" target="_blank" rel="noopener noreferrer">/${escapeHtml(code)}</a>
          </td>
          <td class="td-dest" title="${escapeHtml(item.long_url)}">
            ${escapeHtml(cleanDest)}
          </td>
          <td class="td-clicks">
            <span class="click-pill">👁 ${clicks}</span>
          </td>
          <td class="td-actions">
            <button type="button" class="action-icon-btn copy-row-btn" data-url="${escapeHtml(fullUrl)}" title="Copy link">📋</button>
            <button type="button" class="action-icon-btn qr-row-btn" data-url="${escapeHtml(fullUrl)}" data-code="${escapeHtml(code)}" title="Show QR">📱</button>
            <a href="${escapeHtml(fullUrl)}" target="_blank" rel="noopener noreferrer" class="action-icon-btn" style="text-decoration: none; display: inline-block;" title="Open link">↗</a>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row button listeners
    document.querySelectorAll('.copy-row-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        copyTextToClipboard(btn.getAttribute('data-url'));
      });
    });

    document.querySelectorAll('.qr-row-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        const code = btn.getAttribute('data-code');
        openQrModal(url, code);
      });
    });
  }

  // --------------------------------------------------------------------------
  // Refresh Stats Live
  // --------------------------------------------------------------------------
  refreshStatsBtn.addEventListener('click', async () => {
    if (history.length === 0) return;

    refreshStatsBtn.disabled = true;
    refreshStatsBtn.innerHTML = `<span>⏳</span><span>Refreshing...</span>`;

    let updatedCount = 0;

    await Promise.all(history.map(async (item, idx) => {
      const code = item.short_code || item.shortCode;
      try {
        const res = await fetch(`/${code}/stats`);
        if (res.ok) {
          const stats = await res.json();
          history[idx].clicks = stats.clicks;
          updatedCount++;
        }
      } catch (e) {
        // silent fail for individual item
      }
    }));

    try {
      localStorage.setItem('smolurl_history', JSON.stringify(history));
    } catch {}

    renderHistoryTable();
    refreshStatsBtn.disabled = false;
    refreshStatsBtn.innerHTML = `<span>↻</span><span>Refresh stats</span>`;
    showToast(`Updated stats for ${updatedCount} link${updatedCount === 1 ? '' : 's'}`, '✓');
  });

  // --------------------------------------------------------------------------
  // Clear History
  // --------------------------------------------------------------------------
  clearHistoryBtn.addEventListener('click', () => {
    if (history.length === 0) return;
    if (confirm('Clear your local smolurl history?')) {
      history = [];
      localStorage.removeItem('smolurl_history');
      renderHistoryTable();
      showToast('History cleared', '✓');
    }
  });

  // --------------------------------------------------------------------------
  // QR Code Modal
  // --------------------------------------------------------------------------
  function openQrModal(url, code) {
    activeModalUrl = url;
    activeModalCode = code;
    modalQrUrl.textContent = url;
    modalQrContainer.innerHTML = '';

    modalQrCode = new QRCode(modalQrContainer, {
      text: url,
      width: 160,
      height: 160,
      colorDark: '#222222',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });

    qrModal.style.display = 'flex';
  }

  modalCloseBtn.addEventListener('click', () => {
    qrModal.style.display = 'none';
  });

  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) {
      qrModal.style.display = 'none';
    }
  });

  modalDownloadBtn.addEventListener('click', () => {
    if (!modalQrCode) return;
    const canvas = modalQrCode.getCanvas();
    if (canvas) {
      downloadCanvas(canvas, `smolurl-${activeModalCode || 'qr'}.png`);
    }
  });

  // --------------------------------------------------------------------------
  // Toast Notifications
  // --------------------------------------------------------------------------
  function showToast(message, icon = '✓') {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toastIcon.textContent = icon;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      submitBtn.innerHTML = `<span>Shortening...</span>`;
    } else {
      submitBtn.innerHTML = `<span>Shorten link</span><span>→</span>`;
    }
  }

  function formatUrlDisplay(rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      return parsed.hostname + (parsed.pathname === '/' ? '' : parsed.pathname);
    } catch {
      return rawUrl;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
