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

// 서버 주소 설정 (Vercel 배포용 - API 경로는 상대 경로로 설정)
const SERVER_URL = '';  // 빈 문자열은 현재 도메인의 상대 경로를 의미합니다

// 페이지 로드 시 서버 상태 확인 및 게임 목록 가져오기
document.addEventListener('DOMContentLoaded', async () => {
    // 콘솔에 디버그 메시지 출력
    console.log('페이지 로드됨, 이벤트 리스너 설정 시작');
    console.log('서버 URL:', SERVER_URL || '(상대 경로)');
    
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
        console.log(`게임 시작 처리 중 (모드: ${mode})`);
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
            
            // 문자열을 숫자로 변환
            selectedItemId = parseInt(selectedItemId, 10);
            console.log('변환된 게임 ID(숫자):', selectedItemId);
        }
        
        console.log('서버에 게임 시작 요청 전송');
        const response = await fetch(`${SERVER_URL}/api/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                item_id: selectedItemId // 선택한 항목 ID (랜덤 모드인 경우 null)
            })
        });
        
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
        console.log('서버 응답 수신:', data);
        
        if (data.success) {
            const result = data.data;
            gameId = result.game_id;
            title = result.title;
            currentTurn = result.current_turn;
            maxTurns = result.max_turns;
            winCondition = result.win_condition;
            characterName = result.character_name || "AI"; // 캐릭터 이름 저장
            
            // UI 업데이트
            gameIdElement.textContent = `게임 ID: ${gameId}`;
            categoryElement.textContent = `카테고리: ${result.category}`;
            titleElement.textContent = `시나리오: ${result.title}`;
            winConditionElement.textContent = `승리 조건: ${result.win_condition}`;
            
            // 캐릭터 설정 업데이트 (이름 포함)
            let characterInfo = result.character_setting || "";
            if (characterName && characterName !== "AI") {
                characterInfo = `<strong>${characterName}</strong>과의 대화입니다. ${characterInfo}`;
            }
            characterInfoElement.innerHTML = characterInfo;
            
            updateTurnIndicator(currentTurn, maxTurns);
            
            // 시작 화면 숨김, 게임 화면 표시
            startScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            
            // 시스템 메시지 추가
            addMessage('시스템', '게임이 시작되었습니다!', 'system-message');
            addMessage(characterName, result.welcome_message, 'ai-message');
            
            // 게임 상태 초기화
            gameEnded = false;
            
            console.log('게임이 성공적으로 시작됨');
        } else {
            throw new Error(data.error || '게임 시작 실패');
        }
    } catch (error) {
        console.error('게임 시작 실패:', error);
        
        // 게임 시작은 실패했지만, 서버는 연결됐을 수 있으므로 재확인
        try {
            // 빠른 상태 확인 요청
            const healthCheck = await fetch(`${SERVER_URL}/api/health`);
            
            if (healthCheck.ok) {
                // 서버는 살아있지만 게임 시작에 실패한 경우
                serverStatus.textContent = '✅ 서버 연결 성공';
                serverStatus.classList.add('success-text');
                serverStatus.classList.remove('error-text');
                addMessage('시스템', `게임 시작 실패: ${error.message}`, 'system-message error-text');
            } else {
                // 서버 연결 자체에 문제가 있는 경우
                serverStatus.textContent = '❌ 서버 연결 실패';
                serverStatus.classList.add('error-text');
                serverStatus.classList.remove('success-text');
                
                // 오프라인 모드 진입
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
                
                // 게임 상태 초기화
                gameEnded = false;
            }
        } catch (healthError) {
            // 건강 확인 요청 자체가 실패한 경우
            serverStatus.textContent = '❌ 서버 연결 실패';
            serverStatus.classList.add('error-text');
            serverStatus.classList.remove('success-text');
            addMessage('시스템', `게임 시작 실패: 서버에 연결할 수 없습니다`, 'system-message error-text');
        }
    } finally {
        startSelectedBtn.disabled = false;
        startRandomBtn.disabled = false;
    }
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
        
        // API 호출
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
        console.error('메시지 전송 중 오류:', error);
        addMessage('시스템', `오류: ${error.message}`, 'system-message error-text');
        
        // 입력 필드 재활성화
        userInput.disabled = false;
        sendButton.disabled = false;
    }
}

// AI에게 질문 요청
async function askQuestion(message) {
    try {
        const response = await fetch(`${SERVER_URL}/api/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                game_id: gameId,
                message: message 
            })
        });
        
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
        
        if (data.success) {
            const result = data.data;
            
            // AI 응답 표시 (캐릭터 이름 사용)
            const aiSender = result.character_name || characterName || 'AI';
            addMessage(aiSender, result.response, 'ai-message');
            
            // 턴 업데이트
            if (result.current_turn) {
                currentTurn = result.current_turn;
                updateTurnIndicator(currentTurn, maxTurns);
            }
            
            // 게임 종료 확인
            if (result.completed) {
                gameEnded = true;
                
                // 승패 메시지 표시
                if (result.win) {
                    addMessage('시스템', '축하합니다! 승리 조건을 달성했습니다!', 'system-message success-text');
                } else {
                    addMessage('시스템', '게임 오버! 턴 제한에 도달했습니다.', 'system-message error-text');
                }
                
                // 게임 종료 컨트롤 표시
                showGameOverControls();
            }
        } else {
            throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
        }
    } catch (error) {
        console.error('질문 요청 중 오류:', error);
        throw error;
    }
}

// 턴 표시기 업데이트
function updateTurnIndicator(current, max) {
    try {
        document.getElementById('current-turn').textContent = current;
        document.getElementById('max-turns').textContent = max;
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
        
        const response = await fetch(`${SERVER_URL}/api/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_id: gameId
            })
        });
        
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
        addMessage('시스템', `오류: ${error.message}`, 'system-message error-text');
    } finally {
        endGameButton.disabled = false;
    }
}

// 첫 화면으로 돌아가기
function handleBackToHome() {
    // 게임이 진행 중이면 서버에 종료 요청
    if (gameId && !gameEnded) {
        fetch(`${SERVER_URL}/api/end`, {
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
    const messages = document.querySelector('.messages');
    messages.scrollTop = messages.scrollHeight;
} 