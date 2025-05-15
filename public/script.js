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

// 서버 주소 설정 (API 서버 URL로 하드코딩)
const SERVER_URL = 'https://flask-vercel-ebon.vercel.app';
// const SERVER_URL = window.location.origin; // 같은 오리진 사용 (현재는 서버가 별도 도메인에 있으므로 사용하지 않음)
// const SERVER_URL = 'http://localhost:5002'; // 로컬 테스트용 URL

// 페이지 로드 시 서버 상태 확인 및 게임 목록 가져오기
document.addEventListener('DOMContentLoaded', async () => {
    // 콘솔에 디버그 메시지 출력
    console.log('페이지 로드됨, 이벤트 리스너 설정 시작');
    console.log('서버 URL:', SERVER_URL);
    
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
        const response = await fetch(`${SERVER_URL}/api/health`);
        console.log('서버 상태 응답:', response.status, response.statusText);
        
        if (response.ok) {
            // 서버 응답 성공
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
        
        const response = await fetch(`${SERVER_URL}/api/games`);
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
    
    // 카테고리 정렬
    const sortedCategories = Object.keys(categorizedItems).sort();
    
    // 옵션 그룹 추가
    sortedCategories.forEach(category => {
        // 옵션 그룹 생성
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        
        // 해당 카테고리의 항목 추가
        categorizedItems[category].forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.title;
            optgroup.appendChild(option);
        });
        
        gameSelect.appendChild(optgroup);
    });
    
    console.log('드롭다운 옵션 추가 완료, 현재 옵션 수:', gameSelect.options.length);
}

// 게임 시작 처리 함수
async function handleStartGame(mode) {
    console.log(`게임 시작 모드: ${mode}`);
    
    try {
        // 버튼 비활성화 (중복 클릭 방지)
        startSelectedBtn.disabled = true;
        startRandomBtn.disabled = true;
        
        let selectedItemId = null;
        
        // 게임 선택 모드에 따라 처리
        if (mode === 'selected') {
            // 선택된 게임 ID 가져오기
            selectedItemId = gameSelect.value;
            
            // 게임이 선택되지 않은 경우
            if (!selectedItemId) {
                alert('게임을 선택해주세요.');
                startSelectedBtn.disabled = false;
                startRandomBtn.disabled = false;
                return;
            }
            
            console.log('선택된 게임 ID:', selectedItemId);
        } else if (mode === 'random') {
            // 랜덤 게임 선택 (서버에서 처리됨)
            console.log('랜덤 게임 선택 (서버에서 처리)');
        } else {
            console.error('알 수 없는 게임 시작 모드:', mode);
            alert('잘못된 게임 시작 모드입니다.');
            startSelectedBtn.disabled = false;
            startRandomBtn.disabled = false;
            return;
        }
        
        // 게임 시작 API 호출
        console.log('게임 시작 요청 전송:', `${SERVER_URL}/api/start`);
        const response = await fetch(`${SERVER_URL}/api/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_id: selectedItemId
            })
        });
        
        console.log('게임 시작 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('게임 시작 응답 데이터:', data);
        
        if (!data.success && data.error) {
            throw new Error(data.error);
        }
        
        // 게임 데이터 추출
        const gameData = data.data || data;
        
        if (!gameData.game_id) {
            throw new Error('게임 ID가 없습니다.');
        }
        
        // 게임 정보 저장
        gameId = gameData.game_id;
        title = gameData.title || '알 수 없는 게임';
        currentTurn = 1;
        maxTurns = gameData.max_turns || 5;
        winCondition = gameData.win_condition || '알 수 없음';
        characterName = gameData.character_name || 'AI';
        gameEnded = false;
        
        // UI 업데이트
        const currentTurnEl = document.getElementById('current-turn');
        const maxTurnsEl = document.getElementById('max-turns');
        
        gameIdElement.textContent = `게임 ID: ${gameId}`;
        categoryElement.textContent = `카테고리: ${gameData.category || '일반'}`;
        titleElement.textContent = `시나리오: ${title}`;
        winConditionElement.textContent = `승리 조건: ${winCondition}`;
        
        if (currentTurnEl) currentTurnEl.textContent = currentTurn;
        if (maxTurnsEl) maxTurnsEl.textContent = maxTurns;
        
        // 캐릭터 정보 설정
        if (characterInfoElement) {
            if (gameData.character_setting) {
                characterInfoElement.innerHTML = `<strong>${characterName}</strong>: ${gameData.character_setting}`;
            } else {
                characterInfoElement.innerHTML = `<strong>${characterName}</strong>이(가) 당신의 대화 상대입니다.`;
            }
        }
        
        // 메시지 컨테이너 초기화
        messageContainer.innerHTML = '';
        
        // 시작 화면 숨기고 게임 화면 표시
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        // 환영 메시지 표시
        let welcomeMessage = gameData.welcome_message || `안녕하세요! 저는 ${characterName}입니다. 대화를 시작해 보세요.`;
        addMessage(characterName, welcomeMessage, 'ai-message');
        
        // 사용자 입력 필드 포커스
        userInput.focus();
        
    } catch (error) {
        console.error('게임 시작 오류:', error);
        alert(`게임을 시작하는 데 실패했습니다: ${error.message}`);
    } finally {
        // 버튼 재활성화
        startSelectedBtn.disabled = false;
        startRandomBtn.disabled = false;
    }
}

// 메시지 전송 처리 함수
async function handleSendMessage() {
    // 입력 필드에서 메시지 가져오기
    const message = userInput.value.trim();
    
    // 메시지가 비어있으면 처리하지 않음
    if (!message) {
        return;
    }
    
    try {
        // 인터페이스 업데이트
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;
        
        // 사용자 메시지 추가
        addMessage('나', message, 'user-message');
        
        // 게임이 이미 종료되었는지 확인
        if (gameEnded) {
            addMessage('시스템', '게임이 이미 종료되었습니다. 새 게임을 시작하세요.', 'system-message');
            userInput.disabled = false;
            sendButton.disabled = false;
            return;
        }
        
        // API 호출
        const response = await askQuestion(message);
        
        // AI 메시지 추가
        if (response.message) {
            addMessage(characterName, response.message, 'ai-message');
        } else if (response.response) {
            addMessage(characterName, response.response, 'ai-message');
        }
        
        // 턴 업데이트
        currentTurn = response.current_turn || currentTurn + 1;
        updateTurnIndicator(currentTurn, maxTurns);
        
        // 게임 승패 확인
        if (response.completed) {
            gameEnded = true;
            
            // 승리 메시지 추가
            if (response.victory) {
                addMessage('시스템', '축하합니다! 승리 조건을 달성했습니다! 🎉', 'system-message success-text');
            } else {
                addMessage('시스템', '게임이 종료되었습니다.', 'system-message');
            }
            
            // 게임 종료 컨트롤 표시
            showGameOverControls();
        }
        
        // 턴 제한 확인
        if (currentTurn > maxTurns && !gameEnded) {
            gameEnded = true;
            addMessage('시스템', `최대 턴 수(${maxTurns})에 도달했습니다. 게임이 종료되었습니다.`, 'system-message');
            showGameOverControls();
        }
        
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        addMessage('시스템', `오류가 발생했습니다: ${error.message}`, 'system-message error-text');
    } finally {
        // 인터페이스 업데이트
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// API로 질문 전송 함수
async function askQuestion(message) {
    console.log(`질문 전송: ${message}, 게임 ID: ${gameId}`);
    
    const response = await fetch(`${SERVER_URL}/api/ask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game_id: gameId,
            message: message
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류:', response.status, errorText);
        throw new Error(`API 오류: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API 응답:', data);
    
    // 오류 검사
    if (!data.success && data.error) {
        throw new Error(data.error);
    }
    
    return data.data || data;
}

// 턴 표시기 업데이트 함수
function updateTurnIndicator(current, max) {
    const currentTurnEl = document.getElementById('current-turn');
    const maxTurnsEl = document.getElementById('max-turns');
    
    if (currentTurnEl) currentTurnEl.textContent = current;
    if (maxTurnsEl) maxTurnsEl.textContent = max;
}

// 게임 종료 컨트롤 표시 함수
function showGameOverControls() {
    if (endGameButton) endGameButton.classList.add('hidden');
    if (newGameButton) newGameButton.classList.remove('hidden');
}

// 게임 종료 처리
async function handleEndGame() {
    try {
        // 사용자 확인
        const confirmed = confirm('정말로 게임을 종료하시겠습니까?');
        if (!confirmed) {
            return;
        }
        
        // 버튼 비활성화
        endGameButton.disabled = true;
        
        // 종료 API 호출 (선택 사항)
        try {
            console.log('게임 종료 요청 전송:', `${SERVER_URL}/api/end`);
            const response = await fetch(`${SERVER_URL}/api/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    game_id: gameId
                })
            });
            
            console.log('게임 종료 응답 상태:', response.status, response.statusText);
            
            if (!response.ok) {
                console.warn(`게임 종료 요청 실패: ${response.status}`);
            }
        } catch (apiError) {
            console.warn('게임 종료 API 호출 오류 (무시됨):', apiError);
        }
        
        // 로컬 게임 상태 업데이트
        gameEnded = true;
        
        // 안내 메시지 추가
        addMessage('시스템', '게임이 종료되었습니다.', 'system-message');
        
        // 게임 종료 컨트롤 표시
        showGameOverControls();
        
    } catch (error) {
        console.error('게임 종료 중 오류 발생:', error);
        alert(`게임 종료 중 오류가 발생했습니다: ${error.message}`);
    } finally {
        // 버튼 재활성화
        endGameButton.disabled = false;
    }
}

// 홈으로 돌아가기 함수
function handleBackToHome() {
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
    
    // 게임 항목 다시 로드
    fetchGameItems();
}

// 메시지 추가 함수
function addMessage(sender, text, className) {
    console.log(`메시지 추가: ${sender} - ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
    
    // 메시지 요소 생성
    const messageElement = document.createElement('div');
    messageElement.className = 'message ' + className;
    
    // 발신자 요소 추가
    const senderElement = document.createElement('div');
    senderElement.className = 'message-sender';
    senderElement.textContent = sender;
    messageElement.appendChild(senderElement);
    
    // 내용 요소 추가
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = text;
    messageElement.appendChild(contentElement);
    
    // 메시지 컨테이너에 추가
    messageContainer.appendChild(messageElement);
    
    // 스크롤을 최하단으로 이동
    scrollToBottom();
}

// 메시지 영역을 최하단으로 스크롤하는 함수
function scrollToBottom() {
    const messagesDiv = document.querySelector('.messages');
    if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
} 