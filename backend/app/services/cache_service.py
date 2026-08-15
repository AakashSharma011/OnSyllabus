import httpx

from app.core.config import settings

BASE_URL = settings.UPSTASH_REDIS_REST_URL
HEADERS = {"Authorization": f"Bearer {settings.UPSTASH_REDIS_REST_TOKEN}"}


def _command(*args):
    resp = httpx.post(BASE_URL, headers=HEADERS, json=list(args))
    resp.raise_for_status()
    return resp.json().get("result")


def set_cache(key: str, value: str, expire_seconds: int = 3600) -> None:
    _command("SET", key, value, "EX", str(expire_seconds))


def get_cache(key: str) -> str | None:
    return _command("GET", key)


def delete_cache(key: str) -> None:
    _command("DEL", key)