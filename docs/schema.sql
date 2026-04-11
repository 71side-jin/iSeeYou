CREATE TABLE analyses (
    id UUID PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size >= 0),
    storage_key VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'success', 'failed')),
    result_label VARCHAR(20) NULL CHECK (result_label IN ('REAL', 'FAKE')),
    confidence DOUBLE PRECISION NULL CHECK (confidence >= 0 AND confidence <= 1),
    explanation TEXT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('text', 'image', 'video', 'multimodal')),
    model_name VARCHAR(100) NOT NULL,
    inference_time_ms INTEGER NULL CHECK (inference_time_ms >= 0),
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ NULL
);

CREATE INDEX ix_analyses_created_at ON analyses (created_at);
CREATE INDEX ix_analyses_status ON analyses (status);
CREATE INDEX ix_analyses_model_type ON analyses (model_type);

CREATE TABLE analysis_logs (
    id BIGSERIAL PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_analysis_logs_analysis_id ON analysis_logs (analysis_id);
CREATE INDEX ix_analysis_logs_created_at ON analysis_logs (created_at);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ NULL
);