import json
from http.server import BaseHTTPRequestHandler
import importlib
import re

def route_request(path, request_method, request_body=None, headers=None):
    """
    URL 경로에 따라 적절한 핸들러로 라우팅합니다.
    """
    # URL 경로에서 리소스 이름 추출
    if path.startswith('/api/'):
        path_without_prefix = path[5:]  # '/api/' 제거
    else:
        path_without_prefix = path[1:] if path.startswith('/') else path
    
    # admin 엔드포인트 처리
    admin_pattern = re.compile(r'^admin/([^/]+)(?:/(.+))?$')
    admin_match = admin_pattern.match(path_without_prefix)
    
    try:
        if admin_match:
            # admin API 엔드포인트
            admin_resource = admin_match.group(1)  # admin/login -> login, admin/items -> items
            
            try:
                # 해당 리소스 모듈 임포트
                resource_module = importlib.import_module(f'.admin_{admin_resource}', package='api')
                
                # 요청 객체 생성
                request = {
                    'method': request_method,
                    'path': path,
                    'body': request_body,
                    'headers': headers or {}
                }
                
                # 핸들러 호출
                response = {}
                result = resource_module.handler(request, response)
                return result
            except ImportError as e:
                # 모듈을 찾을 수 없는 경우
                return {
                    'statusCode': 404,
                    'body': json.dumps({
                        'success': False,
                        'error': f'Admin 리소스를 찾을 수 없습니다: {admin_resource}',
                        'details': str(e)
                    }),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
        else:
            # 일반 API 엔드포인트
            # 빈 리소스는 기본 health로 처리
            if not path_without_prefix:
                resource = 'health'
            else:
                # 리소스 이름에 추가 경로가 있으면 첫 부분만 사용
                resource = path_without_prefix.split('/', 1)[0]
            
            try:
                # 해당 리소스 모듈 임포트
                resource_module = importlib.import_module(f'.{resource}', package='api')
                
                # 요청 객체 생성
                request = {
                    'method': request_method,
                    'path': path,
                    'body': request_body,
                    'headers': headers or {}
                }
                
                # 핸들러 호출
                response = {}
                result = resource_module.handler(request, response)
                return result
            except ImportError as e:
                # 모듈을 찾을 수 없는 경우
                return {
                    'statusCode': 404,
                    'body': json.dumps({
                        'success': False,
                        'error': f'리소스를 찾을 수 없습니다: {resource}',
                        'details': str(e)
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
        result = route_request(self.path, 'GET', headers=dict(self.headers))
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
        
        result = route_request(self.path, 'POST', request_body, headers=dict(self.headers))
        self.send_response(result.get('statusCode', 200))
        
        # 헤더 설정
        for header, value in result.get('headers', {}).items():
            self.send_header(header, value)
        self.end_headers()
        
        # 응답 본문 전송
        self.wfile.write(result.get('body', '').encode('utf-8'))
    
    def do_PUT(self):
        """PUT 요청 처리"""
        # 요청 본문 읽기
        content_length = int(self.headers.get('Content-Length', 0))
        request_body = self.rfile.read(content_length).decode('utf-8')
        
        result = route_request(self.path, 'PUT', request_body, headers=dict(self.headers))
        self.send_response(result.get('statusCode', 200))
        
        # 헤더 설정
        for header, value in result.get('headers', {}).items():
            self.send_header(header, value)
        self.end_headers()
        
        # 응답 본문 전송
        self.wfile.write(result.get('body', '').encode('utf-8'))
    
    def do_DELETE(self):
        """DELETE 요청 처리"""
        result = route_request(self.path, 'DELETE', headers=dict(self.headers))
        self.send_response(result.get('statusCode', 200))
        
        # 헤더 설정
        for header, value in result.get('headers', {}).items():
            self.send_header(header, value)
        self.end_headers()
        
        # 응답 본문 전송
        self.wfile.write(result.get('body', '').encode('utf-8'))
    
    def do_OPTIONS(self):
        """OPTIONS 요청 처리 (CORS 프리플라이트 요청)"""
        result = route_request(self.path, 'OPTIONS', headers=dict(self.headers))
        self.send_response(result.get('statusCode', 200))
        
        # 헤더 설정
        for header, value in result.get('headers', {}).items():
            self.send_header(header, value)
        self.end_headers()

# 서버리스 핸들러 함수
def handler(request, response):
    """Vercel 서버리스 함수 핸들러"""
    method = request.get('method', 'GET')
    path = request.get('path', '/')
    body = request.get('body')
    headers = request.get('headers', {})
    
    return route_request(path, method, body, headers) 