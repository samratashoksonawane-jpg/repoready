import pytest
import httpx
from fastapi import HTTPException

from backend.main import validate_repository_response


@pytest.mark.parametrize(
    "github_status, expected_status, expected_detail",
    [
        (404, 404, "Repository not found or is private."),
        (403, 429, "GitHub API rate limit reached. Try again later."),
        (500, 502, "Unable to retrieve repository information."),
    ],
)
def test_repository_error_responses(
    github_status,
    expected_status,
    expected_detail,
):
    response = httpx.Response(status_code=github_status)

    with pytest.raises(HTTPException) as exc_info:
        validate_repository_response(response)

    assert exc_info.value.status_code == expected_status
    assert exc_info.value.detail == expected_detail


def test_successful_repository_response():
    response = httpx.Response(status_code=200)

    result = validate_repository_response(response)

    assert result is None