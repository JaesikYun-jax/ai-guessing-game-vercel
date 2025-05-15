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

// 서버 주소 설정 (API 서버 URL)
const SERVER_URL = 'https://flask-vercel-ebon.vercel.app';
const USE_TEST_MODE = true; // 테스트 모드 활성화

// 페이지 로드 시 서버 상태 확인 및 게임 목록 가져오기
document.addEventListener('DOMContentLoaded', async () => {
    // 콘솔에 디버그 메시지 출력
    console.log('페이지 로드됨, 이벤트 리스너 설정 시작');
    console.log('서버 URL:', SERVER_URL);
    console.log('테스트 모드:', USE_TEST_MODE ? '활성화' : '비활성화');
    
    // 서버 상태 확인 시작
    await checkServerStatus();
    
    // 이벤트 리스너 등록
    console.log('버튼 이벤트 리스너 추가 시작');
    startSelectedBtn.addEventListener('click', () => {
        console.log('선택 게임 시작 버튼 클릭됨');
        handleStartGame('selected');
    });
    
    startRandomBtn.addEventListener('click', () => {
        console.log('랜덤 게임 시작 버튼 클릭됨');
        handleStartGame('random');
    });
    
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    });
    
    // 글자 수 카운터 이벤트 리스너 추가
    userInput.addEventListener('input', updateCharCount);
    
    endGameButton.addEventListener('click', handleEndGame);
    newGameButton.addEventListener('click', handleBackToHome);
    
    console.log('이벤트 리스너 설정 완료');
    
    // 모든 버튼이 제대로 DOM에 있는지 확인
    checkButtonsExist();
});

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
        
        console.log('서버 상태 API 요청:', `${SERVER_URL}/api/health`);
        const response = await fetch(`${SERVER_URL}/api/health`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // 캐시 방지
            cache: 'no-cache'
        });
        console.log('서버 상태 응답:', response.status, response.statusText);
        
        if (response.ok) {
            // 서버 응답 성공
            console.log('서버 연결 성공');
            const data = await response.json();
            
            serverStatus.textContent = `✅ 서버 연결 성공 (${data.status})`;
            serverStatus.classList.add('success-text');
            serverStatus.classList.remove('error-text');
            startScreen.classList.remove('hidden');
            
            // 게임 항목 로드
            fetchGameItems();
            
            // 성공하면 60초마다 확인 (백그라운드에서 상태 유지)
            setTimeout(checkServerStatus, 60000);
        } else {
            // 서버 응답은 받았지만 오류 코드 반환
            console.error('서버 응답 오류:', response.status);
            throw new Error(`서버 연결 불안정: 상태 코드 ${response.status}`);
        }
    } catch (error) {
        console.error('서버 연결 실패:', error);
        // 오류 메시지를 사용자 친화적으로 변경
        let errorMessage = '❌ 서버 연결 실패';
        
        // "Failed to fetch" 같은 기술적 오류 메시지 대신 보기 좋은 메시지 표시
        if (error.message.includes('Failed to fetch')) {
            errorMessage = '❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
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
        console.log('게임 항목 목록 요청 시작:', `${SERVER_URL}/api/games`);
        
        const response = await fetch(`${SERVER_URL}/api/games`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache'
        });
        console.log('게임 항목 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
        
        // 서버 연결 성공 시, 서버 상태 메시지 업데이트
        if (!serverStatus.classList.contains('success-text')) {
            serverStatus.textContent = '✅ 서버 연결 성공';
            serverStatus.classList.add('success-text');
            serverStatus.classList.remove('error-text');
        }
        
        const data = await response.json();
        console.log('게임 항목 데이터 수신:', data);
        
        if (data.success && Array.isArray(data.data)) {
            gameItems = data.data;
            console.log('게임 항목 로드 성공:', gameItems.length, '개 항목');
            populateGameSelect(gameItems);
        } else {
            console.error('게임 항목을 불러오는데 실패했습니다:', data.error || '알 수 없는 오류');
        }
    } catch (error) {
        console.error('게임 항목 가져오기 실패:', error);
    }
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
        const category = item.category || '기타';
        if (!categorizedItems[category]) {
            categorizedItems[category] = [];
        }
        categorizedItems[category].push(item);
    });
    
    // 카테고리별 optgroup 생성
    for (const category in categorizedItems) {
        const group = document.createElement('optgroup');
        group.label = category;
        
        // 해당 카테고리의 게임들 추가
        categorizedItems[category].forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.title} (${item.difficulty || '보통'}, ${item.max_turns}턴)`;
            option.dataset.turns = item.max_turns;
            group.appendChild(option);
        });
        
        gameSelect.appendChild(group);
    }
    
    console.log('게임 목록 드롭다운 채우기 완료, 총 옵션 수:', gameSelect.options.length);
}

// 게임 시작 핸들러
async function handleStartGame(mode) {
    try {
        console.log(`게임 시작 모드: ${mode}`);
        
        // 서버 연결 상태 확인
        if (serverStatus.classList.contains('error-text')) {
            alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        // 랜덤 모드 또는 선택된 게임 ID 가져오기
        let selectedGameId = null;
        if (mode === 'selected') {
            selectedGameId = gameSelect.value;
            if (!selectedGameId) {
                alert('게임을 선택해주세요.');
                return;
            }
        }
        
        // 게임 시작 버튼 비활성화 (중복 클릭 방지)
        startSelectedBtn.disabled = true;
        startRandomBtn.disabled = true;
        
        console.log('게임 시작 API 요청:', `${SERVER_URL}/api/start`);
        console.log('선택된 게임 ID:', selectedGameId);
        
        // API 요청 데이터 준비
        const requestData = {
            item_id: selectedGameId,
            test: USE_TEST_MODE // 테스트 모드 활성화 여부
        };
        
        // API 요청
        const response = await fetch(`${SERVER_URL}/api/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        console.log('게임 시작 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('게임 시작 응답 데이터:', data);
        
        if (data.success && data.data) {
            // 게임 정보 저장
            gameId = data.data.game_id;
            title = data.data.title;
            maxTurns = data.data.max_turns;
            currentTurn = data.data.current_turn;
            winCondition = data.data.win_condition;
            characterName = data.data.character_name;
            gameEnded = false;
            
            // UI 업데이트
            gameIdElement.textContent = `게임 ID: ${gameId}`;
            categoryElement.textContent = `카테고리: ${data.data.category}`;
            titleElement.textContent = `시나리오: ${title}`;
            winConditionElement.textContent = `승리 조건: ${winCondition}`;
            updateTurnIndicator(currentTurn, maxTurns);
            
            // 캐릭터 정보 표시
            if (data.data.character_setting) {
                characterInfoElement.textContent = `${data.data.character_name}: ${data.data.character_setting}`;
            }
            
            // 메시지 영역 초기화
            messageContainer.innerHTML = '';
            
            // 환영 메시지 추가
            if (data.data.welcome_message) {
                addMessage('system', data.data.welcome_message, 'system-message');
            }
            
            // 게임 화면 표시 및 시작 화면 숨기기
            startScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            
            // 입력란에 포커스
            userInput.focus();
        } else {
            throw new Error(data.error || '게임을 시작하는데 실패했습니다.');
        }
    } catch (error) {
        console.error('게임 시작 오류:', error);
        alert(`게임을 시작하는데 문제가 발생했습니다: ${error.message}`);
    } finally {
        // 게임 시작 버튼 활성화
        startSelectedBtn.disabled = false;
        startRandomBtn.disabled = false;
    }
}

// 메시지 전송 핸들러
async function handleSendMessage() {
    // 입력값 가져오기 및 유효성 검사
    const message = userInput.value.trim();
    if (!message) {
        userInput.focus();
        return;
    }
    
    // 게임이 이미 종료되었는지 확인
    if (gameEnded) {
        alert('게임이 이미 종료되었습니다. 새 게임을 시작해주세요.');
        return;
    }
    
    // 사용자 메시지 표시
    addMessage('user', message, 'user-message');
    
    // 입력창 초기화
    userInput.value = '';
    updateCharCount();
    
    // 보내기 버튼 비활성화 (중복 전송 방지)
    sendButton.disabled = true;
    
    try {
        // AI 응답 요청
        await askQuestion(message);
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        addMessage('system', `오류: ${error.message}`, 'error-message');
    } finally {
        // 보내기 버튼 활성화
        sendButton.disabled = false;
        userInput.focus();
    }
}

// AI에게 질문하기
async function askQuestion(message) {
    console.log('AI에게 질문 전송:', message);
    
    try {
        // API 요청
        const response = await fetch(`${SERVER_URL}/api/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game_id: gameId,
                message: message
            })
        });
        
        console.log('질문 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            // 응답이 JSON 형식인지 확인
            let errorMessage = '서버 응답 오류';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || `오류 코드: ${response.status}`;
                
                // 게임 ID가 유효하지 않은 경우
                if (errorData.code === 'INVALID_GAME_ID') {
                    // 자동으로 새 게임 시작 확인
                    if (confirm('게임 세션이 만료되었습니다. 새 게임을 시작하시겠습니까?')) {
                        handleBackToHome();
                    }
                }
            } catch (e) {
                errorMessage = `서버 응답 오류: ${response.status}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('AI 응답 데이터:', data);
        
        // AI 응답 표시
        addMessage('ai', data.response, 'ai-message');
        
        // 턴 업데이트
        currentTurn = data.current_turn;
        updateTurnIndicator(currentTurn, maxTurns);
        
        // 게임 종료 확인
        if (data.completed) {
            gameEnded = true;
            
            // 승리/패배 메시지 표시
            if (data.victory) {
                addMessage('system', '🎉 축하합니다! 승리 조건을 달성했습니다!', 'victory-message');
            } else {
                addMessage('system', '😥 아쉽게도 패배했습니다. 다시 도전해보세요!', 'defeat-message');
            }
            
            // 게임 종료 UI 업데이트
            showGameOverControls();
        }
    } catch (error) {
        console.error('AI 응답 가져오기 실패:', error);
        throw error;
    }
}

// 턴 표시기 업데이트
function updateTurnIndicator(current, max) {
    document.getElementById('current-turn').textContent = current;
    document.getElementById('max-turns').textContent = max;
    
    // 턴이 후반부에 접어들면 시각적 표시
    const turnPercentage = current / max;
    if (turnPercentage > 0.7) {
        turnIndicator.classList.add('turn-warning');
    } else {
        turnIndicator.classList.remove('turn-warning');
    }
}

// 게임 종료 컨트롤 표시
function showGameOverControls() {
    endGameButton.classList.add('hidden');
    newGameButton.classList.remove('hidden');
}

// 게임 종료 핸들러
async function handleEndGame() {
    if (!gameId) return;
    
    if (!confirm('정말 게임을 종료하시겠습니까?')) {
        return;
    }
    
    try {
        console.log('게임 종료 API 요청:', `${SERVER_URL}/api/end`);
        
        // API 요청
        const response = await fetch(`${SERVER_URL}/api/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: gameId })
        });
        
        console.log('게임 종료 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('게임 종료 응답 데이터:', data);
        
        // 게임 종료 상태 설정
        gameEnded = true;
        
        // 게임 요약 메시지 표시
        let summaryMessage = '게임이 종료되었습니다.';
        if (data.summary) {
            const summary = data.summary;
            summaryMessage += `<br><br>▶ 게임 요약:<br>- 플레이 턴 수: ${summary.turns_played}<br>- 결과: ${summary.victory ? '승리' : '패배'}`;
        }
        
        addMessage('system', summaryMessage, 'system-message');
        
        // 게임 종료 UI 업데이트
        showGameOverControls();
    } catch (error) {
        console.error('게임 종료 오류:', error);
        alert(`게임을 종료하는데 문제가 발생했습니다: ${error.message}`);
    }
}

// 홈으로 돌아가기 핸들러
function handleBackToHome() {
    // 게임 컨테이너 숨기기
    gameContainer.classList.add('hidden');
    
    // 시작 화면 표시
    startScreen.classList.remove('hidden');
    
    // 게임 종료 버튼 표시, 새 게임 버튼 숨기기
    endGameButton.classList.remove('hidden');
    newGameButton.classList.add('hidden');
    
    // 게임 상태 초기화
    gameId = null;
    gameEnded = false;
    
    // 메시지 영역 초기화
    messageContainer.innerHTML = '';
    
    // 입력 폼 초기화
    userInput.value = '';
    updateCharCount();
    
    // 게임 항목 새로고침
    fetchGameItems();
}

// 메시지 추가 함수
function addMessage(sender, text, className) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    
    // 이모지 추가
    let emoji = '';
    if (sender === 'user') {
        emoji = '👤 ';
    } else if (sender === 'ai') {
        emoji = '🤖 ';
    } else if (sender === 'system') {
        emoji = '📢 ';
    }
    
    // HTML 태그 처리
    if (text.includes('<br>')) {
        const fragments = text.split('<br>');
        fragments.forEach((fragment, index) => {
            const p = document.createElement('p');
            p.textContent = index === 0 ? emoji + fragment : fragment;
            messageElement.appendChild(p);
        });
    } else {
        messageElement.textContent = emoji + text;
    }
    
    messageContainer.appendChild(messageElement);
    scrollToBottom();
}

// 메시지 영역 스크롤 함수
function scrollToBottom() {
    const messages = document.querySelector('.messages');
    messages.scrollTop = messages.scrollHeight;
} 