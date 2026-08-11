import httpx 
from app.core.config import settings

BASE_URL = settings.UPSTASH_REDIS_REST_URL
HEADERS = {"Authorization": f"Bearer {settings.UPSTASH_REDIS_REST_TOKEN}"} 

def set_cache(key: str,value:str,expire_seconds:int=3600)-> None:
    httpx.post(f"{BASE_URL}/set/{key}/{value}?EX={expire_seconds}", headers=HEADERS)

def get_cache(key: str) -> str | None:
    resp = httpx.get(f"{BASE_URL}/get/{key}", headers=HEADERS)
    return resp.json().get("result")

def delete_cache(key: str) -> None:
    httpx.post(f"{BASE_URL}/del/{key}", headers=HEADERS)

