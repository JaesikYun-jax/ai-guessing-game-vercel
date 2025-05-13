import json
from http.server import BaseHTTPRequestHandler
from .utils import create_response, create_openai_client

def handler(request):
    # CORS 프리플라이트 요청 처리
    if request.method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        }
    
    # POST 요청이 아닌 경우 오류 반환
    if request.method != "POST":
        response, status_code = create_response(
            success=False,
            error="POST 요청만 지원됩니다",
            status_code=405
        )
        return {
            "statusCode": status_code,
            "body": json.dumps(response),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        }
    
    try:
        # 요청 데이터 파싱
        try:
            body = json.loads(request.get("body", "{}"))
        except:
            # JSON 파싱 실패 시 빈 객체로 처리
            body = {}
        
        # 필수 파라미터 확인
        game_id = body.get('game_id')
        message = body.get('message')
        
        if not game_id:
            raise ValueError("게임 ID가 필요합니다.")
        
        if not message:
            raise ValueError("메시지가 필요합니다.")
        
        # OpenAI 클라이언트 생성
        client = create_openai_client()
        
        # 완전 기본적인 대화 처리 (실제로는 더 복잡한 로직 필요)
        try:
            # 기본 프롬프트
            system_prompt = """
            당신은 AI 게임의 캐릭터입니다. 사용자의 질문에 친절하게 답변해 주세요.
            게임의 목표는 사용자가 승리 조건을 달성하도록 돕는 것입니다.
            """
            
            # OpenAI API로 응답 생성
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=300
            )
            
            # API 응답에서 텍스트 추출
            ai_response = response.choices[0].message.content
        except Exception as e:
            # OpenAI API 오류 시 기본 응답 제공
            ai_response = f"질문에 답변하려고 시도했지만, 응답을 생성하는 데 문제가 발생했습니다. 다시 시도해주세요."
        
        # 응답 데이터 생성
        response_data = {
            "game_id": game_id,
            "response": ai_response,
            "current_turn": 2,  # 예시: 실제로는 현재 턴 추적 필요
            "completed": False
        }
        
        # 응답 생성
        response, status_code = create_response(
            success=True,
            data=response_data
        )
        
        return {
            "statusCode": status_code,
            "body": json.dumps(response),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        }
        
    except Exception as e:
        response, status_code = create_response(
            success=False,
            error=str(e),
            status_code=500
        )
        
        return {
            "statusCode": status_code,
            "body": json.dumps(response),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        } 