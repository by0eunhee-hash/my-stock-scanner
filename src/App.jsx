import React, { useState, useEffect } from "react";

function App() {
  const [conditions, setConditions] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [sentiment, setSentiment] = useState(50);
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("전체");

  useEffect(() => {
    fetch("http://localhost:4000/condition-list")
      .then((res) => res.json())
      .then((data) => setConditions(data));
  }, []);

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
      console.error(e);
    }
    setLoading(false);
  };

  // 💡 [해결] 탭 정렬 로직을 return문 밖으로 뺐습니다.
  const rawCategories = [...new Set(stocks.map((s) => s.category || "기타"))];
  const categories = [
    "전체",
    ...rawCategories.filter((c) => c !== "전체" && c !== "기타").sort(),
    "기타",
  ];

  const filteredStocks = stocks
    .filter(
      (s) => selectedCategory === "전체" || s.category === selectedCategory
    )
    .sort((a, b) => parseFloat(b.chrate) - parseFloat(a.chrate));

  const getSInfo = (s) => {
    if (s > 70) return { label: "Greed", color: "#2ecc71" };
    if (s < 30) return { label: "Fear", color: "#e74c3c" };
    return { label: "Neutral", color: "#f1c40f" };
  };

  return (
    <div style={styles.container}>
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "900", color: "#2c3e50" }}>
          🛡️ STOCK WATCHER
        </h1>
      </header>

      {selectedName && (
        <div style={styles.sentimentCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span style={{ fontWeight: "bold" }}>Market Sentiment Index</span>
            <span
              style={{ color: getSInfo(sentiment).color, fontWeight: "bold" }}
            >
              {getSInfo(sentiment).label}
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

      {/* 💡 탭 렌더링 부분: 이미 밖에서 계산된 categories를 사용합니다. */}
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

      <div style={styles.grid}>
        {filteredStocks.map((s, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.categoryBadge}>{s.category}</div>
            <div
              style={{ fontSize: "18px", fontWeight: "bold", margin: "10px 0" }}
            >
              {s.name}
            </div>
            <div style={{ fontSize: "22px", fontWeight: "900" }}>
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
  sentimentCard: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "25px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  gaugeOuter: {
    width: "100%",
    height: "12px",
    backgroundColor: "#eee",
    borderRadius: "6px",
    overflow: "hidden",
  },
  gaugeInner: { height: "100%", transition: "0.5s ease" },
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
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  categoryBadge: { fontSize: "10px", color: "#3498db", fontWeight: "bold" },
};

export default App;
