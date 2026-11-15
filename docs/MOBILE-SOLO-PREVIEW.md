# 모바일 1인 미리보기

게시 완료: https://mia-mobile-ch1-playtest.resolutechest3.chatgpt.site

소유자 전용 Sites입니다. 휴대폰에서 같은 ChatGPT 계정으로 로그인한 뒤 닉네임을 입력하고 입장합니다. Sites 게시 성공은 확인했으며 실제 휴대폰 하드웨어 검증은 아직입니다.

사용자가 멀티플레이/음성채팅 제외에 동의한 별도 모바일 테스트입니다. 기존 Node/Socket.IO 멀티플레이 버전과 운영 배포는 변경하지 않습니다.

`preview/mobile/build.mjs`는 기존 public 클라이언트와 순수 JavaScript GameInstance/챕터 데이터 및 Three.js 필수 모듈을 별도 정적 디렉터리로 복사합니다. `adapter.js`가 소켓 대신 브라우저 내 게임 엔진에 이벤트를 전달합니다. 이동·카메라·터치 조이스틱·아이템·퍼즐 판정·손전등·수첩/힌트는 원래 코드를 사용합니다. 네트워크 서버·DB·관리자 비밀번호·운영 환경 파일은 복사하거나 연결하지 않습니다.

대상은 미아 1장 달동네 골목입니다. 실제 셔터 퍼즐을 풀고 출구에 도착하면 모바일 테스트 완료 화면을 표시합니다. 이후 챕터는 실행하지 않습니다. 기본 품질은 낮음이며 그래픽 패널에서 세 품질과 원본 비교를 선택할 수 있습니다. 프로필/초대/랭킹/상점/음성 등 온라인 전용 UI는 제외합니다. 진행은 이 기기의 브라우저 localStorage에 저장하며 새로고침 후 퍼즐·인벤토리를 복원합니다. 위치는 시작 지점부터입니다. 완료 또는 처음부터 다시 시작하면 체크포인트를 지웁니다. 사이트 데이터 삭제/시크릿 모드에서는 기록이 유지되지 않을 수 있습니다.

실제 게임 엔진과 정답이 클라이언트에서 실행되므로 랭킹용 보안 판정이나 운영 계정 진행으로 사용하지 않습니다. 최초 접속/에셋 다운로드에 인터넷이 필요하며 오프라인 재접속을 보장하는 서비스워커는 설치하지 않았습니다.

재현:

```bash
npm ci
npm run preview:mobile
npm ci --prefix preview
# Chromium이 없으면 preview 폴더에서 npx playwright install chromium
npm run preview:mobile:test
```

테스트 브라우저를 직접 지정하려면 CHROMIUM_PATH를 설정합니다. 생성된 `.mobile-site/dist`가 정적 웹 루트입니다. 게시된 Sites의 소스 저장소는 원래 GitHub 저장소와 별개입니다. 해당 Sites에만 게시하며 MIA 운영 URL/도메인은 건드리지 않습니다.

검증: Chromium 모바일 390×844 터치 에뮬레이션 및 844×390 가로 모드. 소프트웨어 렌더링이므로 실제 휴대폰 성능 검증이 아닙니다. 자동 검증 상세 결과는 작업 공간 `.preview-artifacts/mobile/results.json`에 기록합니다.

## 최종 자동 검증 결과

- PASS Portrait first chapter loads without a game server or external requests
- PASS Actual touch joystick moves/stops and flashlight action works
- PASS Three presets and original comparison preserve collider data
- PASS Original item/reveal rules and touch keypad solve the real shutter puzzle
- PASS Reload restores puzzle and inventory checkpoint in this browser
- PASS Landscape touch layout has no horizontal overflow
- PASS Real exit completes preview without loading/remastering later chapters
- PASS Replay resets first-chapter progress
- PASS No browser errors or external requests

브라우저 오류 0, 외부 에셋 요청 0. 운영 서버/DB 연결 없음.
