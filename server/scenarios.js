// 방탈출 시나리오 목록. 새 시나리오는 여기에 추가한다.
import { CHAPTERS, ENDINGS } from './chapters.js';
import { SHIP_CHAPTERS, SHIP_ENDINGS } from './ship.js';
import { DOLL_CHAPTERS, DOLL_ENDINGS } from './doll.js';
import { HOSPITAL_CHAPTERS, HOSPITAL_ENDINGS } from './hospital.js';
import { CAMP_CHAPTERS, CAMP_ENDINGS } from './camp.js';
import { WEST_CHAPTERS, WEST_ENDINGS } from './west.js';
import { KIMONO_CHAPTERS, KIMONO_ENDINGS } from './kimono.js';
import { ITEMS } from './items.js';

export const SCENARIOS = {
  gwimun: {
    id: 'gwimun', title: '귀문 — 서하리 분교 실종사건', short: '귀문',
    desc: '한국 괴담 · 폐분교 · 7챕터 · 약 4~5시간', difficulty: 5,
    chapters: CHAPTERS, endings: ENDINGS,
    relics: ['relic_1', 'relic_2', 'relic_3', 'relic_4', 'relic_5', 'relic_6', 'relic_7'], relicName: '유품',
    cine: { intro: 'prologue', true: 'ending_true', normal: 'ending_normal' },
    saveKey: (name) => name, // 예전 저장과 호환
    carry: (ch) => [...(ch >= 2 ? ['attendance'] : []), ...(ch >= 6 ? ['shinkal', 'bell', 'fan', 'true_talisman'] : [])],
    startItems: (ch) => (ch >= 2 ? ['talisman'] : []),
  },
  ophelia: {
    id: 'ophelia', title: '오필리아호의 마지막 항해', short: '오필리아호',
    desc: '유령선 · 등대 · 모스 부호 · 4챕터 · 약 2~3시간', difficulty: 4,
    chapters: SHIP_CHAPTERS, endings: SHIP_ENDINGS,
    relics: ['ship_relic_1', 'ship_relic_2', 'ship_relic_3', 'ship_relic_4', 'ship_relic_5'], relicName: '승객의 유품',
    cine: { intro: 'ship_intro', true: 'ship_true', normal: 'ship_normal' },
    saveKey: (name) => 'ophelia:' + name,
    carry: (ch) => [...(ch >= 1 ? ['morse_card'] : []), ...(ch >= 3 ? ['contract'] : [])],
    startItems: () => ['talisman'],
  },
  doll: {
    id: 'doll', title: '인형의 집 — 하트웰 저택', short: '인형의 집',
    desc: '저주받은 인형 · 서양 저택 · 위자보드 · 4챕터 · 약 2~3시간', difficulty: 3,
    chapters: DOLL_CHAPTERS, endings: DOLL_ENDINGS,
    relics: ['doll_relic_1', 'doll_relic_2', 'doll_relic_3', 'doll_relic_4', 'doll_relic_5'], relicName: '아이들의 유품',
    cine: { intro: 'doll_intro', true: 'doll_true', normal: 'doll_normal' },
    saveKey: (name) => 'doll:' + name,
    carry: (ch) => [...(ch >= 2 ? ['mb_key', 'scissors'] : []), ...(ch >= 3 ? ['name_tags'] : [])],
    startItems: () => ['talisman'],
  },
  hospital: {
    id: 'hospital', title: '백야 요양병원 — 7병동의 밤', short: '백야 요양병원',
    desc: '폐병원 · 수면 치료 · 화재의 밤 · 3챕터 · 약 1.5~2시간', difficulty: 4,
    chapters: HOSPITAL_CHAPTERS, endings: HOSPITAL_ENDINGS,
    relics: ['hosp_relic_1', 'hosp_relic_2', 'hosp_relic_3', 'hosp_relic_4', 'hosp_relic_5'], relicName: '환자들의 유품',
    cine: { intro: 'hosp_intro', true: 'hosp_true', normal: 'hosp_normal' },
    saveKey: (name) => 'hospital:' + name,
    carry: (ch) => (ch >= 2 ? ['morgue_key'] : []),
    startItems: () => ['talisman'],
  },
  camp: {
    id: 'camp', title: '반딧불 캠프 — 마지막 캠프파이어', short: '반딧불 캠프',
    desc: '여름 캠프 · 숲과 호수 · 입문용 · 3챕터 · 약 1~1.5시간', difficulty: 2,
    chapters: CAMP_CHAPTERS, endings: CAMP_ENDINGS,
    relics: ['camp_relic_1', 'camp_relic_2', 'camp_relic_3', 'camp_relic_4'], relicName: '아이들의 물건',
    cine: { intro: 'camp_intro', true: 'camp_true', normal: 'camp_normal' },
    saveKey: (name) => 'camp:' + name,
    carry: (ch) => [...(ch >= 1 ? ['matches'] : []), ...(ch >= 2 ? ['boat_key'] : [])],
    startItems: () => ['talisman'],
  },
  west: {
    id: 'west', title: '레드 메사 — 교수대 마을', short: '레드 메사',
    desc: '서부 웨스턴 · 유령 마을 · 누명 · 4챕터 · 약 2~3시간', difficulty: 3,
    chapters: WEST_CHAPTERS, endings: WEST_ENDINGS,
    relics: ['west_relic_1', 'west_relic_2', 'west_relic_3', 'west_relic_4', 'west_relic_5'], relicName: '잭의 유품',
    cine: { intro: 'west_intro', true: 'west_true', normal: 'west_normal' },
    saveKey: (name) => 'west:' + name,
    carry: (ch) => (ch >= 1 ? ['sheriff_log'] : []),
    startItems: () => ['talisman'],
  },
  kimono: {
    id: 'kimono', title: '츠바키야 — 붉은 동백의 밤', short: '츠바키야',
    desc: '일본풍 여관 · 기모노 · 혼례의 밤 · 4챕터 · 약 2~3시간', difficulty: 4,
    chapters: KIMONO_CHAPTERS, endings: KIMONO_ENDINGS,
    relics: ['kimono_relic_1', 'kimono_relic_2', 'kimono_relic_3', 'kimono_relic_6', 'kimono_relic_4', 'kimono_relic_5'], relicName: '유키의 유품',
    cine: { intro: 'kimono_intro', true: 'kimono_true', normal: 'kimono_normal' },
    saveKey: (name) => 'kimono:' + name,
    carry: () => [],
    startItems: () => ['talisman'],
  },
};

export const scenarioList = () => Object.values(SCENARIOS).map((s) => ({ id: s.id, title: s.title, short: s.short, desc: s.desc, difficulty: s.difficulty || 3, chapters: s.chapters.map((c) => c.title) }));
export const relicIcons = (s) => s.relics.map((id) => ITEMS[id]?.icon || '·');
