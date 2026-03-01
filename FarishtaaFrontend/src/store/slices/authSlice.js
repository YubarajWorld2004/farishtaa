import { createSlice } from "@reduxjs/toolkit";


const initialState={
    isLoggedIn : localStorage.getItem("token")? true : false,
    token : localStorage.getItem("token") || null,
    userType : localStorage.getItem("userType") || null,
    userId : localStorage.getItem("userId") || null,
    firstName : localStorage.getItem("firstName") || null
};

const authSlice=createSlice({
    name : 'auth',
    initialState,
    reducers  : {
        
        login : (state,action)=>{
            state.isLoggedIn=true;
            state.token=action.payload.token;
            state.userType=action.payload.userType;
            state.userId=action.payload.userId;
            state.firstName=action.payload.firstName;
            localStorage.setItem("token",action.payload.token);
            localStorage.setItem("userType",action.payload.userType);
            localStorage.setItem("userId",action.payload.userId);
            localStorage.setItem("firstName",action.payload.firstName);
        },
            logout : (state,action)=>{
            state.isLoggedIn=false;
            state.token=null;
            state.userType=null;
            state.userId=null;
            state.firstName=null;
            localStorage.removeItem("token");
            localStorage.removeItem("userType");
            localStorage.removeItem('userId');
            localStorage.removeItem('firstName');
        },
        }
    
});
export const {login,logout}=authSlice.actions;
const authReducer = authSlice.reducer;
export default authReducer;
