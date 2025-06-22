# Class Scheduler API
# This API provides endpoints to generate class schedules, retrieve schedule history, and display schedules in HTML
from fastapi import FastAPI, HTTPException, Query, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from typing import Optional, List, Dict, Any
from model import ScheduleInput, ScheduleAssignment, Break
from scheduler import SchedulerService
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Class Scheduler API",
    description="API for generating conflict-free class schedules",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a singleton instance of the scheduler service
scheduler_service = SchedulerService()

@app.get("/")
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "message": "Class Scheduler API",
        "version": "1.0.0",
        "endpoints": {
            "generate_schedule": "/api/generate-schedule",
            "schedule_history": "/api/schedule-history",
            "health": "/api/health",
            "schedule_table": "/api/schedule-table"
        }
    }

@app.post("/api/generate-schedule", response_model=Dict[str, Any])
async def generate_schedule(
    input_data: ScheduleInput, 
    use_ga: bool = Query(False, description="Use genetic algorithm for optimization")
):
    """
    Generate a class schedule based on the provided input data.
    
    - **input_data**: The schedule input data including subjects, faculty, breaks, etc.
    - **use_ga**: Whether to use genetic algorithm for optimization (default: False)
    
    Returns a weekly schedule with time slots and assignments.
    """
    try:
        logger.info(f"Generating schedule with GA: {use_ga}")
        result = scheduler_service.generate_schedule(input_data, use_ga)
        return result
    except ValueError as e:
        logger.error(f"Bad request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Internal server error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
# uvicorn main:app --reload --port 8000
@app.post("/generate_schedule", response_model=Dict[str, Any])
async def generate_schedule_legacy(
    input_data: ScheduleInput, 
    use_ga: bool = Query(False, description="Use genetic algorithm for optimization")
):
    """
    Legacy endpoint for backward compatibility.
    """
    return await generate_schedule(input_data, use_ga)

@app.get("/api/schedule-history", response_model=List[Dict[str, Any]])
async def get_schedule_history():
    """
    Get the history of generated schedules.
    
    Returns a list of previously generated schedules.
    """
    try:
        return scheduler_service.get_schedule_history()
    except Exception as e:
        logger.error(f"Error retrieving schedule history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/schedule-table", response_class=HTMLResponse)
async def get_schedule_table():
    """
    Get the latest schedule in HTML table format.
    """
    try:
        history = scheduler_service.get_schedule_history()
        if not history:
            return "<p>No schedules generated yet.</p>"
        
        latest = history[-1]
        result = scheduler_service.generate_schedule(latest["schedule"])
        return result["tabular_schedule"]["html"]
    except Exception as e:
        logger.error(f"Error retrieving schedule table: {str(e)}")
        return f"<p>Error: {str(e)}</p>"

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "healthy", "version": "1.0.0"}
