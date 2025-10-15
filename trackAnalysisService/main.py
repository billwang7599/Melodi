from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from analyze_track import TrackAnalyzer

app = FastAPI()
analyzer = TrackAnalyzer()


@app.get("/analyze")
def analyze_song(songid: str = Query(..., description="Spotify track ID")):
    """
    Analyze a Spotify track by its song ID and return the full analysis data.
    """
    result = analyzer.process_track(songid)
    if result is None:
        return JSONResponse(
            status_code=404,
            content={"error": "Could not analyze track or track not found."},
        )
    return JSONResponse(content=result)
