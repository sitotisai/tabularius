// Evaluator for parsed FileMaker calculations: a stack machine over the parse tree (see Env.run), so that a formula's
// nesting and a custom function's recursion are bounded by FileMaker's limits, not by the server's call stack.

import { isExecutionRefusal, markExecutionRefusal, rethrowExecutionRefusal } from './execution-refusal.ts';
import { withRegexBudget } from './regex-guard.ts';
import { ComplexityError } from './complexity-error.ts';
import { FUNCTIONS, pluginNotInstalled, stackExhausted, type Fn } from './functions.ts';
import { getParameter } from './get.ts';
import { unknownFunctionId } from './unknown.ts';
import { concatRuns } from './styled.ts';
import { checkCalcTextSize } from './text-budget.ts';
import { Decimal, decimalFunction, decimalNumberText, setDecimalBudget, supportsDecimalFunction } from './decimal.ts';
import { assertTraversalDepth, NameTable, parse, type CalcNames, type Node } from './parser.ts';
import {
  CalcError, ERR, EMPTY, asBoolean, asNumber, asNumberOrEmpty, asText, bool, checkedDate, checkedTimestamp, exactOf, exactPow, fromExact, isBeyondDouble, isEmpty, isOverlongWholeText, num, text, tidy, tidySum,
  type DateStyle, type Value,
} from './values.ts';

/** A field as a calculation names it: occurrence is absent for the context table's own fields. */
export interface FieldRef {
  occurrence?: string;
  field: string;
  /** 1-based repetition. */
  repetition: number;
}

/**
 * What a calculation can see. Every member is optional: a context that
 * leaves one out makes the matching formulas fail with an error, as a
 * FileMaker calculation does when a field or function is unavailable.
 */
/** A custom function as a calculation sees it. */
export interface CustomFunctionDef {
  parameters: string[];
  formula: string;
  /** Runs a function written in JavaScript on its evaluated arguments. */
  call?(args: Value[]): Value;
}

export interface CalcContext {
  /** Host platform override for deterministic evaluation and platform tests. */
  platform?: NodeJS.Platform;
  /** Whether this calculation runs without a person at a client (inferred for MBS IsServer). */
  headless?: boolean;
  /** Repetition being evaluated in a repeating calculation field; defaults to 1. */
  calculationRepetition?: number;
  /** Field and occurrence names, so names with spaces parse. Build once with `new NameTable(...)` and reuse. */
  names?: NameTable | CalcNames;
  /** The context table occurrence's name; TO::Field with this occurrence reads the current record. */
  occurrence?: string;
  /**
   * A field's value in the current record, or in the first related record
   * for another occurrence. Undefined means the field does not exist.
   */
  field?(ref: FieldRef): Value | undefined;
  /**
   * Every value a field reference stands for in an aggregate (Sum, Count,
   * List, ...): one per related record for another occurrence. Defaults to
   * the single value from field().
   */
  related?(ref: FieldRef): Value[] | undefined;
  /**
   * LookupNext: the related field's value in the record whose match value is the next lower or higher than the
   * current record's, when no record matches; undefined when the host can't say (the result is then empty).
   */
  lookupNext?(ref: FieldRef, direction: 'lower' | 'higher'): Value | undefined;
  /** Number of repetitions a field has (for Sum ( repeatingField ) and similar); default 1. */
  repetitions?(ref: Omit<FieldRef, 'repetition'>): number;
  /**
   * GetSummary ( summaryField ; breakField ): the summary over the records
   * that share the current record's break field value. Without it, the
   * summary field's own value (the total) is used.
   */
  summary?(field: FieldRef, breakField: FieldRef): Value | undefined;
  /** Get ( name ) values the host knows; built-in defaults cover dates, times, UUIDs and the like. */
  get?(name: string): Value | undefined;
  /** Reader-placeholder notices. Messages contain IDs only, never calculation text. */
  notice?(message: string): void;
  /** $local and $$global variables (name includes the $ signs). */
  variable?(name: string, repetition: number): Value | undefined;
  setVariable?(name: string, repetition: number, value: Value): void;
  /**
   * Custom functions defined in the file. One written in JavaScript comes with `call`, which runs it (in a sandbox)
   * on its evaluated arguments; `formula` is then its JavaScript.
   */
  customFunction?(name: string): CustomFunctionDef | undefined;
  /**
   * A plug-in function enabled for this file, by name or by the reader's ⟨OWNR:n⟩ marker. Looked up after
   * FileMaker's own functions and before custom functions; without it, plug-in calls give "?" as uninstalled.
   */
  plugin?(name: string): PluginFunction | undefined;
  /**
   * True when a function belongs to a built-in plug-in pack (BaseElements) that the admin turned off for this file: it
   * then gives "?", as a plug-in that isn't installed does.
   */
  builtinOff?(name: string): boolean;
  /** Get ( InstalledFMPlugins ): the plug-ins the host has, and whether each is enabled for this file. */
  installedPlugins?(): InstalledPlugin[];
  /**
   * GetEmbedding ( account ; model ; text ): the text's embedding as container data, from the host's AI. Without it
   * (a field calculation, or no AI) GetEmbedding is an error.
   */
  embedding?(account: string, model: string, input: string): Value;
  /** GetRAGSpaceInfo ( account {; spaceId} ): the RAG spaces of this file as JSON text, or undefined when there is no such RAG account. */
  ragSpaceInfo?(account: string, spaceId?: string): string | undefined;
  /** Design functions (TableNames, FieldNames, LayoutNames, ...) by name, with evaluated arguments. */
  design?(name: string, args: Value[]): Value | undefined;
  /** ExecuteSQL: rows of values for a query with ? parameters. */
  executeSQL?(query: string, args: Value[]): Value[][];
  /** GetPersistentData: the entry stored by Configure Persistent Data, or undefined. */
  persistentData?(name: string, instance: string): Value | undefined;
  /** ListPersistentDataIDs: the instance IDs stored under a name. */
  persistentDataIds?(name: string): string[];
  /**
   * Location and LocationValues (FileMaker Go): where the person's device is, as its browser reported it for the
   * script being run; undefined when it isn't known (no permission, or no device), and the functions give empty.
   */
  location?(): DeviceLocation | undefined;
  /** Date order (and two-digit padding) for converting dates to and from text; default MDY. */
  dateOrder?: DateStyle;
  /** Clock for Get ( CurrentDate ) and friends; default the system clock. */
  now?(): Date;
  /**
   * Local text files for plug-in functions (BE_FileReadText and friends), kept
   * by the host to its own folders: a path outside them reads as missing and
   * writes nothing.
   */
  files?: PluginFiles;
  /**
   * What plug-in state belongs to (MBS's compiled regular expressions): the script session, which lasts across the
   * steps and runs of one person's session. Without it, state lasts for this one context object, except JS.*,
   * whose persistent sandbox handles require a script session.
   */
  pluginSession?: object;
  /** Optional DynaPDF functions provided by the script host. */
  mbsCall?(name: string, args: Value[]): Value | undefined;
  /** Opaque originating database/account key for JavaScript handle quotas and cool-downs, shared across sessions. */
  pluginAccount?: string;
  /**
   * Outbound test mode for plug-in functions: web requests and mail are
   * recorded, and nothing is sent (calculations can't wait for a reply).
   * Absent, those functions fail as before.
   */
  outbound?: PluginOutbound;
  /** Real web requests for plug-in functions (see PluginNetwork). Outbound test mode takes its place when set. */
  network?: PluginNetwork;
  /** Synchronous bridge to the script engine's guarded URL transport. */
  curlFetch?(request: MbsCurlRequest): PluginResponse;
  /** Synchronous bridge to the script engine's guarded FTP client (BE_FTP_*). */
  ftpFetch?(request: PluginFtpRequest): PluginFtpResponse;
  /** CURL handles last for one script run, including calls to child scripts. */
  curlScope?: object;
  /** Real mail for plug-in functions, where the operator switched sending on (see PluginMailer). Outbound test mode takes its place when set. */
  mailer?: PluginMailer;
  /** Mail for the built-in BaseElements functions (BE_SMTPSend), where the operator set up sending and scripts may use the network. Outbound test mode takes its place when set. */
  builtinMailer?: PluginMailer;
  /**
   * Called after each part of the formula is worked out, innermost first,
   * with its nesting depth (1 for the whole formula): the result, or the
   * error that stopped it. For explaining a value step by step.
   */
  trace?(node: Node, result: Value | CalcError, depth: number): void;
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  /** Meters above sea level, when the device knows. */
  altitude?: number;
  /** Meters either way. */
  horizontalAccuracy: number;
  verticalAccuracy?: number;
  /** When it was measured (ms since 1970). */
  at: number;
}

/** A real answer to a plug-in's web request. */
export interface PluginResponse {
  /** 0 when the request didn't get an answer (see error). */
  status: number;
  body: string;
  /** The body as it came, where the request asked for it (wantBytes); body is then empty. */
  bytes?: Uint8Array;
  /** Lowercase names. */
  headers: Record<string, string>;
  error?: string;
  headerText?: string;
}

export interface MbsCurlRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  /** The body as bytes (a file to send); body is then absent. */
  bodyBytes?: Uint8Array;
  /** Answer with the body's bytes (PluginResponse.bytes), for a file to save. */
  wantBytes?: boolean;
  follow: boolean;
  maxRedirs: number;
  aws?: { spec: string; user: string };
  /** The function asking, for messages (CURL.Perform when absent). */
  via?: string;
}

/** An FTP upload or delete for BaseElements' FTP functions (see packages/scripts/src/ftp.ts). */
export interface PluginFtpRequest {
  op: 'put' | 'delete';
  url: string;
  user: string;
  password: string;
  bytes?: Uint8Array;
  /** The function asking, for messages. */
  via: string;
}

/** How an FTP request went: PluginResponse's status is the server's final reply code, and error says why not, with curl's number for it in `code`. */
export interface PluginFtpResponse extends PluginResponse {
  code?: number;
}

/**
 * Real web requests for plug-ins, when the host lets scripts reach the network. A calculation can't wait for a
 * reply, so the host throws HostWait until it has made the request and the call is run again; it never makes
 * the same request twice in one step.
 */
export interface PluginNetwork {
  fetch(via: string, req: { method: string; url: string; headers: Record<string, string>; body: string; allows(url: string): boolean }): PluginResponse;
}

/** A message a plug-in sends: the addresses as the plug-in wrote them, attachments as paths in the scripts' folders. */
export interface PluginMail { from: string; to: string; cc: string; bcc: string; subject: string; body: string; attachments: string[] }

export interface PluginMailer {
  /** Sends a message through the operator's mail account, or throws why it wasn't sent. */
  send(via: string, m: PluginMail): void;
}

export interface PluginOutbound {
  /** A web request a plug-in would make; recorded, never sent. */
  request(via: string, method: string, url: string, bodyBytes: number): void;
  /** A message a plug-in would send; captured, never sent to its recipients. */
  mail(via: string, m: { from: string; to: string; cc: string; bcc: string; subject: string; body: string; attachments: string[] }): void;
}

/** A plug-in the host has, as Get ( InstalledFMPlugins ) lists it. */
export interface InstalledPlugin { name: string; id: string; version: string; state: 'Enabled' | 'Disabled'; description?: string }

/** A function a plug-in provides: it gets its arguments evaluated, never the formula. */
export interface PluginFunction {
  /** Disabled plug-in placeholder: a hosted custom function takes precedence over it. */
  unavailable?: boolean;
  /** Same arguments always give the same result, without host calls. Defaults to volatile. */
  pure?: boolean;
  /** Changes when the implementation or manifest changes, for shared calculation caches. */
  cacheKey?: string;
  min: number;
  max?: number;
  call(args: Value[], env: Env): Value;
}

/** Runtime precedence, also used by pre-execution analysis. Host lookups are case-insensitive.
 * A disabled built-in still owns its name; it must not fall through to a plug-in or custom body. */
export function resolveFunction<C>(name: string, context: {
  plugin?(name: string): PluginFunction | undefined;
  customFunction?(name: string): C | undefined;
}): { kind: 'builtin'; fn: Fn } | { kind: 'plugin'; fn: PluginFunction } | { kind: 'custom'; fn: C } | undefined {
  const builtin = FUNCTIONS.get(name.toLowerCase());
  if (builtin) return { kind: 'builtin', fn: builtin };
  const plugin = context.plugin?.(name);
  if (plugin && !plugin.unavailable) return { kind: 'plugin', fn: plugin };
  const custom = context.customFunction?.(name);
  return custom ? { kind: 'custom', fn: custom } : plugin ? { kind: 'plugin', fn: plugin } : undefined;
}

export interface PluginFiles {
  read(path: string): Uint8Array | undefined;
  /** False when the path is outside the allowed folders or its folder is missing. */
  write(path: string, content: string | Uint8Array, append: boolean): boolean;
  size(path: string): number | undefined;
  /** Folder tools: 0 when done, else the system error number (2: no such file, 17: already exists). */
  makeFolder?(path: string): number;
  /** Deletes a file, or a folder with everything in it. */
  remove?(path: string): number;
  move?(from: string, to: string, overwrite: boolean): number;
  copy?(from: string, to: string, overwrite: boolean): number;
  /** What a folder holds, as paths relative to it ("sub/a.txt" when recursing); undefined when it isn't one. */
  list?(path: string, recurse: boolean): { path: string; folder: boolean }[] | undefined;
  modified?(path: string): Date | undefined;
}

const MAX_DEPTH = 10000;
/** Number functions that keep a decimal argument's digits even outside SetPrecision. */
const TARGETED_DECIMAL_FUNCTIONS = new Set(['abs', 'int', 'ceiling', 'floor', 'round', 'truncate', 'mod', 'div', 'sum', 'average', 'min', 'max']);

// The evaluator's own stack (see Env.run). Each kind is one step of work.
const EVAL = 0, TRACE = 1, CALL = 2, LET_BIND = 3, LET_BODY = 4, SCOPE_END = 5, UNARY = 6, AND_OR = 7, AND_OR_B = 8, BIN = 9,
  IF = 10, CASE = 11, CHOOSE = 12, COLLECT = 13, SPREAD = 14, APPLY_BUILTIN = 15, APPLY_PLUGIN = 16, APPLY_JS = 17, APPLY_CUSTOM = 18,
  FN_END = 19, PRECISION = 20, PRECISION_END = 21, AS_NUMBER = 22;

/** A custom function about to be applied: its evaluated arguments, and the nodes they came from (for GetFieldName). */
interface CustomCall { cf: CustomFunctionDef; name: string; nodes: Node[]; out: Value[] }
/** What SetPrecision changed, to put back when its expression ends. */
interface PrecisionState { previous: number | undefined; budget: (() => void) | undefined; places: number }

/** How many Evaluate calls may be inside one another: text that evaluates itself (a calculation field reading its own text) stops here. */
const MAX_EVALUATE_DEPTH = 100;
export const EVALUATION_LIMIT = { steps: 5_000_000, ms: 2500, cachedFormulas: 256 } as const;
const WORK_BUDGET_MS = 850;

// Elapsed wall time includes time when another test or process has descheduled
// this calculation. Charge the executing thread instead, while retaining a
// wall-clock fallback for browser runtimes without thread CPU accounting.
const calculationTime = (): number => {
  if (typeof process !== 'undefined' && typeof process.threadCpuUsage === 'function') {
    const { user, system } = process.threadCpuUsage();
    return (user + system) / 1000;
  }
  return performance.now();
};

/** Evaluation state: the context, Let scopes and recursion depth. */
/** A written decimal keeps its digits but not trailing zeros, as FileMaker shows it: 1.50 is 1.5 and 2.0 is 2. */
function decimalLiteral(raw: string, value: number): Value {
  if (!/^\d*\.\d*$/.test(raw)) return num(value);
  const text = raw.replace(/0+$/, '').replace(/\.$/, '').replace(/^\./, '0.');
  return text.includes('.') ? { type: 'number', value, decimal: text } : num(value);
}

export class Env {
  readonly ctx: CalcContext;
  readonly names: NameTable;
  private scopes: Map<string, Value>[] = [];
  private readonly parameterFields = new WeakMap<Map<string, Value>, Map<string, string>>();
  depth = 0;
  /** SetRecursion's limit on custom function depth and While loops, while its expression is evaluated. */
  recursionLimit?: number;
  /** Guarded decimal places while evaluating SetPrecision's first argument. */
  private decimalPlaces?: number;
  private workDeadline = Infinity;
  private workExhausted = false;
  private whileDepth = 0;

  constructor(ctx: CalcContext) {
    this.ctx = ctx;
    this.names = ctx.names instanceof NameTable ? ctx.names : new NameTable(ctx.names);
  }

  get order(): DateStyle {
    return this.ctx.dateOrder ?? 'MDY';
  }

  /** The clock is shared by every loop and Decimal operation; small batches charge every step. */
  checkWorkBudget(steps = 1): void {
    this.tick(steps);
    this.checkClock();
    if (calculationTime() < this.workDeadline) return;
    this.workExhausted = true;
    const error = new CalcError(ERR.recursion, this.whileDepth
      ? this.whileBudgetMessage()
      : `Calculation exceeded its ${WORK_BUDGET_MS} ms calculation work budget`);
    markExecutionRefusal(error);
    throw error;
  }

  whileBudgetMessage(): string {
    return `While exceeded its work budget or ${(this.recursionLimit ?? 50000).toLocaleString('en-US')} iteration limit`;
  }

  withWhileBudget<T>(work: () => T): T {
    this.whileDepth++;
    try { return work(); } finally { this.whileDepth--; }
  }

  /** Evaluate a node (and report it to ctx.trace when one is set). */
  v(n: Node): Value {
    if (this.evaluating) return this.run(EVAL, n, this.traceDepth + 1, 0, null);
    assertTraversalDepth(n);
    this.steps = 0;
    this.workExhausted = false;
    const started = calculationTime();
    this.stop = started + EVALUATION_LIMIT.ms;
    this.workDeadline = started + WORK_BUDGET_MS;
    this.evaluating++;
    try {
      // The whole formula is not a step of its own; every part inside it is one.
      const result = withRegexBudget(() => this.run(EVAL, n, 1, 1, null));
      // Error-inspection functions may catch an inner error; they cannot reset
      // an exhausted budget or make the enclosing evaluation succeed.
      if (this.workExhausted || this.steps > EVALUATION_LIMIT.steps || calculationTime() >= this.stop) {
        throw new ComplexityError('Calculation exceeds the supported work budget');
      }
      return result;
    } catch (e) {
      rethrowExecutionRefusal(e);
      // The formula's own nesting never reaches JavaScript's stack; a built-in that reads its arguments itself, or a host
      // callback, can still run it out. That is the formula's error, not a failure of the read or write that ran it.
      if (e instanceof RangeError && stackExhausted(e)) throw new CalcError(ERR.calculation, "The formula is nested too deeply for this server's stack");
      throw e;
    } finally {
      this.evaluating--;
      this.stop = Infinity;
      this.workDeadline = Infinity;
    }
  }

  /** The nesting depth of the part being worked out (1 for the whole formula), for ctx.trace. */
  private traceDepth = 0;
  private evaluating = 0;
  private steps = 0;
  private stop = Infinity;

  /** A built-in can spend long on one call, so the clock is read at every function call as well as every 1,024 steps. */
  private checkClock(): void {
    if (this.evaluating && calculationTime() >= this.stop) throw new ComplexityError('Calculation exceeds the supported work budget');
  }

  private tick(steps = 1): void {
    this.steps += steps;
    if (this.steps > EVALUATION_LIMIT.steps || ((this.steps & 1023) < steps && calculationTime() >= this.stop)) {
      throw new ComplexityError('Calculation exceeds the supported work budget');
    }
  }

  private numberLiteral(n: Extract<Node, { k: 'num' }>): Value {
    return this.decimalPlaces !== undefined ? (n.raw === 'Pi' ? Decimal.pi(this.decimalPlaces)
      : Decimal.parse(n.raw ?? String(n.value), this.decimalPlaces)).value()
      : n.raw !== undefined && isOverlongWholeText(n.raw) ? num(NaN)
        : n.exact !== undefined ? { type: 'number', value: n.value, exact: n.exact }
        : n.raw?.includes('.') ? decimalLiteral(n.raw, n.value) : num(n.value);
  }

  /**
   * The evaluator keeps its own stack of frames instead of calling itself for each part of the formula, so the
   * nesting of a formula, and the depth of a custom function that waits for its own result, never run JavaScript's
   * stack out: a formula nested as deep as the parser allows evaluates, and a custom function goes FileMaker's 10,000
   * calls deep whether or not its call is the last thing it does. A frame is one step of work: a node to evaluate,
   * the rest of an operator once its operands are known, a function to apply to its evaluated arguments, or the state
   * to put back when a Let, a custom function or SetPrecision ends. Values move through a stack of their own.
   * A built-in that reads its arguments itself (If and Case are handled here; While, Substitute, Evaluate and the
   * others call v() for each) starts a run of its own inside this one, and so does a host callback: those nest on
   * JavaScript's stack, one run per level, and a stack that runs out there is turned into the calculation's error.
   */
  private run(k: number, n: Node, d: number, i: number, a: unknown): Value {
    const base = this.fk.length;
    const vbase = this.vs.length;
    const entryDepth = this.traceDepth;
    this.push(k, n, d, i, a);
    try {
      while (this.fk.length > base) {
        const k = this.fk.pop()!;
        const n = this.fn.pop()!;
        const d = this.fd.pop()!;
        const i = this.fi.pop()!;
        const a = this.fa.pop()!;
        this.traceDepth = d;
        try {
          this.step(k, n, d, i, a);
        } catch (e) {
          throw this.unwind(base, vbase, e);
        }
      }
      return this.vs.pop()!;
    } finally {
      this.traceDepth = entryDepth;
    }
  }

  /**
   * The pending frames, one run inside another on the same five arrays (kind, node, depth, index, payload), and the
   * values they have produced. Arrays of plain fields, not frame objects, so that evaluating a part allocates nothing.
   */
  private readonly fk: number[] = [];
  private readonly fn: Node[] = [];
  private readonly fd: number[] = [];
  private readonly fi: number[] = [];
  private readonly fa: unknown[] = [];
  private readonly vs: Value[] = [];

  private push(k: number, n: Node, d: number, i: number, a: unknown): void {
    this.fk.push(k);
    this.fn.push(n);
    this.fd.push(d);
    this.fi.push(i);
    this.fa.push(a);
  }

  /**
   * An error on its way out of a run: the frames still pending put back what they changed (Let scopes, a custom
   * function's scope and depth, SetPrecision's digits), the trace hears of each part the error stopped, and a stack
   * that ran out inside a custom function becomes that function's error, as a thrown error would in a recursive
   * evaluator's catch. Each state is put back by assignment, not by undoing, so a second error on the way out (a stack
   * with no room left for the first) leaves nothing half done once the next frame out has run.
   */
  private unwind(base: number, vbase: number, e: unknown): unknown {
    const refusal = isExecutionRefusal(e);
    const trace = this.ctx.trace;
    while (this.fk.length > base) {
      const k = this.fk.pop()!;
      const n = this.fn.pop()!;
      const d = this.fd.pop()!;
      const i = this.fi.pop()!;
      const a = this.fa.pop()!;
      switch (k) {
        case TRACE:
          if (trace && !refusal && e instanceof CalcError) trace(n, e, d);
          break;
        case SCOPE_END:
          this.scopes.length = i;
          break;
        case FN_END: {
          // JavaScript's stack can run out before FileMaker's 10,000 levels: the same error ("?"), saying how far it got.
          const level = this.depth;
          this.scopes = a as Map<string, Value>[];
          this.depth = i;
          if (!refusal && e instanceof RangeError && stackExhausted(e)) {
            e = new CalcError(ERR.recursion, `${(n as Node & { k: 'call' | 'var' }).name} recursed too deeply (this server's stack ran out at level ${level}; FileMaker allows ${MAX_DEPTH})`);
          }
          break;
        }
        case PRECISION_END: {
          const saved = a as PrecisionState;
          this.decimalPlaces = saved.previous;
          setDecimalBudget(saved.budget);
          if (!refusal && e instanceof RangeError) e = new CalcError(ERR.calculation, e.message);
          break;
        }
      }
    }
    this.vs.length = vbase;
    return e;
  }

  /** One step: the frame's own work, which may push the frames that do the rest. */
  private step(k: number, n: Node, d: number, i: number, a: unknown): void {
    switch (k) {
      case EVAL: {
        if (!i) this.tick();
        if (this.ctx.trace) this.push(TRACE, n, d, 0, null);
        switch (n.k) {
          case 'num': this.vs.push(this.numberLiteral(n)); return;
          case 'str': this.vs.push(text(n.value)); return;
          case 'field': this.vs.push(this.field(n)); return;
          case 'var': {
            const r = this.variable(n);
            if ('custom' in r) this.push(r.custom.call ? APPLY_JS : APPLY_CUSTOM, n, d, 0, { cf: r.custom, name: n.name, nodes: [], out: [] } satisfies CustomCall);
            else this.vs.push(r);
            return;
          }
          case 'get': this.vs.push(getParameter(n.param, this)); return;
          case 'let': {
            // A Let variable bound to a field keeps the field's name, for GetFieldName, as in FileMaker.
            const scope = new Map<string, Value>();
            const names = new Map<string, string>();
            this.parameterFields.set(scope, names);
            this.push(SCOPE_END, n, d, this.scopes.length, null);
            this.scopes.push(scope);
            this.push(LET_BODY, n, d, 0, null);
            // Each name is bound before the next value is read, so later values can use earlier names.
            for (let i = n.binds.length - 1; i >= 0; i--) {
              this.push(LET_BIND, n, d, i, names);
              this.push(EVAL, n.binds[i][1], d + 1, 0, null);
            }
            return;
          }
          case 'unary': this.push(UNARY, n, d, 0, null); this.push(EVAL, n.a, d + 1, 0, null); return;
          case 'bin':
            // and / or stop as soon as the answer is known.
            if (n.op === 'and' || n.op === 'or') {
              this.push(AND_OR, n, d, 0, null);
            } else {
              this.push(BIN, n, d, 0, null);
              this.push(EVAL, n.b, d + 1, 0, null);
            }
            this.push(EVAL, n.a, d + 1, 0, null);
            return;
          case 'call': this.callNode(n, d); return;
        }
        return;
      }
      case CALL: this.callNode(n as Node & { k: 'call' }, d); return;
      case TRACE: this.ctx.trace!(n, this.vs[this.vs.length - 1], d); return;
      case LET_BIND: {
        const [name, b, rep] = (n as Node & { k: 'let' }).binds[i];
        this.bind(name, this.vs.pop()!, rep);
        if (name.startsWith('$')) return;
        const names = a as Map<string, string>;
        // A bare name that is no Let variable or parameter is a field of the current table.
        const fieldName = b.k === 'field' ? this.fieldName(b.occurrence, b.name)
          : b.k === 'var' && !b.name.startsWith('$') ? this.fieldNameOf(b.name) ?? (this.lookup(b.name) === undefined ? this.fieldName(undefined, b.name) : undefined)
          : undefined;
        if (typeof fieldName === 'string') names.set(name.toLowerCase(), fieldName);
        else names.delete(name.toLowerCase());
        return;
      }
      case LET_BODY: this.push(EVAL, (n as Node & { k: 'let' }).body, d + 1, 0, null); return;
      case SCOPE_END: this.scopes.length = i; return;
      case UNARY: {
        const a = this.vs.pop()!;
        const op = (n as Node & { k: 'unary' }).op;
        if (op === 'not') this.vs.push(bool(!asBoolean(a)));
        else if (op === '+') this.vs.push(a);
        else if ((this.decimalPlaces !== undefined || (a.type === 'number' && a.decimal !== undefined)) && op === '-') {
          const dec = Decimal.value(a, this.decimalPlaces ?? 448);
          this.vs.push(dec.with(-dec.n).value());
        } else this.vs.push(negate(a));
        return;
      }
      case AND_OR: {
        const first = asBoolean(this.vs.pop()!);
        const bn = n as Node & { k: 'bin' };
        if (bn.op === 'and' ? !first : first) { this.vs.push(bool(first)); return; }
        this.push(AND_OR_B, n, d, 0, null);
        this.push(EVAL, bn.b, d + 1, 0, null);
        return;
      }
      case AND_OR_B: this.vs.push(bool(asBoolean(this.vs.pop()!))); return;
      case BIN: {
        const b = this.vs.pop()!;
        const a = this.vs.pop()!;
        const bn = n as Node & { k: 'bin' };
        this.vs.push(this.binary(bn.op, a, b, bn.a, bn.b));
        return;
      }
      case IF: {
        const args = (n as Node & { k: 'call' }).args;
        const next = asBoolean(this.vs.pop()!) ? args[1] : args[2];
        if (next) this.push(EVAL, next, d + 1, 0, null);
        else this.vs.push(EMPTY);
        return;
      }
      case CASE: {
        const args = (n as Node & { k: 'call' }).args;
        if (asBoolean(this.vs.pop()!)) { this.push(EVAL, args[i + 1], d + 1, 0, null); return; }
        const next = i + 2;
        if (next + 1 < args.length) {
          this.push(CASE, n, d, next, null);
          this.push(EVAL, args[next], d + 1, 0, null);
        } else if (args.length % 2) this.push(EVAL, args[args.length - 1], d + 1, 0, null);
        else this.vs.push(EMPTY);
        return;
      }
      case CHOOSE: {
        const args = (n as Node & { k: 'call' }).args;
        const i = Math.trunc(asNumber(this.vs.pop()!));
        if (i >= 0 && i + 1 < args.length) this.push(EVAL, args[i + 1], d + 1, 0, null);
        else this.vs.push(EMPTY);
        return;
      }
      case COLLECT: (a as Value[]).push(this.vs.pop()!); return;
      case SPREAD: {
        // An aggregate's argument: every related record's value, or every repetition, read directly; anything else evaluated.
        const direct = this.valuesDirect(n);
        if (!direct) {
          this.push(COLLECT, n, d, 0, a);
          this.push(EVAL, n, d + 1, 0, null);
          return;
        }
        const out = a as Value[];
        for (const v of direct) out.push(v);
        return;
      }
      case APPLY_BUILTIN: {
        const { fn, out } = a as { fn: Fn; out: Value[] };
        this.vs.push(this.applyBuiltin(n as Node & { k: 'call' }, fn, out));
        return;
      }
      case APPLY_PLUGIN: {
        const { fn, out } = a as { fn: PluginFunction; out: Value[] };
        this.vs.push(fn.call(out, this));
        return;
      }
      case APPLY_JS: {
        const { cf, name, out } = a as CustomCall;
        if (out.length !== cf.parameters.length) {
          throw new CalcError(out.length < cf.parameters.length ? ERR.tooFewParameters : ERR.tooManyParameters, `Wrong number of parameters in ${name}`);
        }
        this.vs.push(cf.call!(out));
        return;
      }
      case APPLY_CUSTOM: {
        // The parameters bound to the evaluated arguments in a scope of their own: the body cannot see the caller's names.
        const { cf, name, nodes, out } = a as CustomCall;
        const scope = this.bindValues(name, cf, out, nodes.map((a) => this.argumentFieldName(a)));
        const limit = Math.min(MAX_DEPTH, this.recursionLimit ?? MAX_DEPTH);
        this.push(FN_END, n, d, this.depth, this.scopes);
        if (++this.depth > limit) throw new CalcError(ERR.recursion, `${name} recursed too deeply`);
        this.tick();
        const body = this.parse(cf.formula, cf.parameters.map((p) => p.trim()));
        this.scopes = [scope];
        this.push(EVAL, body, d + 1, 0, null);
        return;
      }
      case FN_END:
        this.scopes = a as Map<string, Value>[];
        this.depth = i;
        return;
      case PRECISION: {
        const args = (n as Node & { k: 'call' }).args;
        const precision = Math.trunc(asNumber(this.vs.pop()!));
        // Claris documents 16–400, plus the precision-zero example. Keep the
        // pre-existing evaluation for undocumented precision arguments.
        if (precision !== 0 && !(precision >= 16 && precision <= 400)) { this.push(EVAL, args[0], d + 1, 0, null); return; }
        const places = precision === 0 ? 16 : precision;
        const saved: PrecisionState = { previous: this.decimalPlaces, budget: setDecimalBudget(() => this.checkWorkBudget()), places };
        this.decimalPlaces = places + 48;
        this.push(PRECISION_END, n, d, 0, saved); this.push(EVAL, args[0], d + 1, 0, null);
        return;
      }
      case PRECISION_END: {
        const saved = a as PrecisionState;
        const raised = this.decimalPlaces!;
        this.decimalPlaces = saved.previous;
        setDecimalBudget(saved.budget);
        const result = this.vs.pop()!;
        try {
          this.vs.push(result.type === 'number' && result.decimal !== undefined ? Decimal.value(result, raised).value(saved.places) : result);
        } catch (e) {
          if (e instanceof RangeError) throw new CalcError(ERR.calculation, e.message);
          throw e;
        }
        return;
      }
      case AS_NUMBER: {
        const places = this.decimalPlaces ?? 448;
        const v = this.vs.pop()!;
        if (v.type === 'number' && v.decimal !== undefined) { this.vs.push(Decimal.value(v, places).value()); return; }
        if (v.type === 'text' || v.type === 'container') {
          const numeric = decimalNumberText(v.value);
          if (numeric?.includes('.')) {
            try { this.vs.push(Decimal.parse(numeric, places).value()); return; } catch (e) { if (e instanceof RangeError) { this.vs.push(num(NaN)); return; } throw e; }
          }
        }
        this.vs.push((a as Fn).values!([v], this, (n as Node & { k: 'call' }).name, (n as Node & { k: 'call' }).args));
        return;
      }
    }
  }

  /** A function call: what to do before its arguments are read, and the frames that read them and apply it. */
  private callNode(n: Node & { k: 'call' }, d: number): void {
    const { name, args } = n;
    // No public binary-ID mapping: use the requested plug-in-missing fallback.
    // Do not evaluate arguments or let a host/custom function claim this ID.
    if (unknownFunctionId(name)) {
      this.ctx.notice?.(`Unknown function ${name}: skipped; returns ?`);
      this.vs.push(text('?'));
      return;
    }
    const resolved = resolveFunction(name, this.ctx);
    if (resolved?.kind === 'builtin') {
      const fn = resolved.fn;
      if (args.length < fn.min) throw new CalcError(ERR.tooFewParameters, `Too few parameters in ${name}`);
      if (fn.max !== undefined && args.length > fn.max) throw new CalcError(ERR.tooManyParameters, `Too many parameters in ${name}`);
      // A built-in pack turned off for this file is a plug-in that isn't installed: "?" without evaluating the arguments.
      if (this.ctx.builtinOff?.(name)) { this.vs.push(text('?')); return; }
      const key = name.toLowerCase();
      switch (key) {
        // Choosing a branch is no work of its own: the clock is not read for it, as it is for every other call.
        case 'if': this.push(IF, n, d, 0, null); this.push(EVAL, args[0], d + 1, 0, null); return;
        case 'case': this.push(CASE, n, d, 0, null); this.push(EVAL, args[0], d + 1, 0, null); return;
        case 'choose': this.push(CHOOSE, n, d, 0, null); this.push(EVAL, args[0], d + 1, 0, null); return;
      }
      this.checkClock();
      if (this.decimalPlaces !== undefined && key === 'pi') { this.vs.push(Decimal.pi(this.decimalPlaces).value()); return; }
      switch (key) {
        case 'setprecision': this.push(PRECISION, n, d, 0, null); this.push(EVAL, args[1], d + 1, 0, null); return;
        case 'getasnumber': this.push(AS_NUMBER, n, d, 0, fn); this.push(EVAL, args[0], d + 1, 0, null); return;
      }
      // A built-in that reads its arguments itself (While, Substitute, Evaluate, ...) runs them in a nested run of its own.
      if (!fn.values) { this.vs.push(fn.run(args, this, name)); return; }
      const out: Value[] = [];
      this.push(APPLY_BUILTIN, n, d, 0, { fn, out });
      this.pushArguments(args, d, out, fn.spread === true, fn.groups === true);
      return;
    }
    if (resolved?.kind === 'plugin') {
      this.checkClock();
      const pf = resolved.fn;
      if (args.length < pf.min) throw new CalcError(ERR.tooFewParameters, `Too few parameters in ${name}`);
      if (pf.max !== undefined && args.length > pf.max) throw new CalcError(ERR.tooManyParameters, `Too many parameters in ${name}`);
      const out: Value[] = [];
      this.push(APPLY_PLUGIN, n, d, 0, { fn: pf, out });
      this.pushArguments(args, d, out, false, false);
      return;
    }
    if (resolved?.kind === 'custom') {
      const cf = resolved.fn;
      // A function written as a formula is only its parts, each a step of its own; one written in JavaScript is a built-in's kind of work.
      if (cf.call) this.checkClock();
      if (args.length !== cf.parameters.length) {
        throw new CalcError(args.length < cf.parameters.length ? ERR.tooFewParameters : ERR.tooManyParameters, `Wrong number of parameters in ${name}`);
      }
      const out: Value[] = [];
      this.push(cf.call ? APPLY_JS : APPLY_CUSTOM, n, d, 0, { cf, name, nodes: args, out } satisfies CustomCall);
      this.pushArguments(args, d, out, false, false);
      return;
    }
    this.checkClock();
    // The plug-in isn't installed: FileMaker gives "?" without evaluating the arguments.
    if (pluginNotInstalled(name)) { this.vs.push(text('?')); return; }
    throw new CalcError(ERR.unknownFunction, `The function "${name}" cannot be found`);
  }

  /**
   * Frames that read a call's arguments left to right into `out`: one value each, every value an aggregate's argument
   * stands for, or each part of a [ a ; b ] group for a function that takes them.
   */
  private pushArguments(args: Node[], d: number, out: Value[], spread: boolean, groups: boolean): void {
    for (let i = args.length - 1; i >= 0; i--) {
      const arg = args[i];
      if (spread) {
        this.push(SPREAD, arg, d, 0, out);
      } else if (groups && arg.k === 'call' && arg.name === '[]') {
        for (let j = arg.args.length - 1; j >= 0; j--) {
          this.push(COLLECT, arg.args[j], d, 0, out);
          this.push(EVAL, arg.args[j], d + 1, 0, null);
        }
      } else {
        this.push(COLLECT, arg, d, 0, out);
        this.push(EVAL, arg, d + 1, 0, null);
      }
    }
  }

  /** A built-in applied to its evaluated arguments: with SetPrecision's digits, or a decimal argument, the number functions keep every digit. */
  private applyBuiltin(n: Node & { k: 'call' }, fn: Fn, values: Value[]): Value {
    const name = n.name;
    const key = name.toLowerCase();
    if (supportsDecimalFunction(name) && (this.decimalPlaces !== undefined || TARGETED_DECIMAL_FUNCTIONS.has(key))) {
      if ((key === 'min' || key === 'max') && values.length && values.every((v) => exactOf(v) !== undefined)) {
        return values.reduce((best, v) => key === 'min'
          ? (exactOf(v)! < exactOf(best)! ? v : best) : (exactOf(v)! > exactOf(best)! ? v : best));
      }
      // Keep the documented 15-significant-digit Sum/Average behavior for a
      // decimal input beyond that boundary; the remaining decimal functions
      // share the fixed-point path.
      const longDecimalAggregate = (key === 'sum' || key === 'average') && values.some((v) => v.type === 'number'
        && v.decimal !== undefined && v.decimal.replace(/[^0-9]/g, '').replace(/^0+/, '').length > 15);
      if (this.decimalPlaces !== undefined || (!longDecimalAggregate && values.some((v) => v.type === 'number' && v.decimal !== undefined))) {
        const places = this.decimalPlaces ?? 448;
        if (key === 'min' || key === 'max') {
          const nonblank = values.filter((v) => !isEmpty(v));
          if (nonblank.some((v) => v.type !== 'number')) {
            return nonblank.reduce<Value | undefined>((best, v) => !best || (key === 'min' ? compare(v, best, this.order) < 0 : compare(v, best, this.order) > 0) ? v : best, undefined) ?? EMPTY;
          }
        }
        const precise = decimalFunction(key, values, places);
        if (precise !== undefined) return precise;
      }
    }
    return fn.values!(values, this, name, n.args);
  }

  text(n: Node): string {
    return this.textOf(this.v(n));
  }

  /** Round guarded decimal digits when a number crosses into text. */
  textOf(v: Value): string {
    return asText(this.decimalPlaces !== undefined && v.type === 'number' && v.decimal !== undefined
      ? Decimal.value(v, this.decimalPlaces).value(this.decimalPlaces - 48) : v, this.order);
  }

  number(n: Node): number {
    return asNumber(this.v(n));
  }

  bool(n: Node): boolean {
    return asBoolean(this.v(n));
  }

  withScope<T>(fn: () => T, scope: Map<string, Value> = new Map()): T {
    this.scopes.push(scope);
    try {
      return fn();
    } finally {
      this.scopes.pop();
    }
  }

  /** Run fn with only the given scope visible (custom function bodies cannot see the caller's Let names). */
  isolated<T>(scope: Map<string, Value>, fn: () => T): T {
    const saved = this.scopes;
    this.scopes = [scope];
    try {
      return fn();
    } finally {
      this.scopes = saved;
    }
  }

  /** Let binding: $names set script variables, other names the innermost scope. */
  bind(name: string, value: Value, rep?: Node): void {
    if (name.startsWith('$')) {
      const m = /^(.*)\[(\d+)\]$/.exec(name);
      if (!this.ctx.setVariable) throw new CalcError(ERR.calculation, `Variables cannot be set here (${name})`);
      this.ctx.setVariable(m ? m[1] : name, rep ? Math.trunc(this.number(rep)) : m ? Number(m[2]) : 1, value);
      return;
    }
    this.scopes[this.scopes.length - 1].set(name.toLowerCase(), value);
  }

  /** TO::Field as GetFieldName gives it. */
  fieldName(occurrence: string | undefined, name: string): string {
    return `${occurrence ?? this.ctx.occurrence ?? ''}::${name}`.replace(/^::/, '');
  }

  /**
   * The field a name stands for: a custom function parameter or Let variable
   * given a field gives its name, one given a value gives null; undefined when
   * the name is neither.
   */
  fieldNameOf(name: string): string | null | undefined {
    const key = name.toLowerCase();
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (!this.scopes[i].has(key)) continue;
      const names = this.parameterFields.get(this.scopes[i]);
      return names ? names.get(key) ?? null : undefined;
    }
    return undefined;
  }

  lookup(name: string): Value | undefined {
    const key = name.toLowerCase();
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const v = this.scopes[i].get(key);
      if (v !== undefined) return v;
    }
    return undefined;
  }

  repetition(n: { rep?: Node }): number {
    if (!n.rep) return this.ctx.calculationRepetition ?? 1;
    return Math.trunc(asNumber(this.v(n.rep)));
  }

  ref(n: Node): FieldRef | undefined {
    if (n.k === 'field') return { occurrence: this.ownOccurrence(n.occurrence), field: n.name, repetition: this.repetition(n) };
    if (n.k === 'var' && !n.name.startsWith('$') && this.lookup(n.name) === undefined) {
      return { field: n.name, repetition: this.repetition(n) };
    }
    return undefined;
  }

  /** TO::Field on the context occurrence is the current record's field. */
  private ownOccurrence(to: string | undefined): string | undefined {
    if (to === undefined) return undefined;
    return this.ctx.occurrence !== undefined && to.toLowerCase() === this.ctx.occurrence.toLowerCase() ? undefined : to;
  }

  readField(ref: FieldRef): Value {
    if (ref.repetition < 1) return EMPTY;
    const v = this.ctx.field?.(ref);
    if (v === undefined) {
      throw new CalcError(ERR.fieldMissing, `The field "${ref.occurrence ? ref.occurrence + '::' : ''}${ref.field}" cannot be found`);
    }
    return v;
  }

  private field(n: Node & { k: 'field' }): Value {
    // A Let name shadows a one-word field of the same name.
    if (!n.occurrence) {
      const local = this.lookup(n.name);
      if (local !== undefined) return local;
    }
    return this.readField(this.ref(n)!);
  }

  /** A one-word name: a Let variable or parameter, a field, or a function written without parentheses (the custom ones are applied by the caller). */
  private variable(n: Node & { k: 'var' }): Value | { custom: CustomFunctionDef } {
    if (this.decimalPlaces !== undefined && n.name.toLowerCase() === 'pi' && !n.name.startsWith('$')) {
      const local = this.lookup(n.name);
      if (local !== undefined) return local;
      return Decimal.pi(this.decimalPlaces).value();
    }
    if (n.name.startsWith('$')) {
      return this.ctx.variable?.(n.name, this.repetition(n)) ?? EMPTY;
    }
    const local = this.lookup(n.name);
    if (local !== undefined) return local;
    const ref = { field: n.name, repetition: this.repetition(n) };
    // Functions without parameters (Random, Self, JSONString, ...) may be written without parentheses.
    const resolved = resolveFunction(n.name, this.ctx);
    if (resolved?.kind === 'builtin' && resolved.fn.min === 0) return this.ctx.field?.(ref) ?? (this.ctx.builtinOff?.(n.name) ? text('?') : resolved.fn.run([], this, n.name));
    // So may an enabled plug-in's functions and custom functions without parameters.
    if (resolved?.kind === 'plugin' && resolved.fn.min === 0) return this.ctx.field?.(ref) ?? resolved.fn.call([], this);
    if (resolved?.kind === 'custom' && !resolved.fn.parameters.length) return this.ctx.field?.(ref) ?? { custom: resolved.fn };
    // And plug-in functions, which give "?" when the plug-in isn't installed.
    if (!resolved && pluginNotInstalled(n.name)) return this.ctx.field?.(ref) ?? text('?');
    return this.readField(ref);
  }

  /**
   * Values an aggregate argument stands for: every related record's value
   * for another occurrence's field, every repetition of a repeating field,
   * otherwise the argument's own value.
   */
  values(n: Node): Value[] {
    return this.valuesDirect(n) ?? [this.v(n)];
  }

  /** The values an aggregate argument stands for without evaluating it (related records, repetitions), or undefined when it is evaluated. */
  private valuesDirect(n: Node): Value[] | undefined {
    const ref = this.ref(n);
    if (ref && !(n.k === 'field' && n.rep) && !(n.k === 'var' && n.rep)) {
      if (ref.occurrence !== undefined) {
        const rel = this.ctx.related?.(ref);
        if (rel) return rel;
        return [this.readField(ref)];
      }
      const reps = this.ctx.repetitions?.({ field: ref.field }) ?? 1;
      if (reps > 1) {
        const out: Value[] = [];
        for (let r = 1; r <= reps; r++) out.push(this.readField({ ...ref, repetition: r }));
        return out;
      }
    }
    return undefined;
  }

  /** A function applied to argument nodes, as a formula's call would be. */
  call(name: string, args: Node[]): Value {
    return this.run(CALL, { k: 'call', name, args }, this.traceDepth, 0, null);
  }

  private compiled = new Map<string, Node>();
  private evaluateDepth = 0;
  /** Set when Evaluate calls reached the limit: until the outermost Evaluate ends, no Evaluate that is inside another runs. */
  private evaluateRefused = false;

  /**
   * Evaluate ( text ): the text read as a formula and evaluated here, an error once Evaluate calls nest past the limit.
   * Once the limit is hit, every Evaluate inside another is refused until the outermost one has ended. EvaluationError
   * can catch the refusal and the text can go on to evaluate itself again, so without this a text that evaluates
   * itself twice would still make a call for every path through 100 levels, far more than the work budget allows.
   */
  evaluateNested(formula: string): Value {
    if (this.evaluateDepth >= MAX_EVALUATE_DEPTH) this.evaluateRefused = true;
    if (this.evaluateRefused && this.evaluateDepth > 0) throw new CalcError(ERR.recursion, `Evaluate is nested more than ${MAX_EVALUATE_DEPTH} levels deep`);
    this.evaluateDepth++;
    try {
      return this.v(this.parse(formula));
    } catch (e) {
      rethrowExecutionRefusal(e);
      // Frames that are already deep (a long custom function recursion) can run the stack out before the limit.
      if (e instanceof RangeError && (e.message.includes('call stack size exceeded') || e.message.includes('too much recursion'))) {
        this.evaluateRefused = true;
        throw new CalcError(ERR.recursion, `Evaluate is nested too deeply (this server's stack ran out at level ${this.evaluateDepth})`);
      }
      throw e;
    } finally {
      if (--this.evaluateDepth === 0) this.evaluateRefused = false;
    }
  }

  /** Parse (once) a formula evaluated within this one: custom functions, Evaluate. */
  parse(formula: string, locals?: string[]): Node {
    let n = this.compiled.get(formula);
    if (!n) {
      n = parse(formula, this.names, locals);
      assertTraversalDepth(n);
      if (this.compiled.size >= EVALUATION_LIMIT.cachedFormulas) this.compiled.clear();
      this.compiled.set(formula, n);
    }
    return n;
  }

  /** The name of the field an argument is, for GetFieldName in the function it is passed to. Read in the scope the argument is written in. */
  private argumentFieldName(a: Node): string | undefined {
    return a.k === 'field' ? this.fieldName(a.occurrence, a.name) : a.k === 'var' && !a.name.startsWith('$') ? this.fieldNameOf(a.name) ?? undefined : undefined;
  }

  private bindValues(name: string, cf: CustomFunctionDef, values: Value[], fieldNames: (string | undefined)[]): Map<string, Value> {
    if (values.length !== cf.parameters.length) {
      throw new CalcError(values.length < cf.parameters.length ? ERR.tooFewParameters : ERR.tooManyParameters, `Wrong number of parameters in ${name}`);
    }
    const scope = new Map<string, Value>();
    // A parameter given a field keeps the field's name, for GetFieldName in the body.
    const names = new Map<string, string>();
    cf.parameters.forEach((param, i) => {
      // The reader trims them; names typed with stray spaces still bind.
      const p = param.trim();
      const fieldName = fieldNames[i];
      if (typeof fieldName === 'string') names.set(p.toLowerCase(), fieldName);
      scope.set(p.toLowerCase(), values[i]);
    });
    this.parameterFields.set(scope, names);
    return scope;
  }

  /** Run a file-defined custom function from a plug-in call under this evaluation's ordinary limits. */
  callFileCustomFunction(name: string, values: Value[]): Value {
    const cf = this.ctx.customFunction?.(name);
    if (!cf) throw new CalcError(ERR.unknownFunction, `The custom function "${name}" cannot be found`);
    this.checkWorkBudget();
    return this.run(cf.call ? APPLY_JS : APPLY_CUSTOM, { k: 'call', name, args: [] }, this.traceDepth, 0, { cf, name, nodes: [], out: values } satisfies CustomCall);
  }

  /** A binary operator (other than and / or) on its evaluated operands; the nodes are read for ^ on an overlong literal. */
  private binary(op: string, a: Value, b: Value, an: Node, bn: Node): Value {
    const decimalOperands = [a, b].some((v) => v.type === 'number' && v.decimal !== undefined);
    const exactLargeOperand = isBeyondDouble(a) || isBeyondDouble(b);
    const decimalMixedWithLargeWhole = decimalOperands && [a, b].some((v) => v.type === 'number'
      && v.decimal === undefined && Math.abs(v.value) > Number.MAX_SAFE_INTEGER);
    const longDecimalOperand = [a, b].some((v) => v.type === 'number' && v.decimal !== undefined
      && v.decimal.replace(/[^0-9]/g, '').replace(/^0+/, '').length > 15);
    const largeWholeDivision = op === '/' && exactLargeOperand && !decimalOperands;
    if ((this.decimalPlaces !== undefined || (decimalOperands && !longDecimalOperand && !decimalMixedWithLargeWhole) || largeWholeDivision)
      && ['+', '-', '*', '/', '^'].includes(op)
      && (op !== '^' || exactOf(b) !== undefined || this.decimalPlaces !== undefined)) {
      if ((op === '+' || op === '-') && (['date', 'time', 'timestamp'].includes(a.type) || ['date', 'time', 'timestamp'].includes(b.type))) {
        return op === '+' ? add(a, b, 1) : subtract(a, b);
      }
      if (op === '/' && isEmpty(a) && isEmpty(b)) return EMPTY;
      if (op === '/' && isEmpty(a)) return EMPTY;
      try {
        const places = this.decimalPlaces ?? 448;
        const x = Decimal.value(a, places), y = Decimal.value(b, places);
        const result = op === '+' ? x.add(y) : op === '-' ? x.sub(y) : op === '*' ? x.mul(y)
          : op === '/' ? x.div(y) : x.pow(y);
        return result.value();
      } catch (e) { if (e instanceof RangeError) return num(NaN); throw e; }
    }
    switch (op) {
      case 'xor': return bool(asBoolean(a) !== asBoolean(b));
      case '&': {
        // Formatting on either side is kept (TextColor ( "Due" ; RGB ( 255 ; 0 ; 0 ) ) & " " & Date).
        const at = this.textOf(a);
        const bt = this.textOf(b);
        checkCalcTextSize(at.length + bt.length);
        const ar = a.type === 'text' ? a.runs : undefined;
        const br = b.type === 'text' ? b.runs : undefined;
        const runs = ar?.length || br?.length ? concatRuns(ar, at.length, br, bt.length) : undefined;
        return runs?.length ? { type: 'text', value: at + bt, runs } : text(at + bt);
      }
      case '+': return add(a, b, 1);
      case '-': return subtract(a, b);
      case '*': return whole(a, b, (x, y) => x * y) ?? num(tidy(asNumber(a) * asNumber(b)));
      case '/': {
        // FileMaker does not stop on division by zero: the result shows as "?".
        // Empty over empty is empty, though (a private sample file stores nothing for
        // Round ( GetAsNumber ( W ) / GetAsNumber ( L ) ; 2 ) when neither holds a digit).
        // So is empty over a number: the same file stores nothing for
        // Round ( GetContainerAttribute ( Image ; "fileSize" ) / 131072 ; 2 ) on an
        // empty container, where IsEmpty ( Image ) beside it shows the formula ran.
        if (isEmpty(a) && isEmpty(b)) return EMPTY;
        const d = asNumber(b);
        if (d === 0) return num(NaN);
        const x = exactOf(a), y = exactOf(b);
        if (x !== undefined && y !== undefined && y !== 0n && x % y === 0n) {
          const quotient = x / y;
          if (isBeyondDouble(a) || isBeyondDouble(b) || !Number.isSafeInteger(Number(quotient))) return fromExact(quotient);
        }
        return isEmpty(a) ? EMPTY : num(tidy(asNumber(a) / d));
      }
      case '^': {
        // An overlong whole-number operand has no value, including for exponents that Math.pow would simplify.
        if ((a.type === 'text' && isOverlongWholeText(a.value)) || (b.type === 'text' && isOverlongWholeText(b.value))
          || (an.k === 'num' && isOverlongWholeText(an.raw ?? ''))
          || (bn.k === 'num' && isOverlongWholeText(bn.raw ?? ''))) return num(NaN);
        const exact = exactPow(a, b);
        if (exact !== undefined && (isBeyondDouble(a) || isBeyondDouble(b) || !Number.isSafeInteger(Number(exact)))) {
          return fromExact(exact);
        }
        const e = asNumber(b);
        const r = Math.pow(asNumber(a), e);
        return num(Number.isInteger(e) ? tidy(r) : r);
      }
      default: return bool(compareOp(op, compareOperands(a, b, this.order, (v) => this.textOf(v))));
    }
  }
}

/**
 * The comparison operators (=, ≠, <, …): if either side is text, both compare
 * as text, so "2" > 10 is true and "Tab-5" ≠ GetAsNumber ( "Tab-5" ), which is
 * how solutions tell a text parameter from a number
 * (https://filemakerhacks.com/2021/03/14/when-2-is-greater-than-10/).
 * Otherwise as compare does.
 */
export function compareOperands(a: Value, b: Value, order: DateStyle = 'MDY', textOf: (v: Value) => string = (v) => asText(v, order)): number {
  const text = (v: Value) => v.type === 'text' || v.type === 'container';
  if ((text(a) || text(b)) && !isEmpty(a) && !isEmpty(b)) return collator.compare(textOf(a), textOf(b));
  return compare(a, b, order);
}

function compareOp(op: string, c: number): boolean {
  switch (op) {
    case '=': return c === 0;
    case '≠': case '<>': return c !== 0;
    case '<': return c < 0;
    case '>': return c > 0;
    case '≤': case '<=': return c <= 0;
    default: return c >= 0;
  }
}

const collator = new Intl.Collator('en', { sensitivity: 'accent', numeric: false });

/**
 * FileMaker comparison: numbers, dates and times compare as numbers; text
 * compares case-insensitively; text against a number compares as numbers
 * when the text holds one. Empty sorts before everything.
 */
export function compare(a: Value, b: Value, order: DateStyle = 'MDY'): number {
  const ae = isEmpty(a);
  const be = isEmpty(b);
  if (ae || be) return ae && be ? 0 : ae ? -1 : 1;
  if (a.type === 'number' && b.type === 'number' && (a.decimal !== undefined || b.decimal !== undefined)) {
    const x = Decimal.value(a, 448).n, y = Decimal.value(b, 448).n;
    return x === y ? 0 : x < y ? -1 : 1;
  }
  const numeric = (v: Value) => v.type !== 'text' && v.type !== 'container';
  if (numeric(a) || numeric(b)) {
    const x = asNumberOrEmpty(a);
    const y = asNumberOrEmpty(b);
    if (x !== undefined && y !== undefined) {
      // Whole numbers past 2^53 compare digit for digit.
      const ex = isBeyondDouble(a) || isBeyondDouble(b) ? exactOf(a) : undefined;
      const ey = ex !== undefined ? exactOf(b) : undefined;
      if (ex !== undefined && ey !== undefined) return ex === ey ? 0 : ex < ey ? -1 : 1;
      return x === y ? 0 : x < y ? -1 : 1;
    }
  }
  return collator.compare(asText(a, order), asText(b, order));
}

/**
 * + - * on whole numbers keep every digit once a number is past 2^53 (a double's reach), as FileMaker's up to 400
 * digits do; undefined when the plain double arithmetic is exact anyway (or an operand isn't a whole number).
 */
function whole(a: Value, b: Value, op: (x: bigint, y: bigint) => bigint): Value | undefined {
  const x = exactOf(a);
  const y = exactOf(b);
  if (x === undefined || y === undefined) return undefined;
  const r = op(x, y);
  if (!isBeyondDouble(a) && !isBeyondDouble(b) && Number.isSafeInteger(Number(r))) return undefined;
  return fromExact(r);
}

function negate(a: Value): Value {
  const e = a.type === 'number' ? a.exact : undefined;
  if (e !== undefined) return fromExact(-e);
  if (a.type === 'time' || a.type === 'timestamp') return { type: a.type, value: -a.value };
  const n = asNumberOrEmpty(a);
  return n === undefined ? EMPTY : num(-n);
}

/** A date, time or timestamp moved by days or seconds; a date or timestamp that leaves its range is "?" (an invalid number), and stays invalid through more arithmetic. */
function moved(from: Value, value: number): Value {
  if (from.type === 'date') return checkedDate(value, from.value);
  if (from.type === 'timestamp') return checkedTimestamp(value, Math.floor(from.value / 86400) + 1);
  return { type: from.type as 'time', value };
}

/** Date + days, time + seconds and timestamp + seconds keep their type, as FileMaker does.
 * Timestamp seconds have no UTC offset: arithmetic can name a skipped or repeated local time at a DST transition. */
function add(a: Value, b: Value, sign: 1 | -1): Value {
  const dated = (v: Value) => v.type === 'date' || v.type === 'time' || v.type === 'timestamp';
  if (dated(a) && !dated(b)) return moved(a, a.value as number + sign * asNumber(b));
  if (dated(b) && !dated(a) && sign === 1) return moved(b, (b.value as number) + asNumber(a));
  if (a.type === 'date' && b.type === 'time') return checkedTimestamp((a.value - 1) * 86400 + sign * b.value, a.value);
  if (a.type === 'timestamp' && b.type === 'time') return moved(a, a.value + sign * b.value);
  return whole(a, b, (x, y) => (sign === 1 ? x + y : x - y)) ?? num(tidySum(asNumber(a), sign * asNumber(b)));
}

function subtract(a: Value, b: Value): Value {
  // Timestamp differences subtract local calendar seconds; they do not measure elapsed UTC time across DST.
  // date - date and timestamp - timestamp are plain numbers (days, seconds); time - time is a time.
  if (a.type === b.type && (a.type === 'date' || a.type === 'timestamp')) return num(a.value - (b.value as number));
  if (a.type === 'time' && b.type === 'time') return { type: 'time', value: a.value - b.value };
  return add(a, b, -1);
}

export { isEmpty };
