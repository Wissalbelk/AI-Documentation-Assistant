from fastapi import FastAPI
from drive_client import list_files, download_file
from pdf_text import extract_text_from_pdf
from pdf_ocr import extract_text_with_ocr
from pdf_extractor import extract_text_auto 
from text_chunker import clean_text, chunk_text
from vector_store import VectorStore
from llm_client import ask_llm
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from drive_loader import load_drive_context
from llm_client import ask_llm

app = FastAPI()

# ---- CORS (IMPORTANT) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Static frontend ----
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
def ui():
    return FileResponse("../frontend/index.html")

# ---- Request model ----
class Question(BaseModel):
    question: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/download-first")
def download_first():
    files = list_files()
    pdfs = [f for f in files if f["mimeType"] == "application/pdf"]

    if not pdfs:
        return {"error": "No PDF found"}

    first = pdfs[0]
    path = download_file(first["id"], first["name"])
    return {"downloaded": path}
from pdf_text import extract_text_from_pdf

@app.get("/pdf-text")
def pdf_text():
    file_path = "data/attestation-travail-intermediaire-146.pdf"
    text = extract_text_from_pdf(file_path)

    return {
        "text_preview": text[:1000]
    }

@app.get("/pdf-ocr")
def pdf_ocr():
    file_path = "data/attestation-travail-intermediaire-146.pdf"
    text = extract_text_with_ocr(file_path)

    return {
        "ocr_preview": text[:1000]
    }
@app.get("/pdf-auto")
def pdf_auto():
    file_path = "data/attestation-travail-intermediaire-146.pdf"
    text = extract_text_auto(file_path)

    return {
        "auto_preview": text[:1000]
    }
@app.get("/pdf-chunks")
def pdf_chunks():
    file_path = "data/attestation-travail-intermediaire-146.pdf"
    text = extract_text_auto(file_path)

    clean = clean_text(text)
    chunks = chunk_text(clean)

    return {
        "num_chunks": len(chunks),
        "first_chunk": chunks[0]
    }
@app.get("/index-pdf")
def index_pdf():
    file_path = "data/attestation-travail-intermediaire-146.pdf"

    # 1️⃣ Extract text automatically
    text = extract_text_auto(file_path)

    # 2️⃣ Clean text
    clean = clean_text(text)

    # 3️⃣ Chunk text
    chunks = chunk_text(clean)

    # 4️⃣ Create vector store & add chunks
    store = VectorStore()
    store.add_texts(chunks)

    # 5️⃣ Save index to disk
    store.save("index")

    return {
        "status": "indexed",
        "num_chunks": len(chunks)
    }
@app.get("/search")
def search(q: str):
    store = VectorStore()
    store.load("index")

    results = store.search(q)

    return {
        "query": q,
        "results": results
    }
@app.post("/ask")
def ask(q: Question):
    # 1️⃣ Always reload Google Drive
    context = load_drive_context()

    # 2️⃣ Ask the LLM using ALL documents
    answer = ask_llm(context, q.question)

    return {
        "question": q.question,
        "answer": answer
    }
