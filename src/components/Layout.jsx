import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 문항 입력 화면은 듀오링고처럼 머리말·꼬리말 없이 한 문항에 집중한다
  const lesson = pathname === "/calculator/simple";
  return (
    <>
      {!lesson && <Header />}
      {/* 페이지가 바뀔 때마다 key가 바뀌어 본문 글자가 서서히 나타난다 */}
      <main key={pathname} className="page-fade">
        <Outlet />
      </main>
      {!lesson && <Footer />}
    </>
  );
}
