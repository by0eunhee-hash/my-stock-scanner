import React, { useState, useEffect } from "react";

function App() {
  // 1. 상태 관리 정의
  const [conditions, setConditions] = useState([]); // 조건식 목록
  const [stocks, setStocks] = useState([]); // 종목 데이터
  const [sentiment, setSentiment] = useState(50); // 공포-탐욕 지수
  const [selectedName, setSelectedName] = useState(""); // 선택된 조건명
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState("chrate"); // 정렬 상태 추가

  // AI 관련 상태
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // 2. 초기 데이터 로드 (조건식 목록)
  useEffect(() => {
    fetch("http://localhost:4000/condition-list")
      .then((res) => res.json())
      .then((data) => setConditions(data))
      .catch((err) => console.error("목록 로드 실패:", err));
  }, []);

  // 3. 조건 클릭 시 종목 데이터 가져오기
  const fetchStocks = async (seq, name) => {
    setLoading(true);
    setSelectedName(name);
    setSelectedCategory("전체");
    try {
      const res = await fetch(`http://localhost:4000/condition-stocks/${seq}`);
      const data = await res.json();
      setStocks(data.stocks || []);
      setSentiment(data.sentiment || 50);
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    }
    setLoading(false);
  };

  // Gemini 분석 요청
  const analyzeWithGemini = async () => {
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

  // 5. 탭 정렬 로직: [전체] -> [가나다순] -> [기타]
  const rawCategories = [...new Set(stocks.map((s) => s.category || "기타"))];
  const categories = [
    "전체",
    ...rawCategories.filter((c) => c !== "전체" && c !== "기타").sort(),
    "기타",
  ];

  // 6. 필터링 및 정렬 로직
  const filteredStocks = stocks
    .filter(
      (s) => selectedCategory === "전체" || s.category === selectedCategory
    )
    .sort((a, b) => {
      if (sortBy === "chrate")
        return parseFloat(b.chrate) - parseFloat(a.chrate);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const getSInfo = (s) => {
    if (s > 70) return { label: "Greed", color: "#2ecc71" };
    if (s < 30) return { label: "Fear", color: "#e74c3c" };
    return { label: "Neutral", color: "#f1c40f" };
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🛡️ STOCK SENTINEL</h1>
        <div style={styles.filterBar}>
          {["chrate", "name"].map((type) => (
            <button
              key={type}
              onClick={() => setSortBy(type)}
              style={{
                ...styles.filterBtn,
                color: sortBy === type ? "#2c3e50" : "#95a5a6",
              }}
            >
              {type === "chrate" ? "등락률순" : "이름순"}
            </button>
          ))}
          {stocks.length > 0 && (
            <button
              onClick={analyzeWithGemini}
              disabled={geminiLoading}
              style={{
                ...styles.geminiBtn,
                backgroundColor: geminiLoading ? "#ccc" : "#28a745",
              }}
            >
              {geminiLoading ? "분석 중..." : "🤖 Gemini 분석"}
            </button>
          )}
        </div>
      </header>

      {/* 시장 심리 게이지 */}
      {selectedName && (
        <div style={styles.sentimentCard}>
          <div style={styles.sentHeader}>
            <span style={{ fontWeight: "bold" }}>Market Sentiment Index</span>
            <span
              style={{ color: getSInfo(sentiment).color, fontWeight: "bold" }}
            >
              {getSInfo(sentiment).label} ({sentiment}pt)
            </span>
          </div>
          <div style={styles.gaugeOuter}>
            <div
              style={{
                ...styles.gaugeInner,
                width: `${sentiment}%`,
                backgroundColor: getSInfo(sentiment).color,
              }}
            />
          </div>
        </div>
      )}

      {/* 조건 버튼 그리드 */}
      <div style={styles.buttonGrid}>
        {conditions.map((c) => (
          <button
            key={c.id}
            onClick={() => fetchStocks(c.id, c.name)}
            style={{
              ...styles.condBtn,
              border:
                selectedName === c.name
                  ? "2px solid #2c3e50"
                  : "1px solid #ddd",
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 업종 탭 */}
      <div style={styles.tabContainer}>
        {stocks.length > 0 &&
          categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...styles.tabBtn,
                backgroundColor: selectedCategory === cat ? "#2c3e50" : "#fff",
                color: selectedCategory === cat ? "#fff" : "#7f8c8d",
              }}
            >
              {cat}
            </button>
          ))}
      </div>

      {/* 종목 카드 그리드 */}
      <div style={styles.grid}>
        {filteredStocks.map((s, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.categoryBadge}>{s.category}</div>
            <div style={styles.stockName}>{s.name}</div>
            <div style={styles.price}>
              {parseInt(s.price).toLocaleString()}원
            </div>
            <div
              style={{
                color: parseFloat(s.chrate) > 0 ? "#e74c3c" : "#3498db",
                fontWeight: "bold",
                marginTop: "5px",
              }}
            >
              {parseFloat(s.chrate) > 0 ? "▲" : "▼"}{" "}
              {Math.abs(s.chrate).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {/* 🤖 AI 분석 결과 팝업 */}
      {showPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupContent}>
            <h3 style={{ marginTop: 0 }}>🤖 AI 시장 분석</h3>
            <div
              style={styles.popupText}
              dangerouslySetInnerHTML={{ __html: popupMessage }}
            />
            <button onClick={() => setShowPopup(false)} style={styles.closeBtn}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  logo: { fontSize: "1.5rem", fontWeight: "900", color: "#2c3e50" },
  filterBar: { display: "flex", alignItems: "center", gap: "10px" },
  filterBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  sentimentCard: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "25px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  sentHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  gaugeOuter: {
    width: "100%",
    height: "12px",
    backgroundColor: "#eee",
    borderRadius: "6px",
    overflow: "hidden",
  },
  gaugeInner: { height: "100%", transition: "0.5s ease" },
  geminiBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
  buttonGrid: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "25px",
    justifyContent: "center",
  },
  condBtn: {
    padding: "10px 20px",
    borderRadius: "20px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
  tabContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
    overflowX: "auto",
    paddingBottom: "5px",
  },
  tabBtn: {
    padding: "6px 15px",
    borderRadius: "10px",
    fontSize: "12px",
    cursor: "pointer",
    border: "1px solid #ddd",
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  stockName: { fontSize: "18px", fontWeight: "bold", margin: "10px 0" },
  price: { fontSize: "22px", fontWeight: "900" },
  categoryBadge: { fontSize: "10px", color: "#3498db", fontWeight: "bold" },
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  popupContent: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "20px",
    maxWidth: "85%",
    width: "90%",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  popupText: {
    lineHeight: "1.6",
    fontSize: "14px",
    color: "#34495e",
    marginBottom: "20px",
    maxHeight: "500px",
    overflowY: "auto",
    border: "1px solid #ddd",
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#f9f9f9",
  },
  closeBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#2c3e50",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default App;
