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
    console.log("✅ [KIS] 인증 성공");
  } catch (e) {
    console.error("❌ [KIS] 인증 실패");
  }
};

// 1. 조건 목록 조회
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
    const list = (response.data.output2 || []).map((i) => ({
      id: i.seq,
      group: i.grp_nm,
      name: i.condition_nm,
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json([]);
  }
});

// 2. 조건별 종목 결과 조회 (명세서 image_ff4802.png 규격 반영)
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
    const result = rawStocks.map((s) => ({
      code: s.code,
      name: s.name,
      price: s.price, // 현재가
      chrate: s.chgrate, // ✅ 등락율 (명세서: chgrate)
      volume: s.acml_vol, // ✅ 거래량 (명세서: acml_vol)
    }));

    console.log(`✅ [${req.params.seq}번] ${result.length}개 종목 배달 완료`);
    res.json(result);
  } catch (e) {
    res.status(500).json([]);
  }
});

const PORT = 4000;
app.listen(PORT, async () => {
  await getAccessToken();
  console.log(`🚀 서버 가동 중: http://localhost:${PORT}`);
});
