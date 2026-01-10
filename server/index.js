require("dotenv").config();
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json()); // 💡 JSON 파싱을 위해 꼭 필요합니다!

const { KIS_APPKEY, KIS_SECRET, KIS_URL, GEMINI_API_KEY } = process.env;
const KIS_USERID = "ans1059";
let accessToken = "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

// 3. 💡 AI 다중 종목 분석 기능 (프론트엔드와 규격 맞춤)
app.post("/ai-analyze", async (req, res) => {
  try {
    const { stockList } = req.body; // 프론트에서 보낸 리스트 받기
    const prompt = `다음은 현재 급등/검색된 종목 리스트입니다: ${stockList.join(
      ", "
    )}. 
    이 종목들의 전체적인 시장 테마를 분석하고 투자 시 유의점을 짧은 3줄 요약해줘.`;

    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text() });
  } catch (e) {
    res.status(500).json({ analysis: "AI 분석 실패" });
  }
});

app.listen(4000, async () => {
  await getAccessToken();
  console.log(`🚀 서버 시작: http://localhost:4000`);
});
