const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "실시간 급등주 스캐너",
    autoHideMenuBar: true, // 메뉴바 숨기기
    webPreferences: { nodeIntegration: true },
  });

  win.loadURL("http://localhost:5173"); // 리액트 주소 로드
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
