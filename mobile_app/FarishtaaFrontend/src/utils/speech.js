export const speak = (text, language = "en") => {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported");
    return;
  }

  // Stop previous speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const langMap = {
    en: "en-IN",
    hi: "hi-IN",
    or: "or-IN",
  };

  utterance.lang = langMap[language] || "en-IN";
  utterance.rate = 0.95;   
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
};