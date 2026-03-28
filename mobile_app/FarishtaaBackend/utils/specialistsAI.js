import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey : "AIzaSyD8YluMKhrb3mADhrHmoV9hq_adUU0-ucI"});


export const detectSpecialistsFromAI=async (name)=>{
try{
   const result=await generateContent(name);
   console.log(result.text());
  
}catch(error){
console.log(error);
}
}




export async function generateContent(name) {
const prompt=`
You are a medical classification system.

From the hospital or clinic name below, identify which specialists are likely available.

ONLY return a JSON array.
DO NOT explain.
DO NOT add text.

Allowed specialists:
- cardiologist
- dermatologist
- ent
- endocrinologist
- general_physician
- gynecologist
- neurologist
- orthopedic
- pediatrician
- psychiatrist

Hospital name:
"${name}"
`;
  const result = await ai.models.generateContent({
    model : 'gemini-2.5-flash',
   contents : prompt,
  });
const text=result.text.trim();
if(Array.isArray(text) && text.length > 0)
    return text;
return ["general_physician"];
}
