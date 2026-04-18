<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

// ─── User Roles ─────────────────────────────────────────────
enum UserRole: string
{
    case Admin = 'admin';
    case Advisor = 'advisor';
    case Manager = 'manager';
    case Viewer = 'viewer';
}

// ─── Lead Sources ───────────────────────────────────────────
enum LeadSource: string
{
    case Web = 'web';
    case Phone = 'phone';
    case Referral = 'referral';
    case Partner = 'partner';
    case Advertising = 'advertising';
}

// ─── Lead Statuses ──────────────────────────────────────────
enum LeadStatus: string
{
    case New = 'new';
    case Contacted = 'contacted';
    case Qualified = 'qualified';
    case Converted = 'converted';
    case Lost = 'lost';
}

// ─── Document Types (Identity) ──────────────────────────────
enum DocumentType: string
{
    case DNI = 'dni';
    case NIE = 'nie';
    case Passport = 'passport';
}

// ─── Document Categories ────────────────────────────────────
enum DocumentCategory: string
{
    case Identity = 'identity';
    case Payslip = 'payslip';
    case TaxReturn = 'tax_return';
    case PropertyDeed = 'property_deed';
    case BankStatement = 'bank_statement';
    case Appraisal = 'appraisal';
    case Contract = 'contract';
    case Other = 'other';
}

// ─── Expediente Statuses ────────────────────────────────────
enum ExpedienteStatus: string
{
    case Nuevo = 'nuevo';
    case EnEstudio = 'en_estudio';
    case DocumentacionPendiente = 'documentacion_pendiente';
    case EnviadoABanco = 'enviado_a_banco';
    case OfertaRecibida = 'oferta_recibida';
    case Negociacion = 'negociacion';
    case Aprobado = 'aprobado';
    case Firmado = 'firmado';
    case Rechazado = 'rechazado';
}

// ─── Offer Statuses ─────────────────────────────────────────
enum OfferStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Expired = 'expired';
}

// ─── Task Priority ──────────────────────────────────────────
enum TaskPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Urgent = 'urgent';
}

// ─── Task Status ────────────────────────────────────────────
enum TaskStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}

// ─── Document Status ────────────────────────────────────────
enum DocumentStatus: string
{
    case Uploaded = 'uploaded';
    case Verified = 'verified';
    case Rejected = 'rejected';
    case Expired = 'expired';
}

// ─── Notification Type ──────────────────────────────────────
enum NotificationType: string
{
    case Email = 'email';
    case SMS = 'sms';
    case Push = 'push';
    case Internal = 'internal';
}

// ─── Notification Status ────────────────────────────────────
enum NotificationStatus: string
{
    case Pending = 'pending';
    case Sent = 'sent';
    case Failed = 'failed';
    case Read = 'read';
}
