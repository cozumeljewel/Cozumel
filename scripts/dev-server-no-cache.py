"""Servidor local para desarrollo, sin caché "vieja" pero rápido.

Igual que "python -m http.server", pero con Cache-Control: no-cache en cada
respuesta: el navegador SIEMPRE revalida con el servidor antes de usar un
archivo (nunca sirve una versión vieja sin preguntar), pero si el archivo
no cambió desde la última vez, el servidor responde 304 sin volver a
mandar el contenido — mucho más rápido que "no-store" (que obliga a
redescargar TODO en cada navegación, JS/CSS/imágenes incluidos, y hacía
que la carga se sintiera lenta). SimpleHTTPRequestHandler ya sabe
responder 304 solo por soportar If-Modified-Since de fábrica.

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
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", puerto), HandlerSinCache)
    print(f"Sirviendo {directorio} en http://127.0.0.1:{puerto} (sin caché)")
    servidor.serve_forever()
