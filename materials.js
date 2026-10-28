/**
 * =========================================================================
 * BD Dental Lab - 재료 주문 관리 스크립트 (materials.js)
 * =========================================================================
 */

// 치과 기공소 실무 필수 기본 재료 마스터 목록 (카테고리별 30종 이상)
const DEFAULT_MATERIAL_MASTER = [
  // CAD/CAM & 블록/디스크
  { id: 'mat_01', name: '지르코니아 블록 ST (98×14mm)', category: 'CAD/CAM', defaultSupplier: '한일치재', spec: 'A2 쉐이드 / 98×14', unit: 'ea' },
  { id: 'mat_02', name: '지르코니아 블록 ST (98×18mm)', category: 'CAD/CAM', defaultSupplier: '한일치재', spec: 'A2 쉐이드 / 98×18', unit: 'ea' },
  { id: 'mat_03', name: '지르코니아 블록 UT (98×14mm)', category: 'CAD/CAM', defaultSupplier: '한일치재', spec: '전치부용 고투명 / 98×14', unit: 'ea' },
  { id: 'mat_04', name: 'PMMA 멀티 디스크 (98×16mm)', category: 'CAD/CAM', defaultSupplier: '신흥', spec: 'A2 멀티레이어 / 임시치아용', unit: 'ea' },
  { id: 'mat_05', name: 'CAD 왁스 디스크 (98×14mm)', category: 'CAD/CAM', defaultSupplier: '신흥', spec: 'Blue / 캐스팅·프레스용', unit: 'ea' },
  { id: 'mat_06', name: '밀링버 0.6mm (DLC코팅)', category: 'CAD/CAM', defaultSupplier: '한일치재', spec: '지르코니아 가공용 피니싱버', unit: 'ea' },
  { id: 'mat_07', name: '밀링버 1.0mm (DLC코팅)', category: 'CAD/CAM', defaultSupplier: '한일치재', spec: '지르코니아 가공용 레귤러버', unit: 'ea' },
  { id: 'mat_08', name: '밀링버 2.0mm (DLC코팅)', category: 'CAD/CAM', defaultSupplier: '한일치재', spec: '지르코니아 황삭용 라프버', unit: 'ea' },

  // 포세린 & 세라믹
  { id: 'mat_09', name: '세라믹 파우더 (Vintage MP A2 Body)', category: '포세린', defaultSupplier: '신흥', spec: '50g / 메탈포세린용', unit: '통' },
  { id: 'mat_10', name: '지르코니아 세라믹 파우더 (ZR Body A2)', category: '포세린', defaultSupplier: '한일치재', spec: '50g / 지르 빌드업용', unit: '통' },
  { id: 'mat_11', name: '세라믹 오파크 페이스트 (A2)', category: '포세린', defaultSupplier: '신흥', spec: '메탈 차폐용 오파크', unit: '개' },
  { id: 'mat_12', name: '글레이즈 페이스트 & 전용 리퀴드', category: '포세린', defaultSupplier: '한일치재', spec: '형광성 글레이즈', unit: 'set' },
  { id: 'mat_13', name: '스테인 키트 기본 색상 리필', category: '포세린', defaultSupplier: '신흥', spec: 'A계열·B계열·White', unit: '개' },

  // 레진 & 덴처
  { id: 'mat_14', name: '자가중합 레진 분말 & 액 (유니패스트)', category: '레진', defaultSupplier: '신흥', spec: 'A2 분말 100g + 액 100ml', unit: 'set' },
  { id: 'mat_15', name: '광중합 레진 (트레이 레진 플레이트)', category: '레진', defaultSupplier: '오스템', spec: '개인트레이 제작용 50매', unit: 'box' },
  { id: 'mat_16', name: '레진치 (상악 전치부 6전치 A2)', category: '레진', defaultSupplier: '신흥', spec: 'Endura / Antares 택1', unit: '조' },
  { id: 'mat_17', name: '레진치 (하악 전치부 6전치 A2)', category: '레진', defaultSupplier: '신흥', spec: 'Endura / Antares 택1', unit: '조' },
  { id: 'mat_18', name: '열중합 덴처 레진 (루시톤 199)', category: '레진', defaultSupplier: '덴티움', spec: '오리지널 핑크 분말 1파운드', unit: '통' },

  // 석고 & 매몰재
  { id: 'mat_19', name: '초경석고 후지락 (노랑)', category: '석고', defaultSupplier: '한일치재', spec: '12kg 박스 / 마스터 모델용', unit: 'box' },
  { id: 'mat_20', name: '보통석고 화이트 (20kg)', category: '석고', defaultSupplier: '한일치재', spec: '20kg 대포대 / 마운팅용', unit: '포' },
  { id: 'mat_21', name: '급가열 인레이/크라운 매몰재', category: '석고', defaultSupplier: '신흥', spec: 'Formula 1 (100g×30포)', unit: 'box' },
  { id: 'mat_22', name: '석고 분리제 (하이세퍼 액)', category: '석고', defaultSupplier: '신흥', spec: '1000ml 대용량 리필', unit: '통' },

  // 메탈 & 합금
  { id: 'mat_23', name: '크라운/브릿지용 니켈-크롬 합금 (VeraBond)', category: '메탈', defaultSupplier: '신흥', spec: '베라본드 2 1000g', unit: 'box' },
  { id: 'mat_24', name: '파샬 덴처용 코발트-크롬 합금 (베라스타)', category: '메탈', defaultSupplier: '한일치재', spec: '탄성 우수 프레임용 1kg', unit: 'box' },
  { id: 'mat_25', name: '캐스팅 납착용 솔더 & 플럭스', category: '메탈', defaultSupplier: '신흥', spec: '화이트 솔더 봉 + 페이스트 플럭스', unit: 'set' },

  // 기공 기구 & 소모품
  { id: 'mat_26', name: '지르코니아 폴리싱 다이아몬드 휠', category: '소모품', defaultSupplier: '한일치재', spec: '2단계 세트 (초벌·광택)', unit: 'set' },
  { id: 'mat_27', name: '메탈 커팅 디스크 (카보런덤 휠)', category: '소모품', defaultSupplier: '신흥', spec: '0.6mm 박형 절단용 100매', unit: 'box' },
  { id: 'mat_28', name: '기공용 순간접착제 (록타이트 401)', category: '소모품', defaultSupplier: '오스템', spec: '20g 고강도 핀작업용', unit: '개' },
  { id: 'mat_29', name: '교합지 (바우쉬 200미크론)', category: '소모품', defaultSupplier: '신흥', spec: '블루/레드 양면 300매', unit: 'box' },
  { id: 'mat_30', name: '다웰핀 (황동 쌍핀/단핀)', category: '소모품', defaultSupplier: '한일치재', spec: '핀작업용 스파이크 1000개', unit: 'box' },
  { id: 'mat_31', name: '니트릴 글러브 (화이트 M사이즈)', category: '소모품', defaultSupplier: '덴티움', spec: '파우더프리 100매입', unit: 'box' },
  { id: 'mat_32', name: '3단 덴탈 멜트블로운 마스크', category: '소모품', defaultSupplier: '덴티움', spec: '비말차단 50매입', unit: 'box' },
  { id: 'mat_33', name: '알코올 램프 심지 & 왁스 조각도', category: '소모품', defaultSupplier: '신흥', spec: '기공용 소모성 리필', unit: 'set' }
];

// 상태 변수
let materialMasterList = [...DEFAULT_MATERIAL_MASTER];
let materialOrders = [];
let materialCategoryFilter = 'ALL';
let materialSearchKeyword = '';
let materialSupplierFilter = 'ALL';

// 로컬스토리지 키
const STORAGE_KEY_MAT_MASTER = 'bd_material_custom_master';
const STORAGE_KEY_MAT_ORDERS = 'bd_material_current_orders';

// 초기 로드
function initMaterialsModule() {
  loadStoredMaterials();
  setupMaterialFirestoreListeners();
}

function loadStoredMaterials() {
  try {
    const savedCustom = localStorage.getItem(STORAGE_KEY_MAT_MASTER);
    if (savedCustom) {
      const parsed = JSON.parse(savedCustom);
      // 기본 목록과 사용자 추가 목록 병합
      const customIds = new Set(parsed.map(p => p.id));
      materialMasterList = [
        ...DEFAULT_MATERIAL_MASTER.filter(m => !customIds.has(m.id)),
        ...parsed
      ];
    }
    const savedOrders = localStorage.getItem(STORAGE_KEY_MAT_ORDERS);
    if (savedOrders) {
      materialOrders = JSON.parse(savedOrders);
    }
  } catch (e) {
    console.error('Failed to load local materials data:', e);
  }
}

function saveStoredMaterialsOrders() {
  try {
    localStorage.setItem(STORAGE_KEY_MAT_ORDERS, JSON.stringify(materialOrders));
    if (window.firebaseDb) {
      window.firebaseDb.collection('materials').doc('current_orders').set({
        orders: materialOrders,
        updatedAt: new Date().toISOString()
      }).catch(err => console.warn('Firestore material orders sync err:', err));
    }
  } catch (e) {
    console.error('saveStoredMaterialsOrders error:', e);
  }
}

function saveCustomMasterItem(item) {
  try {
    const customOnly = materialMasterList.filter(m => !DEFAULT_MATERIAL_MASTER.some(d => d.id === m.id));
    localStorage.setItem(STORAGE_KEY_MAT_MASTER, JSON.stringify(customOnly));
    if (window.firebaseDb) {
      window.firebaseDb.collection('materials').doc('custom_master').set({
        items: customOnly,
        updatedAt: new Date().toISOString()
      }).catch(err => console.warn('Firestore custom master sync err:', err));
    }
  } catch (e) {
    console.error('saveCustomMasterItem error:', e);
  }
}

function setupMaterialFirestoreListeners() {
  if (!window.firebaseDb) return;
  // 실시간 주문 동기화
  window.firebaseDb.collection('materials').doc('current_orders').onSnapshot(doc => {
    if (doc.exists && doc.data() && doc.data().orders) {
      materialOrders = doc.data().orders;
      localStorage.setItem(STORAGE_KEY_MAT_ORDERS, JSON.stringify(materialOrders));
      if (document.getElementById('tab-material') && document.getElementById('tab-material').classList.contains('active')) {
        renderMaterialTab();
      }
    }
  }, err => console.warn('Firestore material listener note:', err));

  // 사용자 추가 재료 마스터 동기화
  window.firebaseDb.collection('materials').doc('custom_master').onSnapshot(doc => {
    if (doc.exists && doc.data() && doc.data().items) {
      const customItems = doc.data().items;
      const customIds = new Set(customItems.map(c => c.id));
      materialMasterList = [
        ...DEFAULT_MATERIAL_MASTER.filter(m => !customIds.has(m.id)),
        ...customItems
      ];
      localStorage.setItem(STORAGE_KEY_MAT_MASTER, JSON.stringify(customItems));
      if (document.getElementById('tab-material') && document.getElementById('tab-material').classList.contains('active')) {
        renderMaterialMasterGrid();
      }
    }
  }, err => console.warn('Firestore material master listener note:', err));
}

// 탭 렌더링 메인 함수
function renderMaterialTab() {
  renderMaterialOrderList();
  renderMaterialMasterGrid();
  renderMaterialSupplierChips();
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

  // 재료상 필터 적용
  let filteredOrders = materialOrders;
  if (materialSupplierFilter !== 'ALL') {
    filteredOrders = materialOrders.filter(o => o.supplier === materialSupplierFilter);
  }

  if (filteredOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px 10px; color: #94a3b8; font-size: 13.5px;">
          🛒 이번 주 주문할 재료가 아직 없습니다.<br>
          <span style="font-size: 12px; color: #cbd5e1; margin-top: 6px; display: inline-block;">
            좌측 '재료목록'에서 품목을 선택하거나 '재료등록'을 클릭해 담아주세요!
          </span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredOrders.map((ord, idx) => {
    const isUrgent = ord.urgency === 'urgent';
    const urgencyBadge = isUrgent
      ? `<span class="urgency-badge urgency-urgent" onclick="toggleOrderUrgency('${ord.id}')" title="클릭시 정기 주문으로 변경">🚨 긴급</span>`
      : `<span class="urgency-badge urgency-regular" onclick="toggleOrderUrgency('${ord.id}')" title="클릭시 긴급 주문으로 변경">📦 정기</span>`;

    return `
      <tr style="${isUrgent ? 'background-color: #fffaf0;' : ''}">
        <td style="text-align: center; width: 40px;">
          <input type="checkbox" class="custom-checkbox" ${ord.checked ? 'checked' : ''} onchange="toggleOrderCheck('${ord.id}', this.checked)" title="캡쳐 발주서에 포함" />
        </td>
        <td style="text-align: center; width: 68px; white-space: nowrap;">${urgencyBadge}</td>
        <td style="word-break: keep-all; overflow-wrap: break-word;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13px; line-height: 1.35;">${escapeHtml(ord.name)}</div>
          <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">${escapeHtml(ord.spec || '-')}</div>
        </td>
        <td style="text-align: center; width: 72px; white-space: nowrap;">
          <span class="supplier-chip">${escapeHtml(ord.supplier || '기본')}</span>
        </td>
        <td style="text-align: center; width: 112px; white-space: nowrap;">
          <div style="display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
            <div class="qty-controller">
              <button type="button" class="qty-btn" onclick="changeOrderQty('${ord.id}', -1)" title="1개 감소">-</button>
              <input type="number" class="qty-input" min="1" value="${ord.quantity}" onclick="this.select()" onfocus="this.select()" onchange="updateOrderQtyDirect('${ord.id}', this.value)" title="클릭하여 수량 직접 입력" />
              <button type="button" class="qty-btn" onclick="changeOrderQty('${ord.id}', 1)" title="1개 증가">+</button>
            </div>
            <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">${escapeHtml(ord.unit || 'ea')}</span>
          </div>
        </td>
        <td style="text-align: center; width: 44px;">
          <button type="button" class="btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="deleteMaterialOrder('${ord.id}')" title="주문 목록에서 삭제">✕</button>
        </td>
      </tr>
    `;
  }).join('');
}

// 재료 마스터 도감 렌더링
function renderMaterialMasterGrid() {
  const container = document.getElementById('material-master-grid');
  if (!container) return;

  const keyword = materialSearchKeyword.trim().toLowerCase();
  let list = materialMasterList;

  if (materialCategoryFilter !== 'ALL') {
    list = list.filter(m => m.category === materialCategoryFilter);
  }

  if (keyword) {
    list = list.filter(m => 
      m.name.toLowerCase().includes(keyword) || 
      (m.spec && m.spec.toLowerCase().includes(keyword)) ||
      (m.defaultSupplier && m.defaultSupplier.toLowerCase().includes(keyword)) ||
      (m.category && m.category.toLowerCase().includes(keyword))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #94a3b8; font-size: 13px;">
        🔍 검색된 재료가 없습니다. 상단 '재료등록'을 통해 바로 추가해보세요!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="material-item-card">
      <div class="material-card-header">
        <div>
          <span style="font-size: 10.5px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">${escapeHtml(item.category)}</span>
          <div class="material-card-name" style="margin-top: 4px;">${escapeHtml(item.name)}</div>
          <div class="material-card-spec">${escapeHtml(item.spec || '-')}</div>
        </div>
      </div>
      <div class="material-card-footer" style="justify-content: flex-end;">
        <div style="display: flex; gap: 4px; justify-content: flex-end; width: 100%;">
          <button type="button" class="urgency-badge urgency-regular" style="padding: 3px 8px; font-size: 11px;" onclick="quickAddMaterialToOrder('${item.id}', 'regular')">📦 정기 담기</button>
          <button type="button" class="urgency-badge urgency-urgent" style="padding: 3px 8px; font-size: 11px;" onclick="quickAddMaterialToOrder('${item.id}', 'urgent')">🚨 긴급 담기</button>
        </div>
      </div>
    </div>
  `).join('');
}

// 재료상 필터 칩 렌더링
function renderMaterialSupplierChips() {
  const container = document.getElementById('mat-supplier-filter-container');
  if (!container) return;

  const suppliers = Array.from(new Set(materialOrders.map(o => o.supplier).filter(Boolean)));
  let html = `
    <button type="button" class="filter-chip ${materialSupplierFilter === 'ALL' ? 'active' : ''}" onclick="setMaterialSupplierFilter('ALL')">
      전체 보기 (${materialOrders.length})
    </button>
  `;

  suppliers.forEach(s => {
    const cnt = materialOrders.filter(o => o.supplier === s).length;
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

// 발주 목록에 재료 담기 (퀵)
function quickAddMaterialToOrder(masterId, urgency) {
  const item = materialMasterList.find(m => m.id === masterId);
  if (!item) return;

  // 이미 발주 목록에 같은 재료 & 같은 긴급도가 있는지 확인
  const existing = materialOrders.find(o => o.itemId === masterId && o.urgency === urgency);
  if (existing) {
    existing.quantity += 1;
    existing.checked = true;
  } else {
    materialOrders.push({
      id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      itemId: item.id,
      name: item.name,
      spec: item.spec,
      supplier: item.defaultSupplier || '신흥',
      urgency: urgency, // 'urgent' or 'regular'
      quantity: 1,
      unit: item.unit || 'ea',
      applicant: '용희', // 기본 신청자
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
    targetOrders = materialOrders.filter(o => o.supplier === materialSupplierFilter);
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
  }
}

function updateOrderQtyDirect(orderId, val) {
  const ord = materialOrders.find(o => o.id === orderId);
  if (ord) {
    const num = parseInt(val, 10);
    ord.quantity = isNaN(num) || num < 1 ? 1 : num;
    saveStoredMaterialsOrders();
    renderMaterialOrderList();
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
  if (!confirm('이 재료를 주문 목록에서 제외하시겠습니까?')) return;
  materialOrders = materialOrders.filter(o => o.id !== orderId);
  saveStoredMaterialsOrders();
  renderMaterialTab();
}

function clearAllMaterialOrders() {
  if (materialOrders.length === 0) return;
  if (!confirm('이번 주 발주 목록을 모두 초기화(비우기)하시겠습니까?\n발주 완료 후 다음 주 주문을 시작할 때 사용하세요.')) return;
  materialOrders = [];
  saveStoredMaterialsOrders();
  renderMaterialTab();
}

// 사용자가 새로운 재료 등록 모달 열기/저장
function openAddCustomMaterialModal() {
  document.getElementById('modal-new-mat-name').value = '';
  document.getElementById('modal-new-mat-cat').value = '소모품';
  document.getElementById('modal-new-mat-supplier').value = '신흥';
  document.getElementById('modal-new-mat-spec').value = '';
  document.getElementById('modal-new-mat-unit').value = '개';
  document.getElementById('custom-material-modal').classList.add('active');
}

function closeCustomMaterialModal() {
  document.getElementById('custom-material-modal').classList.remove('active');
}

function submitCustomMaterial(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('modal-new-mat-name').value.trim();
  const category = document.getElementById('modal-new-mat-cat').value;
  const supplier = document.getElementById('modal-new-mat-supplier').value.trim() || '신흥';
  const spec = document.getElementById('modal-new-mat-spec').value.trim();
  const unit = document.getElementById('modal-new-mat-unit').value.trim() || '개';

  if (!name) {
    alert('재료명을 입력해주세요.');
    return;
  }

  const newItem = {
    id: 'mat_custom_' + Date.now(),
    name,
    category,
    defaultSupplier: supplier,
    spec,
    unit
  };

  materialMasterList.unshift(newItem);
  saveCustomMasterItem(newItem);
  closeCustomMaterialModal();
  renderMaterialMasterGrid();
  renderMaterialSupplierChips();

  // 바로 이번 주 정기 발주에 담을지 확인
  if (confirm(`'${name}' 재료가 등록되었습니다.\n지금 바로 이번 주 발주 목록에 담으시겠습니까?`)) {
    quickAddMaterialToOrder(newItem.id, 'regular');
  }
}

// =========================================================================
// 캡쳐 및 이미지 생성 기능 (html2canvas)
// =========================================================================
function openMaterialCaptureModal() {
  const checkedOrders = materialOrders.filter(o => o.checked);
  if (checkedOrders.length === 0) {
    alert('캡쳐할 재료를 1개 이상 체크박스로 선택해주세요!\n재료상별로 전달할 품목만 골라서 체크할 수 있습니다.');
    return;
  }

  // 기본 수신처: 더메이트 귀하
  document.getElementById('capture-supplier-input').value = '더메이트 귀하';

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

  let rowsHtml = checkedOrders.map((ord, idx) => `
    <tr>
      <td style="text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
      <td style="text-align: center; white-space: nowrap;">
        ${ord.urgency === 'urgent' 
          ? '<span style="display: inline-block; white-space: nowrap; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 800; padding: 3px 7px; border-radius: 4px; border: 1px solid #f87171;">🚨 긴급</span>' 
          : '<span style="display: inline-block; white-space: nowrap; background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: 4px;">📦 정기</span>'}
      </td>
      <td style="font-weight: 700; color: #0f172a;">${escapeHtml(ord.name)}</td>
      <td style="color: #475569; font-size: 12px;">${escapeHtml(ord.spec || '-')}</td>
      <td style="text-align: center; font-weight: 800; color: #1e3a8a; white-space: nowrap;">${ord.quantity} ${escapeHtml(ord.unit || 'ea')}</td>
      <td style="color: #64748b; font-size: 12px;">${escapeHtml(ord.note || '-')}</td>
    </tr>
  `).join('');

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
          <th style="width: 38px; text-align: center;">No</th>
          <th style="width: 75px; text-align: center; white-space: nowrap;">구분</th>
          <th>품목명</th>
          <th style="width: 140px;">규격 / 세부사항</th>
          <th style="width: 80px; text-align: center; white-space: nowrap;">수량</th>
          <th style="width: 130px;">비고</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="capture-footer">
      <div>* 수량과 규격확인 부탁드립니다. 감사합니다.</div>
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
      scale: 2, // 고해상도 선명하게
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    link.download = `BD_재료발주서_${dateStr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('html2canvas error:', err);
    alert('이미지 생성 중 오류가 발생했습니다: ' + err.message);
  } finally {
    if (btn) btn.innerText = '📷 이미지로 저장 (다운로드)';
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
          // 클립보드 이미지 API 미지원 브라우저
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

  const supplier = document.getElementById('capture-supplier-input').value || '재료상 귀하';
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;

  let txt = `[서울비디치과기공실 재료 발주서]\n`;
  txt += `수신: ${supplier}\n`;
  txt += `일자: ${dateStr}\n`;
  txt += `------------------------------------\n`;

  checkedOrders.forEach((ord, i) => {
    const tag = ord.urgency === 'urgent' ? '[🚨긴급]' : '[정기]';
    txt += `${i + 1}. ${tag} ${ord.name}`;
    if (ord.spec) txt += ` (${ord.spec})`;
    txt += ` - ${ord.quantity}${ord.unit || 'ea'}`;
    if (ord.note) txt += ` [비고: ${ord.note}]`;
    txt += `\n`;
  });

  txt += `------------------------------------\n`;
  txt += `확인 부탁드립니다. 감사합니다!`;

  navigator.clipboard.writeText(txt).then(() => {
    alert('✅ 발주서 텍스트가 클립보드에 복사되었습니다.\n문자나 카카오톡에 붙여넣어 사용하세요.');
  }).catch(() => {
    prompt('아래 텍스트를 복사하세요:', txt);
  });
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
