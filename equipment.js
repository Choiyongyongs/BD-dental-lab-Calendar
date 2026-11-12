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

// 상태 데이터: { records: { 'YYYY-MM-DD': { '1호기': { p12_xp: '', ... } } }, resetAfterDate: { '1호기': 'YYYY-MM-DD' } }
let equipmentCalibState = {
  records: {},
  resetAfterDate: {}
};

// 현재 조회 중인 주의 월요일 Date 객체
let currentEquipMonday = getMondayOfDate(new Date());

// 실시간 동기화 중복/충돌 방지용 상태
let equipFirestoreUnsubscribe = null;
let equipFieldEditTimestamps = {}; // 'dateKey|machine|field' -> timestamp
let equipSaveTimer = null;

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

function getWeekDatesFromMonday(mondayDate) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
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
      }
    }
  } catch (e) {
    console.error('Failed to load equipment calibration data:', e);
  }
}

// 전체 상태 저장 (초기화 / 캘리브레이션 완료 등)
function saveStoredEquipmentCalib(fullOverwrite = false) {
  try {
    localStorage.setItem(STORAGE_KEY_EQUIP_CALIB, JSON.stringify(equipmentCalibState));
    const db = getEquipmentFirestoreDb();
    if (db) {
      const payload = {
        records: equipmentCalibState.records || {},
        resetAfterDate: equipmentCalibState.resetAfterDate || {},
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
function saveSingleEquipmentFieldToCloud(dateKey, machine, field, rawVal, resetCleared = false) {
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
    if (resetCleared) {
      patch.resetAfterDate = equipmentCalibState.resetAfterDate || {};
    }

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
    // 로컬에서 방금 전송 중인 pending write 스냅샷은 건너뛰어 타이핑 중 커서/값 튐 방지
    if (doc.metadata && doc.metadata.hasPendingWrites) return;

    if (doc.exists && doc.data()) {
      const data = doc.data();
      const incomingRecords = data.records || {};
      const now = Date.now();

      // 최근 2초 이내에 현재 기기에서 직접 타이핑한 셀은 로컬 값을 우선 유지
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
      localStorage.setItem(STORAGE_KEY_EQUIP_CALIB, JSON.stringify(equipmentCalibState));

      // 현재 테이블이 렌더링되어 있으면 포커스를 깨뜨리지 않고 값과 색상/알람만 즉시 동기화
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

  const reasons = [];
  if (fail12X) reasons.push(`12시 X편차(${diff12X.toFixed(3)})`);
  if (fail6X)  reasons.push(`6시 X편차(${diff6X.toFixed(3)})`);
  if (failZ)   reasons.push(`Z축 편차(${diffZ.toFixed(3)})`);

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
    isCompletePass,
    reasons
  };
}

/**
 * 각 장비(1호기, 2호기, 3호기)의 연속 부적합 횟수(failStreak) 및 주간 부적합 현황 계산
 */
function evaluateMachineStreak(machine, weekDateKeys) {
  const resetAfter = equipmentCalibState.resetAfterDate?.[machine] || '';

  // 전체 기록된 날짜 + 현재 보고 있는 주간 날짜들을 시간순 정렬하여 조회 주의 마지막 날짜까지 스캔
  const maxWeekDate = weekDateKeys[weekDateKeys.length - 1];
  const allDateSet = new Set([
    ...Object.keys(equipmentCalibState.records || {}),
    ...weekDateKeys
  ]);

  const sortedDates = Array.from(allDateSet)
    .filter(d => d <= maxWeekDate && (!resetAfter || d > resetAfter))
    .sort();

  let streak = 0;
  const failDatesInStreak = [];

  sortedDates.forEach(dKey => {
    const ev = evaluateMachineDay(dKey, machine);
    if (ev.isFail) {
      streak += 1;
      failDatesInStreak.push(dKey);
    } else if (ev.isCompletePass) {
      // 6개 수치(3쌍)가 모두 정상 범위(<=0.03)로 입력된 날이 있으면 연속 부적합 초기화
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
    <th style="width: 92px; text-align: center;">장비</th>
    <th style="width: 68px; text-align: center;">위치</th>
    <th style="width: 68px; text-align: center;">축</th>
  `;

  weekDates.forEach((d, idx) => {
    const dKey = weekDateKeys[idx];
    const isToday = (dKey === todayKey);
    const dayLabel = WEEK_DAY_LABELS[idx];
    const dateSub = `${d.getMonth() + 1}/${d.getDate()}`;
    const weekendColor = idx === 5 ? '#2563eb' : (idx === 6 ? '#dc2626' : '#0f172a');

    headHtml += `
      <th class="calib-day-th ${isToday ? 'is-today-col' : ''}" style="text-align: center; min-width: 110px;">
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
        const lastCalibDate = equipmentCalibState.resetAfterDate?.[machine];
        let lastCalibText = '';
        if (lastCalibDate) {
          const parts = lastCalibDate.split('-');
          lastCalibText = `<div class="calib-last-date-text" title="마지막 캘리브레이션: ${lastCalibDate}">최근: ${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}</div>`;
        }
        bodyHtml += `
          <td rowspan="7" class="calib-machine-cell" id="calib-machine-cell-${mIdx}">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;">
              <span style="font-size: 16px; font-weight: 900; color: #0f172a;">${machine}</span>
              <span class="calib-machine-badge" id="calib-machine-badge-${mIdx}">정상</span>
              <button type="button" class="calib-machine-btn" onclick="openEquipCalibModal('${machine}')" title="${machine} 캘리브레이션 일자 등록">
                🔧 캘리브레이션
              </button>
              ${lastCalibText}
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

    // 각 장비 하단 요일별 자동 판정 및 편차 표시 행
    bodyHtml += `
      <tr class="calib-eval-row calib-machine-divider" data-machine="${machine}">
        <td colspan="2" style="text-align: center; font-size: 11.5px; font-weight: 800; color: #475569; background: #f8fafc;">
          일별 판정 / 편차
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

  // 3) 부적합 판정, 입력란 색상(노란색/빨간색) 및 상단 알람 배너 반영
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

  // 만약 이전에 캘리브레이션 완료 초기화를 눌렀던 날짜에 다시 새 값을 입력하면 초기화 기준일 해제
  let resetCleared = false;
  if (equipmentCalibState.resetAfterDate?.[machine] && dateKey <= equipmentCalibState.resetAfterDate[machine]) {
    delete equipmentCalibState.resetAfterDate[machine];
    resetCleared = true;
  }

  saveSingleEquipmentFieldToCloud(dateKey, machine, field, rawVal, resetCleared);
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
      // 다음 장비의 첫 행으로 이동
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
 * 실시간 판정 UI 업데이트 (입력란 노란색/빨간색 변경 & 상단 알람 배너 & 일별 편차 요약)
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

    // 1) 장비명 셀 배지 및 배경색 업데이트
    const machineCell = document.getElementById(`calib-machine-cell-${mIdx}`);
    const machineBadge = document.getElementById(`calib-machine-badge-${mIdx}`);
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

    // 3) 요일별 개별 편차 판정 및 부적합 항목 강조
    weekDateKeys.forEach((dKey, dIdx) => {
      const ev = evaluateMachineDay(dKey, machine);
      const evalCell = document.getElementById(`calib-eval-${mIdx}-${dIdx}`);

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

      if (!ev.hasAnyInput) {
        evalCell.innerHTML = `<span style="color: #cbd5e1;">미입력</span>`;
        return;
      }

      const diffLines = [];
      if (ev.diff12X !== null) {
        diffLines.push(`<span style="color: ${ev.fail12X ? '#dc2626; font-weight:800;' : '#475569;'}">12시X: ${ev.diff12X.toFixed(2)}</span>`);
      }
      if (ev.diff6X !== null) {
        diffLines.push(`<span style="color: ${ev.fail6X ? '#dc2626; font-weight:800;' : '#475569;'}">6시X: ${ev.diff6X.toFixed(2)}</span>`);
      }
      if (ev.diffZ !== null) {
        diffLines.push(`<span style="color: ${ev.failZ ? '#dc2626; font-weight:800;' : '#475569;'}">Z차: ${ev.diffZ.toFixed(2)}</span>`);
      }

      if (ev.isFail) {
        evalCell.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 2px; align-items: center;">
            <span style="background: #fee2e2; color: #b91c1c; border: 1px solid #f87171; font-weight: 800; padding: 1px 6px; border-radius: 999px; font-size: 10.5px;">
              ❌ 부적합
            </span>
            <div style="font-size: 10.5px; line-height: 1.25;">${diffLines.join(' · ')}</div>
          </div>
        `;
      } else if (ev.hasAnyPair) {
        evalCell.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 2px; align-items: center;">
            <span style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 800; padding: 1px 6px; border-radius: 999px; font-size: 10.5px;">
              ⭕ 적합
            </span>
            <div style="font-size: 10.5px; line-height: 1.25;">${diffLines.join(' · ')}</div>
          </div>
        `;
      } else {
        evalCell.innerHTML = `<span style="color: #94a3b8; font-size: 10.5px;">입력 중...</span>`;
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
// 캘리브레이션 일자 선택 모달 기능 (1주일 중 선택)
// =========================================================================
function openEquipCalibModal(machine) {
  const modal = document.getElementById('equip-calib-modal');
  const titleEl = document.getElementById('equip-calib-modal-title');
  const machineInput = document.getElementById('modal-equip-machine-name');
  const selectEl = document.getElementById('modal-equip-date-select');
  if (!modal || !selectEl) return;

  if (titleEl) titleEl.innerText = `🔧 ${machine} 캘리브레이션 등록`;
  if (machineInput) machineInput.value = machine;

  const weekDates = getWeekDatesFromMonday(currentEquipMonday);
  const todayKey = formatEquipDateKey(new Date());
  const existingResetDate = equipmentCalibState.resetAfterDate?.[machine] || '';

  // 1주일(월~일) 선택 옵션 생성
  let optionsHtml = '';
  weekDates.forEach((d, idx) => {
    const dKey = formatEquipDateKey(d);
    const dayName = WEEK_DAY_LABELS[idx];
    const isToday = (dKey === todayKey);
    const isCurrentReset = (dKey === existingResetDate);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} (${dayName}요일)${isToday ? ' - 오늘' : ''}${isCurrentReset ? ' [현재 등록됨]' : ''}`;
    const selected = isCurrentReset || (!existingResetDate && isToday);
    optionsHtml += `<option value="${dKey}" ${selected ? 'selected' : ''}>${label}</option>`;
  });

  selectEl.innerHTML = optionsHtml;
  modal.classList.add('active');
}

function closeEquipCalibModal() {
  const modal = document.getElementById('equip-calib-modal');
  if (modal) modal.classList.remove('active');
}

function submitEquipCalibDate(e) {
  if (e) e.preventDefault();
  const machine = document.getElementById('modal-equip-machine-name')?.value;
  const selectedDate = document.getElementById('modal-equip-date-select')?.value;
  if (!machine || !selectedDate) return;

  if (!equipmentCalibState.resetAfterDate) equipmentCalibState.resetAfterDate = {};
  equipmentCalibState.resetAfterDate[machine] = selectedDate;

  saveStoredEquipmentCalib(true);
  closeEquipCalibModal();
  renderEquipmentTab();
}

function cancelMachineCalibration() {
  const machine = document.getElementById('modal-equip-machine-name')?.value;
  if (!machine) return;

  if (!confirm(`${machine}의 캘리브레이션 등록 기록을 해제하시겠습니까?`)) return;

  if (equipmentCalibState.resetAfterDate && equipmentCalibState.resetAfterDate[machine]) {
    delete equipmentCalibState.resetAfterDate[machine];
    saveStoredEquipmentCalib(true);
  }

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
