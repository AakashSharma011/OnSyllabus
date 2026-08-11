from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    RESEND_API_KEY: str
    JWT_SECRET: str

    class Config:
        env_file = ".env"


settings = Settings()