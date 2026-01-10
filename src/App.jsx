import React, { useState, useEffect } from "react";

function App() {
  const [conditions, setConditions] = useState([]); // 조건식 목록
  const [stocks, setStocks] = useState([]); // 검색된 종목들
  const [selectedName, setSelectedName] = useState(""); // 현재 선택된 조건명
  const [loading, setLoading] = useState(false);

  const [sortBy, setSortBy] = useState("chrate"); // 정렬 기준
  const [selectedCategory, setSelectedCategory] = useState("전체"); // 업종 필터

  // 1. 페이지 로드 시 조건 목록 가져오기
  useEffect(() => {
    fetch("http://localhost:4000/condition-list")
      .then((res) => res.json())
      .then((data) => setConditions(data))
      .catch((err) => console.error("목록 로드 실패"));
  }, []);

  // 2. 조건 클릭 시 종목 데이터 요청
  const fetchStocks = async (seq, name) => {
    setLoading(true);
    setSelectedName(name);
    setSelectedCategory("전체"); // 새로운 조건 클릭 시 필터 초기화
    try {
      const res = await fetch(`http://localhost:4000/condition-stocks/${seq}`);
      const data = await res.json();
      setStocks(data);
    } catch (e) {
      console.error("종목 로드 실패");
    }
    setLoading(false);
  };

  // 3. 업종 리스트 추출 (데이터에서 중복 제거하여 자동 생성)
  const rawCategories = [...new Set(stocks.map((s) => s.category))];
  const categories = [
    "전체",
    ...rawCategories.filter((c) => c !== "전체").sort(),
  ];

  // 필터링 및 정렬
  const processedStocks = stocks
    .filter(
      (s) => selectedCategory === "전체" || s.category === selectedCategory
    )
    .sort((a, b) => {
      if (sortBy === "chrate")
        return parseFloat(b.chrate) - parseFloat(a.chrate);
      return 0; // 등락률순 기본 정렬
    });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🛡️ REAL-TIME WATCHER</h1>
        <div style={styles.filterBar}>
          <span style={styles.filterLabel}>정렬:</span>
          {["name", "chrate", "volume"].map((type) => (
            <button
              key={type}
              onClick={() => setSortBy(type)}
              style={{
                ...styles.filterBtn,
                color: sortBy === type ? "#3498db" : "#95a5a6",
              }}
            >
              {type === "name"
                ? "이름순"
                : type === "chrate"
                ? "등락률순"
                : "거래량순"}
            </button>
          ))}
        </div>
      </header>

      {/* 조건식 버튼 목록 */}
      <div style={styles.buttonGrid}>
        {conditions.map((c) => (
          <button
            key={c.id}
            onClick={() => fetchStocks(c.id, c.name)}
            style={{
              ...styles.condBtn,
              border:
                selectedName === c.name
                  ? "2px solid #3498db"
                  : "1px solid #ddd",
            }}
          >
            <div style={styles.groupText}>{c.group}</div>
            <div style={styles.nameText}>{c.name}</div>
          </button>
        ))}
      </div>

      <hr style={styles.divider} />

      {/* 💡 업종별 탭 메뉴 */}
      {stocks.length > 0 && (
        <div style={styles.tabContainer}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...styles.tabBtn,
                backgroundColor:
                  selectedCategory === cat ? "#3498db" : "transparent",
                color: selectedCategory === cat ? "#fff" : "#7f8c8d",
                border:
                  selectedCategory === cat
                    ? "1px solid #3498db"
                    : "1px solid #ddd",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <h2 style={styles.subTitle}>
        {selectedName
          ? `🎯 ${selectedName} (${processedStocks.length}개)`
          : "조건을 선택해주세요"}
      </h2>

      {/* 종목 카드 그리드 */}
      <div style={styles.grid}>
        {processedStocks.map((s, idx) => {
          const rate = parseFloat(s.chrate || 0);
          const isUp = rate > 0;
          return (
            <div key={idx} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.categoryBadge}>{s.category || "기타"}</span>
                <span style={styles.codeLabel}>{s.code}</span>
              </div>
              <div style={styles.stockName}>{s.name}</div>
              <div style={styles.priceStyle}>
                {parseInt(s.price || 0).toLocaleString()}원
              </div>
              <div
                style={{
                  ...styles.changeStyle,
                  color: isUp ? "#ff4d4d" : "#4d94ff",
                }}
              >
                {isUp ? "▲" : "▼"} {Math.abs(rate).toFixed(2)}%
              </div>
              <div style={styles.volStyle}>
                거래량: {parseInt(s.volume || 0).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
    fontFamily: "Pretendard, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  logo: { fontSize: "1.5rem", fontWeight: "900", color: "#2c3e50" },
  filterBar: { display: "flex", gap: "10px" },
  filterBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  buttonGrid: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  condBtn: {
    padding: "10px 18px",
    borderRadius: "12px",
    backgroundColor: "#fff",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
  },
  groupText: { fontSize: "10px", color: "#95a5a6" },
  nameText: { fontSize: "14px", fontWeight: "bold", color: "#34495e" },
  divider: { border: "0.5px solid #eee", margin: "20px 0" },
  tabContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
    overflowX: "auto",
    paddingBottom: "5px",
  },
  tabBtn: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "0.2s",
    whiteSpace: "nowrap",
  },
  subTitle: {
    fontSize: "16px",
    marginBottom: "20px",
    color: "#7f8c8d",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "15px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "15px",
    padding: "18px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #f1f1f1",
    position: "relative",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  categoryBadge: {
    backgroundColor: "#e8f4fd",
    color: "#3498db",
    padding: "3px 8px",
    borderRadius: "5px",
    fontSize: "10px",
    fontWeight: "bold",
  },
  codeLabel: { fontSize: "11px", color: "#bdc3c7" },
  stockName: {
    fontSize: "17px",
    fontWeight: "900",
    color: "#2c3e50",
    marginBottom: "8px",
  },
  priceStyle: { fontSize: "22px", fontWeight: "900", color: "#2c3e50" },
  changeStyle: { fontSize: "15px", fontWeight: "bold", margin: "5px 0 10px 0" },
  volStyle: {
    fontSize: "12px",
    color: "#95a5a6",
    borderTop: "1px solid #f9f9f9",
    paddingTop: "8px",
  },
};

export default App;
