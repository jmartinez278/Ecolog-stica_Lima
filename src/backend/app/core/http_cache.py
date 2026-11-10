"""Validación condicional de respuestas GET de la API mediante ETag (Green IT, Inspección 04).

Si el contenido no cambió, el servidor responde ``304 Not Modified`` sin cuerpo y el
navegador reutiliza su copia. ``Cache-Control: private, no-cache`` obliga a revalidar
siempre, de modo que nunca se muestran datos operativos desactualizados.
"""
import hashlib

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

CACHE_CONTROL = "private, no-cache"


def etag_for(body: bytes) -> str:
    return 'W/"' + hashlib.sha256(body).hexdigest()[:32] + '"'


def matches(if_none_match: str, etag: str) -> bool:
    candidates = {value.strip() for value in if_none_match.split(",")}
    return "*" in candidates or etag in candidates or etag.removeprefix("W/") in candidates


class ETagMiddleware:
    def __init__(self, app: ASGIApp, prefix: str = "/api/") -> None:
        self.app = app
        self.prefix = prefix

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] != "GET" or not scope["path"].startswith(self.prefix):
            await self.app(scope, receive, send)
            return
        request_headers = {k.decode("latin-1"): v.decode("latin-1") for k, v in scope["headers"]}
        start: Message | None = None
        chunks: list[bytes] = []

        async def buffer(message: Message) -> None:
            nonlocal start
            if message["type"] == "http.response.start":
                start = message
                return
            chunks.append(message.get("body", b""))
            if message.get("more_body"):
                return
            assert start is not None
            body = b"".join(chunks)
            if start["status"] != 200:
                await send(start)
                await send({"type": "http.response.body", "body": body})
                return
            etag = etag_for(body)
            headers = MutableHeaders(scope=start)
            headers["ETag"] = etag
            headers["Cache-Control"] = CACHE_CONTROL
            headers.append("Vary", "Authorization")
            if matches(request_headers.get("if-none-match", ""), etag):
                del headers["content-length"]
                if "content-type" in headers:
                    del headers["content-type"]
                await send({**start, "status": 304})
                await send({"type": "http.response.body", "body": b""})
                return
            await send(start)
            await send({"type": "http.response.body", "body": body})

        await self.app(scope, receive, buffer)
