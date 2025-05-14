// 전역 변수
let gameId = null;
let gameEnded = false;
let currentTurn = 1;
let maxTurns = 0;
let title = "";
let winCondition = "";
let characterName = "AI"; // 캐릭터 이름 추가
let gameItems = []; // 게임 항목 목록

// DOM 요소
const serverStatus = document.getElementById('server-status');
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const gameIdElement = document.getElementById('game-id');
const categoryElement = document.getElementById('category');
const titleElement = document.getElementById('title');
const winConditionElement = document.getElementById('win-condition');
const turnIndicator = document.getElementById('turn-indicator');
const messageContainer = document.getElementById('message-container');
const userInput = document.getElementById('user-input');
const charCounter = document.getElementById('char-counter');
const sendButton = document.getElementById('send-btn');
const endGameButton = document.getElementById('end-game-btn');
const newGameButton = document.getElementById('new-game-btn');
const gameSelect = document.getElementById('game-select');
const startSelectedBtn = document.getElementById('start-selected-btn');
const startRandomBtn = document.getElementById('start-random-btn');
const characterInfoElement = document.getElementById('character-info');

// API 서버 URL 설정
const API_BASE_URL = 'https://flask-vercel-ebon.vercel.app'; // 새로운 서버 URL 사용

// 대체 API URL 목록
const FALLBACK_API_URLS = [
    'https://flask-vercel-ebon.vercel.app',
    'https://flask-vercel-jaesikyun-jax.vercel.app',
    '' // 상대 경로
];

// 대체 API URL 시도 인덱스
let currentApiUrlIndex = 0;

// 현재 사용중인 API URL 확인
function getCurrentApiUrl() {
    return currentApiUrlIndex < FALLBACK_API_URLS.length 
        ? FALLBACK_API_URLS[currentApiUrlIndex] 
        : API_BASE_URL;
}

// 다음 API URL로 변경
function tryNextApiUrl() {
    currentApiUrlIndex++;
    if (currentApiUrlIndex >= FALLBACK_API_URLS.length) {
        currentApiUrlIndex = 0; // 모든 URL을 시도했으면 다시 처음으로
        return false; // 모든 URL 시도 완료
    }
    return true; // 다음 URL 시도 가능
}

// 오프라인 모드 응답에 사용할 더 자연스러운 응답
const OFFLINE_RESPONSES = {
    "인물": [
        "흠... 제가 누구인지 맞추려면 좀 더 구체적인 질문이 필요할 것 같아요.",
        "그건 제가 누구인지 맞추는데 중요한 단서가 될 수 있겠네요.",
        "재미있는 질문이군요. 그 질문에 대한 답은...",
        "좋은 추리네요! 하지만 아직 저를 완전히 맞추지는 못했어요.",
        "그렇게 생각하시는군요. 흥미로운 관점입니다."
    ],
    "대화": [
        "정말요? 그렇게 생각하시는 이유가 궁금해요.",
        "음... 그 말을 들으니 생각이 많아지네요.",
        "그런 생각을 가지고 계셨군요. 저는 조금 다르게 생각했어요.",
        "와, 그런 이야기는 처음 들어봐요. 더 자세히 말씀해주세요.",
        "그건 정말 인상적인 관점이에요. 저도 비슷한 경험이 있어요."
    ],
    "default": [
        "흥미로운 질문이네요. 더 자세히 말씀해주실래요?",
        "그렇군요. 다른 측면에서는 어떻게 생각하시나요?",
        "재미있는 관점입니다. 제가 이해한 바로는...",
        "질문해주셔서 감사합니다. 그것에 대해 생각해 본 적이 있는데...",
        "좋은 지적이십니다. 더 구체적으로 말씀해주실 수 있을까요?",
        "아주 흥미로운 주제를 제기하셨네요."
    ]
};

// 페이지 로드 시 서버 상태 확인 및 게임 목록 가져오기
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 콘솔에 디버그 메시지 출력
        console.log('페이지 로드됨, 이벤트 리스너 설정 시작');
        console.log('서버 URL:', getCurrentApiUrl() || '(상대 경로)');
        
        // 모든 DOM 요소가 존재하는지 확인
        validateDomElements();
        
        // 서버 상태 확인 시작
        await checkServerStatus();
        
        // 이벤트 리스너 등록
        console.log('버튼 이벤트 리스너 추가 시작');
        
        if (startSelectedBtn) {
            startSelectedBtn.addEventListener('click', () => {
                console.log('선택 게임 시작 버튼 클릭됨');
                handleStartGame('selected');
            });
        }
        
        if (startRandomBtn) {
            startRandomBtn.addEventListener('click', () => {
                console.log('랜덤 게임 시작 버튼 클릭됨');
                handleStartGame('random');
            });
        }
        
        if (sendButton) {
            sendButton.addEventListener('click', handleSendMessage);
        }
        
        if (userInput) {
            userInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    handleSendMessage();
                }
            });
            
            // 글자 수 카운터 이벤트 리스너 추가
            userInput.addEventListener('input', updateCharCount);
        }
        
        if (endGameButton) {
            endGameButton.addEventListener('click', handleEndGame);
        }
        
        if (newGameButton) {
            newGameButton.addEventListener('click', handleBackToHome);
        }
        
        console.log('이벤트 리스너 설정 완료');
        
        // 모든 버튼이 제대로 DOM에 있는지 확인
        checkButtonsExist();
    } catch (error) {
        console.error('페이지 초기화 중 오류 발생:', error);
        alert('페이지를 로드하는 중 오류가 발생했습니다. 페이지를 새로고침해보세요.');
    }
});

// DOM 요소가 모두 존재하는지 확인하는 함수
function validateDomElements() {
    const requiredElements = {
        'serverStatus': serverStatus,
        'startScreen': startScreen,
        'gameContainer': gameContainer,
        'gameIdElement': gameIdElement,
        'categoryElement': categoryElement,
        'titleElement': titleElement,
        'winConditionElement': winConditionElement,
        'turnIndicator': turnIndicator,
        'messageContainer': messageContainer,
        'userInput': userInput,
        'sendButton': sendButton,
        'endGameButton': endGameButton,
        'newGameButton': newGameButton,
        'gameSelect': gameSelect,
        'startSelectedBtn': startSelectedBtn,
        'startRandomBtn': startRandomBtn,
        'characterInfoElement': characterInfoElement
    };

    let missingElements = [];
    
    for (const [name, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`필수 DOM 요소 누락: ${name}`);
            missingElements.push(name);
        }
    }
    
    if (missingElements.length > 0) {
        console.warn('누락된 DOM 요소:', missingElements.join(', '));
        // 누락된 요소가 있으면 콘솔에 경고만 표시하고 계속 진행
    } else {
        console.log('모든 필수 DOM 요소 확인 완료');
    }
}

// 버튼이 DOM에 제대로 있는지 확인하는 함수
function checkButtonsExist() {
    console.log('버튼 존재 확인:');
    console.log('startSelectedBtn:', startSelectedBtn ? '존재함' : '존재하지 않음');
    console.log('startRandomBtn:', startRandomBtn ? '존재함' : '존재하지 않음');
    console.log('sendButton:', sendButton ? '존재함' : '존재하지 않음');
    console.log('endGameButton:', endGameButton ? '존재함' : '존재하지 않음');
    console.log('newGameButton:', newGameButton ? '존재함' : '존재하지 않음');
}

// 글자 수 카운터 업데이트 함수
function updateCharCount() {
    const currentLength = userInput.value.length;
    const maxLength = userInput.getAttribute('maxlength');
    charCounter.textContent = `${currentLength}/${maxLength}`;
    
    // 글자 수가 제한에 가까워지면 시각적 피드백 제공
    if (currentLength >= maxLength * 0.9) {
        charCounter.classList.add('char-limit-warning');
    } else {
        charCounter.classList.remove('char-limit-warning');
    }
}

// 서버 상태 확인 함수
async function checkServerStatus() {
    try {
        console.log('서버 상태 확인 시작...');
        serverStatus.textContent = '서버 연결 중...';
        serverStatus.classList.remove('success-text', 'error-text');
        
        // 요청 URL 출력
        const healthUrl = `${getCurrentApiUrl()}/api/health`;
        console.log('서버 상태 API 요청 URL:', healthUrl);
        
        // CORS 디버깅을 위한 옵션 출력
        console.log('요청 옵션:', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        
        // 실제 요청 전송
        console.log('요청 전송 시작...');
        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors' // CORS 설정 명시적 지정
        });
        
        console.log('서버 응답 받음:', response);
        console.log('응답 상태:', response.status, response.statusText);
        console.log('응답 헤더:', [...response.headers.entries()]);
        
        // 404 에러 구체적으로 처리
        if (response.status === 404) {
            console.error('404 에러: API 엔드포인트를 찾을 수 없습니다');
            console.log('대안 엔드포인트 시도: /health');
            
            // 대안 API 경로 시도
            const alternativeUrl = `${getCurrentApiUrl()}/health`;
            console.log('대안 URL 시도:', alternativeUrl);
            
            try {
                const altResponse = await fetch(alternativeUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                });
                
                console.log('대안 엔드포인트 응답:', altResponse);
                
                if (altResponse.ok) {
                    console.log('대안 엔드포인트 성공!');
                    // 아래 처리 로직으로 계속
                    // response 변수 업데이트
                    response = altResponse;
                } else {
                    throw new Error(`대안 엔드포인트도 실패: ${altResponse.status}`);
                }
            } catch (altError) {
                console.error('대안 엔드포인트 호출 오류:', altError);
                // 원래 오류로 계속 진행
            }
        }
        
        if (response.ok) {
            // 응답 텍스트 먼저 확인
            const responseText = await response.text();
            console.log('응답 원본 텍스트:', responseText);
            
            // JSON 파싱 시도
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('파싱된 JSON 데이터:', data);
            } catch (parseError) {
                console.error('JSON 파싱 오류:', parseError);
                // 텍스트 응답으로 판단 시도
                if (responseText.includes('online')) {
                    console.log('텍스트 응답에서 "online" 문자열 발견');
                    data = { status: 'online' };
                } else {
                    throw new Error(`JSON 파싱 오류: ${parseError.message}`);
                }
            }
            
            // 서버 응답 성공 - status 필드 확인
            if (data && data.status === 'online') {
                console.log('서버 연결 성공');
                serverStatus.textContent = '✅ 서버 연결 성공';
                serverStatus.classList.add('success-text');
                serverStatus.classList.remove('error-text');
                startScreen.classList.remove('hidden');
                
                // 게임 항목 로드
                fetchGameItems();
                
                // 성공하면 60초마다 확인 (백그라운드에서 상태 유지)
                setTimeout(checkServerStatus, 60000);
            } else {
                console.error('서버 상태 필드 문제:', data);
                throw new Error(`서버 상태가 'online'이 아닙니다: ${data ? data.status : '알 수 없음'}`);
            }
        } else {
            // 서버 응답은 받았지만 오류 코드 반환
            console.error('서버 응답 오류:', response.status);
            throw new Error(`서버 연결 불안정: 상태 코드 ${response.status}`);
        }
    } catch (error) {
        console.error('서버 연결 실패:', error);
        console.error('에러 세부정보:', error.stack);
        
        // 오류 메시지를 사용자 친화적으로 변경
        let errorMessage = '❌ 서버 연결 실패';
        
        // "Failed to fetch" 같은 기술적 오류 메시지 대신 보기 좋은 메시지 표시
        if (error.message.includes('Failed to fetch')) {
            errorMessage = '❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
        } else if (error.message.includes('404')) {
            errorMessage = '❌ API 엔드포인트를 찾을 수 없습니다 (404 오류)';
        } else {
            errorMessage = `❌ 서버 연결 오류: ${error.message.replace('TypeError: ', '').replace('Error: ', '')}`;
        }
        
        serverStatus.textContent = errorMessage;
        serverStatus.classList.add('error-text');
        serverStatus.classList.remove('success-text');
        
        // 실패하면 10초 후 재시도
        setTimeout(checkServerStatus, 10000);
    }
}

// 게임 항목 목록 가져오기
async function fetchGameItems() {
    try {
        console.log('===== 게임 목록 가져오기 시작 =====');

        // 요청 URL 출력
        const gamesUrl = `${getCurrentApiUrl()}/api/games`;
        console.log('게임 항목 목록 요청 URL:', gamesUrl);
        
        // 실제 요청 전송
        console.log('게임 목록 요청 전송 시작...');
        let response = await fetch(gamesUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors' // CORS 설정 명시적 지정
        });
        
        console.log('게임 목록 응답 받음:', response);
        console.log('응답 상태:', response.status, response.statusText);
        console.log('응답 헤더:', [...response.headers.entries()]);
        
        // 404 에러 구체적으로 처리
        if (response.status === 404) {
            console.error('404 에러: 게임 목록 API 엔드포인트를 찾을 수 없습니다');
            console.log('대안 엔드포인트 시도: /games');
            
            // 대안 API 경로 시도
            const alternativeUrl = `${getCurrentApiUrl()}/games`;
            console.log('대안 URL 시도:', alternativeUrl);
            
            try {
                const altResponse = await fetch(alternativeUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                });
                
                console.log('대안 엔드포인트 응답:', altResponse);
                
                if (altResponse.ok) {
                    console.log('대안 엔드포인트 성공!');
                    // 아래 처리 로직으로 계속
                    // response 변수 업데이트
                    response = altResponse;
                } else {
                    throw new Error(`대안 엔드포인트도 실패: ${altResponse.status}`);
                }
            } catch (altError) {
                console.error('대안 엔드포인트 호출 오류:', altError);
                // 다음 API URL 시도
                if (tryNextApiUrl()) {
                    console.log(`다음 API URL로 시도: ${getCurrentApiUrl()}`);
                    setTimeout(() => fetchGameItems(), 500); // 재귀적으로 다시 시도
                    return;
                } else {
                    console.warn('모든 API URL 시도 후 실패, 더미 게임 데이터 사용');
                    useDefaultGameItems();
                    return;
                }
            }
        }
        
        if (!response.ok) {
            console.error(`서버 응답 오류: ${response.status}`);
            
            // 다음 API URL 시도
            if (tryNextApiUrl()) {
                console.log(`다음 API URL로 시도: ${getCurrentApiUrl()}`);
                setTimeout(() => fetchGameItems(), 500); // 재귀적으로 다시 시도
                return;
            } else {
                throw new Error(`서버 응답 오류: ${response.status} - 모든 URL 시도 후 실패`);
            }
        }
        
        // 서버 연결 성공 시, 서버 상태 메시지 업데이트
        if (!serverStatus.classList.contains('success-text')) {
            serverStatus.textContent = '✅ 서버 연결 성공';
            serverStatus.classList.add('success-text');
            serverStatus.classList.remove('error-text');
        }
        
        // 응답 텍스트 먼저 확인
        const responseText = await response.text();
        console.log('게임 목록 응답 원본 텍스트:', responseText);
        
        // 빈 응답 확인
        if (!responseText || responseText.trim() === '') {
            console.error('서버가 빈 응답을 반환했습니다.');
            throw new Error('서버가 빈 응답을 반환했습니다.');
        }
        
        // JSON 파싱 시도
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('파싱된 게임 목록 데이터:', data);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            console.error('파싱 실패한 텍스트:', responseText);
            
            // 가능한 경우 텍스트를 사용 가능한 JSON으로 변환 시도
            if (responseText.includes('[') && responseText.includes(']')) {
                try {
                    // 배열 형태의 데이터 추출 시도
                    const arrayMatch = responseText.match(/\[(.*)\]/s);
                    if (arrayMatch && arrayMatch[0]) {
                        console.log('배열 형태의 데이터 추출 시도:', arrayMatch[0]);
                        const extractedArray = JSON.parse(arrayMatch[0]);
                        data = { success: true, data: extractedArray };
                        console.log('추출된 데이터로 변환:', data);
                    }
                } catch (extractError) {
                    console.error('데이터 추출 실패:', extractError);
                    throw new Error(`JSON 파싱 오류: ${parseError.message}`);
                }
            } else {
                throw new Error(`JSON 파싱 오류: ${parseError.message}`);
            }
        }
        
        // 데이터 구조 검증 및 적응
        if (!data) {
            console.error('파싱된 데이터가 없습니다.');
            throw new Error('데이터 파싱 실패');
        }
        
        // success 필드가 없는 경우 데이터 형식 적응
        if (data.success === undefined) {
            // 배열 형태로 직접 반환된 데이터 처리
            if (Array.isArray(data)) {
                console.log('배열 형태의 데이터를 success/data 구조로 변환');
                data = { success: true, data: data };
            } 
            // 다른 형태의 데이터 처리
            else if (typeof data === 'object') {
                console.log('객체 형태의 데이터를 success/data 구조로 변환');
                if (data.items || data.games || data.scenarios) {
                    data = { 
                        success: true, 
                        data: data.items || data.games || data.scenarios || []
                    };
                } else {
                    // 키가 없거나 불분명한 경우 모든 데이터를 래핑
                    data = { success: true, data: [data] };
                }
            }
        }
        
        // 최종 데이터 처리
        if (data.success && Array.isArray(data.data)) {
            gameItems = data.data;
            console.log('게임 항목 로드 성공:', gameItems.length, '개 항목');
            console.log('로드된 항목 목록:', gameItems);
            populateGameSelect(gameItems);
        } else if (Array.isArray(data)) {
            // 직접 배열이 반환되는 경우
            gameItems = data;
            console.log('배열 형태의 게임 항목 로드 성공:', gameItems.length, '개 항목');
            populateGameSelect(gameItems);
        } else {
            console.error('게임 항목을 불러오는데 실패했습니다. 받은 데이터:', data);
            console.error('데이터 형식이 예상과 다릅니다.');
            // 게임 목록이 비어있다면, 기본 더미 데이터 추가
            useDefaultGameItems();
        }
        
        console.log('===== 게임 목록 가져오기 완료 =====');
    } catch (error) {
        console.error('게임 항목 가져오기 실패:', error);
        console.error('에러 세부정보:', error.stack);
        
        // 더미 데이터로 대체
        useDefaultGameItems();
    }
}

// 더미 게임 데이터 사용 함수
function useDefaultGameItems() {
    console.log('더미 게임 데이터 사용 중...');
    gameItems = [
        {
            id: "1", 
            title: "신비한 인물 찾기",
            category: "인물",
            character_name: "알 수 없는 인물",
            max_turns: 10
        },
        {
            id: "2",
            title: "플러팅 마스터",
            category: "대화",
            character_name: "이유나",
            max_turns: 5
        }
    ];
    populateGameSelect(gameItems);
}

// 게임 선택 드롭다운 채우기
function populateGameSelect(items) {
    console.log('게임 목록 드롭다운 채우기 시작:', items);
    
    // gameSelect 요소가 존재하는지 확인
    if (!gameSelect) {
        console.error('게임 선택 드롭다운 요소를 찾을 수 없습니다!');
        return;
    }
    
    // 기존 옵션 제거 (첫 번째 옵션 제외)
    console.log('기존 드롭다운 옵션 제거, 현재 옵션 수:', gameSelect.options.length);
    while (gameSelect.options.length > 1) {
        gameSelect.remove(1);
    }
    
    // 카테고리별로 그룹화
    const categorizedItems = {};
    items.forEach(item => {
        if (!categorizedItems[item.category]) {
            categorizedItems[item.category] = [];
        }
        categorizedItems[item.category].push(item);
    });
    
    console.log('카테고리별 그룹화 완료:', Object.keys(categorizedItems));
    
    // 카테고리별 옵션 그룹 추가
    Object.keys(categorizedItems).forEach(category => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        
        categorizedItems[category].forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.title;
            optgroup.appendChild(option);
        });
        
        gameSelect.appendChild(optgroup);
    });
    
    console.log('드롭다운 옵션 추가 완료, 최종 옵션 수:', gameSelect.options.length);
    
    // 게임 선택 버튼 활성화 여부 설정
    if (startSelectedBtn) {
        startSelectedBtn.disabled = gameSelect.value === '';
        console.log('게임 시작 버튼 상태:', startSelectedBtn.disabled ? '비활성화' : '활성화');
        
        // 선택이 변경될 때마다 버튼 활성화 여부 업데이트
        gameSelect.addEventListener('change', () => {
            console.log('게임 선택 변경:', gameSelect.value);
            startSelectedBtn.disabled = gameSelect.value === '';
        });
    } else {
        console.error('게임 시작 버튼 요소를 찾을 수 없습니다!');
    }
}

// 게임 시작 함수
async function handleStartGame(mode) {
    try {
        console.log(`===== 게임 시작 처리 중 (모드: ${mode}) =====`);
        // 버튼 비활성화
        startSelectedBtn.disabled = true;
        startRandomBtn.disabled = true;
        
        let selectedItemId = null;
        
        if (mode === 'selected') {
            selectedItemId = gameSelect.value;
            console.log('선택된 게임 ID:', selectedItemId);
            
            if (!selectedItemId) {
                alert('게임을 선택해주세요.');
                startSelectedBtn.disabled = false;
                startRandomBtn.disabled = false;
                return;
            }
            
            // 문자열이라면 숫자로 변환 시도
            if (typeof selectedItemId === 'string' && !isNaN(selectedItemId)) {
                selectedItemId = parseInt(selectedItemId, 10);
                console.log('변환된 게임 ID(숫자):', selectedItemId);
            }
        }
        
        // 요청 정보 로깅
        const requestBody = { item_id: selectedItemId };
        console.log('게임 시작 요청 본문:', JSON.stringify(requestBody));

        // API URL과 재시도 처리를 위한 변수
        let apiAttempts = 0;
        let maxAttempts = FALLBACK_API_URLS.length * 2; // URL별 경로 시도를 위해 2배로 설정
        let startSuccess = false;
        let startData = null;
        
        while (!startSuccess && apiAttempts < maxAttempts) {
            // 요청 URL 설정
            const startUrl = `${getCurrentApiUrl()}/api/start`;
            console.log(`시도 ${apiAttempts + 1}/${maxAttempts} - 게임 시작 요청 URL:`, startUrl);
            
            try {
                console.log('서버에 게임 시작 요청 전송');
                const response = await fetch(startUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                console.log('게임 시작 응답 받음:', response);
                console.log('응답 상태:', response.status, response.statusText);
                console.log('응답 헤더:', [...response.headers.entries()]);
                
                // 응답 상태 확인
                if (!response.ok) {
                    console.error(`서버 응답 오류: ${response.status}`);
                    
                    if (response.status === 404) {
                        // 404 에러인 경우 대안 경로 시도
                        console.log('대안 엔드포인트 시도: /start');
                        const alternativeUrl = `${getCurrentApiUrl()}/start`;
                        
                        try {
                            console.log('대안 URL 시도:', alternativeUrl);
                            const altResponse = await fetch(alternativeUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(requestBody)
                            });
                            
                            if (altResponse.ok) {
                                console.log('대안 엔드포인트 성공!');
                                // 성공한 응답으로 진행
                                const responseText = await altResponse.text();
                                console.log('대안 경로 응답 텍스트:', responseText);
                                
                                try {
                                    startData = JSON.parse(responseText);
                                    startSuccess = true;
                                    break; // 성공했으므로 루프 종료
                                } catch (parseError) {
                                    console.error('대안 응답 파싱 오류:', parseError);
                                    // 다음 시도로 진행
                                }
                            } else {
                                console.error(`대안 엔드포인트도 실패: ${altResponse.status}`);
                            }
                        } catch (altError) {
                            console.error('대안 엔드포인트 호출 오류:', altError);
                        }
                    }
                    
                    // 다음 URL 시도
                    apiAttempts++;
                    tryNextApiUrl();
                } else {
                    // 응답 텍스트 확인
                    const responseText = await response.text();
                    console.log('게임 시작 응답 원본 텍스트:', responseText);
                    
                    // 빈 응답 확인
                    if (!responseText || responseText.trim() === '') {
                        console.error('서버가 빈 응답을 반환했습니다.');
                        apiAttempts++;
                        continue; // 다음 시도로 진행
                    }
                    
                    // JSON 파싱 시도
                    try {
                        startData = JSON.parse(responseText);
                        console.log('파싱된 게임 시작 데이터:', startData);
                        
                        // 성공 상태 확인
                        if (startData.success === true) {
                            startSuccess = true;
                            break; // 성공했으므로 루프 종료
                        } else {
                            console.error('게임 시작 응답에 성공 플래그가 없습니다:', startData);
                            apiAttempts++;
                        }
                    } catch (parseError) {
                        console.error('JSON 파싱 오류:', parseError);
                        console.error('파싱 실패한 텍스트:', responseText);
                        apiAttempts++;
                    }
                }
            } catch (requestError) {
                console.error('API 요청 실패:', requestError);
                apiAttempts++;
                tryNextApiUrl();
            }
        }
        
        // 모든 시도 후 결과 확인
        if (!startSuccess || !startData) {
            console.error('모든 API URL 시도 후에도 게임 시작 실패');
            throw new Error('게임 서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 오프라인 모드를 사용하세요.');
        }
        
        // 서버 연결 성공 시, 서버 상태 메시지 업데이트
        serverStatus.textContent = '✅ 서버 연결 성공';
        serverStatus.classList.add('success-text');
        serverStatus.classList.remove('error-text');
        
        // 응답 데이터 처리
        console.log('게임 시작 성공, 데이터 처리 시작');
        
        const result = startData.data || {};
        
        // 안전하게 속성 접근을 위해 기본값 설정
        gameId = result.game_id || `game_${Date.now()}`;
        title = result.title || result.scenario_title || '알 수 없는 시나리오';
        currentTurn = result.current_turn || 1;
        maxTurns = result.max_turns || 10;
        winCondition = result.win_condition || '알 수 없는 승리 조건';
        characterName = result.character_name || result.ai_name || "AI"; // 캐릭터 이름 저장
        
        // 서버 응답 데이터 로그
        console.log('게임 데이터 적용:', {
            gameId, title, currentTurn, maxTurns, winCondition, characterName
        });
        
        // UI 업데이트
        console.log('UI 업데이트 시작');
        gameIdElement.textContent = `게임 ID: ${gameId}`;
        categoryElement.textContent = `카테고리: ${result.category || '일반'}`;
        titleElement.textContent = `시나리오: ${title}`;
        winConditionElement.textContent = `승리 조건: ${winCondition}`;
        
        // 캐릭터 설정 업데이트 (이름 포함)
        let characterInfo = result.character_setting || "";
        if (characterName && characterName !== "AI") {
            characterInfo = `<strong>${characterName}</strong>과의 대화입니다. ${characterInfo}`;
        }
        characterInfoElement.innerHTML = characterInfo || "AI와 대화를 시작하세요.";
        
        // 턴 인디케이터 업데이트
        updateTurnIndicator(currentTurn, maxTurns);
        
        // 시작 화면 숨김, 게임 화면 표시
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        // 시스템 메시지 추가
        console.log('환영 메시지 표시');
        addMessage('시스템', '게임이 시작되었습니다!', 'system-message');
        
        // 환영 메시지 (기본값 제공)
        const welcomeMessage = result.welcome_message || '안녕하세요! 대화를 시작해볼까요?';
        addMessage(characterName, welcomeMessage, 'ai-message');
        
        // 게임 상태 초기화
        gameEnded = false;
        
        console.log('게임이 성공적으로 시작됨');
        console.log('===== 게임 시작 처리 완료 =====');
        
    } catch (error) {
        console.error('게임 시작 실패:', error);
        console.error('에러 세부정보:', error.stack);
        
        // 게임 시작은 실패했지만, 서버는 연결됐을 수 있으므로 재확인
        try {
            // 빠른 상태 확인 요청
            const healthCheck = await fetch(`${getCurrentApiUrl()}/api/health`);
            
            if (healthCheck.ok) {
                // 서버는 살아있지만 게임 시작에 실패한 경우
                serverStatus.textContent = '✅ 서버 연결됨, 게임 시작 실패';
                serverStatus.classList.add('success-text');
                serverStatus.classList.remove('error-text');
                alert(`게임 시작 실패: ${error.message}`);
            } else {
                // 서버 연결 자체에 문제가 있는 경우
                serverStatus.textContent = '❌ 서버 연결 실패';
                serverStatus.classList.add('error-text');
                serverStatus.classList.remove('success-text');
                alert('서버에 연결할 수 없습니다. 오프라인 모드를 사용해보세요.');
                
                // 오프라인 모드 진입 여부 확인
                if (confirm('오프라인 모드로 게임을 시작하시겠습니까? (기능이 제한됩니다)')) {
                    startOfflineGame();
                }
            }
        } catch (healthError) {
            // 건강 확인 요청 자체가 실패한 경우
            console.error('서버 상태 확인 실패:', healthError);
            serverStatus.textContent = '❌ 서버 연결 실패';
            serverStatus.classList.add('error-text');
            serverStatus.classList.remove('success-text');
            
            // 오프라인 모드 진입 여부 확인
            if (confirm('서버에 연결할 수 없습니다. 오프라인 모드로 게임을 시작하시겠습니까? (기능이 제한됩니다)')) {
                startOfflineGame();
            }
        }
    } finally {
        startSelectedBtn.disabled = false;
        startRandomBtn.disabled = false;
    }
}

// 오프라인 모드 게임 시작 함수
function startOfflineGame() {
    // 오프라인 모드 게임 초기화
    gameId = 'offline-mode';
    title = '오프라인 모드';
    currentTurn = 1;
    maxTurns = 5;
    characterName = "AI";
    
    // UI 업데이트
    gameIdElement.textContent = '게임 ID: 오프라인 모드';
    categoryElement.textContent = '카테고리: 테스트';
    titleElement.textContent = '시나리오: 오프라인 모드';
    winConditionElement.textContent = '승리 조건: 없음 (테스트 모드)';
    characterInfoElement.innerHTML = "서버가 연결되지 않아 제한된 기능으로 실행합니다.";
    
    updateTurnIndicator(currentTurn, maxTurns);
    
    // 시작 화면 숨김, 게임 화면 표시
    startScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // 시스템 메시지 추가
    addMessage('시스템', '오프라인 모드: 서버와 연결할 수 없습니다. 제한된 기능으로 실행합니다.', 'system-message warning-text');
    addMessage('AI', '오프라인 모드에서는 실제 AI 응답을 받을 수 없습니다. 메시지를 보내면 미리 준비된 응답이 표시됩니다.', 'ai-message');
    
    // 게임 상태 초기화
    gameEnded = false;
}

// 메시지 전송 처리
async function handleSendMessage() {
    try {
        const message = userInput.value.trim();
        if (!message) return;
        
        // 입력 필드 비우기 및 비활성화
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;
        
        // 사용자 메시지 표시
        addMessage('사용자', message, 'user-message');
        
        // 로딩 표시
        const loadingMessage = addMessage('시스템', '응답 생성 중...', 'system-message loading');
        
        // 오프라인 모드인 경우
        if (gameId === 'offline-mode') {
            // 로딩 효과를 위해 약간의 지연
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 로딩 메시지 제거
            const container = document.getElementById('message-container');
            container.removeChild(loadingMessage);
            
            // 오프라인 모드 응답 생성
            handleOfflineResponse(message);
            
            // 턴 증가
            currentTurn++;
            updateTurnIndicator(currentTurn, maxTurns);
            
            // 최대 턴에 도달한 경우 게임 종료
            if (currentTurn > maxTurns) {
                gameEnded = true;
                addMessage('시스템', '게임 오버! 턴 제한에 도달했습니다.', 'system-message error-text');
                showGameOverControls();
            } else {
                // 입력 필드 활성화
                userInput.disabled = false;
                sendButton.disabled = false;
                userInput.focus();
            }
        } else {
            // 온라인 모드: API 호출
            try {
                await askQuestion(message);
                
                // 로딩 메시지 제거
                const container = document.getElementById('message-container');
                container.removeChild(loadingMessage);
                
                // 입력 필드 활성화 (게임이 끝나지 않은 경우)
                if (!gameEnded) {
                    userInput.disabled = false;
                    sendButton.disabled = false;
                    userInput.focus();
                }
            } catch (error) {
                // API 오류 처리
                console.error('API 호출 실패, 오프라인 응답으로 대체:', error);
                
                // 로딩 메시지 제거
                const container = document.getElementById('message-container');
                container.removeChild(loadingMessage);
                
                // 오프라인 응답 표시 (API 호출이 실패한 경우의 대체 응답)
                addMessage('시스템', '서버 연결 오류. 기본 응답을 표시합니다.', 'system-message warning-text');
                handleOfflineResponse(message);
                
                // 턴 증가
                currentTurn++;
                updateTurnIndicator(currentTurn, maxTurns);
                
                // 입력 필드 활성화
                userInput.disabled = false;
                sendButton.disabled = false;
                userInput.focus();
            }
        }
    } catch (error) {
        console.error('메시지 전송 중 오류:', error);
        addMessage('시스템', `오류: ${error.message}`, 'system-message error-text');
        
        // 입력 필드 재활성화
        userInput.disabled = false;
        sendButton.disabled = false;
    }
}

// 오프라인 모드 응답 처리
function handleOfflineResponse(message) {
    const responses = OFFLINE_RESPONSES[message.category] || OFFLINE_RESPONSES.default;
    
    // 치트키 확인
    if (message.includes("승승리")) {
        addMessage('시스템', '치트키 활성화: 즉시 승리!', 'system-message success-text');
        addMessage(characterName, "축하합니다! 승리 조건을 달성했습니다.", 'ai-message');
        gameEnded = true;
        showGameOverControls();
        return;
    } else if (message.includes("패패배")) {
        addMessage('시스템', '치트키 활성화: 즉시 패배!', 'system-message error-text');
        addMessage(characterName, "아쉽게도 게임에서 패배했습니다.", 'ai-message');
        gameEnded = true;
        showGameOverControls();
        return;
    }
    
    // 랜덤 응답 선택
    const randomIndex = Math.floor(Math.random() * responses.length);
    addMessage(characterName, responses[randomIndex], 'ai-message');
}

// AI에게 질문 요청
async function askQuestion(message) {
    try {
        console.log('===== AI 질문 요청 시작 =====');
        
        // 게임 ID가 없으면 (서버 연결 안 됨) 오프라인 모드로 처리
        if (!gameId) {
            console.warn('게임 ID가 없어 오프라인 모드로 응답합니다.');
            showUserMessage(message);
            setTimeout(() => {
                const offlineResponse = handleOfflineResponse({
                    message: message,
                    category: currentScenario ? currentScenario.category : 'default'
                });
                showAIMessage(offlineResponse);
                updateTurnIndicator();
            }, 1000);
            return;
        }

        // 모든 API URL 시도
        let allUrlsTried = false;
        let responseData = null;
        let responseSuccess = false;
        
        while (!responseSuccess && !allUrlsTried) {
            try {
                const askUrl = `${getCurrentApiUrl()}/api/ask`;
                console.log('AI 질문 요청 URL:', askUrl);
                console.log('게임 ID:', gameId);
                console.log('질문 내용:', message);
                
                // 사용자 메시지 표시
                showUserMessage(message);
                
                // 로딩 표시
                showThinking();
                
                // 요청 본문 구성
                const requestBody = {
                    game_id: gameId,
                    message: message
                };
                console.log('요청 본문:', JSON.stringify(requestBody));
                
                // API 요청
                const response = await fetch(askUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                console.log('응답 상태:', response.status, response.statusText);
                
                // 응답이 성공적이지 않으면
                if (!response.ok) {
                    console.warn(`API 응답 오류 (${response.status}): ${response.statusText}`);
                    
                    // 대안 API 경로 시도
                    const alternativeUrl = `${getCurrentApiUrl()}/ask`;
                    console.log('대안 URL 시도:', alternativeUrl);
                    
                    const alternativeResponse = await fetch(alternativeUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (!alternativeResponse.ok) {
                        console.warn(`대안 API 응답 오류 (${alternativeResponse.status}): ${alternativeResponse.statusText}`);
                        
                        // 다음 API URL 시도
                        if (tryNextApiUrl()) {
                            console.log(`다음 API URL로 시도: ${getCurrentApiUrl()}`);
                            continue; // 다음 URL로 재시도
                        } else {
                            allUrlsTried = true;
                            throw new Error(`모든 API URL에서 응답 실패: ${response.status} ${response.statusText}`);
                        }
                    } else {
                        // 대안 경로 성공
                        const text = await alternativeResponse.text();
                        console.log('대안 API 응답 원본 텍스트:', text);
                        
                        // 빈 응답 확인
                        if (!text || text.trim() === '') {
                            console.error('서버가 빈 응답을 반환했습니다.');
                            throw new Error('서버가 빈 응답을 반환했습니다.');
                        }
                        
                        try {
                            responseData = JSON.parse(text);
                            console.log('파싱된 대안 API 응답:', responseData);
                            responseSuccess = true;
                        } catch (parseError) {
                            console.error('대안 API 응답 파싱 오류:', parseError);
                            console.error('파싱 실패한 텍스트:', text);
                            
                            // 텍스트 응답을 JSON 형식으로 변환 시도
                            if (text.includes('{') && text.includes('}')) {
                                // JSON 객체를 추출 시도
                                try {
                                    const jsonMatch = text.match(/{[^]*}/);
                                    if (jsonMatch && jsonMatch[0]) {
                                        responseData = JSON.parse(jsonMatch[0]);
                                        console.log('추출된 JSON 데이터:', responseData);
                                        responseSuccess = true;
                                    }
                                } catch (extractError) {
                                    console.error('JSON 추출 실패:', extractError);
                                }
                            }
                            
                            // 직접 텍스트를 메시지로 사용
                            if (!responseSuccess) {
                                responseData = { message: text };
                                console.log('텍스트를 메시지로 변환:', responseData);
                                responseSuccess = true;
                            }
                        }
                    }
                } else {
                    // 정상 응답 처리
                    const text = await response.text();
                    console.log('API 응답 원본 텍스트:', text);
                    
                    // 빈 응답 확인
                    if (!text || text.trim() === '') {
                        console.error('서버가 빈 응답을 반환했습니다.');
                        throw new Error('서버가 빈 응답을 반환했습니다.');
                    }
                    
                    try {
                        responseData = JSON.parse(text);
                        console.log('파싱된 API 응답:', responseData);
                        responseSuccess = true;
                    } catch (parseError) {
                        console.error('API 응답 파싱 오류:', parseError);
                        console.error('파싱 실패한 텍스트:', text);
                        
                        // 텍스트 응답을 JSON 형식으로 변환 시도
                        if (text.includes('{') && text.includes('}')) {
                            // JSON 객체를 추출 시도
                            try {
                                const jsonMatch = text.match(/{[^]*}/);
                                if (jsonMatch && jsonMatch[0]) {
                                    responseData = JSON.parse(jsonMatch[0]);
                                    console.log('추출된 JSON 데이터:', responseData);
                                    responseSuccess = true;
                                }
                            } catch (extractError) {
                                console.error('JSON 추출 실패:', extractError);
                            }
                        }
                        
                        // 직접 텍스트를 메시지로 사용
                        if (!responseSuccess) {
                            responseData = { message: text };
                            console.log('텍스트를 메시지로 변환:', responseData);
                            responseSuccess = true;
                        }
                    }
                }
                
                // 응답 데이터 구조 확인 및 변환
                if (responseData) {
                    console.log('응답 데이터 구조 확인:', responseData);
                    
                    // success/data 구조 형식으로 변환
                    if (!responseData.message && responseData.success && responseData.data) {
                        console.log('success/data 구조 발견, message 필드로 변환');
                        if (typeof responseData.data === 'string') {
                            responseData.message = responseData.data;
                        } else if (responseData.data.response) {
                            responseData.message = responseData.data.response;
                        } else if (responseData.data.message) {
                            responseData.message = responseData.data.message;
                        }
                    }
                    
                    // message 필드가 직접 포함된 구조 확인
                    if (!responseData.message && responseData.response) {
                        console.log('response 필드를 message로 사용');
                        responseData.message = responseData.response;
                    }
                    
                    // message 필드가 없는 경우 텍스트 응답으로 간주
                    if (!responseData.message && typeof responseData === 'string') {
                        console.log('문자열 응답을 message로 변환');
                        responseData = { message: responseData };
                    }
                    
                    if (!responseData.message) {
                        console.error('응답 데이터에 message 필드가 없습니다:', responseData);
                        throw new Error('서버 응답 데이터 형식이 올바르지 않습니다: message 필드 누락');
                    }
                } else {
                    console.error('응답 데이터가 없습니다');
                    throw new Error('응답 데이터가 없습니다');
                }
                
            } catch (fetchError) {
                console.error('API 요청 오류:', fetchError);
                
                // 다음 API URL 시도
                if (tryNextApiUrl()) {
                    console.log(`다음 API URL로 시도: ${getCurrentApiUrl()}`);
                } else {
                    allUrlsTried = true;
                    throw fetchError; // 모든 URL 시도 실패
                }
            }
        }
        
        // 로딩 종료
        hideThinking();
        
        // 모든 API URL 시도 후에도 응답이 없으면 오프라인 모드로 처리
        if (!responseSuccess || !responseData) {
            console.warn('모든 API URL이 실패하여 오프라인 모드로 응답합니다.');
            const offlineResponse = handleOfflineResponse({
                message: message,
                category: currentScenario ? currentScenario.category : 'default'
            });
            showAIMessage(offlineResponse);
        } else {
            // 서버 응답 표시
            const aiResponse = responseData.message;
            console.log('AI 응답 메시지:', aiResponse);
            showAIMessage(aiResponse);
            
            // 정답 여부 확인
            if (responseData.correct === true) {
                console.log('정답 감지! 승리 처리 진행');
                handleCorrectAnswer();
            }
            
            // 턴 증가
            currentTurn++;
        }
        
        // 턴 인디케이터 업데이트
        updateTurnIndicator(currentTurn, maxTurns);
        
        console.log('===== AI 질문 요청 완료 =====');
        
    } catch (error) {
        console.error('질문 처리 중 오류 발생:', error);
        console.error('에러 세부 정보:', error.stack);
        hideThinking();
        
        // 오류 메시지 표시
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = `응답을 생성하는 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}. 다시 시도하거나 새로고침해주세요.`;
        
        // 오프라인 모드 제안 표시
        const offlineMessage = document.createElement('div');
        offlineMessage.className = 'offline-suggestion';
        offlineMessage.textContent = '서버 연결에 문제가 있는 것 같습니다. 오프라인 모드로 계속하시겠습니까?';
        
        const offlineButton = document.createElement('button');
        offlineButton.textContent = '오프라인 모드 사용';
        offlineButton.className = 'offline-button';
        offlineButton.onclick = function() {
            // 오프라인 모드 활성화
            gameId = null;
            errorMessage.remove();
            offlineMessage.remove();
            offlineButton.remove();
            
            // 오프라인 응답 생성
            const offlineResponse = handleOfflineResponse({
                message: message,
                category: currentScenario ? currentScenario.category : 'default'
            });
            showAIMessage(offlineResponse);
            
            // 턴 증가
            currentTurn++;
            updateTurnIndicator(currentTurn, maxTurns);
        };
        
        messageContainer.appendChild(errorMessage);
        messageContainer.appendChild(offlineMessage);
        messageContainer.appendChild(offlineButton);
        scrollToBottom();
    }
}

// 턴 표시기 업데이트
function updateTurnIndicator(current, max) {
    try {
        // 턴 인디케이터 직접 업데이트
        turnIndicator.textContent = `턴: ${current}/${max}`;
        
        // 경고 색상 표시 (최대 턴의 70% 이상일 때)
        if (current >= max * 0.7) {
            turnIndicator.classList.add('warning-text');
        } else {
            turnIndicator.classList.remove('warning-text');
        }
        
        console.log(`턴 업데이트: ${current}/${max}`);
    } catch (error) {
        console.error('턴 표시기 업데이트 중 오류:', error);
    }
}

// 게임 종료 컨트롤 표시
function showGameOverControls() {
    endGameButton.classList.add('hidden');
    newGameButton.classList.remove('hidden');
    userInput.disabled = true;
    sendButton.disabled = true;
}

// 게임 종료 처리
async function handleEndGame() {
    try {
        if (gameEnded) return;
        
        endGameButton.disabled = true;
        
        // 요청 URL 설정
        const endUrl = `${getCurrentApiUrl()}/api/end`;
        console.log('게임 종료 요청 URL:', endUrl);
        
        // 요청 정보 로깅
        const requestBody = { game_id: gameId };
        console.log('게임 종료 요청 본문:', JSON.stringify(requestBody));
        
        let response = await fetch(endUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('게임 종료 응답 받음:', response);
        console.log('응답 상태:', response.status, response.statusText);
        console.log('응답 헤더:', [...response.headers.entries()]);
        
        // 404 에러 구체적으로 처리
        if (response.status === 404) {
            console.error('404 에러: 게임 종료 API 엔드포인트를 찾을 수 없습니다');
            console.log('대안 엔드포인트 시도: /end');
            
            // 대안 API 경로 시도
            const alternativeUrl = `${getCurrentApiUrl()}/end`;
            console.log('대안 URL 시도:', alternativeUrl);
            
            try {
                const altResponse = await fetch(alternativeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                console.log('대안 엔드포인트 응답:', altResponse);
                
                if (altResponse.ok) {
                    console.log('대안 엔드포인트 성공!');
                    response = altResponse;
                } else {
                    throw new Error(`대안 엔드포인트도 실패: ${altResponse.status}`);
                }
            } catch (altError) {
                console.error('대안 엔드포인트 호출 오류:', altError);
                // 원래 오류로 계속 진행
            }
        }
        
        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
        
        // 서버 연결 성공 시, 서버 상태 메시지 업데이트
        if (!serverStatus.classList.contains('success-text')) {
            serverStatus.textContent = '✅ 서버 연결 성공';
            serverStatus.classList.add('success-text');
            serverStatus.classList.remove('error-text');
        }
        
        // 응답 텍스트 먼저 확인
        const responseText = await response.text();
        console.log('게임 종료 응답 원본 텍스트:', responseText);
        
        // JSON 파싱 시도
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('파싱된 게임 종료 데이터:', data);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            throw new Error(`JSON 파싱 오류: ${parseError.message}`);
        }
        
        if (data.success) {
            gameEnded = true;
            
            // 기본 종료 메시지 표시
            addMessage('시스템', data.data.message, 'system-message');
            
            // 평가 점수와 메시지가 있는 경우 표시
            if (data.data.evaluation_score !== undefined) {
                // 평가 결과 표시를 위한 HTML 생성
                const scoreHTML = `
                <div class="evaluation-result">
                    <div class="evaluation-score">
                        <span class="score-value">${data.data.evaluation_score}</span>
                        <span class="score-max">/100</span>
                    </div>
                    <div class="evaluation-message">
                        ${data.data.evaluation_message}
                    </div>
                </div>
                `;
                
                // 성적표 메시지 추가
                const reportCard = addMessage('평가', '당신의 성적표입니다:', 'system-message evaluation-card');
                
                // 성적표 내용 추가
                const evaluationDiv = document.createElement('div');
                evaluationDiv.innerHTML = scoreHTML;
                reportCard.appendChild(evaluationDiv);
            }
            
            showGameOverControls();
        } else {
            throw new Error(data.error || '게임 종료 실패');
        }
    } catch (error) {
        console.error('게임 종료 실패:', error);
        console.error('에러 세부정보:', error.stack);
        addMessage('시스템', `오류: ${error.message}`, 'system-message error-text');
        
        // 오류가 있어도 UI는 게임 종료 상태로 변경
        gameEnded = true;
        showGameOverControls();
    } finally {
        endGameButton.disabled = false;
    }
}

// 첫 화면으로 돌아가기
function handleBackToHome() {
    // 게임이 진행 중이면 서버에 종료 요청
    if (gameId && !gameEnded) {
        fetch(`${getCurrentApiUrl()}/api/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_id: gameId
            })
        }).catch(error => {
            console.error('게임 종료 요청 실패:', error);
        });
    }
    
    // 기존 메시지 초기화
    messageContainer.innerHTML = '';
    
    // 게임 화면 숨김, 시작 화면 표시
    gameContainer.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    // 게임 상태 초기화
    gameId = null;
    gameEnded = false;
    currentTurn = 1;
    maxTurns = 0;
    
    // UI 초기화
    endGameButton.classList.remove('hidden');
    newGameButton.classList.add('hidden');
    userInput.disabled = false;
    sendButton.disabled = false;
    turnIndicator.classList.remove('warning-text');
    
    // 게임 목록 새로고침
    fetchGameItems();
}

// 메시지 추가 함수
function addMessage(sender, text, className) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    
    if (className !== 'system-message') {
        const senderElement = document.createElement('div');
        senderElement.className = 'message-sender';
        senderElement.textContent = sender;
        messageElement.appendChild(senderElement);
    }
    
    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    
    // 링크 자동 감지 및 클릭 가능하게 변환 (보안상 고려 필요)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const processedText = text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
    
    textElement.innerHTML = processedText;
    messageElement.appendChild(textElement);
    
    messageContainer.appendChild(messageElement);
    
    // 스크롤을 항상 최신 메시지로 이동
    scrollToBottom();
    
    return messageElement;
}

// 스크롤을 채팅창 맨 아래로 이동하는 함수
function scrollToBottom() {
    try {
        // 메시지 컨테이너 직접 참조 (ID로 안전하게 접근)
        const messageArea = document.getElementById('message-container');
        if (messageArea) {
            messageArea.scrollTop = messageArea.scrollHeight;
            console.log('스크롤을 맨 아래로 이동했습니다');
        } else {
            console.error('message-container 요소를 찾을 수 없습니다');
        }
    } catch (error) {
        console.error('스크롤 처리 중 오류가 발생했습니다:', error);
    }
} 