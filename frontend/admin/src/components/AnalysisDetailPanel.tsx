import { useMemo } from "react";

import { ADMIN_ANALYSIS_API, fetchAdminResponse } from "../api/adminApi";
import type {
  Analysis,
  AnalysisDetail,
  AnalysisLog,
} from "../types/analysis";

type Props = {
  detail: AnalysisDetail;
  selectedId: string;
  selectedItem: Analysis;
  previewBlobUrl: string;
  textContent: string;
  onClose: () => void;
};

const TIMELINE_EVENTS = new Set([
  "processing_started",
  "processing_finished",
]);

export default function AnalysisDetailPanel({
  detail,
  selectedId,
  selectedItem,
  previewBlobUrl,
  textContent,
  onClose,
}: Props) {
  const realScore = useMemo(
    () => formatScore(detail, "REAL"),
    [detail]
  );

  const fakeScore = useMemo(
    () => formatScore(detail, "FAKE"),
    [detail]
  );

  async function handleDownload() {
    try {
      const response = await fetchAdminResponse(
        `${ADMIN_ANALYSIS_API}/${selectedId}/download`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = selectedItem.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="admin-panel-wrapper">
      <button className="admin-panel-close" onClick={onClose}>✕</button>

      <aside className="admin-side-panel">
        <div className="panel-table">
          <table>
            <tbody>
              <tr>
                <th>파일명</th>
                <td colSpan={5}>{selectedItem.file_name}</td>
              </tr>

              <tr>
                <th>상태</th>
                <td>
                  <span className={`admin-badge status-${selectedItem.status}`}>
                    {selectedItem.status}
                  </span>
                </td>

                <th>결과</th>
                <td>
                  {selectedItem.result_label && (
                    <span className={`admin-badge result-${selectedItem.result_label.toLowerCase()}`}>
                      {selectedItem.result_label}
                    </span>
                  )}
                </td>

                <th>신뢰도</th>
                <td>{formatConfidence(selectedItem.confidence)}</td>
              </tr>

              <tr>
                <th>모델 타입</th>
                <td colSpan={2}>{selectedItem.model_type}</td>

                <th>모델 이름</th>
                <td colSpan={2}>{selectedItem.model_name}</td>
              </tr>

              <tr>
                <th>시간</th>
                <td colSpan={5}>
                  {new Date(selectedItem.created_at).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="panel-row">
          <div className="panel-preview">
            <button
              className="preview-download-button"
              onClick={handleDownload}
            >
              다운로드
            </button>

            {!selectedId && (
              <div className="preview-empty">미리보기 없음</div>
            )}

            {selectedItem.model_type === "image" && (
              <img
                src={previewBlobUrl}
                alt={selectedItem.file_name}
                className="panel-preview-media"
              />
            )}

            {(selectedItem.model_type === "video" ||
              selectedItem.model_type === "multimodal") && (
              <video
                src={previewBlobUrl}
                controls
                className="panel-preview-media"
              />
            )}

            {selectedItem.model_type === "text" && (
              <pre className="panel-text-preview">{textContent}</pre>
            )}
          </div>

          <div className="panel-score">
            <div>Real Score</div>
            <div>{realScore}</div>

            <div>Fake Score</div>
            <div>{fakeScore}</div>

            <div>Latency</div>
            <div>
              {detail.inference_time_ms != null ? `${detail.inference_time_ms}ms` : "-"}
            </div>
          </div>
        </div>

        <div className="timeline-table">
          <div className="timeline-side">타임라인</div>

          <div className="timeline-rows">
            {detail.logs
              .filter((log) => TIMELINE_EVENTS.has(log.event_type))
              .map((log) => (<TimelineRow key={log.id} log={log} />))
            }
          </div>
        </div>
      </aside>
    </div>
  );
}

function TimelineRow({ log }: { log: AnalysisLog }) {
  const label =
    log.event_type === "processing_started"
      ? "Analysis started"
      : "Analysis completed";

  return (
    <div className="timeline-row">
      <div className="timeline-event">{label}</div>
      <div className="timeline-time">
        {new Date(log.created_at).toLocaleString()}
      </div>
    </div>
  );
}

function formatScore(
  detail: AnalysisDetail,
  targetLabel: "REAL" | "FAKE"
) {
  if (detail.confidence == null) {
    return "-";
  }

  const value =
    detail.result_label === targetLabel
      ? detail.confidence * 100
      : (1 - detail.confidence) * 100;

  return `${value.toFixed(1)}%`;
}

function formatConfidence(confidence: number | null) {
  return confidence != null
    ? `${(confidence * 100).toFixed(1)}%`
    : "-";
}

