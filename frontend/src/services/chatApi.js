import API from '../api';

export const sendMessage = (message, sessionId) =>
    API.post('/api/chat', { message, sessionId });

export const getHistory = (sessionId) =>
    API.get('/api/chat/history', { params: { sessionId } });

export const deleteHistory = (sessionId) =>
    API.delete('/api/chat/history', { params: { sessionId } });

export const createNewSession = () =>
    API.post('/api/chat/new-session');

export const getSessions = () =>
    API.get('/api/chat/sessions');
