"""
services/claude_client.py  —  Groq AI wrapper
Function is named call_claude() so no other files need to change.
Uses llama-3.3-70b-versatile — Groq's best free model.
"""

import os
from groq import Groq

DEFAULT_MODEL = "llama-3.3-70b-versatile"
DEFAULT_MAX_TOKENS = 2048


def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set. Check your .env file.")
    return Groq(api_key=api_key)


def call_claude(
    prompt: str,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    model: str = DEFAULT_MODEL,
    system: str = None,
) -> str:

    client = get_client()

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
    )

    if not response.choices:
        raise ValueError("Groq returned an empty response.")

    text = response.choices[0].message.content
    if not text:
        raise ValueError("Groq response had no content.")

    return text.strip()