-- Create Schema
CREATE SCHEMA IF NOT EXISTS pharma_qms;

-- Set search path
SET search_path TO pharma_qms, public;

-- ---------------------------------------------------------
-- 1. Custom Types (Controlled Vocabularies)
-- ---------------------------------------------------------
CREATE TYPE product_type AS ENUM ('API', 'FDF');
CREATE TYPE complaint_status AS ENUM ('OPEN', 'IN_INVESTIGATION', 'CAPA_PENDING', 'CLOSED', 'VOID');
CREATE TYPE severity_level AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');
CREATE TYPE risk_classification AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- ---------------------------------------------------------
-- 2. Master Data Tables
-- ---------------------------------------------------------
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "API-MET-001"
    product_name VARCHAR(255) NOT NULL,
    type product_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE batches (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(product_id),
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    batch_size_kg_units DECIMAL(12, 3),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 3. Complaints Table
-- ---------------------------------------------------------
CREATE TABLE complaints (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_no VARCHAR(20) UNIQUE NOT NULL, -- Format: CMP-2023-0001
    batch_id UUID REFERENCES batches(batch_id),
    status complaint_status DEFAULT 'OPEN',
    defect_severity severity_level NOT NULL,
    
    -- Reporter Details
    reporter_name VARCHAR(255) NOT NULL,
    reporter_contact TEXT,
    date_received DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Investigation Details
    description TEXT NOT NULL,
    sample_received BOOLEAN DEFAULT FALSE,
    root_cause_summary TEXT,
    
    -- Metadata
    created_by UUID NOT NULL, -- Foreign key to a Users table if exists
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    version INT DEFAULT 1 -- For optimistic locking
);

-- ---------------------------------------------------------
-- 4. Risk Assessment Table (ICH Q9 Compliant)
-- ---------------------------------------------------------
CREATE TABLE risk_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    
    -- FMEA Scoring (1-5 or 1-10 scale)
    severity_score INT NOT NULL CHECK (severity_score BETWEEN 1 AND 10),
    probability_score INT NOT NULL CHECK (probability_score BETWEEN 1 AND 10),
    detectability_score INT NOT NULL CHECK (detectability_score BETWEEN 1 AND 10),
    
    -- Risk Priority Number (RPN) = S x P x D
    rpn_score INT GENERATED ALWAYS AS (severity_score * probability_score * detectability_score) STORED,
    
    final_classification risk_classification NOT NULL,
    justification_text TEXT NOT NULL,
    
    assessed_by UUID NOT NULL,
    assessment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 5. Audit Logging System
-- ---------------------------------------------------------
CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT, -- User ID or DB User
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 6. Audit Trigger Function
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.complaint_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.complaint_id, 'INSERT', to_jsonb(NEW), current_user);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply Audit Trigger to Complaints
CREATE TRIGGER trg_audit_complaints
AFTER INSERT OR UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ---------------------------------------------------------
-- 7. Indexes for Performance
-- ---------------------------------------------------------
CREATE INDEX idx_complaints_batch ON complaints(batch_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_audit_record_id ON audit_logs(record_id);