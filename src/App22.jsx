import React, { useState, useEffect, useRef } from "react";

function App() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const isRequesting = useRef(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#f4f6f8";
    // 1. 서버에서 조건 목록 가져오기
    fetch("http://localhost:4000/condition-list")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setTabs(data);
          setActiveTab(data[0]);
        }
      });
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    const fetchData = async () => {
      if (isRequesting.current) return;
      isRequesting.current = true;
      try {
        const res = await fetch(
          `http://localhost:4000/stocks?seq=${activeTab.id}`
        );
        const data = await res.json();
        // 가이드북 Row 39-43 매핑
        setStocks(
          data.map((s) => ({
            ...s,
            name: s.name,
            price: parseInt(s.price || 0),
            change: parseFloat(s.chgrate || 0),
            volume: parseInt(s.acml_vol || 0),
          }))
        );
      } finally {
        isRequesting.current = false;
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, [activeTab]);

  return (
    <div className="App" style={appContainer}>
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          <h1 style={logoStyle}>📊 PRO SCANNER v3.0</h1>
          <nav style={{ display: "flex", gap: "10px" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t);
                  setStocks([]);
                }}
                style={activeTab?.id === t.id ? actBtn : inactBtn}
              >
                {t.name}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div style={mainLayout}>
        <div style={sidePanel}>
          <div style={typeLabel}>📂 {activeTab?.name || "조회 중"}</div>
          {stocks.length > 0 ? (
            stocks.map((s, i) => (
              <div
                key={i}
                onClick={() => setSelectedStock(s)}
                style={{
                  ...rowStyle,
                  backgroundColor:
                    selectedStock?.name === s.name ? "#eef6ff" : "#fff",
                }}
              >
                <div style={stockNameStyle}>{s.name}</div>
                <div
                  style={{
                    color: s.change > 0 ? "#ff0000" : "#0000ff",
                    fontWeight: "900",
                  }}
                >
                  {s.change > 0 ? `+${s.change}%` : `${s.change}%`}
                </div>
              </div>
            ))
          ) : (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#999" }}
            >
              포착된 종목 없음
            </div>
          )}
        </div>
        <div style={chartArea}>
          {selectedStock ? (
            <div style={chartCard}>
              <h2 style={selectedName}>
                {selectedStock.name} ({selectedStock.price.toLocaleString()}원)
              </h2>
              <div style={chartBoard}>[ 실시간 데이터 수신 완료 ]</div>
            </div>
          ) : (
            <div style={{ margin: "auto", color: "#ccc", fontWeight: "800" }}>
              종목을 선택하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 스타일 가이드 (동일 유지)
const appContainer = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  fontFamily: "Pretendard",
};
const headerStyle = {
  height: "65px",
  padding: "0 25px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#fff",
  borderBottom: "2px solid #eee",
};
const logoStyle = {
  fontSize: "1.2rem",
  fontWeight: "900",
  color: "#1a73e8",
  margin: 0,
};
const mainLayout = { display: "flex", flex: 1, overflow: "hidden" };
const sidePanel = {
  width: "350px",
  overflowY: "auto",
  borderRight: "1px solid #ddd",
  backgroundColor: "#fff",
};
const chartArea = {
  flex: 1,
  backgroundColor: "#f4f6f8",
  padding: "20px",
  display: "flex",
};
const typeLabel = {
  fontSize: "0.8rem",
  fontWeight: "900",
  color: "#000",
  padding: "12px 20px",
  backgroundColor: "#f8f9fa",
};
const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 20px",
  cursor: "pointer",
  borderBottom: "1px solid #f5f5f5",
};
const stockNameStyle = { fontSize: "1rem", fontWeight: "600", color: "#000" };
const chartCard = {
  flex: 1,
  backgroundColor: "#fff",
  borderRadius: "12px",
  padding: "30px",
  border: "1px solid #ddd",
  display: "flex",
  flexDirection: "column",
};
const selectedName = {
  fontSize: "2rem",
  fontWeight: "900",
  margin: 0,
  color: "#000",
};
const chartBoard = {
  flex: 1,
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  fontWeight: "800",
  color: "#ccc",
};
const inactBtn = {
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  padding: "8px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
  color: "#555",
};
const actBtn = {
  ...inactBtn,
  backgroundColor: "#1a73e8",
  color: "#fff",
  borderColor: "#1a73e8",
};

export default App;
