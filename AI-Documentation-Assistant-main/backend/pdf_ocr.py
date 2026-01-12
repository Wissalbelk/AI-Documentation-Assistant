import pytesseract
from pdf2image import convert_from_path

# 🔹 Explicit paths (Windows fix)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\poppler-25.12.0\Library\bin"


def extract_text_with_ocr(pdf_path):
    images = convert_from_path(
        pdf_path,
        poppler_path=POPPLER_PATH
    )

    text = ""
    for img in images:
        page_text = pytesseract.image_to_string(
            img,
            lang="fra+eng"
        )
        text += page_text + "\n"

    return text
