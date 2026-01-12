from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Optional
import uvicorn

app = FastAPI(title="Embedder Service")

# Load model on startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    print("🔄 Loading embedding model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Model loaded successfully")

class EmbedRequest(BaseModel):
    texts: List[str]
    normalize: Optional[bool] = True

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model_name: str
    dimension: int

@app.post("/embed", response_model=EmbedResponse)
async def embed_texts(request: EmbedRequest):
    """Generate embeddings for input texts"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        embeddings = model.encode(
            request.texts,
            normalize_embeddings=request.normalize,
            show_progress_bar=False
        )
        
        # Convert to list for JSON serialization
        embeddings_list = embeddings.tolist()
        
        return EmbedResponse(
            embeddings=embeddings_list,
            model_name="all-MiniLM-L6-v2",
            dimension=len(embeddings_list[0])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_name": "all-MiniLM-L6-v2" if model else None
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
