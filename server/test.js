const puppeteer = require("puppeteer");

async function askGemini(prompt) {
  const browser = await puppeteer.launch({
    headless: false, // 눈으로 확인하기 위해 false (실제 서비스 시 true 권장)
    args: ["C:\\Users\\사용자이름\\AppData\\Local\\Google\\Chrome\\User Data"],
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://gemini.google.com/app", {
      waitUntil: "networkidle2",
    });

    // 1. 질문 입력창 찾기 및 입력
    const selector = 'div[role="textbox"]';
    await page.waitForSelector(selector);
    await page.click(selector);
    await page.keyboard.sendCharacter(prompt);
    await page.keyboard.press("Enter");

    // 2. 응답이 끝날 때까지 대기 (제미나이 특유의 로딩 요소 감지)
    // 'Stop generating' 버튼이 사라지거나 응답 텍스트가 멈출 때까지 대기하는 로직이 필요합니다.
    console.log("Gemini가 답변을 생성 중입니다...");

    // 응답 텍스트가 포함된 선택자 (제미나이 UI 업데이트에 따라 변경될 수 있음)
    const responseSelector = "message-content";
    await page.waitForSelector(responseSelector);

    // 충분한 응답 시간을 위해 잠시 대기 (또는 특정 요소 변화 감지)
    await new Promise((r) => setTimeout(r, 5000));

    // 3. 마지막 응답 내용 가져오기
    const responses = await page.$$(responseSelector);
    const lastResponse = await responses[responses.length - 1].evaluate(
      (el) => el.innerText
    );

    console.log("결과 복사 완료:", lastResponse);
    return lastResponse;
  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    // await browser.close();
  }
}

// 테스트 실행
askGemini("1-1=");
