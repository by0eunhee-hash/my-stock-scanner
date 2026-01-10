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
    console.log("✅ [KIS] 인증 성공 - 7개 조건식 엔진 대기 중");
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
    const result = rawStocks.map((s) => {
      let category = "기타";
      const name = s.name;

      // 💡 '기타'를 죽이는 강력한 정규표현식 분류기
      if (
        /전자|하이닉스|반도체|테크|칩스|솔루션|디스플레이|시스템|회로|공정/.test(
          name
        )
      )
        category = "IT/반도체";
      else if (
        /에너지|에코프로|배터리|셀|리튬|화학|신소재|전기차|충전|전선/.test(name)
      )
        category = "2차전지/에너지";
      else if (/현대|기아|모빌리티|부품|타이어|자동차|오토|엔진/.test(name))
        category = "자동차/모빌리티";
      else if (/바이오|제약|셀트리온|헬스|메디|의약|생명|유전|백신/.test(name))
        category = "바이오/제약";
      else if (/금융|은행|지주|증권|보험|카드|투자|자산/.test(name))
        category = "금융/증권";
      else if (
        /엔터|게임|네이버|카카오|콘텐츠|소프트|AI|로봇|클라우드|통신/.test(name)
      )
        category = "플랫폼/엔터/AI";
      else if (
        /건설|중공업|조선|철강|엔지니어링|기계|금속|시멘트|플랜트/.test(name)
      )
        category = "인프라/제조";
      else if (/홀딩스|우|스팩|그룹/.test(name)) category = "지주/기타";

      return {
        code: s.code,
        name: s.name,
        price: s.price,
        chrate: s.chgrate,
        volume: s.acml_vol,
        category: category,
      };
    });
    res.json(result);
  } catch (e) {
    res.status(500).json([]);
  }
});

const PORT = 4000;
app.listen(PORT, async () => {
  await getAccessToken();
  console.log(`🚀 서버 시작: http://localhost:${PORT}`);
});
