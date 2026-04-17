import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8081',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;

// Auth
export const login = (email, password) => API.post('/auth/login', { email, password });
export const register = (data) => API.post('/auth/register', data);
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const registerStaff = (data) => API.post('/staff', data);

// Users
export const getUsers = () => API.get('/users');
export const getUser = (id) => API.get(`/users/${id}`);
export const getUsersByRole = (roleName) => API.get(`/users/by-role/${roleName}`);
export const createUser = (data) => API.post('/users', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const changePassword = (id, currentPassword, newPassword) =>
  API.put(`/users/${id}/change-password`, { currentPassword, newPassword });
export const uploadPhoto = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return API.post(`/users/${id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Appointments
export const getAppointments = () => API.get('/appointments');
export const getTodayAppointments = () => API.get('/appointments/today');
export const getAppointmentsByUser = (userId) => API.get(`/appointments/user/${userId}`);
export const getAppointment = (id) => API.get(`/appointments/${id}`);
export const createAppointment = (data) => API.post('/appointments', data);
export const updateAppointment = (id, data) => API.put(`/appointments/${id}`, data);
export const deleteAppointment = (id) => API.delete(`/appointments/${id}`);
export const patchAppointmentStatus = (id, status) => API.patch(`/appointments/${id}/status`, { status });

// Cases
export const getCases = () => API.get('/cases');
export const getCasesByClient = (clientId) => API.get(`/cases/client/${clientId}`);
export const getCase = (id) => API.get(`/cases/${id}`);
export const createCase = (data) => API.post('/cases', data);
export const updateCase = (id, data) => API.put(`/cases/${id}`, data);
export const deleteCase = (id) => API.delete(`/cases/${id}`);
export const patchCaseStatus = (id, status) => API.patch(`/cases/${id}/status`, { status });
export const patchCasePriority = (id, priority) => API.patch(`/cases/${id}/priority`, { priority });

// Trials
export const getTrials = () => API.get('/trials');
export const getTrialsByCase = (caseId) => API.get(`/trials/case/${caseId}`);
export const getTrial = (id) => API.get(`/trials/${id}`);
export const createTrial = (data) => API.post('/trials', data);
export const updateTrial = (id, data) => API.put(`/trials/${id}`, data);
export const deleteTrial = (id) => API.delete(`/trials/${id}`);

// Tasks
export const getTasks = () => API.get('/tasks');
export const getTask = (id) => API.get(`/tasks/${id}`);
export const getTasksByAssignee = (userId) => API.get(`/tasks/assigned-to/${userId}`);
export const getTasksByCreator = (userId) => API.get(`/tasks/created-by/${userId}`);
export const getTasksByStatus = (status) => API.get(`/tasks/status/${status}`);
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// Payments
export const getPayments = () => API.get('/payments');
export const getPayment = (id) => API.get(`/payments/${id}`);
export const getPaymentsByClient = (clientId) => API.get(`/payments/client/${clientId}`);
export const getPaymentsByStatus = (status) => API.get(`/payments/status/${status}`);
export const createPayment = (data) => API.post('/payments', data);
export const updatePayment = (id, data) => API.put(`/payments/${id}`, data);
export const deletePayment = (id) => API.delete(`/payments/${id}`);
export const markPaymentPaid = (id, actor) => API.post(`/payments/${id}/mark-paid`, null, { params: { actor } });
export const getPaymentTimeline = (id) => API.get(`/payments/${id}/timeline`);

// Invoices
export const getInvoices = () => API.get('/invoices');
export const getInvoice = (id) => API.get(`/invoices/${id}`);
export const getInvoicesByClient = (clientId) => API.get(`/invoices/client/${clientId}`);
export const getInvoicesByCase = (caseId) => API.get(`/invoices/case/${caseId}`);
export const createInvoice = (data) => API.post('/invoices', data);
export const updateInvoice = (id, data) => API.put(`/invoices/${id}`, data);
export const deleteInvoice = (id) => API.delete(`/invoices/${id}`);
export const resendInvoiceEmail = (id) => API.post(`/invoices/${id}/send-email`);
export const markInvoicePaid = (id) => API.patch(`/invoices/${id}/mark-paid`);
export const cancelInvoice = (id) => API.patch(`/invoices/${id}/cancel`);
export const downloadInvoicePdf = (id) => API.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
// Invoice lines
export const getInvoiceLines = (invoiceId) => API.get(`/invoices/${invoiceId}/lines`);
export const addInvoiceLine = (invoiceId, data) => API.post(`/invoices/${invoiceId}/lines`, data);
export const updateInvoiceLine = (invoiceId, lineId, data) => API.put(`/invoices/${invoiceId}/lines/${lineId}`, data);
export const deleteInvoiceLine = (invoiceId, lineId) => API.delete(`/invoices/${invoiceId}/lines/${lineId}`);
// Invoice late fees
export const getInvoiceLateFees = (invoiceId) => API.get(`/invoices/${invoiceId}/late-fees`);
export const applyInvoiceLateFee = (invoiceId) => API.post(`/invoices/${invoiceId}/late-fees/apply`);

// ── Trust Account (Séquestre) ─────────────────────────────────────────────
export const getTrustAccount    = (caseId)           => API.get(`/api/cases/${caseId}/trust`);
export const createTrustAccount = (caseId, data)     => API.post(`/api/cases/${caseId}/trust/request`, data);
export const getTrustDeposits   = (caseId)           => API.get(`/api/cases/${caseId}/trust/deposits`);
export const addTrustDeposit    = (caseId, data)     => API.post(`/api/cases/${caseId}/trust/deposits`, data);
export const processRefund      = (caseId, data)     => API.post(`/api/cases/${caseId}/trust/refund`, data);
export const getTrustLedger     = (caseId)           => API.get(`/api/cases/${caseId}/trust/ledger`);
export const getAllTrustAccounts  = (caseId)           => API.get(`/api/cases/${caseId}/trust/all`);

// ── Clôture de dossier ─────────────────────────────────────────────────────
export const getCaseClosePreview = (caseId)            => API.get(`/api/cases/${caseId}/close/preview`);
export const closeCase           = (caseId)            => API.post(`/api/cases/${caseId}/close`);

// ── Invoices par dossier (nouveau système) ─────────────────────────────────
export const createCaseInvoice  = (caseId, data)     => API.post(`/api/cases/${caseId}/invoices`, data);
export const updateCaseInvoice  = (caseId, id, data) => API.put(`/api/cases/${caseId}/invoices/${id}`, data);
export const issueInvoice       = (caseId, id)       => API.patch(`/api/cases/${caseId}/invoices/${id}/issue`);
export const voidCaseInvoice    = (caseId, id)       => API.patch(`/api/cases/${caseId}/invoices/${id}/void`);
export const deleteCaseInvoice  = (caseId, id)       => API.delete(`/api/cases/${caseId}/invoices/${id}`);
export const allocateFromTrust  = (caseId, id, data) => API.post(`/api/cases/${caseId}/invoices/${id}/allocate`, data);

// ── Billing Summary ────────────────────────────────────────────────────────
export const getBillingSummary  = (caseId)           => API.get(`/api/billing/cases/${caseId}/summary`);

// Receipts
export const getReceiptByPayment = (paymentId) => API.get(`/receipts/payment/${paymentId}`);
export const downloadReceiptPdf = (paymentId) => API.get(`/receipts/payment/${paymentId}/pdf`, { responseType: 'blob' });
export const resendReceipt = (paymentId) => API.post(`/receipts/payment/${paymentId}/resend`);

// Reminder Templates
export const getReminderTemplates = () => API.get('/reminders/templates');
export const getReminderTemplate = (id) => API.get(`/reminders/templates/${id}`);
export const createReminderTemplate = (data) => API.post('/reminders/templates', data);
export const updateReminderTemplate = (id, data) => API.put(`/reminders/templates/${id}`, data);
export const deleteReminderTemplate = (id) => API.delete(`/reminders/templates/${id}`);
export const sendManualReminder = (invoiceId, type) => API.post('/reminders/send-manual', null, { params: { invoiceId, type } });

// Client Portal
export const getClientInvoices = (clientId) => API.get(`/client-portal/clients/${clientId}/invoices`);
export const downloadClientInvoicePdf = (clientId, invoiceId) =>
  API.get(`/client-portal/clients/${clientId}/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
export const getClientPayments = (clientId) => API.get(`/client-portal/clients/${clientId}/payments`);
export const getClientReceipt = (clientId, paymentId) => API.get(`/client-portal/clients/${clientId}/payments/${paymentId}/receipt`);
export const downloadClientReceiptPdf = (clientId, paymentId) =>
  API.get(`/client-portal/clients/${clientId}/payments/${paymentId}/receipt/pdf`, { responseType: 'blob' });

// Phone Calls
export const getPhoneCalls = () => API.get('/phone-calls');
export const getPhoneCall = (id) => API.get(`/phone-calls/${id}`);
export const createPhoneCall = (data) => API.post('/phone-calls', data);
export const updatePhoneCall = (id, data) => API.put(`/phone-calls/${id}`, data);
export const deletePhoneCall = (id) => API.delete(`/phone-calls/${id}`);

// Journal de présence
export const getPresenceJournals = () => API.get('/presence-journals');
export const createPresenceJournal = (data) => API.post('/presence-journals', data);
export const deletePresenceJournal = (id) => API.delete(`/presence-journals/${id}`);

// Documents
export const getDocuments = () => API.get('/documents');
export const getDocumentsByUser = (userId) => API.get(`/documents/user/${userId}`);
export const getDocumentsByCase = (caseId) => API.get(`/documents/case/${caseId}`);
export const getDocumentsByTask = (taskId) => API.get(`/documents/task/${taskId}`);
export const getDocument = (id) => API.get(`/documents/${id}`);
export const createDocument = (data) => API.post('/documents', data);
export const uploadDocument = (formData) => API.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadDocument = (id) => API.get(`/documents/${id}/download`, { responseType: 'blob' });
export const updateDocument = (id, data) => API.put(`/documents/${id}`, data);
export const deleteDocument = (id) => API.delete(`/documents/${id}`);
// IA : Résumé d'un document via Ollama Mistral local (peut prendre 30–120 secondes ou plus si très long)
export const summarizeDocument = (id) => API.get(`/documents/${id}/summarize`, { timeout: 300000 });

// Messages
export const getMessages = () => API.get('/messages');
export const getMessage = (id) => API.get(`/messages/${id}`);
export const createMessage = (data) => API.post('/messages', data);
export const updateMessage = (id, data) => API.put(`/messages/${id}`, data);
export const deleteMessage = (id) => API.delete(`/messages/${id}`);
export const sendMessage = (senderId, receiverId, content) =>
  API.post('/messages/send', { sender_id: senderId, receiver_id: receiverId, content });
export const getConversation = (userId, contactId) =>
  API.get(`/messages/conversation?user1=${userId}&user2=${contactId}`);
export const getMessageContacts = (userId) => API.get(`/messages/contacts/${userId}`);

// Lawyers
export const getLawyers = () => API.get('/lawyers');
export const getLawyer = (id) => API.get(`/lawyers/${id}`);
export const getLawyerByUser = (userId) => API.get(`/lawyers/user/${userId}`);
export const createLawyer = (data) => API.post('/lawyers', data);
export const updateLawyer = (id, data) => API.put(`/lawyers/${id}`, data);
export const deleteLawyer = (id) => API.delete(`/lawyers/${id}`);

// Case Notes
export const getCaseNotes = () => API.get('/case-notes');

// Slots (Créneaux agenda)
export const getSlots = (avocatId) => API.get('/api/slots', { params: { avocatId } });
export const createSlot = (data) => API.post('/api/slots', data);
export const updateSlot = (id, data) => API.put(`/api/slots/${id}`, data);
export const deleteSlot = (id) => API.delete(`/api/slots/${id}`);
export const getCaseNote = (id) => API.get(`/case-notes/${id}`);
export const createCaseNote = (data) => API.post('/case-notes', data);
export const updateCaseNote = (id, data) => API.put(`/case-notes/${id}`, data);
export const deleteCaseNote = (id) => API.delete(`/case-notes/${id}`);

// Tribunals
export const getTribunals = () => API.get('/tribunals');
export const createTribunal = (data) => API.post('/tribunals', data);
export const updateTribunal = (id, data) => API.put(`/tribunals/${id}`, data);
export const deleteTribunal = (id) => API.delete(`/tribunals/${id}`);
export const patchCaseTribunalInfo = (id, data) => API.patch(`/cases/${id}/tribunal-info`, data);

// Audiences
export const getAudiences = () => API.get('/audiences');
export const getAudiencesByCase = (caseId) => API.get(`/audiences/case/${caseId}`);
export const getAudience = (id) => API.get(`/audiences/${id}`);
export const createAudience = (data) => API.post('/audiences', data);
export const patchAudienceStatus = (id, body) => API.patch(`/audiences/${id}/status`, typeof body === 'string' ? { status: body } : body);
export const deleteAudience = (id) => API.delete(`/audiences/${id}`);

// Provisions
export const getProvisionsByCase = (caseId) => API.get(`/provisions/case/${caseId}`);
export const getProvisionsByClient = (clientId) => API.get(`/provisions/client/${clientId}`);
export const createProvision = (data) => API.post('/provisions', data);
export const markProvisionReceived = (id, receivedDate) => API.put(`/provisions/${id}/mark-received`, { receivedDate });
export const refundProvision = (id) => API.put(`/provisions/${id}/refund`);
export const deleteProvision = (id) => API.delete(`/provisions/${id}`);

// Timesheets
export const getTimesheetsByCase = (caseId) => API.get(`/timesheets/case/${caseId}`);
export const getTimesheetInvoiceLines = (caseId) => API.get(`/timesheets/case/${caseId}/invoice-lines`);
export const createTimesheet = (data) => API.post('/timesheets', data);
export const updateTimesheet = (id, data) => API.put(`/timesheets/${id}`, data);
export const deleteTimesheet = (id) => API.delete(`/timesheets/${id}`);
