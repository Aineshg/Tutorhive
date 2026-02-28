from functools import lru_cache
from os import getenv


class Settings:
    def __init__(self) -> None:
        self.openai_api_key = getenv("OPENAI_API_KEY", "")
        self.openai_base_url = getenv("OPENAI_BASE_URL", "")
        self.default_model = getenv("DEFAULT_MODEL", "gpt-4.1-mini")
        self.app_env = getenv("APP_ENV", "development")


@lru_cache
def get_settings() -> Settings:
    return Settings()