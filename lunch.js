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
  eatingCount: 5, // 오늘 식사 인원 (기본: 오늘 출근 인원수)
  orders: [] // [ { id, restaurantId, restaurantName, menuName, price, quantity, note } ]
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
    const defaultWorkingCount = getTodayWorkingCount();

    if (savedDaily) {
      const parsed = JSON.parse(savedDaily);
      if (parsed.date === todayStr) {
        lunchDailyState = parsed;
        if (lunchDailyState.eatingCount === undefined || lunchDailyState.eatingCount === null) {
          lunchDailyState.eatingCount = defaultWorkingCount;
        }
      } else {
        lunchDailyState = {
          date: todayStr,
          perPersonBudget: parsed.perPersonBudget || 10000,
          eatingCount: defaultWorkingCount,
          orders: []
        };
      }
    } else {
      lunchDailyState = {
        date: todayStr,
        perPersonBudget: 10000,
        eatingCount: defaultWorkingCount,
        orders: []
      };
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

// 오늘 출근 인원수 계산 (근무표 기준)
function getTodayWorkingCount() {
  const todayStr = getTodayDateStr();
  let workingMembers = [];
  try {
    if (typeof getBaseWorkListForDate === 'function') {
      workingMembers = getBaseWorkListForDate(todayStr);
    }
  } catch (e) {
    console.warn('getBaseWorkListForDate error:', e);
  }

  if (!workingMembers || workingMembers.length === 0) {
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingMembers = ['용희', '세진', '소영', '이슬', '서영'];
    } else {
      workingMembers = ['세진'];
    }
  }
  return workingMembers.length;
}

// 점심 탭 메인 렌더링
function renderLunchTab() {
  renderLunchHeaderBudgetBadge();
  renderLunchEatingCountSection();
  renderLunchRouletteCandidates();
  renderLunchRestaurantTabs();
  renderLunchMenuList();
  renderLunchOrdersTable();
}

// 상단 헤더 식대 배지 표시
function renderLunchHeaderBudgetBadge() {
  const badgeEl = document.getElementById('lunch-header-per-budget');
  if (badgeEl) {
    badgeEl.innerText = (lunchDailyState.perPersonBudget || 10000).toLocaleString();
  }
}

// 1. 오늘 식사 인원 및 예산 계산 섹션 렌더링
function renderLunchEatingCountSection() {
  const countInput = document.getElementById('lunch-eating-count-input');
  const perBudgetText = document.getElementById('lunch-summary-per-budget');
  const totalBudgetText = document.getElementById('lunch-summary-total-budget');
  const workingCountInfo = document.getElementById('lunch-working-count-info');

  const workingCount = getTodayWorkingCount();
  if (workingCountInfo) {
    workingCountInfo.innerText = `(오늘 출근: ${workingCount}명)`;
  }

  const eatingCount = (lunchDailyState.eatingCount !== undefined && lunchDailyState.eatingCount !== null) 
    ? lunchDailyState.eatingCount 
    : workingCount;
  
  if (countInput) countInput.value = eatingCount;

  const perBudget = lunchDailyState.perPersonBudget || 10000;
  if (perBudgetText) perBudgetText.innerText = `${perBudget.toLocaleString()}원`;

  const totalBudget = eatingCount * perBudget;
  if (totalBudgetText) totalBudgetText.innerText = `${totalBudget.toLocaleString()}원`;
}

// 인원수 증감 (+ / -)
function changeEatingCount(delta) {
  const current = lunchDailyState.eatingCount !== undefined ? lunchDailyState.eatingCount : getTodayWorkingCount();
  lunchDailyState.eatingCount = Math.max(0, current + delta);
  saveStoredLunchData();
  renderLunchEatingCountSection();
  renderLunchOrdersTable(); // 예산 변경에 따른 주문서 오바체크 실시간 갱신
}

// 인원수 직접 입력
function updateEatingCountDirect(val) {
  const num = parseInt(val, 10);
  lunchDailyState.eatingCount = isNaN(num) || num < 0 ? 0 : num;
  saveStoredLunchData();
  renderLunchEatingCountSection();
  renderLunchOrdersTable();
}

// 근무표 기준 오늘 출근인원으로 재설정
function resetEatingCountToWorking() {
  const workingCount = getTodayWorkingCount();
  lunchDailyState.eatingCount = workingCount;
  saveStoredLunchData();
  renderLunchEatingCountSection();
  renderLunchOrdersTable();
}

// 식대 설정 모달
function openBudgetModal() {
  const inputEl = document.getElementById('modal-budget-input');
  if (inputEl) {
    inputEl.value = lunchDailyState.perPersonBudget || 10000;
  }
  document.getElementById('lunch-budget-modal').classList.add('active');
}

function closeBudgetModal() {
  document.getElementById('lunch-budget-modal').classList.remove('active');
}

function submitBudgetModal(e) {
  if (e) e.preventDefault();
  const inputEl = document.getElementById('modal-budget-input');
  const val = parseInt(inputEl.value, 10);
  if (isNaN(val) || val < 0) {
    alert('올바른 식대 금액을 입력해주세요.');
    return;
  }
  lunchDailyState.perPersonBudget = val;
  saveStoredLunchData();
  closeBudgetModal();
  renderLunchTab();
}

// 2. 희망 식당 선택 & 랜덤 룰렛 기능 (10개 식당 항상 전체 다 표시)
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
      currentDelay += 10;
      setTimeout(rollStep, currentDelay);
    } else {
      // 최종 당첨 식당 결정
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

// 3. 식당별 메뉴판 및 식당 목록 2줄 배치 (5개씩 2줄)
function renderLunchRestaurantTabs() {
  const container = document.getElementById('restaurant-tab-bar');
  if (!container) return;

  container.innerHTML = lunchRestaurants.map(rest => `
    <button type="button" class="restaurant-tab-btn ${rest.id === selectedRestaurantId ? 'active' : ''}" onclick="selectRestaurantTab('${rest.id}')">
      <div>${escapeHtml(rest.name)}</div>
      <div style="font-size: 11px; opacity: 0.8; font-weight: normal;">${escapeHtml(rest.category)} (${rest.menus ? rest.menus.length : 0})</div>
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

  container.innerHTML = menus.map(m => {
    // 현재 주문서에 몇 개 담겨있는지 확인
    const currentOrder = (lunchDailyState.orders || []).find(o => o.restaurantId === rest.id && o.menuName === m.name);
    const currentQty = currentOrder ? currentOrder.quantity : 0;

    return `
      <div class="menu-item-card">
        <div>
          <div class="menu-item-name">${escapeHtml(m.name)}</div>
          <div class="menu-item-price">${m.price.toLocaleString()}원</div>
          ${currentQty > 0 ? `<span style="font-size: 11px; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">주문서에 ${currentQty}개 담김</span>` : ''}
        </div>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button type="button" class="btn-primary" style="padding: 5px 11px; font-size: 12.5px; font-weight: 800;" onclick="addMenuDirectToOrder('${rest.id}', '${m.id}')" title="주문서에 담기 (클릭할 때마다 1개씩 추가)">
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
    `;
  }).join('');
}

// 메뉴 클릭 시 즉시 주문서에 1개 담기 (더 누르면 2개, 3개 누적)
function addMenuDirectToOrder(restId, menuId) {
  const rest = lunchRestaurants.find(r => r.id === restId);
  const menu = rest ? rest.menus.find(m => m.id === menuId) : null;
  if (!rest || !menu) return;

  if (!lunchDailyState.orders) lunchDailyState.orders = [];

  // 주문서에 이미 같은 식당의 같은 메뉴가 있는지 확인
  const existingOrder = lunchDailyState.orders.find(o => o.restaurantId === rest.id && o.menuName === menu.name);

  if (existingOrder) {
    existingOrder.quantity = (existingOrder.quantity || 1) + 1;
  } else {
    lunchDailyState.orders.push({
      id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      restaurantId: rest.id,
      restaurantName: rest.name,
      menuName: menu.name,
      price: menu.price,
      quantity: 1,
      note: ''
    });
  }

  saveStoredLunchData();
  renderLunchMenuList();
  renderLunchOrdersTable();
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
    const menu = rest.menus.find(m => m.id === editMenuTargetMenuId);
    if (menu) {
      menu.name = name;
      menu.price = price;
    }
  } else {
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

// 4. 오늘 점심 주문서 테이블 및 실시간 예산 비교 렌더링
function renderLunchOrdersTable() {
  const tbody = document.getElementById('lunch-orders-tbody');
  const summaryBox = document.getElementById('lunch-orders-aggregated-box');
  const budgetBanner = document.getElementById('lunch-order-budget-comparison');
  if (!tbody) return;

  const orders = lunchDailyState.orders || [];

  // 1. 실시간 예산 비교 계산
  const eatingCount = (lunchDailyState.eatingCount !== undefined && lunchDailyState.eatingCount !== null) 
    ? lunchDailyState.eatingCount 
    : getTodayWorkingCount();
  const perBudget = lunchDailyState.perPersonBudget || 10000;
  const totalBudget = eatingCount * perBudget;
  const totalOrderPrice = orders.reduce((sum, ord) => sum + (ord.price * (ord.quantity || 1)), 0);
  const diff = totalOrderPrice - totalBudget;

  if (budgetBanner) {
    let statusBadgeHtml = '';
    if (totalOrderPrice === 0) {
      statusBadgeHtml = `<span class="budget-status-badge" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;">메뉴를 담아주세요</span>`;
    } else if (diff > 0) {
      statusBadgeHtml = `
        <span class="budget-status-badge budget-status-over">
          🚨 예산 ${diff.toLocaleString()}원 오바 (+${diff.toLocaleString()}원)
        </span>
      `;
    } else if (diff === 0) {
      statusBadgeHtml = `
        <span class="budget-status-badge budget-status-ok">
          ✨ 예산 100% 딱 맞춤! (오바 없음)
        </span>
      `;
    } else {
      const remaining = Math.abs(diff);
      statusBadgeHtml = `
        <span class="budget-status-badge budget-status-ok">
          ✅ 예산 ${remaining.toLocaleString()}원 남음 (-${remaining.toLocaleString()}원 여유)
        </span>
      `;
    }

    budgetBanner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div>
          <span style="font-size: 12px; color: #64748b;">오늘 총 예산:</span>
          <strong style="font-size: 15px; color: #0f172a; margin-left: 4px;">${totalBudget.toLocaleString()}원</strong>
        </div>
        <div style="color: #cbd5e1;">|</div>
        <div>
          <span style="font-size: 12px; color: #64748b;">주문 합계:</span>
          <strong style="font-size: 16px; color: #2563eb; margin-left: 4px;">${totalOrderPrice.toLocaleString()}원</strong>
        </div>
      </div>
      <div>
        ${statusBadgeHtml}
      </div>
    `;
  }

  // 2. 주문 테이블 렌더링
  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 35px 10px; color: #94a3b8; font-size: 13.5px;">
          🍚 아직 담긴 점심 메뉴가 없습니다.<br>
          <span style="font-size: 12px; color: #cbd5e1; margin-top: 4px; display: inline-block;">
            위 식당 메뉴판에서 [담기 +] 버튼을 누르면 즉시 주문서에 추가됩니다!
          </span>
        </td>
      </tr>
    `;
    if (summaryBox) summaryBox.innerHTML = '<span style="color: #94a3b8; font-size: 13px;">주문된 메뉴가 없습니다.</span>';
    return;
  }

  tbody.innerHTML = orders.map((ord, idx) => {
    const itemTotal = ord.price * (ord.quantity || 1);
    return `
      <tr>
        <td style="text-align: center; width: 40px; color: #64748b; font-weight: 600;">${idx + 1}</td>
        <td style="width: 100px;">
          <span class="supplier-chip" style="font-weight: 700;">${escapeHtml(ord.restaurantName)}</span>
        </td>
        <td style="font-weight: 700; color: #0f172a;">${escapeHtml(ord.menuName)}</td>
        <td style="text-align: right; color: #64748b; font-size: 12.5px; width: 80px;">${ord.price.toLocaleString()}원</td>
        <td style="text-align: center; width: 105px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 3px;">
            <button type="button" onclick="changeLunchOrderQty('${ord.id}', -1)" style="padding: 2px 7px; font-size: 12px; font-weight: 800;">-</button>
            <input type="number" min="1" value="${ord.quantity || 1}" style="width: 40px; text-align: center; padding: 3px; font-size: 13px; font-weight: 800; border: 1px solid #cbd5e1; border-radius: 4px;" onchange="updateLunchOrderQtyDirect('${ord.id}', this.value)" />
            <button type="button" onclick="changeLunchOrderQty('${ord.id}', 1)" style="padding: 2px 7px; font-size: 12px; font-weight: 800;">+</button>
          </div>
        </td>
        <td style="text-align: right; font-weight: 800; color: #2563eb; width: 90px;">${itemTotal.toLocaleString()}원</td>
        <td>
          <input type="text" value="${escapeHtml(ord.note || '')}" placeholder="비고(요청사항)" style="width: 100%; padding: 4px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;" onchange="updateLunchOrderNote('${ord.id}', this.value)" />
        </td>
        <td style="text-align: center; width: 44px;">
          <button type="button" class="btn-danger" style="padding: 3px 7px; font-size: 11px;" onclick="deleteLunchOrder('${ord.id}')">✕</button>
        </td>
      </tr>
    `;
  }).join('');

  // 3. 식당 주문용 최종 합산 요약표 렌더링
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
              <span style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 9px; border-radius: 6px; font-size: 13px; font-weight: 700; color: #0f172a;">
                ${escapeHtml(mName)} <strong style="color: #2563eb;">× ${qty}개</strong>
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }
    summaryBox.innerHTML = summaryHtml;
  }
}

// 수량 변경
function changeLunchOrderQty(orderId, delta) {
  const ord = lunchDailyState.orders.find(o => o.id === orderId);
  if (ord) {
    const newQty = (ord.quantity || 1) + delta;
    if (newQty <= 0) {
      if (confirm(`'${ord.menuName}' 메뉴를 주문서에서 삭제하시겠습니까?`)) {
        lunchDailyState.orders = lunchDailyState.orders.filter(o => o.id !== orderId);
      }
    } else {
      ord.quantity = newQty;
    }
    saveStoredLunchData();
    renderLunchMenuList();
    renderLunchOrdersTable();
  }
}

function updateLunchOrderQtyDirect(orderId, val) {
  const ord = lunchDailyState.orders.find(o => o.id === orderId);
  if (ord) {
    const num = parseInt(val, 10);
    ord.quantity = isNaN(num) || num < 1 ? 1 : num;
    saveStoredLunchData();
    renderLunchMenuList();
    renderLunchOrdersTable();
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
  renderLunchMenuList();
  renderLunchOrdersTable();
}

function clearAllLunchOrders() {
  if ((lunchDailyState.orders || []).length === 0) return;
  if (!confirm('오늘의 점심 주문 목록을 모두 비우시겠습니까?')) return;
  lunchDailyState.orders = [];
  saveStoredLunchData();
  renderLunchMenuList();
  renderLunchOrdersTable();
}

// 카카오톡 단톡방 공유용 텍스트 복사
function copyLunchOrderText() {
  const orders = lunchDailyState.orders || [];
  if (orders.length === 0) {
    alert('복사할 주문 내역이 없습니다.');
    return;
  }

  const todayStr = lunchDailyState.date || getTodayDateStr();
  const eatingCount = (lunchDailyState.eatingCount !== undefined && lunchDailyState.eatingCount !== null) 
    ? lunchDailyState.eatingCount 
    : getTodayWorkingCount();
  const perBudget = lunchDailyState.perPersonBudget || 10000;
  const totalBudget = eatingCount * perBudget;
  const totalOrderPrice = orders.reduce((sum, ord) => sum + (ord.price * (ord.quantity || 1)), 0);
  const diff = totalOrderPrice - totalBudget;

  let txt = `🍱 [BD DENTAL LAB 점심 주문서]\n`;
  txt += `📅 일자: ${todayStr}\n`;
  txt += `👥 식사 인원: ${eatingCount}명 (1인 식대: ${perBudget.toLocaleString()}원)\n`;
  txt += `💰 총 예산: ${totalBudget.toLocaleString()}원 / 총 주문액: ${totalOrderPrice.toLocaleString()}원\n`;
  if (diff > 0) txt += `🚨 초과(오바) 금액: +${diff.toLocaleString()}원\n`;
  else if (diff < 0) txt += `✅ 잔여 예산: -${Math.abs(diff).toLocaleString()}원 남음\n`;
  else txt += `✨ 예산 100% 딱 맞춤!\n`;
  txt += `------------------------------------\n`;

  txt += `[식당별 메뉴 주문 취합]\n`;
  const aggByRest = {};
  orders.forEach(o => {
    if (!aggByRest[o.restaurantName]) aggByRest[o.restaurantName] = {};
    const rMap = aggByRest[o.restaurantName];
    rMap[o.menuName] = (rMap[o.menuName] || 0) + (o.quantity || 1);
  });
  for (const [rName, mMap] of Object.entries(aggByRest)) {
    txt += `▶ ${rName}: `;
    const items = Object.entries(mMap).map(([mName, q]) => `${mName} × ${q}개`).join(', ');
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
