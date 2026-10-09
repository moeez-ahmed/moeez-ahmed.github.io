"""
Local preview server for this portfolio.

    python serve.py        (or:  py serve.py)

Then open http://localhost:8000

Why not "python -m http.server"? It cannot serve parts of a file
(HTTP range requests), so browsers can't jump to a timestamp in a video
and every seek snaps back to 0:00. This server supports range requests,
just like GitHub Pages does.
"""
import os
import re
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    # Windows sometimes maps .js to text/plain, which breaks module scripts
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".json": "application/json",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        self._remaining = None
        path = self.translate_path(self.path)
        header = self.headers.get("Range")
        if not header or os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()

        size = os.path.getsize(path)
        match = re.match(r"bytes=(\d*)-(\d*)$", header.strip())
        if not match or (not match.group(1) and not match.group(2)):
            return super().send_head()
        if match.group(1):
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else size - 1
        else:  # "bytes=-500" means the last 500 bytes
            start = max(0, size - int(match.group(2)))
            end = size - 1
        end = min(end, size - 1)
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        f = open(path, "rb")
        f.seek(start)
        self._remaining = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self._remaining))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        if self._remaining is None:
            return super().copyfile(source, outputfile)
        left = self._remaining
        try:
            while left > 0:
                chunk = source.read(min(64 * 1024, left))
                if not chunk:
                    break
                outputfile.write(chunk)
                left -= len(chunk)
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            pass  # the browser cancelled the request (normal while seeking)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    url = f"http://localhost:{PORT}"
    try:
        server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError:
        print(f"Port {PORT} is busy. Try: python serve.py 8001")
        sys.exit(1)
    print(f"Portfolio running at {url}  (press Ctrl+C to stop)")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
