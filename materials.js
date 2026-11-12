/**
 * =========================================================================
 * BD Dental Lab - 재료 주문 관리 스크립트 (materials.js)
 * =========================================================================
 */

// 지원 카테고리 목록
const MATERIAL_CATEGORIES = ['더메이트', '쿠팡', '다이소', '기타'];

// 초기 고정 마스터 목록은 사용하지 않고 주문 통계 및 등록 기반으로 구성
const DEFAULT_MATERIAL_MASTER = [];

// 상태 변수
let materialMasterList = [];
let materialDeletedNames = []; // 목록에서 명시적으로 삭제한 재료명 (자동 재등록 방지)
let materialOrders = [];
let materialSavedHistory = [];
let materialOrderStatsLog = []; // 주간 초기화/삭제 후에도 누적 주문 통계를 유지하기 위한 기록
let materialCategoryFilter = 'ALL';
let materialSearchKeyword = '';
let materialSupplierFilter = 'ALL';
let materialFirestoreUnsubscribes = [];

// 로컬스토리지 키
const STORAGE_KEY_MAT_MASTER = 'bd_material_custom_master';
const STORAGE_KEY_MAT_DELETED = 'bd_material_deleted_names';
const STORAGE_KEY_MAT_ORDERS = 'bd_material_current_orders';
const STORAGE_KEY_MAT_SAVED_HISTORY = 'bd_material_saved_history';
const STORAGE_KEY_MAT_STATS_LOG = 'bd_material_order_stats_log';

function getMaterialFirestoreDb() {
  return window.firebaseDb || (typeof firebaseDb !== 'undefined' ? firebaseDb : null);
}

// 카테고리 정규화 (기존 카테고리 데이터를 더메이트/쿠팡/다이소/기타로 변환)
function normalizeMaterialCategory(cat) {
  if (!cat) return '더메이트';
  const trimmed = String(cat).trim();
  if (MATERIAL_CATEGORIES.includes(trimmed)) return trimmed;
  if (trimmed.includes('쿠팡')) return '쿠팡';
  if (trimmed.includes('다이소')) return '다이소';
  if (
    trimmed.includes('더메이트') ||
    trimmed.includes('신흥') ||
    trimmed.includes('한일') ||
    trimmed.includes('오스템') ||
    trimmed.includes('덴티움') ||
    ['CAD/CAM', '포세린', '레진', '석고', '메탈', '소모품', '기본'].includes(trimmed)
  ) {
    return '더메이트';
  }
  return '기타';
}

// 재료명 비교용 정규화 (공백 및 대소문자 무시)
function normalizeMaterialName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

// 카테고리별 배지 스타일 반환
function getCategoryBadgeStyle(cat) {
  const normalized = normalizeMaterialCategory(cat);
  switch (normalized) {
    case '더메이트':
      return 'color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe;';
    case '쿠팡':
      return 'color: #e11d48; background: #fff1f2; border: 1px solid #fecdd3;';
    case '다이소':
      return 'color: #d97706; background: #fffbeb; border: 1px solid #fde68a;';
    case '기타':
    default:
      return 'color: #475569; background: #f1f5f9; border: 1px solid #cbd5e1;';
  }
}

// 초기 로드
function initMaterialsModule() {
  loadStoredMaterials();
  syncMasterListFromOrders();
  setupMaterialFirestoreListeners();
  renderMaterialTab();
}

function loadStoredMaterials() {
  try {
    const savedCustom = localStorage.getItem(STORAGE_KEY_MAT_MASTER);
    if (savedCustom) {
      const parsed = JSON.parse(savedCustom);
      if (Array.isArray(parsed)) {
        // 예전 기본 33종(mat_01 ~ mat_33) 중 주문 이력이 없는 항목 제외 및 카테고리 정규화
        materialMasterList = parsed
          .filter(m => m && m.name && !/^mat_\d+$/.test(String(m.id || '')))
          .map(m => ({
            ...m,
            name: String(m.name).trim(),
            category: normalizeMaterialCategory(m.category || m.defaultSupplier),
            defaultSupplier: normalizeMaterialCategory(m.category || m.defaultSupplier)
          }));
      }
    }
    const savedOrders = localStorage.getItem(STORAGE_KEY_MAT_ORDERS);
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders);
      if (Array.isArray(parsedOrders)) {
        materialOrders = parsedOrders.map(o => ({
          ...o,
          category: normalizeMaterialCategory(o.category || o.supplier),
          supplier: normalizeMaterialCategory(o.category || o.supplier)
        }));
      }
    }
    const savedHistory = localStorage.getItem(STORAGE_KEY_MAT_SAVED_HISTORY);
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      if (Array.isArray(parsedHistory)) {
        materialSavedHistory = parsedHistory;
      }
    }
    const savedStatsLog = localStorage.getItem(STORAGE_KEY_MAT_STATS_LOG);
    if (savedStatsLog) {
      const parsedLog = JSON.parse(savedStatsLog);
      if (Array.isArray(parsedLog)) {
        materialOrderStatsLog = parsedLog;
      }
    }
    const savedDeleted = localStorage.getItem(STORAGE_KEY_MAT_DELETED);
    if (savedDeleted) {
      const parsedDel = JSON.parse(savedDeleted);
      if (Array.isArray(parsedDel)) {
        materialDeletedNames = parsedDel;
      }
    }
  } catch (e) {
    console.error('Failed to load local materials data:', e);
  }
}

// 주문 내역(현재 발주, 저장된 입고체크 내역, 누적 로그)에 있는 재료들을 자주 시키는 재료 목록에 자동 반영 및 중복 병합
function syncMasterListFromOrders() {
  const byNormName = new Map();
  const deletedSet = new Set((materialDeletedNames || []).map(n => normalizeMaterialName(n)));

  // 1) 기존 마스터 목록 정리 (동일 이름 병합)
  (materialMasterList || []).forEach(item => {
    if (!item || !item.name) return;
    const norm = normalizeMaterialName(item.name);
    if (!norm || deletedSet.has(norm)) return;
    const cat = normalizeMaterialCategory(item.category || item.defaultSupplier);
    if (!byNormName.has(norm)) {
      byNormName.set(norm, {
        id: item.id || ('mat_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
        name: String(item.name).trim(),
        category: cat,
        defaultSupplier: cat
      });
    }
  });

  // 2) 누적 로그, 저장 히스토리, 현재 주문 목록에서 누락된 재료 자동 추가
  const ensureFromRecord = (name, cat, allowEvenIfDeleted = false) => {
    const cleanName = String(name || '').trim();
    const norm = normalizeMaterialName(cleanName);
    if (!norm) return;
    if (!allowEvenIfDeleted && deletedSet.has(norm)) return;
    const normCat = normalizeMaterialCategory(cat);
    if (!byNormName.has(norm)) {
      byNormName.set(norm, {
        id: 'mat_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: cleanName,
        category: normCat,
        defaultSupplier: normCat
      });
    }
  };

  (materialOrderStatsLog || []).forEach(rec => {
    if (rec && !rec.deleted) ensureFromRecord(rec.name, rec.category || rec.supplier, false);
  });

  (materialSavedHistory || []).forEach(batch => {
    (batch.items || []).forEach(it => {
      ensureFromRecord(it.name, it.category || it.supplier, false);
    });
  });

  (materialOrders || []).forEach(ord => {
    ensureFromRecord(ord.name, ord.category || ord.supplier, true);
  });

  materialMasterList = Array.from(byNormName.values());

  // 현재 발주 목록의 itemId 및 카테고리 동기화
  (materialOrders || []).forEach(ord => {
    const matched = byNormName.get(normalizeMaterialName(ord.name));
    if (matched) {
      ord.itemId = matched.id;
      ord.category = matched.category;
      ord.supplier = matched.category;
    }
  });

  updateFrequentMaterialDatalist();
}

// 재료명 자동완성 datalist 갱신
function updateFrequentMaterialDatalist() {
  const datalist = document.getElementById('frequent-material-datalist');
  if (!datalist) return;
  const statsMap = getMaterialOrderStatsMap();
  const sorted = [...(materialMasterList || [])].sort((a, b) => {
    const sa = statsMap.get(normalizeMaterialName(a.name)) || { total: 0, month: 0 };
    const sb = statsMap.get(normalizeMaterialName(b.name)) || { total: 0, month: 0 };
    if (sb.total !== sa.total) return sb.total - sa.total;
    return a.name.localeCompare(b.name, 'ko');
  });
  datalist.innerHTML = sorted
    .map(m => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.category)}</option>`)
    .join('');
}

// 재료별 [총 주문수 / 월 주문수] 계산
function getMaterialOrderStatsMap() {
  const uniqueOrders = new Map();

  // 1) 누적 아카이브 로그
  (materialOrderStatsLog || []).forEach(rec => {
    if (!rec || !rec.id || rec.deleted) return;
    uniqueOrders.set(rec.id, {
      id: rec.id,
      name: rec.name,
      quantity: Math.max(1, Number(rec.quantity) || 1),
      dateStr: rec.createdAt || rec.savedAt || ''
    });
  });

  // 2) 입고 확인용 저장된 발주 목록
  (materialSavedHistory || []).forEach(batch => {
    const batchDate = batch.savedAt || '';
    (batch.items || []).forEach((it, idx) => {
      const recId = it.id || `${batch.id}_${idx}`;
      uniqueOrders.set(recId, {
        id: recId,
        name: it.name,
        quantity: Math.max(1, Number(it.quantity) || 1),
        dateStr: it.createdAt || batchDate
      });
    });
  });

  // 3) 현재 이번 주 발주 목록 (가장 최신 수량 우선 반영)
  (materialOrders || []).forEach(ord => {
    if (!ord || !ord.id) return;
    uniqueOrders.set(ord.id, {
      id: ord.id,
      name: ord.name,
      quantity: Math.max(1, Number(ord.quantity) || 1),
      dateStr: ord.createdAt || new Date().toISOString()
    });
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const statsMap = new Map();
  uniqueOrders.forEach(rec => {
    const norm = normalizeMaterialName(rec.name);
    if (!norm) return;
    if (!statsMap.has(norm)) {
      statsMap.set(norm, { total: 0, month: 0 });
    }
    const entry = statsMap.get(norm);
    const qty = Math.max(1, Number(rec.quantity) || 1);
    entry.total += qty;

    let isCurrentMonth = false;
    if (rec.dateStr) {
      const d = new Date(rec.dateStr);
      if (!isNaN(d.getTime())) {
        if (d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth) {
          isCurrentMonth = true;
        }
      } else if (String(rec.dateStr).startsWith(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)) {
        isCurrentMonth = true;
      }
    }
    if (isCurrentMonth) {
      entry.month += qty;
    }
  });

  return statsMap;
}

// 현재 발주 품목들을 누적 통계 로그에 기록 (목록 저장 또는 주문 초기화 시 호출)
function archiveOrdersToStatsLog(ordersToArchive) {
  if (!Array.isArray(ordersToArchive) || ordersToArchive.length === 0) return;
  if (!Array.isArray(materialOrderStatsLog)) materialOrderStatsLog = [];

  const byId = new Map(materialOrderStatsLog.map(r => [r.id, r]));
  ordersToArchive.forEach(ord => {
    if (!ord || !ord.id) return;
    byId.set(ord.id, {
      id: ord.id,
      itemId: ord.itemId || '',
      name: ord.name,
      category: normalizeMaterialCategory(ord.category || ord.supplier),
      quantity: Math.max(1, Number(ord.quantity) || 1),
      createdAt: ord.createdAt || new Date().toISOString()
    });
  });

  materialOrderStatsLog = Array.from(byId.values());
  saveStoredMaterialStatsLog();
}

function saveStoredMaterialStatsLog() {
  try {
    localStorage.setItem(STORAGE_KEY_MAT_STATS_LOG, JSON.stringify(materialOrderStatsLog));
    const db = getMaterialFirestoreDb();
    if (db) {
      db.collection('materials').doc('order_stats_log').set({
        logs: materialOrderStatsLog,
        updatedAt: new Date().toISOString()
      }).catch(err => console.warn('Firestore order_stats_log sync err:', err));
    }
  } catch (e) {
    console.error('saveStoredMaterialStatsLog error:', e);
  }
}

function saveStoredMaterialsOrders() {
  try {
    localStorage.setItem(STORAGE_KEY_MAT_ORDERS, JSON.stringify(materialOrders));
    const db = getMaterialFirestoreDb();
    if (db) {
      db.collection('materials').doc('current_orders').set({
        orders: materialOrders,
        updatedAt: new Date().toISOString()
      }).catch(err => console.warn('Firestore material orders sync err:', err));
    }
  } catch (e) {
    console.error('saveStoredMaterialsOrders error:', e);
  }
}

function saveStoredMaterialHistory() {
  try {
    localStorage.setItem(STORAGE_KEY_MAT_SAVED_HISTORY, JSON.stringify(materialSavedHistory));
    const db = getMaterialFirestoreDb();
    if (db) {
      db.collection('materials').doc('saved_history').set({
        history: materialSavedHistory,
        updatedAt: new Date().toISOString()
      }).catch(err => console.warn('Firestore material saved_history sync err:', err));
    }
  } catch (e) {
    console.error('saveStoredMaterialHistory error:', e);
  }
}

function saveCustomMasterItem() {
  try {
    localStorage.setItem(STORAGE_KEY_MAT_MASTER, JSON.stringify(materialMasterList));
    localStorage.setItem(STORAGE_KEY_MAT_DELETED, JSON.stringify(materialDeletedNames || []));
    updateFrequentMaterialDatalist();
    const db = getMaterialFirestoreDb();
    if (db) {
      db.collection('materials').doc('custom_master').set({
        items: materialMasterList,
        deletedNames: materialDeletedNames || [],
        updatedAt: new Date().toISOString()
      }).catch(err => console.warn('Firestore custom master sync err:', err));
    }
  } catch (e) {
    console.error('saveCustomMasterItem error:', e);
  }
}

function setupMaterialFirestoreListeners() {
  const db = getMaterialFirestoreDb();
  if (!db) return;

  if (Array.isArray(materialFirestoreUnsubscribes) && materialFirestoreUnsubscribes.length > 0) {
    materialFirestoreUnsubscribes.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
    materialFirestoreUnsubscribes = [];
  }

  // 1. 실시간 이번 주 발주 목록 동기화
  const unsubOrders = db.collection('materials').doc('current_orders').onSnapshot(doc => {
    if (typeof updateCloudStatusBadge === 'function') updateCloudStatusBadge('connected', 'DB 연결됨');
    if (doc.metadata && doc.metadata.hasPendingWrites) return;
    if (doc.exists && doc.data() && Array.isArray(doc.data().orders)) {
      materialOrders = doc.data().orders.map(o => ({
        ...o,
        category: normalizeMaterialCategory(o.category || o.supplier),
        supplier: normalizeMaterialCategory(o.category || o.supplier)
      }));
      localStorage.setItem(STORAGE_KEY_MAT_ORDERS, JSON.stringify(materialOrders));
      syncMasterListFromOrders();
      renderMaterialTab();
      const capModal = document.getElementById('material-capture-modal');
      if (capModal && capModal.classList.contains('active')) {
        renderCapturePreviewContent();
      }
    } else if (!doc.exists && materialOrders.length > 0) {
      saveStoredMaterialsOrders();
    }
  }, err => console.warn('Firestore material listener note:', err));

  // 2. 자주 주문하는 재료 마스터 실시간 동기화
  const unsubMaster = db.collection('materials').doc('custom_master').onSnapshot(doc => {
    if (typeof updateCloudStatusBadge === 'function') updateCloudStatusBadge('connected', 'DB 연결됨');
    if (doc.metadata && doc.metadata.hasPendingWrites) return;
    if (doc.exists && doc.data() && Array.isArray(doc.data().items)) {
      if (Array.isArray(doc.data().deletedNames)) {
        materialDeletedNames = doc.data().deletedNames;
        localStorage.setItem(STORAGE_KEY_MAT_DELETED, JSON.stringify(materialDeletedNames));
      }
      const customItems = doc.data().items
        .filter(m => m && m.name && !/^mat_\d+$/.test(String(m.id || '')))
        .map(m => ({
          ...m,
          name: String(m.name).trim(),
          category: normalizeMaterialCategory(m.category || m.defaultSupplier),
          defaultSupplier: normalizeMaterialCategory(m.category || m.defaultSupplier)
        }));
      materialMasterList = customItems;
      syncMasterListFromOrders();
      localStorage.setItem(STORAGE_KEY_MAT_MASTER, JSON.stringify(materialMasterList));
      renderMaterialMasterGrid();
      renderMaterialSupplierChips();
    } else if (!doc.exists && materialMasterList.length > 0) {
      saveCustomMasterItem();
    }
  }, err => console.warn('Firestore material master listener note:', err));

  // 3. 저장된 발주 목록 (입고 확인 체크리스트) 실시간 동기화
  const unsubHistory = db.collection('materials').doc('saved_history').onSnapshot(doc => {
    if (typeof updateCloudStatusBadge === 'function') updateCloudStatusBadge('connected', 'DB 연결됨');
    if (doc.metadata && doc.metadata.hasPendingWrites) return;
    if (doc.exists && doc.data() && Array.isArray(doc.data().history)) {
      materialSavedHistory = doc.data().history;
      localStorage.setItem(STORAGE_KEY_MAT_SAVED_HISTORY, JSON.stringify(materialSavedHistory));
      syncMasterListFromOrders();
      renderMaterialTab();
    } else if (!doc.exists && materialSavedHistory.length > 0) {
      saveStoredMaterialHistory();
    }
  }, err => console.warn('Firestore material saved_history listener note:', err));

  // 4. 누적 주문 통계 로그 실시간 동기화
  const unsubStats = db.collection('materials').doc('order_stats_log').onSnapshot(doc => {
    if (typeof updateCloudStatusBadge === 'function') updateCloudStatusBadge('connected', 'DB 연결됨');
    if (doc.metadata && doc.metadata.hasPendingWrites) return;
    if (doc.exists && doc.data() && Array.isArray(doc.data().logs)) {
      materialOrderStatsLog = doc.data().logs;
      localStorage.setItem(STORAGE_KEY_MAT_STATS_LOG, JSON.stringify(materialOrderStatsLog));
      syncMasterListFromOrders();
      renderMaterialMasterGrid();
    } else if (!doc.exists && materialOrderStatsLog.length > 0) {
      saveStoredMaterialStatsLog();
    }
  }, err => console.warn('Firestore material order_stats_log listener note:', err));

  materialFirestoreUnsubscribes.push(unsubOrders, unsubMaster, unsubHistory, unsubStats);
}

// 탭 렌더링 메인 함수
function renderMaterialTab() {
  renderMaterialOrderList();
  renderMaterialMasterGrid();
  renderMaterialSupplierChips();
  renderMaterialSavedHistory();
}

// 발주 대기 목록 렌더링
function renderMaterialOrderList() {
  const tbody = document.getElementById('material-order-tbody');
  const countBadge = document.getElementById('mat-total-count-badge');
  const urgentCountBadge = document.getElementById('mat-urgent-count-badge');
  const checkedCountBadge = document.getElementById('mat-checked-count-badge');
  if (!tbody) return;

  const totalCount = materialOrders.length;
  const urgentCount = materialOrders.filter(o => o.urgency === 'urgent').length;
  const regularCount = totalCount - urgentCount;
  const checkedOrders = materialOrders.filter(o => o.checked);

  if (countBadge) countBadge.innerText = `총 ${totalCount}건 (정기 ${regularCount}건)`;
  if (urgentCountBadge) urgentCountBadge.innerText = `긴급 ${urgentCount}건`;
  if (checkedCountBadge) checkedCountBadge.innerText = `캡쳐선택: ${checkedOrders.length}건`;

  // 카테고리 필터 적용
  let filteredOrders = materialOrders;
  if (materialSupplierFilter !== 'ALL') {
    filteredOrders = materialOrders.filter(o => normalizeMaterialCategory(o.category || o.supplier) === materialSupplierFilter);
  }

  if (filteredOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td style="text-align: center; padding: 40px 10px; color: #94a3b8; font-size: 13.5px;">
          🛒 이번 주 주문할 재료가 아직 없습니다.<br>
          <span style="font-size: 12px; color: #cbd5e1; margin-top: 6px; display: inline-block;">
            좌측 '자주 주문하는 재료 목록'에서 담거나 상단 '🛒 주문하기'를 클릭해 주문해주세요!
          </span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredOrders.map(ord => {
    const isUrgent = ord.urgency === 'urgent';
    const cat = normalizeMaterialCategory(ord.category || ord.supplier);
    const catStyle = getCategoryBadgeStyle(cat);
    const urgencyBadge = isUrgent
      ? `<span class="urgency-badge urgency-urgent" onclick="toggleOrderUrgency('${ord.id}')" title="클릭시 정기 주문으로 변경">🚨 긴급</span>`
      : `<span class="urgency-badge urgency-regular" onclick="toggleOrderUrgency('${ord.id}')" title="클릭시 긴급 주문으로 변경">📦 정기</span>`;

    return `
      <tr class="order-two-line-row ${isUrgent ? 'is-urgent' : ''}">
        <td>
          <div class="order-row-top">
            <input type="checkbox" class="custom-checkbox" ${ord.checked ? 'checked' : ''} onchange="toggleOrderCheck('${ord.id}', this.checked)" title="캡쳐 발주서에 포함" />
            <div class="order-item-title">${escapeHtml(ord.name)}</div>
          </div>
          <div class="order-row-bottom">
            <div class="order-row-meta">
              ${urgencyBadge}
              <span class="supplier-chip" style="${catStyle}">${escapeHtml(cat)}</span>
            </div>
            <div class="order-row-controls">
              <div class="qty-controller">
                <button type="button" class="qty-btn" onclick="changeOrderQty('${ord.id}', -1)" title="1개 감소">-</button>
                <input type="number" class="qty-input" min="1" value="${ord.quantity}" onclick="this.select()" onfocus="this.select()" oninput="updateOrderQtyDirect('${ord.id}', this.value, true)" onchange="updateOrderQtyDirect('${ord.id}', this.value, false)" title="클릭하여 수량 직접 입력" />
                <button type="button" class="qty-btn" onclick="changeOrderQty('${ord.id}', 1)" title="1개 증가">+</button>
              </div>
              <button type="button" class="btn-danger order-delete-btn" onclick="deleteMaterialOrder('${ord.id}')" title="주문 목록에서 삭제">✕</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 자주 주문하는 재료 목록 (3칸 그리드, 주문 통계순 정렬) 렌더링
function renderMaterialMasterGrid() {
  const container = document.getElementById('material-master-grid');
  if (!container) return;

  const statsMap = getMaterialOrderStatsMap();
  const keyword = materialSearchKeyword.trim().toLowerCase();
  let list = [...(materialMasterList || [])];

  if (materialCategoryFilter !== 'ALL') {
    list = list.filter(m => normalizeMaterialCategory(m.category || m.defaultSupplier) === materialCategoryFilter);
  }

  if (keyword) {
    list = list.filter(m =>
      m.name.toLowerCase().includes(keyword) ||
      normalizeMaterialCategory(m.category || m.defaultSupplier).toLowerCase().includes(keyword)
    );
  }

  // 총 주문수 내림차순 -> 월 주문수 내림차순 -> 이름순 정렬
  list.sort((a, b) => {
    const sa = statsMap.get(normalizeMaterialName(a.name)) || { total: 0, month: 0 };
    const sb = statsMap.get(normalizeMaterialName(b.name)) || { total: 0, month: 0 };
    if (sb.total !== sa.total) return sb.total - sa.total;
    if (sb.month !== sa.month) return sb.month - sa.month;
    return a.name.localeCompare(b.name, 'ko');
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 36px 16px; color: #94a3b8; font-size: 13px; line-height: 1.6;">
        📦 등록된 자주 시키는 재료가 없습니다.<br>
        상단 <strong>[🛒 주문하기]</strong> 버튼으로 재료를 주문하면 주문 통계와 함께 이곳에 자동으로 모아집니다!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const normName = normalizeMaterialName(item.name);
    const stats = statsMap.get(normName) || { total: 0, month: 0 };
    const cat = normalizeMaterialCategory(item.category || item.defaultSupplier);
    const catStyle = getCategoryBadgeStyle(cat);

    const matchedOrders = (materialOrders || []).filter(
      o => o.itemId === item.id || normalizeMaterialName(o.name) === normName
    );
    const regularQty = matchedOrders
      .filter(o => o.urgency !== 'urgent')
      .reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);
    const urgentQty = matchedOrders
      .filter(o => o.urgency === 'urgent')
      .reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);
    const totalCartQty = regularQty + urgentQty;

    return `
      <div class="material-item-card ${totalCartQty > 0 ? 'is-in-order' : ''}">
        <div class="material-card-header">
          <span style="font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 5px; ${catStyle}">${escapeHtml(cat)}</span>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; white-space: nowrap;" title="총 주문수 / 월 주문수">
            총 <strong style="color: #0f172a;">${stats.total}</strong> / 월 <strong style="color: #2563eb;">${stats.month}</strong>
          </span>
        </div>
        <div class="material-card-name" onclick="openEditMaterialModal('${item.id}')" title="클릭하여 재료명·카테고리 편집">
          ${escapeHtml(item.name)}
        </div>
        <div class="material-card-footer">
          <button type="button" class="urgency-badge urgency-regular" style="padding: 4px 6px; font-size: 11px;" onclick="quickAddMaterialToOrder('${item.id}', 'regular')">📦 정기담기${regularQty > 0 ? ` (${regularQty})` : ''}</button>
          <button type="button" class="urgency-badge urgency-urgent" style="padding: 4px 6px; font-size: 11px;" onclick="quickAddMaterialToOrder('${item.id}', 'urgent')">🚨 긴급담기${urgentQty > 0 ? ` (${urgentQty})` : ''}</button>
        </div>
      </div>
    `;
  }).join('');
}

// 우측 발주 목록 카테고리 필터 칩 렌더링
function renderMaterialSupplierChips() {
  const container = document.getElementById('mat-supplier-filter-container');
  if (!container) return;

  const presentCategories = Array.from(
    new Set(materialOrders.map(o => normalizeMaterialCategory(o.category || o.supplier)).filter(Boolean))
  );
  // MATERIAL_CATEGORIES 순서대로 정렬
  presentCategories.sort((a, b) => MATERIAL_CATEGORIES.indexOf(a) - MATERIAL_CATEGORIES.indexOf(b));

  let html = `
    <button type="button" class="filter-chip ${materialSupplierFilter === 'ALL' ? 'active' : ''}" onclick="setMaterialSupplierFilter('ALL')">
      전체 보기 (${materialOrders.length})
    </button>
  `;

  presentCategories.forEach(s => {
    const cnt = materialOrders.filter(o => normalizeMaterialCategory(o.category || o.supplier) === s).length;
    html += `
      <button type="button" class="filter-chip ${materialSupplierFilter === s ? 'active' : ''}" onclick="setMaterialSupplierFilter('${escapeHtml(s)}')">
        ${escapeHtml(s)} (${cnt})
      </button>
    `;
  });

  container.innerHTML = html;
}

function setMaterialCategoryFilter(cat) {
  materialCategoryFilter = cat;
  document.querySelectorAll('.mat-cat-btn').forEach(btn => {
    if (btn.getAttribute('data-cat') === cat) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderMaterialMasterGrid();
}

function setMaterialSupplierFilter(sup) {
  materialSupplierFilter = sup;
  renderMaterialSupplierChips();
  renderMaterialOrderList();
}

function handleMaterialSearch(val) {
  materialSearchKeyword = val;
  renderMaterialMasterGrid();
}

// 발주 목록에 재료 담기 (퀵 / 수량 지정)
function quickAddMaterialToOrder(masterId, urgency, addQty = 1) {
  const item = materialMasterList.find(m => m.id === masterId);
  if (!item) return;

  const qtyToAdd = Math.max(1, Number(addQty) || 1);
  const normName = normalizeMaterialName(item.name);
  const cat = normalizeMaterialCategory(item.category || item.defaultSupplier);

  // 이미 발주 목록에 같은 재료 & 같은 긴급도가 있는지 확인
  const existing = materialOrders.find(
    o => (o.itemId === masterId || normalizeMaterialName(o.name) === normName) && o.urgency === urgency
  );
  if (existing) {
    existing.quantity = (Number(existing.quantity) || 1) + qtyToAdd;
    existing.category = cat;
    existing.supplier = cat;
    existing.checked = true;
  } else {
    materialOrders.push({
      id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      itemId: item.id,
      name: item.name,
      category: cat,
      supplier: cat,
      spec: '',
      urgency: urgency, // 'urgent' or 'regular'
      quantity: qtyToAdd,
      unit: '',
      applicant: '용희',
      note: '',
      checked: true,
      createdAt: new Date().toISOString()
    });
  }

  saveStoredMaterialsOrders();
  renderMaterialTab();
}

// 긴급 ↔ 정기 토글
function toggleOrderUrgency(orderId) {
  const ord = materialOrders.find(o => o.id === orderId);
  if (ord) {
    ord.urgency = (ord.urgency === 'urgent') ? 'regular' : 'urgent';
    saveStoredMaterialsOrders();
    renderMaterialOrderList();
    renderMaterialMasterGrid();
  }
}

// 체크박스 토글
function toggleOrderCheck(orderId, isChecked) {
  const ord = materialOrders.find(o => o.id === orderId);
  if (ord) {
    ord.checked = isChecked;
    saveStoredMaterialsOrders();
    updateCaptureCountBadge();
  }
}

function toggleAllMaterialOrders(isChecked) {
  let targetOrders = materialOrders;
  if (materialSupplierFilter !== 'ALL') {
    targetOrders = materialOrders.filter(o => normalizeMaterialCategory(o.category || o.supplier) === materialSupplierFilter);
  }
  targetOrders.forEach(o => o.checked = isChecked);
  saveStoredMaterialsOrders();
  renderMaterialOrderList();
}

function updateCaptureCountBadge() {
  const checkedOrders = materialOrders.filter(o => o.checked);
  const badge = document.getElementById('mat-checked-count-badge');
  if (badge) badge.innerText = `캡쳐선택: ${checkedOrders.length}건`;
}

// 수량 변경
function changeOrderQty(orderId, delta) {
  const ord = materialOrders.find(o => o.id === orderId);
  if (ord) {
    ord.quantity = Math.max(1, ord.quantity + delta);
    saveStoredMaterialsOrders();
    renderMaterialOrderList();
    renderMaterialMasterGrid();
  }
}

function updateOrderQtyDirect(orderId, val, isTyping = false) {
  const ord = materialOrders.find(o => o.id === orderId);
  if (ord) {
    const num = parseInt(val, 10);
    if (isTyping && (val === '' || isNaN(num))) return;
    ord.quantity = isNaN(num) || num < 1 ? 1 : num;
    saveStoredMaterialsOrders();
    if (!isTyping) {
      renderMaterialOrderList();
    }
    renderMaterialMasterGrid();
  }
}

function updateOrderApplicant(orderId, applicant) {
  const ord = materialOrders.find(o => o.id === orderId);
  if (ord) {
    ord.applicant = applicant;
    saveStoredMaterialsOrders();
  }
}

function updateOrderNote(orderId, note) {
  const ord = materialOrders.find(o => o.id === orderId);
  if (ord) {
    ord.note = note;
    saveStoredMaterialsOrders();
  }
}

function deleteMaterialOrder(orderId) {
  if (!confirm('이 재료를 이번 주 발주 목록에서 삭제하시겠습니까?')) return;
  materialOrders = materialOrders.filter(o => o.id !== orderId);
  if (Array.isArray(materialOrderStatsLog)) {
    const beforeLen = materialOrderStatsLog.length;
    materialOrderStatsLog = materialOrderStatsLog.filter(r => r.id !== orderId);
    if (materialOrderStatsLog.length !== beforeLen) saveStoredMaterialStatsLog();
  }
  saveStoredMaterialsOrders();
  renderMaterialTab();
}

function deleteSelectedMaterialOrders() {
  let checkedOrders = materialOrders.filter(o => o.checked);
  if (materialSupplierFilter !== 'ALL') {
    checkedOrders = checkedOrders.filter(o => normalizeMaterialCategory(o.category || o.supplier) === materialSupplierFilter);
  }
  if (checkedOrders.length === 0) {
    alert('삭제할 재료를 체크박스로 먼저 선택해주세요.');
    return;
  }
  if (!confirm(`선택한 재료 ${checkedOrders.length}건을 이번 주 발주 목록에서 삭제하시겠습니까?`)) return;
  const removeIds = new Set(checkedOrders.map(o => o.id));
  materialOrders = materialOrders.filter(o => !removeIds.has(o.id));
  if (Array.isArray(materialOrderStatsLog)) {
    const beforeLen = materialOrderStatsLog.length;
    materialOrderStatsLog = materialOrderStatsLog.filter(r => !removeIds.has(r.id));
    if (materialOrderStatsLog.length !== beforeLen) saveStoredMaterialStatsLog();
  }
  saveStoredMaterialsOrders();
  renderMaterialTab();
}

function clearAllMaterialOrders() {
  if (materialOrders.length === 0) return;
  if (!confirm('이번 주 발주 목록을 모두 초기화(비우기)하시겠습니까?\n발주 완료 후 다음 주 주문을 시작할 때 사용하세요. (주문 통계는 유지됩니다)')) return;
  // 초기화 전 이번 주 발주 내역을 누적 통계 로그에 보존
  archiveOrdersToStatsLog(materialOrders);
  materialOrders = [];
  saveStoredMaterialsOrders();
  renderMaterialTab();
}

// =========================================================================
// [주문하기] 모달 열기 / 저장
// =========================================================================
function openAddCustomMaterialModal() {
  const nameInput = document.getElementById('modal-new-mat-name');
  const catSelect = document.getElementById('modal-new-mat-cat');
  const qtyInput = document.getElementById('modal-new-mat-qty');
  const urgencySelect = document.getElementById('modal-new-mat-urgency');

  if (nameInput) nameInput.value = '';
  if (catSelect) {
    catSelect.value = (materialCategoryFilter !== 'ALL' && MATERIAL_CATEGORIES.includes(materialCategoryFilter))
      ? materialCategoryFilter
      : '더메이트';
  }
  if (qtyInput) qtyInput.value = '1';
  if (urgencySelect) urgencySelect.value = 'regular';

  updateFrequentMaterialDatalist();
  document.getElementById('custom-material-modal').classList.add('active');
  setTimeout(() => {
    if (nameInput) nameInput.focus();
  }, 50);
}

function closeCustomMaterialModal() {
  document.getElementById('custom-material-modal').classList.remove('active');
}

function submitCustomMaterial(e) {
  if (e) e.preventDefault();
  const nameEl = document.getElementById('modal-new-mat-name');
  const catEl = document.getElementById('modal-new-mat-cat');
  const qtyEl = document.getElementById('modal-new-mat-qty');
  const urgEl = document.getElementById('modal-new-mat-urgency');

  const name = nameEl ? nameEl.value.trim() : '';
  const category = normalizeMaterialCategory(catEl ? catEl.value : '더메이트');
  const qty = Math.max(1, parseInt(qtyEl ? qtyEl.value : '1', 10) || 1);
  const urgency = (urgEl && urgEl.value === 'urgent') ? 'urgent' : 'regular';

  if (!name) {
    alert('재료명을 입력해주세요.');
    return;
  }

  const normName = normalizeMaterialName(name);
  // 삭제 목록에 있었던 재료를 다시 주문하면 삭제 목록에서 해제
  if (Array.isArray(materialDeletedNames)) {
    materialDeletedNames = materialDeletedNames.filter(n => normalizeMaterialName(n) !== normName);
  }
  let targetItem = materialMasterList.find(m => normalizeMaterialName(m.name) === normName);

  if (targetItem) {
    // 이미 등록된 재료면 카테고리 최신화
    targetItem.category = category;
    targetItem.defaultSupplier = category;
  } else {
    targetItem = {
      id: 'mat_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name,
      category,
      defaultSupplier: category
    };
    materialMasterList.unshift(targetItem);
  }

  saveCustomMasterItem();
  closeCustomMaterialModal();

  // 입력한 주문량만큼 즉시 이번 주 발주 목록에 추가
  quickAddMaterialToOrder(targetItem.id, urgency, qty);
}

// =========================================================================
// 좌측 자주 시키는 재료 [재료명 · 카테고리 편집] 및 중복 통합 모달
// =========================================================================
function openEditMaterialModal(masterId) {
  const item = materialMasterList.find(m => m.id === masterId);
  if (!item) return;

  const idInput = document.getElementById('modal-edit-mat-id');
  const nameInput = document.getElementById('modal-edit-mat-name');
  const catSelect = document.getElementById('modal-edit-mat-cat');

  if (idInput) idInput.value = item.id;
  if (nameInput) nameInput.value = item.name;
  if (catSelect) catSelect.value = normalizeMaterialCategory(item.category || item.defaultSupplier);

  updateFrequentMaterialDatalist();
  document.getElementById('edit-material-modal').classList.add('active');
  setTimeout(() => {
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  }, 50);
}

function closeEditMaterialModal() {
  const modal = document.getElementById('edit-material-modal');
  if (modal) modal.classList.remove('active');
}

function submitEditMaterial(e) {
  if (e) e.preventDefault();
  const idInput = document.getElementById('modal-edit-mat-id');
  const nameInput = document.getElementById('modal-edit-mat-name');
  const catSelect = document.getElementById('modal-edit-mat-cat');

  const editId = idInput ? idInput.value : '';
  const newName = nameInput ? nameInput.value.trim() : '';
  const newCategory = normalizeMaterialCategory(catSelect ? catSelect.value : '더메이트');

  if (!newName) {
    alert('재료명을 입력해주세요.');
    return;
  }

  const targetItem = materialMasterList.find(m => m.id === editId);
  if (!targetItem) {
    closeEditMaterialModal();
    return;
  }

  const oldName = targetItem.name;
  const oldNorm = normalizeMaterialName(oldName);
  const newNorm = normalizeMaterialName(newName);

  // 동일한 이름을 가진 다른 항목이 이미 존재하는지 확인 (중복 재료 통합)
  const existingDuplicate = materialMasterList.find(
    m => m.id !== editId && normalizeMaterialName(m.name) === newNorm
  );

  let finalMasterId = editId;
  if (existingDuplicate) {
    existingDuplicate.name = newName;
    existingDuplicate.category = newCategory;
    existingDuplicate.defaultSupplier = newCategory;
    finalMasterId = existingDuplicate.id;
    materialMasterList = materialMasterList.filter(m => m.id !== editId);
  } else {
    targetItem.name = newName;
    targetItem.category = newCategory;
    targetItem.defaultSupplier = newCategory;
  }

  // 1) 이번 주 발주 목록(materialOrders) 내 해당 재료 이름·카테고리 일괄 변경 및 중복 행 합산
  const mergedOrders = [];
  (materialOrders || []).forEach(ord => {
    const ordNorm = normalizeMaterialName(ord.name);
    if (ord.itemId === editId || ord.itemId === finalMasterId || ordNorm === oldNorm || ordNorm === newNorm) {
      ord.itemId = finalMasterId;
      ord.name = newName;
      ord.category = newCategory;
      ord.supplier = newCategory;
    }
    const dupRow = mergedOrders.find(
      m => (m.itemId === ord.itemId || normalizeMaterialName(m.name) === normalizeMaterialName(ord.name)) && m.urgency === ord.urgency
    );
    if (dupRow) {
      dupRow.quantity = (Number(dupRow.quantity) || 1) + (Number(ord.quantity) || 1);
      dupRow.checked = dupRow.checked || ord.checked;
    } else {
      mergedOrders.push(ord);
    }
  });
  materialOrders = mergedOrders;

  // 2) 저장된 발주 입고체크 목록(materialSavedHistory) 내 재료명·카테고리 일괄 업데이트
  let historyUpdated = false;
  (materialSavedHistory || []).forEach(batch => {
    (batch.items || []).forEach(it => {
      const itNorm = normalizeMaterialName(it.name);
      if (it.itemId === editId || itNorm === oldNorm || itNorm === newNorm) {
        it.itemId = finalMasterId;
        it.name = newName;
        it.category = newCategory;
        it.supplier = newCategory;
        historyUpdated = true;
      }
    });
  });

  // 3) 누적 주문 통계 로그(materialOrderStatsLog) 내 재료명·카테고리 일괄 업데이트
  let statsUpdated = false;
  (materialOrderStatsLog || []).forEach(rec => {
    const recNorm = normalizeMaterialName(rec.name);
    if (rec.itemId === editId || recNorm === oldNorm || recNorm === newNorm) {
      rec.itemId = finalMasterId;
      rec.name = newName;
      rec.category = newCategory;
      statsUpdated = true;
    }
  });

  saveCustomMasterItem();
  saveStoredMaterialsOrders();
  if (historyUpdated) saveStoredMaterialHistory();
  if (statsUpdated) saveStoredMaterialStatsLog();

  closeEditMaterialModal();
  renderMaterialTab();
}

function deleteFrequentMaterialItem() {
  const idInput = document.getElementById('modal-edit-mat-id');
  const editId = idInput ? idInput.value : '';
  const targetItem = materialMasterList.find(m => m.id === editId);
  if (!targetItem) return;

  if (!confirm(`'${targetItem.name}' 재료를 자주 주문하는 재료 목록에서 삭제하시겠습니까?`)) return;

  const targetNorm = normalizeMaterialName(targetItem.name);
  materialMasterList = materialMasterList.filter(m => m.id !== editId);

  if (!Array.isArray(materialDeletedNames)) materialDeletedNames = [];
  if (!materialDeletedNames.some(n => normalizeMaterialName(n) === targetNorm)) {
    materialDeletedNames.push(targetItem.name);
  }

  // 누적 로그에서도 제외하여 자동 재등록 방지
  if (Array.isArray(materialOrderStatsLog)) {
    materialOrderStatsLog = materialOrderStatsLog.filter(
      r => r.itemId !== editId && normalizeMaterialName(r.name) !== targetNorm
    );
    saveStoredMaterialStatsLog();
  }

  saveCustomMasterItem();
  closeEditMaterialModal();
  renderMaterialTab();
}

// =========================================================================
// 캡쳐 및 이미지 생성 기능 (html2canvas)
// =========================================================================
function openMaterialCaptureModal() {
  const checkedOrders = materialOrders.filter(o => o.checked);
  if (checkedOrders.length === 0) {
    alert('캡쳐할 재료를 1개 이상 체크박스로 선택해주세요!\n카테고리별로 전달할 품목만 골라서 체크할 수 있습니다.');
    return;
  }

  // 기본 수신처: 필터링된 카테고리 또는 더메이트 귀하
  const defaultRecipient = (materialSupplierFilter !== 'ALL')
    ? `${materialSupplierFilter} 귀하`
    : '더메이트 귀하';
  document.getElementById('capture-supplier-input').value = defaultRecipient;

  renderCapturePreviewContent();
  document.getElementById('material-capture-modal').classList.add('active');
}

function closeMaterialCaptureModal() {
  document.getElementById('material-capture-modal').classList.remove('active');
}

function renderCapturePreviewContent() {
  const container = document.getElementById('capture-preview-area');
  const supplierTitle = document.getElementById('capture-supplier-input').value || '더메이트 귀하';
  const checkedOrders = materialOrders.filter(o => o.checked);
  const urgentCount = checkedOrders.filter(o => o.urgency === 'urgent').length;

  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

  let rowsHtml = checkedOrders.map((ord, idx) => {
    const cat = normalizeMaterialCategory(ord.category || ord.supplier);
    return `
      <tr>
        <td style="text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
        <td style="text-align: center; white-space: nowrap;">
          ${ord.urgency === 'urgent'
            ? '<span style="display: inline-block; white-space: nowrap; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 800; padding: 3px 7px; border-radius: 4px; border: 1px solid #f87171;">🚨 긴급</span>'
            : '<span style="display: inline-block; white-space: nowrap; background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: 4px;">📦 정기</span>'}
        </td>
        <td style="text-align: center; color: #475569; font-size: 12px; font-weight: 700;">${escapeHtml(cat)}</td>
        <td style="font-weight: 700; color: #0f172a;">${escapeHtml(ord.name)}</td>
        <td style="text-align: center; font-weight: 800; color: #1e3a8a; white-space: nowrap;">${ord.quantity}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="capture-header">
      <div>
        <div style="font-size: 13px; font-weight: 800; color: #2563eb; letter-spacing: 0.5px; margin-bottom: 2px;">서울비디치과기공실</div>
        <h2 class="capture-title">치과기공소 재료 발주서</h2>
        <div style="font-size: 14px; font-weight: 700; color: #334155; margin-top: 4px;">
          수신: <span style="color: #1e40af; text-decoration: underline;">${escapeHtml(supplierTitle)}</span>
        </div>
      </div>
      <div class="capture-meta">
        <div><strong>발주일자:</strong> ${dateStr}</div>
        <div><strong>총 발주품목:</strong> ${checkedOrders.length}건</div>
        ${urgentCount > 0 ? `<div style="color: #dc2626; font-weight: 800;">🚨 긴급 발주: ${urgentCount}건 포함</div>` : ''}
      </div>
    </div>

    <table class="capture-table">
      <thead>
        <tr>
          <th style="width: 42px; text-align: center;">No</th>
          <th style="width: 80px; text-align: center; white-space: nowrap;">구분</th>
          <th style="width: 90px; text-align: center; white-space: nowrap;">카테고리</th>
          <th>재료명</th>
          <th style="width: 80px; text-align: center; white-space: nowrap;">주문량</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="capture-footer">
      <div>* 수량 확인 부탁드립니다. 감사합니다.</div>
      <div style="font-weight: 800; color: #0f172a;">서울비디치과기공실</div>
    </div>
  `;
}

// 캡쳐 이미지 다운로드 (PNG)
async function downloadCaptureImage() {
  const target = document.getElementById('capture-preview-area');
  if (!target || typeof html2canvas === 'undefined') {
    alert('이미지 캡쳐 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  const btn = document.getElementById('btn-download-capture');
  if (btn) btn.innerText = '⏳ 이미지 생성 중...';

  try {
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    link.download = `BD_재료발주서_${dateStr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('html2canvas error:', err);
    alert('이미지 생성 중 오류가 발생했습니다: ' + err.message);
  } finally {
    if (btn) btn.innerText = '📷 이미지로 저장 (PNG)';
  }
}

// 클립보드에 이미지 복사 (카톡 등에 바로 Ctrl+V 가능)
async function copyCaptureImageToClipboard() {
  const target = document.getElementById('capture-preview-area');
  if (!target || typeof html2canvas === 'undefined') {
    alert('이미지 생성 모듈이 준비되지 않았습니다.');
    return;
  }

  const btn = document.getElementById('btn-copy-capture-img');
  if (btn) btn.innerText = '⏳ 복사 중...';

  try {
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    canvas.toBlob(async blob => {
      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          alert('✅ 발주서 이미지가 클립보드에 복사되었습니다!\n카카오톡 대화창이나 메시지 입력창에 Ctrl+V (붙여넣기) 하세요.');
        } else {
          alert('이 브라우저는 클립보드 이미지 복사를 지원하지 않습니다.\n[이미지로 저장] 버튼을 이용해주세요.');
        }
      } catch (clipErr) {
        console.warn('Clipboard write error:', clipErr);
        alert('클립보드 접근이 차단되었거나 지원되지 않습니다.\n[이미지로 저장] 버튼을 클릭해 다운로드해주세요.');
      }
    }, 'image/png');
  } catch (err) {
    console.error(err);
    alert('이미지 복사 실패: ' + err.message);
  } finally {
    if (btn) btn.innerText = '📋 이미지 복사 (카톡 붙여넣기용)';
  }
}

// 텍스트 형태로 발주서 복사 (문자/카톡 텍스트용)
function copyMaterialOrderText() {
  const checkedOrders = materialOrders.filter(o => o.checked);
  if (checkedOrders.length === 0) return;

  const supplier = document.getElementById('capture-supplier-input').value || '더메이트 귀하';
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;

  let txt = `[서울비디치과기공실 재료 발주서]\n`;
  txt += `수신: ${supplier}\n`;
  txt += `일자: ${dateStr}\n`;
  txt += `------------------------------------\n`;

  checkedOrders.forEach((ord, i) => {
    const tag = ord.urgency === 'urgent' ? '[🚨긴급]' : '[정기]';
    txt += `${i + 1}. ${tag} ${ord.name} - ${ord.quantity}\n`;
  });

  txt += `------------------------------------\n`;
  txt += `확인 부탁드립니다. 감사합니다!`;

  navigator.clipboard.writeText(txt).then(() => {
    alert('✅ 발주서 텍스트가 클립보드에 복사되었습니다.\n문자나 카카오톡에 붙여넣어 사용하세요.');
  }).catch(() => {
    prompt('아래 텍스트를 복사하세요:', txt);
  });
}

// =========================================================================
// 목록 저장 및 입고 확인 체크 기능
// =========================================================================
function formatSavedDateTime(isoStr) {
  try {
    const d = isoStr ? new Date(isoStr) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch (e) {
    return '';
  }
}

function saveCurrentMaterialOrderToCheckList() {
  if (!materialOrders || materialOrders.length === 0) {
    alert('저장할 발주 목록이 없습니다. 먼저 재료를 담아주세요!');
    return;
  }

  let targetItems = materialOrders;
  if (materialSupplierFilter !== 'ALL') {
    targetItems = materialOrders.filter(o => normalizeMaterialCategory(o.category || o.supplier) === materialSupplierFilter);
  }

  if (targetItems.length === 0) {
    alert('저장할 발주 품목이 없습니다.');
    return;
  }

  const nowIso = new Date().toISOString();
  const newBatch = {
    id: 'mat_batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    savedAt: nowIso,
    supplierFilter: materialSupplierFilter === 'ALL' ? '전체 발주' : materialSupplierFilter,
    items: targetItems.map(ord => {
      const cat = normalizeMaterialCategory(ord.category || ord.supplier);
      return {
        id: ord.id,
        itemId: ord.itemId || '',
        name: ord.name,
        category: cat,
        supplier: cat,
        urgency: ord.urgency || 'regular',
        quantity: ord.quantity || 1,
        createdAt: ord.createdAt || nowIso,
        received: false
      };
    })
  };

  if (!Array.isArray(materialSavedHistory)) {
    materialSavedHistory = [];
  }
  materialSavedHistory.unshift(newBatch);
  archiveOrdersToStatsLog(targetItems);
  saveStoredMaterialHistory();
  renderMaterialSavedHistory();
  renderMaterialMasterGrid();

  const card = document.getElementById('material-saved-history-card');
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function renderMaterialSavedHistory() {
  const container = document.getElementById('material-saved-history-container');
  const badge = document.getElementById('mat-saved-history-badge');
  if (!container) return;

  const list = Array.isArray(materialSavedHistory) ? materialSavedHistory : [];
  if (badge) {
    badge.innerText = `저장 ${list.length}건`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px 10px; color: #94a3b8; font-size: 13px;">
        💾 상단의 <strong>[목록 저장]</strong> 버튼을 누르면 현재 발주 목록이 이곳에 저장되어 입고 여부를 하나씩 체크할 수 있습니다.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(batch => {
    const items = Array.isArray(batch.items) ? batch.items : [];
    const totalCnt = items.length;
    const receivedCnt = items.filter(it => it.received).length;
    const allReceived = totalCnt > 0 && receivedCnt === totalCnt;
    const dateLabel = formatSavedDateTime(batch.savedAt);

    const statusBadge = allReceived
      ? `<span style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 800;">🎉 전체 입고완료 (${receivedCnt}/${totalCnt})</span>`
      : `<span style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 800;">📦 입고 확인중 (${receivedCnt}/${totalCnt})</span>`;

    const rowsHtml = items.map((it, idx) => {
      const isRec = !!it.received;
      const cat = normalizeMaterialCategory(it.category || it.supplier);
      const catStyle = getCategoryBadgeStyle(cat);
      const urgBadge = it.urgency === 'urgent'
        ? `<span class="urgency-badge urgency-urgent" style="cursor: default;">🚨 긴급</span>`
        : `<span class="urgency-badge urgency-regular" style="cursor: default;">📦 정기</span>`;

      return `
        <div class="saved-check-row ${isRec ? 'is-received' : ''}" onclick="toggleSavedMaterialItemCheck('${batch.id}', ${idx})" style="cursor: pointer;">
          <div class="order-row-top">
            <input type="checkbox" class="custom-checkbox" ${isRec ? 'checked' : ''} onclick="event.stopPropagation(); toggleSavedMaterialItemCheck('${batch.id}', ${idx})" />
            <div class="order-item-title">${escapeHtml(it.name)}</div>
          </div>
          <div class="order-row-bottom">
            <div class="order-row-meta">
              ${urgBadge}
              <span class="supplier-chip" style="${catStyle}">${escapeHtml(cat)}</span>
            </div>
            <div class="order-row-controls">
              <span style="font-size: 13px; font-weight: 800; color: #1e3a8a;">수량 ${it.quantity}</span>
              <button type="button" class="receive-status-btn ${isRec ? 'done' : 'pending'}" onclick="event.stopPropagation(); toggleSavedMaterialItemCheck('${batch.id}', ${idx})">
                ${isRec ? '✅ 입고완료' : '⬜ 입고대기'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="saved-batch-box">
        <div class="saved-batch-header">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <strong style="font-size: 13px; color: #0f172a;">📅 ${escapeHtml(dateLabel)} 발주분</strong>
            ${statusBadge}
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="btn-outline" style="padding: 4px 8px; font-size: 11.5px;" onclick="toggleAllSavedMaterialBatchCheck('${batch.id}', ${!allReceived})">
              ${allReceived ? '전체 해제' : '전체 완료체크'}
            </button>
            <button type="button" class="btn-danger" style="padding: 4px 8px; font-size: 11.5px;" onclick="deleteSavedMaterialBatch('${batch.id}')">
              삭제
            </button>
          </div>
        </div>
        <div>
          ${rowsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function toggleSavedMaterialItemCheck(batchId, itemIdx) {
  const batch = (materialSavedHistory || []).find(b => b.id === batchId);
  if (!batch || !Array.isArray(batch.items) || !batch.items[itemIdx]) return;
  batch.items[itemIdx].received = !batch.items[itemIdx].received;
  saveStoredMaterialHistory();
  renderMaterialSavedHistory();
}

function toggleAllSavedMaterialBatchCheck(batchId, receivedState) {
  const batch = (materialSavedHistory || []).find(b => b.id === batchId);
  if (!batch || !Array.isArray(batch.items)) return;
  batch.items.forEach(it => {
    it.received = !!receivedState;
  });
  saveStoredMaterialHistory();
  renderMaterialSavedHistory();
}

function deleteSavedMaterialBatch(batchId) {
  if (!confirm('이 저장된 발주 확인 목록을 삭제하시겠습니까? (자주 주문하는 재료 통계는 그대로 유지됩니다)')) return;
  const targetBatch = (materialSavedHistory || []).find(b => b.id === batchId);
  if (targetBatch && Array.isArray(targetBatch.items)) {
    archiveOrdersToStatsLog(targetBatch.items);
  }
  materialSavedHistory = (materialSavedHistory || []).filter(b => b.id !== batchId);
  saveStoredMaterialHistory();
  renderMaterialSavedHistory();
  renderMaterialMasterGrid();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
