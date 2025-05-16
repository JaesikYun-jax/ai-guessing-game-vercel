// 전역 변수
let gameId = null;
let gameEnded = false;
let currentTurn = 1;
let maxTurns = 0;
let title = "";
let winCondition = "";
let characterName = "AI"; // 캐릭터 이름
let gameItems = []; // 서버에서 받아온 게임 항목 목록

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

// 서버 주소 설정
const SERVER_URL = window.API_SERVER || 'https://flask-vercel-ebon.vercel.app';

// 페이지 로드 시 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', async () => {
    // 콘솔에 디버그 메시지 출력
    console.log('페이지 로드됨, 이벤트 리스너 설정 시작');
    console.log('서버 URL:', SERVER_URL);
    
    // 이벤트 리스너 등록
    console.log('버튼 이벤트 리스너 추가 시작');
    
    // 게임 시작 기능은 index.html의 인라인 스크립트에서 처리하므로 여기서는 다른 버튼들만 처리
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
    if (window.debug) {
        window.debug('AI에게 질문 전송: ' + message);
        window.debug(`API 요청: POST ${SERVER_URL}/api/ask, 게임 ID: ${gameId}`);
    } else {
        console.log('AI에게 질문 전송:', message);
    }
    
    try {
        // 요청 페이로드 준비
        const payload = {
            game_id: gameId,
            message: message
        };
        
        if (window.debug) {
            window.debug(`요청 데이터: ${JSON.stringify(payload)}`);
        }
        
        // API 요청
        const response = await fetch(`${SERVER_URL}/api/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (window.debug) {
            window.debug(`응답 상태: ${response.status} ${response.statusText}`);
        } else {
            console.log('질문 응답 상태:', response.status, response.statusText);
        }
        
        if (!response.ok) {
            // 응답이 JSON 형식인지 확인
            let errorMessage = '서버 응답 오류';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || `오류 코드: ${response.status}`;
                
                if (window.debug) {
                    window.debug(`오류 응답 데이터: ${JSON.stringify(errorData)}`, 'error');
                }
                
                // 게임 ID가 유효하지 않은 경우
                if (errorData.code === 'INVALID_GAME_ID') {
                    if (window.debug) {
                        window.debug('게임 세션 만료됨: INVALID_GAME_ID', 'warn');
                    }
                    
                    // 자동으로 새 게임 시작 확인
                    if (confirm('게임 세션이 만료되었습니다. 새 게임을 시작하시겠습니까?')) {
                        handleBackToHome();
                    }
                }
            } catch (e) {
                errorMessage = `서버 응답 오류: ${response.status}`;
                if (window.debug) {
                    window.debug(`응답을 JSON으로 파싱할 수 없음: ${e.message}`, 'error');
                }
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (window.debug) {
            window.debug(`API 응답 데이터(길이): ${JSON.stringify(data).length}바이트`);
            window.debug(`AI 응답: ${data.response}`);
            if (window.updateDebugLastResponse) {
                window.updateDebugLastResponse(data);
            }
            if (window.updateDebugSession) {
                window.updateDebugSession({
                    game_id: gameId,
                    current_turn: data.current_turn,
                    max_turns: data.max_turns,
                    completed: data.completed
                });
            }
        } else {
            console.log('AI 응답 데이터:', data);
        }
        
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
                if (window.debug) {
                    window.debug('게임 승리! 승리 조건 달성', 'success');
                }
                addMessage('system', '🎉 축하합니다! 승리 조건을 달성했습니다!', 'victory-message');
            } else {
                if (window.debug) {
                    window.debug('게임 패배: 턴 제한 초과 또는 패배 조건 충족', 'warn');
                }
                addMessage('system', '😥 아쉽게도 패배했습니다. 다시 도전해보세요!', 'defeat-message');
            }
            
            // 게임 종료 UI 업데이트
            showGameOverControls();
        }
    } catch (error) {
        if (window.debug) {
            window.debug(`AI 응답 가져오기 실패: ${error.message}`, 'error');
        } else {
            console.error('AI 응답 가져오기 실패:', error);
        }
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

// 인라인 스크립트에서 호출할 수 있도록 함수 노출
window.startGameWithData = function(gameData) {
    // 디버깅용 로그 추가
    console.log('[DEBUG] startGameWithData 함수 호출됨', gameData);
    console.log('[DEBUG] window.debug 존재:', typeof window.debug !== 'undefined');
    
    if (window.debug) {
        window.debug(`게임 시작: ${gameData.title} (ID: ${gameData.game_id})`);
        window.debug(`승리 조건: ${gameData.win_condition}, 턴 제한: ${gameData.max_turns}`);
    }
    
    // 게임 정보 저장
    gameId = gameData.game_id;
    title = gameData.title;
    maxTurns = gameData.max_turns;
    currentTurn = gameData.current_turn;
    winCondition = gameData.win_condition;
    characterName = gameData.character_name;
    gameEnded = false;
    
    // UI 업데이트
    gameIdElement.textContent = `게임 ID: ${gameId}`;
    categoryElement.textContent = `카테고리: ${gameData.category}`;
    titleElement.textContent = `시나리오: ${title}`;
    winConditionElement.textContent = `승리 조건: ${winCondition}`;
    updateTurnIndicator(currentTurn, maxTurns);
    
    // 캐릭터 정보 표시
    if (gameData.character_setting) {
        characterInfoElement.textContent = `${gameData.character_name}: ${gameData.character_setting}`;
    }
    
    // 메시지 영역 초기화
    messageContainer.innerHTML = '';
    
    // 환영 메시지 추가
    if (gameData.welcome_message) {
        addMessage('system', gameData.welcome_message, 'system-message');
    }
    
    // 게임 화면 표시 및 시작 화면 숨기기
    startScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // 입력란에 포커스
    userInput.focus();
    
    // 버튼 상태 복원
    startSelectedBtn.disabled = false; 
    startRandomBtn.disabled = false;
    
    // 디버깅용 추가 로그
    console.log('[DEBUG] DOM 요소 상태:', {
        gameIdElement: !!gameIdElement,
        categoryElement: !!categoryElement,
        titleElement: !!titleElement,
        winConditionElement: !!winConditionElement,
        messageContainer: !!messageContainer,
        startScreen: !!startScreen,
        gameContainer: !!gameContainer
    });
    
    if (window.debug) {
        window.debug('게임이 성공적으로 시작되었습니다', 'success');
    } else {
        console.log('게임이 성공적으로 시작되었습니다:', gameId);
    }
}; 