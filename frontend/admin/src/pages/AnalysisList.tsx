import { useEffect, useMemo, useState } from "react";

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
  page: number;
  limit: number;
  total_pages: number;
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

    const validNames = MODEL_NAME_MAP[modelTypeFilter] ?? [];
    if (!validNames.includes(modelNameFilter)) {
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

    fetch(`http://localhost:8000/api/admin/analysis?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<AnalysisListResponse>;
      })
      .then((res) => {
        setData(res.items);
        setTotalPages(res.total_pages);
        setTotalCount(res.total);
        setLoading(false);
      })
      .catch((err) => {
        console.error("분석 목록 불러오기 실패:", err);
        setData([]);
        setTotalPages(1);
        setTotalCount(0);
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

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) {
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
      <main className="admin-page">
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

        <section className="admin-filter-panel">
          <FilterField
            label="상태"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "전체" },
              ...STATUS_OPTIONS.map((status) => ({
                value: status,
                label: status,
              })),
            ]}
          />

          <FilterField
            label="결과"
            value={resultFilter}
            onChange={setResultFilter}
            options={[
              { value: "all", label: "전체" },
              ...RESULT_OPTIONS.map((result) => ({
                value: result,
                label: result,
              })),
            ]}
          />

          <FilterField
            label="모델 타입"
            value={modelTypeFilter}
            onChange={setModelTypeFilter}
            options={[
              { value: "all", label: "전체" },
              ...MODEL_TYPE_OPTIONS.map((type) => ({
                value: type,
                label: type,
              })),
            ]}
          />

          <FilterField
            label="모델 이름"
            value={modelNameFilter}
            onChange={setModelNameFilter}
            disabled={modelTypeFilter === "all"}
            options={[
              {
                value: "all",
                label: modelTypeFilter === "all" ? "" : "전체",
              },
              ...modelNameOptions.map((name) => ({
                value: name,
                label: name,
              })),
            ]}
          />

          <FilterField
            label="시간 정렬"
            value={sortOrder}
            onChange={(value) => setSortOrder(value as "desc" | "asc")}
            options={[
              { value: "desc", label: "내림차순 (최신순)" },
              { value: "asc", label: "오름차순 (오래된순)" },
            ]}
          />
        </section>

        <div className="admin-total-row">총 {totalCount}개</div>

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
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-empty-cell">
                      조건에 맞는 분석 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="admin-row">
                      <Td className="is-file">{item.file_name}</Td>
                      <Td>
                        <span className={`admin-badge status-${item.status}`}>
                          {item.status}
                        </span>
                      </Td>
                      <Td>
                        {item.result_label ? (
                          <span
                            className={`admin-badge result-${item.result_label.toLowerCase()}`}
                          >
                            {item.result_label}
                          </span>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td>
                        {item.confidence != null
                          ? `${(item.confidence * 100).toFixed(1)}%`
                          : "-"}
                      </Td>
                      <Td>{item.model_type}</Td>
                      <Td>{item.model_name}</Td>
                      <Td>{new Date(item.created_at).toLocaleString()}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalCount > 0 && (
            <div className="admin-pagination">
              <PageButton
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                이전
              </PageButton>

              {pageNumbers.map((page) => (
                <PageButton
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  active={currentPage === page}
                >
                  {page}
                </PageButton>
              ))}

              <PageButton
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                다음
              </PageButton>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

type FilterFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
};

function FilterField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: FilterFieldProps) {
  return (
    <div className="admin-filter-field">
      <label className="admin-filter-label">{label}</label>
      <select
        className="admin-filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="admin-th">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`admin-td ${className}`.trim()}>{children}</td>;
}

type PageButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
};

function PageButton({
  children,
  onClick,
  disabled = false,
  active = false,
}: PageButtonProps) {
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