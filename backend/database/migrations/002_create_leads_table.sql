-- Migration: Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id CHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    source ENUM('web', 'phone', 'referral', 'partner', 'advertising') NOT NULL DEFAULT 'web',
    status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') NOT NULL DEFAULT 'new',
    assigned_to CHAR(36) NULL,
    notes TEXT,
    score DECIMAL(5,2) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_leads_status (status),
    INDEX idx_leads_assigned (assigned_to),
    INDEX idx_leads_source (source),
    INDEX idx_leads_email (email),
    INDEX idx_leads_created (created_at),
    CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
