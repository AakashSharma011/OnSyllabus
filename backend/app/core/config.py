from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    upstash_redis_url: str
    upstash_redis_token: str
    resend_api_key: str
    jwt_secret: str

    class Config:
        env_file = ".env"


settings = Settings()