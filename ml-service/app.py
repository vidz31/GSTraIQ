from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import ml_routes
import uvicorn

app = FastAPI(
    title="GSTraIQ ML Service",
    description="Microservice for GST Prediction and Anomaly Detection",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routes
app.include_router(ml_routes.router, prefix="/api/ml", tags=["Machine Learning"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to GSTraIQ ML Service API",
        "docs": "/docs",
        "health": "/api/ml/health"
    }

if __name__ == "__main__":
    # Get port from environment variable (for Render deployment)
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
