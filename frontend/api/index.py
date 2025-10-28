from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/chat")
def chat():
    return {"response": "Hello from AI backend"}

@app.post("/api/contact")
def contact():
    return {"success": True, "message": "Заявка принята"}
