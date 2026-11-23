import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
// 공통 스타일을 먼저 불러와야 페이지별 CSS가 이를 덮어쓸 수 있다
import "./styles/global.css";
import App from "./App.jsx";
// 듀오링고 스타일 버튼·선택지·입력 화면 (페이지별 CSS보다 뒤에 불러와 덮어쓴다)
import "./styles/duo.css";
import { AuthProvider } from "./lib/auth.jsx";
import { RecordsProvider } from "./lib/records.jsx";

// HashRouter: 정적 호스팅(GitHub Pages 등)에서 새로고침해도 404가 나지 않도록
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RecordsProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </HashRouter>
      </RecordsProvider>
    </AuthProvider>
  </React.StrictMode>
);
