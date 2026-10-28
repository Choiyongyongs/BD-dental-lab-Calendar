/**
 * =========================================================================
 * BD Dental Lab - 점심 식사 주문서 & 식당 룰렛 스크립트 (lunch.js)
 * =========================================================================
 */

// 1. 10개 식당 및 기본 대표 메뉴 프리셋 (차후 사용자가 자유롭게 수정/추가/삭제 가능)
const DEFAULT_RESTAURANTS_DATA = [
  {
    id: 'rest_01',
    name: '칭마레이',
    category: '중식',
    menus: [
      { id: 'm_cm_01', name: '짜장면', price: 7000 },
      { id: 'm_cm_02', name: '해물짬뽕', price: 9000 },
      { id: 'm_cm_03', name: '볶음밥', price: 8500 },
      { id: 'm_cm_04', name: '탕수육(소)', price: 18000 }
    ]
  },
  {
    id: 'rest_02',
    name: '후우후',
    category: '일식/덮밥',
    menus: [
      { id: 'm_hh_01', name: '가츠동', price: 9500 },
      { id: 'm_hh_02', name: '사케동', price: 12000 },
      { id: 'm_hh_03', name: '돈코츠라멘', price: 9000 },
      { id: 'm_hh_04', name: '에비카레', price: 10000 }
    ]
  },
  {
    id: 'rest_03',
    name: '임방식당',
    category: '한식/백반',
    menus: [
      { id: 'm_ib_01', name: '제육볶음 백반', price: 9000 },
      { id: 'm_ib_02', name: '김치찌개', price: 8500 },
      { id: 'm_ib_03', name: '된장찌개', price: 8500 },
      { id: 'm_ib_04', name: '뚝배기불고기', price: 10000 }
    ]
  },
  {
    id: 'rest_04',
    name: '육수당',
    category: '국밥/수육',
    menus: [
      { id: 'm_ys_01', name: '서울식 국밥', price: 9500 },
      { id: 'm_ys_02', name: '순대국밥', price: 9500 },
      { id: 'm_ys_03', name: '소머리곰탕', price: 11000 },
      { id: 'm_ys_04', name: '수육 한접시', price: 16000 }
    ]
  },
  {
    id: 'rest_05',
    name: '또또김밥',
    category: '분식',
    menus: [
      { id: 'm_tt_01', name: '또또야채김밥', price: 4000 },
      { id: 'm_tt_02', name: '참치마요김밥', price: 5000 },
      { id: 'm_tt_03', name: '치즈라볶이', price: 7000 },
      { id: 'm_tt_04', name: '어묵탕 세트', price: 6500 }
    ]
  },
  {
    id: 'rest_06',
    name: '고릴라쿡',
    category: '양식/덮밥',
    menus: [
      { id: 'm_gr_01', name: '함박스테이크', price: 10500 },
      { id: 'm_gr_02', name: '치킨마요덮밥', price: 8500 },
      { id: 'm_gr_03', name: '목살필라프', price: 9500 },
      { id: 'm_gr_04', name: '까르보나라 파스타', price: 10000 }
    ]
  },
  {
    id: 'rest_07',
    name: '카페그리닝',
    category: '샐러드/샌드위치',
    menus: [
      { id: 'm_gn_01', name: '치킨텐더 샌드위치', price: 7800 },
      { id: 'm_gn_02', name: '리코타치즈 샐러드', price: 8900 },
      { id: 'm_gn_03', name: '클럽 샌드위치', price: 8000 },
      { id: 'm_gn_04', name: '아메리카노 세트', price: 9900 }
    ]
  },
  {
    id: 'rest_08',
    name: '취향마라',
    category: '마라탕',
    menus: [
      { id: 'm_qm_01', name: '마라탕 기본(소고기추가)', price: 11000 },
      { id: 'm_qm_02', name: '마라샹궈 1인', price: 15000 },
      { id: 'm_qm_03', name: '꿔바로우(미니)', price: 12000 },
      { id: 'm_qm_04', name: '계란볶음밥', price: 7500 }
    ]
  },
  {
    id: 'rest_09',
    name: '진심 왕돈가스',
    category: '돈까스',
    menus: [
      { id: 'm_js_01', name: '진심 왕돈가스', price: 10500 },
      { id: 'm_js_02', name: '치즈폭탄 돈가스', price: 12000 },
      { id: 'm_js_03', name: '냉모밀 세트', price: 11000 },
      { id: 'm_js_04', name: '어묵우동', price: 7500 }
    ]
  },
  {
    id: 'rest_10',
    name: '마테아',
    category: '이탈리안',
    menus: [
      { id: 'm_mt_01', name: '마르게리따 피자', price: 14000 },
      { id: 'm_mt_02', name: '감베리 로제 파스타', price: 12000 },
      { id: 'm_mt_03', name: '봉골레 오일 파스타', price: 11500 },
      { id: 'm_mt_04', name: '트러플 버섯 리조또', price: 13000 }
    ]
  }
];

// 로컬스토리지 키
const STORAGE_KEY_LUNCH_RESTS = 'bd_lunch_restaurants_data';
const STORAGE_KEY_LUNCH_DAILY = 'bd_lunch_daily_order';

// 상태 관리
let lunchRestaurants = JSON.parse(JSON.stringify(DEFAULT_RESTAURANTS_DATA));
let selectedRestaurantId = 'rest_01'; // 현재 메뉴판 보고 있는 식당
let candidateRestaurantIds = DEFAULT_RESTAURANTS_DATA.map(r => r.id); // 룰렛 후보 식당들

// 당일 점심 주문 상태
let lunchDailyState = {
  date: '', // YYYY-MM-DD
  perPersonBudget: 10000, // 1인당 기본 기준 식대 (10,000원)
  attendance: {}, // { '용희': { isWorking: true, isEating: true } }
  orders: [] // [ { id, member, restaurantId, restaurantName, menuName, price, note, quantity } ]
};

let rouletteTimer = null;
let isRouletteRunning = false;

// 모듈 초기화
function initLunchModule() {
  loadStoredLunchData();
  setupLunchFirestoreListeners();
}

function loadStoredLunchData() {
  try {
    const savedRests = localStorage.getItem(STORAGE_KEY_LUNCH_RESTS);
    if (savedRests) {
      lunchRestaurants = JSON.parse(savedRests);
    }
    const savedDaily = localStorage.getItem(STORAGE_KEY_LUNCH_DAILY);
    const todayStr = getTodayDateStr();
    if (savedDaily) {
      const parsed = JSON.parse(savedDaily);
      // 날짜가 같으면 복원, 날짜가 바뀌었으면 새로운 오늘 날짜로 초기화
      if (parsed.date === todayStr) {
        lunchDailyState = parsed;
      } else {
        lunchDailyState.date = todayStr;
        resetDailyAttendanceForToday();
      }
    } else {
      lunchDailyState.date = todayStr;
      resetDailyAttendanceForToday();
    }
  } catch (e) {
    console.error('loadStoredLunchData err:', e);
  }
}

function saveStoredLunchData() {
  try {
    localStorage.setItem(STORAGE_KEY_LUNCH_RESTS, JSON.stringify(lunchRestaurants));
    localStorage.setItem(STORAGE_KEY_LUNCH_DAILY, JSON.stringify(lunchDailyState));
    if (window.firebaseDb) {
      // 메뉴 데이터 동기화
      window.firebaseDb.collection('lunch').doc('restaurants').set({
        list: lunchRestaurants,
        updatedAt: new Date().toISOString()
      }).catch(e => console.warn('Firestore lunch rests err:', e));

      // 당일 주문 및 인원 동기화
      window.firebaseDb.collection('lunch').doc('today_order').set({
        daily: lunchDailyState,
        updatedAt: new Date().toISOString()
      }).catch(e => console.warn('Firestore today order err:', e));
    }
  } catch (e) {
    console.error('saveStoredLunchData err:', e);
  }
}

function setupLunchFirestoreListeners() {
  if (!window.firebaseDb) return;
  // 식당 & 메뉴 실시간 동기화
  window.firebaseDb.collection('lunch').doc('restaurants').onSnapshot(doc => {
    if (doc.exists && doc.data() && doc.data().list) {
      lunchRestaurants = doc.data().list;
      localStorage.setItem(STORAGE_KEY_LUNCH_RESTS, JSON.stringify(lunchRestaurants));
      if (document.getElementById('tab-lunch') && document.getElementById('tab-lunch').classList.contains('active')) {
        renderLunchRestaurantTabs();
        renderLunchMenuList();
      }
    }
  }, err => console.warn('Firestore lunch listener note:', err));

  // 당일 주문 및 인원 실시간 동기화
  window.firebaseDb.collection('lunch').doc('today_order').onSnapshot(doc => {
    if (doc.exists && doc.data() && doc.data().daily) {
      const incoming = doc.data().daily;
      const todayStr = getTodayDateStr();
      if (incoming.date === todayStr) {
        lunchDailyState = incoming;
        localStorage.setItem(STORAGE_KEY_LUNCH_DAILY, JSON.stringify(lunchDailyState));
        if (document.getElementById('tab-lunch') && document.getElementById('tab-lunch').classList.contains('active')) {
          renderLunchTab();
        }
      }
    }
  }, err => console.warn('Firestore today order listener note:', err));
}

// 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayDateStr() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 근무표 연동을 통한 오늘 출근자 자동 세팅
function resetDailyAttendanceForToday() {
  const members = ['용희', '세진', '소영', '이슬', '서영', '찬유'];
  const todayStr = getTodayDateStr();
  
  // 기존 근무표 함수로 오늘 근무자 계산 시도
  let workingMembers = [];
  try {
    if (typeof getBaseWorkListForDate === 'function') {
      workingMembers = getBaseWorkListForDate(todayStr);
    }
  } catch (e) {
    console.warn('getBaseWorkListForDate fallback:', e);
  }

  // 만약 계산된 근무자가 없으면 기본적으로 6명 중 주말/휴일 여부에 따라 세팅
  const dayOfWeek = new Date().getDay();
  if (workingMembers.length === 0) {
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingMembers = ['용희', '세진', '소영', '이슬', '서영']; // 평일 기본
    } else {
      workingMembers = ['세진']; // 주말 당직 기본
    }
  }

  lunchDailyState.attendance = {};
  members.forEach(m => {
    const isWork = workingMembers.includes(m);
    lunchDailyState.attendance[m] = {
      isWorking: isWork,
      isEating: isWork // 출근자는 기본적으로 밥 먹는 것으로 초기화
    };
  });
}

// 점심 탭 메인 렌더링
function renderLunchTab() {
  renderLunchAttendanceSection();
  renderLunchBudgetSummary();
  renderLunchRouletteCandidates();
  renderLunchRestaurantTabs();
  renderLunchMenuList();
  renderLunchOrdersTable();
}

// 1. 인원수 체크 섹션 렌더링
function renderLunchAttendanceSection() {
  const container = document.getElementById('lunch-attendance-container');
  if (!container) return;

  const members = ['용희', '세진', '소영', '이슬', '서영', '찬유'];
  if (!lunchDailyState.attendance || Object.keys(lunchDailyState.attendance).length === 0) {
    resetDailyAttendanceForToday();
  }

  container.innerHTML = members.map(m => {
    const att = lunchDailyState.attendance[m] || { isWorking: false, isEating: false };
    const workClass = att.isWorking ? 'is-working' : 'is-off';
    const eatClass = att.isEating ? 'is-eating' : '';

    return `
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; background: #ffffff; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div style="font-weight: 800; color: #0f172a; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <span>👤 ${m}</span>
          ${att.isWorking ? '<span style="font-size: 11px; background: #ecfdf5; color: #059669; padding: 2px 6px; border-radius: 4px; font-weight: 700;">출근</span>' : '<span style="font-size: 11px; background: #f1f5f9; color: #94a3b8; padding: 2px 6px; border-radius: 4px;">휴무</span>'}
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="attendance-chip ${workClass}" style="padding: 4px 9px; font-size: 11.5px;" onclick="toggleMemberWorking('${m}')" title="오늘 출근 여부 토글">
            ${att.isWorking ? '🏢 출근함' : '🏠 휴무/외출'}
          </button>
          <button type="button" class="attendance-chip ${eatClass}" style="padding: 4px 9px; font-size: 11.5px;" onclick="toggleMemberEating('${m}')" title="오늘 점심 식사 참여 여부 토글">
            ${att.isEating ? '🍚 밥 먹음' : '❌ 점심 안먹음'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 2. 예산 및 인원수 계산기 요약 렌더링
function renderLunchBudgetSummary() {
  const workingCountEl = document.getElementById('lunch-stat-working-count');
  const eatingCountEl = document.getElementById('lunch-stat-eating-count');
  const totalBudgetEl = document.getElementById('lunch-stat-total-budget');
  const totalOrderEl = document.getElementById('lunch-stat-total-order');
  const balanceBadgeEl = document.getElementById('lunch-stat-balance-badge');
  const budgetInputEl = document.getElementById('lunch-per-budget-input');

  const members = Object.keys(lunchDailyState.attendance || {});
  const workingCount = members.filter(m => lunchDailyState.attendance[m]?.isWorking).length;
  const eatingCount = members.filter(m => lunchDailyState.attendance[m]?.isEating).length;

  const perBudget = lunchDailyState.perPersonBudget || 10000;
  if (budgetInputEl) budgetInputEl.value = perBudget;

  const totalBudget = eatingCount * perBudget;
  const totalOrderPrice = (lunchDailyState.orders || []).reduce((sum, ord) => sum + (ord.price * (ord.quantity || 1)), 0);
  const diff = totalOrderPrice - totalBudget;

  if (workingCountEl) workingCountEl.innerText = `${workingCount}명`;
  if (eatingCountEl) eatingCountEl.innerText = `${eatingCount}명`;
  if (totalBudgetEl) totalBudgetEl.innerText = `${totalBudget.toLocaleString()}원`;
  if (totalOrderEl) totalOrderEl.innerText = `${totalOrderPrice.toLocaleString()}원`;

  if (balanceBadgeEl) {
    if (eatingCount === 0) {
      balanceBadgeEl.innerHTML = `<span class="budget-status-badge budget-status-ok">식사 인원을 체크해주세요</span>`;
    } else if (diff > 0) {
      balanceBadgeEl.innerHTML = `
        <span class="budget-status-badge budget-status-over">
          🚨 예산 ${diff.toLocaleString()}원 초과! (+${diff.toLocaleString()}원)
        </span>
      `;
    } else if (diff === 0) {
      balanceBadgeEl.innerHTML = `
        <span class="budget-status-badge budget-status-ok">
          ✨ 예산 100% 딱 맞춤! (초과 없음)
        </span>
      `;
    } else {
      const remaining = Math.abs(diff);
      balanceBadgeEl.innerHTML = `
        <span class="budget-status-badge budget-status-ok">
          ✅ 예산 내 주문 (${remaining.toLocaleString()}원 여유)
        </span>
      `;
    }
  }
}

function updatePerPersonBudget(val) {
  const num = parseInt(val, 10);
  lunchDailyState.perPersonBudget = isNaN(num) || num < 0 ? 10000 : num;
  saveStoredLunchData();
  renderLunchBudgetSummary();
}

function toggleMemberWorking(member) {
  if (!lunchDailyState.attendance[member]) {
    lunchDailyState.attendance[member] = { isWorking: false, isEating: false };
  }
  const curr = lunchDailyState.attendance[member];
  curr.isWorking = !curr.isWorking;
  // 출근을 끄면 식사도 같이 꺼줌
  if (!curr.isWorking) curr.isEating = false;
  // 출근을 켜면 식사도 켜줌
  else curr.isEating = true;

  saveStoredLunchData();
  renderLunchAttendanceSection();
  renderLunchBudgetSummary();
}

function toggleMemberEating(member) {
  if (!lunchDailyState.attendance[member]) {
    lunchDailyState.attendance[member] = { isWorking: true, isEating: false };
  }
  const curr = lunchDailyState.attendance[member];
  curr.isEating = !curr.isEating;
  saveStoredLunchData();
  renderLunchAttendanceSection();
  renderLunchBudgetSummary();
}

// 3. 희망 식당 선택 칩 & 랜덤 룰렛 기능
function renderLunchRouletteCandidates() {
  const container = document.getElementById('restaurant-candidate-grid');
  if (!container) return;

  container.innerHTML = lunchRestaurants.map(rest => {
    const isSelected = candidateRestaurantIds.includes(rest.id);
    return `
      <div class="restaurant-chip ${isSelected ? 'selected' : ''}" onclick="toggleCandidateRestaurant('${rest.id}')">
        ${isSelected ? '✓ ' : ''}${escapeHtml(rest.name)}
        <div style="font-size: 11px; opacity: 0.8; font-weight: normal; margin-top: 2px;">${escapeHtml(rest.category)}</div>
      </div>
    `;
  }).join('');
}

function toggleCandidateRestaurant(restId) {
  if (candidateRestaurantIds.includes(restId)) {
    if (candidateRestaurantIds.length <= 1) {
      alert('최소 1개 이상의 식당을 선택해야 룰렛을 돌릴 수 있습니다!');
      return;
    }
    candidateRestaurantIds = candidateRestaurantIds.filter(id => id !== restId);
  } else {
    candidateRestaurantIds.push(restId);
  }
  renderLunchRouletteCandidates();
}

function selectAllCandidateRestaurants(selectAll) {
  if (selectAll) {
    candidateRestaurantIds = lunchRestaurants.map(r => r.id);
  } else {
    candidateRestaurantIds = [lunchRestaurants[0].id];
  }
  renderLunchRouletteCandidates();
}

// 룰렛 돌리기 애니메이션
function runLunchRoulette() {
  if (isRouletteRunning) return;
  if (candidateRestaurantIds.length === 0) {
    alert('희망하는 식당을 1개 이상 선택해주세요!');
    return;
  }

  isRouletteRunning = true;
  const displayBox = document.getElementById('roulette-result-display');
  const btn = document.getElementById('btn-run-roulette');
  if (btn) btn.disabled = true;

  let counter = 0;
  const totalIterations = 24; // 롤링 횟수
  let currentDelay = 50;

  const rollStep = () => {
    const randomIdx = Math.floor(Math.random() * candidateRestaurantIds.length);
    const candidateId = candidateRestaurantIds[randomIdx];
    const rest = lunchRestaurants.find(r => r.id === candidateId);

    if (displayBox && rest) {
      displayBox.innerHTML = `
        <div style="font-size: 13px; color: #9333ea; font-weight: 700;">🎲 식당 추첨 중...</div>
        <div class="roulette-winner-text" style="color: #64748b; font-size: 24px;">${escapeHtml(rest.name)}</div>
      `;
    }

    counter++;
    if (counter < totalIterations) {
      currentDelay += 10; // 점점 느려지는 효과
      setTimeout(rollStep, currentDelay);
    } else {
      // 최종 당첨자 선정!
      const winnerId = candidateRestaurantIds[Math.floor(Math.random() * candidateRestaurantIds.length)];
      const winner = lunchRestaurants.find(r => r.id === winnerId);
      isRouletteRunning = false;
      if (btn) btn.disabled = false;

      if (displayBox && winner) {
        displayBox.innerHTML = `
          <div style="font-size: 14px; font-weight: 800; color: #e11d48; margin-bottom: 4px;">🎉 오늘의 당첨 식당!</div>
          <div class="roulette-winner-text" style="font-size: 28px; color: #7e22ce;">🍱 ${escapeHtml(winner.name)}</div>
          <div style="font-size: 12.5px; color: #64748b; margin-top: 6px;">
            [${escapeHtml(winner.category)}] 맛있는 점심식사 되세요! 
            <button type="button" class="btn-primary" style="margin-left: 8px; padding: 4px 10px; font-size: 12px;" onclick="selectRestaurantTab('${winner.id}')">
              👉 이 식당 메뉴 보러가기
            </button>
          </div>
        `;
        selectRestaurantTab(winner.id);
      }
    }
  };

  rollStep();
}

// 4. 식당별 메뉴판 및 메뉴 관리
function renderLunchRestaurantTabs() {
  const container = document.getElementById('restaurant-tab-bar');
  if (!container) return;

  container.innerHTML = lunchRestaurants.map(rest => `
    <button type="button" class="restaurant-tab-btn ${rest.id === selectedRestaurantId ? 'active' : ''}" onclick="selectRestaurantTab('${rest.id}')">
      ${escapeHtml(rest.name)} <span style="font-size: 11px; opacity: 0.8;">(${rest.menus ? rest.menus.length : 0})</span>
    </button>
  `).join('');
}

function selectRestaurantTab(restId) {
  selectedRestaurantId = restId;
  renderLunchRestaurantTabs();
  renderLunchMenuList();
}

function renderLunchMenuList() {
  const container = document.getElementById('restaurant-menu-list-grid');
  const currentRestTitle = document.getElementById('selected-restaurant-title');
  if (!container) return;

  const rest = lunchRestaurants.find(r => r.id === selectedRestaurantId);
  if (!rest) return;

  if (currentRestTitle) {
    currentRestTitle.innerHTML = `🍴 <strong>${escapeHtml(rest.name)}</strong> <span style="font-size: 13px; font-weight: normal; color: #64748b;">(${escapeHtml(rest.category)}) 메뉴판</span>`;
  }

  const menus = rest.menus || [];
  if (menus.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #94a3b8; font-size: 13px;">
        등록된 메뉴가 없습니다. 우측 '➕ 새 메뉴 추가' 버튼을 눌러 등록해주세요!
      </div>
    `;
    return;
  }

  container.innerHTML = menus.map(m => `
    <div class="menu-item-card">
      <div>
        <div class="menu-item-name">${escapeHtml(m.name)}</div>
        <div class="menu-item-price">${m.price.toLocaleString()}원</div>
      </div>
      <div style="display: flex; gap: 4px; align-items: center;">
        <button type="button" class="btn-primary" style="padding: 4px 9px; font-size: 12px;" onclick="openAddMenuToOrderModal('${rest.id}', '${m.id}')" title="주문서에 담기">
          담기 +
        </button>
        <button type="button" style="padding: 4px 6px; font-size: 11px; color: #64748b;" onclick="openEditMenuModal('${rest.id}', '${m.id}')" title="메뉴 수정">
          ✏️
        </button>
        <button type="button" class="btn-danger" style="padding: 4px 6px; font-size: 11px;" onclick="deleteRestaurantMenu('${rest.id}', '${m.id}')" title="메뉴 삭제">
          ✕
        </button>
      </div>
    </div>
  `).join('');
}

// 메뉴 추가/수정 모달 핸들링
let editMenuTargetRestId = null;
let editMenuTargetMenuId = null;

function openAddMenuModal() {
  editMenuTargetRestId = selectedRestaurantId;
  editMenuTargetMenuId = null;
  const rest = lunchRestaurants.find(r => r.id === selectedRestaurantId);

  document.getElementById('modal-menu-rest-name').innerText = rest ? rest.name : '';
  document.getElementById('modal-menu-name-input').value = '';
  document.getElementById('modal-menu-price-input').value = '';
  document.getElementById('menu-manage-modal-title').innerText = '➕ 새 메뉴 추가';
  document.getElementById('menu-manage-modal').classList.add('active');
}

function openEditMenuModal(restId, menuId) {
  editMenuTargetRestId = restId;
  editMenuTargetMenuId = menuId;
  const rest = lunchRestaurants.find(r => r.id === restId);
  const menu = rest ? rest.menus.find(m => m.id === menuId) : null;
  if (!menu) return;

  document.getElementById('modal-menu-rest-name').innerText = rest.name;
  document.getElementById('modal-menu-name-input').value = menu.name;
  document.getElementById('modal-menu-price-input').value = menu.price;
  document.getElementById('menu-manage-modal-title').innerText = '✏️ 메뉴 수정';
  document.getElementById('menu-manage-modal').classList.add('active');
}

function closeMenuManageModal() {
  document.getElementById('menu-manage-modal').classList.remove('active');
}

function submitMenuManage(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('modal-menu-name-input').value.trim();
  const price = parseInt(document.getElementById('modal-menu-price-input').value, 10);

  if (!name) {
    alert('메뉴명을 입력해주세요.');
    return;
  }
  if (isNaN(price) || price < 0) {
    alert('올바른 가격(원)을 입력해주세요.');
    return;
  }

  const rest = lunchRestaurants.find(r => r.id === editMenuTargetRestId);
  if (!rest) return;

  if (editMenuTargetMenuId) {
    // 수정
    const menu = rest.menus.find(m => m.id === editMenuTargetMenuId);
    if (menu) {
      menu.name = name;
      menu.price = price;
    }
  } else {
    // 추가
    rest.menus.push({
      id: 'm_' + Date.now(),
      name,
      price
    });
  }

  saveStoredLunchData();
  closeMenuManageModal();
  renderLunchRestaurantTabs();
  renderLunchMenuList();
}

function deleteRestaurantMenu(restId, menuId) {
  const rest = lunchRestaurants.find(r => r.id === restId);
  if (!rest) return;
  const menu = rest.menus.find(m => m.id === menuId);
  if (!menu) return;

  if (!confirm(`'${menu.name}' 메뉴를 삭제하시겠습니까?`)) return;
  rest.menus = rest.menus.filter(m => m.id !== menuId);
  saveStoredLunchData();
  renderLunchRestaurantTabs();
  renderLunchMenuList();
}

// 5. 주문서 담기 (직원 지정)
let selectedOrderRestId = null;
let selectedOrderMenuId = null;

function openAddMenuToOrderModal(restId, menuId) {
  selectedOrderRestId = restId;
  selectedOrderMenuId = menuId;

  const rest = lunchRestaurants.find(r => r.id === restId);
  const menu = rest ? rest.menus.find(m => m.id === menuId) : null;
  if (!menu) return;

  document.getElementById('order-modal-info').innerHTML = `
    <strong>${escapeHtml(rest.name)}</strong> - <span style="color: #2563eb; font-weight: 800;">${escapeHtml(menu.name)}</span> (${menu.price.toLocaleString()}원)
  `;

  // 식사 참여 직원 우선 세팅
  const members = ['용희', '세진', '소영', '이슬', '서영', '찬유'];
  const selectEl = document.getElementById('order-modal-member-select');
  selectEl.innerHTML = members.map(m => {
    const isEating = lunchDailyState.attendance[m]?.isEating;
    return `<option value="${m}">${m} ${isEating ? '(식사 참여)' : '(미참여)'}</option>`;
  }).join('') + `<option value="공용/사이드">공용/사이드 메뉴</option>`;

  document.getElementById('order-modal-qty').value = 1;
  document.getElementById('order-modal-note').value = '';
  document.getElementById('add-order-modal').classList.add('active');
}

function closeAddOrderModal() {
  document.getElementById('add-order-modal').classList.remove('active');
}

function submitAddOrder(e) {
  if (e) e.preventDefault();
  const member = document.getElementById('order-modal-member-select').value;
  const qty = parseInt(document.getElementById('order-modal-qty').value, 10) || 1;
  const note = document.getElementById('order-modal-note').value.trim();

  const rest = lunchRestaurants.find(r => r.id === selectedOrderRestId);
  const menu = rest ? rest.menus.find(m => m.id === selectedOrderMenuId) : null;
  if (!rest || !menu) return;

  // 만약 해당 직원이 식사 미참여 상태라면 자동으로 참여로 전환
  if (member !== '공용/사이드' && lunchDailyState.attendance[member] && !lunchDailyState.attendance[member].isEating) {
    lunchDailyState.attendance[member].isEating = true;
  }

  lunchDailyState.orders.push({
    id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    member,
    restaurantId: rest.id,
    restaurantName: rest.name,
    menuName: menu.name,
    price: menu.price,
    quantity: qty,
    note
  });

  saveStoredLunchData();
  closeAddOrderModal();
  renderLunchTab();
}

// 6. 오늘 점심 주문서 테이블 및 취합 요약 렌더링
function renderLunchOrdersTable() {
  const tbody = document.getElementById('lunch-orders-tbody');
  const summaryBox = document.getElementById('lunch-orders-aggregated-box');
  if (!tbody) return;

  const orders = lunchDailyState.orders || [];

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 35px 10px; color: #94a3b8; font-size: 13.5px;">
          🍚 아직 담긴 점심 메뉴가 없습니다.<br>
          <span style="font-size: 12px; color: #cbd5e1; margin-top: 4px; display: inline-block;">
            위 식당 메뉴판에서 먹고 싶은 메뉴의 [담기 +] 버튼을 눌러주세요!
          </span>
        </td>
      </tr>
    `;
    if (summaryBox) summaryBox.innerHTML = '<span style="color: #94a3b8; font-size: 13px;">주문된 메뉴가 없습니다.</span>';
    return;
  }

  tbody.innerHTML = orders.map((ord, idx) => `
    <tr>
      <td style="text-align: center; width: 40px; color: #64748b; font-weight: 600;">${idx + 1}</td>
      <td style="width: 100px;">
        <span style="font-weight: 800; color: #1e3a8a; background: #e0e7ff; padding: 3px 8px; border-radius: 6px; font-size: 12.5px;">
          ${escapeHtml(ord.member)}
        </span>
      </td>
      <td style="width: 110px;">
        <span class="supplier-chip" style="font-weight: 700;">${escapeHtml(ord.restaurantName)}</span>
      </td>
      <td style="font-weight: 700; color: #0f172a;">${escapeHtml(ord.menuName)}</td>
      <td style="text-align: right; font-weight: 700; color: #2563eb; width: 90px;">${ord.price.toLocaleString()}원</td>
      <td style="text-align: center; width: 85px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 3px;">
          <button type="button" onclick="changeLunchOrderQty('${ord.id}', -1)" style="padding: 1px 5px; font-size: 11px;">-</button>
          <span style="font-weight: 800; min-width: 20px; text-align: center;">${ord.quantity || 1}</span>
          <button type="button" onclick="changeLunchOrderQty('${ord.id}', 1)" style="padding: 1px 5px; font-size: 11px;">+</button>
        </div>
      </td>
      <td>
        <input type="text" value="${escapeHtml(ord.note || '')}" placeholder="비고(요청사항)" style="width: 100%; padding: 4px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;" onchange="updateLunchOrderNote('${ord.id}', this.value)" />
      </td>
      <td style="text-align: center; width: 44px;">
        <button type="button" class="btn-danger" style="padding: 3px 7px; font-size: 11px;" onclick="deleteLunchOrder('${ord.id}')">✕</button>
      </td>
    </tr>
  `).join('');

  // 식당 주문용 최종 합산 요약표 렌더링 (예: 칭마레이: 짜장면 2개, 짬뽕 1개)
  if (summaryBox) {
    const aggByRest = {};
    orders.forEach(o => {
      if (!aggByRest[o.restaurantName]) aggByRest[o.restaurantName] = {};
      const restMap = aggByRest[o.restaurantName];
      const key = o.menuName;
      restMap[key] = (restMap[key] || 0) + (o.quantity || 1);
    });

    let summaryHtml = '';
    for (const [restName, menus] of Object.entries(aggByRest)) {
      summaryHtml += `
        <div style="margin-bottom: 10px; border-left: 3px solid #3b82f6; padding-left: 10px;">
          <div style="font-weight: 800; color: #1e3a8a; font-size: 13.5px; margin-bottom: 4px;">🍱 ${escapeHtml(restName)}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${Object.entries(menus).map(([mName, qty]) => `
              <span style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 6px; font-size: 12.5px; font-weight: 700; color: #0f172a;">
                ${escapeHtml(mName)} <strong style="color: #2563eb;">× ${qty}</strong>
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }
    summaryBox.innerHTML = summaryHtml;
  }
}

function changeLunchOrderQty(orderId, delta) {
  const ord = lunchDailyState.orders.find(o => o.id === orderId);
  if (ord) {
    ord.quantity = Math.max(1, (ord.quantity || 1) + delta);
    saveStoredLunchData();
    renderLunchTab();
  }
}

function updateLunchOrderNote(orderId, note) {
  const ord = lunchDailyState.orders.find(o => o.id === orderId);
  if (ord) {
    ord.note = note;
    saveStoredLunchData();
  }
}

function deleteLunchOrder(orderId) {
  lunchDailyState.orders = lunchDailyState.orders.filter(o => o.id !== orderId);
  saveStoredLunchData();
  renderLunchTab();
}

function clearAllLunchOrders() {
  if ((lunchDailyState.orders || []).length === 0) return;
  if (!confirm('오늘의 점심 주문 목록을 모두 비우시겠습니까?')) return;
  lunchDailyState.orders = [];
  saveStoredLunchData();
  renderLunchTab();
}

// 7. 카카오톡 단톡방 공유용 텍스트 복사
function copyLunchOrderText() {
  const orders = lunchDailyState.orders || [];
  if (orders.length === 0) {
    alert('복사할 주문 내역이 없습니다.');
    return;
  }

  const todayStr = lunchDailyState.date || getTodayDateStr();
  const eatingCount = Object.keys(lunchDailyState.attendance || {}).filter(m => lunchDailyState.attendance[m]?.isEating).length;
  const perBudget = lunchDailyState.perPersonBudget || 10000;
  const totalBudget = eatingCount * perBudget;
  const totalOrderPrice = orders.reduce((sum, ord) => sum + (ord.price * (ord.quantity || 1)), 0);
  const diff = totalOrderPrice - totalBudget;

  let txt = `🍱 [BD DENTAL LAB 점심 주문서]\n`;
  txt += `📅 일자: ${todayStr}\n`;
  txt += `👥 식사 인원: ${eatingCount}명 (1인 예산: ${perBudget.toLocaleString()}원)\n`;
  txt += `💰 총 예산: ${totalBudget.toLocaleString()}원 / 총 주문액: ${totalOrderPrice.toLocaleString()}원\n`;
  if (diff > 0) txt += `🚨 초과 금액: +${diff.toLocaleString()}원\n`;
  else if (diff < 0) txt += `✅ 잔여 예산: -${Math.abs(diff).toLocaleString()}원 여유\n`;
  else txt += `✨ 예산 정확히 일치!\n`;
  txt += `------------------------------------\n`;

  // 직원별 주문 내역
  txt += `[직원별 주문]\n`;
  orders.forEach(o => {
    txt += `• ${o.member}: ${o.restaurantName} - ${o.menuName}`;
    if (o.quantity > 1) txt += ` × ${o.quantity}`;
    txt += ` (${(o.price * o.quantity).toLocaleString()}원)`;
    if (o.note) txt += ` [${o.note}]`;
    txt += `\n`;
  });

  txt += `------------------------------------\n`;
  txt += `[식당별 메뉴 합산 주문용]\n`;
  const aggByRest = {};
  orders.forEach(o => {
    if (!aggByRest[o.restaurantName]) aggByRest[o.restaurantName] = {};
    const rMap = aggByRest[o.restaurantName];
    rMap[o.menuName] = (rMap[o.menuName] || 0) + (o.quantity || 1);
  });
  for (const [rName, mMap] of Object.entries(aggByRest)) {
    txt += `▶ ${rName}: `;
    const items = Object.entries(mMap).map(([mName, q]) => `${mName} ${q}개`).join(', ');
    txt += items + `\n`;
  }
  txt += `------------------------------------\n`;
  txt += `맛있게 드세요! 😋`;

  navigator.clipboard.writeText(txt).then(() => {
    alert('✅ 오늘 점심 주문서 텍스트가 복사되었습니다!\n단톡방이나 배달 주문 창에 붙여넣어 공유하세요.');
  }).catch(() => {
    prompt('아래 텍스트를 복사하세요:', txt);
  });
}
