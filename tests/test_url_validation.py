import pytest
from fastapi import HTTPException

from backend.main import parse_github_url


@pytest.mark.parametrize(
    "url, expected",
    [
        (
            "https://github.com/fastapi/fastapi",
            ("fastapi", "fastapi"),
        ),
        (
            "https://www.github.com/fastapi/fastapi",
            ("fastapi", "fastapi"),
        ),
        (
            "https://github.com/fastapi/fastapi.git",
            ("fastapi", "fastapi"),
        ),
    ],
)
def test_valid_github_urls(url, expected):
    assert parse_github_url(url) == expected


@pytest.mark.parametrize(
    "url",
    [
        "https://gitlab.com/owner/repo",
        "https://github.com/owner",
        "https://github.com/owner/repo/issues",
        "https://github.com/owner name/repo",
        "https://github.com/owner/repo name",
    ],
)
def test_invalid_github_urls(url):
    with pytest.raises(HTTPException) as exc_info:
        parse_github_url(url)

    assert exc_info.value.status_code == 400