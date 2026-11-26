from backend.main import (
    get_file_recommendations,
    detect_file_checks,
)


def test_all_repository_checks_have_recommendations():
    expected_checks = {
        "contributing",
        "license",
        "code_of_conduct",
        "issue_template",
        "description",
        "topics",
        "pull_request_template",
    }

    recommendations = get_file_recommendations()

    assert expected_checks == set(recommendations.keys())


def test_pull_request_template_recommendation_exists():
    recommendations = get_file_recommendations()

    assert "pull_request_template" in recommendations

def test_detects_issue_template_directory_in_github():
    result = detect_file_checks(
        repository={},
        readme_content="",
        contents=[],
        github_dir_contents=[
            {"name": "ISSUE_TEMPLATE", "type": "dir"}
        ]
    )

    assert result["issue_template"] is True


def test_detects_pull_request_template_directory_in_github():
    result = detect_file_checks(
        repository={},
        readme_content="",
        contents=[],
        github_dir_contents=[
            {"name": "PULL_REQUEST_TEMPLATE", "type": "dir"}
        ]
    )

    assert result["pull_request_template"] is True