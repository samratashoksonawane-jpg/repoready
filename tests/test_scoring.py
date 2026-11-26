from backend.main import calculate_readiness_score


def test_empty_repository_score_is_zero():
    file_checks = {
        "contributing": False,
        "license": False,
        "code_of_conduct": False,
        "issue_template": False,
        "description": False,
        "topics": False,
        "pull_request_template": False,
    }

    assert calculate_readiness_score(0, file_checks) == 0


def test_fully_ready_repository_score_is_100():
    file_checks = {
        "contributing": True,
        "license": True,
        "code_of_conduct": True,
        "issue_template": True,
        "description": True,
        "topics": True,
        "pull_request_template": True,
    }

    assert calculate_readiness_score(26, file_checks) == 100


def test_partial_repository_score():
    file_checks = {
        "contributing": True,
        "license": False,
        "code_of_conduct": False,
        "issue_template": False,
        "description": True,
        "topics": True,
        "pull_request_template": False,
    }

    assert calculate_readiness_score(11, file_checks) == 41