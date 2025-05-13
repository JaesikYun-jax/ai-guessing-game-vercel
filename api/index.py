import json
from http.server import BaseHTTPRequestHandler
import importlib

def route_request(path, request_method, request_body=None):
    """
    URL 경로에 따라 적절한 핸들러로 요청을 라우팅합니다.
    """
    # URL 경로에서 리소스 이름 추출
    # 예: /api/health -> health, /api/games -> games
    if path.startswith('/api/'):
        resource = path[5:]  # '/api/' 제거
    else:
        resource = path[1:] if path.startswith('/') else path
    
    # 빈 리소스는 기본 health로 처리
    if not resource:
        resource = 'health'
    
    # 리소스 이름에 추가 경로가 있으면 제거
    # 예: 'games/123' -> 'games'
    if '/' in resource:
        resource = resource.split('/', 1)[0]
    
    try:
        # 해당 리소스 모듈 임포트
        resource_module = importlib.import_module(f'.{resource}', package='api')
        
        # 요청 객체 생성
        request = {
            'method': request_method,
            'path': path,
            'body': request_body
        }
        
        # 핸들러 호출
        response = {}
        result = resource_module.handler(request, response)
        return result
    except ImportError:
        # 모듈을 찾을 수 없는 경우
        return {
            'statusCode': 404,
            'body': json.dumps({
                'success': False,
                'error': f'리소스를 찾을 수 없습니다: {resource}'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except Exception as e:
        # 기타 오류
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': f'서버 오류: {str(e)}'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """GET 요청 처리"""
        result = route_request(self.path, 'GET')
        self.send_response(result.get('statusCode', 200))
        
        # 헤더 설정
        for header, value in result.get('headers', {}).items():
            self.send_header(header, value)
        self.end_headers()
        
        # 응답 본문 전송
        self.wfile.write(result.get('body', '').encode('utf-8'))
    
    def do_POST(self):
        """POST 요청 처리"""
        # 요청 본문 읽기
        content_length = int(self.headers.get('Content-Length', 0))
        request_body = self.rfile.read(content_length).decode('utf-8')
        
        result = route_request(self.path, 'POST', request_body)
        self.send_response(result.get('statusCode', 200))
        
        # 헤더 설정
        for header, value in result.get('headers', {}).items():
            self.send_header(header, value)
        self.end_headers()
        
        # 응답 본문 전송
        self.wfile.write(result.get('body', '').encode('utf-8'))
    
    def do_OPTIONS(self):
        """OPTIONS 요청 처리 (CORS 프리플라이트 요청)"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# 서버리스 핸들러 함수
def handler(request, response):
    """Vercel 서버리스 함수 핸들러"""
    method = request.get('method', 'GET')
    path = request.get('path', '/')
    body = request.get('body')
    
    return route_request(path, method, body) 