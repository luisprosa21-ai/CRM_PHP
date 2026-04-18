'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ─── Bank Adapter Tests ──────────────────────────────────────────────────────

describe('BankAdapterFactory', () => {
  const BankAdapterFactory = require('../src/adapters/bank/BankAdapterFactory');

  it('should list available adapters', () => {
    const banks = BankAdapterFactory.listAvailable();
    assert.ok(Array.isArray(banks));
    assert.ok(banks.length >= 2);
    assert.ok(banks.some((b) => b.bankId === 'bank_a'));
    assert.ok(banks.some((b) => b.bankId === 'bank_b'));
  });

  it('should return an adapter for a valid bankId', () => {
    const adapter = BankAdapterFactory.getAdapter('bank_a');
    assert.ok(adapter);
    assert.equal(adapter.bankId, 'bank_a');
    assert.equal(adapter.bankName, 'Banco Nacional');
  });

  it('should throw for an unknown bankId', () => {
    assert.throws(() => BankAdapterFactory.getAdapter('bank_unknown'), {
      message: /No adapter registered/,
    });
  });
});

describe('BankAAdapter', () => {
  const BankAAdapter = require('../src/adapters/bank/BankAAdapter');

  it('should submit an application and return a normalised response', async () => {
    const adapter = new BankAAdapter();
    const result = await adapter.submitApplication({
      cliente_nombre: 'Juan',
      cliente_apellido: 'García',
      email: 'juan@test.com',
      telefono: '+34600000000',
      valor_propiedad: 300000,
      monto_solicitado: 240000,
      plazo_anios: 30,
      ingresos_mensuales: 4000,
    });

    assert.equal(result.bankId, 'bank_a');
    assert.equal(result.bankName, 'Banco Nacional');
    assert.ok(result.applicationId);
    assert.equal(result.status, 'received');
    assert.equal(typeof result.interestRate, 'number');
    assert.equal(typeof result.monthlyPayment, 'number');
  });

  it('should get offer status', async () => {
    const adapter = new BankAAdapter();
    const result = await adapter.getOfferStatus('test-app-id');
    assert.equal(result.bankId, 'bank_a');
    assert.ok(result.applicationId);
    assert.ok(result.status);
  });
});

describe('BankBAdapter', () => {
  const BankBAdapter = require('../src/adapters/bank/BankBAdapter');

  it('should submit an application and return a normalised response', async () => {
    const adapter = new BankBAdapter();
    const result = await adapter.submitApplication({
      cliente_nombre: 'María',
      cliente_apellido: 'López',
      email: 'maria@test.com',
      telefono: '+34600000001',
      valor_propiedad: 250000,
      monto_solicitado: 200000,
      plazo_anios: 20,
      ingresos_mensuales: 3500,
    });

    assert.equal(result.bankId, 'bank_b');
    assert.equal(result.bankName, 'Banco Internacional');
    assert.ok(result.applicationId);
    assert.ok(['received', 'under_review', 'approved', 'conditionally_approved', 'rejected'].includes(result.status));
    assert.equal(typeof result.interestRate, 'number');
  });
});

// ─── Document Processor Tests ────────────────────────────────────────────────

describe('DocumentProcessor', () => {
  const documentProcessor = require('../src/adapters/document/documentProcessor');

  it('should process a valid PDF upload', async () => {
    const mockFile = {
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 100, // 100KB
      buffer: Buffer.alloc(100),
    };

    const result = await documentProcessor.processUpload(mockFile);
    assert.ok(result.storedName.endsWith('.pdf'));
    assert.equal(result.originalName, 'document.pdf');
    assert.equal(result.mimeType, 'application/pdf');
    assert.equal(result.extension, '.pdf');
  });

  it('should reject files with disallowed MIME types', async () => {
    const mockFile = {
      originalname: 'script.exe',
      mimetype: 'application/x-msdownload',
      size: 1024,
      buffer: Buffer.alloc(100),
    };

    await assert.rejects(() => documentProcessor.processUpload(mockFile), {
      message: /File type not allowed/,
    });
  });

  it('should reject files that are too large', async () => {
    const mockFile = {
      originalname: 'huge.pdf',
      mimetype: 'application/pdf',
      size: 50 * 1024 * 1024, // 50 MB
      buffer: Buffer.alloc(100),
    };

    await assert.rejects(() => documentProcessor.processUpload(mockFile), {
      message: /File too large/,
    });
  });

  it('should reject when no file is provided', async () => {
    await assert.rejects(() => documentProcessor.processUpload(null), {
      message: /No file provided/,
    });
  });

  it('should process JPEG uploads', async () => {
    const mockFile = {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 2048,
      buffer: Buffer.alloc(100),
    };

    const result = await documentProcessor.processUpload(mockFile);
    assert.equal(result.extension, '.jpg');
  });
});

// ─── Notification Service Tests ──────────────────────────────────────────────

describe('NotificationService', () => {
  const notificationService = require('../src/adapters/notification/notificationService');

  it('should send an email notification', async () => {
    const result = await notificationService.sendNotification({
      userId: '1',
      type: 'test',
      channel: 'email',
      to: 'test@example.com',
      subject: 'Test Subject',
      message: 'Hello World',
    });

    assert.equal(result.success, true);
    assert.equal(result.channel, 'email');
    assert.ok(result.messageId);
  });

  it('should send an SMS notification', async () => {
    const result = await notificationService.sendNotification({
      userId: '1',
      type: 'test',
      channel: 'sms',
      to: '+34600000000',
      message: 'Test SMS',
    });

    assert.equal(result.success, true);
    assert.equal(result.channel, 'sms');
  });

  it('should send a push notification', async () => {
    const result = await notificationService.sendNotification({
      userId: '1',
      type: 'test',
      channel: 'push',
      subject: 'Push Title',
      message: 'Push Body',
    });

    assert.equal(result.success, true);
    assert.equal(result.channel, 'push');
  });

  it('should throw for unknown channel', async () => {
    await assert.rejects(
      () =>
        notificationService.sendNotification({
          userId: '1',
          type: 'test',
          channel: 'carrier_pigeon',
          message: 'Hello',
        }),
      { message: /Unknown notification channel/ }
    );
  });
});

// ─── Email / SMS / Push Adapter Tests ────────────────────────────────────────

describe('EmailAdapter', () => {
  const emailAdapter = require('../src/adapters/notification/emailAdapter');

  it('should send an email', async () => {
    const result = await emailAdapter.send({ to: 'a@b.com', subject: 'Hi', body: 'Hello' });
    assert.equal(result.success, true);
    assert.equal(result.channel, 'email');
  });

  it('should throw without required fields', async () => {
    await assert.rejects(() => emailAdapter.send({}), { message: /requires/ });
  });
});

describe('SmsAdapter', () => {
  const smsAdapter = require('../src/adapters/notification/smsAdapter');

  it('should send an SMS', async () => {
    const result = await smsAdapter.send({ to: '+1234567890', message: 'Hi' });
    assert.equal(result.success, true);
    assert.equal(result.channel, 'sms');
  });

  it('should throw without required fields', async () => {
    await assert.rejects(() => smsAdapter.send({}), { message: /requires/ });
  });
});

describe('PushAdapter', () => {
  const pushAdapter = require('../src/adapters/notification/pushAdapter');

  it('should send a push notification', async () => {
    const result = await pushAdapter.send({ userId: '1', title: 'Hi', body: 'Hello' });
    assert.equal(result.success, true);
    assert.equal(result.channel, 'push');
  });

  it('should throw without required fields', async () => {
    await assert.rejects(() => pushAdapter.send({}), { message: /requires/ });
  });
});
