import http.server,os
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        p=self.translate_path(self.path.split('?')[0])
        if not os.path.exists(p): self.path='/index.html'
        return super().do_GET()
http.server.test(H,port=8766)
