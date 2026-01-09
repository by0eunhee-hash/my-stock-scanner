/** @type {import('tailwindcss').Config} */
export default {
  // 1. Tailwind가 스타일을 적용할 파일 경로를 지정합니다.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // src 폴더 안의 모든 js, jsx 파일을 감시합니다.
  ],
  theme: {
    extend: {
      // 주식 앱에 어울리는 커스텀 색상을 추가하고 싶다면 여기에 정의합니다.
      colors: {
        "stock-bg": "#0b0e11",
        "stock-card": "#161a1e",
        "up-red": "#f6465d",
        "down-green": "#00b07c",
      },
    },
  },
  plugins: [],
};
