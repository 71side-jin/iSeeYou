import random
import time


class InferenceService:
    def analyze(
        self,
        *,
        page: str,
        selected_mode: str,
        storage_key: str,
        file_name: str,
        settings: dict,
    ) -> dict:
        start = time.perf_counter()

        time.sleep(1.0)

        fake_percent = round(random.uniform(35, 85), 1)
        real_percent = round(100 - fake_percent, 1)
        confidence = round(max(fake_percent, real_percent), 1)
        verdict_label = "Likely synthetic" if fake_percent >= real_percent else "Likely authentic"

        inference_time_ms = int((time.perf_counter() - start) * 1000)

        reasoning = [
            {
                "title": "Primary signal",
                "body": f"{page} 입력에서 {selected_mode} 기준 핵심 신호를 추출했습니다.",
            },
            {
                "title": "Decision logic",
                "body": "선택한 모델 점수와 보조 신호를 합쳐 최종 real/fake 비율을 계산했습니다.",
            },
            {
                "title": "XAI layer",
                "body": "영향이 큰 영역과 구간을 시각화해 설명 가능한 결과를 구성했습니다.",
            },
        ]

        metrics = [
            {"label": "Real score", "value": f"{real_percent:.1f}%", "detail": "authenticity confidence"},
            {"label": "Fake score", "value": f"{fake_percent:.1f}%", "detail": "synthetic confidence"},
            {"label": "Latency", "value": f"{inference_time_ms} ms", "detail": selected_mode},
            {"label": "XAI mode", "value": "Live", "detail": settings.get("xaiDepth", "signature")},
        ]

        stages = [
            {"title": "Ingest", "body": "입력 파일을 정규화하고 분석 준비를 마쳤습니다."},
            {"title": "Analyze", "body": "선택한 모델로 핵심 특징을 추출했습니다."},
            {"title": "Explain", "body": "설명 가능한 결과를 구성했습니다."},
        ]

        analysis_payload = {
            "verdictLabel": verdict_label,
            "fakePercent": fake_percent,
            "realPercent": real_percent,
            "confidence": confidence,
            "summary": f"{selected_mode} 기준으로 {file_name}을 분석한 결과 {'가짜 가능성' if fake_percent >= real_percent else '진짜 가능성'}이 더 높습니다.",
            "reasoning": reasoning,
            "metrics": metrics,
            "stages": stages,
            "xai": {
                "headline": "핵심 근거 시각화",
                "regions": [
                    {"id": "r1", "label": "Face contour", "x": 16, "y": 15, "width": 24, "height": 32, "score": 0.82, "note": "형태 신호"},
                    {"id": "r2", "label": "Mouth / sync", "x": 48, "y": 45, "width": 18, "height": 16, "score": 0.74, "note": "시간 동기화"},
                    {"id": "r3", "label": "Background", "x": 70, "y": 18, "width": 18, "height": 28, "score": 0.63, "note": "배경 흔적"},
                ],
                "timeline": [
                    {"label": "Intro", "start": "00:00", "end": "00:04", "score": 0.38, "note": "초기 신호 약함"},
                    {"label": "Peak evidence", "start": "00:05", "end": "00:09", "score": 0.86, "note": "핵심 단서 집중"},
                    {"label": "Recovery", "start": "00:10", "end": "00:13", "score": 0.54, "note": "신호 완화 구간"},
                ],
                "textHighlights": [
                    {"text": "AI generated phrasing", "weight": 0.86, "tag": "style"},
                    {"text": "source mismatch", "weight": 0.74, "tag": "fact-check"},
                    {"text": "repeated cadence", "weight": 0.62, "tag": "language"},
                ],
                "modalityBars": [
                    {"label": "Vision", "score": 0.82, "note": "spatial evidence"},
                    {"label": "Audio", "score": 0.64, "note": "sync evidence"},
                    {"label": "Text", "score": 0.71, "note": "semantic evidence"},
                    {"label": "Fusion", "score": 0.87, "note": "combined impact"},
                ],
            },
            "db_result": {
                "result_label": "FAKE" if fake_percent >= real_percent else "REAL",
                "confidence": round(max(fake_percent, real_percent) / 100, 4),
                "explanation": f"{selected_mode} 모델 기준 분석 결과입니다.",
                "inference_time_ms": inference_time_ms,
            },
        }

        return analysis_payload