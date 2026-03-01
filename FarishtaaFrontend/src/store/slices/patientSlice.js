import { createSlice } from "@reduxjs/toolkit"

const initialState={
    sessions: [],          // list of { _id, title, createdAt, updatedAt }
    activeSessionId: null,  // currently viewed session
    chatHistory:[],
    loading : false,
    error : null,
}

const patientSlice=createSlice({
    name : 'patient',
    initialState,
    reducers : {
        setSessions : (state, action) => {
            state.sessions = action.payload;
        },
        addSession : (state, action) => {
            state.sessions.unshift(action.payload);
        },
        removeSession : (state, action) => {
            state.sessions = state.sessions.filter(s => s._id !== action.payload);
            if (state.activeSessionId === action.payload) {
                state.activeSessionId = null;
                state.chatHistory = [];
            }
        },
        setActiveSession : (state, action) => {
            state.activeSessionId = action.payload;
        },
        updateSessionTitle : (state, action) => {
            const { sessionId, title } = action.payload;
            const session = state.sessions.find(s => s._id === sessionId);
            if (session) session.title = title;
        },
        setChat : (state , action)=>{
            state.chatHistory=action.payload;
        },
        addMessage : (state,action)=>{
            state.chatHistory.push(action.payload);
        },
        setLoading : (state,action)=>{
            state.loading=action.payload;
        },
        setError : (state ,action)=>{
            state.error=action.payload;
        },
        clearChat : (state)=>{
            state.chatHistory=[];
        }
    }
});
export const {
    setSessions,
    addSession,
    removeSession,
    setActiveSession,
    updateSessionTitle,
    addMessage,
    setChat,
    setError,
    setLoading,
    clearChat
} = patientSlice.actions;
const patientReducer=patientSlice.reducer;
export default patientReducer; 