from app.services.ats_matching_service import ATSMatchingService


def test_html_and_css_match_regardless_of_case_and_punctuation():
    cv_text = """
    Technical Skills:
    HTML
    CSS
    JavaScript
    """

    job = {
        "title": "Web Developer",
        "description": "We need someone with HTML and CSS skills.",
        "required_skills": ["html", "CSS"],
    }

    result = ATSMatchingService.analyse_candidate(cv_text, job)

    assert "html" in [skill.lower() for skill in result["matched_skills"]]
    assert "css" in [skill.lower() for skill in result["matched_skills"]]


def test_empty_required_skills_are_not_automatically_full_marks():
    cv_text = "Candidate with general work experience."

    job = {
        "title": "General Worker",
        "description": "General duties.",
        "required_skills": [],
    }

    result = ATSMatchingService.analyse_candidate(cv_text, job)

    assert result["score_breakdown"]["skills"] is None


def test_missing_skill_evidence_is_not_treated_as_proof_of_failure():
    cv_text = "Candidate has experience in general administration."

    job = {
        "title": "Cleaner",
        "description": "Office cleaning duties.",
        "required_skills": ["Office cleaning"],
    }

    result = ATSMatchingService.analyse_candidate(cv_text, job)

    assert result["requirements"]["skills"][0]["status"] == "not_assessed"


def test_employer_requirements_are_included_in_analysis():
    cv_text = """
    Education: Matric
    Experience: 2 years
    Skills: Office cleaning, time management
    """

    job = {
        "title": "Office Cleaner",
        "description": "Maintain a clean office environment.",
        "required_skills": ["Office cleaning"],
        "required_experience": "1 year",
        "education_requirements": "Matric",
        "additional_requirements": ["References required"],
    }

    result = ATSMatchingService.analyse_candidate(cv_text, job)

    assert "experience" in result["requirements"]
    assert "education" in result["requirements"]
    assert "additional" in result["requirements"]