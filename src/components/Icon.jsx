// 이모지를 단색 아이콘(Phosphor Bold)으로 그린다. 데이터(questions.js 등)에는 이모지를 그대로 두고,
// 화면에 그릴 때만 이 컴포넌트로 바꾼다. 표에 없는 이모지는 그대로 보여 준다.
import { ICONS } from "./iconData.js";

const MAP = {
  "🚶": "PersonSimpleWalk", "🚲": "Bicycle", "🚌": "Bus", "🚇": "Train", "🚗": "Car",
  "🚕": "Taxi", "🛵": "MopedFront", "✈": "AirplaneTilt", "🚄": "TrainRegional", "🚆": "TrainSimple",
  "🏡": "House", "🏠": "House", "🏢": "Buildings", "🏫": "GraduationCap", "🛏": "Bed",
  "🧑‍🤝‍🧑": "UsersThree", "👤": "User",
  "🍚": "BowlFood", "🍱": "BowlSteam", "🍳": "CookingPot", "🍽": "ForkKnife", "🏪": "Storefront",
  "🐄": "Cow", "🐖": "Hamburger", "🐔": "Egg", "🐟": "Fish", "🥗": "Leaf",
  "🛍": "ShoppingBag", "👕": "TShirt", "📦": "Package", "🥤": "Coffee",
  "🔌": "Plug", "🌀": "Fan", "🧣": "Hoodie", "🚿": "Shower", "🗓": "CalendarDots",
  "🌲": "TreeEvergreen", "👣": "Footprints", "✍": "PencilSimpleLine",
};

// 이름으로 아이콘 SVG를 그린다 (예: <Svg name="X" />). 색은 글자색(currentColor)을 따른다
export function Svg({ name, className = "", size = "1.15em" }) {
  return (
    <svg
      className={`ui-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}

const clean = (s) => String(s ?? "").replace(/️/g, "").trim();

export default function Icon({ name, className = "", size = "1.15em" }) {
  if (!name) return null;
  const key = MAP[clean(name)] ?? (ICONS[name] ? name : null);
  if (!key) return <span className={className}>{name}</span>;
  return <Svg name={key} className={className} size={size} />;
}

// "🐄 소고기"처럼 이모지로 시작하는 글자: 이모지를 아이콘으로 바꿔 그린다
const LEAD = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u;
export function IconText({ text }) {
  const m = typeof text === "string" && text.match(LEAD);
  if (!m || !MAP[clean(m[1])]) return text;
  return (
    <>
      <Icon name={m[1]} className="label-icon" /> {text.slice(m[0].length)}
    </>
  );
}
