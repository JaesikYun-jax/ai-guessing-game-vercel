# AI 추측 게임 (Vercel 배포 버전)

AI와 대화를 통해 다양한 상황에서 목표를 달성하는 웹 기반 게임입니다. 이 버전은 Vercel에 배포하기 위해 수정된 버전입니다.

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