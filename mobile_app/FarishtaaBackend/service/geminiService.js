const {GoogleGenAI} = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const createMessagesString = (messages) => {
  return messages.map((message) => `${message.role} : ${message.content}`).join('\n');
};

const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are a medical symptom checker assistant called "Farishtaa AI". 
Do not hallucinate. 
Rules : 
1.Extract symptoms accurately
2. Ask MAX 2 followup questions only if needed or recommend some home remedy if not a big issue.
3. Track severity based on symptoms and answers.

5.Do not ask more than 2 questions and give your final verdict which specialist should he/she visit 

You can also refer to the last 3–5 messages in chat_history for natural conversation flow only if needed .
You will recommend categories like this 
    "Cardiologist",
        "Dermatologist",
        "ENT Specialist",
        "Endocrinologist",
        "General Physician",
        "General Practitioner",
        "Gynecologist",
        "Neurologist",
        "Orthopedic Surgeon",
        "Pediatrician",
        "Psychiatrist"   or other if any 
5. Do not hallucinate . DO NOT ask extra questions
`
};

function buildSystemPrompt(userContext) {
  if (!userContext) return SYSTEM_PROMPT;
  
  const details = [];
  if (userContext.firstName) details.push(`Name: ${userContext.firstName} ${userContext.lastName || ''}`.trim());
  if (userContext.age) details.push(`Age: ${userContext.age} years old`);
  if (userContext.gender) details.push(`Gender: ${userContext.gender}`);
  
  if (details.length === 0) return SYSTEM_PROMPT;
  
  return {
    role: 'system',
    content: `${SYSTEM_PROMPT.content}

--- PATIENT CONTEXT ---
The patient you are talking to has the following details:
${details.join('\n')}

Use their name naturally in conversation to make it more personal (e.g. greet them by name).
Consider their age and gender when assessing symptoms and recommendations.
For example, if the patient is a child, adjust your language accordingly.
If the patient is elderly, consider age-related conditions.
If female, consider gender-specific conditions when relevant.
--- END PATIENT CONTEXT ---`
  };
}

async function generateContent(language, userPrompt, messages = [], userContext = null) {
  try {
    const systemPrompt = buildSystemPrompt(userContext);
    const recentChat = messages.map((m) => ({
      role: m.role === 'patient' ? 'user' : 'assistant',
      content: m.content,
    }));

    const newPrompt = {
      role: 'user',
      content: userPrompt,
    };

    const languageToFollow = {
      role: 'user',
      content: `Please respond in ${language} language.`,
    };

    const finalMessages = [systemPrompt, ...recentChat, newPrompt, languageToFollow];
    const newMessageList = createMessagesString(finalMessages);

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: newMessageList,
    });

    const text = result?.text ?? (typeof result === 'string' ? result : '');
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  } catch (err) {
    console.error('geminiService.generateContent error:', err);
    throw err;
  }
}

module.exports = { generateContent };


