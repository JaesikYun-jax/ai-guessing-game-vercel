// 전역 변수
let gameId = null;
let gameEnded = false;
let currentTurn = 1;
let maxTurns = 0;
let title = "";
let winCondition = "";
let characterName = "AI"; // 캐릭터 이름
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
const API_BASE_URL = 'https://flask-vercel-ebon.vercel.app'; // 메인 서버 URL

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
        
        // 다음 API URL 시도
        if (tryNextApiUrl()) {
            console.log(`다음 API URL로 시도: ${getCurrentApiUrl()}`);
            setTimeout(checkServerStatus, 3000); // 3초 후 재시도
        } else {
            // 모든 URL 시도 후 실패
            serverStatus.textContent = '❌ 모든 서버 연결 시도 실패';
            // 10초 후 재시도
            setTimeout(checkServerStatus, 10000);
        }
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
                    console.warn('모든 API URL 시도 후 실패, 기본 게임 데이터 사용');
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
            console.error('파싱된 데이터가 없습니다');
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
                    data = { success: true, data: [data] };
                }
            }
        }
        
        // 게임 항목 목록 설정
        if (data.success && Array.isArray(data.data)) {
            const items = data.data;
            console.log('게임 항목 목록 가져오기 성공:', items);
            gameItems = items;
            populateGameSelect(items);
        } else {
            console.error('게임 항목 목록 구조 오류:', data);
            throw new Error('게임 항목 목록 형식이 올바르지 않습니다');
        }
    } catch (error) {
        console.error('게임 항목 목록 가져오기 실패:', error);
        console.error('에러 세부정보:', error.stack);
        
        // 오류 메시지를 사용자 친화적으로 변경
        alert('게임 항목 목록을 가져오는 중 오류가 발생했습니다.');
        
        // 기본 게임 항목 사용
        useDefaultGameItems();
    }
}

// 기본 게임 항목 사용 함수
function useDefaultGameItems() {
    console.log('기본 게임 항목 사용');
    
    // 기본 게임 항목 목록
    const defaultItems = [
        {
            id: "1",
            title: "역사적 인물",
            category: "인물",
            character_name: "유명한 역사 인물",
            max_turns: 5,
            win_condition: "해당 역사적 인물이 누구인지 맞추기"
        },
        {
            id: "2",
            title: "영화 캐릭터",
            category: "인물",
            character_name: "유명한 영화 속 캐릭터",
            max_turns: 5,
            win_condition: "영화 속 캐릭터가 누구인지 맞추기"
        },
        {
            id: "3",
            title: "유명한 발명품",
            category: "사물",
            character_name: "중요한 발명품",
            max_turns: 5,
            win_condition: "해당 발명품이 무엇인지 맞추기"
        }
    ];
    
    gameItems = defaultItems;
    populateGameSelect(defaultItems);
}

// 게임 목록 셀렉트 박스 채우기
function populateGameSelect(items) {
    console.log('게임 셀렉트 박스 채우기:', items);
    
    if (!gameSelect) {
        console.error('gameSelect 요소를 찾을 수 없습니다');
        return;
    }
    
    // 이전 옵션 제거
    gameSelect.innerHTML = '';
    
    // 기본 옵션 추가
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- 게임 선택 --';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    gameSelect.appendChild(defaultOption);
    
    // 게임 항목 옵션 추가
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        
        // 게임 항목 정보 포맷팅
        let optionText = `${item.title}`;
        if (item.category) {
            optionText += ` (${item.category})`;
        }
        
        option.textContent = optionText;
        gameSelect.appendChild(option);
        
        console.log('게임 옵션 추가됨:', optionText);
    });
    
    // 선택한 게임 시작 버튼 활성화
    if (startSelectedBtn) {
        startSelectedBtn.disabled = false;
    }
    
    // 랜덤 게임 시작 버튼 활성화
    if (startRandomBtn) {
        startRandomBtn.disabled = false;
    }
}

// 게임 시작 처리 함수
async function handleStartGame(mode) {
    console.log(`게임 시작 모드: ${mode}`);
    
    try {
        // 버튼 비활성화 (중복 클릭 방지)
        if (startSelectedBtn) startSelectedBtn.disabled = true;
        if (startRandomBtn) startRandomBtn.disabled = true;
        
        let selectedGameId = null;
        
        // 게임 선택 모드에 따라 처리
        if (mode === 'selected') {
            // 선택된 게임 ID 가져오기
            selectedGameId = gameSelect.value;
            
            // 게임이 선택되지 않은 경우
            if (!selectedGameId) {
                alert('게임을 선택해주세요.');
                if (startSelectedBtn) startSelectedBtn.disabled = false;
                if (startRandomBtn) startRandomBtn.disabled = false;
                return;
            }
            
            console.log('선택된 게임 ID:', selectedGameId);
        } else if (mode === 'random') {
            // 랜덤 게임 선택 (서버에서 처리됨)
            console.log('랜덤 게임 선택 (서버에서 처리)');
        } else {
            console.error('알 수 없는 게임 시작 모드:', mode);
            alert('잘못된 게임 시작 모드입니다.');
            if (startSelectedBtn) startSelectedBtn.disabled = false;
            if (startRandomBtn) startRandomBtn.disabled = false;
            return;
        }
        
        // 서버 상태 확인
        serverStatus.textContent = '서버 연결 중...';
        serverStatus.classList.remove('success-text', 'error-text');
        
        try {
            // 건강 체크 API 호출
            const healthUrl = `${getCurrentApiUrl()}/api/health`;
            console.log('서버 상태 확인 URL:', healthUrl);
            
            const healthResponse = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!healthResponse.ok) {
                throw new Error(`서버 상태 확인 실패: ${healthResponse.status}`);
            }
            
            console.log('서버 상태 확인 완료, 게임 시작 요청 시작');
            
            // 게임 시작 API 호출
            const startUrl = `${getCurrentApiUrl()}/api/start`;
            console.log('게임 시작 요청 URL:', startUrl);
            console.log('요청 본문:', JSON.stringify({ game_id: selectedGameId }));
            
            const startResponse = await fetch(startUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ game_id: selectedGameId }),
                mode: 'cors'
            });
            
            console.log('게임 시작 응답 받음:', startResponse);
            console.log('응답 상태:', startResponse.status, startResponse.statusText);
            
            if (!startResponse.ok) {
                throw new Error(`게임 시작 요청 실패: ${startResponse.status}`);
            }
            
            // 응답 본문 가져오기
            const startResponseText = await startResponse.text();
            console.log('게임 시작 응답 본문:', startResponseText);
            
            // JSON 파싱
            let gameData;
            try {
                gameData = JSON.parse(startResponseText);
                console.log('파싱된 게임 데이터:', gameData);
            } catch (parseError) {
                console.error('게임 데이터 JSON 파싱 오류:', parseError);
                throw new Error(`게임 데이터 파싱 오류: ${parseError.message}`);
            }
            
            // 게임 데이터 검증
            if (!gameData || !gameData.game_id) {
                throw new Error('유효하지 않은 게임 데이터 (game_id 누락)');
            }
            
            // 서버 응답 성공 - 게임 상태 초기화
            console.log('게임 시작 성공, 게임 상태 초기화');
            
            // 게임 상태 업데이트
            gameId = gameData.game_id;
            title = gameData.title || '제목 없음';
            currentTurn = 1;
            maxTurns = gameData.max_turns || 5;
            winCondition = gameData.win_condition || '정확한 대상을 맞추세요';
            characterName = gameData.character_name || 'AI 어시스턴트';
            gameEnded = false;
            
            // UI 업데이트
            gameIdElement.textContent = `게임 ID: ${gameId}`;
            categoryElement.textContent = `카테고리: ${gameData.category || '일반'}`;
            titleElement.textContent = `시나리오: ${title}`;
            winConditionElement.textContent = `승리 조건: ${winCondition}`;
            
            // 캐릭터 정보 표시
            if (gameData.character_setting) {
                characterInfoElement.innerHTML = `<strong>${characterName}</strong>: ${gameData.character_setting}`;
            } else {
                characterInfoElement.innerHTML = `<strong>${characterName}</strong>가 당신의 질문에 답변합니다.`;
            }
            
            updateTurnIndicator(currentTurn, maxTurns);
            
            // 시작 화면 숨김, 게임 화면 표시
            startScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            
            // 시스템 메시지 추가
            addMessage('시스템', '게임이 시작되었습니다. 질문을 입력하여 게임을 진행하세요.', 'system-message');
            
            // 첫 메시지 추가
            if (gameData.initial_message) {
                addMessage(characterName, gameData.initial_message, 'ai-message');
            } else {
                addMessage(characterName, `안녕하세요! 저는 ${characterName}입니다. 궁금한 점을 질문해보세요.`, 'ai-message');
            }
            
            console.log('게임 시작 완료');
            
            // 서버 상태 업데이트
            serverStatus.textContent = '✅ 게임 진행 중';
            serverStatus.classList.add('success-text');
            serverStatus.classList.remove('error-text');
            
        } catch (healthError) {
            console.error('서버 상태 확인 실패:', healthError);
            throw new Error(`서버 연결 실패: ${healthError.message}`);
        }
    } catch (error) {
        console.error('게임 시작 중 오류 발생:', error);
        
        // 버튼 재활성화
        if (startSelectedBtn) startSelectedBtn.disabled = false;
        if (startRandomBtn) startRandomBtn.disabled = false;
        
        // 사용자에게 오류 알림
        alert(`게임을 시작하는 중 오류가 발생했습니다: ${error.message}`);
        
        // 서버 상태 업데이트
        serverStatus.textContent = '❌ 서버 연결 오류';
        serverStatus.classList.add('error-text');
        serverStatus.classList.remove('success-text');
    }
}

// API로 질문 전송 함수
async function askQuestion(gameId, question) {
    console.log(`질문 전송: ${question} (게임 ID: ${gameId})`);
    
    const askUrl = `${getCurrentApiUrl()}/api/ask`;
    console.log('질문 API URL:', askUrl);
    
    try {
        const response = await fetch(askUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_id: gameId,
                question: question
            }),
            mode: 'cors'
        });
        
        console.log('질문 응답 받음:', response);
        console.log('응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }
        
        // 응답 본문 가져오기
        const responseText = await response.text();
        console.log('질문 응답 본문:', responseText);
        
        // 빈 응답 확인
        if (!responseText || responseText.trim() === '') {
            console.error('서버가 빈 응답을 반환했습니다.');
            throw new Error('서버가 빈 응답을 반환했습니다.');
        }
        
        // JSON 파싱
        try {
            const data = JSON.parse(responseText);
            console.log('파싱된 응답 데이터:', data);
            return data;
        } catch (parseError) {
            console.error('응답 JSON 파싱 오류:', parseError);
            console.error('파싱 실패한 텍스트:', responseText);
            throw new Error(`응답 파싱 오류: ${parseError.message}`);
        }
    } catch (error) {
        console.error('질문 API 호출 오류:', error);
        throw error; // 호출자에게 오류 전파
    }
}

// API 응답 처리 함수
function processApiResponse(response) {
    console.log('API 응답 처리:', response);
    
    // 기본 반환 객체
    const result = {
        message: '',
        isGameOver: false,
        isVictory: false,
        currentTurn: currentTurn + 1
    };
    
    try {
        // 메시지 추출
        if (response.message) {
            result.message = response.message;
        } else if (response.response) {
            result.message = response.response;
        } else if (typeof response === 'string') {
            result.message = response;
        } else {
            // 메시지 필드가 없는 경우
            result.message = "응답이 없습니다. 다시 질문해보세요.";
            console.warn('응답에 메시지 필드가 없습니다:', response);
        }
        
        // 게임 종료 여부 확인
        if (response.completed !== undefined) {
            result.isGameOver = response.completed;
        } else if (response.game_over !== undefined) {
            result.isGameOver = response.game_over;
        } else if (response.is_game_over !== undefined) {
            result.isGameOver = response.is_game_over;
        }
        
        // 승리 여부 확인
        if (response.victory !== undefined) {
            result.isVictory = response.victory;
        } else if (response.is_victory !== undefined) {
            result.isVictory = response.is_victory;
        } else if (response.win !== undefined) {
            result.isVictory = response.win;
        }
        
        // 현재 턴 업데이트
        if (response.current_turn !== undefined) {
            result.currentTurn = response.current_turn;
        } else if (response.turn !== undefined) {
            result.currentTurn = response.turn;
        }
    } catch (error) {
        console.error('API 응답 처리 중 오류 발생:', error);
    }
    
    return result;
}

// 메시지 전송 처리 함수
async function handleSendMessage() {
    // 입력 필드에서 메시지 가져오기
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    // 메시지가 비어있으면 처리하지 않음
    if (!message) {
        return;
    }
    
    try {
        // 인터페이스 업데이트
        messageInput.value = '';
        messageInput.disabled = true;
        document.getElementById('send-button').disabled = true;
        
        // 사용자 메시지 추가
        addMessage('나', message, 'user-message');
        
        // 로딩 메시지 표시
        const loadingMessageId = addMessage('AI', '...', 'ai-message loading');
        
        console.log('현재 게임 ID:', gameId);
        
        // 게임이 이미 종료되었는지 확인
        if (gameEnded) {
            console.log('게임이 이미 종료되었습니다.');
            removeMessage(loadingMessageId);
            addMessage('시스템', '게임이 이미 종료되었습니다. 새 게임을 시작하려면 "새 게임 시작" 버튼을 클릭하세요.', 'system-message');
            messageInput.disabled = false;
            document.getElementById('send-button').disabled = false;
            return;
        }
        
        // API 호출
        const response = await askQuestion(gameId, message);
        
        // 로딩 메시지 제거
        removeMessage(loadingMessageId);
        
        // 응답 처리
        const { message: aiMessage, isGameOver, isVictory, currentTurn: newTurn } = processApiResponse(response);
        
        // AI 메시지 표시
        addMessage(characterName, aiMessage, 'ai-message');
        
        // 게임 상태 업데이트
        if (isGameOver) {
            console.log(`게임 종료: 승리=${isVictory}`);
            gameEnded = true;
            
            // 승리/패배 메시지 표시
            if (isVictory) {
                addMessage('시스템', '축하합니다! 게임에서 승리했습니다!', 'system-message success-text');
            } else {
                addMessage('시스템', '게임이 종료되었습니다. 다음에 다시 도전해보세요!', 'system-message');
            }
            
            // 게임 종료 컨트롤 표시
            showGameOverControls();
        }
        
        // 턴 업데이트
        currentTurn = newTurn;
        updateTurnIndicator(currentTurn, maxTurns);
        
        // 최대 턴에 도달한 경우 게임 종료
        if (currentTurn > maxTurns && !gameEnded) {
            gameEnded = true;
            addMessage('시스템', '최대 턴 수에 도달했습니다. 게임이 종료되었습니다.', 'system-message');
            showGameOverControls();
        }
    } catch (error) {
        console.error('메시지 전송 중 오류 발생:', error);
        addMessage('시스템', `오류가 발생했습니다: ${error.message}. 다시 시도해주세요.`, 'system-message error-text');
    } finally {
        // 입력 필드 재활성화
        messageInput.disabled = false;
        document.getElementById('send-button').disabled = false;
        messageInput.focus();
    }
}

// 턴 표시기 업데이트 함수
function updateTurnIndicator(current, max) {
    console.log(`턴 표시기 업데이트: ${current}/${max}`);
    
    if (turnIndicator) {
        turnIndicator.textContent = `턴: ${current}/${max}`;
        
        // 턴이 많이 진행되었을 때 시각적 피드백 제공
        if (current >= max) {
            turnIndicator.classList.add('final-turn');
        } else if (current >= max * 0.7) {
            turnIndicator.classList.add('late-turn');
            turnIndicator.classList.remove('final-turn');
        } else {
            turnIndicator.classList.remove('late-turn', 'final-turn');
        }
    }
}

// 게임 종료 컨트롤 표시 함수
function showGameOverControls() {
    console.log('게임 종료 컨트롤 표시');
    
    if (endGameButton) endGameButton.classList.add('hidden');
    if (newGameButton) newGameButton.classList.remove('hidden');
}

// 게임 종료 처리
async function handleEndGame() {
    console.log('게임 종료 처리 시작');
    
    try {
        // 버튼 비활성화 (중복 클릭 방지)
        if (endGameButton) endGameButton.disabled = true;
        
        // 게임 종료 확인
        const confirmed = confirm('정말로 게임을 종료하시겠습니까? 현재 진행 상황은 저장되지 않습니다.');
        
        if (!confirmed) {
            console.log('사용자가 게임 종료를 취소했습니다.');
            if (endGameButton) endGameButton.disabled = false;
            return;
        }
        
        // 게임 종료 상태로 설정
        gameEnded = true;
        
        // 시스템 메시지 추가
        addMessage('시스템', '게임이 종료되었습니다.', 'system-message');
        
        try {
            // 게임 종료 API 호출 (필요한 경우)
            if (gameId && gameId !== 'offline-mode') {
                console.log(`게임 종료 API 호출: ${gameId}`);
                
                const endUrl = `${getCurrentApiUrl()}/api/end`;
                console.log('게임 종료 요청 URL:', endUrl);
                
                const endResponse = await fetch(endUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        game_id: gameId
                    }),
                    mode: 'cors'
                });
                
                console.log('게임 종료 응답 받음:', endResponse);
                
                if (!endResponse.ok) {
                    console.error(`게임 종료 API 오류: ${endResponse.status}`);
                } else {
                    console.log('게임 종료 API 호출 성공');
                }
            }
        } catch (apiError) {
            // API 호출 오류는 무시 (사용자 경험에 영향을 주지 않음)
            console.error('게임 종료 API 호출 중 오류 발생:', apiError);
        }
        
        // 게임 종료 컨트롤 표시
        showGameOverControls();
        
    } catch (error) {
        console.error('게임 종료 중 오류 발생:', error);
        alert(`게임 종료 중 오류가 발생했습니다: ${error.message}`);
    } finally {
        // 버튼 재활성화
        if (endGameButton) endGameButton.disabled = false;
    }
}

// 홈으로 돌아가기 함수
function handleBackToHome() {
    console.log('홈으로 돌아가기');
    
    // 게임 상태 초기화
    gameId = null;
    gameEnded = false;
    currentTurn = 1;
    maxTurns = 0;
    title = "";
    winCondition = "";
    characterName = "AI";
    
    // UI 초기화
    messageContainer.innerHTML = '';
    
    // 게임 화면 숨김, 시작 화면 표시
    gameContainer.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    // 버튼 상태 초기화
    if (endGameButton) endGameButton.classList.remove('hidden');
    if (newGameButton) newGameButton.classList.add('hidden');
    
    // 서버 상태 확인
    checkServerStatus();
}

// 메시지 추가 함수
function addMessage(sender, text, className) {
    console.log(`메시지 추가: ${sender} - ${text.substring(0, 30)}...`);
    
    if (!messageContainer) {
        console.error('messageContainer 요소를 찾을 수 없습니다');
        return null;
    }
    
    // 메시지 요소 생성
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    
    // 고유 ID 생성
    const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    messageElement.id = messageId;
    
    // 발신자 요소 생성
    const senderElement = document.createElement('div');
    senderElement.classList.add('message-sender');
    senderElement.textContent = sender;
    
    // 내용 요소 생성
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    // 텍스트에 URL이 있으면 링크로 변환
    const linkedText = text.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    contentElement.innerHTML = linkedText;
    
    // 요소 조립
    messageElement.appendChild(senderElement);
    messageElement.appendChild(contentElement);
    
    // 메시지 컨테이너에 추가
    messageContainer.appendChild(messageElement);
    
    // 스크롤 최하단으로 이동
    scrollToBottom();
    
    // 메시지 ID 반환 (나중에 업데이트나 제거에 사용 가능)
    return messageId;
}

// 메시지 제거 함수
function removeMessage(messageId) {
    if (!messageId) return;
    
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.remove();
    }
}

// 스크롤 최하단으로 이동 함수
function scrollToBottom() {
    if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
} 