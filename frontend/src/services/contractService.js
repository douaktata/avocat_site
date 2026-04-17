import API from '../api';

const BASE = 'http://localhost:8081';

// ── Template CRUD ─────────────────────────────────────────────────────────────
export const getContractTemplates   = ()       => API.get('/api/contract-templates');
export const getContractTemplate    = (id)     => API.get(`/api/contract-templates/${id}`);
export const createContractTemplate = (data)   => API.post('/api/contract-templates', data);
export const updateContractTemplate = (id, d)  => API.put(`/api/contract-templates/${id}`, d);
export const deleteContractTemplate = (id)     => API.delete(`/api/contract-templates/${id}`);

// ── History (authenticated user) ──────────────────────────────────────────────
export const getHistory       = ()   => API.get('/api/contracts/history');
export const getHistoryItem   = (id) => API.get(`/api/contracts/history/${id}`);
export const deleteHistoryItem = (id) => API.delete(`/api/contracts/history/${id}`);
export const getHistoryCount  = ()   => API.get('/api/contracts/history/count');

// Legacy — kept for backward compatibility
export const getContractHistoryByUser = (userId) => API.get(`/api/contracts/history/user/${userId}`);
export const getContractHistoryByCase = (caseId) => API.get(`/api/contracts/history/case/${caseId}`);

// ── Streaming generation (SSE over fetch) ─────────────────────────────────────
export function streamContract({ templateId, formData, caseId = null }, onToken, onDone, onError) {
  const token      = localStorage.getItem('token');
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${BASE}/api/contracts/generate`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept':        'text/event-stream',
        },
        body: JSON.stringify({ templateId, formData, caseId }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) { onDone(); break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          // Do NOT trim: leading spaces are part of the token (e.g. " EN" → space before "EN")
          // Only strip the mandatory "data:" prefix (5 chars); Spring SseEmitter adds no extra space
          const raw = line.slice(5);
          if (raw === '[DONE]') { onDone(); return; }
          if (raw) onToken(raw);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError(err);
    }
  })();

  return () => controller.abort();
}

// ── PDF export ────────────────────────────────────────────────────────────────
export async function exportContractPDF(label, typeContrat, content) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE}/api/contracts/export-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ label, typeContrat, content }),
  });

  if (!response.ok) {
    throw new Error(`Erreur PDF ${response.status}`);
  }

  const blob     = await response.blob();
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  const safeName = sanitizeFilename(label);

  anchor.href     = url;
  anchor.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── .txt download (client-side, no backend call) ──────────────────────────────
export function downloadTxt(label, content) {
  const safeName = sanitizeFilename(label);
  const blob     = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  anchor.href     = url;
  anchor.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function sanitizeFilename(label) {
  return label
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-zA-Z0-9\s_-]/g, '')
    .trim()
    .replaceAll(/\s+/g, '_')
    .toLowerCase();
}
