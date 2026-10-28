/**
 * =========================================================================
 * BD Dental Lab - 점심 식사 주문서 & 식당 룰렛 스크립트 (lunch.js)
 * =========================================================================
 */

// 1. 10개 식당 및 기본 대표 메뉴 프리셋 (차후 사용자가 자유롭게 수정/추가/삭제 가능)
const DEFAULT_RESTAURANTS_DATA = [
  {
    "id": "rest_01",
    "name": "칭마레이",
    "category": "중식",
    "menus": [
      {
        "id": "m_1897401216_1",
        "name": "짜장면",
        "price": 9000
      },
      {
        "id": "m_1897401216_2",
        "name": "삼선간짜장",
        "price": 12000
      },
      {
        "id": "m_1897401216_3",
        "name": "쟁반짜장",
        "price": 15000
      },
      {
        "id": "m_1897401216_4",
        "name": "짬뽕",
        "price": 12000
      },
      {
        "id": "m_1897401216_5",
        "name": "백짬뽕",
        "price": 12000
      },
      {
        "id": "m_1897401216_6",
        "name": "우동",
        "price": 12000
      },
      {
        "id": "m_1897401216_7",
        "name": "잡탕밥",
        "price": 16000
      },
      {
        "id": "m_1897401216_8",
        "name": "유산슬밥",
        "price": 15000
      },
      {
        "id": "m_1897401216_9",
        "name": "새우볶음밥",
        "price": 10000
      },
      {
        "id": "m_1897401216_10",
        "name": "게살해창볶음밥",
        "price": 13000
      },
      {
        "id": "m_1897401216_11",
        "name": "소고기잡채밥",
        "price": 12000
      },
      {
        "id": "m_1897401216_12",
        "name": "짬뽕밥",
        "price": 12000
      },
      {
        "id": "m_1897401216_13",
        "name": "가지덮밥",
        "price": 14000
      },
      {
        "id": "m_1897401216_14",
        "name": "중국냉면",
        "price": 14000
      },
      {
        "id": "m_1897401216_15",
        "name": "냉짬뽕",
        "price": 14000
      },
      {
        "id": "m_1897401216_16",
        "name": "마라탕면",
        "price": 14000
      },
      {
        "id": "m_1897401216_17",
        "name": "사천해물볶음면",
        "price": 14000
      }
    ]
  },
  {
    "id": "rest_02",
    "name": "후우후",
    "category": "일식/덮밥",
    "menus": [
      {
        "id": "m_1923567726_1",
        "name": "사시미 모리아와세",
        "price": 38000
      },
      {
        "id": "m_1923567726_2",
        "name": "카이센동",
        "price": 19000
      },
      {
        "id": "m_1923567726_3",
        "name": "사케동",
        "price": 15000
      },
      {
        "id": "m_1923567726_4",
        "name": "모둠초밥A",
        "price": 17000
      },
      {
        "id": "m_1923567726_5",
        "name": "모둠초밥B",
        "price": 22000
      },
      {
        "id": "m_1923567726_6",
        "name": "광어초밥",
        "price": 22000
      },
      {
        "id": "m_1923567726_7",
        "name": "연어초밥",
        "price": 19000
      },
      {
        "id": "m_1923567726_8",
        "name": "광/연초밥",
        "price": 21000
      },
      {
        "id": "m_1923567726_9",
        "name": "냉모밀&초밥정식",
        "price": 14000
      },
      {
        "id": "m_1923567726_10",
        "name": "냉모밀&돈카츠정식",
        "price": 12000
      },
      {
        "id": "m_1923567726_11",
        "name": "우동&초밥정식",
        "price": 12000
      },
      {
        "id": "m_1923567726_12",
        "name": "우동&돈카츠정식",
        "price": 10000
      },
      {
        "id": "m_1923567726_13",
        "name": "치즈돈카츠",
        "price": 13000
      },
      {
        "id": "m_1923567726_14",
        "name": "돈카츠정식",
        "price": 12000
      },
      {
        "id": "m_1923567726_15",
        "name": "카레정식(돈카츠/가라아게/새우튀김)",
        "price": 8000
      },
      {
        "id": "m_1923567726_16",
        "name": "카레우동&돈카츠정식",
        "price": 12000
      }
    ]
  },
  {
    "id": "rest_03",
    "name": "임방식당",
    "category": "한식",
    "menus": [
      {
        "id": "m_ib_01",
        "name": "한우차돌된장찌개",
        "price": 10000
      },
      {
        "id": "m_ib_02",
        "name": "묵은지김치찌개",
        "price": 9000
      },
      {
        "id": "m_ib_03",
        "name": "제육볶음 정식",
        "price": 10000
      },
      {
        "id": "m_ib_04",
        "name": "한우육회비빔밥",
        "price": 12000
      },
      {
        "id": "m_ib_05",
        "name": "뚝배기불고기",
        "price": 11000
      },
      {
        "id": "m_ib_06",
        "name": "삼겹살구이(200g)",
        "price": 16000
      },
      {
        "id": "m_ib_07",
        "name": "목살구이(200g)",
        "price": 16000
      }
    ]
  },
  {
    "id": "rest_04",
    "name": "육수당",
    "category": "국밥/수육",
    "menus": [
      {
        "id": "m_1549182522_1",
        "name": "[시그니처] 서울식 얼큰국밥",
        "price": 12000
      },
      {
        "id": "m_1549182522_2",
        "name": "수육국밥",
        "price": 10000
      },
      {
        "id": "m_1549182522_3",
        "name": "순대국밥",
        "price": 10000
      },
      {
        "id": "m_1549182522_4",
        "name": "[재주문율 1위] 육개장",
        "price": 12000
      },
      {
        "id": "m_1549182522_5",
        "name": "콩나물국밥",
        "price": 9000
      },
      {
        "id": "m_1549182522_6",
        "name": "[보양] 누룽지 반마리 삼계탕",
        "price": 16000
      },
      {
        "id": "m_1549182522_7",
        "name": "물막국수 세트",
        "price": 13000
      },
      {
        "id": "m_1549182522_8",
        "name": "비빔막국수 세트",
        "price": 13000
      },
      {
        "id": "m_1549182522_9",
        "name": "물막국수",
        "price": 10000
      },
      {
        "id": "m_1549182522_10",
        "name": "비빔막국수",
        "price": 10000
      },
      {
        "id": "m_1549182522_11",
        "name": "수육국밥 [돼지국밥]",
        "price": 10000
      },
      {
        "id": "m_1549182522_12",
        "name": "[푸짐] 우거지 뼈해장국",
        "price": 13000
      },
      {
        "id": "m_1549182522_13",
        "name": "뚝배기 불고기",
        "price": 12500
      },
      {
        "id": "m_1549182522_14",
        "name": "부대국밥 [1인 부대찌개]",
        "price": 11000
      },
      {
        "id": "m_1549182522_15",
        "name": "[소내장탕] 소양곰탕",
        "price": 16000
      },
      {
        "id": "m_1549182522_16",
        "name": "바지락 순두부찌개",
        "price": 11000
      }
    ]
  },
  {
    "id": "rest_05",
    "name": "또또김밥",
    "category": "분식",
    "menus": [
      {
        "id": "m_1667471492_1",
        "name": "또또모듬세트11줄",
        "price": 11000
      },
      {
        "id": "m_1667471492_2",
        "name": "아이스쫄면",
        "price": 7900
      },
      {
        "id": "m_1667471492_3",
        "name": "국물떡볶이",
        "price": 5000
      },
      {
        "id": "m_1667471492_4",
        "name": "또또꼬마김밥 10줄",
        "price": 8500
      },
      {
        "id": "m_1667471492_5",
        "name": "또또꼬마김밥 7줄",
        "price": 6300
      },
      {
        "id": "m_1667471492_6",
        "name": "또또꼬마김밥 5줄",
        "price": 4500
      },
      {
        "id": "m_1667471492_7",
        "name": "참치꼬마김밥",
        "price": 5500
      },
      {
        "id": "m_1667471492_8",
        "name": "치즈꼬마김밥",
        "price": 5500
      },
      {
        "id": "m_1667471492_9",
        "name": "땡초참치김밥",
        "price": 6000
      },
      {
        "id": "m_1667471492_10",
        "name": "유부우엉꼬마김밥",
        "price": 6000
      },
      {
        "id": "m_1667471492_11",
        "name": "매운어묵꼬마김밥",
        "price": 6000
      },
      {
        "id": "m_1667471492_12",
        "name": "또제떡볶이",
        "price": 6000
      },
      {
        "id": "m_1667471492_13",
        "name": "쫄면",
        "price": 6500
      },
      {
        "id": "m_1667471492_14",
        "name": "어묵탕",
        "price": 7000
      },
      {
        "id": "m_1667471492_15",
        "name": "또또우동",
        "price": 6500
      },
      {
        "id": "m_1667471492_16",
        "name": "또또아이스티",
        "price": 3500
      },
      {
        "id": "m_1667471492_17",
        "name": "아메리카노",
        "price": 3000
      }
    ]
  },
  {
    "id": "rest_06",
    "name": "고릴라쿡",
    "category": "양식/덮밥",
    "menus": [
      {
        "id": "m_1560001987_1",
        "name": "스팸마요덮밥",
        "price": 8900
      },
      {
        "id": "m_1560001987_2",
        "name": "참치마요덮밥",
        "price": 8900
      },
      {
        "id": "m_1560001987_3",
        "name": "제육덮밥",
        "price": 9000
      },
      {
        "id": "m_1560001987_4",
        "name": "갈비양념덮밥",
        "price": 9000
      },
      {
        "id": "m_1560001987_5",
        "name": "치킨마요덮밥",
        "price": 8500
      },
      {
        "id": "m_1560001987_6",
        "name": "우삼겹덮밥",
        "price": 10000
      },
      {
        "id": "m_1560001987_7",
        "name": "오징어덮밥",
        "price": 9000
      },
      {
        "id": "m_1560001987_8",
        "name": "돼지김치찌개",
        "price": 10000
      },
      {
        "id": "m_1560001987_9",
        "name": "우삼겹김치찌개",
        "price": 11000
      },
      {
        "id": "m_1560001987_10",
        "name": "냉소바",
        "price": 7500
      },
      {
        "id": "m_1560001987_11",
        "name": "돈가스",
        "price": 8000
      },
      {
        "id": "m_1560001987_12",
        "name": "치즈돈가스",
        "price": 9000
      },
      {
        "id": "m_1560001987_13",
        "name": "고구마돈가스",
        "price": 9000
      },
      {
        "id": "m_1560001987_14",
        "name": "왕돈가스",
        "price": 10000
      },
      {
        "id": "m_1560001987_15",
        "name": "김치볶음밥",
        "price": 8000
      },
      {
        "id": "m_1560001987_16",
        "name": "새우볶음밥",
        "price": 8000
      },
      {
        "id": "m_1560001987_17",
        "name": "버터계란볶음밥",
        "price": 8000
      },
      {
        "id": "m_1560001987_18",
        "name": "순두부찌개",
        "price": 8500
      },
      {
        "id": "m_1560001987_19",
        "name": "참치김치찌개",
        "price": 9500
      },
      {
        "id": "m_1560001987_20",
        "name": "된장찌개",
        "price": 8500
      },
      {
        "id": "m_1560001987_21",
        "name": "뚝배기불고기",
        "price": 8500
      },
      {
        "id": "m_1560001987_22",
        "name": "쫄면",
        "price": 7000
      },
      {
        "id": "m_1560001987_23",
        "name": "떡볶이",
        "price": 5000
      },
      {
        "id": "m_1560001987_24",
        "name": "라볶이",
        "price": 6000
      },
      {
        "id": "m_1560001987_25",
        "name": "우동",
        "price": 6000
      },
      {
        "id": "m_1560001987_26",
        "name": "김치우동",
        "price": 7000
      },
      {
        "id": "m_1560001987_27",
        "name": "해장라면",
        "price": 6000
      },
      {
        "id": "m_1560001987_28",
        "name": "치즈라면",
        "price": 5000
      },
      {
        "id": "m_1560001987_29",
        "name": "떡라면",
        "price": 5000
      },
      {
        "id": "m_1560001987_30",
        "name": "라면",
        "price": 4500
      },
      {
        "id": "m_1560001987_31",
        "name": "만두라면",
        "price": 5500
      },
      {
        "id": "m_1560001987_32",
        "name": "일반김밥",
        "price": 3500
      },
      {
        "id": "m_1560001987_33",
        "name": "치즈김밥",
        "price": 4500
      },
      {
        "id": "m_1560001987_34",
        "name": "참치김밥",
        "price": 4800
      }
    ]
  },
  {
    "id": "rest_07",
    "name": "카페 그리닝",
    "category": "샐러드/샌드위치",
    "menus": [
      {
        "id": "m_1920712454_1",
        "name": "반반 도시락 (샌드위치+샐러드)",
        "price": 9900
      },
      {
        "id": "m_1920712454_2",
        "name": "소불고기에그 샌드위치",
        "price": 9500
      },
      {
        "id": "m_1920712454_3",
        "name": "(수페리어급 노르웨이)생연어포케",
        "price": 13900
      },
      {
        "id": "m_1920712454_4",
        "name": "부채살 스테이크 샐러드",
        "price": 12900
      },
      {
        "id": "m_1920712454_5",
        "name": "훈제오리 샐러드",
        "price": 10900
      },
      {
        "id": "m_1920712454_6",
        "name": "우삼겹 샐러드",
        "price": 11900
      },
      {
        "id": "m_1920712454_7",
        "name": "목살 스테이크 샐러드",
        "price": 10900
      },
      {
        "id": "m_1920712454_8",
        "name": "베이컨 크림 파스타 샐러드",
        "price": 11900
      },
      {
        "id": "m_1920712454_9",
        "name": "소불고기 샐러드",
        "price": 10500
      },
      {
        "id": "m_1920712454_10",
        "name": "오동통 새우 샐러드",
        "price": 9900
      },
      {
        "id": "m_1920712454_11",
        "name": "육회 샐러드",
        "price": 9900
      },
      {
        "id": "m_1920712454_12",
        "name": "타코치킨 샐러드",
        "price": 9500
      },
      {
        "id": "m_1920712454_13",
        "name": "크림파스타 샐러드",
        "price": 8500
      },
      {
        "id": "m_1920712454_14",
        "name": "리코타치즈 샐러드",
        "price": 9300
      },
      {
        "id": "m_1920712454_15",
        "name": "에그포테이토 샐러드",
        "price": 9400
      },
      {
        "id": "m_1920712454_16",
        "name": "베이컨 샐러드",
        "price": 8500
      },
      {
        "id": "m_1920712454_17",
        "name": "다이어트 닭가슴살 샐러드",
        "price": 8900
      },
      {
        "id": "m_1920712454_18",
        "name": "게살와사마요 샐러드",
        "price": 8400
      },
      {
        "id": "m_1920712454_19",
        "name": "단호박 샐러드",
        "price": 8400
      },
      {
        "id": "m_1920712454_20",
        "name": "오트밀 그린 샐러드",
        "price": 7900
      },
      {
        "id": "m_1920712454_21",
        "name": "생연어 샐러드",
        "price": 11900
      },
      {
        "id": "m_1920712454_22",
        "name": "오동통새우 샌드위치",
        "price": 8900
      },
      {
        "id": "m_1920712454_23",
        "name": "리코타치즈 샌드위치",
        "price": 8900
      },
      {
        "id": "m_1920712454_24",
        "name": "단호박 닭가슴살 샌드위치",
        "price": 8900
      },
      {
        "id": "m_1920712454_25",
        "name": "베이컨에그 샌드위치",
        "price": 8500
      },
      {
        "id": "m_1920712454_26",
        "name": "햄에그포테이토 샌드위치",
        "price": 8400
      },
      {
        "id": "m_1920712454_27",
        "name": "불닭치즈 샌드위치",
        "price": 7900
      },
      {
        "id": "m_1920712454_28",
        "name": "닭가슴살 할라피뇨",
        "price": 7900
      },
      {
        "id": "m_1920712454_29",
        "name": "단호박 샌드위치",
        "price": 7400
      },
      {
        "id": "m_1920712454_30",
        "name": "햄에그 샌드위치",
        "price": 7400
      },
      {
        "id": "m_1920712454_31",
        "name": "햄치즈 샌드위치",
        "price": 6800
      },
      {
        "id": "m_1920712454_32",
        "name": "훈제오리 포케",
        "price": 11900
      },
      {
        "id": "m_1920712454_33",
        "name": "우삼겹 포케",
        "price": 12900
      },
      {
        "id": "m_1920712454_34",
        "name": "부채살 스테이크 포케",
        "price": 13900
      },
      {
        "id": "m_1920712454_35",
        "name": "목살 스테이크 포케",
        "price": 11900
      },
      {
        "id": "m_1920712454_36",
        "name": "베이컨 포케",
        "price": 11300
      },
      {
        "id": "m_1920712454_37",
        "name": "소불고기 포케",
        "price": 13500
      },
      {
        "id": "m_1920712454_38",
        "name": "육회 포케",
        "price": 12300
      },
      {
        "id": "m_1920712454_39",
        "name": "오동통 새우 포케",
        "price": 12300
      },
      {
        "id": "m_1920712454_40",
        "name": "타코치킨 포케",
        "price": 11900
      },
      {
        "id": "m_1920712454_41",
        "name": "닭가슴살 포케",
        "price": 11300
      },
      {
        "id": "m_1920712454_42",
        "name": "게살 와사마요 포케",
        "price": 10300
      }
    ]
  },
  {
    "id": "rest_08",
    "name": "취향마라",
    "category": "마라탕",
    "menus": [
      {
        "id": "m_qm_01",
        "name": "마라탕 (기본 1인분)",
        "price": 10000
      },
      {
        "id": "m_qm_02",
        "name": "마라샹궈 (기본 1인)",
        "price": 16000
      },
      {
        "id": "m_qm_03",
        "name": "꿔바로우 (소)",
        "price": 11000
      },
      {
        "id": "m_qm_04",
        "name": "꿔바로우 (대)",
        "price": 16000
      },
      {
        "id": "m_qm_05",
        "name": "계란새우볶음밥",
        "price": 8000
      },
      {
        "id": "m_qm_06",
        "name": "연유꽃빵(4개)",
        "price": 5000
      },
      {
        "id": "m_qm_07",
        "name": "소고기 추가(100g)",
        "price": 3000
      }
    ]
  },
  {
    "id": "rest_09",
    "name": "진심 왕돈가스",
    "category": "돈까스",
    "menus": [
      {
        "id": "m_2045794739_1",
        "name": "진심 왕 돈까스",
        "price": 11900
      },
      {
        "id": "m_2045794739_2",
        "name": "진심 매운 왕 돈까스",
        "price": 12400
      },
      {
        "id": "m_2045794739_3",
        "name": "진심 왕 더블돈까스",
        "price": 17900
      },
      {
        "id": "m_2045794739_4",
        "name": "진심 매운 왕 더블돈까스",
        "price": 18400
      },
      {
        "id": "m_2045794739_5",
        "name": "진심 쫄돈까스",
        "price": 15900
      },
      {
        "id": "m_2045794739_6",
        "name": "진심 쫄생선까스",
        "price": 15900
      },
      {
        "id": "m_2045794739_7",
        "name": "진심 쫄치즈까스",
        "price": 19900
      },
      {
        "id": "m_2045794739_8",
        "name": "치즈 폭포 돈까스",
        "price": 15900
      },
      {
        "id": "m_2045794739_9",
        "name": "매운 치즈 폭포 돈까스",
        "price": 17400
      },
      {
        "id": "m_2045794739_10",
        "name": "고구마 치즈 돈까스",
        "price": 17900
      },
      {
        "id": "m_2045794739_11",
        "name": "진심 생선까스",
        "price": 12900
      },
      {
        "id": "m_2045794739_12",
        "name": "진심 돈까스 김치 나베",
        "price": 12900
      },
      {
        "id": "m_2045794739_13",
        "name": "진심 카레 돈까스",
        "price": 13900
      },
      {
        "id": "m_2045794739_14",
        "name": "치즈 폭포 카레 돈까스",
        "price": 17900
      },
      {
        "id": "m_2045794739_15",
        "name": "진심 소세지 카레 덮밥",
        "price": 11900
      },
      {
        "id": "m_2045794739_16",
        "name": "진심 왕 비빔밥",
        "price": 11900
      },
      {
        "id": "m_2045794739_17",
        "name": "진심 왕 쫄면",
        "price": 9500
      },
      {
        "id": "m_2045794739_18",
        "name": "멸치 칼국수",
        "price": 8900
      },
      {
        "id": "m_2045794739_19",
        "name": "얼큰 멸치 칼국수",
        "price": 9400
      },
      {
        "id": "m_2045794739_20",
        "name": "어묵꼬치 우동",
        "price": 8900
      },
      {
        "id": "m_2045794739_21",
        "name": "진심 김치우동",
        "price": 8900
      },
      {
        "id": "m_2045794739_22",
        "name": "새우튀김 우동",
        "price": 8900
      },
      {
        "id": "m_2045794739_23",
        "name": "물냉면",
        "price": 8900
      },
      {
        "id": "m_2045794739_24",
        "name": "비빔냉면",
        "price": 9900
      },
      {
        "id": "m_2045794739_25",
        "name": "냉모밀",
        "price": 8900
      },
      {
        "id": "m_2045794739_26",
        "name": "진심 떡볶이",
        "price": 7900
      },
      {
        "id": "m_2045794739_27",
        "name": "왕새우튀김(3p)",
        "price": 6000
      },
      {
        "id": "m_2045794739_28",
        "name": "군만두(5p)",
        "price": 5500
      },
      {
        "id": "m_2045794739_29",
        "name": "치킨텐더(4p)",
        "price": 5500
      }
    ]
  },
  {
    "id": "rest_10",
    "name": "마테아",
    "category": "이탈리안",
    "menus": [
      {
        "id": "m_mt_01",
        "name": "생연어 베이글 샌드위치",
        "price": 9500
      },
      {
        "id": "m_mt_02",
        "name": "큐브 목살 스테이크 샐러드",
        "price": 10500
      },
      {
        "id": "m_mt_03",
        "name": "오믈렛 당근라페 샌드위치",
        "price": 7800
      },
      {
        "id": "m_mt_04",
        "name": "클럽 샌드위치",
        "price": 8000
      },
      {
        "id": "m_mt_05",
        "name": "제육덮밥",
        "price": 9000
      },
      {
        "id": "m_mt_06",
        "name": "쫄면샐러드",
        "price": 8500
      },
      {
        "id": "m_mt_07",
        "name": "아메리카노",
        "price": 4000
      }
    ]
  },
  {
    "id": "rest_11",
    "name": "뼈대가문",
    "category": "한식/감자탕",
    "menus": [
      {
        "id": "m_1511840748_1",
        "name": "뼈우거지해장국",
        "price": 11000
      },
      {
        "id": "m_1511840748_2",
        "name": "부대탕",
        "price": 11000
      },
      {
        "id": "m_1511840748_3",
        "name": "등심 돈까스",
        "price": 11000
      },
      {
        "id": "m_1511840748_4",
        "name": "뼈 전골(대)",
        "price": 50000
      },
      {
        "id": "m_1511840748_5",
        "name": "뼈 전골(중)",
        "price": 41000
      }
    ]
  }
];

// 로컬스토리지 키
const STORAGE_KEY_LUNCH_RESTS = 'bd_lunch_restaurants_data_v2';
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
  renderLunchTab();
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

// 오늘 뭐먹지? 룰렛 모달 열기/닫기
function openLunchRouletteModal() {
  const modal = document.getElementById('lunch-roulette-modal');
  if (modal) {
    modal.classList.add('active');
    renderLunchRouletteCandidates();
  }
}

function closeLunchRouletteModal() {
  const modal = document.getElementById('lunch-roulette-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

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
    candidateRestaurantIds = [];
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
            <button type="button" class="btn-primary" style="margin-left: 8px; padding: 4px 10px; font-size: 12px;" onclick="selectRestaurantTab('${winner.id}'); closeLunchRouletteModal();">
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
        <div class="menu-item-info">
          <div class="menu-item-name" title="${escapeHtml(m.name)}">${escapeHtml(m.name)}</div>
          <div class="menu-item-price">${m.price.toLocaleString()}원</div>
          ${currentQty > 0 ? `<span class="menu-item-ordered-badge">주문서에 ${currentQty}개 담김</span>` : ''}
        </div>
        <div class="menu-item-actions">
          <button type="button" class="btn-primary btn-menu-add" onclick="addMenuDirectToOrder('${rest.id}', '${m.id}')" title="주문서에 담기 (클릭할 때마다 1개씩 추가)">
            담기 +
          </button>
          <button type="button" class="btn-menu-icon" onclick="openEditMenuModal('${rest.id}', '${m.id}')" title="메뉴 수정">
            ✏️
          </button>
          <button type="button" class="btn-danger btn-menu-icon" onclick="deleteRestaurantMenu('${rest.id}', '${m.id}')" title="메뉴 삭제">
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
        <td style="text-align: center; width: 110px;">
          <div class="qty-controller" style="margin: 0 auto;">
            <button type="button" class="qty-btn" onclick="changeLunchOrderQty('${ord.id}', -1)" title="1개 감소">-</button>
            <input type="number" class="qty-input" min="1" value="${ord.quantity || 1}" onclick="this.select()" onfocus="this.select()" onchange="updateLunchOrderQtyDirect('${ord.id}', this.value)" title="클릭하여 수량 직접 입력" />
            <button type="button" class="qty-btn" onclick="changeLunchOrderQty('${ord.id}', 1)" title="1개 증가">+</button>
          </div>
        </td>
        <td style="text-align: right; font-weight: 800; color: #2563eb; width: 90px;">${itemTotal.toLocaleString()}원</td>
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

// 카카오톡 단톡방 공유용 텍스트 복사 (사용자 지정 양식)
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
  const overAmount = diff > 0 ? diff : 0;

  // 전체 메뉴별 주문 수량 취합
  const menuMap = {};
  orders.forEach(o => {
    menuMap[o.menuName] = (menuMap[o.menuName] || 0) + (o.quantity || 1);
  });

  let txt = `[서울비디치과 점심주문]\n`;
  txt += `${todayStr} , 식사인원 총 ${eatingCount}명\n`;
  txt += `총주문액 : ${totalOrderPrice.toLocaleString()}원 초과금액${overAmount.toLocaleString()}원\n`;
  txt += `--주문취합--\n`;
  for (const [mName, qty] of Object.entries(menuMap)) {
    txt += `${mName} * ${qty}개\n`;
  }
  txt += `---------------\n`;
  txt += `감사합니다.`;

  navigator.clipboard.writeText(txt).then(() => {
    alert('✅ 주문서 텍스트가 복사되었습니다!\n단톡방 등에 붙여넣어 전송하세요.');
  }).catch(() => {
    prompt('아래 텍스트를 복사하세요:', txt);
  });
}
