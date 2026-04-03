#!/usr/bin/env python3
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
INDEX_PATH = ROOT / 'website' / 'index.html'
NEWS_RE = re.compile(r'(<script id="managed-news-data" type="application/json">)(.*?)(</script>)', re.DOTALL)
EVENTS_RE = re.compile(r'(<script id="managed-events-data" type="application/json">)(.*?)(</script>)', re.DOTALL)


def load_content():
    html = INDEX_PATH.read_text(encoding='utf-8')
    news_match = NEWS_RE.search(html)
    events_match = EVENTS_RE.search(html)
    if not news_match or not events_match:
        raise ValueError('Managed content blocks were not found in website/index.html')
    news = json.loads(news_match.group(2).strip() or '[]')
    events = json.loads(events_match.group(2).strip() or '[]')
    return {'news': news, 'events': events}


def save_content(payload):
    html = INDEX_PATH.read_text(encoding='utf-8')
    news_json = json.dumps(payload.get('news', []), indent=2, ensure_ascii=False)
    events_json = json.dumps(payload.get('events', []), indent=2, ensure_ascii=False)
    html, news_count = NEWS_RE.subn(r'\1' + news_json + r'\3', html, count=1)
    html, events_count = EVENTS_RE.subn(r'\1' + events_json + r'\3', html, count=1)
    if news_count != 1 or events_count != 1:
        raise ValueError('Could not update one or more managed content blocks in website/index.html')
    INDEX_PATH.write_text(html, encoding='utf-8')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/':
            self.send_response(302)
            self.send_header('Location', '/admin-dashboard/admin-dashboard.html')
            self.end_headers()
            return
        if parsed.path == '/api/content':
            try:
                payload = load_content()
                self.end_json(200, {'ok': True, **payload})
            except Exception as exc:
                self.end_json(500, {'ok': False, 'error': str(exc)})
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != '/api/content':
            self.end_json(404, {'ok': False, 'error': 'Not found'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            raw = self.rfile.read(length).decode('utf-8')
            payload = json.loads(raw or '{}')
            if not isinstance(payload.get('news', []), list) or not isinstance(payload.get('events', []), list):
                raise ValueError('news and events must both be arrays')
            save_content(payload)
            self.end_json(200, {'ok': True, 'message': 'website/index.html updated successfully'})
        except Exception as exc:
            self.end_json(400, {'ok': False, 'error': str(exc)})


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8000), Handler)
    print('MUST admin server running on http://127.0.0.1:8000')
    print('Dashboard: http://127.0.0.1:8000/admin-dashboard/admin-dashboard.html')
    print('Website:   http://127.0.0.1:8000/website/index.html')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('Server stopped.')
