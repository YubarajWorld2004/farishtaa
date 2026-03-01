import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import patientReducer from "./slices/patientSlice";
import reviewReducer from "./slices/reviewSlice";
import languageReducer from "./slices/languageSlice";
import themeReducer from "./slices/themeSlice";
const store=configureStore({
    reducer :{
        auth : authReducer,
        patient : patientReducer,
        review : reviewReducer,
        language : languageReducer,
        theme : themeReducer,
    }
});
export default store;