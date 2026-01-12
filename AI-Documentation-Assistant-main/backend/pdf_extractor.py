from pdf_text import extract_text_from_pdf
from pdf_ocr import extract_text_with_ocr


def extract_text_auto(pdf_path, min_length=200):
    """
    Automatically extract text from a PDF:
    - Try direct text extraction
    - If it fails → use OCR
    """

    text = extract_text_from_pdf(pdf_path)

    if not text or len(text.strip()) < min_length:
        print("⚠️ Using OCR")
        text = extract_text_with_ocr(pdf_path)
    else:
        print("✅ Using direct extraction")

    return text
