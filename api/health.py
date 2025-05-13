from http.server import BaseHTTPRequestHandler
from datetime import datetime
import json
from .utils import create_response, create_openai_client

def handler(request):
    try:
        # OpenAI 클라이언트 상태 확인
        client_status = "unknown"
        try:
            client = create_openai_client()
            client_status = "healthy"
        except Exception as e:
            client_status = f"error: {str(e)}"
        
        # 상태 데이터 생성
        health_data = {
            "status": "ok",
            "server_time": datetime.now().isoformat(),
            "openai_client": client_status,
            "environment": "vercel"
        }
        
        response, status_code = create_response(
            success=True,
            data=health_data,
            message="서버가 정상 작동 중입니다."
        )
        
        return {
            "statusCode": status_code,
            "body": json.dumps(response),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET"
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
                "Access-Control-Allow-Methods": "GET"
            }
        } 