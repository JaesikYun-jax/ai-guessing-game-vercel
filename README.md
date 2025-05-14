# AI 추측 게임 클라이언트

이 저장소는 AI 추측 게임의 프론트엔드 클라이언트 코드를 포함하고 있습니다. 백엔드 API 서버는 별도의 저장소 [flask-vercel](https://github.com/JaesikYun-jax/flask-vercel)에서 관리됩니다.

## 구조

이 프로젝트는 정적 HTML, CSS, JavaScript로 구성된 클라이언트 애플리케이션입니다. Vercel에 정적 웹사이트로 배포됩니다.

```
ai-guessing-game-vercel/
├── public/               # 배포되는 정적 파일들
│   ├── index.html        # 메인 게임 페이지
│   ├── script.js         # 게임 동작 관련 스크립트
│   ├── style.css         # 스타일시트
│   ├── admin.html        # 관리자 페이지
│   └── admin.js          # 관리자 기능 스크립트
└── vercel.json           # Vercel 배포 설정
```

## 로컬에서 실행하기

클라이언트는 정적 파일로 구성되어 있어 간단히 웹 서버로 실행할 수 있습니다:

```
cd public
python -m http.server 8000
```

그런 다음 브라우저에서 `http://localhost:8000`으로 접속합니다.

## API 서버 연결

이 클라이언트는 기본적으로 API 서버 [flask-vercel](https://github.com/JaesikYun-jax/flask-vercel)에 연결됩니다. 로컬에서 테스트하려면 `script.js` 파일에서 API 서버 주소를 변경해야 할 수 있습니다.

## Vercel에 배포하기

이 저장소는 Vercel에 정적 웹사이트로 배포됩니다. GitHub 저장소를 Vercel에 연결하기만 하면 자동으로 배포됩니다.

## Vercel 배포 방법

### 사전 준비

1. [GitHub](https://github.com/) 계정
2. [Vercel](https://vercel.com/) 계정
3. [OpenAI API 키](https://platform.openai.com/)

### 배포 단계

1. **GitHub에 프로젝트 업로드**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/ai-guessing-game-vercel.git
   git push -u origin main
   ```

2. **Vercel에서 프로젝트 가져오기**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 레포지토리 중에서 방금 업로드한 프로젝트 선택
   - 프로젝트 설정 확인
   - 환경 변수 추가:
     - `OPENAI_API_KEY`: OpenAI API 키 값 입력

3. **배포**
   - "Deploy" 버튼 클릭
   - 배포가 완료되면 제공된 URL로 접속

## 프로젝트 구조

```
ai-guessing-game-vercel/
├── api/                # 서버리스 API 함수
│   ├── health.py       # 서버 상태 확인 API
│   ├── games.py        # 게임 목록 조회 API
│   └── utils.py        # 유틸리티 함수
├── data/               # 게임 데이터 저장
│   └── game_items.json # 게임 항목 데이터
├── public/             # 정적 파일 (프론트엔드)
│   ├── index.html      # 메인 HTML 파일
│   ├── style.css       # CSS 스타일시트
│   └── script.js       # 자바스크립트 코드
├── vercel.json         # Vercel 설정 파일
└── requirements.txt    # Python 패키지 의존성
```

## 로컬에서 개발 및 테스트

Vercel CLI를 사용하여 로컬에서 테스트할 수 있습니다:

```bash
# Vercel CLI 설치
npm install -g vercel

# 로컬에서 실행
vercel dev
```

## 주요 API 엔드포인트

- `/api/health` - 서버 상태 확인
- `/api/games` - 게임 목록 조회

## 로컬 버전과의 차이점

1. **서버 구조**: Flask 서버 대신 Vercel의 서버리스 함수 사용
2. **데이터 저장**: 파일 기반의 임시 저장 대신 제한된 기능 제공
3. **API 경로**: 모든 API 경로는 `/api/` 접두사를 사용

## 제한 사항

현재 이 Vercel 버전은 기본적인 기능만 제공합니다:
- 게임 목록 조회
- 서버 상태 확인

게임 플레이를 위한 API는 추가 개발이 필요합니다. 