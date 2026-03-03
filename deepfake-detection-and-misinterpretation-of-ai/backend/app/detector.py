from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification


@dataclass
class FrameScore:
    frame_index: int
    fake_probability: float


class DeepfakeVideoDetector:
    def __init__(
        self,
        model_id: str = "dima806/deepfake_vs_real_image_detection",
        max_frames: int = 32,
    ) -> None:
        self.model_id = model_id
        self.max_frames = max_frames
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.processor = AutoImageProcessor.from_pretrained(self.model_id)
        self.model = AutoModelForImageClassification.from_pretrained(self.model_id)
        self.model.to(self.device)
        self.model.eval()

    def analyze_video(self, video_path: Path) -> dict[str, Any]:
        frame_scores = self._score_video_frames(video_path)
        if not frame_scores:
            raise ValueError("Could not extract any frames from this video.")

        fake_probs = np.array([score.fake_probability for score in frame_scores], dtype=np.float32)
        mean_fake_prob = float(np.mean(fake_probs))
        std_fake_prob = float(np.std(fake_probs))

        ai_content_percentage = round(mean_fake_prob * 100, 2)
        confidence_percentage = round((1.0 - std_fake_prob) * 100, 2)
        misinterpretation_index = round((1.0 - abs(mean_fake_prob - 0.5) * 2.0) * 100, 2)

        if ai_content_percentage >= 70:
            verdict = "Likely AI-generated/deepfake"
        elif ai_content_percentage <= 30:
            verdict = "Likely authentic"
        else:
            verdict = "Mixed or uncertain"

        top_frames = sorted(frame_scores, key=lambda x: x.fake_probability, reverse=True)[:5]
        frame_highlights = [
            {
                "frame_index": item.frame_index,
                "ai_probability_percentage": round(item.fake_probability * 100, 2),
            }
            for item in top_frames
        ]

        return {
            "verdict": verdict,
            "ai_content_percentage": ai_content_percentage,
            "confidence_percentage": confidence_percentage,
            "misinterpretation_index": misinterpretation_index,
            "analyzed_frames": len(frame_scores),
            "model": self.model_id,
            "frame_highlights": frame_highlights,
            "notes": [
                "This estimate is frame-based and should be treated as a screening signal.",
                "Compression, lighting, and editing can increase false positives and false negatives.",
                "Use human review for high-stakes decisions.",
            ],
        }

    def _score_video_frames(self, video_path: Path) -> list[FrameScore]:
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            raise ValueError("Unable to open uploaded video.")

        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            total_frames = self.max_frames

        target_indices = np.linspace(0, max(total_frames - 1, 0), num=min(self.max_frames, total_frames), dtype=int)
        target_set = set(int(i) for i in target_indices.tolist())

        scores: list[FrameScore] = []
        frame_idx = 0
        try:
            while True:
                has_frame, frame = capture.read()
                if not has_frame:
                    break

                if frame_idx in target_set:
                    fake_prob = self._score_single_frame(frame)
                    scores.append(FrameScore(frame_index=frame_idx, fake_probability=fake_prob))

                frame_idx += 1
                if frame_idx > max(target_set, default=0) and len(scores) >= len(target_set):
                    break
        finally:
            capture.release()

        return scores

    def _score_single_frame(self, bgr_frame: np.ndarray) -> float:
        rgb = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb)

        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            logits = self.model(**inputs).logits
            probabilities = torch.softmax(logits, dim=-1).squeeze(0)

        id2label = {int(k): v.lower() for k, v in self.model.config.id2label.items()}
        fake_idx = self._find_fake_label_index(id2label)
        return float(probabilities[fake_idx].item())

    @staticmethod
    def _find_fake_label_index(id2label: dict[int, str]) -> int:
        preferred = ("fake", "deepfake", "ai", "generated")
        for idx, label in id2label.items():
            if any(token in label for token in preferred):
                return idx
        return 1 if len(id2label) > 1 else 0
