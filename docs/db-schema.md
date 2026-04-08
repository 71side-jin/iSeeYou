# DB Schema

## 1. analyses
사용자의 검사 요청 1건과 그 결과를 저장하는 메인 테이블

### columns
- id: UUID, PK
- file_name: VARCHAR(255), NOT NULL
- file_type: VARCHAR(20), NOT NULL
  - allowed: `text`, `image`, `video`
- mime_type: VARCHAR(100), NOT NULL
- file_size: BIGINT, NOT NULL
  - 저장된 파일 크기(byte)
- storage_key: VARCHAR(500), NOT NULL
  - 파일 저장 경로 또는 객체 스토리지 key
- status: VARCHAR(20), NOT NULL
  - allowed: `processing`, `success`, `failed`
- result_label: VARCHAR(20), NULL
  - allowed: `REAL`, `FAKE`
- confidence: DOUBLE PRECISION, NULL
- explanation: TEXT, NULL
- model_type: VARCHAR(50), NOT NULL
  - allowed: `text`, `image`, `video`, `multimodal`
- model_name: VARCHAR(100), NOT NULL
- inference_time_ms: INTEGER, NULL
  - 추론 소요 시간(ms)
- error_message: TEXT, NULL
- created_at: TIMESTAMPTZ, NOT NULL
  - 검사 요청 생성 시각
- finished_at: TIMESTAMPTZ, NULL
  - 검사 완료 시각

### notes
- 처리 중이면 `status = processing`
- 성공이면 `status = success`
- 실패면 `status = failed`
- 같은 원본 파일이라도 여러 번 검사 가능하므로, 검사 1회당 레코드 1개 생성

### indexes
- index on `created_at`
- index on `status`
- index on `file_type`
- index on `model_type`

---

## 2. analysis_logs
검사 과정의 상세 이벤트 로그를 저장하는 테이블

### columns
- id: BIGSERIAL, PK
- analysis_id: UUID, NOT NULL, FK -> analyses.id ON DELETE CASCADE
- event_type: VARCHAR(50), NOT NULL
  - allowed example:
    - `created`
    - `file_saved`
    - `processing_started`
    - `processing_finished`
    - `processing_failed`
- message: TEXT, NULL
- created_at: TIMESTAMPTZ, NOT NULL

### notes
- 관리자 페이지에서 검사 상세 타임라인을 보여줄 때 사용
- 초기에는 간단한 이벤트만 저장하고, 필요 시 message를 확장

### indexes
- index on `analysis_id`
- index on `created_at`

---

## 3. admin_users
관리자 로그인 계정

### columns
- id: UUID, PK
- username: VARCHAR(100), UNIQUE, NOT NULL
- password_hash: VARCHAR(255), NOT NULL
- is_active: BOOLEAN, NOT NULL, default TRUE
- last_login_at: TIMESTAMPTZ, NULL

### notes
- 관리자 계정은 일반 사용자와 분리
- 비밀번호는 평문 저장 금지, 반드시 hash 저장