import { useEffect, useMemo, useState } from "react";

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
  logs: {
    id: number;
    event_type: string;
    message: string | null;
    created_at: string;
  }[];
};

const MODEL_NAME_MAP: Record<string, string[]> = {
  text: ["text-ai-detector", "text-fact-check"],
  image: ["image-fast", "image-precision"],
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

const MODEL_TYPE_OPTIONS = ["text", "image", "video", "multimodal"];
const STATUS_OPTIONS = ["processing", "success", "failed"];
const RESULT_OPTIONS = ["REAL", "FAKE"];

export default function AnalysisList() {
  const [data, setData] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnalysisDetail | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [modelTypeFilter, setModelTypeFilter] = useState("all");
  const [modelNameFilter, setModelNameFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const modelNameOptions = useMemo(() => {
    if (modelTypeFilter === "all") return [];
    return MODEL_NAME_MAP[modelTypeFilter] ?? [];
  }, [modelTypeFilter]);

  useEffect(() => {
    if (modelTypeFilter === "all") {
      setModelNameFilter("all");
      return;
    }
    const valid = MODEL_NAME_MAP[modelTypeFilter] ?? [];
    if (!valid.includes(modelNameFilter)) {
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

    if (statusFilter !== "all") params.set("status", statusFilter);
    if (resultFilter !== "all") params.set("result_label", resultFilter);
    if (modelTypeFilter !== "all")
      params.set("model_type", modelTypeFilter);
    if (modelNameFilter !== "all")
      params.set("model_name", modelNameFilter);

    setLoading(true);

    fetch(`${API_BASE}?${params}`)
      .then((res) => res.json())
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

  // 상세 fetch
  useEffect(() => {
    if (!selectedId) return;

    fetch(`${API_BASE}/${selectedId}`)
      .then((res) => res.json())
      .then((res: AnalysisDetail) => {
        setDetail(res);
      });
  }, [selectedId]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const max = 5;

    let start = Math.max(1, currentPage - 2);
    let end = start + max - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
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
      <main className="admin-page">
        {/* HERO */}
        <section className="admin-hero">
          <div className="admin-hero-copy">분석 결과 목록</div>

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

        {/* FILTER */}
        <section className="admin-filter-panel">
          <FilterField label="상태" value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "전체" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]} />
          <FilterField label="결과" value={resultFilter} onChange={setResultFilter} options={[{ value: "all", label: "전체" }, ...RESULT_OPTIONS.map((r) => ({ value: r, label: r }))]} />
          <FilterField label="모델 타입" value={modelTypeFilter} onChange={setModelTypeFilter} options={[{ value: "all", label: "전체" }, ...MODEL_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))]} />
          <FilterField label="모델 이름" value={modelNameFilter} onChange={setModelNameFilter} disabled={modelTypeFilter === "all"} options={[{ value: "all", label: "전체" }, ...modelNameOptions.map((n) => ({ value: n, label: n }))]} />
          <FilterField label="시간 정렬" value={sortOrder} onChange={(v) => setSortOrder(v as "asc" | "desc")} options={[{ value: "desc", label: "최신순" }, { value: "asc", label: "오래된순" }]} />
        </section>

        <div className="admin-total-row">총 {totalCount}개</div>

        {/* TABLE */}
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
                    onClick={() => setSelectedId(item.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Td className="is-file">{item.file_name}</Td>
                    <Td>
                      <span className={`admin-badge status-${item.status}`}>
                        {item.status}
                      </span>
                    </Td>
                    <Td>
                      {item.result_label && (
                        <span className={`admin-badge result-${item.result_label.toLowerCase()}`}>
                          {item.result_label}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {item.confidence
                        ? `${(item.confidence * 100).toFixed(1)}%`
                        : "-"}
                    </Td>
                    <Td>{item.model_type}</Td>
                    <Td>{item.model_name}</Td>
                    <Td>{new Date(item.created_at).toLocaleString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="admin-pagination">
            <PageButton onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>이전</PageButton>
            {pageNumbers.map((p) => (
              <PageButton key={p} onClick={() => setCurrentPage(p)} active={p === currentPage}>{p}</PageButton>
            ))}
            <PageButton onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>다음</PageButton>
          </div>
        </section>

        {/* ✅ 상세 패널 */}
        {detail && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "40%",
              height: "100%",
              background: "#fff",
              borderLeft: "1px solid #ddd",
              padding: 24,
              overflowY: "auto",
              zIndex: 999,
            }}
          >
            <h3>{detail.file_name}</h3>

            <p><b>ID:</b> {detail.id}</p>
            <p><b>Storage:</b> {detail.storage_key}</p>

            <h4>로그</h4>
            {detail.logs.map((log) => (
              <div key={log.id} style={{ marginBottom: 10 }}>
                <strong>{log.event_type}</strong>
                <div>{log.message}</div>
                <small>{new Date(log.created_at).toLocaleString()}</small>
              </div>
            ))}

            <button
              onClick={() => {
                setSelectedId(null);
                setDetail(null);
              }}
              style={{ marginTop: 20 }}
            >
              닫기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* UI */
function FilterField({ label, value, onChange, options, disabled }: any) {
  return (
    <div className="admin-filter-field">
      <label className="admin-filter-label">{label}</label>
      <select className="admin-filter-select" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Th({ children }: any) {
  return <th className="admin-th">{children}</th>;
}

function Td({ children, className = "" }: any) {
  return <td className={`admin-td ${className}`}>{children}</td>;
}

function PageButton({ children, onClick, active, disabled }: any) {
  return (
    <button
      className={`admin-page-button ${active ? "is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}