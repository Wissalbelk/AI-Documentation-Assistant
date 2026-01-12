import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import pickle
import os


class VectorStore:
    def __init__(self, dim=384):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.dim = dim
        self.index = faiss.IndexFlatL2(dim)
        self.texts = []
    def get_context(self, question: str) -> str:
        """
        Temporary simple context.
        Later this will search embeddings from Google Drive docs.
        """
        return "Relevant document context from Google Drive."
    def add_texts(self, texts):
        embeddings = self.model.encode(texts)
        embeddings = np.array(embeddings).astype("float32")

        self.index.add(embeddings)
        self.texts.extend(texts)

    def save(self, path="index"):
        os.makedirs(path, exist_ok=True)

        faiss.write_index(self.index, f"{path}/faiss.index")
        with open(f"{path}/texts.pkl", "wb") as f:
            pickle.dump(self.texts, f)

    def load(self, path="index"):
        self.index = faiss.read_index(f"{path}/faiss.index")
        with open(f"{path}/texts.pkl", "rb") as f:
            self.texts = pickle.load(f)
    def search(self, query, top_k=3):
        query_embedding = self.model.encode([query])
        query_embedding = np.array(query_embedding).astype("float32")

        distances, indices = self.index.search(query_embedding, top_k)

        results = []
        for idx in indices[0]:
            if idx < len(self.texts):
                results.append(self.texts[idx])

        return results
