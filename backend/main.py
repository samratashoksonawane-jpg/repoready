
import re
import base64
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl

app = FastAPI(
    title="RepoReady API",
    description="Analyze GitHub repositories and improve contributor readiness.",
    version="0.3.0"
)

GITHUB_API = "https://api.github.com"


class AnalyzeRequest(BaseModel):
    repository_url: HttpUrl


def parse_github_url(url: str):
    parsed = urlparse(str(url))

    if parsed.hostname not in ("github.com", "www.github.com"):
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid GitHub repository URL."
        )

    parts = [
        part for part in parsed.path.strip("/").split("/") if part
    ]

    if len(parts) != 2:
        raise HTTPException(
            status_code=400,
            detail="URL must look like https://github.com/owner/repository"
        )

    owner, repo = parts
    repo = repo.removesuffix(".git")

    if not re.fullmatch(r"[A-Za-z0-9_.-]+", owner):
        raise HTTPException(status_code=400, detail="Invalid owner name.")

    if not re.fullmatch(r"[A-Za-z0-9_.-]+", repo):
        raise HTTPException(status_code=400, detail="Invalid repository name.")

    return owner, repo


def analyze_readme(content: str):
    text = content.lower()

    checks = {
        "project_description": False,
        "installation": False,
        "usage": False,
        "features": False,
        "technologies": False,
    }

    lines = [
        line.strip() for line in content.splitlines()
        if line.strip()
    ]

    # Check whether the README contains meaningful introductory text.
    if len(lines) >= 2:
        introductory_text = " ".join(
            line for line in lines[1:6]
            if not line.startswith("#")
        )
        checks["project_description"] = len(introductory_text) >= 40

    # Detect common documentation sections and keywords.
    checks["installation"] = bool(
        re.search(
            r"#{1,6}\s*(installation|getting started|setup|install)\b",
            text
        )
    )

    checks["usage"] = bool(
        re.search(
            r"#{1,6}\s*(usage|how to use|examples|quick start)\b",
            text
        )
    )

    checks["features"] = bool(
        re.search(r"#{1,6}\s*features\b", text)
    )

    checks["technologies"] = bool(
        re.search(
            r"#{1,6}\s*(technologies|tech stack|built with)\b",
            text
        )
    )

    weights = {
        "project_description": 5,
        "installation": 6,
        "usage": 6,
        "features": 5,
        "technologies": 4,
    }

    score = sum(
        weight
        for check, weight in weights.items()
        if checks[check]
    )

    recommendations = {
        "project_description": "Add a clear introduction explaining what your project does.",
        "installation": "Add installation instructions so developers can set up your project.",
        "usage": "Include usage examples showing how developers can use your project.",
        "features": "Add a Features section describing the main capabilities.",
        "technologies": "Document the technologies and tools used in your project."
    }

    suggestions = [
        recommendations[check]
        for check, present in checks.items()
        if not present
    ]

    return {
        "score": score,
        "maximum_score": 26,
        "checks": checks,
        "recommendations": suggestions,
    }


async def check_documentation_links(client, content: str):
    # Extract HTTP and HTTPS links from documentation.
    raw_links = re.findall(
        r"https?://[^\s<>)\"'\]]+",
        content
    )

    # Remove duplicate links and trailing punctuation.
    links = list(dict.fromkeys(
        link.rstrip(".,;:!?")
        for link in raw_links
    ))

    results = []

    # Limit requests to avoid excessive GitHub README link checks.
    for link in links[:50]:
        try:
            response = await client.head(
                link,
                follow_redirects=True,
                timeout=8.0
            )

            # Some websites do not support HEAD requests.
            if response.status_code in (405, 501):
                response = await client.get(
                    link,
                    follow_redirects=True,
                    timeout=8.0
                )

            status = response.status_code

            if status < 400:
              result = "working"
            elif status in (404, 410):
              result = "broken"
            else:
              result = "inaccessible"

            results.append({
                "url": link,
                "status_code": status,
                "result": result
            })

        except httpx.RequestError:
            results.append({
                "url": link,
                "status_code": None,
                "result": "inaccessible"
            })

    return {
        "total_links": len(links),
        "checked_links": len(results),
        "working": sum(
            item["result"] == "working" for item in results
        ),
        "broken": sum(
            item["result"] == "broken" for item in results
        ),
        "inaccessible": sum(
            item["result"] == "inaccessible" for item in results
        ),
        "results": results,
        "note": "Only the first 50 external HTTP/HTTPS links are checked."
    }


@app.get("/")
def home():
    return {
        "message": "Welcome to RepoReady API!",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

def get_file_recommendations():
    return {
        "contributing": "Add a CONTRIBUTING.md with contribution instructions.",
        "license": "Add an open-source LICENSE file.",
        "code_of_conduct": "Add a CODE_OF_CONDUCT.md.",
        "issue_template": "Add GitHub issue templates to guide contributors.",
        "description": "Add a clear description to your GitHub repository.",
        "topics": "Add relevant GitHub topics to improve discoverability.",
        "pull_request_template": "Add a PULL_REQUEST_TEMPLATE.md to guide contributors.",
    }
def calculate_readiness_score(readme_score, file_checks):
    weights = {
        "contributing": 14,
        "license": 14,
        "code_of_conduct": 11,
        "issue_template": 11,
        "description": 8,
        "topics": 8,
        "pull_request_template": 8,
    }

    readme_score = max(0, min(readme_score, 26))

    score = readme_score + sum(
        weight
        for check, weight in weights.items()
        if file_checks.get(check, False)
    )

    return min(score, 100)

def detect_file_checks(repository, readme_content, contents, github_dir_contents):
    file_names = {
        item.get("name", "").lower()
        for item in contents + github_dir_contents
        if isinstance(item, dict)
    }

    return {
        "description": bool(repository.get("description")),
        "topics": bool(repository.get("topics")),
        "readme": bool(readme_content),
        "contributing": any(
            name.startswith("contributing") for name in file_names
        ),
        "license": any(
            name.startswith("license") for name in file_names
        ),
        "code_of_conduct": any(
            name.startswith("code_of_conduct") for name in file_names
        ),
        "issue_template": any(
            "issue_template" in name for name in file_names
        ),
        "pull_request_template": any(
            "pull_request_template" in name for name in file_names
        ),
    }

@app.post("/analyze")
async def analyze_repository(request: AnalyzeRequest):
    owner, repo = parse_github_url(str(request.repository_url))

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "RepoReady"
    }

    async with httpx.AsyncClient(timeout=20.0) as client:

        # Fetch repository metadata.
        repo_response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}",
            headers=headers
        )

        if repo_response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Repository not found or is private."
            )

        if repo_response.status_code == 403:
            raise HTTPException(
                status_code=429,
                detail="GitHub API rate limit reached. Try again later."
            )

        if repo_response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Unable to retrieve repository information."
            )

        repository = repo_response.json()

        # Fetch files from repository root.
        contents_response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/contents",
            headers=headers
        )

        if contents_response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Unable to retrieve repository files."
            )

        contents = contents_response.json()

        if not isinstance(contents, list):
            raise HTTPException(
                status_code=422,
                detail="Unable to inspect repository root files."
            )

        # Fetch files from the .github directory.
        github_dir_response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/contents/.github",
            headers=headers
        )

        github_dir_contents = []

        if github_dir_response.status_code == 200:
            github_dir_contents = github_dir_response.json()

            if not isinstance(github_dir_contents, list):
                github_dir_contents = []

        # Fetch README content.
        readme_response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/readme",
            headers=headers
        )

        readme_content = ""

        if readme_response.status_code == 200:
            readme_data = readme_response.json()

            if readme_data.get("encoding") == "base64":
                encoded_content = readme_data.get("content", "")
                readme_content = base64.b64decode(
                    encoded_content
                ).decode("utf-8", errors="replace")

        link_analysis = await check_documentation_links(
            client,
            readme_content
        )

     # Detect repository files and contributor resources.
        file_checks = detect_file_checks(
            repository,
            readme_content,
            contents,
            github_dir_contents
        )
    

    # Analyze README quality.
    readme_analysis = analyze_readme(readme_content)

    # Calculate overall contributor-readiness score.
    weights = {
        "readme_quality": 26,
        "contributing": 14,
        "license": 14,
        "code_of_conduct": 11,
        "issue_template": 11,
        "description": 8,
        "topics": 8,
        "pull_request_template": 8,
    }
    
    score = calculate_readiness_score(
        readme_analysis["score"],
        file_checks
        )
    recommendations = list(readme_analysis["recommendations"])

    file_recommendations = get_file_recommendations()

    for check, present in file_checks.items():
        if check != "readme" and not present:
            recommendations.append(file_recommendations[check])

    return {
        "repository": {
            "name": repository["full_name"],
            "description": repository["description"],
            "url": repository["html_url"],
            "stars": repository["stargazers_count"],
            "language": repository["language"]
        },
        "readiness_score": score,
        "maximum_score": 100,
        "file_checks": file_checks,
        "readme_analysis": readme_analysis,
        "link_analysis": link_analysis,
        "recommendations": recommendations
    }
