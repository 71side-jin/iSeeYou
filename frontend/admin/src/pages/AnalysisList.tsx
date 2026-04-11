import { useEffect, useState } from "react";

type Analysis = {
  id: string;
  file_name: string;
  mime_type: string;
  status: string;
  result_label: string | null;
  confidence: number | null;
  created_at: string;
};

export default function AnalysisList() {
  const [data, setData] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/admin/analysis")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>분석 결과 목록</h1>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>파일명</th>
            <th>MIME 타입</th>
            <th>결과</th>
            <th>신뢰도</th>
            <th>상태</th>
            <th>시간</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.file_name}</td>
              <td>{item.mime_type}</td>
              <td>{item.result_label ?? "-"}</td>
              <td>{item.confidence != null ? item.confidence.toFixed(2) : "-"}</td>
              <td>{item.status}</td>
              <td>{new Date(item.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}