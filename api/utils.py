import json
import os
from http.server import BaseHTTPRequestHandler
from openai import OpenAI
from dotenv import load_dotenv

# 환경 변수 로드
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
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다")
    
    return OpenAI(api_key=api_key)

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
            }
        ] 