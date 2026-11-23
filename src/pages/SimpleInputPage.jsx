import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Question from "../components/Question.jsx";
import { CATEGORIES, calculate, commuteKm } from "../lib/carbon/engine.js";
import { HOUSING } from "../lib/carbon/factors.js";
import { QUESTIONS, hasValue, isSkipped, missingRequired, mustPick, optionLabel } from "../lib/carbon/questions.js";
import Icon, { Svg } from "../components/Icon.jsx";
import { canExpand, fillBlank, syncSimple } from "../lib/carbon/details.js";
import { upgradeDraft, useDraft } from "../lib/draft.js";
import { createResponse } from "../lib/responses.js";
import { useResponses } from "../lib/records.jsx";
import { num, toTon } from "../lib/format.js";
import "./Calculator.css";

// 한 화면에 한 문항: 건너뛰는 문항(통학 0일의 시간·수단)은 순서에서 뺀다
const categoryOf = (q) => CATEGORIES.find((c) => c.key === q.category);
const isFilled = (q, answers) => !mustPick(q) || hasValue(answers[q.id]);

// 간편 입력값에서 바로 파생되는 안내 (계산 과정을 보여 줘 결과를 믿을 수 있게)
function derivedHint(q, answers, touched) {
  const modes = answers.commuteMode ?? [];
  if (q.id === "commuteMinutes" && modes.length) {
    const km = num(commuteKm(modes, answers.commuteMinutes), 1);
    const labels = modes.map((m) => optionLabel("commuteMode", m)).join("·");
    return modes.length > 1
      ? `${labels}: 같은 시간씩 탄다고 보고 편도 약 ${km}km로 계산해요.`
      : `${labels} 기준 편도 약 ${km}km로 계산해요.`;
  }
  if (q.id === "household" && answers.housing && !touched.includes("household")) {
    return "거주 형태에 맞춰 미리 골라 두었어요. 다르면 바꿔 주세요.";
  }
  return null;
}

export default function SimpleInputPage() {
  const navigate = useNavigate();
  const [stored, setStored] = useDraft();
  // 이전 버전의 초안도 지금 형식으로 보여 주고, 고칠 때도 지금 형식으로 바꾼 뒤에 고친다
  const draft = upgradeDraft(stored);
  const setDraft = (update) => setStored((d) => (typeof update === "function" ? update(upgradeDraft(d)) : update));
  const { add } = useResponses();
  const [showMissing, setShowMissing] = useState(false);
  const location = useLocation();
  // 완료 직후 초안을 지우면서 시작 화면으로 되돌려 보내지 않도록
  const finished = useRef(false);

  // 이어서 입력: 시작 화면이 넘겨준, 값이 아예 없는 첫 문항부터 연다
  const focusId = location.state?.focus;
  useEffect(() => {
    if (focusId) setStored((d) => (d ? { ...d, qid: focusId } : d));
  }, [focusId]);

  if (!draft?.consent?.service) return finished.current ? null : <Navigate to="/calculator" replace />;

  const { answers, touched, detail } = draft;
  const detailOpen = draft.detailOpen ?? [];
  const flow = QUESTIONS.filter((q) => !isSkipped(q, answers, detail));
  // 지금 문항: 저장된 문항이 건너뛰는 문항이 되었으면 그다음 문항
  const savedIdx = QUESTIONS.findIndex((q) => q.id === draft.qid);
  const current = flow.find((q) => QUESTIONS.indexOf(q) >= Math.max(0, savedIdx)) ?? flow[flow.length - 1];
  const pos = flow.indexOf(current);
  const isLast = pos === flow.length - 1;
  const result = calculate(answers, detail);
  const missing = missingRequired(answers, detail);
  const filledHere = isFilled(current, answers);
  // 게이지: 끝낸 문항 수 + 지금 문항을 골랐으면 한 칸 더
  const done = pos + (filledHere ? 1 : 0);
  const cat = categoryOf(current);

  // key: 바꿀 답변, qid: 직접 조작한 문항(난방은 방식과 시간이 한 문항)
  const setAnswer = (key, value, qid = key) =>
    setDraft((d) => {
      const next = { ...d.answers, [key]: value };
      // 거주 형태를 고르면, 동거 인원을 직접 고르기 전까지는 그 형태의 기본 인원으로 맞춘다
      if (key === "housing" && !d.touched.includes("household")) next.household = HOUSING[value].defaultHousehold;
      // 자세히 입력한 문항의 간편 칸은 자세히 입력값을 따른다 (예: 수단을 바꾸면 거리로 구한 통학 시간도 다시 구함)
      return { ...d, answers: syncSimple(next, d.detail), touched: d.touched.includes(qid) ? d.touched : [...d.touched, qid] };
    });

  // 자세히 입력: 펼치기/접기, 값 바꾸기(처음 바꿀 때 기본값과 함께 저장), 비운 칸 되돌리기, 간편 입력으로 되돌리기
  const setOpen = (ids, open) =>
    setDraft((d) => {
      const was = d.detailOpen ?? [];
      return {
        ...d,
        detailOpen: open ? [...new Set([...was, ...ids])] : was.filter((x) => !ids.includes(x)),
        detailOpened: open ? [...new Set([...(d.detailOpened ?? []), ...ids])] : d.detailOpened ?? [],
      };
    });
  // 되돌려도 간편 칸은 마지막으로 반영된 값에 머문다
  const setDetail = (qid, values) =>
    setDraft((d) => {
      const next = { ...(d.detail ?? {}) };
      if (values) next[qid] = values;
      else delete next[qid];
      return { ...d, detail: next, answers: syncSimple(d.answers, next) };
    });
  const detailPropsFor = (q) => ({
    detail: detail[q.id],
    open: detailOpen.includes(q.id),
    onToggle: () => setOpen([q.id], !detailOpen.includes(q.id)),
    onReset: () => setDetail(q.id, null),
    onDetailChange: (values) => setDetail(q.id, values),
    onDetailCommit: () => detail[q.id] && setDetail(q.id, fillBlank(q, answers, detail[q.id])),
  });
  const goTo = (q) => {
    setShowMissing(false);
    setDraft((d) => ({ ...d, qid: q.id }));
    window.scrollTo(0, 0);
  };

  // 아직 고르지 않은 칩이 있으면 그 문항을 강조하고 보여 준다
  const flagMissing = (q) => {
    setShowMissing(true);
    requestAnimationFrame(() =>
      document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  const next = () => {
    if (!filledHere) return flagMissing(current);
    goTo(flow[pos + 1]);
  };

  const finish = () => {
    if (missing.length) {
      if (missing[0] !== current) goTo(missing[0]);
      return flagMissing(missing[0]);
    }
    // 건너뛴 문항(통학 0일의 시간·수단)의 자세히 입력은 저장하지 않는다
    const kept = Object.fromEntries(
      Object.entries(detail).filter(([id]) => {
        const q = QUESTIONS.find((x) => x.id === id);
        return q && !isSkipped(q, answers, detail);
      })
    );
    const record = createResponse({ ...draft, detail: kept, detailOpened: draft.detailOpened ?? [] });
    finished.current = true;
    add(record);
    setDraft(null);
    navigate(`/result/${record.id}`);
  };

  const primary = isLast ? { label: "결과 보기", onClick: finish } : { label: "계속하기", onClick: next };

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button type="button" className="lesson-x" onClick={() => navigate("/calculator")} aria-label="입력 그만하고 시작 화면으로">
          <Svg name="X" size={26} />
        </button>
        <div className="lesson-gauge-wrap">
          <span key={cat.key} className="lesson-cat fade-text">
            <Icon name={cat.icon} /> {cat.label}
          </span>
          <div
            className="lesson-gauge"
            role="progressbar"
            aria-label="입력 진행도"
            aria-valuemin={0}
            aria-valuemax={flow.length}
            aria-valuenow={done}
            aria-valuetext={`${flow.length}개 중 ${done}개`}
          >
            <span className="lesson-gauge-fill" style={{ width: `${Math.max(4, (done / flow.length) * 100)}%` }}>
              <i />
            </span>
          </div>
        </div>
        <span className="lesson-count">
          {pos + 1}/{flow.length}
        </span>
      </div>

      <div className="lesson-body">
        <div key={current.id} className="lesson-q">
          <Question
            q={current}
            index={pos + 1}
            answers={answers}
            touched={touched}
            skipped={false}
            missing={showMissing && missing.includes(current)}
            hint={derivedHint(current, answers, touched)}
            onChange={setAnswer}
            detailProps={detailPropsFor(current)}
          />
        </div>
        <p key={toTon(result.total.value)} className="lesson-live fade-text">
          지금까지 예상 <strong>{toTon(result.total.value)}톤</strong>/년 <span className="badge-est">추정</span>
        </p>
      </div>

      <div className="lesson-foot">
        <div className="lesson-foot-inner">
          <div className="lesson-actions">
            {pos > 0 && (
              <button type="button" className="duo-btn duo-btn-ghost lesson-back" onClick={() => goTo(flow[pos - 1])} aria-label="이전 문항">
                <Svg name="ArrowLeft" size={22} />
              </button>
            )}
            <button type="button" className="duo-btn duo-btn-primary lesson-next" onClick={primary.onClick} aria-disabled={!filledHere}>
              {primary.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
