# MIA 첫 챕터 그래픽 테스트

이 브랜치는 `preview/graphics-remaster-ch1`입니다. main 병합·운영 배포는 하지 않았습니다.

## 실제 첫 챕터 선정

`server/scenarios.js`에서 첫 번째이자 기본 입문 테마는 **미아 — 달빛 문방구의 숨바꼭질**입니다. 첫 플레이 공간은 `server/mia.js`의 **1장 · 달동네 골목 (id 0)** 입니다. 귀문은 별도 선택 테마이며 귀문의 id 0은 야외 프롤로그, 학교 교실은 id 1입니다. 요청의 '실제 진행 구조에 따라 판단' 조건에 따라 미아 id 0만 개선합니다. 학교나 실내 복도를 새로 추가하지 않았습니다. 문방구 내부인 2장부터는 원본입니다.

## PC 실행

Node.js 20 이상 권장(검증 환경 Node 24). 브랜치 ZIP을 내려받아 압축을 풀거나 아래처럼 가져옵니다.

```bash
git clone --branch preview/graphics-remaster-ch1 https://github.com/nexsixflux149/mia.git
cd mia
npm ci
npm run preview
```

브라우저에서 **http://localhost:3100/** 접속 → 닉네임 입력 → 입장하기 → 왼쪽 아래 **첫 챕터 플레이**. 프롤로그 영상만 건너뛰고 원래 파티/게임 시작 API를 사용합니다. 첫 챕터 설명의 '계속'을 누르세요. 화면 아래 패널 제목을 누르면 접어서 HUD를 확보할 수 있습니다.

Windows: `preview/시작.bat`을 더블클릭합니다. Node가 없으면 설치 안내 후 종료합니다. 첫 실행에만 npm 의존성을 설치합니다. 설치가 실패하면 서버를 시작하지 않습니다.

종료는 터미널 **Ctrl+C**, 재실행은 같은 명령/배치 파일입니다. 로컬 기록은 `.preview-data`에만 남습니다. 서버 종료 후 이 폴더를 지우면 테스트 기록을 초기화합니다. 기존 `data`는 건드리지 않습니다. 브라우저 설정은 별도 포트의 origin별 localStorage에 저장되므로 운영 사이트와 분리됩니다.

포트 충돌 시 PowerShell:

```powershell
$env:PREVIEW_PORT="3101"
npm run preview
```

macOS/Linux: `PREVIEW_PORT=3101 npm run preview`. 브라우저 주소의 포트도 바꾸세요.

## 플레이 및 비교

WASD 이동, Shift 달리기, C 웅크리기, Space 점프, 드래그 시점, R 카메라 정렬, E/클릭 조사, F 손전등, J 수첩, H 힌트. 기존 조작·애니메이션·충돌과 상호작용 거리를 그대로 사용합니다.

첫 챕터: 전봇대 전단지 조사 → 셔터 옆 쪽지와 날짜 단서 확인 → 자물쇠 풀기 → 문방구 진입. 선택 유품은 손전등을 가지고 담벼락 낙서를 조사한 뒤 가로등 아래 우산에서 얻습니다. 기존 서버는 손전등 소지 여부로 단서 공개를 판정하며 그 규칙을 유지합니다.

왼쪽 아래 테스트 패널:

- **원본 보기 / 리마스터 보기**: 같은 씬·같은 카메라·같은 퍼즐 상태에서 재질·조명만 전환. 진행 초기화 없음.
- **낮음**: DPR 상한 0.8, 후처리 우회, 실시간 그림자 없음, 가까운 월드 점광원 최대 2개.
- **보통**: DPR 상한 1.15, 제한적인 색보정, 그림자 없음, 월드 점광원 최대 4개.
- **높음**: DPR 상한 1.5, 달빛 하나의 1024 그림자맵, 월드 점광원 최대 6개.
- 공통: 기기 DPR이 더 낮으면 그 값을 사용. 느린 프레임이 지속되면 DPR을 낮추고, 여유가 지속되면 프리셋 한도까지 복구. 기하/게임 속도는 바꾸지 않음.
- **공포 화면 효과**: 흔들림·위험 후처리·가로등 변동 강도. 0에서는 점프스케어 화면과 일시적인 붉은 화면도 끔. 기존 소리·퍼즐/AI 상태는 유지. 첫 챕터에는 추격 귀신이 없으며 다른 챕터의 공포도는 원래 설정을 사용.
- FPS / calls / triangles / textures / DPR은 현재 브라우저에서 관찰하는 수치입니다. GPU 메모리 바이트 측정이 아닙니다. calls/triangles는 이름표 오버레이를 제외한 월드 및 후처리 패스 합계입니다.

테스트 패널의 품질은 첫 챕터에만 적용됩니다. 기존 설정 창의 품질은 로비/원본 렌더링 설정입니다. 다른 챕터로 가면 원본 재질·안개·노출·품질을 복구하고 미리보기 전용 GPU 리소스를 해제합니다.

## 독립성 및 오프라인

`preview/start.mjs`는 환경변수를 허용 목록으로 새로 구성합니다. DATABASE_URL, ADMIN_PASSWORD, PUBLIC_URL, RENDER_EXTERNAL_URL 및 클라우드 자격 증명을 전달하지 않습니다. 미리보기 모드에서 `.env`와 `.env.local`도 읽지 않습니다. 같은 Express/Socket.IO/GameInstance 엔진을 새 프로세스로 실행하며 저장 폴더·포트·세션은 분리됩니다. 서버 기본 바인딩은 127.0.0.1입니다.

Node와 npm 패키지를 최초 설치할 때만 인터넷이 필요합니다. 설치된 폴더를 보관하면 게임·사운드(기존 Web Audio 합성)·Three.js·재질·솔로·로컬 저장은 인터넷 없이 실행할 수 있습니다. Google 웹폰트 외부 요청 대신 원래 글꼴을 동봉한 로컬 WOFF2 파일로 제공합니다. 외부 인증은 없습니다. 후원/제작자 링크는 클릭 시 외부 페이지로 이동합니다.

같은 PC의 별도 브라우저/창으로 파티를 구성할 수 있습니다. LAN 테스트는 PowerShell에서 `$env:PREVIEW_HOST="0.0.0.0"` 후 실행하고 PC의 사설 IP와 해당 포트로 접속합니다. 방화벽 허용이 필요할 수 있습니다. 기본 localhost 전용 설정에서 콘솔의 기존 LAN 안내 주소는 접속할 수 없습니다.

미리보기 WebRTC는 외부 STUN을 사용하지 않습니다. 같은 PC/접근 가능한 LAN에서 직접 연결을 시도하지만 브라우저 권한·네트워크 정책에 따라 달라집니다. 원격 인터넷 음성은 보장하지 않습니다. 마이크는 localhost 또는 HTTPS가 필요합니다. 실제 마이크 송수신은 수동 확인이 필요합니다.

## 온라인 준비 (미배포)

`preview/render.yaml`은 새 테스트 서비스용이며 자동 배포를 끕니다. 운영 `render.yaml`, Dockerfile, 서비스 URL은 수정하지 않았습니다. 실제 외부 배포는 사용자의 별도 승인 뒤 진행해야 합니다. 아직 유효한 온라인 URL은 없습니다.

승인 후 새 서비스에서 이 작업 브랜치와 `preview/render.yaml`을 명시 선택합니다. 운영 DB/비밀키/커스텀 도메인을 연결하지 마세요. 테스트 기록은 인스턴스 파일에 저장되며 호스트 재시작/재배포 시 사라질 수 있습니다. 서비스 정지는 호스팅 대시보드에서 합니다. 무료 정책/요금은 배포 전에 확인합니다.

로컬 Docker 대안(빌드는 Docker 설치와 이미지/패키지 다운로드 필요):

```bash
docker build -f preview/Dockerfile -t mia-preview .
docker run --rm -p 127.0.0.1:3100:3100 mia-preview
```

실제 Docker 빌드/외부 호스팅 검증은 수행 여부를 테스트 보고서에서 확인하세요.

## 구조 분석과 변경 파일

| 위치 | 기존 역할 / 이번 작업 |
|---|---|
| public/js/world.js | 테마·챕터 geometry/장식·조명·충돌·오브젝트·파티클. 수정 없음 |
| public/js/props.js | 절차 생성 소품, geometry/material 캐시. 수정 없음 |
| public/js/avatar.js | 둥근 머리·작은 몸의 귀여운 아바타, 리깅·이동/감정 애니메이션. 수정 없음 |
| public/js/main.js | 입력·카메라·가림 처리·상호작용·15Hz 위치 전송/보간·게임 이벤트. 미리보기 생명주기 및 효과 강도 훅 추가 |
| public/js/fx.js | EffectComposer, 색보정/공포 셰이더, 빔. 미리보기 전용 3단계 렌더링 경로 추가 |
| public/js/remaster-preview.js | 대상 판정·복원 가능한 재질 교체·조명/안개·패널·계측·적응 해상도 |
| public/js/ghosts.js, scare.js, audio.js | 귀신 모델·애니메이션·점프스케어·합성 사운드. 수정 없음 |
| public/js/voice.js | WebRTC P2P, Socket.IO 신호 중계. 미리보기에서 외부 STUN만 제외 |
| server/game.js, mia.js, scenarios.js, items.js | 권위 서버 퍼즐·아이템·귀신 AI·진행/챕터 데이터. 수정 없음 |
| server/index.js | 기존 네트워크/세션/저장. 미리보기 HTML 처리와 바인딩 분기만 추가 |
| server/env.js | 미리보기에서 환경 파일 읽기 차단 |
| preview/* | 로컬 실행·Windows 배치·선택적 자동 검증·미배포 호스팅 설정 |

## 에셋 및 최적화 결정

새 외부 에셋 없음. 256×256 절차 생성 색/러프니스/노멀맵 3종(석재·목재·녹슨 금속)은 이 브랜치에서 직접 작성한 알고리즘으로 생성하며 시드가 고정됩니다. 원본 글씨/표지판 텍스처를 덮어쓰지 않습니다. 기존 둥근 아바타는 유지하고 환경광·필라이트를 낮춰 캐릭터와 배경을 대비시킵니다. 기존 집·담장·셔터·가로등·소품에만 표면 디테일을 적용합니다.

재질별 복제본을 공유하고 원본 캐시를 변형하지 않습니다. 기존 geometry 캐시·정적 행렬 최적화·기본 frustum culling을 유지합니다. 낮음의 후처리 제거, DPR 제한/자동 조절, 점광원 수 제한, 그림자광 하나가 이번 최적화입니다. 점광원 선택은 매 프레임 정렬 대신 초당 4회 갱신합니다. 원본 모델을 재구성하지 않아 충돌/인터랙션 위험을 줄입니다.

InstancedMesh/LOD/KTX2/아틀라스는 이번 소규모 256 텍스처와 상호작용 객체 구조에 임의 적용하지 않았습니다. 전체 객체 통합은 기존 개별 애니메이션·가림 처리·클릭 대상에 영향을 줄 수 있습니다. 실제 GPU 프로파일링 없이 성능 개선을 달성했다고 단정하지 않습니다.

## 검증 실행

게임은 native ES modules이므로 별도 번들 빌드는 없습니다.

```bash
npm ci
npm run preview:check
npm ci --prefix preview
npx --prefix preview playwright install chromium
npm test --prefix preview
```

이미 설치된 Chromium 사용 시 macOS/Linux는 `CHROMIUM_PATH=/경로/chromium npm test --prefix preview`, PowerShell은 `$env:CHROMIUM_PATH="C:\\경로\\chrome.exe"` 후 테스트 실행. 브라우저 설치 명령이 환경에 따라 실패하면 `cd preview` 후 `npx playwright install chromium`을 실행하세요.

검증 스크립트는 별도 3102 서버를 자동 실행/종료합니다. 결과와 스크린샷은 `.preview-artifacts/`에 저장합니다. 테스트 중 실제 첫 챕터를 풀어 다음 챕터로 넘어가므로 테스트 닉네임의 로컬 저장 기록이 생성됩니다. 자동 검증 기록은 `.preview-test-data`로 별도 격리하며 운영 기록에 접근하지 않습니다.

상세 결과·미검증 항목: [GRAPHICS-PREVIEW-TESTS.md](GRAPHICS-PREVIEW-TESTS.md).

## 원격 브랜치/PR 권한이 막힌 경우

2026-11-15 작업 중 Git push와 GitHub 연결 앱의 브랜치 생성 모두 쓰기 권한 부족으로 거부됐습니다. 저장소 메타데이터의 push=true 표시는 실제 연결 앱의 쓰기 가능 여부를 보장하지 않았습니다. 앱의 해당 저장소 Contents 및 Pull requests 쓰기 권한을 확인해야 합니다. 토큰이나 비밀키를 채팅으로 공유할 필요는 없습니다.

로컬 브랜치·소스 ZIP·Git bundle을 보관합니다. 쓰기 권한이 있는 PC에서 브랜치를 올린 뒤 초안 PR을 만들 수 있습니다(운영 배포/병합은 하지 않음).

```bash
git push -u origin preview/graphics-remaster-ch1
gh pr create --draft --base main --head preview/graphics-remaster-ch1 --title "MIA 첫 챕터 그래픽 리마스터 독립 플레이 미리보기" --body-file preview/PULL_REQUEST.md
```

ZIP은 Git 기록이 없으므로 바로 실행하거나, 별도 클론의 작업 브랜치에 변경을 적용하세요. Git bundle은 로컬 브랜치/기록을 포함합니다.

```bash
git clone -b preview/graphics-remaster-ch1 mia-ch1-preview.bundle mia-preview
cd mia-preview
npm ci
npm run preview
```
