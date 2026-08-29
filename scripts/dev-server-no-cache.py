"""Servidor local para desarrollo, sin caché.

Igual que "python -m http.server", pero con Cache-Control: no-store en cada
respuesta: evita que el navegador del panel de vista previa sirva versiones
antiguas de script.js/style.css mientras se está iterando en local.

Uso: python scripts/dev-server-no-cache.py <puerto> <directorio>
"""
import http.server
import sys

puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
directorio = sys.argv[2] if len(sys.argv) > 2 else "."


class HandlerSinCache(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=directorio, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", puerto), HandlerSinCache)
    print(f"Sirviendo {directorio} en http://127.0.0.1:{puerto} (sin caché)")
    servidor.serve_forever()
