import { useEffect, useMemo, useState } from "react";
import "../css/AnalysisList.css";

const API_BASE = "http://localhost:8000/api/admin/analysis";

type Analysis = {
  id: string;
  file_name: string;
  status: string;
  result_label: string | null;
  confidence: number | null;
  model_type: string;
  model_name: string;
  created_at: string;
};

type AnalysisListResponse = {
  items: Analysis[];
  total: number;
  total_pages: number;
};

type AnalysisDetail = {
  id: string;
  file_name: string;
  storage_key: string;

  result_label: string | null;
  confidence: number | null;
  inference_time_ms: number | null;

  text_preview?: string;

  logs: {
    id: number;
    event_type: string;
    message: string | null;
    created_at: string;
  }[];
};

const MODEL_TYPE_OPTIONS = [
  "text",
  "image",
  "video",
  "multimodal",
];

const STATUS_OPTIONS = [
  "processing",
  "success",
  "failed",
];

const RESULT_OPTIONS = [
  "REAL",
  "FAKE",
];

const MODEL_NAME_MAP: Record<string, string[]> = {
  text: [
    "text-ai-detector",
    "text-fact-check",
  ],

  image: [
    "image-fast",
    "image-precision",
  ],

  video: [
    "video-openclip",
    "video-flava",
    "video-blip-nli",
    "video-avsync",
    "video-frequency",
    "video-scenegraph",
  ],

  multimodal: [
    "mm-openclip",
    "mm-flava",
    "mm-blip-nli",
    "mm-avsync",
    "mm-frequency",
    "mm-scenegraph",
  ],
};

type Props = {
  onLogout: () => void;
};

export default function AnalysisList({
  onLogout,
}: Props) {
  const [data, setData] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [selectedItem, setSelectedItem] =
    useState<Analysis | null>(null);

  const [detail, setDetail] =
    useState<AnalysisDetail | null>(null);

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [resultFilter, setResultFilter] =
    useState("all");

  const [modelTypeFilter, setModelTypeFilter] =
    useState("all");

  const [modelNameFilter, setModelNameFilter] =
    useState("all");

  const [sortOrder, setSortOrder] =
    useState<"desc" | "asc">("desc");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 10;

  const [totalPages, setTotalPages] =
    useState(1);

  const [totalCount, setTotalCount] =
    useState(0);

  const [textContent, setTextContent] =
    useState<string>("");

  const [previewBlobUrl, setPreviewBlobUrl] =
    useState<string>("");

  const modelNameOptions = useMemo(() => {
    if (modelTypeFilter === "all") {
      return [];
    }
    return MODEL_NAME_MAP[modelTypeFilter] ?? [];
  }, [modelTypeFilter]);

  const realScore = useMemo(() => {
    if (!detail || detail.confidence == null) {
      return "-";
    }

    const value =
      detail.result_label === "REAL"
        ? detail.confidence * 100
        : (1 - detail.confidence) * 100;

    return `${value.toFixed(1)}%`;
  }, [detail]);

  const fakeScore = useMemo(() => {
    if (!detail || detail.confidence == null) {
      return "-";
    }

    const value =
      detail.result_label === "FAKE"
        ? detail.confidence * 100
        : (1 - detail.confidence) * 100;

    return `${value.toFixed(1)}%`;
  }, [detail]);

  const token = sessionStorage.getItem(
    "admin_access_token"
  );

  const handleDownload = async () => {
    if (!selectedId || !selectedItem) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/${selectedId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("download failed");
      }

      const blob = await res.blob();

      const url =
        window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download =
        selectedItem.file_name;

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (modelTypeFilter === "all") {
      setModelNameFilter("all");
      return;
    }

    const validModels =
      MODEL_NAME_MAP[modelTypeFilter] ?? [];

    if (!validModels.includes(modelNameFilter)) {
      setModelNameFilter("all");
    }
  }, [modelTypeFilter, modelNameFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
    resultFilter,
    modelTypeFilter,
    modelNameFilter,
    sortOrder,
  ]);

  // 목록 fetch
  useEffect(() => {
    const params = new URLSearchParams();

    params.set("page", String(currentPage));
    params.set("limit", String(itemsPerPage));
    params.set("sort_order", sortOrder);

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (resultFilter !== "all") {
      params.set("result_label", resultFilter);
    }

    if (modelTypeFilter !== "all") {
      params.set("model_type", modelTypeFilter);
    }

    if (modelNameFilter !== "all") {
      params.set("model_name", modelNameFilter);
    }

    setLoading(true);

    fetch(`${API_BASE}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
        if (res.status === 401) {
          sessionStorage.removeItem(
            "admin_access_token"
          );

          window.location.reload();

          throw new Error("Unauthorized");
        }

        return res.json();
      })
      .then((res: AnalysisListResponse) => {
        setData(res.items);
        setTotalPages(res.total_pages);
        setTotalCount(res.total);
        setLoading(false);
      });
  }, [
    currentPage,
    statusFilter,
    resultFilter,
    modelTypeFilter,
    modelNameFilter,
    sortOrder,
  ]);

  // detail fetch
  useEffect(() => {
    if (!selectedId) return;

    fetch(`${API_BASE}/${selectedId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json())
      .then((res: AnalysisDetail) => {
        setDetail(res);
      });
  }, [selectedId]);

  // preview fetch
  useEffect(() => {
    if (!selectedId || !selectedItem) {
      return;
    }

    let objectUrl = "";

    fetch(`${API_BASE}/${selectedId}/preview`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          sessionStorage.removeItem(
            "admin_access_token"
          );

          window.location.reload();

          throw new Error("Unauthorized");
        }

        if (
          selectedItem.model_type === "text"
        ) {
          const text = await res.text();

          setTextContent(text);

          return null;
        }

        const blob = await res.blob();

        objectUrl =
          URL.createObjectURL(blob);

        setPreviewBlobUrl(objectUrl);

        return null;
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedId, selectedItem]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const max = 5;

    let start = Math.max(1, currentPage - 2);
    let end = start + max - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="admin-shell">
        <main className="admin-page">
          <section className="admin-loading-panel">
            Loading...
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <main
        className={`admin-page ${
          detail ? "has-panel" : ""
        }`}
      >
        {/* LEFT */}
        <div className="admin-main">
          <div className="admin-topbar">
            <button
              className="admin-floating-logout"
              onClick={() => {
                sessionStorage.removeItem(
                  "admin_access_token"
                );

                onLogout();
              }}
            >
              로그아웃
            </button>
          </div>
          
          <section className="admin-hero">
            <div className="admin-hero-copy">
              분석 결과 목록
            </div>
{/*
            <div className="admin-hero-top">
              <button
                className="admin-logout-button"
                onClick={() => {
                  sessionStorage.removeItem(
                    "admin_access_token"
                  );

                  onLogout();
                }}
              >
                로그아웃
              </button>
            </div>
*/}
            <div className="admin-hero-stats">
              <div className="admin-stat-card">
                <span>전체 결과</span>
                <strong>{totalCount}</strong>
              </div>

              <div className="admin-stat-card">
                <span>현재 페이지</span>
                <strong>{currentPage}</strong>
              </div>

              <div className="admin-stat-card">
                <span>총 페이지</span>
                <strong>{totalPages}</strong>
              </div>
            </div>
          </section>

          <section className="admin-filter-panel">
            <FilterField
              label="상태"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "전체" },

                ...STATUS_OPTIONS.map((s) => ({
                  value: s,
                  label: s,
                })),
              ]}
            />

            <FilterField
              label="결과"
              value={resultFilter}
              onChange={setResultFilter}
              options={[
                { value: "all", label: "전체" },

                ...RESULT_OPTIONS.map((r) => ({
                  value: r,
                  label: r,
                })),
              ]}
            />

            <FilterField
              label="모델 타입"
              value={modelTypeFilter}
              onChange={setModelTypeFilter}
              options={[
                { value: "all", label: "전체" },

                ...MODEL_TYPE_OPTIONS.map((t) => ({
                  value: t,
                  label: t,
                })),
              ]}
            />

            <FilterField
              label="모델 이름"
              value={modelNameFilter}
              onChange={setModelNameFilter}
              disabled={modelTypeFilter === "all"}
              options={[
                { value: "all", label: "전체" },

                ...modelNameOptions.map((name) => ({
                  value: name,
                  label: name,
                })),
              ]}
            />

            <FilterField
              label="시간 정렬"
              value={sortOrder}
              onChange={(v) =>
                setSortOrder(v as "asc" | "desc")
              }
              options={[
                {
                  value: "desc",
                  label: "최신순",
                },
                {
                  value: "asc",
                  label: "오래된순",
                },
              ]}
            />
          </section>

          <div className="admin-total-row">
            총 {totalCount}개
          </div>

          <section className="admin-table-panel">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <Th>파일명</Th>
                    <Th>상태</Th>
                    <Th>결과</Th>
                    <Th>신뢰도</Th>
                    <Th>모델 타입</Th>
                    <Th>모델 이름</Th>
                    <Th>시간</Th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((item) => (
                    <tr
                      key={item.id}
                      className="admin-row"
                      onClick={() => {
                        setSelectedId(item.id);
                        setSelectedItem(item);
                      }}
                    >
                      <Td className="is-file">
                        {item.file_name}
                      </Td>

                      <Td>
                        <span
                          className={`admin-badge status-${item.status}`}
                        >
                          {item.status}
                        </span>
                      </Td>

                      <Td>
                        {item.result_label && (
                          <span
                            className={`admin-badge result-${item.result_label.toLowerCase()}`}
                          >
                            {item.result_label}
                          </span>
                        )}
                      </Td>

                      <Td>
                        {item.confidence != null
                          ? `${(
                              item.confidence * 100
                            ).toFixed(1)}%`
                          : "-"}
                      </Td>

                      <Td>{item.model_type}</Td>

                      <Td>{item.model_name}</Td>

                      <Td>
                        {new Date(
                          item.created_at
                        ).toLocaleString()}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <PageButton
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.max(p - 1, 1)
                  )
                }
                disabled={currentPage === 1}
              >
                이전
              </PageButton>

              {pageNumbers.map((p) => (
                <PageButton
                  key={p}
                  onClick={() =>
                    setCurrentPage(p)
                  }
                  active={p === currentPage}
                >
                  {p}
                </PageButton>
              ))}

              <PageButton
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(p + 1, totalPages)
                  )
                }
                disabled={
                  currentPage === totalPages
                }
              >
                다음
              </PageButton>
            </div>
          </section>
        </div>

        {/* RIGHT PANEL */}
        {detail && selectedItem && (
          <div className="admin-panel-wrapper">
            <button
              className="admin-panel-close"
              onClick={() => {
                setSelectedId(null);
                setSelectedItem(null);
                setDetail(null);
                setPreviewBlobUrl("");
                setTextContent("");
              }}
            >
              ✕
            </button>

            <aside className="admin-side-panel">
              <div className="panel-table">
                <table>
                  <tbody>
                    <tr>
                      <th>파일명</th>

                      <td colSpan={5}>
                        {selectedItem.file_name}
                      </td>
                    </tr>

                    <tr>
                      <th>상태</th>

                      <td>
                        <span
                          className={`admin-badge status-${selectedItem.status}`}
                        >
                          {selectedItem.status}
                        </span>
                      </td>

                      <th>결과</th>

                      <td>
                        {selectedItem.result_label && (
                          <span
                            className={`admin-badge result-${selectedItem.result_label.toLowerCase()}`}
                          >
                            {
                              selectedItem.result_label
                            }
                          </span>
                        )}
                      </td>

                      <th>신뢰도</th>

                      <td>
                        {selectedItem.confidence !=
                        null
                          ? `${(
                              selectedItem.confidence *
                              100
                            ).toFixed(1)}%`
                          : "-"}
                      </td>
                    </tr>

                    <tr>
                      <th>모델타입</th>

                      <td colSpan={2}>
                        {selectedItem.model_type}
                      </td>

                      <th>모델이름</th>

                      <td colSpan={2}>
                        {selectedItem.model_name}
                      </td>
                    </tr>

                    <tr>
                      <th>시간</th>

                      <td colSpan={5}>
                        {new Date(
                          selectedItem.created_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 미리보기 + 점수 */}
              <div className="panel-row">
                <div className="panel-preview">
                  <button
                    className="preview-download-button"
                    onClick={handleDownload}
                  >
                    다운로드
                  </button>

                  {!selectedId && (
                    <div className="preview-empty">
                      미리보기 없음
                    </div>
                  )}

                  {selectedItem?.model_type === "image" && (
                    <img
                      src={previewBlobUrl}
                      alt={selectedItem.file_name}
                      className="panel-preview-media"
                    />
                  )}

                  {(selectedItem?.model_type === "video" ||
                    selectedItem?.model_type === "multimodal") && (
                    <video
                      src={previewBlobUrl}
                      controls
                      className="panel-preview-media"
                    />
                  )}

                  {selectedItem?.model_type === "text" && (
                    <pre className="panel-text-preview">
                      {textContent}
                    </pre>
                  )}

                </div>

                <div className="panel-score">
                  <div>Real Score</div>
                  <div>{realScore}</div>

                  <div>Fake Score</div>
                  <div>{fakeScore}</div>

                  <div>Latency</div>

                  <div>
                    {detail.inference_time_ms !=
                    null
                      ? `${detail.inference_time_ms}ms`
                      : "-"}
                  </div>
                </div>
              </div>

              {/* 타임라인 */}
              <div className="timeline-table">
                <div className="timeline-side">타임라인</div>

                <div className="timeline-rows">
                  {detail.logs
                    .filter(
                      (log) =>
                        log.event_type ===
                          "processing_started" ||
                        log.event_type ===
                          "processing_finished"
                    )
                    .map((log) => {
                      const label =
                        log.event_type ===
                        "processing_started"
                          ? "Analysis started"
                          : "Analysis completed";

                      return (
                        <div key={log.id} className="timeline-row">

                          <div className="timeline-event">{label}</div>

                          <div className="timeline-time">
                            {new Date(log.created_at).toLocaleString()}
                          </div>

                        </div>
                      );
                    })}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

/* UI */
function FilterField({
  label,
  value,
  onChange,
  options,
  disabled,
}: any) {
  return (
    <div className="admin-filter-field">
      <label className="admin-filter-label">
        {label}
      </label>

      <select
        className="admin-filter-select"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        disabled={disabled}
      >
        {options.map((o: any) => (
          <option
            key={o.value}
            value={o.value}
          >
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({ children }: any) {
  return (
    <th className="admin-th">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: any) {
  return (
    <td className={`admin-td ${className}`}>
      {children}
    </td>
  );
}

function PageButton({
  children,
  onClick,
  active,
  disabled,
}: any) {
  return (
    <button
      className={`admin-page-button ${
        active ? "is-active" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}