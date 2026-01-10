// utils/gemini.js
export const analyzeWithGemini = async (
  filteredStocks,
  setGeminiLoading,
  setPopupMessage,
  setShowPopup
) => {
  if (filteredStocks.length === 0) return;

  setGeminiLoading(true);

  const stockNames = filteredStocks.map((s) => s.name).join(", ");

  console.log(stockNames);

  const prompt = `다음 주식 종목들에 대해 오늘 차트를 분석해서 추천 종목 3개를 거래량,오늘 저점, 오늘 고점, 차트 흐름은 표로 예쁘게 만들고 모든 내용은 html형식으로 div가 최상위로 만들어줘. 특수 기호는 넣지마.: ${stockNames}`;
  try {
    const res = await fetch("http://localhost:4000/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    const rawResponse = data.response || "응답을 받지 못했습니다.";

    // ```html ... ``` 제거하고 HTML 추출
    const htmlMatch = rawResponse.match(/```html\s*(.*?)\s*```/s);
    const response = htmlMatch ? htmlMatch[1] : rawResponse;

    setPopupMessage(response);
    setShowPopup(true);
  } catch (e) {
    console.error("Gemini 호출 실패", e);
    setPopupMessage("Gemini 호출에 실패했습니다.");
    setShowPopup(true);
  }
  setGeminiLoading(false);
};
