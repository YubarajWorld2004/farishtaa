import { createSlice } from "@reduxjs/toolkit"
import { act } from "react";

const initialState={
    reviews : []
}

const reviewSlice=createSlice({
    name : 'review',
    initialState,
    reducers : {
        setReviews : (state , action)=>{
       state.reviews=action.payload;
        },
        addReview : (state,action)=>{
        state.reviews.unshift(action.payload);
        },
       
        clearReview : (state,action)=>{
       state.reviews=[];
        }
    }
});
export const {addReview,setReviews,clearReview}=reviewSlice.actions;
const reviewReducer=reviewSlice.reducer;
export default reviewReducer; 