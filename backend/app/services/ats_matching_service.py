import re


class ATSMatchingService:
    """
    Explainable, industry-neutral CV-to-job matching.

    Only employer-defined requirements contribute to the score.
    Missing CV evidence is classified as not_assessed, not not_met.
    This service provides decision support, not hiring decisions.
    """

    WEIGHTS = {
        "skills": 0.40,
        "experience": 0.25,
        "education": 0.20,
        "additional": 0.15,
    }

    EXPERIENCE_PATTERN = re.compile(
        r"\b(\d+(?:\.\d+)?)\s*\+?\s*years?\b",
        re.IGNORECASE,
    )

    @staticmethod
    def _clean_requirements(items):
        if not isinstance(items, list):
            return []

        return [
            item.strip()
            for item in items
            if isinstance(item, str) and item.strip()
        ]

    @staticmethod
    def _find_evidence(cv_text: str, requirement: str):
        """
        Find a case-insensitive phrase match while allowing punctuation
        or whitespace between words.
        """

        tokens = re.findall(r"[a-z0-9+#]+", requirement.lower())

        if not tokens:
            return None

        pattern = r"(?<!\w)" + r"[^\w]*".join(
            re.escape(token) for token in tokens
        ) + r"(?!\w)"

        match = re.search(pattern, cv_text, re.IGNORECASE)

        if not match:
            return None

        return match.group(0)

    @staticmethod
    def _requirement_result(requirement, evidence=None, status=None):
        if status is None:
            status = "met" if evidence else "not_assessed"

        return {
            "requirement": requirement,
            "status": status,
            "evidence": evidence,
        }

    @staticmethod
    def _calculate_skills(cv_text: str, required_skills: list[str]):
        skills = ATSMatchingService._clean_requirements(required_skills)

        results = []

        for skill in skills:
            evidence = ATSMatchingService._find_evidence(
                cv_text, skill
            )

            results.append(
                ATSMatchingService._requirement_result(
                    skill, evidence
                )
            )

        assessed = [
            item for item in results
            if item["status"] in ("met", "not_met")
        ]

        matched = [
            item["requirement"] for item in results
            if item["status"] == "met"
        ]

        missing = [
            item["requirement"] for item in results
            if item["status"] == "not_met"
        ]

        score = (
            round(len(matched) / len(assessed) * 100, 2)
            if assessed else None
        )

        return {
            "score": score,
            "matched": matched,
            "missing": missing,
            "requirements": results,
        }

    @staticmethod
    def _calculate_experience(cv_text: str, required_experience):
        if not required_experience:
            return {
                "score": None,
                "detected_years": None,
                "requirements": [],
                "note": "No experience requirement was specified.",
            }

        requirement = str(required_experience).strip()

        if not requirement:
            return {
                "score": None,
                "detected_years": None,
                "requirements": [],
                "note": "No experience requirement was specified.",
            }

        normalized = requirement.lower()

        if normalized in (
            "entry-level",
            "entry level",
            "no experience required",
            "no experience needed",
        ):
            result = ATSMatchingService._requirement_result(
                requirement,
                evidence="No previous experience required.",
                status="met",
            )

            return {
                "score": 100.0,
                "detected_years": None,
                "requirements": [result],
                "note": "The employer does not require previous experience.",
            }

        required_match = ATSMatchingService.EXPERIENCE_PATTERN.search(
            requirement
        )

        detected_matches = ATSMatchingService.EXPERIENCE_PATTERN.findall(
            cv_text
        )

        detected_years = (
            max(float(value) for value in detected_matches)
            if detected_matches else None
        )

        if not required_match or detected_years is None:
            result = ATSMatchingService._requirement_result(
                requirement
            )
        else:
            required_years = float(required_match.group(1))

            status = (
                "met"
                if detected_years >= required_years
                else "not_met"
            )

            result = ATSMatchingService._requirement_result(
                requirement,
                evidence=f"{detected_years:g} years explicitly stated in CV.",
                status=status,
            )

        score = (
            100.0 if result["status"] == "met"
            else 0.0 if result["status"] == "not_met"
            else None
        )

        return {
            "score": score,
            "detected_years": detected_years,
            "requirements": [result],
            "note": (
                "Experience is estimated from explicit year statements "
                "in the CV. It may not represent total work experience."
            ),
        }

    @staticmethod
    def _calculate_education(cv_text: str, education_requirement):
        if not education_requirement:
            return {
                "score": None,
                "detected_keywords": [],
                "requirements": [],
                "note": "No education requirement was specified.",
            }

        requirement = str(education_requirement).strip()

        if not requirement:
            return {
                "score": None,
                "detected_keywords": [],
                "requirements": [],
                "note": "No education requirement was specified.",
            }

        evidence = ATSMatchingService._find_evidence(
            cv_text, requirement
        )

        result = ATSMatchingService._requirement_result(
            requirement, evidence
        )

        score = 100.0 if evidence else None

        return {
            "score": score,
            "detected_keywords": (
                [requirement] if evidence else []
            ),
            "requirements": [result],
            "note": (
                "Education matching checks for the stated qualification. "
                "Qualification level, relevance and authenticity require "
              
            ),
        }

    @staticmethod
    def _calculate_additional(cv_text: str, requirements: list[str]):
        items = ATSMatchingService._clean_requirements(requirements)

        results = []

        for requirement in items:
            evidence = ATSMatchingService._find_evidence(
                cv_text, requirement
            )

            results.append(
                ATSMatchingService._requirement_result(
                    requirement, evidence
                )
            )

        assessed = [
            item for item in results
            if item["status"] in ("met", "not_met")
        ]

        matched = [
            item for item in results
            if item["status"] == "met"
        ]

        score = (
            round(len(matched) / len(assessed) * 100, 2)
            if assessed else None
        )

        return {
            "score": score,
            "requirements": results,
        }

    @staticmethod
    def _calculate_overall_score(category_results):
        """
        Recalculate category weights when some categories
        have no assessable requirements.
        """

        active_categories = {
            category: result["score"]
            for category, result in category_results.items()
            if result["score"] is not None
        }

        if not active_categories:
            return None

        active_weight = sum(
            ATSMatchingService.WEIGHTS[category]
            for category in active_categories
        )

        if active_weight == 0:
            return None

        weighted_score = sum(
            score * ATSMatchingService.WEIGHTS[category]
            for category, score in active_categories.items()
        )

        return round(weighted_score / active_weight, 2)

    @staticmethod
    def analyse_candidate(cv_text: str, job: dict) -> dict:
        """
        Compare extracted CV text against employer-approved job
        requirements. No protected personal characteristics are scored.
        """

        required_skills = job.get("required_skills", [])
        additional_requirements = job.get(
            "additional_requirements", []
        )

        skills_result = ATSMatchingService._calculate_skills(
            cv_text, required_skills
        )

        experience_result = ATSMatchingService._calculate_experience(
            cv_text, job.get("required_experience")
        )

        education_result = ATSMatchingService._calculate_education(
            cv_text, job.get("education_requirements")
        )

        additional_result = ATSMatchingService._calculate_additional(
            cv_text, additional_requirements
        )

        category_results = {
            "skills": skills_result,
            "experience": experience_result,
            "education": education_result,
            "additional": additional_result,
        }

        all_requirements = [
            item
            for result in category_results.values()
            for item in result["requirements"]
        ]

        total_requirements = len(all_requirements)

        assessed_requirements = [
            item for item in all_requirements
            if item["status"] in ("met", "not_met")
        ]

        assessment_coverage = (
            round(
                len(assessed_requirements) / total_requirements * 100,
                2,
            )
            if total_requirements else 0.0
        )

        overall_score = ATSMatchingService._calculate_overall_score(
            category_results
        )

        return {
            "overall_score": overall_score,
            "assessment_coverage": assessment_coverage,
            "score_breakdown": {
                "skills": skills_result["score"],
                "experience": experience_result["score"],
                "education": education_result["score"],
                "additional": additional_result["score"],
                "description_similarity": None,
            },
            "requirements": {
                "skills": skills_result["requirements"],
                "experience": experience_result["requirements"],
                "education": education_result["requirements"],
                "additional": additional_result["requirements"],
            },
            "matched_skills": skills_result["matched"],
            "missing_skills": skills_result["missing"],
            "unassessed_skills": [
                item["requirement"]
                for item in skills_result["requirements"]
                if item["status"] == "not_assessed"
            ],
            "detected_experience_years": (
                experience_result["detected_years"]
            ),
            "detected_education_keywords": (
                education_result["detected_keywords"]
            ),
            "notes": {
                "experience": experience_result["note"],
                "education": education_result["note"],
                "assessment": (
                    "Requirements without sufficient CV evidence are "
                    "marked not_assessed. They are not treated as failures."
                ),
                "decision": (
                    "This score is decision support only. "
                    "As Employers review the CV and make the final decision."
                ),
            },
            "weights": ATSMatchingService.WEIGHTS,
        }