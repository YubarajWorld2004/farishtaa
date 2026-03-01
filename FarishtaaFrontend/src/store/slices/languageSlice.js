import { createSlice } from "@reduxjs/toolkit";
import i18n from "../../i18n/i18n.js";

const initialState={
    language : localStorage.getItem("language") || "en",
};
const languageSlice=createSlice({
    name : 'language',
    initialState,
    reducers  : {
        setLanguage : (state,action)=>{
            state.language=action.payload;
            localStorage.setItem("language", action.payload);
            i18n.changeLanguage(action.payload);
        }
}
});
export const {setLanguage}=languageSlice.actions;
const languageReducer = languageSlice.reducer;
export default languageReducer;