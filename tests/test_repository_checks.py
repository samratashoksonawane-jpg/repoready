from backend.main import get_file_recommendations


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