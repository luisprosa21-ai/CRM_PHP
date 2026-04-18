-- Migration: Create offers table
CREATE TABLE IF NOT EXISTS offers (
    id CHAR(36) PRIMARY KEY,
    expediente_id CHAR(36) NOT NULL,
    bank_id VARCHAR(100) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    interest_rate DECIMAL(5,3) NOT NULL,
    term INT NOT NULL COMMENT 'Term in months',
    monthly_payment DECIMAL(12,2) NOT NULL,
    total_cost DECIMAL(14,2) NOT NULL,
    conditions TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    received_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,

    INDEX idx_offers_expediente (expediente_id),
    INDEX idx_offers_bank (bank_id),
    INDEX idx_offers_status (status),
    CONSTRAINT fk_offers_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
