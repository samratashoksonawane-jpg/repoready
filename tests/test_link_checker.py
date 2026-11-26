
import pytest
import httpx

from backend.main import check_documentation_links


@pytest.mark.asyncio
async def test_link_checker_detects_working_link():
    mock_transport = httpx.MockTransport(
        lambda request: httpx.Response(200)
    )

    async with httpx.AsyncClient(
        transport=mock_transport
    ) as client:
        result = await check_documentation_links(
            client,
            "Visit https://example.com"
        )

    assert result["total_links"] == 1
    assert result["checked_links"] == 1
    assert result["working"] == 1
    assert result["broken"] == 0


@pytest.mark.asyncio
async def test_link_checker_detects_broken_link():
    mock_transport = httpx.MockTransport(
        lambda request: httpx.Response(404)
    )

    async with httpx.AsyncClient(
        transport=mock_transport
    ) as client:
        result = await check_documentation_links(
            client,
            "Visit https://example.com"
        )

    assert result["total_links"] == 1
    assert result["broken"] == 1


@pytest.mark.asyncio
async def test_link_checker_detects_inaccessible_link():
    mock_transport = httpx.MockTransport(
        lambda request: httpx.Response(403)
    )

    async with httpx.AsyncClient(
        transport=mock_transport
    ) as client:
        result = await check_documentation_links(
            client,
            "Visit https://example.com"
        )

    assert result["inaccessible"] == 1


@pytest.mark.asyncio
async def test_link_checker_removes_duplicate_links():
    mock_transport = httpx.MockTransport(
        lambda request: httpx.Response(200)
    )

    async with httpx.AsyncClient(
        transport=mock_transport
    ) as client:
        result = await check_documentation_links(
            client,
            "https://example.com https://example.com"
        )

    assert result["total_links"] == 1
    assert result["checked_links"] == 1

@pytest.mark.asyncio
async def test_link_checker_detects_gone_link():
    mock_transport = httpx.MockTransport(
        lambda request: httpx.Response(410)
    )

    async with httpx.AsyncClient(
        transport=mock_transport
    ) as client:
        result = await check_documentation_links(
            client,
            "Visit https://example.com"
        )

    assert result["broken"] == 1


@pytest.mark.asyncio
async def test_link_checker_handles_network_timeout():
    def mock_request(request):
        raise httpx.TimeoutException("Request timed out")

    mock_transport = httpx.MockTransport(mock_request)

    async with httpx.AsyncClient(
        transport=mock_transport
    ) as client:
        result = await check_documentation_links(
            client,
            "Visit https://example.com"
        )

    assert result["inaccessible"] == 1