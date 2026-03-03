# Deepfake Detection and Misinterpretation of AI

End-to-end project that accepts a video upload, samples frames, runs a deepfake image classifier on each frame, and reports:

- Estimated AI/deepfake content percentage
- Confidence percentage
- Misinterpretation index (higher means more ambiguous content)
- Top suspicious frames

## Stack

- Backend: FastAPI
- Model: `dima806/deepfake_vs_real_image_detection` (Hugging Face)
- Video processing: OpenCV
- Frontend: HTML/CSS/JavaScript served by FastAPI

## Project Structure

```text
deepfake-detection-and-misinterpretation-of-ai/
  backend/
    app/
      main.py
      detector.py
    requirements.txt
  frontend/
    index.html
    main.js
    styles.css
```

## Run Locally

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Start the server:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

4. Open:

```text
http://localhost:8000
```

## API

- `POST /api/analyze-video`
  - Form field: `video` (video file)
  - Returns AI content score and analysis metadata in JSON

## Notes

- First run can be slow because model weights download.
- This is a screening estimate, not definitive forensic proof.
- For legal/compliance decisions, combine this with expert human review.
