import React, { useState, useEffect } from "react";

function App() {
  const [conditions, setConditions] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(false);
  // 💡 정렬 상태 추가 (기본값: 등락률순)
  const [sortBy, setSortBy] = useState("chrate");

  useEffect(() => {
    fetch("http://localhost:4000/condition-list")
      .then((res) => res.json())
      .then((data) => setConditions(data))
      .catch((err) => console.error("목록 로드 실패"));
  }, []);

  const fetchStocks = async (seq, name) => {
    setLoading(true);
    setSelectedName(name);
    try {
      const res = await fetch(`http://localhost:4000/condition-stocks/${seq}`);
      const data = await res.json();
      setStocks(data);
    } catch (e) {
      console.error("종목 로드 실패");
    }
    setLoading(false);
  };

  // 💡 실시간 정렬 로직: stocks 데이터가 변하거나 정렬 기준이 바뀔 때 자동 실행
  const sortedStocks = [...stocks].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name); // 이름순 (가나다)
    } else if (sortBy === "chrate") {
      return parseFloat(b.chrate) - parseFloat(a.chrate); // 등락률순 (높은순)
    } else if (sortBy === "volume") {
      return parseInt(b.volume) - parseInt(a.volume); // 거래량순 (많은순)
    }
    return 0;
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🛡️ REAL-TIME WATCHER</h1>
        {/* 💡 정렬 필터 바 추가 */}
        <div style={styles.filterBar}>
          <span style={styles.filterLabel}>정렬 기준:</span>
          <button
            onClick={() => setSortBy("name")}
            style={{
              ...styles.filterBtn,
              color: sortBy === "name" ? "#3498db" : "#95a5a6",
            }}
          >
            이름순
          </button>
          <button
            onClick={() => setSortBy("chrate")}
            style={{
              ...styles.filterBtn,
              color: sortBy === "chrate" ? "#3498db" : "#95a5a6",
            }}
          >
            등락률순
          </button>
          <button
            onClick={() => setSortBy("volume")}
            style={{
              ...styles.filterBtn,
              color: sortBy === "volume" ? "#3498db" : "#95a5a6",
            }}
          >
            거래량순
          </button>
        </div>
      </header>

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

      <h2 style={styles.subTitle}>
        {selectedName
          ? `🎯 ${selectedName} (${stocks.length}개)`
          : "조건을 선택해주세요"}
      </h2>

      <div style={styles.grid}>
        {sortedStocks.map((s, idx) => {
          // 💡 해결 1: 등락률 데이터(s.chrate)가 있는지 확인하고 숫자로 변환
          const rate = parseFloat(s.chrate || 0);
          const isUp = rate > 0;
          const isDown = rate < 0;

          return (
            <div key={idx} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.codeLabel}>{s.code}</span>
                <span style={styles.stockName}>{s.name}</span>
              </div>

              <div style={styles.priceStyle}>
                {parseInt(s.price || 0).toLocaleString()}원
              </div>

              {/* 💡 해결 2: 등락률이 정상적으로 표시되도록 수정 */}
              <div
                style={{
                  ...styles.changeStyle,
                  color: isUp ? "#ff4d4d" : isDown ? "#4d94ff" : "#333",
                }}
              >
                {isUp ? "▲" : isDown ? "▼" : "-"} {Math.abs(rate).toFixed(2)}%
              </div>

              {/* 💡 해결 3: 거래량(s.volume)이 정상적으로 표시되도록 수정 */}
              <div style={styles.volStyle}>
                거래량: {parseInt(s.volume || 0).toLocaleString()} 주
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
    marginBottom: "30px",
    borderBottom: "1px solid #eee",
    paddingBottom: "15px",
  },
  logo: { fontSize: "1.5rem", fontWeight: "900", color: "#2c3e50" },
  filterBar: { display: "flex", gap: "15px", alignItems: "center" },
  filterLabel: { fontSize: "13px", color: "#7f8c8d", fontWeight: "bold" },
  filterBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    padding: "5px",
  },
  buttonGrid: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },
  condBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    backgroundColor: "#fff",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },
  groupText: { fontSize: "11px", color: "#95a5a6" },
  nameText: { fontSize: "15px", fontWeight: "bold", color: "#34495e" },
  subTitle: { fontSize: "18px", marginBottom: "20px", color: "#7f8c8d" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  codeLabel: { fontSize: "12px", color: "#bdc3c7", fontWeight: "bold" },
  stockName: { fontSize: "16px", fontWeight: "900", color: "#2c3e50" },
  priceStyle: {
    fontSize: "24px",
    fontWeight: "900",
    margin: "10px 0",
    color: "#2c3e50",
  },
  changeStyle: { fontSize: "16px", fontWeight: "bold", marginBottom: "10px" },
  volStyle: { fontSize: "13px", color: "#95a5a6" },
};

export default App;
