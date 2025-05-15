// 전역 변수
let isAuthenticated = false;
let currentSection = 'items';
let itemsData = [];
let gamesData = [];
let currentPage = 1;
const itemsPerPage = 10;
let promptsData = {}; // 프롬프트 데이터 추가

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showLoginPanel();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    console.log('이벤트 리스너 설정 시작...');
    
    // 로그인 폼 제출 처리
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('로그인 폼 요소 찾음');
        loginForm.addEventListener('submit', function(e) {
            console.log('로그인 폼 제출됨');
            e.preventDefault();
            handleLogin(e);
        });
    } else {
        console.error('로그인 폼 요소를 찾을 수 없음');
    }
    
    // 네비게이션 버튼 - 새로운 데이터 속성으로 업데이트
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // 로그아웃 버튼
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    
    // 아이템 추가 버튼
    document.getElementById('add-item-button').addEventListener('click', () => {
        showItemModal();
    });
    
    // 힌트 추가 버튼
    document.getElementById('add-hint-button').addEventListener('click', () => {
        addHintInput();
    });
    
    // 아이템 저장 버튼
    document.getElementById('save-item-button').addEventListener('click', saveItem);
    
    // 아이템 삭제 확인 버튼
    document.getElementById('confirm-delete-button').addEventListener('click', deleteItem);
    
    // 프롬프트 저장 버튼
    document.getElementById('save-prompts-button').addEventListener('click', savePrompts);
    
    // 모델 변경 시 추천 토큰 수 업데이트
    const modelSelect = document.getElementById('ai-model');
    if (modelSelect) {
        modelSelect.addEventListener('change', updateRecommendedTokens);
    }

    // 모달 닫기 버튼에 이벤트 리스너 추가
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            const modalElement = document.getElementById(modalId);
            const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        });
    });

    // 모달 외부 클릭시 닫히는 기능 확인
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                const bootstrapModal = bootstrap.Modal.getInstance(this);
                if (bootstrapModal) {
                    bootstrapModal.hide();
                }
            }
        });
    });
}

/**
 * 선택된 모델에 따라 추천 토큰 수를 업데이트합니다.
 */
function updateRecommendedTokens() {
    const modelSelect = document.getElementById('ai-model');
    const maxTokensInput = document.getElementById('ai-max-tokens');
    
    // 현재 입력값 저장
    const currentValue = maxTokensInput.value.trim();
    let recommendedTokens = 150; // 기본값
    
    // 모델에 따른 추천 토큰 수 설정
    switch (modelSelect.value) {
        case 'gpt-3.5-turbo':
            recommendedTokens = 150;
            break;
        case 'gpt-4o-mini':
            recommendedTokens = 200;
            break;
        case 'gpt-4o':
            recommendedTokens = 250;
            break;
        case 'gpt-4':
        case 'gpt-4-turbo':
        case 'gpt-4-1106-preview':
            recommendedTokens = 300;
            break;
        default:
            recommendedTokens = 150;
    }
    
    // 값이 비어있거나 기본값(150)인 경우에만 추천값으로 업데이트
    if (!currentValue || currentValue === '150') {
        maxTokensInput.value = recommendedTokens;
    }
    
    // placeholder 업데이트
    maxTokensInput.placeholder = `추천: ${recommendedTokens}`;
}

// 로그인 처리
async function handleLogin(e) {
    console.log('로그인 처리 시작...');
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    
    const username = document.getElementById('admin-id').value;
    const password = document.getElementById('admin-password').value;
    
    console.log(`사용자 입력 - 아이디: ${username}, 비밀번호: ***`);
    
    // 입력값 유효성 검증 추가
    if (!username || !password) {
        console.error('로그인 실패: 빈 아이디 또는 비밀번호');
        document.getElementById('login-message').textContent = '아이디와 비밀번호를 모두 입력해주세요.';
        return;
    }
    
    try {
        // 오프라인 모드 로그인 처리 (서버가 없거나 응답하지 않는 경우)
        if (username === 'admin' && password === 'admin123') {
            console.log('기본 관리자 계정으로 로그인 성공!');
            isAuthenticated = true;
            document.getElementById('login-message').textContent = '오프라인 모드에서 로그인되었습니다.';
            
            // 메인 패널로 전환
            setTimeout(() => {
                showMainPanel();
                loadDummyData(); // 더미 데이터 로드
            }, 1000);
            return;
        }
        
        console.log('로그인 API 요청 시작...');
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password })
        });
        
        console.log(`API 응답 상태: ${response.status}`);
        const data = await response.json();
        console.log('API 응답 데이터:', data);
        
        if (response.ok && data.success) {
            console.log('로그인 성공!');
            isAuthenticated = true;
            showMainPanel();
            loadItems();
            loadGames();
            loadStats();
            loadPrompts(); // 프롬프트 데이터 로드 추가
        } else {
            console.error('로그인 실패:', data.error || '알 수 없는 오류');
            document.getElementById('login-message').textContent = data.error || '로그인에 실패하였습니다.';
            
            // 서버가 없는 경우 오프라인 모드로 로그인 시도 제안
            document.getElementById('login-message').innerHTML = 
                '서버 연결이 불가능합니다.<br>오프라인 모드로 접속하려면 아이디 "admin", 비밀번호 "admin123"를 사용하세요.';
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        document.getElementById('login-message').innerHTML = 
            '서버 연결 오류가 발생했습니다.<br>오프라인 모드로 접속하려면 아이디 "admin", 비밀번호 "admin123"를 사용하세요.';
    }
}

// 로그아웃 처리
function handleLogout() {
    isAuthenticated = false;
    showLoginPanel();
    // 세션 정리
    fetch('/api/admin/logout', { method: 'POST' })
        .catch(error => console.error('로그아웃 오류:', error));
}

// 로그인 패널 표시
function showLoginPanel() {
    console.log('로그인 패널 표시');
    document.getElementById('login-form').style.display = 'block';
    document.querySelector('.dashboard').style.display = 'none';
}

// 메인 패널 표시
function showMainPanel() {
    console.log('관리자 패널 표시');
    document.getElementById('login-form').style.display = 'none';
    document.querySelector('.dashboard').style.display = 'block';
    showSection('items-section'); // 기본 섹션 표시
}

// 특정 섹션 표시
function showSection(sectionId) {
    console.log(`섹션 표시: ${sectionId}`);
    
    // 모든 섹션 숨기기
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // 선택한 섹션 표시
    document.getElementById(sectionId).classList.add('active');
    
    // 네비게이션 버튼 활성화
    document.querySelectorAll('.nav-button').forEach(button => {
        if (button.getAttribute('data-section') === sectionId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // 섹션별 데이터 로드
    if (sectionId === 'items-section' && itemsData.length === 0) {
        loadItems();
    } else if (sectionId === 'sessions-section' && Object.keys(gamesData).length === 0) {
        loadGames();
    } else if (sectionId === 'stats-section') {
        loadStats();
    } else if (sectionId === 'prompts-section' && Object.keys(promptsData).length === 0) {
        loadPrompts();
    }
}

// 아이템 데이터 로드
async function loadItems() {
    try {
        const response = await fetch('/api/admin/items');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                itemsData = data.data || [];
                renderItems();
            } else {
                console.error('아이템 로드 실패:', data.error);
            }
        } else {
            console.error('아이템 로드 실패');
        }
    } catch (error) {
        console.error('아이템 로드 오류:', error);
    }
}

// 게임 데이터 로드
async function loadGames() {
    try {
        const response = await fetch('/api/admin/games');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                gamesData = data.data || {};
                renderGames();
            } else {
                console.error('게임 로드 실패:', data.error);
            }
        } else {
            console.error('게임 로드 실패');
        }
    } catch (error) {
        console.error('게임 로드 오류:', error);
    }
}

// 통계 데이터 로드
async function loadStats() {
    try {
        const response = await fetch('/api/debug');
        if (response.ok) {
            const stats = await response.json();
            renderStats(stats);
        } else {
            console.error('통계 로드 실패');
        }
    } catch (error) {
        console.error('통계 로드 오류:', error);
    }
}

// 프롬프트 데이터 로드
async function loadPrompts() {
    try {
        const response = await fetch('/api/admin/prompts');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                promptsData = data.data || {};
                renderPrompts();
            } else {
                console.error('프롬프트 로드 실패:', data.error);
            }
        } else {
            console.error('프롬프트 로드 실패');
        }
    } catch (error) {
        console.error('프롬프트 로드 오류:', error);
    }
}

// 프롬프트 데이터 렌더링
function renderPrompts() {
    console.log('프롬프트 데이터 렌더링:', promptsData);
    
    // 기본 프롬프트 필드 채우기
    document.getElementById('system-prompt').value = promptsData.system_prompt_template || '';
    document.getElementById('welcome-message').value = promptsData.welcome_message || '';
    document.getElementById('correct-answer-message').value = promptsData.correct_answer_message || '';
    document.getElementById('wrong-answer-message').value = promptsData.wrong_answer_message || '';
    document.getElementById('game-end-message').value = promptsData.game_end_message || '';
    
    // 카테고리별 환영 메시지 렌더링
    const categoryMessagesContainer = document.getElementById('category-messages-container');
    categoryMessagesContainer.innerHTML = '';
    
    // 기존 프롬프트에서 카테고리별 환영 메시지 찾기
    const categoryMessages = {};
    Object.keys(promptsData).forEach(key => {
        if (key.startsWith('welcome_message_')) {
            const category = key.replace('welcome_message_', '');
            categoryMessages[category] = promptsData[key];
        }
    });
    
    // 카테고리별 환영 메시지 UI 생성
    Object.keys(categoryMessages).forEach(category => {
        addCategoryMessageField(category, categoryMessages[category]);
    });
    
    // AI 설정
    const aiConfig = promptsData.ai_config || {};
    
    // 모델 설정
    const modelSelect = document.getElementById('ai-model');
    const savedModel = aiConfig.model || 'gpt-4o-mini';
    
    // 모델 드롭다운에서 저장된 모델 선택
    let modelFound = false;
    for (let i = 0; i < modelSelect.options.length; i++) {
        if (modelSelect.options[i].value === savedModel) {
            modelSelect.selectedIndex = i;
            modelFound = true;
            break;
        }
    }
    
    // 저장된 모델이 목록에 없는 경우, 새 옵션 추가
    if (!modelFound && savedModel) {
        const option = document.createElement('option');
        option.value = savedModel;
        option.textContent = savedModel;
        modelSelect.appendChild(option);
        modelSelect.value = savedModel;
    }
    
    // 모델이 없는 경우 기본값 설정
    if (!savedModel) {
        modelSelect.value = 'gpt-4o-mini';
    }
    
    // 토큰 및 온도 설정
    document.getElementById('ai-max-tokens').value = aiConfig.max_tokens || 200;
    
    const tempElement = document.getElementById('ai-temperature');
    const tempValue = aiConfig.temperature !== undefined ? aiConfig.temperature : 0.7;
    tempElement.value = tempValue;
    document.getElementById('temp-value').textContent = tempValue;
    
    // 모델 변경에 따른 토큰 추천값 업데이트
    updateTokenRecommendation();
}

// 카테고리별 환영 메시지 필드 추가
function addCategoryMessageField(category, message = '') {
    const container = document.getElementById('category-messages-container');
    
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'category-message-group';
    categoryGroup.dataset.category = category;
    
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = `"${category}" 카테고리 환영 메시지:`;
    
    const textarea = document.createElement('textarea');
    textarea.className = 'form-control category-message';
    textarea.rows = 3;
    textarea.value = message;
    textarea.dataset.category = category;
    
    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-danger btn-sm';
    removeButton.textContent = '삭제';
    removeButton.addEventListener('click', () => {
        if (confirm(`"${category}" 카테고리의 환영 메시지를 삭제하시겠습니까?`)) {
            container.removeChild(categoryGroup);
        }
    });
    
    categoryGroup.appendChild(categoryTitle);
    categoryGroup.appendChild(textarea);
    categoryGroup.appendChild(removeButton);
    
    container.appendChild(categoryGroup);
}

// 새 카테고리 추가
document.getElementById('add-category-btn').addEventListener('click', () => {
    const newCategoryInput = document.getElementById('new-category');
    const category = newCategoryInput.value.trim().toLowerCase();
    
    if (!category) {
        alert('카테고리 이름을 입력해주세요.');
        return;
    }
    
    // 이미 존재하는 카테고리 확인
    const existingCategory = document.querySelector(`.category-message-group[data-category="${category}"]`);
    if (existingCategory) {
        alert(`"${category}" 카테고리는 이미 존재합니다.`);
        return;
    }
    
    // 새 카테고리 추가
    addCategoryMessageField(category);
    
    // 입력 필드 초기화
    newCategoryInput.value = '';
});

// 프롬프트 저장
document.getElementById('save-prompts-btn').addEventListener('click', () => {
    const statusElement = document.getElementById('prompts-status');
    statusElement.textContent = '저장 중...';
    statusElement.className = 'status-message info';
    
    const promptData = {
        system_prompt_template: document.getElementById('system-prompt').value,
        welcome_message: document.getElementById('welcome-message').value,
        correct_answer_message: document.getElementById('correct-answer-message').value,
        wrong_answer_message: document.getElementById('wrong-answer-message').value,
        game_end_message: document.getElementById('game-end-message').value,
        ai_config: {
            model: document.getElementById('ai-model').value,
            max_tokens: parseInt(document.getElementById('ai-max-tokens').value, 10),
            temperature: parseFloat(document.getElementById('ai-temperature').value)
        },
        error_messages: currentPrompts.error_messages || {} // 기존 에러 메시지 유지
    };
    
    // 카테고리별 환영 메시지 추가
    const categoryMessages = document.querySelectorAll('.category-message');
    categoryMessages.forEach(textarea => {
        const category = textarea.dataset.category;
        const message = textarea.value.trim();
        
        if (category && message) {
            promptData[`welcome_message_${category}`] = message;
        }
    });
    
    fetch(`${SERVER_URL}/api/admin/prompts`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(promptData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            statusElement.textContent = '프롬프트가 성공적으로 저장되었습니다.';
            statusElement.className = 'status-message success';
            currentPrompts = promptData;
        } else {
            throw new Error(data.error || '저장 실패');
        }
    })
    .catch(error => {
        statusElement.textContent = `오류: ${error.message}`;
        statusElement.className = 'status-message error';
    });
});

// 모델에 따른 토큰 추천값 업데이트
function updateTokenRecommendation() {
    const model = document.getElementById('ai-model').value;
    const recommendationElement = document.getElementById('token-recommendation');
    
    let recommendation;
    if (model.includes('gpt-4')) {
        if (model.includes('mini')) {
            recommendation = '최대 128k 컨텍스트, 권장: 200-300';
        } else {
            recommendation = '최대 128k 컨텍스트, 권장: 300-500';
        }
    } else {
        recommendation = '최대 16k 컨텍스트, 권장: 150-250';
    }
    
    recommendationElement.textContent = recommendation;
}

// 모델 변경 시 토큰 추천값 업데이트
document.getElementById('ai-model').addEventListener('change', updateTokenRecommendation);

// Temperature 슬라이더 값 표시 업데이트
document.getElementById('ai-temperature').addEventListener('input', function() {
    document.getElementById('temp-value').textContent = this.value;
});

// 아이템 렌더링
function renderItems() {
    const tbody = document.getElementById('items-list');
    tbody.innerHTML = '';
    
    if (itemsData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center">표시할 항목이 없습니다.</td>';
        tbody.appendChild(tr);
    } else {
        itemsData.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'item-row';
            tr.innerHTML = `
                <td>${item.id || ''}</td>
                <td>${item.category || ''}</td>
                <td>${item.title || item.answer || ''}</td>
                <td>${item.max_turns || 10}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-icon edit-item" data-id="${item.id}" title="시나리오 편집">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-icon delete-item" data-id="${item.id}" title="시나리오 삭제">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // 편집/삭제 버튼 이벤트 바인딩
        document.querySelectorAll('.edit-item').forEach(button => {
            button.addEventListener('click', () => showItemPromptModal(button.dataset.id));
        });
        
        document.querySelectorAll('.delete-item').forEach(button => {
            button.addEventListener('click', () => showDeleteConfirmation(button.dataset.id));
        });
    }
}

// 게임 렌더링
function renderGames() {
    const tbody = document.getElementById('sessions-list');
    tbody.innerHTML = '';
    
    if (Object.keys(gamesData).length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">진행 중인 게임이 없습니다.</td>';
        tbody.appendChild(tr);
    } else {
        Object.entries(gamesData).forEach(([gameId, game]) => {
            const tr = document.createElement('tr');
            
            const creationTime = game.creation_time ? new Date(game.creation_time).toLocaleString() : '정보 없음';
            
            tr.innerHTML = `
                <td>${gameId}</td>
                <td>${game.target?.answer || '정보 없음'}</td>
                <td>${game.target?.category || '정보 없음'}</td>
                <td>${game.questions_asked || 0}</td>
                <td>${game.completed ? '<span class="badge bg-success">완료</span>' : '<span class="badge bg-primary">진행중</span>'}</td>
                <td>${creationTime}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-icon end-game" data-id="${gameId}" ${game.completed ? 'disabled' : ''}>
                        <i class="bi bi-x-circle"></i> 종료
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // 게임 종료 버튼 이벤트 바인딩
        document.querySelectorAll('.end-game').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', () => handleEndGame(button.dataset.id));
            }
        });
    }
}

// 통계 렌더링
function renderStats(stats) {
    // 일반 통계 채우기
    const statsList = document.getElementById('general-stats');
    statsList.innerHTML = '';
    
    // 앱 정보
    if (stats.app_info) {
        Object.entries(stats.app_info).forEach(([key, value]) => {
            addStatItem(statsList, formatStatName(key), value);
        });
    }
    
    // 핸들러 상태
    if (stats.handler_state) {
        Object.entries(stats.handler_state).forEach(([key, value]) => {
            if (typeof value !== 'object') {
                addStatItem(statsList, formatStatName(key), value);
            }
        });
    }
    
    // 디버그 정보 채우기
    const debugInfo = document.getElementById('debug-info');
    debugInfo.textContent = JSON.stringify(stats, null, 2);
}

// 통계 항목 추가
function addStatItem(container, name, value) {
    const item = document.createElement('li');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.innerHTML = `
        <span>${name}</span>
        <span class="badge bg-primary rounded-pill">${value}</span>
    `;
    container.appendChild(item);
}

// 통계 이름 포맷팅
function formatStatName(name) {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// 게임 종료 처리
async function handleEndGame(gameId) {
    if (!confirm(`정말 게임 ID ${gameId}를 종료하시겠습니까?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/games/${gameId}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            loadGames(); // 목록 새로고침
        } else {
            alert('게임 종료에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('게임 종료 오류:', error);
        alert('게임 종료 중 오류가 발생했습니다.');
    }
}

// 아이템 모달 표시
async function showItemModal(itemId = null) {
    const modalTitle = document.getElementById('item-modal-title');
    const itemIdField = document.getElementById('item-id');
    const answerField = document.getElementById('item-answer');
    const categoryField = document.getElementById('item-category');
    const hintsContainer = document.getElementById('hints-container');
    
    // 모달 초기화
    modalTitle.textContent = itemId ? '항목 편집' : '새 항목 추가';
    itemIdField.value = itemId || '';
    answerField.value = '';
    categoryField.value = '';
    hintsContainer.innerHTML = '';
    
    if (itemId) {
        try {
            // 아이템 데이터 로드
            const response = await fetch(`/api/admin/items/${itemId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const item = data.data;
                    answerField.value = item.answer || '';
                    categoryField.value = item.category || '';
                    
                    // 힌트 필드 생성
                    if (Array.isArray(item.hints)) {
                        item.hints.forEach(hint => {
                            addHintInput(hint);
                        });
                    }
                } else {
                    console.error('아이템 로드 실패:', data.error);
                }
            } else {
                console.error('아이템 로드 실패');
            }
        } catch (error) {
            console.error('아이템 로드 오류:', error);
        }
    } else {
        // 새 항목 추가 시 기본 힌트 필드 하나 추가
        addHintInput();
    }
    
    // 모달 표시
    const itemModal = new bootstrap.Modal(document.getElementById('item-modal'));
    itemModal.show();
}

// 힌트 입력 필드 추가
function addHintInput(hintValue = '') {
    const hintsContainer = document.getElementById('hints-container');
    
    const hintDiv = document.createElement('div');
    hintDiv.className = 'input-group mb-2';
    hintDiv.innerHTML = `
        <input type="text" class="form-control hint-input" value="${hintValue}" placeholder="힌트를 입력하세요">
        <button class="btn btn-outline-danger remove-hint" type="button">
            <i class="bi bi-x"></i>
        </button>
    `;
    
    hintsContainer.appendChild(hintDiv);
    
    // 삭제 버튼 이벤트 바인딩
    hintDiv.querySelector('.remove-hint').addEventListener('click', () => {
        hintsContainer.removeChild(hintDiv);
    });
}

// 아이템 저장 처리
async function saveItem() {
    // 필드 값 가져오기
    const itemId = document.getElementById('item-id').value;
    const answer = document.getElementById('item-answer').value;
    const category = document.getElementById('item-category').value;
    
    // 힌트 목록 수집
    const hints = [];
    document.querySelectorAll('.hint-input').forEach(input => {
        if (input.value.trim()) {
            hints.push(input.value.trim());
        }
    });
    
    // 유효성 검사
    if (!answer) {
        alert('정답을 입력해주세요.');
        return;
    }
    
    if (!category) {
        alert('카테고리를 입력해주세요.');
        return;
    }
    
    if (hints.length < 1) {
        alert('적어도 하나의 힌트를 입력해주세요.');
        return;
    }
    
    // 아이템 데이터 준비
    const itemData = {
        answer,
        category,
        hints
    };
    
    try {
        let response;
        
        if (itemId) {
            // 기존 아이템 업데이트
            response = await fetch(`/api/admin/items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
        } else {
            // 새 아이템 추가
            response = await fetch('/api/admin/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
        }
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // 모달 닫기
            const itemModal = bootstrap.Modal.getInstance(document.getElementById('item-modal'));
            itemModal.hide();
            
            // 목록 새로고침
            loadItems();
        } else {
            alert('항목 저장에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('항목 저장 오류:', error);
        alert('항목 저장 중 오류가 발생했습니다.');
    }
}

// 삭제 확인 모달 표시
function showDeleteConfirmation(itemId) {
    document.getElementById('delete-item-id').value = itemId;
    
    // 모달 표시
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-modal'));
    deleteModal.show();
}

// 아이템 삭제 처리
async function deleteItem() {
    const itemId = document.getElementById('delete-item-id').value;
    
    try {
        const response = await fetch(`/api/admin/items/${itemId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // 모달 닫기
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('delete-modal'));
            deleteModal.hide();
            
            // 목록 새로고침
            loadItems();
        } else {
            alert('항목 삭제에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('항목 삭제 오류:', error);
        alert('항목 삭제 중 오류가 발생했습니다.');
    }
}

// 모든 모달 숨기기
function hideModals() {
    console.log('모든 모달 숨기기 실행');
    document.querySelectorAll('.modal').forEach(modal => {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
        
        // 백드롭 및 관련 스타일 제거
        document.body.classList.remove('modal-open');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
    });
}

// 자동 스크롤 함수 - 메시지 창에 추가
function scrollToBottom(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

// 게임 세션 테이블에 항목 추가 (기존 함수 수정)
function addGameSessionRow(session) {
    // ... existing code ...
    
    // 표에 행 추가 후 자동 스크롤
    if (tbody.appendChild(row)) {
        scrollToBottom('game-sessions-table');
    }
}

// 아이템별 프롬프트 모달 표시
async function showItemPromptModal(itemId) {
    if (!itemId) {
        console.error('아이템 ID가 필요합니다.');
        return;
    }

    const item = itemsData.find(item => item.id == itemId);
    if (!item) {
        console.error('아이템을 찾을 수 없습니다:', itemId);
        return;
    }

    // 모달 제목과 아이템 정보 설정
    document.getElementById('item-prompt-modal-title').textContent = `"${item.title || item.answer}" 시나리오 편집`;
    document.getElementById('prompt-item-id').value = itemId;
    
    // 시나리오 정보 설정
    document.getElementById('prompt-item-title-edit').value = item.title || '';
    document.getElementById('prompt-item-category-edit').value = item.category || '플러팅';
    document.getElementById('prompt-item-turns-edit').value = item.max_turns || 10;
    document.getElementById('prompt-item-character-name-edit').value = item.character_name || '';

    try {
        // 아이템별 프롬프트 데이터 로드
        const response = await fetch(`/api/admin/items/${itemId}/prompt`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const promptData = data.data || {};
                
                // 프롬프트 데이터 채우기
                document.getElementById('item-system-prompt').value = promptData.system_prompt || '';
                document.getElementById('item-welcome-message').value = promptData.welcome_message || '';
                
                // AI 설정
                const aiConfig = promptData.ai_config || {};
                
                // 기본 모델 설정 (GPT-4o mini)
                const defaultModel = 'gpt-4o-mini';
                const modelSelect = document.getElementById('item-ai-model');
                const savedModel = aiConfig.model || defaultModel;
                
                // 모델 드롭다운에서 저장된 모델 선택
                let modelFound = false;
                for (let i = 0; i < modelSelect.options.length; i++) {
                    if (modelSelect.options[i].value === savedModel) {
                        modelSelect.selectedIndex = i;
                        modelFound = true;
                        break;
                    }
                }
                
                // 저장된 모델이 목록에 없는 경우, 기본 모델 선택
                if (!modelFound) {
                    // gpt-4o-mini 옵션 찾기
                    for (let i = 0; i < modelSelect.options.length; i++) {
                        if (modelSelect.options[i].value === defaultModel) {
                            modelSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                
                // 토큰 및 온도 설정
                document.getElementById('item-ai-max-tokens').value = aiConfig.max_tokens || 200;
                document.getElementById('item-ai-temperature').value = aiConfig.temperature !== undefined ? aiConfig.temperature : 0.7;
                
            } else {
                console.error('프롬프트 로드 실패:', data.error);
            }
        } else {
            console.error('프롬프트 로드 실패');
        }
    } catch (error) {
        console.error('프롬프트 로드 오류:', error);
    }

    // 프롬프트 저장 버튼 이벤트 바인딩
    const saveButton = document.getElementById('save-item-prompt-button');
    saveButton.onclick = saveItemPrompt;

    // 모달 표시
    const promptModal = new bootstrap.Modal(document.getElementById('item-prompt-modal'));
    promptModal.show();
}

// 아이템별 프롬프트 저장
async function saveItemPrompt() {
    const itemId = document.getElementById('prompt-item-id').value;
    if (!itemId) {
        alert('유효한 아이템 ID가 없습니다.');
        return;
    }

    // 시나리오 정보 수집
    const itemData = {
        title: document.getElementById('prompt-item-title-edit').value,
        category: document.getElementById('prompt-item-category-edit').value,
        max_turns: parseInt(document.getElementById('prompt-item-turns-edit').value, 10) || 5,
        character_name: document.getElementById('prompt-item-character-name-edit').value
    };

    // 프롬프트 데이터 수집
    const promptData = {
        system_prompt: document.getElementById('item-system-prompt').value,
        welcome_message: document.getElementById('item-welcome-message').value,
        ai_config: {
            model: document.getElementById('item-ai-model').value,
            max_tokens: parseInt(document.getElementById('item-ai-max-tokens').value, 10) || 200,
            temperature: parseFloat(document.getElementById('item-ai-temperature').value) || 0.7
        }
    };

    try {
        // 먼저 아이템 정보 업데이트
        const itemResponse = await fetch(`/api/admin/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: itemData.title,
                category: itemData.category,
                max_turns: itemData.max_turns,
                character_name: itemData.character_name,
                win_condition: itemsData.find(item => item.id == itemId).win_condition,
                lose_condition: itemsData.find(item => item.id == itemId).lose_condition,
                character_setting: itemsData.find(item => item.id == itemId).character_setting,
                difficulty: itemsData.find(item => item.id == itemId).difficulty || '보통'
            })
        });

        if (!itemResponse.ok) {
            const itemData = await itemResponse.json();
            throw new Error(itemData.error || '시나리오 정보 업데이트 실패');
        }

        // 그 다음 프롬프트 정보 업데이트
        const promptResponse = await fetch(`/api/admin/items/${itemId}/prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(promptData)
        });

        const data = await promptResponse.json();
        if (promptResponse.ok && data.success) {
            // 모달 닫기
            bootstrap.Modal.getInstance(document.getElementById('item-prompt-modal')).hide();
            alert('시나리오 정보와 프롬프트가 성공적으로 저장되었습니다.');
            // 목록 새로고침
            loadItems();
        } else {
            alert('프롬프트 저장 실패: ' + (data.error || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('시나리오 및 프롬프트 저장 오류:', error);
        alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
}

// 오프라인 모드용 더미 데이터 로드
function loadDummyData() {
    console.log('오프라인 모드용 더미 데이터 로드');
    
    // 더미 게임 아이템 데이터
    itemsData = [
        { id: 1, category: "인물", title: "신비한 인물 찾기", max_turns: 10, character_name: "알 수 없는 인물", win_condition: "인물 이름을 맞추세요" },
        { id: 2, category: "대화", title: "플러팅 마스터", max_turns: 5, character_name: "이유나", win_condition: "상대방을 설득하세요" }
    ];
    
    // 더미 게임 세션 데이터
    gamesData = [
        { id: "game_12345", item_id: 1, started_at: new Date().toISOString(), completed: false, current_turn: 3, max_turns: 10 },
        { id: "game_54321", item_id: 2, started_at: new Date(Date.now() - 86400000).toISOString(), completed: true, current_turn: 5, max_turns: 5, victory: true }
    ];
    
    // 더미 프롬프트 데이터
    promptsData = {
        system_prompt: "당신은 게임 마스터로서 '{title}' 게임을 진행합니다. 카테고리: {category}. 승리 조건: {win_condition}. 턴 제한: {max_turns}.",
        welcome_message: "안녕하세요! {title} 게임에 오신 것을 환영합니다.",
        correct_answer_message: "축하합니다! 승리 조건({win_condition})을 달성했습니다!",
        wrong_answer_message: "아쉽게도 이번에는 실패했습니다. 다시 도전해보세요!",
        game_end_message: "게임이 종료되었습니다. 플레이해주셔서 감사합니다!",
        error_messages: {
            game_not_found: "게임을 찾을 수 없습니다.",
            invalid_input: "잘못된 입력입니다."
        },
        ai_settings: {
            model: "gpt-3.5-turbo",
            max_tokens: 150,
            temperature: 0.7
        },
        category_messages: {
            "인물": "신비한 인물을 맞춰보세요!",
            "대화": "상대방과 대화를 나눠보세요!"
        }
    };
    
    // 데이터 렌더링
    renderItems();
    renderGames();
    renderStats({
        total_games: 152,
        completed_games: 98,
        victory_rate: 64.29,
        average_turns: 7.3,
        most_played_category: "인물",
        most_played_item: "신비한 인물 찾기"
    });
    renderPrompts();
    
    console.log('더미 데이터 로드 및 렌더링 완료');
} 