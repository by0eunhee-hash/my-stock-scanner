require("dotenv").config();
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const { handleGeminiRequest } = require("./modules/gemini");

const app = express();
app.use(cors());
app.use(express.json()); // 💡 JSON 파싱을 위해 꼭 필요합니다!

const { KIS_APPKEY, KIS_SECRET, KIS_URL, KIS_USERID } = process.env;
let accessToken = "";

const getAccessToken = async () => {
  try {
    const res = await axios.post(`${KIS_URL}/oauth2/tokenP`, {
      grant_type: "client_credentials",
      appkey: KIS_APPKEY,
      appsecret: KIS_SECRET,
    });
    accessToken = res.data.access_token;
    console.log("✅ [KIS] 인증 성공 & [Gemini] AI 엔진 대기 중");
  } catch (e) {
    console.error("❌ 초기화 실패");
  }
};

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 1. 조건식 목록 조회
app.get("/condition-list", async (req, res) => {
  try {
    const response = await axios.get(
      `${KIS_URL}/uapi/domestic-stock/v1/quotations/psearch-title`,
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${accessToken}`,
          appkey: KIS_APPKEY,
          appsecret: KIS_SECRET,
          tr_id: "HHKST03900300",
          custtype: "P",
        },
        params: { user_id: KIS_USERID },
      }
    );
    res.json(
      (response.data.output2 || []).map((i) => ({
        id: i.seq,
        group: i.grp_nm,
        name: i.condition_nm,
      }))
    );
  } catch (e) {
    res.status(500).json([]);
  }
});

// 2. 종목 검색 + 심리 지수 산출
app.get("/condition-stocks/:seq", async (req, res) => {
  try {
    const response = await axios.get(
      `${KIS_URL}/uapi/domestic-stock/v1/quotations/psearch-result`,
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${accessToken}`,
          appkey: KIS_APPKEY,
          appsecret: KIS_SECRET,
          tr_id: "HHKST03900400",
          custtype: "P",
        },
        params: { user_id: KIS_USERID, seq: req.params.seq },
      }
    );

    const rawStocks = response.data.output2 || [];
    const upRatio =
      (rawStocks.filter((s) => parseFloat(s.chgrate) > 0).length /
        (rawStocks.length || 1)) *
      100;
    let score = Math.max(5, Math.min(95, Math.round(upRatio)));

    const result = rawStocks.map((s) => {
      let category = "기타";
      if (/전자|하이닉스|반도체/.test(s.name)) category = "IT/반도체";
      else if (/에너지|에코프로|배터리/.test(s.name)) category = "2차전지";
      return {
        code: s.code,
        name: s.name,
        price: s.price,
        chrate: s.chgrate,
        category,
      };
    });
    res.json({ stocks: result, sentiment: score });
  } catch (e) {
    res.status(500).json({ stocks: [], sentiment: 50 });
  }
});

app.post("/gemini", handleGeminiRequest);

app.listen(4000, async () => {
  await getAccessToken();
  console.log(`🚀 서버 시작: http://localhost:4000`);
});
