
from pathlib import Path

from fastapi import HTTPException, status
from pypdf import PdfReader
from docx import Document


class CVExtractionService:
    """
    Extract readable text from PDF and DOCX CV files.
    """

    @staticmethod
    def extract_text(file_path: str | Path) -> str:
        path = Path(file_path)

        if not path.exists() or not path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CV file could not be found.",
            )

        extension = path.suffix.lower()

        try:
            if extension == ".pdf":
                text = CVExtractionService._extract_pdf(path)

            elif extension == ".docx":
                text = CVExtractionService._extract_docx(path)

            elif extension == ".doc":
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=(
                        "Older DOC files can be uploaded, but text extraction "
                        "is not yet supported. Please upload a PDF or DOCX."
                    ),
                )

            else:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Only PDF and DOCX extraction is supported.",
                )

        except HTTPException:
            raise

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not read the CV. Please check that the file is valid.",
            ) from exc

        cleaned_text = CVExtractionService._clean_text(text)

        if not cleaned_text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "No readable text was found in this CV. "
                    "It may be a scanned document requiring OCR."
                ),
            )

        return cleaned_text

    @staticmethod
    def _extract_pdf(path: Path) -> str:
        reader = PdfReader(str(path))

        if reader.is_encrypted:
            raise ValueError("Encrypted PDF files are not supported.")

        pages = []

        for page in reader.pages:
            page_text = page.extract_text() or ""
            pages.append(page_text)

        return "\n".join(pages)

    @staticmethod
    def _extract_docx(path: Path) -> str:
        document = Document(str(path))

        paragraphs = [
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        ]

        # Also extract text from tables, which are common in CVs.
        for table in document.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        paragraphs.append(cell.text)

        return "\n".join(paragraphs)

    @staticmethod
    def _clean_text(text: str) -> str:
        lines = [
            " ".join(line.split())
            for line in text.splitlines()
            if line.strip()
        ]

        return "\n".join(lines)
