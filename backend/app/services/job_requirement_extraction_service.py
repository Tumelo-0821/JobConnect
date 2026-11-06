import re


class JobRequirementExtractionService:
    """
    Extract possible job requirements from job titles and descriptions.

    Extracted requirements are suggestions only.
    Employers must review and approve them before ATS matching.
    """

    EXPERIENCE_PATTERNS = [
        r"\bat least\s+(\d+(?:\.\d+)?)\s*\+?\s+years?\s+of\s+experience\b",
        r"\bminimum of\s+(\d+(?:\.\d+)?)\s*\+?\s+years?\s+of\s+experience\b",
        r"\b(\d+(?:\.\d+)?)\s*\+?\s+years?\s+of\s+experience\b",
        r"\b(\d+(?:\.\d+)?)\s*\+?\s+years?\s+experience\b",
    ]

    EDUCATION_PATTERNS = [
    r"\bmatric\b",
    r"\bgrade 12\b",
    r"\bhigh school certificate\b",
    r"\badvanced diploma\b",
    r"\bdiploma\b",
    r"\bbachelor'?s degree\b",
    r"\bmaster'?s degree\b",
    r"\bdegree\b",
    r"\bphd\b",
      ]

    ADDITIONAL_PATTERNS = [
        r"\bvalid driver's licence\b",
        r"\bvalid driving licence\b",
        r"\bown transport\b",
        r"\bfirst aid certificate\b",
        r"\bfood safety certificate\b",
        r"\bpolice clearance\b",
        r"\bcriminal record check\b",
        r"\breferences required\b",
        r"\bphysically fit\b",
        r"\bwilling to travel\b",
        r"\bwilling to work weekends\b",
        r"\bwilling to work shifts\b",
    ]

    @staticmethod
    def _clean_text(text: str) -> str:
        if not isinstance(text, str):
            return ""

        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _extract_matches(text: str, patterns: list[str]) -> list[str]:
        matches = []

        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                value = match.group(0).strip()

                if value.lower() not in [
                    item.lower() for item in matches
                ]:
                    matches.append(value)

        return matches

    @staticmethod
    def _extract_skills(text: str) -> list[str]:
        """
        Identify possible skill phrases using wording in the description.
        This is not an IT-only skills dictionary.
        """

        skills = []

        patterns = [
            r"(?:experience|experienced|skilled|proficient)\s+"
            r"(?:in|with)\s+([^.;\n]+)",

            r"(?:knowledge|understanding|ability)\s+"
            r"(?:of|to)\s+([^.;\n]+)",

            r"(?:good|excellent|strong)\s+"
            r"([a-z][a-z\s-]{2,40}?)\s+skills\b",
        ]

        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                phrase = match.group(1).strip(" ,:")

                if phrase:
                    parts = re.split(
                        r",|\band\b|\bor\b",
                        phrase,
                        flags=re.IGNORECASE,
                    )

                    for part in parts:
                        skill = part.strip(" .,:;-")

                        if (
                            len(skill) >= 2
                            and skill.lower() not in [
                                item.lower() for item in skills
                            ]
                        ):
                            skills.append(skill)

        return skills

    @classmethod
    def extract_requirements(
        cls,
        job_title: str,
        job_description: str,
    ) -> dict:

        title = cls._clean_text(job_title)
        description = cls._clean_text(job_description)

        combined_text = f"{title}. {description}"

        skills = cls._extract_skills(combined_text)

        experience_matches = cls._extract_matches(
            combined_text,
            cls.EXPERIENCE_PATTERNS,
        )

        experience = (
            [experience_matches[0]]
            if experience_matches
            else []
        )

        education = cls._extract_matches(
            combined_text,
            cls.EDUCATION_PATTERNS,
        )

        additional = cls._extract_matches(
            combined_text,
            cls.ADDITIONAL_PATTERNS,
        )

        return {
            "skills": skills,
            "experience": experience,
            "education": education,
            "additional": additional,
            "requires_employer_review": True,
            "approved": False,
        }