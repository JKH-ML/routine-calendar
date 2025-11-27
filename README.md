# Routine Calendar (WPF + WebView2)

Google Calendar와 연동되는 WPF/WebView2 캘린더입니다. 세 가지 루틴 이모지로 하루를 체크하고, 모두 달성하면 반짝이는 테두리로 “보상”을 받는 경험을 제공합니다.

## 주요 기능
- **Google Calendar 연동**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 환경 변수를 설정하거나 `WpfApp2/secrets.local.json`에 값을 넣으면 인증 후 기본 캘린더 일정이 동기화됩니다.
- **루틴 트래킹**: 이벤트 제목을 `#✏️`, `#🔥`, `#🚀` 중 하나로 시작하면 해당 루틴으로 인식합니다. 하루에 세 가지 루틴을 모두 포함하면 해당 날짜에 iridescent(무지개빛) 테두리가 적용됩니다.
- **상호작용 UI**: 월 이동, 오늘 이동, 동기화, 일정 추가/수정/삭제를 WebView2 내에서 수행하며 WPF와 메시지로 연계됩니다.

## 실행 방법
1) .NET 10 SDK와 WebView2 런타임 설치.
2) Google Cloud에서 OAuth 클라이언트 생성 후 다음을 설정:
   - 환경 변수: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`  
   - 또는 `WpfApp2/secrets.local.json`에 키를 저장 (예: `{ "GOOGLE_CLIENT_ID": "...", "GOOGLE_CLIENT_SECRET": "..." }`)
3) 솔루션 빌드/실행:
   - `dotnet build`
   - `dotnet run --project WpfApp2`

## 루틴 체크 팁
- 일정 제목 예시: `#✏️ Morning writing`, `#🔥 Workout`, `#🚀 Side project`
- 하루에 세 가지 루틴이 모두 존재하면 달력 셀에 반짝이는 테두리가 나타나 “루틴 완료”를 시각적으로 보상합니다.

## 참고
- 창 크기/위치는 `%AppData%/WpfShadcnCalendar/window.json`에 저장됩니다.
- 동기화/범위 로딩 실패 시 WPF 메시지 박스에서 오류를 확인하세요.
