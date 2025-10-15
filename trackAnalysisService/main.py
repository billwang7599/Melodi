from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from analyze_track import TrackAnalyzer
from predict_mood import PredictMood

app = FastAPI()
analyzer = TrackAnalyzer()
predict_mood_instance = PredictMood()


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


@app.get("/predict-mood")
def predict_mood_endpoint(
    song_ids: list[str] = Query(
        ..., description="List of song IDs for mood prediction"
    ),
):
    try:
        result = predict_mood_instance.predict(song_ids=song_ids)
    except (FileNotFoundError, ValueError) as error:
        return JSONResponse(status_code=404, content={"error": str(error)})
    return JSONResponse(content=result)


if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    import uvicorn

    load_dotenv()
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
