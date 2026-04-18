'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// ─── Auth Middleware Tests ────────────────────────────────────────────────────

describe('Auth Middleware', () => {
  const config = require('../src/config');
  const { authenticateToken, requireRole } = require('../src/middleware/auth');

  /**
   * Helper to create mock Express req/res/next objects.
   */
  function createMocks(overrides = {}) {
    const req = {
      headers: {},
      user: null,
      ...overrides,
    };
    const res = {
      _status: null,
      _json: null,
      status(code) { this._status = code; return this; },
      json(data) { this._json = data; return this; },
    };
    let nextCalled = false;
    let nextError = null;
    const next = (err) => { nextCalled = true; nextError = err || null; };
    return { req, res, next, getNextCalled: () => nextCalled, getNextError: () => nextError };
  }

  describe('authenticateToken', () => {
    it('should reject requests without Authorization header', () => {
      const { req, res, next, getNextError } = createMocks();
      authenticateToken(req, res, next);
      assert.ok(getNextError());
      assert.equal(getNextError().statusCode, 401);
    });

    it('should reject requests with invalid token', () => {
      const { req, res, next, getNextError } = createMocks({
        headers: { authorization: 'Bearer invalidtoken' },
      });
      authenticateToken(req, res, next);
      assert.ok(getNextError());
      assert.match(getNextError().message, /Invalid token/);
    });

    it('should accept a valid token and attach user to req', () => {
      const token = jwt.sign({ id: 1, email: 'test@test.com', role: 'asesor' }, config.jwt.secret);
      const { req, res, next, getNextCalled, getNextError } = createMocks({
        headers: { authorization: `Bearer ${token}` },
      });
      authenticateToken(req, res, next);
      assert.ok(getNextCalled());
      assert.equal(getNextError(), null);
      assert.equal(req.user.id, 1);
      assert.equal(req.user.email, 'test@test.com');
      assert.equal(req.user.role, 'asesor');
    });

    it('should reject an expired token', () => {
      const token = jwt.sign({ id: 1 }, config.jwt.secret, { expiresIn: '0s' });
      // Wait briefly so the token expires
      const { req, res, next, getNextError } = createMocks({
        headers: { authorization: `Bearer ${token}` },
      });
      // Small delay to ensure expiry
      authenticateToken(req, res, next);
      assert.ok(getNextError());
    });
  });

  describe('requireRole', () => {
    it('should allow access if user has a permitted role', () => {
      const { req, res, next, getNextCalled, getNextError } = createMocks();
      req.user = { id: 1, role: 'admin' };
      const middleware = requireRole(['admin', 'gerente']);
      middleware(req, res, next);
      assert.ok(getNextCalled());
      assert.equal(getNextError(), null);
    });

    it('should deny access if user role is not in allowed list', () => {
      const { req, res, next, getNextError } = createMocks();
      req.user = { id: 1, role: 'cliente' };
      const middleware = requireRole(['admin', 'gerente']);
      middleware(req, res, next);
      assert.ok(getNextError());
      assert.equal(getNextError().statusCode, 403);
    });

    it('should deny access if there is no user on the request', () => {
      const { req, res, next, getNextError } = createMocks();
      const middleware = requireRole(['admin']);
      middleware(req, res, next);
      assert.ok(getNextError());
      assert.equal(getNextError().statusCode, 401);
    });
  });
});

// ─── Validator Middleware Tests ───────────────────────────────────────────────

describe('Validator Middleware', () => {
  const { validate } = require('../src/middleware/validator');

  function createMocks(body = {}) {
    const req = { body };
    const res = {};
    let nextCalled = false;
    let nextError = null;
    const next = (err) => { nextCalled = true; nextError = err || null; };
    return { req, res, next, getNextCalled: () => nextCalled, getNextError: () => nextError };
  }

  it('should pass validation with correct data', () => {
    const schema = {
      name: { required: true, type: 'string', minLength: 2 },
      email: { required: true, type: 'string', format: 'email' },
    };
    const { req, res, next, getNextError } = createMocks({ name: 'John', email: 'john@test.com' });
    validate(schema)(req, res, next);
    assert.equal(getNextError(), null);
  });

  it('should fail when required fields are missing', () => {
    const schema = {
      name: { required: true, type: 'string' },
    };
    const { req, res, next, getNextError } = createMocks({});
    validate(schema)(req, res, next);
    assert.ok(getNextError());
    assert.equal(getNextError().name, 'ValidationError');
    assert.ok(getNextError().errors.length > 0);
  });

  it('should validate email format', () => {
    const schema = { email: { required: true, type: 'string', format: 'email' } };
    const { req, res, next, getNextError } = createMocks({ email: 'not-an-email' });
    validate(schema)(req, res, next);
    assert.ok(getNextError());
    assert.ok(getNextError().errors.some((e) => e.field === 'email'));
  });

  it('should validate phone format', () => {
    const schema = { phone: { required: true, type: 'string', format: 'phone' } };
    const { req, res, next, getNextError } = createMocks({ phone: '+34 612 345 678' });
    validate(schema)(req, res, next);
    assert.equal(getNextError(), null);
  });

  it('should validate minLength', () => {
    const schema = { name: { required: true, type: 'string', minLength: 5 } };
    const { req, res, next, getNextError } = createMocks({ name: 'ab' });
    validate(schema)(req, res, next);
    assert.ok(getNextError());
  });

  it('should validate number min/max', () => {
    const schema = { age: { required: true, type: 'number', min: 18, max: 120 } };
    const { req, res, next, getNextError } = createMocks({ age: 15 });
    validate(schema)(req, res, next);
    assert.ok(getNextError());
  });

  it('should validate enum values', () => {
    const schema = { status: { required: true, type: 'string', enum: ['active', 'inactive'] } };
    const { req, res, next, getNextError } = createMocks({ status: 'unknown' });
    validate(schema)(req, res, next);
    assert.ok(getNextError());
  });

  it('should skip optional fields when not present', () => {
    const schema = { nickname: { type: 'string', minLength: 2 } };
    const { req, res, next, getNextError } = createMocks({});
    validate(schema)(req, res, next);
    assert.equal(getNextError(), null);
  });
});
