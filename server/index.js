require("dotenv").config();
const axios = require("axios");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const { KIS_APPKEY, KIS_SECRET, KIS_URL } = process.env;
const KIS_USERID = "ans1059";
let accessToken = "";

const getAccessToken = async () => {
  try {
    const res = await axios.post(`${KIS_URL}/oauth2/tokenP`, {
      grant_type: "client_credentials",
      appkey: KIS_APPKEY,
      appsecret: KIS_SECRET,
    });
    accessToken = res.data.access_token;
    console.log("✅ [KIS] 인증 성공 - 포트폴리오 모드 가동");
  } catch (e) {
    console.error("❌ [KIS] 인증 실패");
  }
};

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

    // 💡 공포-탐욕 지수 산출 (상승 종목 비율 기반)
    const upStocks = rawStocks.filter((s) => parseFloat(s.chgrate) > 0).length;
    const upRatio = (upStocks / (rawStocks.length || 1)) * 100;
    let score = Math.round(upRatio); // 단순 가독성을 위해 상승 비율을 점수화
    score = Math.max(5, Math.min(95, score));

    const result = rawStocks.map((s) => {
      let category = "기타";
      const name = s.name;
      // 💡 업종 분류 필터링
      if (/전자|하이닉스|반도체|테크|칩스/.test(name)) category = "IT/반도체";
      else if (/에너지|에코프로|배터리|리튬/.test(name)) category = "2차전지";
      else if (/현대|기아|차/.test(name)) category = "자동차";
      else if (/바이오|제약|셀트리온/.test(name)) category = "바이오";

      return {
        code: s.code,
        name: s.name,
        price: s.price,
        chrate: s.chgrate,
        volume: s.acml_vol,
        category: category,
      };
    });

    res.json({ stocks: result, sentiment: score });
  } catch (e) {
    res.status(500).json({ stocks: [], sentiment: 50 });
  }
});

const PORT = 4000;
app.listen(PORT, async () => {
  await getAccessToken();
  console.log(`🚀 서버 시작: http://localhost:${PORT}`);
});
