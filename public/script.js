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
            "id": 1,
            "title": "플러팅 고수! 전화번호 따기",
            "category": "플러팅",
            "max_turns": 5,
            "win_condition": "상대방의 전화번호를 얻어낸다",
            "lose_condition": "턴 제한을 초과하거나 상대방이 대화를 거부한다",
            "character_setting": "당신은 카페에서 우연히 마주친 매력적인 사람과 대화를 시작했습니다. 그들은 친절하지만 쉽게 개인정보를 알려주지 않는 성격입니다.",
            "difficulty": "보통",
            "character_name": "윤지혜"
        },
        {
            "id": 2,
            "title": "파티에서 번호 교환하기",
            "category": "플러팅",
            "max_turns": 4,
            "win_condition": "상대방과 번호를 교환하고 다음 만남 약속을 잡는다",
            "lose_condition": "턴 제한을 초과하거나 상대방이 관심을 잃는다",
            "character_setting": "당신은 친구의 파티에서 공통 관심사를 가진 사람을 만났습니다. 그들은 사교적이지만 많은 사람들에게 관심을 받고 있습니다.",
            "difficulty": "쉬움",
            "character_name": "김민준"
        },
        {
            "id": 3,
            "title": "꿈의 직장 면접 성공하기",
            "category": "면접",
            "max_turns": 10,
            "win_condition": "면접관을 설득해 일자리 제안을 받는다",
            "lose_condition": "자신의 경력이나 능력에 대해 일관성 없는 대답을 한다",
            "character_setting": "당신은 꿈의 회사에서 최종 면접 단계에 진출했습니다. 면접관은 기술적 지식과 문화적 적합성을 모두 평가하고 있습니다.",
            "difficulty": "어려움",
            "character_name": "박상현"
        },
        {
            "id": 4,
            "title": "연봉 협상 마스터",
            "category": "면접",
            "max_turns": 5,
            "win_condition": "초기 제안보다 20% 이상 높은 연봉을 협상한다",
            "lose_condition": "지나치게 공격적으로 요구하여 제안이 철회된다",
            "character_setting": "당신은 직무 면접을 통과했고 이제 연봉 협상 단계입니다. 회사는 당신을 원하지만 예산 제약이 있습니다.",
            "difficulty": "어려움",
            "character_name": "이지연"
        },
        {
            "id": 5,
            "title": "중고차 판매의 달인",
            "category": "물건판매",
            "max_turns": 6,
            "win_condition": "차량을 희망가보다 10% 이상 높은 가격에 판매한다",
            "lose_condition": "구매자가 거래를 거부하고 떠난다",
            "character_setting": "당신은 중고차 딜러입니다. 약간의 문제가 있지만 전반적으로 상태가 좋은 중고차를 판매하려고 합니다. 강태식씨는 까다롭고 차에 대해 많은 질문을 하는 잠재 구매자입니다.",
            "difficulty": "보통",
            "character_name": "강태식"
        },
        {
            "id": 6,
            "title": "한정판 제품 프리미엄 판매",
            "category": "물건판매",
            "max_turns": 4,
            "win_condition": "정가의 두 배 이상으로 제품을 판매한다",
            "lose_condition": "구매자가 사기를 의심하고 신고한다",
            "character_setting": "당신은 구하기 어려운 한정판 제품을 가지고 있으며, 온라인 마켓플레이스에서 판매하려고 합니다. 구매자는 제품에 관심이 있지만 가격을 흥정하려고 합니다.",
            "difficulty": "보통",
            "character_name": "조현우"
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
        
        // 데이터 경로 확인 (success.data 형식인지 확인)
        const result = startData.data || startData;
        console.log('게임 시작 응답 데이터:', result);
        
        // 중요: 게임 ID 설정 확인
        if (!result.game_id) {
            console.error('서버 응답에 game_id가 없습니다:', result);
            throw new Error('서버 응답에 게임 ID가 누락되었습니다.');
        }
        
        // 안전하게 속성 접근을 위해 기본값 설정
        gameId = result.game_id; // 중요: 전역 gameId 변수 설정
        console.log('게임 ID 설정됨:', gameId);
        
        title = result.title || '알 수 없는 시나리오';
        currentTurn = result.current_turn || 1;
        maxTurns = result.max_turns || 10;
        winCondition = result.win_condition || '알 수 없는 승리 조건';
        characterName = result.character_name || "AI"; // 캐릭터 이름 저장
        
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
        
        // 게임 식별자 가져오기
        const gameId = document.getElementById('game-id').textContent;
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
        
        // 온라인/오프라인 모드 확인
        if (!navigator.onLine || !gameId || gameId === 'offline-mode') {
            console.log('오프라인 모드에서 실행 중입니다.');
            
            // 로딩 메시지 제거
            removeMessage(loadingMessageId);
            
            // 오프라인 응답 생성
            const offlineResponse = await generateOfflineResponse(message);
            addMessage(characterName, offlineResponse.response, 'ai-message');
            
            // 치트 코드 확인
            if (message.toLowerCase() === 'win now') {
                addMessage('시스템', '치트 코드: 승리했습니다!', 'system-message success-text');
                gameEnded = true;
                showGameOverControls();
            } else if (message.toLowerCase() === 'lose now') {
                addMessage('시스템', '치트 코드: 패배했습니다!', 'system-message');
                gameEnded = true;
                showGameOverControls();
            }
            
            // 턴 업데이트
            currentTurn++;
            updateTurnIndicator(currentTurn, maxTurns);
            
            // 최대 턴에 도달한 경우 게임 종료
            if (currentTurn > maxTurns && !gameEnded) {
                gameEnded = true;
                addMessage('시스템', '최대 턴 수에 도달했습니다. 게임이 종료되었습니다.', 'system-message');
                showGameOverControls();
            }
        } else {
            // 온라인 모드: API 호출
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

// 오프라인 응답 생성 함수
async function generateOfflineResponse(message) {
    console.log('오프라인 응답 생성 중: ', message);
    
    // 치트 코드 처리
    if (message.toLowerCase() === 'win now') {
        return {
            response: "치트 코드를 사용했습니다. 승리합니다!",
            completed: true,
            victory: true,
            current_turn: currentTurn + 1
        };
    } else if (message.toLowerCase() === 'lose now') {
        return {
            response: "치트 코드를 사용했습니다. 패배합니다!",
            completed: true,
            victory: false,
            current_turn: currentTurn + 1
        };
    }
    
    // 카테고리별 응답 생성
    const category = currentScenario ? currentScenario.category : 'default';
    let response = "";
    
    // 간단한 응답 패턴
    if (message.toLowerCase().includes('안녕') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
        response = `안녕하세요! 저는 ${characterName}입니다. 어떻게 도와드릴까요?`;
    } else if (message.toLowerCase().includes('이름') || message.toLowerCase().includes('who are you')) {
        response = `제 이름은 ${characterName}입니다. 만나서 반가워요!`;
    } else if (message.toLowerCase().includes('도움') || message.toLowerCase().includes('help')) {
        response = "어떻게 도와드릴까요? 구체적인 질문을 해주시면 더 잘 답변할 수 있습니다.";
    } else {
        // 카테고리별 기본 응답
        switch (category) {
            case '플러팅':
                if (message.toLowerCase().includes('전화') || message.toLowerCase().includes('번호') || message.toLowerCase().includes('연락처')) {
                    response = "음, 우리 더 알아가고 싶네요. 제 번호는 010-1234-5678이에요. 연락 주세요!";
                } else {
                    const flirtResponses = [
                        "오늘 정말 재미있는 대화네요. 더 이야기하고 싶어요.",
                        "당신의 이야기 방식이 정말 매력적이에요.",
                        "다른 사람과는 다르게 대화하는 느낌이 드네요. 좋아요.",
                        "이렇게 대화를 나누니 시간 가는 줄 모르겠어요."
                    ];
                    response = flirtResponses[Math.floor(Math.random() * flirtResponses.length)];
                }
                break;
                
            case '면접':
                if (message.toLowerCase().includes('경력') || message.toLowerCase().includes('경험')) {
                    response = "저는 이 분야에서 5년 이상의 경력을 가지고 있으며, 다양한 프로젝트를 성공적으로 이끌었습니다.";
                } else if (message.toLowerCase().includes('강점') || message.toLowerCase().includes('장점')) {
                    response = "저의 가장 큰 강점은 문제 해결 능력과 팀워크입니다. 어려운 상황에서도 창의적인 해결책을 찾아냅니다.";
                } else if (message.toLowerCase().includes('연봉') || message.toLowerCase().includes('급여')) {
                    response = "네, 제시해주신 연봉 범위에 동의합니다. 회사에 기여할 수 있는 가치를 생각하면 합리적인 제안이라고 생각합니다.";
                    return {
                        response,
                        completed: true,
                        victory: true,
                        current_turn: currentTurn + 1
                    };
                } else {
                    const interviewResponses = [
                        "네, 그 부분에 대해 자세히 설명드리겠습니다.",
                        "좋은 질문입니다. 제 생각을 말씀드리자면...",
                        "그 부분은 제가 특히 자신 있는 영역입니다.",
                        "그 질문에 대한 답변을 준비해왔습니다."
                    ];
                    response = interviewResponses[Math.floor(Math.random() * interviewResponses.length)];
                }
                break;
                
            case '물건판매':
                if (message.toLowerCase().includes('가격') || message.toLowerCase().includes('얼마')) {
                    response = "이 제품의 가격은 시장가보다 매우 합리적입니다. 품질과 상태를 고려하면 좋은 거래라고 생각합니다.";
                } else if (message.toLowerCase().includes('구매') || message.toLowerCase().includes('살게') || message.toLowerCase().includes('계약')) {
                    response = "훌륭한 선택입니다! 거래가 성사되었습니다. 정말 좋은 제품을 얻으셨습니다.";
                    return {
                        response,
                        completed: true,
                        victory: true,
                        current_turn: currentTurn + 1
                    };
                } else {
                    const salesResponses = [
                        "이 제품의 장점을 말씀드리자면...",
                        "많은 고객들이 이 제품의 품질에 만족하고 있습니다.",
                        "이런 기회는 흔치 않습니다. 정말 좋은 조건이에요.",
                        "다른 곳과 비교해보셔도 좋습니다. 저희 제품이 최고입니다."
                    ];
                    response = salesResponses[Math.floor(Math.random() * salesResponses.length)];
                }
                break;
                
            default:
                const defaultResponses = [
                    "흥미로운 질문이네요. 더 자세히 말씀해주실 수 있을까요?",
                    "네, 계속해서 이야기해주세요.",
                    "알겠습니다. 다른 질문이 있으신가요?",
                    "그렇군요. 더 알고 싶은 것이 있으신가요?"
                ];
                response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }
    }
    
    // 최대 턴 확인
    const isLastTurn = currentTurn + 1 >= maxTurns;
    
    return {
        response,
        completed: isLastTurn,
        victory: false,
        current_turn: currentTurn + 1
    };
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
function addMessage(sender, text, cssClass) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    const messageId = 'msg-' + Date.now();
    
    messageDiv.className = 'message ' + cssClass;
    messageDiv.id = messageId;
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'sender';
    senderSpan.textContent = sender;
    
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = text;
    
    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(textSpan);
    messagesContainer.appendChild(messageDiv);
    
    // 메시지 영역을 자동으로 아래로 스크롤
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
}

// 메시지 ID로 해당 메시지 제거
function removeMessage(messageId) {
    if (!messageId) return;
    
    const messageElement = document.getElementById(messageId);
    if (messageElement && messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
    }
}

// 현재 턴 가져오기
function getCurrentTurn() {
    return currentTurn;
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