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
import socket
import sys
import threading

puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
directorio = sys.argv[2] if len(sys.argv) > 2 else "."


class HandlerSinCache(http.server.SimpleHTTPRequestHandler):
    # HTTP/1.1 = conexiones reutilizadas. Con HTTP/1.0 (el de fábrica) el
    # navegador abre y cierra una conexión por archivo, y con ~7 archivos
    # por página eso se nota.
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=directorio, **kwargs)

    def address_string(self):
        # De fábrica esto hace una búsqueda DNS inversa del cliente solo
        # para escribirlo en el log. En Windows esa consulta se iba a
        # ~300ms POR PETICIÓN: con varios archivos por página eran
        # segundos de espera en local. Devolvemos la IP tal cual.
        return self.client_address[0]

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()


class ServidorIPv6(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6


if __name__ == "__main__":
    # Se escucha en IPv4 (127.0.0.1) Y en IPv6 (::1), las dos loopback.
    #
    # Por qué: en Windows el navegador resuelve "localhost" primero como
    # IPv6 (::1). Escuchando solo en 127.0.0.1, ese primer intento fallaba
    # y el navegador tardaba ~300ms en reintentar por IPv4 — medido:
    # conexión TCP 306ms para un servidor que respondía en 1ms. Ese era
    # todo el "va lento" en local, y se llevaba por delante cada carga de
    # página.
    #
    # Se atan las dos loopback por separado (en vez de "::" a secas) para
    # NO exponer el servidor de desarrollo al resto de la red.
    servidores = []
    try:
        s6 = ServidorIPv6(("::1", puerto), HandlerSinCache)
        servidores.append(s6)
        threading.Thread(target=s6.serve_forever, daemon=True).start()
    except OSError as e:
        print(f"Aviso: no se pudo escuchar en IPv6 (::1): {e}")

    s4 = http.server.ThreadingHTTPServer(("127.0.0.1", puerto), HandlerSinCache)
    servidores.append(s4)
    familias = "IPv4 + IPv6" if len(servidores) == 2 else "solo IPv4"
    print(f"Sirviendo {directorio} en http://localhost:{puerto} ({familias}, sin caché)")
    try:
        s4.serve_forever()
    except KeyboardInterrupt:
        for s in servidores:
            s.shutdown()
