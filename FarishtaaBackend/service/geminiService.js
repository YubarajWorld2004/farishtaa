const {GoogleGenAI} = require("@google/genai");

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const GENERATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const normalizeLanguage = (language) => {
  const normalized = String(language || '').trim().toLowerCase();
  const map = {
    en: 'English',
    english: 'English',
    hi: 'Hindi',
    hindi: 'Hindi',
    or: 'Odia',
    od: 'Odia',
    odia: 'Odia',
    oriya: 'Odia',
  };

  return map[normalized] || (normalized ? language : 'English');
};

const fallbackSymptomReply = (language) => {
  const normalized = String(language || '').trim().toLowerCase();

  if (normalized === 'hi' || normalized === 'hindi') {
    return [
      'Maaf kijiye, is samay AI symptom checker asthayi roop se upalabdh nahin hai.',
      'Aap apne lakshan dobara bhejein, ya turant doctor se paramarsh karein.',
      'Yadi tez chhati dard, saans lene mein dikkat, behoshi, zyada bleeding, ya tez bukhar hai to turant emergency care lein.',
    ].join(' ');
  }

  if (
    normalized === 'or' ||
    normalized === 'od' ||
    normalized === 'odia' ||
    normalized === 'oriya'
  ) {
    return [
      'Kshama karantu, bartaman AI symptom checker samayik bhabe upalabdha nuhen.',
      'Dayakari punithare lakshana pathantu kimba sigra daktaranka saha samparka karantu.',
      'Jadi severe chest pain, breathing difficulty, fainting, heavy bleeding, ba high fever achhi, turanta emergency care neantu.',
    ].join(' ');
  }

  return [
    'Sorry, Farishtaa AI is temporarily unavailable right now.',
    'Please try sending your symptoms again, or consult a doctor directly.',
    'If you have severe chest pain, breathing difficulty, fainting, heavy bleeding, or high fever, seek emergency care immediately.',
  ].join(' ');
};

const createMessagesString = (messages) => {
  return messages.map((message) => `${message.role} : ${message.content}`).join('\n');
};

const shouldTryNextModel = (error) => {
  const statusCode = Number(error?.status ?? error?.code);
  const message = String(error?.message || '').toLowerCase();

  if (statusCode === 429 || statusCode === 404 || statusCode === 503) {
    return true;
  }

  return (
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('not found') ||
    message.includes('rate limit')
  );
};

const generateWithModelFailover = async (contents) => {
  let lastError = null;

  for (const model of GENERATE_MODELS) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
      });
    } catch (error) {
      lastError = error;
      console.warn(`geminiService model failed (${model}):`, error?.status ?? error?.code ?? error?.message);
      if (!shouldTryNextModel(error)) {
        break;
      }
    }
  }

  throw lastError || new Error('No Gemini model could generate content');
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
    if (!userPrompt || !String(userPrompt).trim()) {
      return fallbackSymptomReply(language);
    }

    if (!ai) {
      return fallbackSymptomReply(language);
    }

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
      content: `Please respond in ${normalizeLanguage(language)} language.`,
    };

    const finalMessages = [systemPrompt, ...recentChat, newPrompt, languageToFollow];
    const newMessageList = createMessagesString(finalMessages);

    const result = await generateWithModelFailover(newMessageList);

    const text = result?.text ?? (typeof result === 'string' ? result : '');
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  } catch (err) {
    console.error('geminiService.generateContent error:', err);
    return fallbackSymptomReply(language);
  }
}

module.exports = { generateContent };


