-- Migration: Create expedientes table
CREATE TABLE IF NOT EXISTS expedientes (
    id CHAR(36) PRIMARY KEY,
    client_id CHAR(36) NOT NULL,
    advisor_id CHAR(36) NOT NULL,
    property_value DECIMAL(14,2) NOT NULL,
    requested_amount DECIMAL(14,2) NOT NULL,
    term INT NOT NULL COMMENT 'Term in months',
    status ENUM('nuevo','en_estudio','documentacion_pendiente','enviado_a_banco','oferta_recibida','negociacion','aprobado','firmado','rechazado') NOT NULL DEFAULT 'nuevo',
    score DECIMAL(5,2) NULL,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_expedientes_client (client_id),
    INDEX idx_expedientes_advisor (advisor_id),
    INDEX idx_expedientes_status (status),
    INDEX idx_expedientes_created (created_at),
    CONSTRAINT fk_expedientes_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expedientes_advisor FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
