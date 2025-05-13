import json
import os
from http.server import BaseHTTPRequestHandler
from openai import OpenAI
from dotenv import load_dotenv

# 환경 변수 로드 (로컬 개발 환경용)
load_dotenv()

# 데이터 파일 경로
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data')

# 기본 응답 생성 함수
def create_response(success=True, data=None, message=None, error=None, status_code=200):
    """일관된 형식의 API 응답을 생성합니다."""
    response = {
        "success": success
    }
    
    if data is not None:
        response["data"] = data
        
    if message is not None:
        response["message"] = message
        
    if error is not None:
        response["error"] = error
    
    return response, status_code

# OpenAI 클라이언트 생성
def create_openai_client():
    # 여러 가능한 환경 변수 이름을 시도합니다
    possible_key_names = ['OPENAI_API_KEY', 'OPENAI_KEY', 'OPEN_AI_KEY', 'OPENAI']
    
    api_key = None
    for key_name in possible_key_names:
        api_key = os.environ.get(key_name)
        if api_key:
            break
    
    # 키가 없는 경우, 테스트 모드 API 클라이언트 반환
    if not api_key:
        print("⚠️ 경고: OpenAI API 키가 설정되지 않았습니다. 테스트 모드로 작동합니다.")
        # 테스트 모드에서는 더미 클라이언트 반환
        return MockOpenAIClient()
    
    return OpenAI(api_key=api_key)

# 테스트용 모의 OpenAI 클라이언트
class MockOpenAIClient:
    """API 키가 없을 때 사용할 테스트용 모의 클라이언트"""
    
    def __init__(self):
        self.chat = MockChatCompletion()
    
    class MockChatCompletion:
        def create(self, **kwargs):
            return {
                "choices": [
                    {
                        "message": {
                            "content": "이것은 테스트 응답입니다. 실제 API 키가 설정되지 않았습니다."
                        }
                    }
                ]
            }

# 게임 항목 로드
def load_game_items():
    try:
        with open(os.path.join(DATA_PATH, 'game_items.json'), 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # 기본 게임 항목 반환
        return [
            {
                "id": 1,
                "title": "플러팅 고수! 전화번호 따기",
                "category": "플러팅",
                "character_name": "윤지혜",
                "max_turns": 5,
                "win_condition": "상대방의 전화번호를 얻어낸다"
            },
            {
                "id": 2,
                "title": "파티에서 번호 교환하기",
                "category": "플러팅",
                "character_name": "김민준",
                "max_turns": 4,
                "win_condition": "상대방과 번호를 교환하고 다음 만남 약속을 잡는다"
            },
            {
                "id": 3,
                "title": "면접에서 목표 달성하기",
                "category": "비즈니스",
                "character_name": "이지연",
                "max_turns": 6,
                "win_condition": "면접관을 설득하고 일자리 제안받기"
            }
        ] 