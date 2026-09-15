import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ==============================================================================
// 1. CASA & SECURITY COMPLIANCE: SANITIZATION & PII REDACTION ENGINE
// ==============================================================================

const TOKEN_REGEX = /(Bearer\s+)[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/gi;
const EMAIL_REGEX = /([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,10})/g;
const CC_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

// Sensitive URL query parameter keys to sanitize in logged routes
const SENSITIVE_QUERY_PARAMS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'password',
  'key',
  'apikey',
  'api_key',
  'code',
  'authorization',
]);

// Sensitive object keys to redact
const SENSITIVE_OBJECT_KEYS = new Set([
  'password',
  'passwordhash',
  'pwd',
  'pass',
  'secret',
  'jwt_secret',
  'cookie',
  'token',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'apikey',
  'api_key',
  'private_key',
  'client_secret',
  'authorization',
  'cvv',
  'pin',
  'ssn',
]);

/**
 * Standard Luhn Algorithm verification for valid credit card checksums
 */
export function luhnCheck(numStr: string): boolean {
  const sanitized = numStr.replace(/\D/g, '');
  if (sanitized.length < 13 || sanitized.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Sanitizes URL path and query string to prevent credential leakage in routes
 */
export function sanitizeRouteUrl(urlStr: string): string {
  if (!urlStr || !urlStr.includes('?')) return urlStr;
  const [pathname, queryString] = urlStr.split('?');
  if (!queryString) return pathname;

  const params = new URLSearchParams(queryString);
  for (const key of Array.from(params.keys())) {
    if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
      params.set(key, '[REDACTED_CREDENTIAL]');
    }
  }
  const sanitizedQuery = params.toString();
  return sanitizedQuery ? `${pathname}?${sanitizedQuery}` : pathname;
}

/**
 * Deep recursive sanitization of arbitrary values, objects, and arrays.
 * Neutralizes JWTs, emails, CC numbers, SSNs, phone numbers, and sensitive fields.
 */
export function sanitizeLogValue(val: any, depth = 0): any {
  if (depth > 10) return '[MAX_DEPTH_REACHED]';
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    // 1. Redact Bearer JWT tokens
    let sanitized = val.replace(TOKEN_REGEX, '$1[REDACTED_JWT]');

    // 2. Redact Social Security Numbers (SSN)
    sanitized = sanitized.replace(SSN_REGEX, '[REDACTED_SSN]');

    // 3. Redact Credit Card Numbers (verified via Luhn check)
    sanitized = sanitized.replace(CC_REGEX, (match) => {
      return luhnCheck(match) ? '[REDACTED_CC]' : match;
    });

    // 4. Mask Email Addresses (e.g. john.doe@example.com -> j***@example.com)
    sanitized = sanitized.replace(EMAIL_REGEX, (_match, user, domain, ext) => {
      const masked = user.length > 1 ? user[0] + '***' : '***';
      return `${masked}@${domain}.${ext}`;
    });

    // 5. Mask standalone US/intl Phone Numbers
    sanitized = sanitized.replace(PHONE_REGEX, (match) => {
      // Avoid masking plain short dates or non-phones
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
        return `[REDACTED_PHONE]`;
      }
      return match;
    });

    return sanitized;
  }

  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map((item) => sanitizeLogValue(item, depth + 1));
    }

    const sanitizedObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      const lowerKey = k.toLowerCase().replace(/[-_]/g, '');
      let isSensitiveKey = false;
      for (const sensitive of SENSITIVE_OBJECT_KEYS) {
        if (lowerKey.includes(sensitive.replace(/[-_]/g, ''))) {
          isSensitiveKey = true;
          break;
        }
      }

      if (isSensitiveKey && (typeof v !== 'object' || v === null)) {
        sanitizedObj[k] = '[REDACTED_CREDENTIAL]';
      } else {
        sanitizedObj[k] = sanitizeLogValue(v, depth + 1);
      }
    }
    return sanitizedObj;
  }

  return val;
}

// ==============================================================================
// 2. STRUCTURED TELEMETRY INTERFACES & W3C TRACING
// ==============================================================================

export interface StructuredLogRecord {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  environment: string;
  http: {
    method: string;
    route: string;
    status_code: number;
    duration_ms: number;
    client_ip: string;
  };
  security_context: {
    casa_tier: string;
    auth_type: string;
    is_test_account: boolean;
    tenant_id: string;
  };
  performance: {
    db_query_count: number;
    db_total_duration_ms: number;
    memory_delta_mb: number;
    cpu_user_microseconds: number;
  };
}

/**
 * W3C Trace Context Generator & Parser
 * Spec: traceparent: 00-{32_hex_trace_id}-{16_hex_span_id}-{2_hex_flags}
 */
export function parseOrGenerateW3CTrace(req: Request): {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceparent: string;
} {
  const traceparent = (req.headers['traceparent'] as string) || '';
  const hex32Regex = /^[0-9a-f]{32}$/i;
  const hex16Regex = /^[0-9a-f]{16}$/i;

  let traceId = '';
  let parentSpanId: string | undefined = undefined;

  if (traceparent && traceparent.startsWith('00-')) {
    const parts = traceparent.split('-');
    if (parts.length >= 4 && hex32Regex.test(parts[1]) && hex16Regex.test(parts[2])) {
      traceId = parts[1].toLowerCase();
      parentSpanId = parts[2].toLowerCase();
    }
  }

  // Fallback to legacy/custom headers if traceparent was not present or invalid
  if (!traceId) {
    const legacyTrace = (req.headers['x-trace-id'] as string) || (req.headers['x-request-id'] as string);
    if (legacyTrace) {
      const sanitizedLegacy = legacyTrace.replace(/[^0-9a-f]/gi, '').toLowerCase();
      if (sanitizedLegacy.length >= 32) {
        traceId = sanitizedLegacy.substring(0, 32);
      }
    }
  }

  // Generate compliant 32-character hex traceId if absent
  if (!traceId) {
    traceId = crypto.randomBytes(16).toString('hex');
  }

  // Generate unique 16-character hex spanId for the current execution hop
  const spanId = crypto.randomBytes(8).toString('hex');
  const traceFlags = '01'; // Recorded / sampled
  const formattedTraceparent = `00-${traceId}-${spanId}-${traceFlags}`;

  return { traceId, spanId, parentSpanId, traceparent: formattedTraceparent };
}

// ==============================================================================
// 3. ZERO-OVERHEAD ASYNCHRONOUS RING BUFFER & BATCH FLUSHER
// ==============================================================================

export type LogSink = (records: StructuredLogRecord[]) => void;

export class AsyncLogRingBuffer {
  private buffer: (StructuredLogRecord | null)[];
  private capacity: number;
  private head: number = 0;
  private tail: number = 0;
  private currentSize: number = 0;
  private flushTimer: NodeJS.Timeout | null = null;
  private customSink: LogSink | null = null;
  private isFlushing: boolean = false;

  constructor(capacity = 10000, customSink: LogSink | null = null) {
    this.capacity = Math.max(capacity, 1000);
    this.buffer = new Array(this.capacity).fill(null);
    this.customSink = customSink;
    this.startBackgroundFlusher();
  }

  public get size(): number {
    return this.currentSize;
  }

  /**
   * O(1) Non-blocking push into the circular ring buffer.
   * Overwrites oldest entries if capacity is exceeded without blocking caller.
   */
  public push(record: StructuredLogRecord): void {
    this.buffer[this.tail] = record;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.currentSize < this.capacity) {
      this.currentSize++;
    } else {
      // Overwrite oldest record
      this.head = (this.head + 1) % this.capacity;
    }

    // Flush immediately if buffer reaches high batch threshold (500 records)
    if (this.currentSize >= 500) {
      this.flushBatch();
    }
  }

  private startBackgroundFlusher(): void {
    // Flush at 100ms intervals
    this.flushTimer = setInterval(() => {
      this.flushBatch();
    }, 100);
    this.flushTimer.unref(); // Ensure timer does not prevent process exit
  }

  /**
   * Non-blocking batch emission. Pulls up to 500 records and schedules emission
   * on the next tick via setImmediate to prevent event-loop latency.
   */
  public flushBatch(): void {
    if (this.currentSize === 0 || this.isFlushing) return;
    this.isFlushing = true;

    const batchSize = Math.min(this.currentSize, 500);
    const itemsToEmit: StructuredLogRecord[] = [];

    for (let i = 0; i < batchSize; i++) {
      const record = this.buffer[this.head];
      if (record) itemsToEmit.push(record);
      this.buffer[this.head] = null;
      this.head = (this.head + 1) % this.capacity;
    }
    this.currentSize -= batchSize;

    setImmediate(() => {
      try {
        if (this.customSink) {
          this.customSink(itemsToEmit);
        } else {
          for (const item of itemsToEmit) {
            const jsonStr = JSON.stringify(item);
            if (item.level === 'ERROR') {
              process.stderr.write(jsonStr + '\n');
            } else {
              process.stdout.write(jsonStr + '\n');
            }
          }
        }
      } finally {
        this.isFlushing = false;
        // If items were pushed during emission and reached 500, trigger another flush
        if (this.currentSize >= 500) {
          this.flushBatch();
        }
      }
    });
  }

  /**
   * Synchronous drain for unit tests or graceful process teardown
   */
  public flushAllSync(): StructuredLogRecord[] {
    const drained: StructuredLogRecord[] = [];
    while (this.currentSize > 0) {
      const record = this.buffer[this.head];
      if (record) drained.push(record);
      this.buffer[this.head] = null;
      this.head = (this.head + 1) % this.capacity;
      this.currentSize--;
    }
    return drained;
  }

  public setSink(sink: LogSink | null): void {
    this.customSink = sink;
  }

  public stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushBatch();
  }
}

// Global shared ring buffer instance
export const logBuffer = new AsyncLogRingBuffer(10000);

// ==============================================================================
// 4. DATABASE TELEMETRY HOOK HELPER
// ==============================================================================

/**
 * Helper to record database query execution metrics against an active request
 */
export function trackDbQuery(req: Request, durationMs: number): void {
  if (!req) return;
  (req as any).db_query_count = ((req as any).db_query_count || 0) + 1;
  (req as any).db_total_duration_ms = +(((req as any).db_total_duration_ms || 0) + durationMs).toFixed(2);
}

// ==============================================================================
// 5. PRODUCTION OPTIMIZATION & LOGS CREATOR MIDDLEWARE
// ==============================================================================

export function logsCreatorMiddleware(serviceName = 'convee-backend') {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Generate / Propagate W3C Trace Context
    const { traceId, spanId, parentSpanId, traceparent } = parseOrGenerateW3CTrace(req);

    // Attach to Request for downstream services and database queries
    (req as any).trace_id = traceId;
    (req as any).span_id = spanId;
    (req as any).db_query_count = 0;
    (req as any).db_total_duration_ms = 0;

    // Attach W3C and legacy tracing headers to HTTP Response
    res.setHeader('traceparent', traceparent);
    res.setHeader('x-trace-id', traceId);
    res.setHeader('x-span-id', spanId);

    // 2. High-resolution Performance Timing Baseline
    const startHr = process.hrtime.bigint();
    const startCpu = process.cpuUsage();
    const memBefore = process.memoryUsage().heapUsed;

    // 3. Capture Finish Event (executed when response streaming completes)
    res.on('finish', () => {
      // Calculate high-resolution execution duration
      const endHr = process.hrtime.bigint();
      const durationMs = Number(endHr - startHr) / 1e6; // Convert nanoseconds to milliseconds

      const cpuDiff = process.cpuUsage(startCpu);
      const cpuMicroseconds = cpuDiff.user;

      const memAfter = process.memoryUsage().heapUsed;
      const memDeltaMb = +((memAfter - memBefore) / (1024 * 1024)).toFixed(2);

      const statusCode = res.statusCode;

      // Adaptive Log Sampling: Always record errors; sample pure health checks under burst load
      const isHealthCheck = req.path.includes('/health');
      if (isHealthCheck && statusCode === 200 && Math.random() > 0.1) {
        return;
      }

      // Security Context Extraction & CASA Tenant Isolation
      const authHeader = req.headers.authorization || '';
      let authType = 'None';
      if (authHeader.startsWith('Bearer ')) authType = 'OAuth2-Bearer';
      else if (authHeader.startsWith('Basic ')) authType = 'Basic';
      else if (req.headers['x-api-key']) authType = 'API-Key';
      else if ((req as any).cookies?.token) authType = 'Cookie-Session';

      const userEmail = (req as any).user?.email || '';
      const isTestAccount =
        req.headers['x-test-execution'] === 'true' ||
        userEmail.startsWith('perf_test_') ||
        userEmail.startsWith('tenant_test_') ||
        userEmail.includes('demo.edu') ||
        userEmail.includes('test');

      const tenantId =
        (req.headers['x-test-tenant-id'] as string) ||
        (req.headers['x-org-id'] as string) ||
        (req.query.orgId as string) ||
        (req as any).currentOrgId ||
        (req as any).user?.tenantId ||
        'system_tenant';

      const level: 'INFO' | 'WARN' | 'ERROR' =
        statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

      // Sanitize URL route to ensure no credentials leaked via query parameters
      const rawRoute = req.originalUrl || (req.baseUrl ? `${req.baseUrl}${req.path}` : req.path);
      const sanitizedRoute = sanitizeRouteUrl(rawRoute);

      const logRecord: StructuredLogRecord = {
        timestamp: new Date().toISOString(),
        level,
        service: serviceName,
        trace_id: traceId,
        span_id: spanId,
        parent_span_id: parentSpanId,
        environment: process.env.NODE_ENV || 'development',
        http: {
          method: req.method,
          route: sanitizedRoute,
          status_code: statusCode,
          duration_ms: +durationMs.toFixed(2),
          client_ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        },
        security_context: {
          casa_tier: 'Tier-2',
          auth_type: authType,
          is_test_account: isTestAccount,
          tenant_id: tenantId,
        },
        performance: {
          db_query_count: (req as any).db_query_count || 0,
          db_total_duration_ms: (req as any).db_total_duration_ms || 0,
          memory_delta_mb: memDeltaMb,
          cpu_user_microseconds: cpuMicroseconds,
        },
      };

      // Push asynchronously to non-blocking ring buffer
      logBuffer.push(logRecord);
    });

    next();
  };
}

export default logsCreatorMiddleware;
