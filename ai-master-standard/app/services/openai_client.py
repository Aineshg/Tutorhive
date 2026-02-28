from openai import OpenAI

from app.config import get_settings


def build_client() -> OpenAI:
    settings = get_settings()
    kwargs = {}
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    return OpenAI(api_key=settings.openai_api_key, **kwargs)