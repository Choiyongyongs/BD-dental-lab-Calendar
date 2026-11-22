/**
 * =========================================================================
 * BD Dental Lab - 장비 캘리브레이션 관리 스크립트 (equipment.js)
 * =========================================================================
 * [부적합 판정 기준]
 * 1) 12시 블럭의 | (X+) - (X-) | > 0.03 초과 시 부적합
 * 2) 6시 블럭의  | (X+) - (X-) | > 0.03 초과 시 부적합
 * 3) 12시 Z축과 6시 Z축의 | (12시 Z) - (6시 Z) | > 0.03 초과 시 부적합
 *
 * [경고 및 알람 규칙]
 * - 1회 부적합: 해당 장비(1호기/2호기/3호기)의 입력란 전체 노란색 표시
 * - 2회(2일 연속) 부적합: 해당 장비의 입력란 전체 빨간색 표시 + 표 상단 "N호기 캘리브레이션 하세요" 알람 표시
 */

const EQUIPMENT_MACHINES = ['1호기', '2호기', '3호기'];
const EQUIPMENT_ROWS = [
  { pos: '12시', axis: 'x+', key: 'p12_xp', posRowSpan: 3 },
  { pos: '12시', axis: 'x-', key: 'p12_xm', posRowSpan: 0 },
  { pos: '12시', axis: 'z축', key: 'p12_z', posRowSpan: 0 },
  { pos: '6시',  axis: 'x+', key: 'p6_xp',  posRowSpan: 3 },
  { pos: '6시',  axis: 'x-', key: 'p6_xm',  posRowSpan: 0 },
  { pos: '6시',  axis: 'z축', key: 'p6_z',   posRowSpan: 0 }
];
const WEEK_DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const CALIB_TOLERANCE = 0.03;

const STORAGE_KEY_EQUIP_CALIB = 'bd_equipment_calibration_v1';

// 상태 데이터:
// records: { 'YYYY-MM-DD': { '1호기': { p12_xp: '', ... } } }
// resetAfterDate: { '1호기': 'YYYY-MM-DD' }
// calibratedDates: { '1호기': ['YYYY-MM-DD', ...] }
let equipmentCalibState = {
  records: {},
  resetAfterDate: {},
  calibratedDates: {}
};

// 현재 조회 중인 주의 월요일 Date 객체
let currentEquipMonday = getMondayOfDate(new Date());

// 적합/부적합 클릭 시 수치 차이 펼쳐보기 토글 상태 ('1호기|YYYY-MM-DD')
let expandedCalibDiffCells = new Set();

// 실시간 동기화 중복/충돌 방지용 상태
let equipFirestoreUnsubscribe = null;
let equipFieldEditTimestamps = {}; // 'dateKey|machine|field' -> timestamp

function getEquipmentFirestoreDb() {
  return window.firebaseDb || (typeof firebaseDb !== 'undefined' ? firebaseDb : null);
}

function getMondayOfDate(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0(일) ~ 6(토)
  const diff = (day === 0 ? -6 : 1 - day); // 월요일 시작 기준
  date.setDate(date.getDate() + diff);
  return date;
}

function formatEquipDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayOfWeekKorFromDateKey(dateKey) {
  if (!dateKey) return '';
  const parts = String(dateKey).split('-').map(Number);
  if (parts.length !== 3) return '';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return dayNames[d.getDay()] || '';
}

function formatShortDateWithDay(dateKey) {
  if (!dateKey) return '';
  const parts = String(dateKey).split('-').map(Number);
  if (parts.length !== 3) return dateKey;
  const dayKor = getDayOfWeekKorFromDateKey(dateKey);
  return `${parts[1]}/${parts[2]}(${dayKor})`;
}

function getWeekDatesFromMonday(mondayDate) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// calibratedDates와 resetAfterDate 동기화 정규화
function normalizeCalibratedDatesState() {
  if (!equipmentCalibState.calibratedDates || typeof equipmentCalibState.calibratedDates !== 'object') {
    equipmentCalibState.calibratedDates = {};
  }
  if (!equipmentCalibState.resetAfterDate || typeof equipmentCalibState.resetAfterDate !== 'object') {
    equipmentCalibState.resetAfterDate = {};
  }

  EQUIPMENT_MACHINES.forEach(m => {
    const arr = Array.isArray(equipmentCalibState.calibratedDates[m])
      ? [...equipmentCalibState.calibratedDates[m]]
      : [];
    const legacyDate = equipmentCalibState.resetAfterDate[m];
    if (legacyDate && !arr.includes(legacyDate)) {
      arr.push(legacyDate);
    }
    const uniqueSorted = Array.from(new Set(arr.filter(Boolean))).sort();
    equipmentCalibState.calibratedDates[m] = uniqueSorted;
    if (uniqueSorted.length > 0) {
      equipmentCalibState.resetAfterDate[m] = uniqueSorted[uniqueSorted.length - 1];
    } else {
      delete equipmentCalibState.resetAfterDate[m];
    }
  });
}

function isMachineCalibratedOnDate(machine, dateKey) {
  const list = equipmentCalibState.calibratedDates?.[machine];
  if (Array.isArray(list) && list.includes(dateKey)) return true;
  return equipmentCalibState.resetAfterDate?.[machine] === dateKey;
}

// 부적합 판정 기준 상세 토글
function toggleCalibCriteriaDetail() {
  const box = document.getElementById('calib-criteria-detail-box');
  const arrow = document.getElementById('calib-criteria-arrow');
  if (!box) return;
  const isHidden = box.style.display === 'none' || !box.style.display;
  box.style.display = isHidden ? 'block' : 'none';
  if (arrow) {
    arrow.innerText = isHidden ? '▲' : '▼';
  }
}

// 적합 / 부적합 클릭 시 수치 차이 표시 토글
function toggleCalibDiffDetail(machine, dateKey) {
  const key = `${machine}|${dateKey}`;
  if (expandedCalibDiffCells.has(key)) {
    expandedCalibDiffCells.delete(key);
  } else {
    expandedCalibDiffCells.add(key);
  }
  updateEquipmentEvaluationUI();
}

// 초기 로드
function initEquipmentModule() {
  loadStoredEquipmentCalib();
  setupEquipmentFirestoreListeners();
  renderEquipmentTab();
}

function loadStoredEquipmentCalib() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EQUIP_CALIB);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        equipmentCalibState.records = parsed.records || {};
        equipmentCalibState.resetAfterDate = parsed.resetAfterDate || {};
        equipmentCalibState.calibratedDates = parsed.calibratedDates || {};
        normalizeCalibratedDatesState();
      }
    }
  } catch (e) {
    console.error('Failed to load equipment calibration data:', e);
  }
}

// 전체 상태 저장 (초기화 / 캘리브레이션 완료 등)
function saveStoredEquipmentCalib(fullOverwrite = false) {
  try {
    normalizeCalibratedDatesState();
    localStorage.setItem(STORAGE_KEY_EQUIP_CALIB, JSON.stringify(equipmentCalibState));
    const db = getEquipmentFirestoreDb();
    if (db) {
      const payload = {
        records: equipmentCalibState.records || {},
        resetAfterDate: equipmentCalibState.resetAfterDate || {},
        calibratedDates: equipmentCalibState.calibratedDates || {},
        updatedAt: new Date().toISOString()
      };
      if (fullOverwrite) {
        db.collection('equipment').doc('calibration_data').set(payload)
          .catch(err => console.warn('Firestore equipment calibration overwrite sync err:', err));
      } else {
        db.collection('equipment').doc('calibration_data').set(payload, { merge: true })
          .catch(err => console.warn('Firestore equipment calibration merge sync err:', err));
      }
    }
  } catch (e) {
    console.error('saveStoredEquipmentCalib error:', e);
  }
}

// 개별 입력칸 단위 실시간 병합 저장 (다중 사용자 동시 입력 시 서로 다른 칸 덮어쓰기 방지)
function saveSingleEquipmentFieldToCloud(dateKey, machine, field, rawVal) {
  try {
    localStorage.setItem(STORAGE_KEY_EQUIP_CALIB, JSON.stringify(equipmentCalibState));
    const db = getEquipmentFirestoreDb();
    if (!db) return;

    const patch = {
      records: {
        [dateKey]: {
          [machine]: {
            [field]: rawVal
          }
        }
      },
      updatedAt: new Date().toISOString()
    };

    db.collection('equipment').doc('calibration_data').set(patch, { merge: true })
      .catch(err => console.warn('Firestore equipment field sync err:', err));
  } catch (e) {
    console.error('saveSingleEquipmentFieldToCloud error:', e);
  }
}

function setupEquipmentFirestoreListeners() {
  const db = getEquipmentFirestoreDb();
  if (!db) return;

  if (typeof equipFirestoreUnsubscribe === 'function') {
    equipFirestoreUnsubscribe();
    equipFirestoreUnsubscribe = null;
  }

  equipFirestoreUnsubscribe = db.collection('equipment').doc('calibration_data').onSnapshot(doc => {
    if (typeof updateCloudStatusBadge === 'function') {
      updateCloudStatusBadge('connected', 'DB 연결됨');
    }
    if (doc.metadata && doc.metadata.hasPendingWrites) return;

    if (doc.exists && doc.data()) {
      const data = doc.data();
      const incomingRecords = data.records || {};
      const now = Date.now();

      if (!equipmentCalibState.records) equipmentCalibState.records = {};
      const mergedRecords = JSON.parse(JSON.stringify(incomingRecords));

      Object.keys(equipFieldEditTimestamps).forEach(cellKey => {
        const editedAt = equipFieldEditTimestamps[cellKey];
        if (now - editedAt < 2000) {
          const [dKey, mach, fld] = cellKey.split('|');
          const localVal = equipmentCalibState.records?.[dKey]?.[mach]?.[fld];
          if (localVal !== undefined) {
            if (!mergedRecords[dKey]) mergedRecords[dKey] = {};
            if (!mergedRecords[dKey][mach]) mergedRecords[dKey][mach] = {};
            mergedRecords[dKey][mach][fld] = localVal;
          }
        } else {
          delete equipFieldEditTimestamps[cellKey];
        }
      });

      equipmentCalibState.records = mergedRecords;
      equipmentCalibState.resetAfterDate = data.resetAfterDate || {};
      equipmentCalibState.calibratedDates = data.calibratedDates || {};
      normalizeCalibratedDatesState();
      localStorage.setItem(STORAGE_KEY_EQUIP_CALIB, JSON.stringify(equipmentCalibState));

      const hasRenderedInputs = document.querySelectorAll('.calib-input').length > 0;
      if (hasRenderedInputs) {
        syncInputsFromStateWithoutFocusLoss();
        updateEquipmentEvaluationUI();
      } else {
        renderEquipmentTab();
      }
    } else if (!doc.exists && Object.keys(equipmentCalibState.records || {}).length > 0) {
      saveStoredEquipmentCalib(true);
    }
  }, err => console.warn('Firestore equipment listener note:', err));
}

function syncInputsFromStateWithoutFocusLoss() {
  const activeEl = document.activeElement;
  const now = Date.now();
  document.querySelectorAll('.calib-input').forEach(inp => {
    if (inp === activeEl) return;
    const dateKey = inp.getAttribute('data-date');
    const machine = inp.getAttribute('data-machine');
    const field = inp.getAttribute('data-field');
    const cellKey = `${dateKey}|${machine}|${field}`;
    if (equipFieldEditTimestamps[cellKey] && (now - equipFieldEditTimestamps[cellKey] < 2000)) {
      return;
    }
    const val = equipmentCalibState.records?.[dateKey]?.[machine]?.[field] ?? '';
    if (inp.value !== String(val)) {
      inp.value = val;
    }
  });
}

// 주간 이동
function changeEquipmentWeek(weekDelta) {
  const nextMon = new Date(currentEquipMonday);
  nextMon.setDate(nextMon.getDate() + weekDelta * 7);
  currentEquipMonday = nextMon;
  renderEquipmentTab();
}

function goTodayEquipmentWeek() {
  currentEquipMonday = getMondayOfDate(new Date());
  renderEquipmentTab();
}

// 단일 숫자 파싱 헬퍼
function parseCalibNum(val) {
  if (val === undefined || val === null || String(val).trim() === '') return null;
  const num = parseFloat(String(val).trim());
  return isNaN(num) ? null : num;
}

// 부동소수점 오차 방지 차이 계산
function calcAbsDiff(a, b) {
  if (a === null || b === null) return null;
  return Math.round(Math.abs(a - b) * 10000) / 10000;
}

/**
 * 특정 날짜 + 특정 장비의 측정값 부적합 여부 판정
 * - 12시 |X+ - X-| > 0.03
 * - 6시  |X+ - X-| > 0.03
 * - |12시 Z - 6시 Z| > 0.03
 */
function evaluateMachineDay(dateKey, machine) {
  const data = equipmentCalibState.records?.[dateKey]?.[machine] || {};
  const p12_xp = parseCalibNum(data.p12_xp);
  const p12_xm = parseCalibNum(data.p12_xm);
  const p12_z  = parseCalibNum(data.p12_z);
  const p6_xp  = parseCalibNum(data.p6_xp);
  const p6_xm  = parseCalibNum(data.p6_xm);
  const p6_z   = parseCalibNum(data.p6_z);

  const diff12X = calcAbsDiff(p12_xp, p12_xm);
  const diff6X  = calcAbsDiff(p6_xp, p6_xm);
  const diffZ   = calcAbsDiff(p12_z, p6_z);

  const fail12X = diff12X !== null && diff12X > CALIB_TOLERANCE;
  const fail6X  = diff6X !== null && diff6X > CALIB_TOLERANCE;
  const failZ   = diffZ !== null && diffZ > CALIB_TOLERANCE;

  const hasAnyInput = [p12_xp, p12_xm, p12_z, p6_xp, p6_xm, p6_z].some(v => v !== null);
  const hasAnyPair = (diff12X !== null || diff6X !== null || diffZ !== null);
  const hasAllPairs = (diff12X !== null && diff6X !== null && diffZ !== null);
  const isFail = fail12X || fail6X || failZ;
  const isCompletePass = hasAllPairs && !isFail;

  return {
    hasAnyInput,
    hasAnyPair,
    hasAllPairs,
    diff12X,
    diff6X,
    diffZ,
    fail12X,
    fail6X,
    failZ,
    isFail,
    isCompletePass
  };
}

/**
 * 각 장비(1호기, 2호기, 3호기)의 연속 부적합 횟수(failStreak) 및 주간 부적합 현황 계산
 */
function evaluateMachineStreak(machine, weekDateKeys) {
  const calibratedSet = new Set(equipmentCalibState.calibratedDates?.[machine] || []);
  const resetAfter = equipmentCalibState.resetAfterDate?.[machine] || '';
  if (resetAfter) calibratedSet.add(resetAfter);

  const maxWeekDate = weekDateKeys[weekDateKeys.length - 1];
  const allDateSet = new Set([
    ...Object.keys(equipmentCalibState.records || {}),
    ...Array.from(calibratedSet),
    ...weekDateKeys
  ]);

  const sortedDates = Array.from(allDateSet)
    .filter(d => d <= maxWeekDate)
    .sort();

  let streak = 0;
  const failDatesInStreak = [];

  sortedDates.forEach(dKey => {
    // 해당 날짜에 캘리브레이션을 수행한 기록이 있으면 그 날까지의 부적합 연속 카운트 초기화
    if (calibratedSet.has(dKey)) {
      streak = 0;
      failDatesInStreak.length = 0;
      return;
    }
    const ev = evaluateMachineDay(dKey, machine);
    if (ev.isFail) {
      streak += 1;
      failDatesInStreak.push(dKey);
    } else if (ev.isCompletePass) {
      streak = 0;
      failDatesInStreak.length = 0;
    }
  });

  return {
    streak, // 0: 정상, 1: 1번 부적합(노란색), >=2: 2번 연속 부적합(빨간색 + 알람)
    failDatesInStreak
  };
}

// 탭 전체 렌더링
function renderEquipmentTab() {
  const container = document.getElementById('equipment-table-body');
  const theadRow = document.getElementById('equipment-table-head-row');
  const periodTitle = document.getElementById('equipment-week-title');
  if (!container || !theadRow) return;

  const weekDates = getWeekDatesFromMonday(currentEquipMonday);
  const weekDateKeys = weekDates.map(d => formatEquipDateKey(d));
  const todayKey = formatEquipDateKey(new Date());

  // 상단 주간 날짜 타이틀
  if (periodTitle) {
    const startD = weekDates[0];
    const endD = weekDates[6];
    const isCurrentWeek = weekDateKeys.includes(todayKey);
    periodTitle.innerHTML = `
      ${startD.getFullYear()}년 ${startD.getMonth() + 1}월 ${startD.getDate()}일(월) ~ ${endD.getMonth() + 1}월 ${endD.getDate()}일(일)
      ${isCurrentWeek ? '<span style="font-size: 12px; font-weight: 800; background: #dbeafe; color: #1d4ed8; padding: 3px 9px; border-radius: 999px; margin-left: 8px; vertical-align: middle;">이번 주</span>' : ''}
    `;
  }

  // 1) 테이블 헤더 렌더링 (월 ~ 일, 오늘 요일 강조 표시)
  let headHtml = `
    <th style="width: 105px; text-align: center;">장비</th>
    <th style="width: 66px; text-align: center;">위치</th>
    <th style="width: 66px; text-align: center;">축</th>
  `;

  weekDates.forEach((d, idx) => {
    const dKey = weekDateKeys[idx];
    const isToday = (dKey === todayKey);
    const dayLabel = WEEK_DAY_LABELS[idx];
    const dateSub = `${d.getMonth() + 1}/${d.getDate()}`;
    const weekendColor = idx === 5 ? '#2563eb' : (idx === 6 ? '#dc2626' : '#0f172a');

    headHtml += `
      <th class="calib-day-th ${isToday ? 'is-today-col' : ''}" style="text-align: center; min-width: 112px;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
          ${isToday ? '<span class="calib-today-pill">📍 오늘 입력</span>' : ''}
          <span style="font-size: 14px; font-weight: 800; color: ${isToday ? '#c2410c' : weekendColor};">
            ${dayLabel} <span style="font-size: 12px; font-weight: 600; opacity: 0.85;">(${dateSub})</span>
          </span>
        </div>
      </th>
    `;
  });
  theadRow.innerHTML = headHtml;

  // 2) 테이블 바디 렌더링 (1호기, 2호기, 3호기 × 12시/6시 × x+, x-, z축 + 일별 판정 요약행)
  let bodyHtml = '';

  EQUIPMENT_MACHINES.forEach((machine, mIdx) => {
    EQUIPMENT_ROWS.forEach((rowDef, rIdx) => {
      const isFirstRowOfMachine = (rIdx === 0);
      const isLastRowOfPos = (rIdx === 2 || rIdx === 5);

      bodyHtml += `<tr class="calib-row ${isLastRowOfPos ? 'calib-pos-divider' : ''}" data-machine="${machine}" data-row-key="${rowDef.key}">`;

      // 장비명 셀 (6행 + 1요약행 = 7행 병합)
      if (isFirstRowOfMachine) {
        bodyHtml += `
          <td rowspan="7" class="calib-machine-cell" id="calib-machine-cell-${mIdx}">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;">
              <span style="font-size: 16px; font-weight: 900; color: #0f172a;">${machine}</span>
              <span class="calib-machine-badge" id="calib-machine-badge-${mIdx}">정상</span>
              <button type="button" class="calib-machine-btn" onclick="openEquipCalibModal('${machine}')" title="${machine} 캘리브레이션 일자 선택">
                🔧 캘리브레이션
              </button>
              <div id="calib-machine-history-${mIdx}" style="display: flex; flex-direction: column; gap: 3px; align-items: center;"></div>
            </div>
          </td>
        `;
      }

      // 위치 셀 (12시 3행 병합 / 6시 3행 병합)
      if (rowDef.posRowSpan > 0) {
        bodyHtml += `
          <td rowspan="${rowDef.posRowSpan}" class="calib-pos-cell">
            <strong>${rowDef.pos}</strong>
          </td>
        `;
      }

      // 축 셀 (x+, x-, z축)
      bodyHtml += `
        <td class="calib-axis-cell">
          <span class="calib-axis-tag calib-axis-${rowDef.axis === 'z축' ? 'z' : 'x'}">${rowDef.axis}</span>
        </td>
      `;

      // 요일별(월~일) 입력 칸
      weekDates.forEach((d, dIdx) => {
        const dKey = weekDateKeys[dIdx];
        const isToday = (dKey === todayKey);
        const savedVal = equipmentCalibState.records?.[dKey]?.[machine]?.[rowDef.key] ?? '';

        bodyHtml += `
          <td class="calib-input-td ${isToday ? 'is-today-col' : ''}" data-date="${dKey}" data-machine="${machine}" data-field="${rowDef.key}">
            <input
              type="number"
              step="0.001"
              class="calib-input ${isToday ? 'is-today-input' : ''}"
              data-date="${dKey}"
              data-machine="${machine}"
              data-field="${rowDef.key}"
              data-day-idx="${dIdx}"
              data-row-idx="${rIdx}"
              placeholder="${isToday ? '오늘 입력' : '-'}"
              value="${escapeEquipHtml(savedVal)}"
              oninput="onCalibInputChange(this)"
              onchange="onCalibInputChange(this)"
              onkeydown="onCalibInputKeydown(event, this)"
            />
          </td>
        `;
      });

      bodyHtml += `</tr>`;
    });

    // 각 장비 하단 요일별 자동 판정 및 캘리브레이션 표시 행
    bodyHtml += `
      <tr class="calib-eval-row calib-machine-divider" data-machine="${machine}">
        <td colspan="2" style="text-align: center; font-size: 11.5px; font-weight: 800; color: #475569; background: #f8fafc;">
          일별 판정
        </td>
        ${weekDates.map((d, dIdx) => {
          const dKey = weekDateKeys[dIdx];
          const isToday = (dKey === todayKey);
          return `<td class="calib-eval-td ${isToday ? 'is-today-col' : ''}" id="calib-eval-${mIdx}-${dIdx}" style="text-align: center; padding: 6px 4px; font-size: 11px;">-</td>`;
        }).join('')}
      </tr>
    `;
  });

  container.innerHTML = bodyHtml;

  // 3) 부적합 판정, 입력란 색상(노란색/빨간색), 캘리브레이션 표시 및 상단 알람 배너 반영
  updateEquipmentEvaluationUI();
}

// 수치 입력 시 포커스 유지한 채 상태 저장 + 실시간 클라우드 공유 + 판정 업데이트
function onCalibInputChange(inputEl) {
  if (!inputEl) return;
  const dateKey = inputEl.getAttribute('data-date');
  const machine = inputEl.getAttribute('data-machine');
  const field = inputEl.getAttribute('data-field');
  const rawVal = inputEl.value;

  if (!equipmentCalibState.records) equipmentCalibState.records = {};
  if (!equipmentCalibState.records[dateKey]) equipmentCalibState.records[dateKey] = {};
  if (!equipmentCalibState.records[dateKey][machine]) equipmentCalibState.records[dateKey][machine] = {};

  equipmentCalibState.records[dateKey][machine][field] = rawVal;
  equipFieldEditTimestamps[`${dateKey}|${machine}|${field}`] = Date.now();

  saveSingleEquipmentFieldToCloud(dateKey, machine, field, rawVal);
  updateEquipmentEvaluationUI();
}

// 키보드 화살표 / Enter로 같은 요일 열에서 위아래 축으로 빠르게 이동
function onCalibInputKeydown(e, inputEl) {
  const machine = inputEl.getAttribute('data-machine');
  const dayIdx = Number(inputEl.getAttribute('data-day-idx'));
  const rowIdx = Number(inputEl.getAttribute('data-row-idx'));

  if (e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault();
    const nextRow = rowIdx + 1;
    if (nextRow < EQUIPMENT_ROWS.length) {
      const nextEl = document.querySelector(`.calib-input[data-machine="${machine}"][data-day-idx="${dayIdx}"][data-row-idx="${nextRow}"]`);
      if (nextEl) {
        nextEl.focus();
        nextEl.select();
      }
    } else {
      const mIdx = EQUIPMENT_MACHINES.indexOf(machine);
      if (mIdx >= 0 && mIdx + 1 < EQUIPMENT_MACHINES.length) {
        const nextMachine = EQUIPMENT_MACHINES[mIdx + 1];
        const nextEl = document.querySelector(`.calib-input[data-machine="${nextMachine}"][data-day-idx="${dayIdx}"][data-row-idx="0"]`);
        if (nextEl) {
          nextEl.focus();
          nextEl.select();
        }
      }
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prevRow = rowIdx - 1;
    if (prevRow >= 0) {
      const prevEl = document.querySelector(`.calib-input[data-machine="${machine}"][data-day-idx="${dayIdx}"][data-row-idx="${prevRow}"]`);
      if (prevEl) {
        prevEl.focus();
        prevEl.select();
      }
    }
  }
}

/**
 * 실시간 판정 UI 업데이트 (입력란 노란색/빨간색 변경 & 상단 알람 배너 & 일별 적합/부적합 클릭 시 수치 차이 & 캘리브레이션 완료 표시)
 */
function updateEquipmentEvaluationUI() {
  const weekDates = getWeekDatesFromMonday(currentEquipMonday);
  const weekDateKeys = weekDates.map(d => formatEquipDateKey(d));

  const alarmMachines = []; // 2일 연속 부적합 장비
  const warnMachines = [];  // 1회 부적합 장비

  EQUIPMENT_MACHINES.forEach((machine, mIdx) => {
    const streakInfo = evaluateMachineStreak(machine, weekDateKeys);
    const streak = streakInfo.streak;

    if (streak >= 2) {
      alarmMachines.push({ machine, streak, failDates: streakInfo.failDatesInStreak });
    } else if (streak === 1) {
      warnMachines.push({ machine, streak, failDates: streakInfo.failDatesInStreak });
    }

    // 1) 장비명 셀 배지 및 캘리브레이션 이력 업데이트
    const machineCell = document.getElementById(`calib-machine-cell-${mIdx}`);
    const machineBadge = document.getElementById(`calib-machine-badge-${mIdx}`);
    const machineHistoryBox = document.getElementById(`calib-machine-history-${mIdx}`);
    if (machineCell && machineBadge) {
      machineCell.classList.remove('machine-state-warn', 'machine-state-danger');
      if (streak >= 2) {
        machineCell.classList.add('machine-state-danger');
        machineBadge.className = 'calib-machine-badge badge-danger';
        machineBadge.innerHTML = `🚨 ${streak}회 연속 부적합`;
      } else if (streak === 1) {
        machineCell.classList.add('machine-state-warn');
        machineBadge.className = 'calib-machine-badge badge-warn';
        machineBadge.innerHTML = `⚠️ 1회 부적합`;
      } else {
        machineBadge.className = 'calib-machine-badge badge-ok';
        machineBadge.innerHTML = `✅ 정상`;
      }
    }

    if (machineHistoryBox) {
      const weekCalibDates = weekDateKeys.filter(dk => isMachineCalibratedOnDate(machine, dk));
      const allCalibDates = equipmentCalibState.calibratedDates?.[machine] || [];
      if (weekCalibDates.length > 0) {
        machineHistoryBox.innerHTML = weekCalibDates.map(dk => `
          <span class="calib-done-chip" title="${dk} 캘리브레이션 완료">
            🔧 ${formatShortDateWithDay(dk)} 완료
          </span>
        `).join('');
      } else if (allCalibDates.length > 0) {
        const latest = allCalibDates[allCalibDates.length - 1];
        machineHistoryBox.innerHTML = `
          <span class="calib-last-date-text" title="최근 캘리브레이션: ${latest}">
            최근: ${formatShortDateWithDay(latest)}
          </span>
        `;
      } else {
        machineHistoryBox.innerHTML = '';
      }
    }

    // 2) 해당 장비의 모든 입력란 색상 변경 (1번 부적합 -> 노란색, 2번 부적합 -> 빨간색)
    const machineInputs = document.querySelectorAll(`.calib-input[data-machine="${machine}"]`);
    machineInputs.forEach(inp => {
      inp.classList.remove('input-state-warn', 'input-state-danger', 'input-pair-fail');
      if (streak >= 2) {
        inp.classList.add('input-state-danger');
      } else if (streak === 1) {
        inp.classList.add('input-state-warn');
      }
    });

    // 3) 요일별 개별 편차 판정 (클릭 시 수치 차이 노출) 및 캘리브레이션 완료 표시
    weekDateKeys.forEach((dKey, dIdx) => {
      const ev = evaluateMachineDay(dKey, machine);
      const evalCell = document.getElementById(`calib-eval-${mIdx}-${dIdx}`);
      const isCalibratedDay = isMachineCalibratedOnDate(machine, dKey);
      const isExpanded = expandedCalibDiffCells.has(`${machine}|${dKey}`);

      // 초과된 축의 입력칸에 테두리 강조 추가
      if (ev.fail12X) {
        document.querySelector(`.calib-input[data-machine="${machine}"][data-date="${dKey}"][data-field="p12_xp"]`)?.classList.add('input-pair-fail');
        document.querySelector(`.calib-input[data-machine="${machine}"][data-date="${dKey}"][data-field="p12_xm"]`)?.classList.add('input-pair-fail');
      }
      if (ev.fail6X) {
        document.querySelector(`.calib-input[data-machine="${machine}"][data-date="${dKey}"][data-field="p6_xp"]`)?.classList.add('input-pair-fail');
        document.querySelector(`.calib-input[data-machine="${machine}"][data-date="${dKey}"][data-field="p6_xm"]`)?.classList.add('input-pair-fail');
      }
      if (ev.failZ) {
        document.querySelector(`.calib-input[data-machine="${machine}"][data-date="${dKey}"][data-field="p12_z"]`)?.classList.add('input-pair-fail');
        document.querySelector(`.calib-input[data-machine="${machine}"][data-date="${dKey}"][data-field="p6_z"]`)?.classList.add('input-pair-fail');
      }

      if (!evalCell) return;

      const calibBadgeHtml = isCalibratedDay
        ? `<span class="calib-day-done-badge" title="${dKey} (${WEEK_DAY_LABELS[dIdx]}요일) ${machine} 캘리브레이션 완료">🔧 ${formatShortDateWithDay(dKey)} 캘리브레이션</span>`
        : '';

      if (!ev.hasAnyInput) {
        evalCell.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
            ${calibBadgeHtml}
            ${!isCalibratedDay ? '<span style="color: #cbd5e1;">미입력</span>' : ''}
          </div>
        `;
        return;
      }

      const diffLines = [];
      if (ev.diff12X !== null) {
        diffLines.push(`<div style="color: ${ev.fail12X ? '#dc2626; font-weight:800;' : '#334155;'}">12시 x: ${ev.diff12X.toFixed(2)}</div>`);
      }
      if (ev.diff6X !== null) {
        diffLines.push(`<div style="color: ${ev.fail6X ? '#dc2626; font-weight:800;' : '#334155;'}">6시 x: ${ev.diff6X.toFixed(2)}</div>`);
      }
      if (ev.diffZ !== null) {
        diffLines.push(`<div style="color: ${ev.failZ ? '#dc2626; font-weight:800;' : '#334155;'}">z축: ${ev.diffZ.toFixed(2)}</div>`);
      }

      const diffDetailBoxHtml = (isExpanded && diffLines.length > 0)
        ? `<div class="calib-diff-popup-box">${diffLines.join('')}</div>`
        : '';

      if (ev.isFail) {
        evalCell.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
            ${calibBadgeHtml}
            <button type="button" class="calib-status-toggle-btn is-fail" onclick="toggleCalibDiffDetail('${machine}', '${dKey}')" title="클릭하여 수치 차이 보기">
              ❌ 부적합 <span style="font-size: 9px; opacity: 0.8;">${isExpanded ? '▲' : '▼'}</span>
            </button>
            ${diffDetailBoxHtml}
          </div>
        `;
      } else if (ev.hasAnyPair) {
        evalCell.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
            ${calibBadgeHtml}
            <button type="button" class="calib-status-toggle-btn is-pass" onclick="toggleCalibDiffDetail('${machine}', '${dKey}')" title="클릭하여 수치 차이 보기">
              ⭕ 적합 <span style="font-size: 9px; opacity: 0.8;">${isExpanded ? '▲' : '▼'}</span>
            </button>
            ${diffDetailBoxHtml}
          </div>
        `;
      } else {
        evalCell.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
            ${calibBadgeHtml}
            <span style="color: #94a3b8; font-size: 10.5px;">입력 중...</span>
          </div>
        `;
      }
    });
  });

  // 4) 표 상단 알람 배너 업데이트 ("N호기 캘리브레이션 하세요")
  const alarmContainer = document.getElementById('equipment-alarm-container');
  if (!alarmContainer) return;

  let alarmHtml = '';

  if (alarmMachines.length > 0) {
    alarmHtml += alarmMachines.map(item => `
      <div class="calib-alarm-banner calib-alarm-danger">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-size: 22px;">🚨</span>
          <div>
            <div style="font-size: 16px; font-weight: 900; color: #991b1b;">
              ${item.machine} 캘리브레이션 하세요!
            </div>
            <div style="font-size: 12.5px; font-weight: 700; color: #b91c1c; margin-top: 2px;">
              ${item.machine}에서 부적합(편차 0.03 초과)이 <strong>${item.streak}일 연속</strong> 발생했습니다. 즉시 장비 캘리브레이션을 진행해주세요.
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  if (warnMachines.length > 0) {
    alarmHtml += warnMachines.map(item => `
      <div class="calib-alarm-banner calib-alarm-warn">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-size: 18px;">⚠️</span>
          <div style="font-size: 13.5px; font-weight: 800; color: #854d0e;">
            <strong>${item.machine}</strong> 1회 부적합 발생 (노란색 주의 단계 — 다음 측정에서도 부적합 시 캘리브레이션 알람이 울립니다)
          </div>
        </div>
      </div>
    `).join('');
  }

  alarmContainer.innerHTML = alarmHtml;
}

// =========================================================================
// 캘리브레이션 일자 클릭 선택 모달 기능 (1주일 중 클릭하여 즉시 표시/해제)
// =========================================================================
function openEquipCalibModal(machine) {
  const modal = document.getElementById('equip-calib-modal');
  const titleEl = document.getElementById('equip-calib-modal-title');
  const machineInput = document.getElementById('modal-equip-machine-name');
  const dayListEl = document.getElementById('modal-equip-day-list');
  if (!modal || !dayListEl) return;

  if (titleEl) titleEl.innerText = `🔧 ${machine} 캘리브레이션 날짜 선택`;
  if (machineInput) machineInput.value = machine;

  renderEquipCalibModalDayList(machine);
  modal.classList.add('active');
}

function renderEquipCalibModalDayList(machine) {
  const dayListEl = document.getElementById('modal-equip-day-list');
  if (!dayListEl) return;

  const weekDates = getWeekDatesFromMonday(currentEquipMonday);
  const todayKey = formatEquipDateKey(new Date());

  dayListEl.innerHTML = weekDates.map((d, idx) => {
    const dKey = formatEquipDateKey(d);
    const dayName = WEEK_DAY_LABELS[idx];
    const isToday = (dKey === todayKey);
    const isCalibrated = isMachineCalibratedOnDate(machine, dKey);

    return `
      <button
        type="button"
        class="calib-day-select-btn ${isCalibrated ? 'is-selected' : ''}"
        onclick="selectEquipCalibDay('${machine}', '${dKey}')"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px; font-weight: 800;">
            ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} (${dayName}요일)
          </span>
          ${isToday ? '<span style="background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; font-size: 11px; font-weight: 800; padding: 1px 7px; border-radius: 999px;">오늘</span>' : ''}
        </div>
        <span style="font-size: 12.5px; font-weight: 800; color: ${isCalibrated ? '#1d4ed8' : '#64748b'};">
          ${isCalibrated ? '🔧 캘리브레이션 완료 ✓' : '클릭하여 선택'}
        </span>
      </button>
    `;
  }).join('');
}

function selectEquipCalibDay(machine, dateKey) {
  if (!machine || !dateKey) return;
  normalizeCalibratedDatesState();

  const currentList = equipmentCalibState.calibratedDates[machine] || [];
  if (currentList.includes(dateKey)) {
    // 이미 등록된 날짜를 다시 누르면 해제 토글
    equipmentCalibState.calibratedDates[machine] = currentList.filter(d => d !== dateKey);
  } else {
    equipmentCalibState.calibratedDates[machine] = [...currentList, dateKey].sort();
  }

  normalizeCalibratedDatesState();
  saveStoredEquipmentCalib(true);
  closeEquipCalibModal();
  renderEquipmentTab();
}

function closeEquipCalibModal() {
  const modal = document.getElementById('equip-calib-modal');
  if (modal) modal.classList.remove('active');
}

function cancelMachineCalibration() {
  const machine = document.getElementById('modal-equip-machine-name')?.value;
  if (!machine) return;

  if (!confirm(`${machine}의 이번 주 캘리브레이션 기록을 모두 해제하시겠습니까?`)) return;

  const weekDateSet = new Set(getWeekDatesFromMonday(currentEquipMonday).map(d => formatEquipDateKey(d)));
  if (equipmentCalibState.calibratedDates && Array.isArray(equipmentCalibState.calibratedDates[machine])) {
    equipmentCalibState.calibratedDates[machine] = equipmentCalibState.calibratedDates[machine].filter(d => !weekDateSet.has(d));
  }
  if (equipmentCalibState.resetAfterDate && weekDateSet.has(equipmentCalibState.resetAfterDate[machine])) {
    delete equipmentCalibState.resetAfterDate[machine];
  }

  normalizeCalibratedDatesState();
  saveStoredEquipmentCalib(true);
  closeEquipCalibModal();
  renderEquipmentTab();
}

// 현재 주간 데이터 초기화
function clearCurrentWeekEquipmentData() {
  if (!confirm('현재 보고 있는 주(월~일)의 장비 측정 수치를 모두 지우시겠습니까?')) return;
  const weekDates = getWeekDatesFromMonday(currentEquipMonday);
  weekDates.forEach(d => {
    const dKey = formatEquipDateKey(d);
    if (equipmentCalibState.records && equipmentCalibState.records[dKey]) {
      delete equipmentCalibState.records[dKey];
    }
  });
  saveStoredEquipmentCalib(true);
  renderEquipmentTab();
}

function escapeEquipHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
