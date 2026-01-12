from drive_client import list_files, download_file
from pdf_extractor import extract_text_auto
from pdf_ocr import extract_text_with_ocr


def load_drive_context():
    files = list_files()
    all_text = []

    for f in files:
        file_id = f["id"]
        name = f["name"]
        mime = f.get("mimeType", "")

        try:
            path = download_file(file_id, name)

            if mime == "application/pdf":
                text = extract_text_auto(path)
            elif mime.startswith("image/"):
                text = extract_text_with_ocr(path)
            else:
                continue

            if text.strip():
                all_text.append(f"\n--- Document: {name} ---\n{text}")

        except Exception as e:
            print(f"❌ Error processing {name}: {e}")

    return "\n\n".join(all_text)
