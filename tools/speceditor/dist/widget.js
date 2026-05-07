var Yu = Object.defineProperty;
var _a = (e) => {
  throw TypeError(e);
};
var Bu = (e, t, n) => t in e ? Yu(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Ee = (e, t, n) => Bu(e, typeof t != "symbol" ? t + "" : t, n), zo = (e, t, n) => t.has(e) || _a("Cannot " + n);
var y = (e, t, n) => (zo(e, t, "read from private field"), n ? n.call(e) : t.get(e)), K = (e, t, n) => t.has(e) ? _a("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), se = (e, t, n, r) => (zo(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), Me = (e, t, n) => (zo(e, t, "access private method"), n);
var yo = Array.isArray, Ku = Array.prototype.indexOf, lr = Array.prototype.includes, po = Array.from, Xu = Object.defineProperty, ln = Object.getOwnPropertyDescriptor, Ml = Object.getOwnPropertyDescriptors, Cl = Object.prototype, qu = Array.prototype, mo = Object.getPrototypeOf, wa = Object.isExtensible;
function Br(e) {
  return typeof e == "function";
}
const br = () => {
};
function Wu(e) {
  return e();
}
function es(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function Al() {
  var e, t, n = new Promise((r, i) => {
    e = r, t = i;
  });
  return { promise: n, resolve: e, reject: t };
}
function Ye(e, t, n = !1) {
  return e === void 0 ? n ? (
    /** @type {() => V} */
    t()
  ) : (
    /** @type {V} */
    t
  ) : e;
}
function Nn(e, t) {
  if (Array.isArray(e))
    return e;
  if (t === void 0 || !(Symbol.iterator in e))
    return Array.from(e);
  const n = [];
  for (const r of e)
    if (n.push(r), n.length === t) break;
  return n;
}
function Zu(e, t) {
  var n = {};
  for (var r in e)
    t.includes(r) || (n[r] = e[r]);
  for (var i of Object.getOwnPropertySymbols(e))
    Object.propertyIsEnumerable.call(e, i) && !t.includes(i) && (n[i] = e[i]);
  return n;
}
const Re = 2, cr = 4, gi = 8, zs = 1 << 24, yn = 16, Pt = 32, dn = 64, ts = 128, ft = 512, Ae = 1024, Ke = 2048, Rt = 4096, it = 8192, dt = 16384, Vn = 32768, ns = 1 << 25, hn = 65536, xa = 1 << 17, ju = 1 << 18, Fn = 1 << 19, Nl = 1 << 20, Ot = 1 << 25, In = 65536, rs = 1 << 21, Rs = 1 << 22, cn = 1 << 23, Dt = Symbol("$state"), Il = Symbol("legacy props"), Gu = Symbol(""), Bt = new class extends Error {
  constructor() {
    super(...arguments);
    Ee(this, "name", "StaleReactionError");
    Ee(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
var kl;
const Tl = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  !!((kl = globalThis.document) != null && kl.contentType) && /* @__PURE__ */ globalThis.document.contentType.includes("xml")
);
function Ls(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Uu() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Qu(e, t, n) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Ju(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function $u() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function ef(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function tf() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function nf(e) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function rf() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function of() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function sf() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function af() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const lf = 1, cf = 2, Ol = 4, uf = 8, ff = 16, df = 1, hf = 2, gf = 4, vf = 8, yf = 16, Dl = 1, pf = 2, Te = Symbol(), zl = "http://www.w3.org/1999/xhtml", mf = "@attach";
function _f() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function wf() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function Rl(e) {
  return e === this.v;
}
function Ll(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function Hl(e) {
  return !Ll(e, this.v);
}
let Er = !1;
function xf() {
  Er = !0;
}
const bf = [];
function Vl(e, t = !1, n = !1) {
  return Hi(e, /* @__PURE__ */ new Map(), "", bf, null, n);
}
function Hi(e, t, n, r, i = null, o = !1) {
  if (typeof e == "object" && e !== null) {
    var s = t.get(e);
    if (s !== void 0) return s;
    if (e instanceof Map) return (
      /** @type {Snapshot<T>} */
      new Map(e)
    );
    if (e instanceof Set) return (
      /** @type {Snapshot<T>} */
      new Set(e)
    );
    if (yo(e)) {
      var a = (
        /** @type {Snapshot<any>} */
        Array(e.length)
      );
      t.set(e, a), i !== null && t.set(i, a);
      for (var l = 0; l < e.length; l += 1) {
        var c = e[l];
        l in e && (a[l] = Hi(c, t, n, r, null, o));
      }
      return a;
    }
    if (mo(e) === Cl) {
      a = {}, t.set(e, a), i !== null && t.set(i, a);
      for (var f of Object.keys(e))
        a[f] = Hi(
          // @ts-expect-error
          e[f],
          t,
          n,
          r,
          null,
          o
        );
      return a;
    }
    if (e instanceof Date)
      return (
        /** @type {Snapshot<T>} */
        structuredClone(e)
      );
    if (typeof /** @type {T & { toJSON?: any } } */
    e.toJSON == "function" && !o)
      return Hi(
        /** @type {T & { toJSON(): any } } */
        e.toJSON(),
        t,
        n,
        r,
        // Associate the instance with the toJSON clone
        e
      );
  }
  if (e instanceof EventTarget)
    return (
      /** @type {Snapshot<T>} */
      e
    );
  try {
    return (
      /** @type {Snapshot<T>} */
      structuredClone(e)
    );
  } catch {
    return (
      /** @type {Snapshot<T>} */
      e
    );
  }
}
let xe = null;
function ur(e) {
  xe = e;
}
function Hs(e) {
  return (
    /** @type {T} */
    Vs().get(e)
  );
}
function Fl(e, t) {
  return Vs().set(e, t), t;
}
function Ef(e) {
  return Vs().has(e);
}
function ge(e, t = !1, n) {
  xe = {
    p: xe,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      he
    ),
    l: Er && !t ? { s: null, u: null, $: [] } : null
  };
}
function ve(e) {
  var t = (
    /** @type {ComponentContext} */
    xe
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n)
      cc(r);
  }
  return t.i = !0, xe = t.p, /** @type {T} */
  {};
}
function vi() {
  return !Er || xe !== null && xe.l === null;
}
function Vs(e) {
  return xe === null && Ls(), xe.c ?? (xe.c = new Map(kf(xe) || void 0));
}
function kf(e) {
  let t = e.p;
  for (; t !== null; ) {
    const n = t.c;
    if (n !== null)
      return n;
    t = t.p;
  }
  return null;
}
let _n = [];
function Yl() {
  var e = _n;
  _n = [], es(e);
}
function Qt(e) {
  if (_n.length === 0 && !Gr) {
    var t = _n;
    queueMicrotask(() => {
      t === _n && Yl();
    });
  }
  _n.push(e);
}
function Sf() {
  for (; _n.length > 0; )
    Yl();
}
function Bl(e) {
  var t = he;
  if (t === null)
    return fe.f |= cn, e;
  if ((t.f & Vn) === 0 && (t.f & cr) === 0)
    throw e;
  an(e, t);
}
function an(e, t) {
  for (; t !== null; ) {
    if ((t.f & ts) !== 0) {
      if ((t.f & Vn) === 0)
        throw e;
      try {
        t.b.error(e);
        return;
      } catch (n) {
        e = n;
      }
    }
    t = t.parent;
  }
  throw e;
}
const Pf = -7169;
function Ce(e, t) {
  e.f = e.f & Pf | t;
}
function Fs(e) {
  (e.f & ft) !== 0 || e.deps === null ? Ce(e, Ae) : Ce(e, Rt);
}
function Kl(e) {
  if (e !== null)
    for (const t of e)
      (t.f & Re) === 0 || (t.f & In) === 0 || (t.f ^= In, Kl(
        /** @type {Derived} */
        t.deps
      ));
}
function Xl(e, t, n) {
  (e.f & Ke) !== 0 ? t.add(e) : (e.f & Rt) !== 0 && n.add(e), Kl(e.deps), Ce(e, Ae);
}
let Ai = !1;
function Mf(e) {
  var t = Ai;
  try {
    return Ai = !1, [e(), Ai];
  } finally {
    Ai = t;
  }
}
const mn = /* @__PURE__ */ new Set();
let ae = null, Ve = null, is = null, Gr = !1, Ro = !1, jn = null, Vi = null;
var ba = 0;
let Cf = 1;
var tr, nr, rr, ir, si, et, En, Xt, qt, or, Fe, os, ss, as, ls, ql;
const uo = class uo {
  constructor() {
    K(this, Fe);
    // for debugging. TODO remove once async is stable
    Ee(this, "id", Cf++);
    /**
     * The current values of any sources that are updated in this batch
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Source, any>}
     */
    Ee(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any sources that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Source, any>}
     */
    Ee(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    K(this, tr, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    K(this, nr, /* @__PURE__ */ new Set());
    /**
     * The number of async effects that are currently in flight
     */
    K(this, rr, 0);
    /**
     * The number of async effects that are currently in flight, _not_ inside a pending boundary
     */
    K(this, ir, 0);
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    K(this, si, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    K(this, et, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    K(this, En, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    K(this, Xt, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    K(this, qt, /* @__PURE__ */ new Map());
    Ee(this, "is_fork", !1);
    K(this, or, !1);
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    y(this, qt).has(t) || y(this, qt).set(t, { d: [], m: [] });
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   */
  unskip_effect(t) {
    var n = y(this, qt).get(t);
    if (n) {
      y(this, qt).delete(t);
      for (var r of n.d)
        Ce(r, Ke), this.schedule(r);
      for (r of n.m)
        Ce(r, Rt), this.schedule(r);
    }
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Source} source
   * @param {any} old_value
   */
  capture(t, n) {
    n !== Te && !this.previous.has(t) && this.previous.set(t, n), (t.f & cn) === 0 && (this.current.set(t, t.v), Ve == null || Ve.set(t, t.v));
  }
  activate() {
    ae = this;
  }
  deactivate() {
    ae = null, Ve = null;
  }
  flush() {
    try {
      Ro = !0, ae = this, Me(this, Fe, ss).call(this);
    } finally {
      ba = 0, is = null, jn = null, Vi = null, Ro = !1, ae = null, Ve = null, un.clear();
    }
  }
  discard() {
    for (const t of y(this, nr)) t(this);
    y(this, nr).clear(), mn.delete(this);
  }
  /**
   *
   * @param {boolean} blocking
   */
  increment(t) {
    se(this, rr, y(this, rr) + 1), t && se(this, ir, y(this, ir) + 1);
  }
  /**
   * @param {boolean} blocking
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(t, n) {
    se(this, rr, y(this, rr) - 1), t && se(this, ir, y(this, ir) - 1), !(y(this, or) || n) && (se(this, or, !0), Qt(() => {
      se(this, or, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, n) {
    for (const r of t)
      y(this, En).add(r);
    for (const r of n)
      y(this, Xt).add(r);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    y(this, tr).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    y(this, nr).add(t);
  }
  settled() {
    return (y(this, si) ?? se(this, si, Al())).promise;
  }
  static ensure() {
    if (ae === null) {
      const t = ae = new uo();
      Ro || (mn.add(ae), Gr || Qt(() => {
        ae === t && t.flush();
      }));
    }
    return ae;
  }
  apply() {
    {
      Ve = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    var i;
    if (is = t, (i = t.b) != null && i.is_pending && (t.f & (cr | gi | zs)) !== 0 && (t.f & Vn) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var r = n.f;
      if (jn !== null && n === he && (fe === null || (fe.f & Re) === 0))
        return;
      if ((r & (dn | Pt)) !== 0) {
        if ((r & Ae) === 0)
          return;
        n.f ^= Ae;
      }
    }
    y(this, et).push(n);
  }
};
tr = new WeakMap(), nr = new WeakMap(), rr = new WeakMap(), ir = new WeakMap(), si = new WeakMap(), et = new WeakMap(), En = new WeakMap(), Xt = new WeakMap(), qt = new WeakMap(), or = new WeakMap(), Fe = new WeakSet(), os = function() {
  return this.is_fork || y(this, ir) > 0;
}, ss = function() {
  var a, l;
  if (ba++ > 1e3 && (mn.delete(this), Nf()), !Me(this, Fe, os).call(this)) {
    for (const c of y(this, En))
      y(this, Xt).delete(c), Ce(c, Ke), this.schedule(c);
    for (const c of y(this, Xt))
      Ce(c, Rt), this.schedule(c);
  }
  const t = y(this, et);
  se(this, et, []), this.apply();
  var n = jn = [], r = [], i = Vi = [];
  for (const c of t)
    try {
      Me(this, Fe, as).call(this, c, n, r);
    } catch (f) {
      throw Gl(c), f;
    }
  if (ae = null, i.length > 0) {
    var o = uo.ensure();
    for (const c of i)
      o.schedule(c);
  }
  if (jn = null, Vi = null, Me(this, Fe, os).call(this)) {
    Me(this, Fe, ls).call(this, r), Me(this, Fe, ls).call(this, n);
    for (const [c, f] of y(this, qt))
      jl(c, f);
  } else {
    y(this, rr) === 0 && mn.delete(this), y(this, En).clear(), y(this, Xt).clear();
    for (const c of y(this, tr)) c(this);
    y(this, tr).clear(), Ea(r), Ea(n), (a = y(this, si)) == null || a.resolve();
  }
  var s = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    ae
  );
  if (y(this, et).length > 0) {
    const c = s ?? (s = this);
    y(c, et).push(...y(this, et).filter((f) => !y(c, et).includes(f)));
  }
  s !== null && (mn.add(s), Me(l = s, Fe, ss).call(l)), mn.has(this) || Me(this, Fe, ql).call(this);
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
as = function(t, n, r) {
  t.f ^= Ae;
  for (var i = t.first; i !== null; ) {
    var o = i.f, s = (o & (Pt | dn)) !== 0, a = s && (o & Ae) !== 0, l = a || (o & it) !== 0 || y(this, qt).has(i);
    if (!l && i.fn !== null) {
      s ? i.f ^= Ae : (o & cr) !== 0 ? n.push(i) : _i(i) && ((o & yn) !== 0 && y(this, Xt).add(i), dr(i));
      var c = i.first;
      if (c !== null) {
        i = c;
        continue;
      }
    }
    for (; i !== null; ) {
      var f = i.next;
      if (f !== null) {
        i = f;
        break;
      }
      i = i.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
ls = function(t) {
  for (var n = 0; n < t.length; n += 1)
    Xl(t[n], y(this, En), y(this, Xt));
}, ql = function() {
  var l;
  for (const c of mn) {
    var t = c.id < this.id, n = [];
    for (const [f, h] of this.current) {
      if (c.current.has(f))
        if (t && h !== c.current.get(f))
          c.current.set(f, h);
        else
          continue;
      n.push(f);
    }
    var r = [...c.current.keys()].filter((f) => !this.current.has(f));
    if (r.length === 0)
      t && c.discard();
    else if (n.length > 0) {
      c.activate();
      var i = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Map();
      for (var s of n)
        Wl(s, r, i, o);
      if (y(c, et).length > 0) {
        c.apply();
        for (var a of y(c, et))
          Me(l = c, Fe, as).call(l, a, [], []);
        se(c, et, []);
      }
      c.deactivate();
    }
  }
};
let gn = uo;
function Af(e) {
  var t = Gr;
  Gr = !0;
  try {
    for (var n; ; ) {
      if (Sf(), ae === null)
        return (
          /** @type {T} */
          n
        );
      ae.flush();
    }
  } finally {
    Gr = t;
  }
}
function Nf() {
  try {
    tf();
  } catch (e) {
    an(e, is);
  }
}
let _t = null;
function Ea(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var r = e[n++];
      if ((r.f & (dt | it)) === 0 && _i(r) && (_t = /* @__PURE__ */ new Set(), dr(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && gc(r), (_t == null ? void 0 : _t.size) > 0)) {
        un.clear();
        for (const i of _t) {
          if ((i.f & (dt | it)) !== 0) continue;
          const o = [i];
          let s = i.parent;
          for (; s !== null; )
            _t.has(s) && (_t.delete(s), o.push(s)), s = s.parent;
          for (let a = o.length - 1; a >= 0; a--) {
            const l = o[a];
            (l.f & (dt | it)) === 0 && dr(l);
          }
        }
        _t.clear();
      }
    }
    _t = null;
  }
}
function Wl(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const i of e.reactions) {
      const o = i.f;
      (o & Re) !== 0 ? Wl(
        /** @type {Derived} */
        i,
        t,
        n,
        r
      ) : (o & (Rs | yn)) !== 0 && (o & Ke) === 0 && Zl(i, t, r) && (Ce(i, Ke), Ys(
        /** @type {Effect} */
        i
      ));
    }
}
function Zl(e, t, n) {
  const r = n.get(e);
  if (r !== void 0) return r;
  if (e.deps !== null)
    for (const i of e.deps) {
      if (lr.call(t, i))
        return !0;
      if ((i.f & Re) !== 0 && Zl(
        /** @type {Derived} */
        i,
        t,
        n
      ))
        return n.set(
          /** @type {Derived} */
          i,
          !0
        ), !0;
    }
  return n.set(e, !1), !1;
}
function Ys(e) {
  ae.schedule(e);
}
function jl(e, t) {
  if (!((e.f & Pt) !== 0 && (e.f & Ae) !== 0)) {
    (e.f & Ke) !== 0 ? t.d.push(e) : (e.f & Rt) !== 0 && t.m.push(e), Ce(e, Ae);
    for (var n = e.first; n !== null; )
      jl(n, t), n = n.next;
  }
}
function Gl(e) {
  Ce(e, Ae);
  for (var t = e.first; t !== null; )
    Gl(t), t = t.next;
}
function Ul(e) {
  let t = 0, n = Tn(0), r;
  return () => {
    Xs() && (u(n), wo(() => (t === 0 && (r = Qe(() => e(() => Ur(n)))), t += 1, () => {
      Qt(() => {
        t -= 1, t === 0 && (r == null || r(), r = void 0, Ur(n));
      });
    })));
  };
}
var If = hn | Fn;
function Tf(e, t, n, r) {
  new Of(e, t, n, r);
}
var ct, Ds, At, kn, We, Nt, tt, wt, Wt, Sn, on, sr, ai, li, Zt, fo, Ne, Df, zf, Rf, cs, Fi, Yi, us;
class Of {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, r, i) {
    K(this, Ne);
    /** @type {Boundary | null} */
    Ee(this, "parent");
    Ee(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    Ee(this, "transform_error");
    /** @type {TemplateNode} */
    K(this, ct);
    /** @type {TemplateNode | null} */
    K(this, Ds, null);
    /** @type {BoundaryProps} */
    K(this, At);
    /** @type {((anchor: Node) => void)} */
    K(this, kn);
    /** @type {Effect} */
    K(this, We);
    /** @type {Effect | null} */
    K(this, Nt, null);
    /** @type {Effect | null} */
    K(this, tt, null);
    /** @type {Effect | null} */
    K(this, wt, null);
    /** @type {DocumentFragment | null} */
    K(this, Wt, null);
    K(this, Sn, 0);
    K(this, on, 0);
    K(this, sr, !1);
    /** @type {Set<Effect>} */
    K(this, ai, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    K(this, li, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    K(this, Zt, null);
    K(this, fo, Ul(() => (se(this, Zt, Tn(y(this, Sn))), () => {
      se(this, Zt, null);
    })));
    var o;
    se(this, ct, t), se(this, At, n), se(this, kn, (s) => {
      var a = (
        /** @type {Effect} */
        he
      );
      a.b = this, a.f |= ts, r(s);
    }), this.parent = /** @type {Effect} */
    he.b, this.transform_error = i ?? ((o = this.parent) == null ? void 0 : o.transform_error) ?? ((s) => s), se(this, We, mi(() => {
      Me(this, Ne, cs).call(this);
    }, If));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    Xl(t, y(this, ai), y(this, li));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!y(this, At).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    Me(this, Ne, us).call(this, t, n), se(this, Sn, y(this, Sn) + t), !(!y(this, Zt) || y(this, sr)) && (se(this, sr, !0), Qt(() => {
      se(this, sr, !1), y(this, Zt) && fr(y(this, Zt), y(this, Sn));
    }));
  }
  get_effect_pending() {
    return y(this, fo).call(this), u(
      /** @type {Source<number>} */
      y(this, Zt)
    );
  }
  /** @param {unknown} error */
  error(t) {
    var n = y(this, At).onerror;
    let r = y(this, At).failed;
    if (!n && !r)
      throw t;
    y(this, Nt) && (De(y(this, Nt)), se(this, Nt, null)), y(this, tt) && (De(y(this, tt)), se(this, tt, null)), y(this, wt) && (De(y(this, wt)), se(this, wt, null));
    var i = !1, o = !1;
    const s = () => {
      if (i) {
        wf();
        return;
      }
      i = !0, o && af(), y(this, wt) !== null && Mn(y(this, wt), () => {
        se(this, wt, null);
      }), Me(this, Ne, Yi).call(this, () => {
        Me(this, Ne, cs).call(this);
      });
    }, a = (l) => {
      try {
        o = !0, n == null || n(l, s), o = !1;
      } catch (c) {
        an(c, y(this, We) && y(this, We).parent);
      }
      r && se(this, wt, Me(this, Ne, Yi).call(this, () => {
        try {
          return Ge(() => {
            var c = (
              /** @type {Effect} */
              he
            );
            c.b = this, c.f |= ts, r(
              y(this, ct),
              () => l,
              () => s
            );
          });
        } catch (c) {
          return an(
            c,
            /** @type {Effect} */
            y(this, We).parent
          ), null;
        }
      }));
    };
    Qt(() => {
      var l;
      try {
        l = this.transform_error(t);
      } catch (c) {
        an(c, y(this, We) && y(this, We).parent);
        return;
      }
      l !== null && typeof l == "object" && typeof /** @type {any} */
      l.then == "function" ? l.then(
        a,
        /** @param {unknown} e */
        (c) => an(c, y(this, We) && y(this, We).parent)
      ) : a(l);
    });
  }
}
ct = new WeakMap(), Ds = new WeakMap(), At = new WeakMap(), kn = new WeakMap(), We = new WeakMap(), Nt = new WeakMap(), tt = new WeakMap(), wt = new WeakMap(), Wt = new WeakMap(), Sn = new WeakMap(), on = new WeakMap(), sr = new WeakMap(), ai = new WeakMap(), li = new WeakMap(), Zt = new WeakMap(), fo = new WeakMap(), Ne = new WeakSet(), Df = function() {
  try {
    se(this, Nt, Ge(() => y(this, kn).call(this, y(this, ct))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
zf = function(t) {
  const n = y(this, At).failed;
  n && se(this, wt, Ge(() => {
    n(
      y(this, ct),
      () => t,
      () => () => {
      }
    );
  }));
}, Rf = function() {
  const t = y(this, At).pending;
  t && (this.is_pending = !0, se(this, tt, Ge(() => t(y(this, ct)))), Qt(() => {
    var n = se(this, Wt, document.createDocumentFragment()), r = Jt();
    n.append(r), se(this, Nt, Me(this, Ne, Yi).call(this, () => Ge(() => y(this, kn).call(this, r)))), y(this, on) === 0 && (y(this, ct).before(n), se(this, Wt, null), Mn(
      /** @type {Effect} */
      y(this, tt),
      () => {
        se(this, tt, null);
      }
    ), Me(this, Ne, Fi).call(
      this,
      /** @type {Batch} */
      ae
    ));
  }));
}, cs = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), se(this, on, 0), se(this, Sn, 0), se(this, Nt, Ge(() => {
      y(this, kn).call(this, y(this, ct));
    })), y(this, on) > 0) {
      var t = se(this, Wt, document.createDocumentFragment());
      js(y(this, Nt), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        y(this, At).pending
      );
      se(this, tt, Ge(() => n(y(this, ct))));
    } else
      Me(this, Ne, Fi).call(
        this,
        /** @type {Batch} */
        ae
      );
  } catch (n) {
    this.error(n);
  }
}, /**
 * @param {Batch} batch
 */
Fi = function(t) {
  this.is_pending = !1, t.transfer_effects(y(this, ai), y(this, li));
}, /**
 * @template T
 * @param {() => T} fn
 */
Yi = function(t) {
  var n = he, r = fe, i = xe;
  Lt(y(this, We)), vt(y(this, We)), ur(y(this, We).ctx);
  try {
    return gn.ensure(), t();
  } catch (o) {
    return Bl(o), null;
  } finally {
    Lt(n), vt(r), ur(i);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
us = function(t, n) {
  var r;
  if (!this.has_pending_snippet()) {
    this.parent && Me(r = this.parent, Ne, us).call(r, t, n);
    return;
  }
  se(this, on, y(this, on) + t), y(this, on) === 0 && (Me(this, Ne, Fi).call(this, n), y(this, tt) && Mn(y(this, tt), () => {
    se(this, tt, null);
  }), y(this, Wt) && (y(this, ct).before(y(this, Wt)), se(this, Wt, null)));
};
function Ql(e, t, n, r) {
  const i = vi() ? yi : Bs;
  var o = e.filter((d) => !d.settled);
  if (n.length === 0 && o.length === 0) {
    r(t.map(i));
    return;
  }
  var s = (
    /** @type {Effect} */
    he
  ), a = Lf(), l = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((d) => d.promise)) : null;
  function c(d) {
    a();
    try {
      r(d);
    } catch (v) {
      (s.f & dt) === 0 && an(v, s);
    }
    ji();
  }
  if (n.length === 0) {
    l.then(() => c(t.map(i)));
    return;
  }
  var f = Jl();
  function h() {
    Promise.all(n.map((d) => /* @__PURE__ */ Hf(d))).then((d) => c([...t.map(i), ...d])).catch((d) => an(d, s)).finally(() => f());
  }
  l ? l.then(() => {
    a(), h(), ji();
  }) : h();
}
function Lf() {
  var e = (
    /** @type {Effect} */
    he
  ), t = fe, n = xe, r = (
    /** @type {Batch} */
    ae
  );
  return function(o = !0) {
    Lt(e), vt(t), ur(n), o && (e.f & dt) === 0 && (r == null || r.activate(), r == null || r.apply());
  };
}
function ji(e = !0) {
  Lt(null), vt(null), ur(null), e && (ae == null || ae.deactivate());
}
function Jl() {
  var e = (
    /** @type {Boundary} */
    /** @type {Effect} */
    he.b
  ), t = (
    /** @type {Batch} */
    ae
  ), n = e.is_rendered();
  return e.update_pending_count(1, t), t.increment(n), (r = !1) => {
    e.update_pending_count(-1, t), t.decrement(n, r);
  };
}
// @__NO_SIDE_EFFECTS__
function yi(e) {
  var t = Re | Ke, n = fe !== null && (fe.f & Re) !== 0 ? (
    /** @type {Derived} */
    fe
  ) : null;
  return he !== null && (he.f |= Fn), {
    ctx: xe,
    deps: null,
    effects: null,
    equals: Rl,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Te
    ),
    wv: 0,
    parent: n ?? he,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function Hf(e, t, n) {
  let r = (
    /** @type {Effect | null} */
    he
  );
  r === null && Uu();
  var i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = Tn(
    /** @type {V} */
    Te
  ), s = !fe, a = /* @__PURE__ */ new Map();
  return Jf(() => {
    var v;
    var l = (
      /** @type {Effect} */
      he
    ), c = Al();
    i = c.promise;
    try {
      Promise.resolve(e()).then(c.resolve, c.reject).finally(ji);
    } catch (m) {
      c.reject(m), ji();
    }
    var f = (
      /** @type {Batch} */
      ae
    );
    if (s) {
      if ((l.f & Vn) !== 0)
        var h = Jl();
      if (
        /** @type {Boundary} */
        r.b.is_rendered()
      )
        (v = a.get(f)) == null || v.reject(Bt), a.delete(f);
      else {
        for (const m of a.values())
          m.reject(Bt);
        a.clear();
      }
      a.set(f, c);
    }
    const d = (m, _ = void 0) => {
      if (h) {
        var w = _ === Bt;
        h(w);
      }
      if (!(_ === Bt || (l.f & dt) !== 0)) {
        if (f.activate(), _)
          o.f |= cn, fr(o, _);
        else {
          (o.f & cn) !== 0 && (o.f ^= cn), fr(o, m);
          for (const [S, N] of a) {
            if (a.delete(S), S === f) break;
            N.reject(Bt);
          }
        }
        f.deactivate();
      }
    };
    c.promise.then(d, (m) => d(null, m || "unknown"));
  }), qs(() => {
    for (const l of a.values())
      l.reject(Bt);
  }), new Promise((l) => {
    function c(f) {
      function h() {
        f === i ? l(o) : c(i);
      }
      f.then(h, h);
    }
    c(i);
  });
}
// @__NO_SIDE_EFFECTS__
function b(e) {
  const t = /* @__PURE__ */ yi(e);
  return pc(t), t;
}
// @__NO_SIDE_EFFECTS__
function Bs(e) {
  const t = /* @__PURE__ */ yi(e);
  return t.equals = Hl, t;
}
function Vf(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      De(
        /** @type {Effect} */
        t[n]
      );
  }
}
function Ff(e) {
  for (var t = e.parent; t !== null; ) {
    if ((t.f & Re) === 0)
      return (t.f & dt) === 0 ? (
        /** @type {Effect} */
        t
      ) : null;
    t = t.parent;
  }
  return null;
}
function Ks(e) {
  var t, n = he;
  Lt(Ff(e));
  try {
    e.f &= ~In, Vf(e), t = xc(e);
  } finally {
    Lt(n);
  }
  return t;
}
function $l(e) {
  var t = e.v, n = Ks(e);
  if (!e.equals(n) && (e.wv = _c(), (!(ae != null && ae.is_fork) || e.deps === null) && (e.v = n, ae == null || ae.capture(e, t), e.deps === null))) {
    Ce(e, Ae);
    return;
  }
  vn || (Ve !== null ? (Xs() || ae != null && ae.is_fork) && Ve.set(e, n) : Fs(e));
}
function Yf(e) {
  var t, n;
  if (e.effects !== null)
    for (const r of e.effects)
      (r.teardown || r.ac) && ((t = r.teardown) == null || t.call(r), (n = r.ac) == null || n.abort(Bt), r.teardown = br, r.ac = null, $r(r, 0), Ws(r));
}
function ec(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && dr(t);
}
let fs = /* @__PURE__ */ new Set();
const un = /* @__PURE__ */ new Map();
let tc = !1;
function Tn(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: Rl,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function ue(e, t) {
  const n = Tn(e);
  return pc(n), n;
}
// @__NO_SIDE_EFFECTS__
function Bf(e, t = !1, n = !0) {
  var i;
  const r = Tn(e);
  return t || (r.equals = Hl), Er && n && xe !== null && xe.l !== null && ((i = xe.l).s ?? (i.s = [])).push(r), r;
}
function q(e, t, n = !1) {
  fe !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!kt || (fe.f & xa) !== 0) && vi() && (fe.f & (Re | yn | Rs | xa)) !== 0 && (gt === null || !lr.call(gt, e)) && sf();
  let r = n ? Ue(t) : t;
  return fr(e, r, Vi);
}
function fr(e, t, n = null) {
  if (!e.equals(t)) {
    var r = e.v;
    vn ? un.set(e, t) : un.set(e, r), e.v = t;
    var i = gn.ensure();
    if (i.capture(e, r), (e.f & Re) !== 0) {
      const o = (
        /** @type {Derived} */
        e
      );
      (e.f & Ke) !== 0 && Ks(o), Ve === null && Fs(o);
    }
    e.wv = _c(), nc(e, Ke, n), vi() && he !== null && (he.f & Ae) !== 0 && (he.f & (Pt | dn)) === 0 && (lt === null ? td([e]) : lt.push(e)), !i.is_fork && fs.size > 0 && !tc && Kf();
  }
  return t;
}
function Kf() {
  tc = !1;
  for (const e of fs)
    (e.f & Ae) !== 0 && Ce(e, Rt), _i(e) && dr(e);
  fs.clear();
}
function Ur(e) {
  q(e, e.v + 1);
}
function nc(e, t, n) {
  var r = e.reactions;
  if (r !== null)
    for (var i = vi(), o = r.length, s = 0; s < o; s++) {
      var a = r[s], l = a.f;
      if (!(!i && a === he)) {
        var c = (l & Ke) === 0;
        if (c && Ce(a, t), (l & Re) !== 0) {
          var f = (
            /** @type {Derived} */
            a
          );
          Ve == null || Ve.delete(f), (l & In) === 0 && (l & ft && (a.f |= In), nc(f, Rt, n));
        } else if (c) {
          var h = (
            /** @type {Effect} */
            a
          );
          (l & yn) !== 0 && _t !== null && _t.add(h), n !== null ? n.push(h) : Ys(h);
        }
      }
    }
}
function Ue(e) {
  if (typeof e != "object" || e === null || Dt in e)
    return e;
  const t = mo(e);
  if (t !== Cl && t !== qu)
    return e;
  var n = /* @__PURE__ */ new Map(), r = yo(e), i = /* @__PURE__ */ ue(0), o = Cn, s = (a) => {
    if (Cn === o)
      return a();
    var l = fe, c = Cn;
    vt(null), Ma(o);
    var f = a();
    return vt(l), Ma(c), f;
  };
  return r && n.set("length", /* @__PURE__ */ ue(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(a, l, c) {
        (!("value" in c) || c.configurable === !1 || c.enumerable === !1 || c.writable === !1) && rf();
        var f = n.get(l);
        return f === void 0 ? s(() => {
          var h = /* @__PURE__ */ ue(c.value);
          return n.set(l, h), h;
        }) : q(f, c.value, !0), !0;
      },
      deleteProperty(a, l) {
        var c = n.get(l);
        if (c === void 0) {
          if (l in a) {
            const f = s(() => /* @__PURE__ */ ue(Te));
            n.set(l, f), Ur(i);
          }
        } else
          q(c, Te), Ur(i);
        return !0;
      },
      get(a, l, c) {
        var v;
        if (l === Dt)
          return e;
        var f = n.get(l), h = l in a;
        if (f === void 0 && (!h || (v = ln(a, l)) != null && v.writable) && (f = s(() => {
          var m = Ue(h ? a[l] : Te), _ = /* @__PURE__ */ ue(m);
          return _;
        }), n.set(l, f)), f !== void 0) {
          var d = u(f);
          return d === Te ? void 0 : d;
        }
        return Reflect.get(a, l, c);
      },
      getOwnPropertyDescriptor(a, l) {
        var c = Reflect.getOwnPropertyDescriptor(a, l);
        if (c && "value" in c) {
          var f = n.get(l);
          f && (c.value = u(f));
        } else if (c === void 0) {
          var h = n.get(l), d = h == null ? void 0 : h.v;
          if (h !== void 0 && d !== Te)
            return {
              enumerable: !0,
              configurable: !0,
              value: d,
              writable: !0
            };
        }
        return c;
      },
      has(a, l) {
        var d;
        if (l === Dt)
          return !0;
        var c = n.get(l), f = c !== void 0 && c.v !== Te || Reflect.has(a, l);
        if (c !== void 0 || he !== null && (!f || (d = ln(a, l)) != null && d.writable)) {
          c === void 0 && (c = s(() => {
            var v = f ? Ue(a[l]) : Te, m = /* @__PURE__ */ ue(v);
            return m;
          }), n.set(l, c));
          var h = u(c);
          if (h === Te)
            return !1;
        }
        return f;
      },
      set(a, l, c, f) {
        var M;
        var h = n.get(l), d = l in a;
        if (r && l === "length")
          for (var v = c; v < /** @type {Source<number>} */
          h.v; v += 1) {
            var m = n.get(v + "");
            m !== void 0 ? q(m, Te) : v in a && (m = s(() => /* @__PURE__ */ ue(Te)), n.set(v + "", m));
          }
        if (h === void 0)
          (!d || (M = ln(a, l)) != null && M.writable) && (h = s(() => /* @__PURE__ */ ue(void 0)), q(h, Ue(c)), n.set(l, h));
        else {
          d = h.v !== Te;
          var _ = s(() => Ue(c));
          q(h, _);
        }
        var w = Reflect.getOwnPropertyDescriptor(a, l);
        if (w != null && w.set && w.set.call(f, c), !d) {
          if (r && typeof l == "string") {
            var S = (
              /** @type {Source<number>} */
              n.get("length")
            ), N = Number(l);
            Number.isInteger(N) && N >= S.v && q(S, N + 1);
          }
          Ur(i);
        }
        return !0;
      },
      ownKeys(a) {
        u(i);
        var l = Reflect.ownKeys(a).filter((h) => {
          var d = n.get(h);
          return d === void 0 || d.v !== Te;
        });
        for (var [c, f] of n)
          f.v !== Te && !(c in a) && l.push(c);
        return l;
      },
      setPrototypeOf() {
        of();
      }
    }
  );
}
function ka(e) {
  try {
    if (e !== null && typeof e == "object" && Dt in e)
      return e[Dt];
  } catch {
  }
  return e;
}
function Xf(e, t) {
  return Object.is(ka(e), ka(t));
}
var qe, rc, ic, oc;
function qf() {
  if (qe === void 0) {
    qe = window, rc = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    ic = ln(t, "firstChild").get, oc = ln(t, "nextSibling").get, wa(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), wa(n) && (n.__t = void 0);
  }
}
function Jt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function jt(e) {
  return (
    /** @type {TemplateNode | null} */
    ic.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function pi(e) {
  return (
    /** @type {TemplateNode | null} */
    oc.call(e)
  );
}
function ie(e, t) {
  return /* @__PURE__ */ jt(e);
}
function Oe(e, t = !1) {
  {
    var n = /* @__PURE__ */ jt(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ pi(n) : n;
  }
}
function re(e, t = 1, n = !1) {
  let r = e;
  for (; t--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ pi(r);
  return r;
}
function Wf(e) {
  e.textContent = "";
}
function sc() {
  return !1;
}
function Zf(e, t, n) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(zl, e, void 0)
  );
}
function jf(e, t) {
  if (t) {
    const n = document.body;
    e.autofocus = !0, Qt(() => {
      document.activeElement === n && e.focus();
    });
  }
}
let Sa = !1;
function Gf() {
  Sa || (Sa = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        var t;
        if (!e.defaultPrevented)
          for (
            const n of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            (t = n.__on_r) == null || t.call(n);
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
    { capture: !0 }
  ));
}
function _o(e) {
  var t = fe, n = he;
  vt(null), Lt(null);
  try {
    return e();
  } finally {
    vt(t), Lt(n);
  }
}
function ac(e, t, n, r = n) {
  e.addEventListener(t, () => _o(n));
  const i = e.__on_r;
  i ? e.__on_r = () => {
    i(), r(!0);
  } : e.__on_r = () => r(!0), Gf();
}
function lc(e) {
  he === null && (fe === null && ef(), $u()), vn && Ju();
}
function Uf(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function yt(e, t) {
  var n = he;
  n !== null && (n.f & it) !== 0 && (e |= it);
  var r = {
    ctx: xe,
    deps: null,
    nodes: null,
    f: e | Ke | ft,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: n,
    b: n && n.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null
  }, i = r;
  if ((e & cr) !== 0)
    jn !== null ? jn.push(r) : gn.ensure().schedule(r);
  else if (t !== null) {
    try {
      dr(r);
    } catch (s) {
      throw De(r), s;
    }
    i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && // either `null`, or a singular child
    (i.f & Fn) === 0 && (i = i.first, (e & yn) !== 0 && (e & hn) !== 0 && i !== null && (i.f |= hn));
  }
  if (i !== null && (i.parent = n, n !== null && Uf(i, n), fe !== null && (fe.f & Re) !== 0 && (e & dn) === 0)) {
    var o = (
      /** @type {Derived} */
      fe
    );
    (o.effects ?? (o.effects = [])).push(i);
  }
  return r;
}
function Xs() {
  return fe !== null && !kt;
}
function qs(e) {
  const t = yt(gi, null);
  return Ce(t, Ae), t.teardown = e, t;
}
function ht(e) {
  lc();
  var t = (
    /** @type {Effect} */
    he.f
  ), n = !fe && (t & Pt) !== 0 && (t & Vn) === 0;
  if (n) {
    var r = (
      /** @type {ComponentContext} */
      xe
    );
    (r.e ?? (r.e = [])).push(e);
  } else
    return cc(e);
}
function cc(e) {
  return yt(cr | Nl, e);
}
function uc(e) {
  return lc(), yt(gi | Nl, e);
}
function fc(e) {
  gn.ensure();
  const t = yt(dn | Fn, e);
  return () => {
    De(t);
  };
}
function Qf(e) {
  gn.ensure();
  const t = yt(dn | Fn, e);
  return (n = {}) => new Promise((r) => {
    n.outro ? Mn(t, () => {
      De(t), r(void 0);
    }) : (De(t), r(void 0));
  });
}
function kr(e) {
  return yt(cr, e);
}
function Jf(e) {
  return yt(Rs | Fn, e);
}
function wo(e, t = 0) {
  return yt(gi | t, e);
}
function me(e, t = [], n = [], r = []) {
  Ql(r, t, n, (i) => {
    yt(gi, () => e(...i.map(u)));
  });
}
function mi(e, t = 0) {
  var n = yt(yn | t, e);
  return n;
}
function dc(e, t = 0) {
  var n = yt(zs | t, e);
  return n;
}
function Ge(e) {
  return yt(Pt | Fn, e);
}
function hc(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = vn, r = fe;
    Pa(!0), vt(null);
    try {
      t.call(null);
    } finally {
      Pa(n), vt(r);
    }
  }
}
function Ws(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const i = n.ac;
    i !== null && _o(() => {
      i.abort(Bt);
    });
    var r = n.next;
    (n.f & dn) !== 0 ? n.parent = null : De(n, t), n = r;
  }
}
function $f(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & Pt) === 0 && De(t), t = n;
  }
}
function De(e, t = !0) {
  var n = !1;
  (t || (e.f & ju) !== 0) && e.nodes !== null && e.nodes.end !== null && (ed(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), Ce(e, ns), Ws(e, t && !n), $r(e, 0);
  var r = e.nodes && e.nodes.t;
  if (r !== null)
    for (const o of r)
      o.stop();
  hc(e), e.f ^= ns, e.f |= dt;
  var i = e.parent;
  i !== null && i.first !== null && gc(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = null;
}
function ed(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ pi(e);
    e.remove(), e = n;
  }
}
function gc(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Mn(e, t, n = !0) {
  var r = [];
  vc(e, r, !0);
  var i = () => {
    n && De(e), t && t();
  }, o = r.length;
  if (o > 0) {
    var s = () => --o || i();
    for (var a of r)
      a.out(s);
  } else
    i();
}
function vc(e, t, n) {
  if ((e.f & it) === 0) {
    e.f ^= it;
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const a of r)
        (a.is_global || n) && t.push(a);
    for (var i = e.first; i !== null; ) {
      var o = i.next, s = (i.f & hn) !== 0 || // If this is a branch effect without a block effect parent,
      // it means the parent block effect was pruned. In that case,
      // transparency information was transferred to the branch effect.
      (i.f & Pt) !== 0 && (e.f & yn) !== 0;
      vc(i, t, s ? n : !1), i = o;
    }
  }
}
function Zs(e) {
  yc(e, !0);
}
function yc(e, t) {
  if ((e.f & it) !== 0) {
    e.f ^= it, (e.f & Ae) === 0 && (Ce(e, Ke), gn.ensure().schedule(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, i = (n.f & hn) !== 0 || (n.f & Pt) !== 0;
      yc(n, i ? t : !1), n = r;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const s of o)
        (s.is_global || t) && s.in();
  }
}
function js(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var i = n === r ? null : /* @__PURE__ */ pi(n);
      t.append(n), n = i;
    }
}
let Bi = !1, vn = !1;
function Pa(e) {
  vn = e;
}
let fe = null, kt = !1;
function vt(e) {
  fe = e;
}
let he = null;
function Lt(e) {
  he = e;
}
let gt = null;
function pc(e) {
  fe !== null && (gt === null ? gt = [e] : gt.push(e));
}
let je = null, $e = 0, lt = null;
function td(e) {
  lt = e;
}
let mc = 1, wn = 0, Cn = wn;
function Ma(e) {
  Cn = e;
}
function _c() {
  return ++mc;
}
function _i(e) {
  var t = e.f;
  if ((t & Ke) !== 0)
    return !0;
  if (t & Re && (e.f &= ~In), (t & Rt) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), r = n.length, i = 0; i < r; i++) {
      var o = n[i];
      if (_i(
        /** @type {Derived} */
        o
      ) && $l(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (t & ft) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Ve === null && Ce(e, Ae);
  }
  return !1;
}
function wc(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(gt !== null && lr.call(gt, e)))
    for (var i = 0; i < r.length; i++) {
      var o = r[i];
      (o.f & Re) !== 0 ? wc(
        /** @type {Derived} */
        o,
        t,
        !1
      ) : t === o && (n ? Ce(o, Ke) : (o.f & Ae) !== 0 && Ce(o, Rt), Ys(
        /** @type {Effect} */
        o
      ));
    }
}
function xc(e) {
  var _;
  var t = je, n = $e, r = lt, i = fe, o = gt, s = xe, a = kt, l = Cn, c = e.f;
  je = /** @type {null | Value[]} */
  null, $e = 0, lt = null, fe = (c & (Pt | dn)) === 0 ? e : null, gt = null, ur(e.ctx), kt = !1, Cn = ++wn, e.ac !== null && (_o(() => {
    e.ac.abort(Bt);
  }), e.ac = null);
  try {
    e.f |= rs;
    var f = (
      /** @type {Function} */
      e.fn
    ), h = f();
    e.f |= Vn;
    var d = e.deps, v = ae == null ? void 0 : ae.is_fork;
    if (je !== null) {
      var m;
      if (v || $r(e, $e), d !== null && $e > 0)
        for (d.length = $e + je.length, m = 0; m < je.length; m++)
          d[$e + m] = je[m];
      else
        e.deps = d = je;
      if (Xs() && (e.f & ft) !== 0)
        for (m = $e; m < d.length; m++)
          ((_ = d[m]).reactions ?? (_.reactions = [])).push(e);
    } else !v && d !== null && $e < d.length && ($r(e, $e), d.length = $e);
    if (vi() && lt !== null && !kt && d !== null && (e.f & (Re | Rt | Ke)) === 0)
      for (m = 0; m < /** @type {Source[]} */
      lt.length; m++)
        wc(
          lt[m],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (wn++, i.deps !== null)
        for (let w = 0; w < n; w += 1)
          i.deps[w].rv = wn;
      if (t !== null)
        for (const w of t)
          w.rv = wn;
      lt !== null && (r === null ? r = lt : r.push(.../** @type {Source[]} */
      lt));
    }
    return (e.f & cn) !== 0 && (e.f ^= cn), h;
  } catch (w) {
    return Bl(w);
  } finally {
    e.f ^= rs, je = t, $e = n, lt = r, fe = i, gt = o, ur(s), kt = a, Cn = l;
  }
}
function nd(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = Ku.call(n, e);
    if (r !== -1) {
      var i = n.length - 1;
      i === 0 ? n = t.reactions = null : (n[r] = n[i], n.pop());
    }
  }
  if (n === null && (t.f & Re) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (je === null || !lr.call(je, t))) {
    var o = (
      /** @type {Derived} */
      t
    );
    (o.f & ft) !== 0 && (o.f ^= ft, o.f &= ~In), Fs(o), Yf(o), $r(o, 0);
  }
}
function $r(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      nd(e, n[r]);
}
function dr(e) {
  var t = e.f;
  if ((t & dt) === 0) {
    Ce(e, Ae);
    var n = he, r = Bi;
    he = e, Bi = !0;
    try {
      (t & (yn | zs)) !== 0 ? $f(e) : Ws(e), hc(e);
      var i = xc(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = mc;
      var o;
    } finally {
      Bi = r, he = n;
    }
  }
}
async function rd() {
  await Promise.resolve(), Af();
}
function u(e) {
  var t = e.f, n = (t & Re) !== 0;
  if (fe !== null && !kt) {
    var r = he !== null && (he.f & dt) !== 0;
    if (!r && (gt === null || !lr.call(gt, e))) {
      var i = fe.deps;
      if ((fe.f & rs) !== 0)
        e.rv < wn && (e.rv = wn, je === null && i !== null && i[$e] === e ? $e++ : je === null ? je = [e] : je.push(e));
      else {
        (fe.deps ?? (fe.deps = [])).push(e);
        var o = e.reactions;
        o === null ? e.reactions = [fe] : lr.call(o, fe) || o.push(fe);
      }
    }
  }
  if (vn && un.has(e))
    return un.get(e);
  if (n) {
    var s = (
      /** @type {Derived} */
      e
    );
    if (vn) {
      var a = s.v;
      return ((s.f & Ae) === 0 && s.reactions !== null || Ec(s)) && (a = Ks(s)), un.set(s, a), a;
    }
    var l = (s.f & ft) === 0 && !kt && fe !== null && (Bi || (fe.f & ft) !== 0), c = (s.f & Vn) === 0;
    _i(s) && (l && (s.f |= ft), $l(s)), l && !c && (ec(s), bc(s));
  }
  if (Ve != null && Ve.has(e))
    return Ve.get(e);
  if ((e.f & cn) !== 0)
    throw e.v;
  return e.v;
}
function bc(e) {
  if (e.f |= ft, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & Re) !== 0 && (t.f & ft) === 0 && (ec(
        /** @type {Derived} */
        t
      ), bc(
        /** @type {Derived} */
        t
      ));
}
function Ec(e) {
  if (e.v === Te) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (un.has(t) || (t.f & Re) !== 0 && Ec(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Qe(e) {
  var t = kt;
  try {
    return kt = !0, e();
  } finally {
    kt = t;
  }
}
function kc(e) {
  if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
    if (Dt in e)
      ds(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        const n = e[t];
        typeof n == "object" && n && Dt in n && ds(n);
      }
  }
}
function ds(e, t = /* @__PURE__ */ new Set()) {
  if (typeof e == "object" && e !== null && // We don't want to traverse DOM elements
  !(e instanceof EventTarget) && !t.has(e)) {
    t.add(e), e instanceof Date && e.getTime();
    for (let r in e)
      try {
        ds(e[r], t);
      } catch {
      }
    const n = mo(e);
    if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
      const r = Ml(n);
      for (let i in r) {
        const o = r[i].get;
        if (o)
          try {
            o.call(e);
          } catch {
          }
      }
    }
  }
}
function id(e) {
  return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
const od = [
  "beforeinput",
  "click",
  "change",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart"
];
function sd(e) {
  return od.includes(e);
}
const ad = {
  // no `class: 'className'` because we handle that separately
  formnovalidate: "formNoValidate",
  ismap: "isMap",
  nomodule: "noModule",
  playsinline: "playsInline",
  readonly: "readOnly",
  defaultvalue: "defaultValue",
  defaultchecked: "defaultChecked",
  srcobject: "srcObject",
  novalidate: "noValidate",
  allowfullscreen: "allowFullscreen",
  disablepictureinpicture: "disablePictureInPicture",
  disableremoteplayback: "disableRemotePlayback"
};
function ld(e) {
  return e = e.toLowerCase(), ad[e] ?? e;
}
const cd = ["touchstart", "touchmove"];
function ud(e) {
  return cd.includes(e);
}
const xn = Symbol("events"), Sc = /* @__PURE__ */ new Set(), hs = /* @__PURE__ */ new Set();
function Gs(e, t, n, r = {}) {
  function i(o) {
    if (r.capture || vs.call(t, o), !o.cancelBubble)
      return _o(() => n == null ? void 0 : n.call(this, o));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Qt(() => {
    t.addEventListener(e, i, r);
  }) : t.addEventListener(e, i, r), i;
}
function gs(e, t, n, r = {}) {
  var i = Gs(t, e, n, r);
  return () => {
    e.removeEventListener(t, i, r);
  };
}
function Gi(e, t, n, r, i) {
  var o = { capture: r, passive: i }, s = Gs(e, t, n, o);
  (t === document.body || // @ts-ignore
  t === window || // @ts-ignore
  t === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  t instanceof HTMLMediaElement) && qs(() => {
    t.removeEventListener(e, s, o);
  });
}
function rt(e, t, n) {
  (t[xn] ?? (t[xn] = {}))[e] = n;
}
function xo(e) {
  for (var t = 0; t < e.length; t++)
    Sc.add(e[t]);
  for (var n of hs)
    n(e);
}
let Ca = null;
function vs(e) {
  var w, S;
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, i = ((w = e.composedPath) == null ? void 0 : w.call(e)) || [], o = (
    /** @type {null | Element} */
    i[0] || e.target
  );
  Ca = e;
  var s = 0, a = Ca === e && e[xn];
  if (a) {
    var l = i.indexOf(a);
    if (l !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[xn] = t;
      return;
    }
    var c = i.indexOf(t);
    if (c === -1)
      return;
    l <= c && (s = l);
  }
  if (o = /** @type {Element} */
  i[s] || e.target, o !== t) {
    Xu(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || n;
      }
    });
    var f = fe, h = he;
    vt(null), Lt(null);
    try {
      for (var d, v = []; o !== null; ) {
        var m = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var _ = (S = o[xn]) == null ? void 0 : S[r];
          _ != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && _.call(o, e);
        } catch (N) {
          d ? v.push(N) : d = N;
        }
        if (e.cancelBubble || m === t || m === null)
          break;
        o = m;
      }
      if (d) {
        for (let N of v)
          queueMicrotask(() => {
            throw N;
          });
        throw d;
      }
    } finally {
      e[xn] = t, delete e.currentTarget, vt(f), Lt(h);
    }
  }
}
var Sl;
const Lo = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  ((Sl = globalThis == null ? void 0 : globalThis.window) == null ? void 0 : Sl.trustedTypes) && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function fd(e) {
  return (
    /** @type {string} */
    (Lo == null ? void 0 : Lo.createHTML(e)) ?? e
  );
}
function Pc(e) {
  var t = Zf("template");
  return t.innerHTML = fd(e.replaceAll("<!>", "<!---->")), t.content;
}
function hr(e, t) {
  var n = (
    /** @type {Effect} */
    he
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function de(e, t) {
  var n = (t & Dl) !== 0, r = (t & pf) !== 0, i, o = !e.startsWith("<!>");
  return () => {
    i === void 0 && (i = Pc(o ? e : "<!>" + e), n || (i = /** @type {TemplateNode} */
    /* @__PURE__ */ jt(i)));
    var s = (
      /** @type {TemplateNode} */
      r || rc ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (n) {
      var a = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ jt(s)
      ), l = (
        /** @type {TemplateNode} */
        s.lastChild
      );
      hr(a, l);
    } else
      hr(s, s);
    return s;
  };
}
// @__NO_SIDE_EFFECTS__
function dd(e, t, n = "svg") {
  var r = !e.startsWith("<!>"), i = (t & Dl) !== 0, o = `<${n}>${r ? e : "<!>" + e}</${n}>`, s;
  return () => {
    if (!s) {
      var a = (
        /** @type {DocumentFragment} */
        Pc(o)
      ), l = (
        /** @type {Element} */
        /* @__PURE__ */ jt(a)
      );
      if (i)
        for (s = document.createDocumentFragment(); /* @__PURE__ */ jt(l); )
          s.appendChild(
            /** @type {TemplateNode} */
            /* @__PURE__ */ jt(l)
          );
      else
        s = /** @type {Element} */
        /* @__PURE__ */ jt(l);
    }
    var c = (
      /** @type {TemplateNode} */
      s.cloneNode(!0)
    );
    if (i) {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ jt(c)
      ), h = (
        /** @type {TemplateNode} */
        c.lastChild
      );
      hr(f, h);
    } else
      hr(c, c);
    return c;
  };
}
// @__NO_SIDE_EFFECTS__
function Vt(e, t) {
  return /* @__PURE__ */ dd(e, t, "svg");
}
function hd(e = "") {
  {
    var t = Jt(e + "");
    return hr(t, t), t;
  }
}
function On() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = Jt();
  return e.append(t, n), hr(t, n), e;
}
function te(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function He(e, t) {
  var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
  n !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = n, e.nodeValue = `${n}`);
}
function gd(e, t) {
  return vd(e, t);
}
const Ni = /* @__PURE__ */ new Map();
function vd(e, { target: t, anchor: n, props: r = {}, events: i, context: o, intro: s = !0, transformError: a }) {
  qf();
  var l = void 0, c = Qf(() => {
    var f = n ?? t.appendChild(Jt());
    Tf(
      /** @type {TemplateNode} */
      f,
      {
        pending: () => {
        }
      },
      (v) => {
        ge({});
        var m = (
          /** @type {ComponentContext} */
          xe
        );
        o && (m.c = o), i && (r.$$events = i), l = e(v, r) || {}, ve();
      },
      a
    );
    var h = /* @__PURE__ */ new Set(), d = (v) => {
      for (var m = 0; m < v.length; m++) {
        var _ = v[m];
        if (!h.has(_)) {
          h.add(_);
          var w = ud(_);
          for (const M of [t, document]) {
            var S = Ni.get(M);
            S === void 0 && (S = /* @__PURE__ */ new Map(), Ni.set(M, S));
            var N = S.get(_);
            N === void 0 ? (M.addEventListener(_, vs, { passive: w }), S.set(_, 1)) : S.set(_, N + 1);
          }
        }
      }
    };
    return d(po(Sc)), hs.add(d), () => {
      var w;
      for (var v of h)
        for (const S of [t, document]) {
          var m = (
            /** @type {Map<string, number>} */
            Ni.get(S)
          ), _ = (
            /** @type {number} */
            m.get(v)
          );
          --_ == 0 ? (S.removeEventListener(v, vs), m.delete(v), m.size === 0 && Ni.delete(S)) : m.set(v, _);
        }
      hs.delete(d), f !== n && ((w = f.parentNode) == null || w.removeChild(f));
    };
  });
  return ys.set(l, c), l;
}
let ys = /* @__PURE__ */ new WeakMap();
function yd(e, t) {
  const n = ys.get(e);
  return n ? (ys.delete(e), n(t)) : Promise.resolve();
}
var xt, It, nt, Pn, ci, ui, ho;
class Us {
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    /** @type {TemplateNode} */
    Ee(this, "anchor");
    /** @type {Map<Batch, Key>} */
    K(this, xt, /* @__PURE__ */ new Map());
    /**
     * Map of keys to effects that are currently rendered in the DOM.
     * These effects are visible and actively part of the document tree.
     * Example:
     * ```
     * {#if condition}
     * 	foo
     * {:else}
     * 	bar
     * {/if}
     * ```
     * Can result in the entries `true->Effect` and `false->Effect`
     * @type {Map<Key, Effect>}
     */
    K(this, It, /* @__PURE__ */ new Map());
    /**
     * Similar to #onscreen with respect to the keys, but contains branches that are not yet
     * in the DOM, because their insertion is deferred.
     * @type {Map<Key, Branch>}
     */
    K(this, nt, /* @__PURE__ */ new Map());
    /**
     * Keys of effects that are currently outroing
     * @type {Set<Key>}
     */
    K(this, Pn, /* @__PURE__ */ new Set());
    /**
     * Whether to pause (i.e. outro) on change, or destroy immediately.
     * This is necessary for `<svelte:element>`
     */
    K(this, ci, !0);
    /**
     * @param {Batch} batch
     */
    K(this, ui, (t) => {
      if (y(this, xt).has(t)) {
        var n = (
          /** @type {Key} */
          y(this, xt).get(t)
        ), r = y(this, It).get(n);
        if (r)
          Zs(r), y(this, Pn).delete(n);
        else {
          var i = y(this, nt).get(n);
          i && (y(this, It).set(n, i.effect), y(this, nt).delete(n), i.fragment.lastChild.remove(), this.anchor.before(i.fragment), r = i.effect);
        }
        for (const [o, s] of y(this, xt)) {
          if (y(this, xt).delete(o), o === t)
            break;
          const a = y(this, nt).get(s);
          a && (De(a.effect), y(this, nt).delete(s));
        }
        for (const [o, s] of y(this, It)) {
          if (o === n || y(this, Pn).has(o)) continue;
          const a = () => {
            if (Array.from(y(this, xt).values()).includes(o)) {
              var c = document.createDocumentFragment();
              js(s, c), c.append(Jt()), y(this, nt).set(o, { effect: s, fragment: c });
            } else
              De(s);
            y(this, Pn).delete(o), y(this, It).delete(o);
          };
          y(this, ci) || !r ? (y(this, Pn).add(o), Mn(s, a, !1)) : a();
        }
      }
    });
    /**
     * @param {Batch} batch
     */
    K(this, ho, (t) => {
      y(this, xt).delete(t);
      const n = Array.from(y(this, xt).values());
      for (const [r, i] of y(this, nt))
        n.includes(r) || (De(i.effect), y(this, nt).delete(r));
    });
    this.anchor = t, se(this, ci, n);
  }
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, n) {
    var r = (
      /** @type {Batch} */
      ae
    ), i = sc();
    if (n && !y(this, It).has(t) && !y(this, nt).has(t))
      if (i) {
        var o = document.createDocumentFragment(), s = Jt();
        o.append(s), y(this, nt).set(t, {
          effect: Ge(() => n(s)),
          fragment: o
        });
      } else
        y(this, It).set(
          t,
          Ge(() => n(this.anchor))
        );
    if (y(this, xt).set(r, t), i) {
      for (const [a, l] of y(this, It))
        a === t ? r.unskip_effect(l) : r.skip_effect(l);
      for (const [a, l] of y(this, nt))
        a === t ? r.unskip_effect(l.effect) : r.skip_effect(l.effect);
      r.oncommit(y(this, ui)), r.ondiscard(y(this, ho));
    } else
      y(this, ui).call(this, r);
  }
}
xt = new WeakMap(), It = new WeakMap(), nt = new WeakMap(), Pn = new WeakMap(), ci = new WeakMap(), ui = new WeakMap(), ho = new WeakMap();
function ze(e, t, n = !1) {
  var r = new Us(e), i = n ? hn : 0;
  function o(s, a) {
    r.ensure(s, a);
  }
  mi(() => {
    var s = !1;
    t((a, l = 0) => {
      s = !0, o(l, a);
    }), s || o(-1, null);
  }, i);
}
function qn(e, t) {
  return t;
}
function pd(e, t, n) {
  for (var r = [], i = t.length, o, s = t.length, a = 0; a < i; a++) {
    let h = t[a];
    Mn(
      h,
      () => {
        if (o) {
          if (o.pending.delete(h), o.done.add(h), o.pending.size === 0) {
            var d = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            ps(e, po(o.done)), d.delete(o), d.size === 0 && (e.outrogroups = null);
          }
        } else
          s -= 1;
      },
      !1
    );
  }
  if (s === 0) {
    var l = r.length === 0 && n !== null;
    if (l) {
      var c = (
        /** @type {Element} */
        n
      ), f = (
        /** @type {Element} */
        c.parentNode
      );
      Wf(f), f.append(c), e.items.clear();
    }
    ps(e, t, !l);
  } else
    o = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(o);
}
function ps(e, t, n = !0) {
  var r;
  if (e.pending.size > 0) {
    r = /* @__PURE__ */ new Set();
    for (const s of e.pending.values())
      for (const a of s)
        r.add(
          /** @type {EachItem} */
          e.items.get(a).e
        );
  }
  for (var i = 0; i < t.length; i++) {
    var o = t[i];
    if (r != null && r.has(o)) {
      o.f |= Ot;
      const s = document.createDocumentFragment();
      js(o, s);
    } else
      De(t[i], n);
  }
}
var Aa;
function Kt(e, t, n, r, i, o = null) {
  var s = e, a = /* @__PURE__ */ new Map(), l = (t & Ol) !== 0;
  if (l) {
    var c = (
      /** @type {Element} */
      e
    );
    s = c.appendChild(Jt());
  }
  var f = null, h = /* @__PURE__ */ Bs(() => {
    var M = n();
    return yo(M) ? M : M == null ? [] : po(M);
  }), d, v = /* @__PURE__ */ new Map(), m = !0;
  function _(M) {
    (N.effect.f & dt) === 0 && (N.pending.delete(M), N.fallback = f, md(N, d, s, t, r), f !== null && (d.length === 0 ? (f.f & Ot) === 0 ? Zs(f) : (f.f ^= Ot, Wr(f, null, s)) : Mn(f, () => {
      f = null;
    })));
  }
  function w(M) {
    N.pending.delete(M);
  }
  var S = mi(() => {
    d = /** @type {V[]} */
    u(h);
    for (var M = d.length, E = /* @__PURE__ */ new Set(), R = (
      /** @type {Batch} */
      ae
    ), F = sc(), B = 0; B < M; B += 1) {
      var L = d[B], Y = r(L, B), j = m ? null : a.get(Y);
      j ? (j.v && fr(j.v, L), j.i && fr(j.i, B), F && R.unskip_effect(j.e)) : (j = _d(
        a,
        m ? s : Aa ?? (Aa = Jt()),
        L,
        Y,
        B,
        i,
        t,
        n
      ), m || (j.e.f |= Ot), a.set(Y, j)), E.add(Y);
    }
    if (M === 0 && o && !f && (m ? f = Ge(() => o(s)) : (f = Ge(() => o(Aa ?? (Aa = Jt()))), f.f |= Ot)), M > E.size && Qu(), !m)
      if (v.set(R, E), F) {
        for (const [I, g] of a)
          E.has(I) || R.skip_effect(g.e);
        R.oncommit(_), R.ondiscard(w);
      } else
        _(R);
    u(h);
  }), N = { effect: S, items: a, pending: v, outrogroups: null, fallback: f };
  m = !1;
}
function Kr(e) {
  for (; e !== null && (e.f & Pt) === 0; )
    e = e.next;
  return e;
}
function md(e, t, n, r, i) {
  var j, I, g, x, p, k, P, C, T;
  var o = (r & uf) !== 0, s = t.length, a = e.items, l = Kr(e.effect.first), c, f = null, h, d = [], v = [], m, _, w, S;
  if (o)
    for (S = 0; S < s; S += 1)
      m = t[S], _ = i(m, S), w = /** @type {EachItem} */
      a.get(_).e, (w.f & Ot) === 0 && ((I = (j = w.nodes) == null ? void 0 : j.a) == null || I.measure(), (h ?? (h = /* @__PURE__ */ new Set())).add(w));
  for (S = 0; S < s; S += 1) {
    if (m = t[S], _ = i(m, S), w = /** @type {EachItem} */
    a.get(_).e, e.outrogroups !== null)
      for (const O of e.outrogroups)
        O.pending.delete(w), O.done.delete(w);
    if ((w.f & it) !== 0 && (Zs(w), o && ((x = (g = w.nodes) == null ? void 0 : g.a) == null || x.unfix(), (h ?? (h = /* @__PURE__ */ new Set())).delete(w))), (w.f & Ot) !== 0)
      if (w.f ^= Ot, w === l)
        Wr(w, null, n);
      else {
        var N = f ? f.next : l;
        w === e.effect.last && (e.effect.last = w.prev), w.prev && (w.prev.next = w.next), w.next && (w.next.prev = w.prev), en(e, f, w), en(e, w, N), Wr(w, N, n), f = w, d = [], v = [], l = Kr(f.next);
        continue;
      }
    if (w !== l) {
      if (c !== void 0 && c.has(w)) {
        if (d.length < v.length) {
          var M = v[0], E;
          f = M.prev;
          var R = d[0], F = d[d.length - 1];
          for (E = 0; E < d.length; E += 1)
            Wr(d[E], M, n);
          for (E = 0; E < v.length; E += 1)
            c.delete(v[E]);
          en(e, R.prev, F.next), en(e, f, R), en(e, F, M), l = M, f = F, S -= 1, d = [], v = [];
        } else
          c.delete(w), Wr(w, l, n), en(e, w.prev, w.next), en(e, w, f === null ? e.effect.first : f.next), en(e, f, w), f = w;
        continue;
      }
      for (d = [], v = []; l !== null && l !== w; )
        (c ?? (c = /* @__PURE__ */ new Set())).add(l), v.push(l), l = Kr(l.next);
      if (l === null)
        continue;
    }
    (w.f & Ot) === 0 && d.push(w), f = w, l = Kr(w.next);
  }
  if (e.outrogroups !== null) {
    for (const O of e.outrogroups)
      O.pending.size === 0 && (ps(e, po(O.done)), (p = e.outrogroups) == null || p.delete(O));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (l !== null || c !== void 0) {
    var B = [];
    if (c !== void 0)
      for (w of c)
        (w.f & it) === 0 && B.push(w);
    for (; l !== null; )
      (l.f & it) === 0 && l !== e.fallback && B.push(l), l = Kr(l.next);
    var L = B.length;
    if (L > 0) {
      var Y = (r & Ol) !== 0 && s === 0 ? n : null;
      if (o) {
        for (S = 0; S < L; S += 1)
          (P = (k = B[S].nodes) == null ? void 0 : k.a) == null || P.measure();
        for (S = 0; S < L; S += 1)
          (T = (C = B[S].nodes) == null ? void 0 : C.a) == null || T.fix();
      }
      pd(e, B, Y);
    }
  }
  o && Qt(() => {
    var O, H;
    if (h !== void 0)
      for (w of h)
        (H = (O = w.nodes) == null ? void 0 : O.a) == null || H.apply();
  });
}
function _d(e, t, n, r, i, o, s, a) {
  var l = (s & lf) !== 0 ? (s & ff) === 0 ? /* @__PURE__ */ Bf(n, !1, !1) : Tn(n) : null, c = (s & cf) !== 0 ? Tn(i) : null;
  return {
    v: l,
    i: c,
    e: Ge(() => (o(t, l ?? n, c ?? i, a), () => {
      e.delete(r);
    }))
  };
}
function Wr(e, t, n) {
  if (e.nodes)
    for (var r = e.nodes.start, i = e.nodes.end, o = t && (t.f & Ot) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; r !== null; ) {
      var s = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ pi(r)
      );
      if (o.before(r), r === i)
        return;
      r = s;
    }
}
function en(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function pn(e, t, ...n) {
  var r = new Us(e);
  mi(() => {
    const i = t() ?? null;
    r.ensure(i, i && ((o) => i(o, ...n)));
  }, hn);
}
function Qs(e, t, n) {
  var r = new Us(e);
  mi(() => {
    var i = t() ?? null;
    r.ensure(i, i && ((o) => n(o, i)));
  }, hn);
}
function Ze(e, t, n) {
  kr(() => {
    var r = Qe(() => t(e, n == null ? void 0 : n()) || {});
    if (n && (r != null && r.update)) {
      var i = !1, o = (
        /** @type {any} */
        {}
      );
      wo(() => {
        var s = n();
        kc(s), i && Ll(o, s) && (o = s, r.update(s));
      }), i = !0;
    }
    if (r != null && r.destroy)
      return () => (
        /** @type {Function} */
        r.destroy()
      );
  });
}
function wd(e, t) {
  var n = void 0, r;
  dc(() => {
    n !== (n = t()) && (r && (De(r), r = null), n && (r = Ge(() => {
      kr(() => (
        /** @type {(node: Element) => void} */
        n(e)
      ));
    })));
  });
}
function Mc(e) {
  var t, n, r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var i = e.length;
    for (t = 0; t < i; t++) e[t] && (n = Mc(e[t])) && (r && (r += " "), r += n);
  } else for (n in e) e[n] && (r && (r += " "), r += n);
  return r;
}
function xd() {
  for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = Mc(e)) && (r && (r += " "), r += t);
  return r;
}
function bo(e) {
  return typeof e == "object" ? xd(e) : e ?? "";
}
const Na = [...` 	
\r\f \v\uFEFF`];
function bd(e, t, n) {
  var r = e == null ? "" : "" + e;
  if (t && (r = r ? r + " " + t : t), n) {
    for (var i of Object.keys(n))
      if (n[i])
        r = r ? r + " " + i : i;
      else if (r.length)
        for (var o = i.length, s = 0; (s = r.indexOf(i, s)) >= 0; ) {
          var a = s + o;
          (s === 0 || Na.includes(r[s - 1])) && (a === r.length || Na.includes(r[a])) ? r = (s === 0 ? "" : r.substring(0, s)) + r.substring(a + 1) : s = a;
        }
  }
  return r === "" ? null : r;
}
function Ia(e, t = !1) {
  var n = t ? " !important;" : ";", r = "";
  for (var i of Object.keys(e)) {
    var o = e[i];
    o != null && o !== "" && (r += " " + i + ": " + o + n);
  }
  return r;
}
function Ho(e) {
  return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Ed(e, t) {
  if (t) {
    var n = "", r, i;
    if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
      e = String(e).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
      var o = !1, s = 0, a = !1, l = [];
      r && l.push(...Object.keys(r).map(Ho)), i && l.push(...Object.keys(i).map(Ho));
      var c = 0, f = -1;
      const _ = e.length;
      for (var h = 0; h < _; h++) {
        var d = e[h];
        if (a ? d === "/" && e[h - 1] === "*" && (a = !1) : o ? o === d && (o = !1) : d === "/" && e[h + 1] === "*" ? a = !0 : d === '"' || d === "'" ? o = d : d === "(" ? s++ : d === ")" && s--, !a && o === !1 && s === 0) {
          if (d === ":" && f === -1)
            f = h;
          else if (d === ";" || h === _ - 1) {
            if (f !== -1) {
              var v = Ho(e.substring(c, f).trim());
              if (!l.includes(v)) {
                d !== ";" && h++;
                var m = e.substring(c, h).trim();
                n += " " + m + ";";
              }
            }
            c = h + 1, f = -1;
          }
        }
      }
    }
    return r && (n += Ia(r)), i && (n += Ia(i, !0)), n = n.trim(), n === "" ? null : n;
  }
  return e == null ? null : String(e);
}
function Yn(e, t, n, r, i, o) {
  var s = e.__className;
  if (s !== n || s === void 0) {
    var a = bd(n, r, o);
    a == null ? e.removeAttribute("class") : t ? e.className = a : e.setAttribute("class", a), e.__className = n;
  } else if (o && i !== o)
    for (var l in o) {
      var c = !!o[l];
      (i == null || c !== !!i[l]) && e.classList.toggle(l, c);
    }
  return o;
}
function Vo(e, t = {}, n, r) {
  for (var i in n) {
    var o = n[i];
    t[i] !== o && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, o, r));
  }
}
function Be(e, t, n, r) {
  var i = e.__style;
  if (i !== t) {
    var o = Ed(t, r);
    o == null ? e.removeAttribute("style") : e.style.cssText = o, e.__style = t;
  } else r && (Array.isArray(r) ? (Vo(e, n == null ? void 0 : n[0], r[0]), Vo(e, n == null ? void 0 : n[1], r[1], "important")) : Vo(e, n, r));
  return r;
}
function gr(e, t, n = !1) {
  if (e.multiple) {
    if (t == null)
      return;
    if (!yo(t))
      return _f();
    for (var r of e.options)
      r.selected = t.includes(Qr(r));
    return;
  }
  for (r of e.options) {
    var i = Qr(r);
    if (Xf(i, t)) {
      r.selected = !0;
      return;
    }
  }
  (!n || t !== void 0) && (e.selectedIndex = -1);
}
function Ui(e) {
  var t = new MutationObserver(() => {
    gr(e, e.__value);
  });
  t.observe(e, {
    // Listen to option element changes
    childList: !0,
    subtree: !0,
    // because of <optgroup>
    // Listen to option element value attribute changes
    // (doesn't get notified of select value changes,
    // because that property is not reflected as an attribute)
    attributes: !0,
    attributeFilter: ["value"]
  }), qs(() => {
    t.disconnect();
  });
}
function kd(e, t, n = t) {
  var r = /* @__PURE__ */ new WeakSet(), i = !0;
  ac(e, "change", (o) => {
    var s = o ? "[selected]" : ":checked", a;
    if (e.multiple)
      a = [].map.call(e.querySelectorAll(s), Qr);
    else {
      var l = e.querySelector(s) ?? // will fall back to first non-disabled option if no option is selected
      e.querySelector("option:not([disabled])");
      a = l && Qr(l);
    }
    n(a), e.__value = a, ae !== null && r.add(ae);
  }), kr(() => {
    var o = t();
    if (e === document.activeElement) {
      var s = (
        /** @type {Batch} */
        ae
      );
      if (r.has(s))
        return;
    }
    if (gr(e, o, i), i && o === void 0) {
      var a = e.querySelector(":checked");
      a !== null && (o = Qr(a), n(o));
    }
    e.__value = o, i = !1;
  }), Ui(e);
}
function Qr(e) {
  return "__value" in e ? e.__value : e.value;
}
const tn = Symbol("class"), nn = Symbol("style"), Cc = Symbol("is custom element"), Ac = Symbol("is html"), Sd = Tl ? "option" : "OPTION", Pd = Tl ? "select" : "SELECT";
function Md(e, t) {
  t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function ke(e, t, n, r) {
  var i = Nc(e);
  i[t] !== (i[t] = n) && (t === "loading" && (e[Gu] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Ic(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function Cd(e, t, n, r, i = !1, o = !1) {
  var s = Nc(e), a = s[Cc], l = !s[Ac], c = t || {}, f = e.nodeName === Sd;
  for (var h in t)
    h in n || (n[h] = null);
  n.class ? n.class = bo(n.class) : (r || n[tn]) && (n.class = null), n[nn] && (n.style ?? (n.style = null));
  var d = Ic(e);
  for (const M in n) {
    let E = n[M];
    if (f && M === "value" && E == null) {
      e.value = e.__value = "", c[M] = E;
      continue;
    }
    if (M === "class") {
      var v = e.namespaceURI === "http://www.w3.org/1999/xhtml";
      Yn(e, v, E, r, t == null ? void 0 : t[tn], n[tn]), c[M] = E, c[tn] = n[tn];
      continue;
    }
    if (M === "style") {
      Be(e, E, t == null ? void 0 : t[nn], n[nn]), c[M] = E, c[nn] = n[nn];
      continue;
    }
    var m = c[M];
    if (!(E === m && !(E === void 0 && e.hasAttribute(M)))) {
      c[M] = E;
      var _ = M[0] + M[1];
      if (_ !== "$$")
        if (_ === "on") {
          const R = {}, F = "$$" + M;
          let B = M.slice(2);
          var w = sd(B);
          if (id(B) && (B = B.slice(0, -7), R.capture = !0), !w && m) {
            if (E != null) continue;
            e.removeEventListener(B, c[F], R), c[F] = null;
          }
          if (w)
            rt(B, e, E), xo([B]);
          else if (E != null) {
            let L = function(Y) {
              c[M].call(this, Y);
            };
            c[F] = Gs(B, e, L, R);
          }
        } else if (M === "style")
          ke(e, M, E);
        else if (M === "autofocus")
          jf(
            /** @type {HTMLElement} */
            e,
            !!E
          );
        else if (!a && (M === "__value" || M === "value" && E != null))
          e.value = e.__value = E;
        else if (M === "selected" && f)
          Md(
            /** @type {HTMLOptionElement} */
            e,
            E
          );
        else {
          var S = M;
          l || (S = ld(S));
          var N = S === "defaultValue" || S === "defaultChecked";
          if (E == null && !a && !N)
            if (s[M] = null, S === "value" || S === "checked") {
              let R = (
                /** @type {HTMLInputElement} */
                e
              );
              const F = t === void 0;
              if (S === "value") {
                let B = R.defaultValue;
                R.removeAttribute(S), R.defaultValue = B, R.value = R.__value = F ? B : null;
              } else {
                let B = R.defaultChecked;
                R.removeAttribute(S), R.defaultChecked = B, R.checked = F ? B : !1;
              }
            } else
              e.removeAttribute(M);
          else N || d.includes(S) && (a || typeof E != "string") ? (e[S] = E, S in s && (s[S] = Te)) : typeof E != "function" && ke(e, S, E);
        }
    }
  }
  return c;
}
function Bn(e, t, n = [], r = [], i = [], o, s = !1, a = !1) {
  Ql(i, n, r, (l) => {
    var c = void 0, f = {}, h = e.nodeName === Pd, d = !1;
    if (dc(() => {
      var m = t(...l.map(u)), _ = Cd(
        e,
        c,
        m,
        o,
        s,
        a
      );
      d && h && "value" in m && gr(
        /** @type {HTMLSelectElement} */
        e,
        m.value
      );
      for (let S of Object.getOwnPropertySymbols(f))
        m[S] || De(f[S]);
      for (let S of Object.getOwnPropertySymbols(m)) {
        var w = m[S];
        S.description === mf && (!c || w !== c[S]) && (f[S] && De(f[S]), f[S] = Ge(() => wd(e, () => w))), _[S] = w;
      }
      c = _;
    }), h) {
      var v = (
        /** @type {HTMLSelectElement} */
        e
      );
      kr(() => {
        gr(
          v,
          /** @type {Record<string | symbol, any>} */
          c.value,
          !0
        ), Ui(v);
      });
    }
    d = !0;
  });
}
function Nc(e) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    e.__attributes ?? (e.__attributes = {
      [Cc]: e.nodeName.includes("-"),
      [Ac]: e.namespaceURI === zl
    })
  );
}
var Ta = /* @__PURE__ */ new Map();
function Ic(e) {
  var t = e.getAttribute("is") || e.nodeName, n = Ta.get(t);
  if (n) return n;
  Ta.set(t, n = []);
  for (var r, i = e, o = Element.prototype; o !== i; ) {
    r = Ml(i);
    for (var s in r)
      r[s].set && n.push(s);
    i = mo(i);
  }
  return n;
}
function Ad(e, t, n = t) {
  var r = /* @__PURE__ */ new WeakSet();
  ac(e, "input", async (i) => {
    var o = i ? e.defaultValue : e.value;
    if (o = Fo(e) ? Yo(o) : o, n(o), ae !== null && r.add(ae), await rd(), o !== (o = t())) {
      var s = e.selectionStart, a = e.selectionEnd, l = e.value.length;
      if (e.value = o ?? "", a !== null) {
        var c = e.value.length;
        s === a && a === l && c > l ? (e.selectionStart = c, e.selectionEnd = c) : (e.selectionStart = s, e.selectionEnd = Math.min(a, c));
      }
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Qe(t) == null && e.value && (n(Fo(e) ? Yo(e.value) : e.value), ae !== null && r.add(ae)), wo(() => {
    var i = t();
    if (e === document.activeElement) {
      var o = (
        /** @type {Batch} */
        ae
      );
      if (r.has(o))
        return;
    }
    Fo(e) && i === Yo(e.value) || e.type === "date" && !i && !e.value || i !== e.value && (e.value = i ?? "");
  });
}
function Fo(e) {
  var t = e.type;
  return t === "number" || t === "range";
}
function Yo(e) {
  return e === "" ? null : +e;
}
var sn, ar, fi, go, Tc;
const vo = class vo {
  /** @param {ResizeObserverOptions} options */
  constructor(t) {
    K(this, go);
    /** */
    K(this, sn, /* @__PURE__ */ new WeakMap());
    /** @type {ResizeObserver | undefined} */
    K(this, ar);
    /** @type {ResizeObserverOptions} */
    K(this, fi);
    se(this, fi, t);
  }
  /**
   * @param {Element} element
   * @param {(entry: ResizeObserverEntry) => any} listener
   */
  observe(t, n) {
    var r = y(this, sn).get(t) || /* @__PURE__ */ new Set();
    return r.add(n), y(this, sn).set(t, r), Me(this, go, Tc).call(this).observe(t, y(this, fi)), () => {
      var i = y(this, sn).get(t);
      i.delete(n), i.size === 0 && (y(this, sn).delete(t), y(this, ar).unobserve(t));
    };
  }
};
sn = new WeakMap(), ar = new WeakMap(), fi = new WeakMap(), go = new WeakSet(), Tc = function() {
  return y(this, ar) ?? se(this, ar, new ResizeObserver(
    /** @param {any} entries */
    (t) => {
      for (var n of t) {
        vo.entries.set(n.target, n);
        for (var r of y(this, sn).get(n.target) || [])
          r(n);
      }
    }
  ));
}, /** @static */
Ee(vo, "entries", /* @__PURE__ */ new WeakMap());
let ms = vo;
var Nd = /* @__PURE__ */ new ms({
  box: "border-box"
});
function Qi(e, t, n) {
  var r = Nd.observe(e, () => n(e[t]));
  kr(() => (Qe(() => n(e[t])), r));
}
function Oa(e, t) {
  return e === t || (e == null ? void 0 : e[Dt]) === t;
}
function wi(e = {}, t, n, r) {
  var i = (
    /** @type {ComponentContext} */
    xe.r
  ), o = (
    /** @type {Effect} */
    he
  );
  return kr(() => {
    var s, a;
    return wo(() => {
      s = a, a = [], Qe(() => {
        e !== n(...a) && (t(e, ...a), s && Oa(n(...s), e) && t(null, ...s));
      });
    }), () => {
      let l = o;
      for (; l !== i && l.parent !== null && l.parent.f & ns; )
        l = l.parent;
      const c = () => {
        a && Oa(n(...a), e) && t(null, ...a);
      }, f = l.teardown;
      l.teardown = () => {
        c(), f == null || f();
      };
    };
  }), e;
}
function Id(e = !1) {
  const t = (
    /** @type {ComponentContextLegacy} */
    xe
  ), n = t.l.u;
  if (!n) return;
  let r = () => kc(t.s);
  if (e) {
    let i = 0, o = (
      /** @type {Record<string, any>} */
      {}
    );
    const s = /* @__PURE__ */ yi(() => {
      let a = !1;
      const l = t.s;
      for (const c in l)
        l[c] !== o[c] && (o[c] = l[c], a = !0);
      return a && i++, i;
    });
    r = () => u(s);
  }
  n.b.length && uc(() => {
    Da(t, r), es(n.b);
  }), ht(() => {
    const i = Qe(() => n.m.map(Wu));
    return () => {
      for (const o of i)
        typeof o == "function" && o();
    };
  }), n.a.length && ht(() => {
    Da(t, r), es(n.a);
  });
}
function Da(e, t) {
  if (e.l.s)
    for (const n of e.l.s) u(n);
  t();
}
const Td = {
  get(e, t) {
    if (!e.exclude.includes(t))
      return e.props[t];
  },
  set(e, t) {
    return !1;
  },
  getOwnPropertyDescriptor(e, t) {
    if (!e.exclude.includes(t) && t in e.props)
      return {
        enumerable: !0,
        configurable: !0,
        value: e.props[t]
      };
  },
  has(e, t) {
    return e.exclude.includes(t) ? !1 : t in e.props;
  },
  ownKeys(e) {
    return Reflect.ownKeys(e.props).filter((t) => !e.exclude.includes(t));
  }
};
// @__NO_SIDE_EFFECTS__
function xi(e, t, n) {
  return new Proxy(
    { props: e, exclude: t },
    Td
  );
}
const Od = {
  get(e, t) {
    let n = e.props.length;
    for (; n--; ) {
      let r = e.props[n];
      if (Br(r) && (r = r()), typeof r == "object" && r !== null && t in r) return r[t];
    }
  },
  set(e, t, n) {
    let r = e.props.length;
    for (; r--; ) {
      let i = e.props[r];
      Br(i) && (i = i());
      const o = ln(i, t);
      if (o && o.set)
        return o.set(n), !0;
    }
    return !1;
  },
  getOwnPropertyDescriptor(e, t) {
    let n = e.props.length;
    for (; n--; ) {
      let r = e.props[n];
      if (Br(r) && (r = r()), typeof r == "object" && r !== null && t in r) {
        const i = ln(r, t);
        return i && !i.configurable && (i.configurable = !0), i;
      }
    }
  },
  has(e, t) {
    if (t === Dt || t === Il) return !1;
    for (let n of e.props)
      if (Br(n) && (n = n()), n != null && t in n) return !0;
    return !1;
  },
  ownKeys(e) {
    const t = [];
    for (let n of e.props)
      if (Br(n) && (n = n()), !!n) {
        for (const r in n)
          t.includes(r) || t.push(r);
        for (const r of Object.getOwnPropertySymbols(n))
          t.includes(r) || t.push(r);
      }
    return t;
  }
};
function Dd(...e) {
  return new Proxy({ props: e }, Od);
}
function ee(e, t, n, r) {
  var M;
  var i = !Er || (n & hf) !== 0, o = (n & vf) !== 0, s = (n & yf) !== 0, a = (
    /** @type {V} */
    r
  ), l = !0, c = () => (l && (l = !1, a = s ? Qe(
    /** @type {() => V} */
    r
  ) : (
    /** @type {V} */
    r
  )), a);
  let f;
  if (o) {
    var h = Dt in e || Il in e;
    f = ((M = ln(e, t)) == null ? void 0 : M.set) ?? (h && t in e ? (E) => e[t] = E : void 0);
  }
  var d, v = !1;
  o ? [d, v] = Mf(() => (
    /** @type {V} */
    e[t]
  )) : d = /** @type {V} */
  e[t], d === void 0 && r !== void 0 && (d = c(), f && (i && nf(), f(d)));
  var m;
  if (i ? m = () => {
    var E = (
      /** @type {V} */
      e[t]
    );
    return E === void 0 ? c() : (l = !0, E);
  } : m = () => {
    var E = (
      /** @type {V} */
      e[t]
    );
    return E !== void 0 && (a = /** @type {V} */
    void 0), E === void 0 ? a : E;
  }, i && (n & gf) === 0)
    return m;
  if (f) {
    var _ = e.$$legacy;
    return (
      /** @type {() => V} */
      (function(E, R) {
        return arguments.length > 0 ? ((!i || !R || _ || v) && f(R ? m() : E), E) : m();
      })
    );
  }
  var w = !1, S = ((n & df) !== 0 ? yi : Bs)(() => (w = !1, m()));
  o && u(S);
  var N = (
    /** @type {Effect} */
    he
  );
  return (
    /** @type {() => V} */
    (function(E, R) {
      if (arguments.length > 0) {
        const F = R ? u(S) : i && o ? Ue(E) : E;
        return q(S, F), w = !0, a !== void 0 && (a = F), E;
      }
      return vn && w || (N.f & dt) !== 0 ? S.v : u(S);
    })
  );
}
function zd(e) {
  xe === null && Ls(), Er && xe.l !== null ? Rd(xe).m.push(e) : ht(() => {
    const t = Qe(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
function Js(e) {
  xe === null && Ls(), zd(() => () => Qe(e));
}
function Rd(e) {
  var t = (
    /** @type {ComponentContextLegacy} */
    e.l
  );
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
const Ld = "5";
var Pl;
typeof window < "u" && ((Pl = window.__svelte ?? (window.__svelte = {})).v ?? (Pl.v = /* @__PURE__ */ new Set())).add(Ld);
var Hd = { value: () => {
} };
function Eo() {
  for (var e = 0, t = arguments.length, n = {}, r; e < t; ++e) {
    if (!(r = arguments[e] + "") || r in n || /[\s.]/.test(r)) throw new Error("illegal type: " + r);
    n[r] = [];
  }
  return new Ki(n);
}
function Ki(e) {
  this._ = e;
}
function Vd(e, t) {
  return e.trim().split(/^|\s+/).map(function(n) {
    var r = "", i = n.indexOf(".");
    if (i >= 0 && (r = n.slice(i + 1), n = n.slice(0, i)), n && !t.hasOwnProperty(n)) throw new Error("unknown type: " + n);
    return { type: n, name: r };
  });
}
Ki.prototype = Eo.prototype = {
  constructor: Ki,
  on: function(e, t) {
    var n = this._, r = Vd(e + "", n), i, o = -1, s = r.length;
    if (arguments.length < 2) {
      for (; ++o < s; ) if ((i = (e = r[o]).type) && (i = Fd(n[i], e.name))) return i;
      return;
    }
    if (t != null && typeof t != "function") throw new Error("invalid callback: " + t);
    for (; ++o < s; )
      if (i = (e = r[o]).type) n[i] = za(n[i], e.name, t);
      else if (t == null) for (i in n) n[i] = za(n[i], e.name, null);
    return this;
  },
  copy: function() {
    var e = {}, t = this._;
    for (var n in t) e[n] = t[n].slice();
    return new Ki(e);
  },
  call: function(e, t) {
    if ((i = arguments.length - 2) > 0) for (var n = new Array(i), r = 0, i, o; r < i; ++r) n[r] = arguments[r + 2];
    if (!this._.hasOwnProperty(e)) throw new Error("unknown type: " + e);
    for (o = this._[e], r = 0, i = o.length; r < i; ++r) o[r].value.apply(t, n);
  },
  apply: function(e, t, n) {
    if (!this._.hasOwnProperty(e)) throw new Error("unknown type: " + e);
    for (var r = this._[e], i = 0, o = r.length; i < o; ++i) r[i].value.apply(t, n);
  }
};
function Fd(e, t) {
  for (var n = 0, r = e.length, i; n < r; ++n)
    if ((i = e[n]).name === t)
      return i.value;
}
function za(e, t, n) {
  for (var r = 0, i = e.length; r < i; ++r)
    if (e[r].name === t) {
      e[r] = Hd, e = e.slice(0, r).concat(e.slice(r + 1));
      break;
    }
  return n != null && e.push({ name: t, value: n }), e;
}
var _s = "http://www.w3.org/1999/xhtml";
const Ra = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: _s,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
function ko(e) {
  var t = e += "", n = t.indexOf(":");
  return n >= 0 && (t = e.slice(0, n)) !== "xmlns" && (e = e.slice(n + 1)), Ra.hasOwnProperty(t) ? { space: Ra[t], local: e } : e;
}
function Yd(e) {
  return function() {
    var t = this.ownerDocument, n = this.namespaceURI;
    return n === _s && t.documentElement.namespaceURI === _s ? t.createElement(e) : t.createElementNS(n, e);
  };
}
function Bd(e) {
  return function() {
    return this.ownerDocument.createElementNS(e.space, e.local);
  };
}
function Oc(e) {
  var t = ko(e);
  return (t.local ? Bd : Yd)(t);
}
function Kd() {
}
function $s(e) {
  return e == null ? Kd : function() {
    return this.querySelector(e);
  };
}
function Xd(e) {
  typeof e != "function" && (e = $s(e));
  for (var t = this._groups, n = t.length, r = new Array(n), i = 0; i < n; ++i)
    for (var o = t[i], s = o.length, a = r[i] = new Array(s), l, c, f = 0; f < s; ++f)
      (l = o[f]) && (c = e.call(l, l.__data__, f, o)) && ("__data__" in l && (c.__data__ = l.__data__), a[f] = c);
  return new ot(r, this._parents);
}
function qd(e) {
  return e == null ? [] : Array.isArray(e) ? e : Array.from(e);
}
function Wd() {
  return [];
}
function Dc(e) {
  return e == null ? Wd : function() {
    return this.querySelectorAll(e);
  };
}
function Zd(e) {
  return function() {
    return qd(e.apply(this, arguments));
  };
}
function jd(e) {
  typeof e == "function" ? e = Zd(e) : e = Dc(e);
  for (var t = this._groups, n = t.length, r = [], i = [], o = 0; o < n; ++o)
    for (var s = t[o], a = s.length, l, c = 0; c < a; ++c)
      (l = s[c]) && (r.push(e.call(l, l.__data__, c, s)), i.push(l));
  return new ot(r, i);
}
function zc(e) {
  return function() {
    return this.matches(e);
  };
}
function Rc(e) {
  return function(t) {
    return t.matches(e);
  };
}
var Gd = Array.prototype.find;
function Ud(e) {
  return function() {
    return Gd.call(this.children, e);
  };
}
function Qd() {
  return this.firstElementChild;
}
function Jd(e) {
  return this.select(e == null ? Qd : Ud(typeof e == "function" ? e : Rc(e)));
}
var $d = Array.prototype.filter;
function eh() {
  return Array.from(this.children);
}
function th(e) {
  return function() {
    return $d.call(this.children, e);
  };
}
function nh(e) {
  return this.selectAll(e == null ? eh : th(typeof e == "function" ? e : Rc(e)));
}
function rh(e) {
  typeof e != "function" && (e = zc(e));
  for (var t = this._groups, n = t.length, r = new Array(n), i = 0; i < n; ++i)
    for (var o = t[i], s = o.length, a = r[i] = [], l, c = 0; c < s; ++c)
      (l = o[c]) && e.call(l, l.__data__, c, o) && a.push(l);
  return new ot(r, this._parents);
}
function Lc(e) {
  return new Array(e.length);
}
function ih() {
  return new ot(this._enter || this._groups.map(Lc), this._parents);
}
function Ji(e, t) {
  this.ownerDocument = e.ownerDocument, this.namespaceURI = e.namespaceURI, this._next = null, this._parent = e, this.__data__ = t;
}
Ji.prototype = {
  constructor: Ji,
  appendChild: function(e) {
    return this._parent.insertBefore(e, this._next);
  },
  insertBefore: function(e, t) {
    return this._parent.insertBefore(e, t);
  },
  querySelector: function(e) {
    return this._parent.querySelector(e);
  },
  querySelectorAll: function(e) {
    return this._parent.querySelectorAll(e);
  }
};
function oh(e) {
  return function() {
    return e;
  };
}
function sh(e, t, n, r, i, o) {
  for (var s = 0, a, l = t.length, c = o.length; s < c; ++s)
    (a = t[s]) ? (a.__data__ = o[s], r[s] = a) : n[s] = new Ji(e, o[s]);
  for (; s < l; ++s)
    (a = t[s]) && (i[s] = a);
}
function ah(e, t, n, r, i, o, s) {
  var a, l, c = /* @__PURE__ */ new Map(), f = t.length, h = o.length, d = new Array(f), v;
  for (a = 0; a < f; ++a)
    (l = t[a]) && (d[a] = v = s.call(l, l.__data__, a, t) + "", c.has(v) ? i[a] = l : c.set(v, l));
  for (a = 0; a < h; ++a)
    v = s.call(e, o[a], a, o) + "", (l = c.get(v)) ? (r[a] = l, l.__data__ = o[a], c.delete(v)) : n[a] = new Ji(e, o[a]);
  for (a = 0; a < f; ++a)
    (l = t[a]) && c.get(d[a]) === l && (i[a] = l);
}
function lh(e) {
  return e.__data__;
}
function ch(e, t) {
  if (!arguments.length) return Array.from(this, lh);
  var n = t ? ah : sh, r = this._parents, i = this._groups;
  typeof e != "function" && (e = oh(e));
  for (var o = i.length, s = new Array(o), a = new Array(o), l = new Array(o), c = 0; c < o; ++c) {
    var f = r[c], h = i[c], d = h.length, v = uh(e.call(f, f && f.__data__, c, r)), m = v.length, _ = a[c] = new Array(m), w = s[c] = new Array(m), S = l[c] = new Array(d);
    n(f, h, _, w, S, v, t);
    for (var N = 0, M = 0, E, R; N < m; ++N)
      if (E = _[N]) {
        for (N >= M && (M = N + 1); !(R = w[M]) && ++M < m; ) ;
        E._next = R || null;
      }
  }
  return s = new ot(s, r), s._enter = a, s._exit = l, s;
}
function uh(e) {
  return typeof e == "object" && "length" in e ? e : Array.from(e);
}
function fh() {
  return new ot(this._exit || this._groups.map(Lc), this._parents);
}
function dh(e, t, n) {
  var r = this.enter(), i = this, o = this.exit();
  return typeof e == "function" ? (r = e(r), r && (r = r.selection())) : r = r.append(e + ""), t != null && (i = t(i), i && (i = i.selection())), n == null ? o.remove() : n(o), r && i ? r.merge(i).order() : i;
}
function hh(e) {
  for (var t = e.selection ? e.selection() : e, n = this._groups, r = t._groups, i = n.length, o = r.length, s = Math.min(i, o), a = new Array(i), l = 0; l < s; ++l)
    for (var c = n[l], f = r[l], h = c.length, d = a[l] = new Array(h), v, m = 0; m < h; ++m)
      (v = c[m] || f[m]) && (d[m] = v);
  for (; l < i; ++l)
    a[l] = n[l];
  return new ot(a, this._parents);
}
function gh() {
  for (var e = this._groups, t = -1, n = e.length; ++t < n; )
    for (var r = e[t], i = r.length - 1, o = r[i], s; --i >= 0; )
      (s = r[i]) && (o && s.compareDocumentPosition(o) ^ 4 && o.parentNode.insertBefore(s, o), o = s);
  return this;
}
function vh(e) {
  e || (e = yh);
  function t(h, d) {
    return h && d ? e(h.__data__, d.__data__) : !h - !d;
  }
  for (var n = this._groups, r = n.length, i = new Array(r), o = 0; o < r; ++o) {
    for (var s = n[o], a = s.length, l = i[o] = new Array(a), c, f = 0; f < a; ++f)
      (c = s[f]) && (l[f] = c);
    l.sort(t);
  }
  return new ot(i, this._parents).order();
}
function yh(e, t) {
  return e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
function ph() {
  var e = arguments[0];
  return arguments[0] = this, e.apply(null, arguments), this;
}
function mh() {
  return Array.from(this);
}
function _h() {
  for (var e = this._groups, t = 0, n = e.length; t < n; ++t)
    for (var r = e[t], i = 0, o = r.length; i < o; ++i) {
      var s = r[i];
      if (s) return s;
    }
  return null;
}
function wh() {
  let e = 0;
  for (const t of this) ++e;
  return e;
}
function xh() {
  return !this.node();
}
function bh(e) {
  for (var t = this._groups, n = 0, r = t.length; n < r; ++n)
    for (var i = t[n], o = 0, s = i.length, a; o < s; ++o)
      (a = i[o]) && e.call(a, a.__data__, o, i);
  return this;
}
function Eh(e) {
  return function() {
    this.removeAttribute(e);
  };
}
function kh(e) {
  return function() {
    this.removeAttributeNS(e.space, e.local);
  };
}
function Sh(e, t) {
  return function() {
    this.setAttribute(e, t);
  };
}
function Ph(e, t) {
  return function() {
    this.setAttributeNS(e.space, e.local, t);
  };
}
function Mh(e, t) {
  return function() {
    var n = t.apply(this, arguments);
    n == null ? this.removeAttribute(e) : this.setAttribute(e, n);
  };
}
function Ch(e, t) {
  return function() {
    var n = t.apply(this, arguments);
    n == null ? this.removeAttributeNS(e.space, e.local) : this.setAttributeNS(e.space, e.local, n);
  };
}
function Ah(e, t) {
  var n = ko(e);
  if (arguments.length < 2) {
    var r = this.node();
    return n.local ? r.getAttributeNS(n.space, n.local) : r.getAttribute(n);
  }
  return this.each((t == null ? n.local ? kh : Eh : typeof t == "function" ? n.local ? Ch : Mh : n.local ? Ph : Sh)(n, t));
}
function Hc(e) {
  return e.ownerDocument && e.ownerDocument.defaultView || e.document && e || e.defaultView;
}
function Nh(e) {
  return function() {
    this.style.removeProperty(e);
  };
}
function Ih(e, t, n) {
  return function() {
    this.style.setProperty(e, t, n);
  };
}
function Th(e, t, n) {
  return function() {
    var r = t.apply(this, arguments);
    r == null ? this.style.removeProperty(e) : this.style.setProperty(e, r, n);
  };
}
function Oh(e, t, n) {
  return arguments.length > 1 ? this.each((t == null ? Nh : typeof t == "function" ? Th : Ih)(e, t, n ?? "")) : vr(this.node(), e);
}
function vr(e, t) {
  return e.style.getPropertyValue(t) || Hc(e).getComputedStyle(e, null).getPropertyValue(t);
}
function Dh(e) {
  return function() {
    delete this[e];
  };
}
function zh(e, t) {
  return function() {
    this[e] = t;
  };
}
function Rh(e, t) {
  return function() {
    var n = t.apply(this, arguments);
    n == null ? delete this[e] : this[e] = n;
  };
}
function Lh(e, t) {
  return arguments.length > 1 ? this.each((t == null ? Dh : typeof t == "function" ? Rh : zh)(e, t)) : this.node()[e];
}
function Vc(e) {
  return e.trim().split(/^|\s+/);
}
function ea(e) {
  return e.classList || new Fc(e);
}
function Fc(e) {
  this._node = e, this._names = Vc(e.getAttribute("class") || "");
}
Fc.prototype = {
  add: function(e) {
    var t = this._names.indexOf(e);
    t < 0 && (this._names.push(e), this._node.setAttribute("class", this._names.join(" ")));
  },
  remove: function(e) {
    var t = this._names.indexOf(e);
    t >= 0 && (this._names.splice(t, 1), this._node.setAttribute("class", this._names.join(" ")));
  },
  contains: function(e) {
    return this._names.indexOf(e) >= 0;
  }
};
function Yc(e, t) {
  for (var n = ea(e), r = -1, i = t.length; ++r < i; ) n.add(t[r]);
}
function Bc(e, t) {
  for (var n = ea(e), r = -1, i = t.length; ++r < i; ) n.remove(t[r]);
}
function Hh(e) {
  return function() {
    Yc(this, e);
  };
}
function Vh(e) {
  return function() {
    Bc(this, e);
  };
}
function Fh(e, t) {
  return function() {
    (t.apply(this, arguments) ? Yc : Bc)(this, e);
  };
}
function Yh(e, t) {
  var n = Vc(e + "");
  if (arguments.length < 2) {
    for (var r = ea(this.node()), i = -1, o = n.length; ++i < o; ) if (!r.contains(n[i])) return !1;
    return !0;
  }
  return this.each((typeof t == "function" ? Fh : t ? Hh : Vh)(n, t));
}
function Bh() {
  this.textContent = "";
}
function Kh(e) {
  return function() {
    this.textContent = e;
  };
}
function Xh(e) {
  return function() {
    var t = e.apply(this, arguments);
    this.textContent = t ?? "";
  };
}
function qh(e) {
  return arguments.length ? this.each(e == null ? Bh : (typeof e == "function" ? Xh : Kh)(e)) : this.node().textContent;
}
function Wh() {
  this.innerHTML = "";
}
function Zh(e) {
  return function() {
    this.innerHTML = e;
  };
}
function jh(e) {
  return function() {
    var t = e.apply(this, arguments);
    this.innerHTML = t ?? "";
  };
}
function Gh(e) {
  return arguments.length ? this.each(e == null ? Wh : (typeof e == "function" ? jh : Zh)(e)) : this.node().innerHTML;
}
function Uh() {
  this.nextSibling && this.parentNode.appendChild(this);
}
function Qh() {
  return this.each(Uh);
}
function Jh() {
  this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function $h() {
  return this.each(Jh);
}
function eg(e) {
  var t = typeof e == "function" ? e : Oc(e);
  return this.select(function() {
    return this.appendChild(t.apply(this, arguments));
  });
}
function tg() {
  return null;
}
function ng(e, t) {
  var n = typeof e == "function" ? e : Oc(e), r = t == null ? tg : typeof t == "function" ? t : $s(t);
  return this.select(function() {
    return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
  });
}
function rg() {
  var e = this.parentNode;
  e && e.removeChild(this);
}
function ig() {
  return this.each(rg);
}
function og() {
  var e = this.cloneNode(!1), t = this.parentNode;
  return t ? t.insertBefore(e, this.nextSibling) : e;
}
function sg() {
  var e = this.cloneNode(!0), t = this.parentNode;
  return t ? t.insertBefore(e, this.nextSibling) : e;
}
function ag(e) {
  return this.select(e ? sg : og);
}
function lg(e) {
  return arguments.length ? this.property("__data__", e) : this.node().__data__;
}
function cg(e) {
  return function(t) {
    e.call(this, t, this.__data__);
  };
}
function ug(e) {
  return e.trim().split(/^|\s+/).map(function(t) {
    var n = "", r = t.indexOf(".");
    return r >= 0 && (n = t.slice(r + 1), t = t.slice(0, r)), { type: t, name: n };
  });
}
function fg(e) {
  return function() {
    var t = this.__on;
    if (t) {
      for (var n = 0, r = -1, i = t.length, o; n < i; ++n)
        o = t[n], (!e.type || o.type === e.type) && o.name === e.name ? this.removeEventListener(o.type, o.listener, o.options) : t[++r] = o;
      ++r ? t.length = r : delete this.__on;
    }
  };
}
function dg(e, t, n) {
  return function() {
    var r = this.__on, i, o = cg(t);
    if (r) {
      for (var s = 0, a = r.length; s < a; ++s)
        if ((i = r[s]).type === e.type && i.name === e.name) {
          this.removeEventListener(i.type, i.listener, i.options), this.addEventListener(i.type, i.listener = o, i.options = n), i.value = t;
          return;
        }
    }
    this.addEventListener(e.type, o, n), i = { type: e.type, name: e.name, value: t, listener: o, options: n }, r ? r.push(i) : this.__on = [i];
  };
}
function hg(e, t, n) {
  var r = ug(e + ""), i, o = r.length, s;
  if (arguments.length < 2) {
    var a = this.node().__on;
    if (a) {
      for (var l = 0, c = a.length, f; l < c; ++l)
        for (i = 0, f = a[l]; i < o; ++i)
          if ((s = r[i]).type === f.type && s.name === f.name)
            return f.value;
    }
    return;
  }
  for (a = t ? dg : fg, i = 0; i < o; ++i) this.each(a(r[i], t, n));
  return this;
}
function Kc(e, t, n) {
  var r = Hc(e), i = r.CustomEvent;
  typeof i == "function" ? i = new i(t, n) : (i = r.document.createEvent("Event"), n ? (i.initEvent(t, n.bubbles, n.cancelable), i.detail = n.detail) : i.initEvent(t, !1, !1)), e.dispatchEvent(i);
}
function gg(e, t) {
  return function() {
    return Kc(this, e, t);
  };
}
function vg(e, t) {
  return function() {
    return Kc(this, e, t.apply(this, arguments));
  };
}
function yg(e, t) {
  return this.each((typeof t == "function" ? vg : gg)(e, t));
}
function* pg() {
  for (var e = this._groups, t = 0, n = e.length; t < n; ++t)
    for (var r = e[t], i = 0, o = r.length, s; i < o; ++i)
      (s = r[i]) && (yield s);
}
var Xc = [null];
function ot(e, t) {
  this._groups = e, this._parents = t;
}
function bi() {
  return new ot([[document.documentElement]], Xc);
}
function mg() {
  return this;
}
ot.prototype = bi.prototype = {
  constructor: ot,
  select: Xd,
  selectAll: jd,
  selectChild: Jd,
  selectChildren: nh,
  filter: rh,
  data: ch,
  enter: ih,
  exit: fh,
  join: dh,
  merge: hh,
  selection: mg,
  order: gh,
  sort: vh,
  call: ph,
  nodes: mh,
  node: _h,
  size: wh,
  empty: xh,
  each: bh,
  attr: Ah,
  style: Oh,
  property: Lh,
  classed: Yh,
  text: qh,
  html: Gh,
  raise: Qh,
  lower: $h,
  append: eg,
  insert: ng,
  remove: ig,
  clone: ag,
  datum: lg,
  on: hg,
  dispatch: yg,
  [Symbol.iterator]: pg
};
function bt(e) {
  return typeof e == "string" ? new ot([[document.querySelector(e)]], [document.documentElement]) : new ot([[e]], Xc);
}
function _g(e) {
  let t;
  for (; t = e.sourceEvent; ) e = t;
  return e;
}
function Ct(e, t) {
  if (e = _g(e), t === void 0 && (t = e.currentTarget), t) {
    var n = t.ownerSVGElement || t;
    if (n.createSVGPoint) {
      var r = n.createSVGPoint();
      return r.x = e.clientX, r.y = e.clientY, r = r.matrixTransform(t.getScreenCTM().inverse()), [r.x, r.y];
    }
    if (t.getBoundingClientRect) {
      var i = t.getBoundingClientRect();
      return [e.clientX - i.left - t.clientLeft, e.clientY - i.top - t.clientTop];
    }
  }
  return [e.pageX, e.pageY];
}
const wg = { passive: !1 }, ei = { capture: !0, passive: !1 };
function Bo(e) {
  e.stopImmediatePropagation();
}
function Un(e) {
  e.preventDefault(), e.stopImmediatePropagation();
}
function qc(e) {
  var t = e.document.documentElement, n = bt(e).on("dragstart.drag", Un, ei);
  "onselectstart" in t ? n.on("selectstart.drag", Un, ei) : (t.__noselect = t.style.MozUserSelect, t.style.MozUserSelect = "none");
}
function Wc(e, t) {
  var n = e.document.documentElement, r = bt(e).on("dragstart.drag", null);
  t && (r.on("click.drag", Un, ei), setTimeout(function() {
    r.on("click.drag", null);
  }, 0)), "onselectstart" in n ? r.on("selectstart.drag", null) : (n.style.MozUserSelect = n.__noselect, delete n.__noselect);
}
const Ii = (e) => () => e;
function ws(e, {
  sourceEvent: t,
  subject: n,
  target: r,
  identifier: i,
  active: o,
  x: s,
  y: a,
  dx: l,
  dy: c,
  dispatch: f
}) {
  Object.defineProperties(this, {
    type: { value: e, enumerable: !0, configurable: !0 },
    sourceEvent: { value: t, enumerable: !0, configurable: !0 },
    subject: { value: n, enumerable: !0, configurable: !0 },
    target: { value: r, enumerable: !0, configurable: !0 },
    identifier: { value: i, enumerable: !0, configurable: !0 },
    active: { value: o, enumerable: !0, configurable: !0 },
    x: { value: s, enumerable: !0, configurable: !0 },
    y: { value: a, enumerable: !0, configurable: !0 },
    dx: { value: l, enumerable: !0, configurable: !0 },
    dy: { value: c, enumerable: !0, configurable: !0 },
    _: { value: f }
  });
}
ws.prototype.on = function() {
  var e = this._.on.apply(this._, arguments);
  return e === this._ ? this : e;
};
function xg(e) {
  return !e.ctrlKey && !e.button;
}
function bg() {
  return this.parentNode;
}
function Eg(e, t) {
  return t ?? { x: e.x, y: e.y };
}
function kg() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function Sg() {
  var e = xg, t = bg, n = Eg, r = kg, i = {}, o = Eo("start", "drag", "end"), s = 0, a, l, c, f, h = 0;
  function d(E) {
    E.on("mousedown.drag", v).filter(r).on("touchstart.drag", w).on("touchmove.drag", S, wg).on("touchend.drag touchcancel.drag", N).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function v(E, R) {
    if (!(f || !e.call(this, E, R))) {
      var F = M(this, t.call(this, E, R), E, R, "mouse");
      F && (bt(E.view).on("mousemove.drag", m, ei).on("mouseup.drag", _, ei), qc(E.view), Bo(E), c = !1, a = E.clientX, l = E.clientY, F("start", E));
    }
  }
  function m(E) {
    if (Un(E), !c) {
      var R = E.clientX - a, F = E.clientY - l;
      c = R * R + F * F > h;
    }
    i.mouse("drag", E);
  }
  function _(E) {
    bt(E.view).on("mousemove.drag mouseup.drag", null), Wc(E.view, c), Un(E), i.mouse("end", E);
  }
  function w(E, R) {
    if (e.call(this, E, R)) {
      var F = E.changedTouches, B = t.call(this, E, R), L = F.length, Y, j;
      for (Y = 0; Y < L; ++Y)
        (j = M(this, B, E, R, F[Y].identifier, F[Y])) && (Bo(E), j("start", E, F[Y]));
    }
  }
  function S(E) {
    var R = E.changedTouches, F = R.length, B, L;
    for (B = 0; B < F; ++B)
      (L = i[R[B].identifier]) && (Un(E), L("drag", E, R[B]));
  }
  function N(E) {
    var R = E.changedTouches, F = R.length, B, L;
    for (f && clearTimeout(f), f = setTimeout(function() {
      f = null;
    }, 500), B = 0; B < F; ++B)
      (L = i[R[B].identifier]) && (Bo(E), L("end", E, R[B]));
  }
  function M(E, R, F, B, L, Y) {
    var j = o.copy(), I = Ct(Y || F, R), g, x, p;
    if ((p = n.call(E, new ws("beforestart", {
      sourceEvent: F,
      target: d,
      identifier: L,
      active: s,
      x: I[0],
      y: I[1],
      dx: 0,
      dy: 0,
      dispatch: j
    }), B)) != null)
      return g = p.x - I[0] || 0, x = p.y - I[1] || 0, function k(P, C, T) {
        var O = I, H;
        switch (P) {
          case "start":
            i[L] = k, H = s++;
            break;
          case "end":
            delete i[L], --s;
          // falls through
          case "drag":
            I = Ct(T || C, R), H = s;
            break;
        }
        j.call(
          P,
          E,
          new ws(P, {
            sourceEvent: C,
            subject: p,
            target: d,
            identifier: L,
            active: H,
            x: I[0] + g,
            y: I[1] + x,
            dx: I[0] - O[0],
            dy: I[1] - O[1],
            dispatch: j
          }),
          B
        );
      };
  }
  return d.filter = function(E) {
    return arguments.length ? (e = typeof E == "function" ? E : Ii(!!E), d) : e;
  }, d.container = function(E) {
    return arguments.length ? (t = typeof E == "function" ? E : Ii(E), d) : t;
  }, d.subject = function(E) {
    return arguments.length ? (n = typeof E == "function" ? E : Ii(E), d) : n;
  }, d.touchable = function(E) {
    return arguments.length ? (r = typeof E == "function" ? E : Ii(!!E), d) : r;
  }, d.on = function() {
    var E = o.on.apply(o, arguments);
    return E === o ? d : E;
  }, d.clickDistance = function(E) {
    return arguments.length ? (h = (E = +E) * E, d) : Math.sqrt(h);
  }, d;
}
function ta(e, t, n) {
  e.prototype = t.prototype = n, n.constructor = e;
}
function Zc(e, t) {
  var n = Object.create(e.prototype);
  for (var r in t) n[r] = t[r];
  return n;
}
function Ei() {
}
var ti = 0.7, $i = 1 / ti, Qn = "\\s*([+-]?\\d+)\\s*", ni = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", zt = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", Pg = /^#([0-9a-f]{3,8})$/, Mg = new RegExp(`^rgb\\(${Qn},${Qn},${Qn}\\)$`), Cg = new RegExp(`^rgb\\(${zt},${zt},${zt}\\)$`), Ag = new RegExp(`^rgba\\(${Qn},${Qn},${Qn},${ni}\\)$`), Ng = new RegExp(`^rgba\\(${zt},${zt},${zt},${ni}\\)$`), Ig = new RegExp(`^hsl\\(${ni},${zt},${zt}\\)$`), Tg = new RegExp(`^hsla\\(${ni},${zt},${zt},${ni}\\)$`), La = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
ta(Ei, Dn, {
  copy(e) {
    return Object.assign(new this.constructor(), this, e);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: Ha,
  // Deprecated! Use color.formatHex.
  formatHex: Ha,
  formatHex8: Og,
  formatHsl: Dg,
  formatRgb: Va,
  toString: Va
});
function Ha() {
  return this.rgb().formatHex();
}
function Og() {
  return this.rgb().formatHex8();
}
function Dg() {
  return jc(this).formatHsl();
}
function Va() {
  return this.rgb().formatRgb();
}
function Dn(e) {
  var t, n;
  return e = (e + "").trim().toLowerCase(), (t = Pg.exec(e)) ? (n = t[1].length, t = parseInt(t[1], 16), n === 6 ? Fa(t) : n === 3 ? new Je(t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, (t & 15) << 4 | t & 15, 1) : n === 8 ? Ti(t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, (t & 255) / 255) : n === 4 ? Ti(t >> 12 & 15 | t >> 8 & 240, t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, ((t & 15) << 4 | t & 15) / 255) : null) : (t = Mg.exec(e)) ? new Je(t[1], t[2], t[3], 1) : (t = Cg.exec(e)) ? new Je(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, 1) : (t = Ag.exec(e)) ? Ti(t[1], t[2], t[3], t[4]) : (t = Ng.exec(e)) ? Ti(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, t[4]) : (t = Ig.exec(e)) ? Ka(t[1], t[2] / 100, t[3] / 100, 1) : (t = Tg.exec(e)) ? Ka(t[1], t[2] / 100, t[3] / 100, t[4]) : La.hasOwnProperty(e) ? Fa(La[e]) : e === "transparent" ? new Je(NaN, NaN, NaN, 0) : null;
}
function Fa(e) {
  return new Je(e >> 16 & 255, e >> 8 & 255, e & 255, 1);
}
function Ti(e, t, n, r) {
  return r <= 0 && (e = t = n = NaN), new Je(e, t, n, r);
}
function zg(e) {
  return e instanceof Ei || (e = Dn(e)), e ? (e = e.rgb(), new Je(e.r, e.g, e.b, e.opacity)) : new Je();
}
function xs(e, t, n, r) {
  return arguments.length === 1 ? zg(e) : new Je(e, t, n, r ?? 1);
}
function Je(e, t, n, r) {
  this.r = +e, this.g = +t, this.b = +n, this.opacity = +r;
}
ta(Je, xs, Zc(Ei, {
  brighter(e) {
    return e = e == null ? $i : Math.pow($i, e), new Je(this.r * e, this.g * e, this.b * e, this.opacity);
  },
  darker(e) {
    return e = e == null ? ti : Math.pow(ti, e), new Je(this.r * e, this.g * e, this.b * e, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Je(An(this.r), An(this.g), An(this.b), eo(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: Ya,
  // Deprecated! Use color.formatHex.
  formatHex: Ya,
  formatHex8: Rg,
  formatRgb: Ba,
  toString: Ba
}));
function Ya() {
  return `#${bn(this.r)}${bn(this.g)}${bn(this.b)}`;
}
function Rg() {
  return `#${bn(this.r)}${bn(this.g)}${bn(this.b)}${bn((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function Ba() {
  const e = eo(this.opacity);
  return `${e === 1 ? "rgb(" : "rgba("}${An(this.r)}, ${An(this.g)}, ${An(this.b)}${e === 1 ? ")" : `, ${e})`}`;
}
function eo(e) {
  return isNaN(e) ? 1 : Math.max(0, Math.min(1, e));
}
function An(e) {
  return Math.max(0, Math.min(255, Math.round(e) || 0));
}
function bn(e) {
  return e = An(e), (e < 16 ? "0" : "") + e.toString(16);
}
function Ka(e, t, n, r) {
  return r <= 0 ? e = t = n = NaN : n <= 0 || n >= 1 ? e = t = NaN : t <= 0 && (e = NaN), new Et(e, t, n, r);
}
function jc(e) {
  if (e instanceof Et) return new Et(e.h, e.s, e.l, e.opacity);
  if (e instanceof Ei || (e = Dn(e)), !e) return new Et();
  if (e instanceof Et) return e;
  e = e.rgb();
  var t = e.r / 255, n = e.g / 255, r = e.b / 255, i = Math.min(t, n, r), o = Math.max(t, n, r), s = NaN, a = o - i, l = (o + i) / 2;
  return a ? (t === o ? s = (n - r) / a + (n < r) * 6 : n === o ? s = (r - t) / a + 2 : s = (t - n) / a + 4, a /= l < 0.5 ? o + i : 2 - o - i, s *= 60) : a = l > 0 && l < 1 ? 0 : s, new Et(s, a, l, e.opacity);
}
function Lg(e, t, n, r) {
  return arguments.length === 1 ? jc(e) : new Et(e, t, n, r ?? 1);
}
function Et(e, t, n, r) {
  this.h = +e, this.s = +t, this.l = +n, this.opacity = +r;
}
ta(Et, Lg, Zc(Ei, {
  brighter(e) {
    return e = e == null ? $i : Math.pow($i, e), new Et(this.h, this.s, this.l * e, this.opacity);
  },
  darker(e) {
    return e = e == null ? ti : Math.pow(ti, e), new Et(this.h, this.s, this.l * e, this.opacity);
  },
  rgb() {
    var e = this.h % 360 + (this.h < 0) * 360, t = isNaN(e) || isNaN(this.s) ? 0 : this.s, n = this.l, r = n + (n < 0.5 ? n : 1 - n) * t, i = 2 * n - r;
    return new Je(
      Ko(e >= 240 ? e - 240 : e + 120, i, r),
      Ko(e, i, r),
      Ko(e < 120 ? e + 240 : e - 120, i, r),
      this.opacity
    );
  },
  clamp() {
    return new Et(Xa(this.h), Oi(this.s), Oi(this.l), eo(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const e = eo(this.opacity);
    return `${e === 1 ? "hsl(" : "hsla("}${Xa(this.h)}, ${Oi(this.s) * 100}%, ${Oi(this.l) * 100}%${e === 1 ? ")" : `, ${e})`}`;
  }
}));
function Xa(e) {
  return e = (e || 0) % 360, e < 0 ? e + 360 : e;
}
function Oi(e) {
  return Math.max(0, Math.min(1, e || 0));
}
function Ko(e, t, n) {
  return (e < 60 ? t + (n - t) * e / 60 : e < 180 ? n : e < 240 ? t + (n - t) * (240 - e) / 60 : t) * 255;
}
const na = (e) => () => e;
function Hg(e, t) {
  return function(n) {
    return e + n * t;
  };
}
function Vg(e, t, n) {
  return e = Math.pow(e, n), t = Math.pow(t, n) - e, n = 1 / n, function(r) {
    return Math.pow(e + r * t, n);
  };
}
function Fg(e) {
  return (e = +e) == 1 ? Gc : function(t, n) {
    return n - t ? Vg(t, n, e) : na(isNaN(t) ? n : t);
  };
}
function Gc(e, t) {
  var n = t - e;
  return n ? Hg(e, n) : na(isNaN(e) ? t : e);
}
const to = (function e(t) {
  var n = Fg(t);
  function r(i, o) {
    var s = n((i = xs(i)).r, (o = xs(o)).r), a = n(i.g, o.g), l = n(i.b, o.b), c = Gc(i.opacity, o.opacity);
    return function(f) {
      return i.r = s(f), i.g = a(f), i.b = l(f), i.opacity = c(f), i + "";
    };
  }
  return r.gamma = e, r;
})(1);
function Yg(e, t) {
  t || (t = []);
  var n = e ? Math.min(t.length, e.length) : 0, r = t.slice(), i;
  return function(o) {
    for (i = 0; i < n; ++i) r[i] = e[i] * (1 - o) + t[i] * o;
    return r;
  };
}
function Bg(e) {
  return ArrayBuffer.isView(e) && !(e instanceof DataView);
}
function Kg(e, t) {
  var n = t ? t.length : 0, r = e ? Math.min(n, e.length) : 0, i = new Array(r), o = new Array(n), s;
  for (s = 0; s < r; ++s) i[s] = Jr(e[s], t[s]);
  for (; s < n; ++s) o[s] = t[s];
  return function(a) {
    for (s = 0; s < r; ++s) o[s] = i[s](a);
    return o;
  };
}
function Xg(e, t) {
  var n = /* @__PURE__ */ new Date();
  return e = +e, t = +t, function(r) {
    return n.setTime(e * (1 - r) + t * r), n;
  };
}
function Tt(e, t) {
  return e = +e, t = +t, function(n) {
    return e * (1 - n) + t * n;
  };
}
function qg(e, t) {
  var n = {}, r = {}, i;
  (e === null || typeof e != "object") && (e = {}), (t === null || typeof t != "object") && (t = {});
  for (i in t)
    i in e ? n[i] = Jr(e[i], t[i]) : r[i] = t[i];
  return function(o) {
    for (i in n) r[i] = n[i](o);
    return r;
  };
}
var bs = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, Xo = new RegExp(bs.source, "g");
function Wg(e) {
  return function() {
    return e;
  };
}
function Zg(e) {
  return function(t) {
    return e(t) + "";
  };
}
function Uc(e, t) {
  var n = bs.lastIndex = Xo.lastIndex = 0, r, i, o, s = -1, a = [], l = [];
  for (e = e + "", t = t + ""; (r = bs.exec(e)) && (i = Xo.exec(t)); )
    (o = i.index) > n && (o = t.slice(n, o), a[s] ? a[s] += o : a[++s] = o), (r = r[0]) === (i = i[0]) ? a[s] ? a[s] += i : a[++s] = i : (a[++s] = null, l.push({ i: s, x: Tt(r, i) })), n = Xo.lastIndex;
  return n < t.length && (o = t.slice(n), a[s] ? a[s] += o : a[++s] = o), a.length < 2 ? l[0] ? Zg(l[0].x) : Wg(t) : (t = l.length, function(c) {
    for (var f = 0, h; f < t; ++f) a[(h = l[f]).i] = h.x(c);
    return a.join("");
  });
}
function Jr(e, t) {
  var n = typeof t, r;
  return t == null || n === "boolean" ? na(t) : (n === "number" ? Tt : n === "string" ? (r = Dn(t)) ? (t = r, to) : Uc : t instanceof Dn ? to : t instanceof Date ? Xg : Bg(t) ? Yg : Array.isArray(t) ? Kg : typeof t.valueOf != "function" && typeof t.toString != "function" || isNaN(t) ? qg : Tt)(e, t);
}
var qa = 180 / Math.PI, Es = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function Qc(e, t, n, r, i, o) {
  var s, a, l;
  return (s = Math.sqrt(e * e + t * t)) && (e /= s, t /= s), (l = e * n + t * r) && (n -= e * l, r -= t * l), (a = Math.sqrt(n * n + r * r)) && (n /= a, r /= a, l /= a), e * r < t * n && (e = -e, t = -t, l = -l, s = -s), {
    translateX: i,
    translateY: o,
    rotate: Math.atan2(t, e) * qa,
    skewX: Math.atan(l) * qa,
    scaleX: s,
    scaleY: a
  };
}
var Di;
function jg(e) {
  const t = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(e + "");
  return t.isIdentity ? Es : Qc(t.a, t.b, t.c, t.d, t.e, t.f);
}
function Gg(e) {
  return e == null || (Di || (Di = document.createElementNS("http://www.w3.org/2000/svg", "g")), Di.setAttribute("transform", e), !(e = Di.transform.baseVal.consolidate())) ? Es : (e = e.matrix, Qc(e.a, e.b, e.c, e.d, e.e, e.f));
}
function Jc(e, t, n, r) {
  function i(c) {
    return c.length ? c.pop() + " " : "";
  }
  function o(c, f, h, d, v, m) {
    if (c !== h || f !== d) {
      var _ = v.push("translate(", null, t, null, n);
      m.push({ i: _ - 4, x: Tt(c, h) }, { i: _ - 2, x: Tt(f, d) });
    } else (h || d) && v.push("translate(" + h + t + d + n);
  }
  function s(c, f, h, d) {
    c !== f ? (c - f > 180 ? f += 360 : f - c > 180 && (c += 360), d.push({ i: h.push(i(h) + "rotate(", null, r) - 2, x: Tt(c, f) })) : f && h.push(i(h) + "rotate(" + f + r);
  }
  function a(c, f, h, d) {
    c !== f ? d.push({ i: h.push(i(h) + "skewX(", null, r) - 2, x: Tt(c, f) }) : f && h.push(i(h) + "skewX(" + f + r);
  }
  function l(c, f, h, d, v, m) {
    if (c !== h || f !== d) {
      var _ = v.push(i(v) + "scale(", null, ",", null, ")");
      m.push({ i: _ - 4, x: Tt(c, h) }, { i: _ - 2, x: Tt(f, d) });
    } else (h !== 1 || d !== 1) && v.push(i(v) + "scale(" + h + "," + d + ")");
  }
  return function(c, f) {
    var h = [], d = [];
    return c = e(c), f = e(f), o(c.translateX, c.translateY, f.translateX, f.translateY, h, d), s(c.rotate, f.rotate, h, d), a(c.skewX, f.skewX, h, d), l(c.scaleX, c.scaleY, f.scaleX, f.scaleY, h, d), c = f = null, function(v) {
      for (var m = -1, _ = d.length, w; ++m < _; ) h[(w = d[m]).i] = w.x(v);
      return h.join("");
    };
  };
}
var Ug = Jc(jg, "px, ", "px)", "deg)"), Qg = Jc(Gg, ", ", ")", ")"), Jg = 1e-12;
function Wa(e) {
  return ((e = Math.exp(e)) + 1 / e) / 2;
}
function $g(e) {
  return ((e = Math.exp(e)) - 1 / e) / 2;
}
function ev(e) {
  return ((e = Math.exp(2 * e)) - 1) / (e + 1);
}
const Xi = (function e(t, n, r) {
  function i(o, s) {
    var a = o[0], l = o[1], c = o[2], f = s[0], h = s[1], d = s[2], v = f - a, m = h - l, _ = v * v + m * m, w, S;
    if (_ < Jg)
      S = Math.log(d / c) / t, w = function(B) {
        return [
          a + B * v,
          l + B * m,
          c * Math.exp(t * B * S)
        ];
      };
    else {
      var N = Math.sqrt(_), M = (d * d - c * c + r * _) / (2 * c * n * N), E = (d * d - c * c - r * _) / (2 * d * n * N), R = Math.log(Math.sqrt(M * M + 1) - M), F = Math.log(Math.sqrt(E * E + 1) - E);
      S = (F - R) / t, w = function(B) {
        var L = B * S, Y = Wa(R), j = c / (n * N) * (Y * ev(t * L + R) - $g(R));
        return [
          a + j * v,
          l + j * m,
          c * Y / Wa(t * L + R)
        ];
      };
    }
    return w.duration = S * 1e3 * t / Math.SQRT2, w;
  }
  return i.rho = function(o) {
    var s = Math.max(1e-3, +o), a = s * s, l = a * a;
    return e(s, a, l);
  }, i;
})(Math.SQRT2, 2, 4);
var yr = 0, Zr = 0, Xr = 0, $c = 1e3, no, jr, ro = 0, zn = 0, So = 0, ri = typeof performance == "object" && performance.now ? performance : Date, eu = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(e) {
  setTimeout(e, 17);
};
function ra() {
  return zn || (eu(tv), zn = ri.now() + So);
}
function tv() {
  zn = 0;
}
function io() {
  this._call = this._time = this._next = null;
}
io.prototype = tu.prototype = {
  constructor: io,
  restart: function(e, t, n) {
    if (typeof e != "function") throw new TypeError("callback is not a function");
    n = (n == null ? ra() : +n) + (t == null ? 0 : +t), !this._next && jr !== this && (jr ? jr._next = this : no = this, jr = this), this._call = e, this._time = n, ks();
  },
  stop: function() {
    this._call && (this._call = null, this._time = 1 / 0, ks());
  }
};
function tu(e, t, n) {
  var r = new io();
  return r.restart(e, t, n), r;
}
function nv() {
  ra(), ++yr;
  for (var e = no, t; e; )
    (t = zn - e._time) >= 0 && e._call.call(void 0, t), e = e._next;
  --yr;
}
function Za() {
  zn = (ro = ri.now()) + So, yr = Zr = 0;
  try {
    nv();
  } finally {
    yr = 0, iv(), zn = 0;
  }
}
function rv() {
  var e = ri.now(), t = e - ro;
  t > $c && (So -= t, ro = e);
}
function iv() {
  for (var e, t = no, n, r = 1 / 0; t; )
    t._call ? (r > t._time && (r = t._time), e = t, t = t._next) : (n = t._next, t._next = null, t = e ? e._next = n : no = n);
  jr = e, ks(r);
}
function ks(e) {
  if (!yr) {
    Zr && (Zr = clearTimeout(Zr));
    var t = e - zn;
    t > 24 ? (e < 1 / 0 && (Zr = setTimeout(Za, e - ri.now() - So)), Xr && (Xr = clearInterval(Xr))) : (Xr || (ro = ri.now(), Xr = setInterval(rv, $c)), yr = 1, eu(Za));
  }
}
function ja(e, t, n) {
  var r = new io();
  return t = t == null ? 0 : +t, r.restart((i) => {
    r.stop(), e(i + t);
  }, t, n), r;
}
var ov = Eo("start", "end", "cancel", "interrupt"), sv = [], nu = 0, Ga = 1, Ss = 2, qi = 3, Ua = 4, Ps = 5, Wi = 6;
function Po(e, t, n, r, i, o) {
  var s = e.__transition;
  if (!s) e.__transition = {};
  else if (n in s) return;
  av(e, n, {
    name: t,
    index: r,
    // For context during callback.
    group: i,
    // For context during callback.
    on: ov,
    tween: sv,
    time: o.time,
    delay: o.delay,
    duration: o.duration,
    ease: o.ease,
    timer: null,
    state: nu
  });
}
function ia(e, t) {
  var n = Mt(e, t);
  if (n.state > nu) throw new Error("too late; already scheduled");
  return n;
}
function Ft(e, t) {
  var n = Mt(e, t);
  if (n.state > qi) throw new Error("too late; already running");
  return n;
}
function Mt(e, t) {
  var n = e.__transition;
  if (!n || !(n = n[t])) throw new Error("transition not found");
  return n;
}
function av(e, t, n) {
  var r = e.__transition, i;
  r[t] = n, n.timer = tu(o, 0, n.time);
  function o(c) {
    n.state = Ga, n.timer.restart(s, n.delay, n.time), n.delay <= c && s(c - n.delay);
  }
  function s(c) {
    var f, h, d, v;
    if (n.state !== Ga) return l();
    for (f in r)
      if (v = r[f], v.name === n.name) {
        if (v.state === qi) return ja(s);
        v.state === Ua ? (v.state = Wi, v.timer.stop(), v.on.call("interrupt", e, e.__data__, v.index, v.group), delete r[f]) : +f < t && (v.state = Wi, v.timer.stop(), v.on.call("cancel", e, e.__data__, v.index, v.group), delete r[f]);
      }
    if (ja(function() {
      n.state === qi && (n.state = Ua, n.timer.restart(a, n.delay, n.time), a(c));
    }), n.state = Ss, n.on.call("start", e, e.__data__, n.index, n.group), n.state === Ss) {
      for (n.state = qi, i = new Array(d = n.tween.length), f = 0, h = -1; f < d; ++f)
        (v = n.tween[f].value.call(e, e.__data__, n.index, n.group)) && (i[++h] = v);
      i.length = h + 1;
    }
  }
  function a(c) {
    for (var f = c < n.duration ? n.ease.call(null, c / n.duration) : (n.timer.restart(l), n.state = Ps, 1), h = -1, d = i.length; ++h < d; )
      i[h].call(e, f);
    n.state === Ps && (n.on.call("end", e, e.__data__, n.index, n.group), l());
  }
  function l() {
    n.state = Wi, n.timer.stop(), delete r[t];
    for (var c in r) return;
    delete e.__transition;
  }
}
function Zi(e, t) {
  var n = e.__transition, r, i, o = !0, s;
  if (n) {
    t = t == null ? null : t + "";
    for (s in n) {
      if ((r = n[s]).name !== t) {
        o = !1;
        continue;
      }
      i = r.state > Ss && r.state < Ps, r.state = Wi, r.timer.stop(), r.on.call(i ? "interrupt" : "cancel", e, e.__data__, r.index, r.group), delete n[s];
    }
    o && delete e.__transition;
  }
}
function lv(e) {
  return this.each(function() {
    Zi(this, e);
  });
}
function cv(e, t) {
  var n, r;
  return function() {
    var i = Ft(this, e), o = i.tween;
    if (o !== n) {
      r = n = o;
      for (var s = 0, a = r.length; s < a; ++s)
        if (r[s].name === t) {
          r = r.slice(), r.splice(s, 1);
          break;
        }
    }
    i.tween = r;
  };
}
function uv(e, t, n) {
  var r, i;
  if (typeof n != "function") throw new Error();
  return function() {
    var o = Ft(this, e), s = o.tween;
    if (s !== r) {
      i = (r = s).slice();
      for (var a = { name: t, value: n }, l = 0, c = i.length; l < c; ++l)
        if (i[l].name === t) {
          i[l] = a;
          break;
        }
      l === c && i.push(a);
    }
    o.tween = i;
  };
}
function fv(e, t) {
  var n = this._id;
  if (e += "", arguments.length < 2) {
    for (var r = Mt(this.node(), n).tween, i = 0, o = r.length, s; i < o; ++i)
      if ((s = r[i]).name === e)
        return s.value;
    return null;
  }
  return this.each((t == null ? cv : uv)(n, e, t));
}
function oa(e, t, n) {
  var r = e._id;
  return e.each(function() {
    var i = Ft(this, r);
    (i.value || (i.value = {}))[t] = n.apply(this, arguments);
  }), function(i) {
    return Mt(i, r).value[t];
  };
}
function ru(e, t) {
  var n;
  return (typeof t == "number" ? Tt : t instanceof Dn ? to : (n = Dn(t)) ? (t = n, to) : Uc)(e, t);
}
function dv(e) {
  return function() {
    this.removeAttribute(e);
  };
}
function hv(e) {
  return function() {
    this.removeAttributeNS(e.space, e.local);
  };
}
function gv(e, t, n) {
  var r, i = n + "", o;
  return function() {
    var s = this.getAttribute(e);
    return s === i ? null : s === r ? o : o = t(r = s, n);
  };
}
function vv(e, t, n) {
  var r, i = n + "", o;
  return function() {
    var s = this.getAttributeNS(e.space, e.local);
    return s === i ? null : s === r ? o : o = t(r = s, n);
  };
}
function yv(e, t, n) {
  var r, i, o;
  return function() {
    var s, a = n(this), l;
    return a == null ? void this.removeAttribute(e) : (s = this.getAttribute(e), l = a + "", s === l ? null : s === r && l === i ? o : (i = l, o = t(r = s, a)));
  };
}
function pv(e, t, n) {
  var r, i, o;
  return function() {
    var s, a = n(this), l;
    return a == null ? void this.removeAttributeNS(e.space, e.local) : (s = this.getAttributeNS(e.space, e.local), l = a + "", s === l ? null : s === r && l === i ? o : (i = l, o = t(r = s, a)));
  };
}
function mv(e, t) {
  var n = ko(e), r = n === "transform" ? Qg : ru;
  return this.attrTween(e, typeof t == "function" ? (n.local ? pv : yv)(n, r, oa(this, "attr." + e, t)) : t == null ? (n.local ? hv : dv)(n) : (n.local ? vv : gv)(n, r, t));
}
function _v(e, t) {
  return function(n) {
    this.setAttribute(e, t.call(this, n));
  };
}
function wv(e, t) {
  return function(n) {
    this.setAttributeNS(e.space, e.local, t.call(this, n));
  };
}
function xv(e, t) {
  var n, r;
  function i() {
    var o = t.apply(this, arguments);
    return o !== r && (n = (r = o) && wv(e, o)), n;
  }
  return i._value = t, i;
}
function bv(e, t) {
  var n, r;
  function i() {
    var o = t.apply(this, arguments);
    return o !== r && (n = (r = o) && _v(e, o)), n;
  }
  return i._value = t, i;
}
function Ev(e, t) {
  var n = "attr." + e;
  if (arguments.length < 2) return (n = this.tween(n)) && n._value;
  if (t == null) return this.tween(n, null);
  if (typeof t != "function") throw new Error();
  var r = ko(e);
  return this.tween(n, (r.local ? xv : bv)(r, t));
}
function kv(e, t) {
  return function() {
    ia(this, e).delay = +t.apply(this, arguments);
  };
}
function Sv(e, t) {
  return t = +t, function() {
    ia(this, e).delay = t;
  };
}
function Pv(e) {
  var t = this._id;
  return arguments.length ? this.each((typeof e == "function" ? kv : Sv)(t, e)) : Mt(this.node(), t).delay;
}
function Mv(e, t) {
  return function() {
    Ft(this, e).duration = +t.apply(this, arguments);
  };
}
function Cv(e, t) {
  return t = +t, function() {
    Ft(this, e).duration = t;
  };
}
function Av(e) {
  var t = this._id;
  return arguments.length ? this.each((typeof e == "function" ? Mv : Cv)(t, e)) : Mt(this.node(), t).duration;
}
function Nv(e, t) {
  if (typeof t != "function") throw new Error();
  return function() {
    Ft(this, e).ease = t;
  };
}
function Iv(e) {
  var t = this._id;
  return arguments.length ? this.each(Nv(t, e)) : Mt(this.node(), t).ease;
}
function Tv(e, t) {
  return function() {
    var n = t.apply(this, arguments);
    if (typeof n != "function") throw new Error();
    Ft(this, e).ease = n;
  };
}
function Ov(e) {
  if (typeof e != "function") throw new Error();
  return this.each(Tv(this._id, e));
}
function Dv(e) {
  typeof e != "function" && (e = zc(e));
  for (var t = this._groups, n = t.length, r = new Array(n), i = 0; i < n; ++i)
    for (var o = t[i], s = o.length, a = r[i] = [], l, c = 0; c < s; ++c)
      (l = o[c]) && e.call(l, l.__data__, c, o) && a.push(l);
  return new $t(r, this._parents, this._name, this._id);
}
function zv(e) {
  if (e._id !== this._id) throw new Error();
  for (var t = this._groups, n = e._groups, r = t.length, i = n.length, o = Math.min(r, i), s = new Array(r), a = 0; a < o; ++a)
    for (var l = t[a], c = n[a], f = l.length, h = s[a] = new Array(f), d, v = 0; v < f; ++v)
      (d = l[v] || c[v]) && (h[v] = d);
  for (; a < r; ++a)
    s[a] = t[a];
  return new $t(s, this._parents, this._name, this._id);
}
function Rv(e) {
  return (e + "").trim().split(/^|\s+/).every(function(t) {
    var n = t.indexOf(".");
    return n >= 0 && (t = t.slice(0, n)), !t || t === "start";
  });
}
function Lv(e, t, n) {
  var r, i, o = Rv(t) ? ia : Ft;
  return function() {
    var s = o(this, e), a = s.on;
    a !== r && (i = (r = a).copy()).on(t, n), s.on = i;
  };
}
function Hv(e, t) {
  var n = this._id;
  return arguments.length < 2 ? Mt(this.node(), n).on.on(e) : this.each(Lv(n, e, t));
}
function Vv(e) {
  return function() {
    var t = this.parentNode;
    for (var n in this.__transition) if (+n !== e) return;
    t && t.removeChild(this);
  };
}
function Fv() {
  return this.on("end.remove", Vv(this._id));
}
function Yv(e) {
  var t = this._name, n = this._id;
  typeof e != "function" && (e = $s(e));
  for (var r = this._groups, i = r.length, o = new Array(i), s = 0; s < i; ++s)
    for (var a = r[s], l = a.length, c = o[s] = new Array(l), f, h, d = 0; d < l; ++d)
      (f = a[d]) && (h = e.call(f, f.__data__, d, a)) && ("__data__" in f && (h.__data__ = f.__data__), c[d] = h, Po(c[d], t, n, d, c, Mt(f, n)));
  return new $t(o, this._parents, t, n);
}
function Bv(e) {
  var t = this._name, n = this._id;
  typeof e != "function" && (e = Dc(e));
  for (var r = this._groups, i = r.length, o = [], s = [], a = 0; a < i; ++a)
    for (var l = r[a], c = l.length, f, h = 0; h < c; ++h)
      if (f = l[h]) {
        for (var d = e.call(f, f.__data__, h, l), v, m = Mt(f, n), _ = 0, w = d.length; _ < w; ++_)
          (v = d[_]) && Po(v, t, n, _, d, m);
        o.push(d), s.push(f);
      }
  return new $t(o, s, t, n);
}
var Kv = bi.prototype.constructor;
function Xv() {
  return new Kv(this._groups, this._parents);
}
function qv(e, t) {
  var n, r, i;
  return function() {
    var o = vr(this, e), s = (this.style.removeProperty(e), vr(this, e));
    return o === s ? null : o === n && s === r ? i : i = t(n = o, r = s);
  };
}
function iu(e) {
  return function() {
    this.style.removeProperty(e);
  };
}
function Wv(e, t, n) {
  var r, i = n + "", o;
  return function() {
    var s = vr(this, e);
    return s === i ? null : s === r ? o : o = t(r = s, n);
  };
}
function Zv(e, t, n) {
  var r, i, o;
  return function() {
    var s = vr(this, e), a = n(this), l = a + "";
    return a == null && (l = a = (this.style.removeProperty(e), vr(this, e))), s === l ? null : s === r && l === i ? o : (i = l, o = t(r = s, a));
  };
}
function jv(e, t) {
  var n, r, i, o = "style." + t, s = "end." + o, a;
  return function() {
    var l = Ft(this, e), c = l.on, f = l.value[o] == null ? a || (a = iu(t)) : void 0;
    (c !== n || i !== f) && (r = (n = c).copy()).on(s, i = f), l.on = r;
  };
}
function Gv(e, t, n) {
  var r = (e += "") == "transform" ? Ug : ru;
  return t == null ? this.styleTween(e, qv(e, r)).on("end.style." + e, iu(e)) : typeof t == "function" ? this.styleTween(e, Zv(e, r, oa(this, "style." + e, t))).each(jv(this._id, e)) : this.styleTween(e, Wv(e, r, t), n).on("end.style." + e, null);
}
function Uv(e, t, n) {
  return function(r) {
    this.style.setProperty(e, t.call(this, r), n);
  };
}
function Qv(e, t, n) {
  var r, i;
  function o() {
    var s = t.apply(this, arguments);
    return s !== i && (r = (i = s) && Uv(e, s, n)), r;
  }
  return o._value = t, o;
}
function Jv(e, t, n) {
  var r = "style." + (e += "");
  if (arguments.length < 2) return (r = this.tween(r)) && r._value;
  if (t == null) return this.tween(r, null);
  if (typeof t != "function") throw new Error();
  return this.tween(r, Qv(e, t, n ?? ""));
}
function $v(e) {
  return function() {
    this.textContent = e;
  };
}
function ey(e) {
  return function() {
    var t = e(this);
    this.textContent = t ?? "";
  };
}
function ty(e) {
  return this.tween("text", typeof e == "function" ? ey(oa(this, "text", e)) : $v(e == null ? "" : e + ""));
}
function ny(e) {
  return function(t) {
    this.textContent = e.call(this, t);
  };
}
function ry(e) {
  var t, n;
  function r() {
    var i = e.apply(this, arguments);
    return i !== n && (t = (n = i) && ny(i)), t;
  }
  return r._value = e, r;
}
function iy(e) {
  var t = "text";
  if (arguments.length < 1) return (t = this.tween(t)) && t._value;
  if (e == null) return this.tween(t, null);
  if (typeof e != "function") throw new Error();
  return this.tween(t, ry(e));
}
function oy() {
  for (var e = this._name, t = this._id, n = ou(), r = this._groups, i = r.length, o = 0; o < i; ++o)
    for (var s = r[o], a = s.length, l, c = 0; c < a; ++c)
      if (l = s[c]) {
        var f = Mt(l, t);
        Po(l, e, n, c, s, {
          time: f.time + f.delay + f.duration,
          delay: 0,
          duration: f.duration,
          ease: f.ease
        });
      }
  return new $t(r, this._parents, e, n);
}
function sy() {
  var e, t, n = this, r = n._id, i = n.size();
  return new Promise(function(o, s) {
    var a = { value: s }, l = { value: function() {
      --i === 0 && o();
    } };
    n.each(function() {
      var c = Ft(this, r), f = c.on;
      f !== e && (t = (e = f).copy(), t._.cancel.push(a), t._.interrupt.push(a), t._.end.push(l)), c.on = t;
    }), i === 0 && o();
  });
}
var ay = 0;
function $t(e, t, n, r) {
  this._groups = e, this._parents = t, this._name = n, this._id = r;
}
function ou() {
  return ++ay;
}
var Yt = bi.prototype;
$t.prototype = {
  constructor: $t,
  select: Yv,
  selectAll: Bv,
  selectChild: Yt.selectChild,
  selectChildren: Yt.selectChildren,
  filter: Dv,
  merge: zv,
  selection: Xv,
  transition: oy,
  call: Yt.call,
  nodes: Yt.nodes,
  node: Yt.node,
  size: Yt.size,
  empty: Yt.empty,
  each: Yt.each,
  on: Hv,
  attr: mv,
  attrTween: Ev,
  style: Gv,
  styleTween: Jv,
  text: ty,
  textTween: iy,
  remove: Fv,
  tween: fv,
  delay: Pv,
  duration: Av,
  ease: Iv,
  easeVarying: Ov,
  end: sy,
  [Symbol.iterator]: Yt[Symbol.iterator]
};
function ly(e) {
  return ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2;
}
var cy = {
  time: null,
  // Set on use.
  delay: 0,
  duration: 250,
  ease: ly
};
function uy(e, t) {
  for (var n; !(n = e.__transition) || !(n = n[t]); )
    if (!(e = e.parentNode))
      throw new Error(`transition ${t} not found`);
  return n;
}
function fy(e) {
  var t, n;
  e instanceof $t ? (t = e._id, e = e._name) : (t = ou(), (n = cy).time = ra(), e = e == null ? null : e + "");
  for (var r = this._groups, i = r.length, o = 0; o < i; ++o)
    for (var s = r[o], a = s.length, l, c = 0; c < a; ++c)
      (l = s[c]) && Po(l, e, t, c, s, n || uy(l, t));
  return new $t(r, this._parents, e, t);
}
bi.prototype.interrupt = lv;
bi.prototype.transition = fy;
const zi = (e) => () => e;
function dy(e, {
  sourceEvent: t,
  target: n,
  transform: r,
  dispatch: i
}) {
  Object.defineProperties(this, {
    type: { value: e, enumerable: !0, configurable: !0 },
    sourceEvent: { value: t, enumerable: !0, configurable: !0 },
    target: { value: n, enumerable: !0, configurable: !0 },
    transform: { value: r, enumerable: !0, configurable: !0 },
    _: { value: i }
  });
}
function Gt(e, t, n) {
  this.k = e, this.x = t, this.y = n;
}
Gt.prototype = {
  constructor: Gt,
  scale: function(e) {
    return e === 1 ? this : new Gt(this.k * e, this.x, this.y);
  },
  translate: function(e, t) {
    return e === 0 & t === 0 ? this : new Gt(this.k, this.x + this.k * e, this.y + this.k * t);
  },
  apply: function(e) {
    return [e[0] * this.k + this.x, e[1] * this.k + this.y];
  },
  applyX: function(e) {
    return e * this.k + this.x;
  },
  applyY: function(e) {
    return e * this.k + this.y;
  },
  invert: function(e) {
    return [(e[0] - this.x) / this.k, (e[1] - this.y) / this.k];
  },
  invertX: function(e) {
    return (e - this.x) / this.k;
  },
  invertY: function(e) {
    return (e - this.y) / this.k;
  },
  rescaleX: function(e) {
    return e.copy().domain(e.range().map(this.invertX, this).map(e.invert, e));
  },
  rescaleY: function(e) {
    return e.copy().domain(e.range().map(this.invertY, this).map(e.invert, e));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var Mo = new Gt(1, 0, 0);
su.prototype = Gt.prototype;
function su(e) {
  for (; !e.__zoom; ) if (!(e = e.parentNode)) return Mo;
  return e.__zoom;
}
function qo(e) {
  e.stopImmediatePropagation();
}
function qr(e) {
  e.preventDefault(), e.stopImmediatePropagation();
}
function hy(e) {
  return (!e.ctrlKey || e.type === "wheel") && !e.button;
}
function gy() {
  var e = this;
  return e instanceof SVGElement ? (e = e.ownerSVGElement || e, e.hasAttribute("viewBox") ? (e = e.viewBox.baseVal, [[e.x, e.y], [e.x + e.width, e.y + e.height]]) : [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]]) : [[0, 0], [e.clientWidth, e.clientHeight]];
}
function Qa() {
  return this.__zoom || Mo;
}
function vy(e) {
  return -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 2e-3) * (e.ctrlKey ? 10 : 1);
}
function yy() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function py(e, t, n) {
  var r = e.invertX(t[0][0]) - n[0][0], i = e.invertX(t[1][0]) - n[1][0], o = e.invertY(t[0][1]) - n[0][1], s = e.invertY(t[1][1]) - n[1][1];
  return e.translate(
    i > r ? (r + i) / 2 : Math.min(0, r) || Math.max(0, i),
    s > o ? (o + s) / 2 : Math.min(0, o) || Math.max(0, s)
  );
}
function my() {
  var e = hy, t = gy, n = py, r = vy, i = yy, o = [0, 1 / 0], s = [[-1 / 0, -1 / 0], [1 / 0, 1 / 0]], a = 250, l = Xi, c = Eo("start", "zoom", "end"), f, h, d, v = 500, m = 150, _ = 0, w = 10;
  function S(p) {
    p.property("__zoom", Qa).on("wheel.zoom", L, { passive: !1 }).on("mousedown.zoom", Y).on("dblclick.zoom", j).filter(i).on("touchstart.zoom", I).on("touchmove.zoom", g).on("touchend.zoom touchcancel.zoom", x).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  S.transform = function(p, k, P, C) {
    var T = p.selection ? p.selection() : p;
    T.property("__zoom", Qa), p !== T ? R(p, k, P, C) : T.interrupt().each(function() {
      F(this, arguments).event(C).start().zoom(null, typeof k == "function" ? k.apply(this, arguments) : k).end();
    });
  }, S.scaleBy = function(p, k, P, C) {
    S.scaleTo(p, function() {
      var T = this.__zoom.k, O = typeof k == "function" ? k.apply(this, arguments) : k;
      return T * O;
    }, P, C);
  }, S.scaleTo = function(p, k, P, C) {
    S.transform(p, function() {
      var T = t.apply(this, arguments), O = this.__zoom, H = P == null ? E(T) : typeof P == "function" ? P.apply(this, arguments) : P, D = O.invert(H), z = typeof k == "function" ? k.apply(this, arguments) : k;
      return n(M(N(O, z), H, D), T, s);
    }, P, C);
  }, S.translateBy = function(p, k, P, C) {
    S.transform(p, function() {
      return n(this.__zoom.translate(
        typeof k == "function" ? k.apply(this, arguments) : k,
        typeof P == "function" ? P.apply(this, arguments) : P
      ), t.apply(this, arguments), s);
    }, null, C);
  }, S.translateTo = function(p, k, P, C, T) {
    S.transform(p, function() {
      var O = t.apply(this, arguments), H = this.__zoom, D = C == null ? E(O) : typeof C == "function" ? C.apply(this, arguments) : C;
      return n(Mo.translate(D[0], D[1]).scale(H.k).translate(
        typeof k == "function" ? -k.apply(this, arguments) : -k,
        typeof P == "function" ? -P.apply(this, arguments) : -P
      ), O, s);
    }, C, T);
  };
  function N(p, k) {
    return k = Math.max(o[0], Math.min(o[1], k)), k === p.k ? p : new Gt(k, p.x, p.y);
  }
  function M(p, k, P) {
    var C = k[0] - P[0] * p.k, T = k[1] - P[1] * p.k;
    return C === p.x && T === p.y ? p : new Gt(p.k, C, T);
  }
  function E(p) {
    return [(+p[0][0] + +p[1][0]) / 2, (+p[0][1] + +p[1][1]) / 2];
  }
  function R(p, k, P, C) {
    p.on("start.zoom", function() {
      F(this, arguments).event(C).start();
    }).on("interrupt.zoom end.zoom", function() {
      F(this, arguments).event(C).end();
    }).tween("zoom", function() {
      var T = this, O = arguments, H = F(T, O).event(C), D = t.apply(T, O), z = P == null ? E(D) : typeof P == "function" ? P.apply(T, O) : P, X = Math.max(D[1][0] - D[0][0], D[1][1] - D[0][1]), V = T.__zoom, Q = typeof k == "function" ? k.apply(T, O) : k, W = l(V.invert(z).concat(X / V.k), Q.invert(z).concat(X / Q.k));
      return function(G) {
        if (G === 1) G = Q;
        else {
          var Z = W(G), $ = X / Z[2];
          G = new Gt($, z[0] - Z[0] * $, z[1] - Z[1] * $);
        }
        H.zoom(null, G);
      };
    });
  }
  function F(p, k, P) {
    return !P && p.__zooming || new B(p, k);
  }
  function B(p, k) {
    this.that = p, this.args = k, this.active = 0, this.sourceEvent = null, this.extent = t.apply(p, k), this.taps = 0;
  }
  B.prototype = {
    event: function(p) {
      return p && (this.sourceEvent = p), this;
    },
    start: function() {
      return ++this.active === 1 && (this.that.__zooming = this, this.emit("start")), this;
    },
    zoom: function(p, k) {
      return this.mouse && p !== "mouse" && (this.mouse[1] = k.invert(this.mouse[0])), this.touch0 && p !== "touch" && (this.touch0[1] = k.invert(this.touch0[0])), this.touch1 && p !== "touch" && (this.touch1[1] = k.invert(this.touch1[0])), this.that.__zoom = k, this.emit("zoom"), this;
    },
    end: function() {
      return --this.active === 0 && (delete this.that.__zooming, this.emit("end")), this;
    },
    emit: function(p) {
      var k = bt(this.that).datum();
      c.call(
        p,
        this.that,
        new dy(p, {
          sourceEvent: this.sourceEvent,
          target: S,
          transform: this.that.__zoom,
          dispatch: c
        }),
        k
      );
    }
  };
  function L(p, ...k) {
    if (!e.apply(this, arguments)) return;
    var P = F(this, k).event(p), C = this.__zoom, T = Math.max(o[0], Math.min(o[1], C.k * Math.pow(2, r.apply(this, arguments)))), O = Ct(p);
    if (P.wheel)
      (P.mouse[0][0] !== O[0] || P.mouse[0][1] !== O[1]) && (P.mouse[1] = C.invert(P.mouse[0] = O)), clearTimeout(P.wheel);
    else {
      if (C.k === T) return;
      P.mouse = [O, C.invert(O)], Zi(this), P.start();
    }
    qr(p), P.wheel = setTimeout(H, m), P.zoom("mouse", n(M(N(C, T), P.mouse[0], P.mouse[1]), P.extent, s));
    function H() {
      P.wheel = null, P.end();
    }
  }
  function Y(p, ...k) {
    if (d || !e.apply(this, arguments)) return;
    var P = p.currentTarget, C = F(this, k, !0).event(p), T = bt(p.view).on("mousemove.zoom", z, !0).on("mouseup.zoom", X, !0), O = Ct(p, P), H = p.clientX, D = p.clientY;
    qc(p.view), qo(p), C.mouse = [O, this.__zoom.invert(O)], Zi(this), C.start();
    function z(V) {
      if (qr(V), !C.moved) {
        var Q = V.clientX - H, W = V.clientY - D;
        C.moved = Q * Q + W * W > _;
      }
      C.event(V).zoom("mouse", n(M(C.that.__zoom, C.mouse[0] = Ct(V, P), C.mouse[1]), C.extent, s));
    }
    function X(V) {
      T.on("mousemove.zoom mouseup.zoom", null), Wc(V.view, C.moved), qr(V), C.event(V).end();
    }
  }
  function j(p, ...k) {
    if (e.apply(this, arguments)) {
      var P = this.__zoom, C = Ct(p.changedTouches ? p.changedTouches[0] : p, this), T = P.invert(C), O = P.k * (p.shiftKey ? 0.5 : 2), H = n(M(N(P, O), C, T), t.apply(this, k), s);
      qr(p), a > 0 ? bt(this).transition().duration(a).call(R, H, C, p) : bt(this).call(S.transform, H, C, p);
    }
  }
  function I(p, ...k) {
    if (e.apply(this, arguments)) {
      var P = p.touches, C = P.length, T = F(this, k, p.changedTouches.length === C).event(p), O, H, D, z;
      for (qo(p), H = 0; H < C; ++H)
        D = P[H], z = Ct(D, this), z = [z, this.__zoom.invert(z), D.identifier], T.touch0 ? !T.touch1 && T.touch0[2] !== z[2] && (T.touch1 = z, T.taps = 0) : (T.touch0 = z, O = !0, T.taps = 1 + !!f);
      f && (f = clearTimeout(f)), O && (T.taps < 2 && (h = z[0], f = setTimeout(function() {
        f = null;
      }, v)), Zi(this), T.start());
    }
  }
  function g(p, ...k) {
    if (this.__zooming) {
      var P = F(this, k).event(p), C = p.changedTouches, T = C.length, O, H, D, z;
      for (qr(p), O = 0; O < T; ++O)
        H = C[O], D = Ct(H, this), P.touch0 && P.touch0[2] === H.identifier ? P.touch0[0] = D : P.touch1 && P.touch1[2] === H.identifier && (P.touch1[0] = D);
      if (H = P.that.__zoom, P.touch1) {
        var X = P.touch0[0], V = P.touch0[1], Q = P.touch1[0], W = P.touch1[1], G = (G = Q[0] - X[0]) * G + (G = Q[1] - X[1]) * G, Z = (Z = W[0] - V[0]) * Z + (Z = W[1] - V[1]) * Z;
        H = N(H, Math.sqrt(G / Z)), D = [(X[0] + Q[0]) / 2, (X[1] + Q[1]) / 2], z = [(V[0] + W[0]) / 2, (V[1] + W[1]) / 2];
      } else if (P.touch0) D = P.touch0[0], z = P.touch0[1];
      else return;
      P.zoom("touch", n(M(H, D, z), P.extent, s));
    }
  }
  function x(p, ...k) {
    if (this.__zooming) {
      var P = F(this, k).event(p), C = p.changedTouches, T = C.length, O, H;
      for (qo(p), d && clearTimeout(d), d = setTimeout(function() {
        d = null;
      }, v), O = 0; O < T; ++O)
        H = C[O], P.touch0 && P.touch0[2] === H.identifier ? delete P.touch0 : P.touch1 && P.touch1[2] === H.identifier && delete P.touch1;
      if (P.touch1 && !P.touch0 && (P.touch0 = P.touch1, delete P.touch1), P.touch0) P.touch0[1] = this.__zoom.invert(P.touch0[0]);
      else if (P.end(), P.taps === 2 && (H = Ct(H, this), Math.hypot(h[0] - H[0], h[1] - H[1]) < w)) {
        var D = bt(this).on("dblclick.zoom");
        D && D.apply(this, arguments);
      }
    }
  }
  return S.wheelDelta = function(p) {
    return arguments.length ? (r = typeof p == "function" ? p : zi(+p), S) : r;
  }, S.filter = function(p) {
    return arguments.length ? (e = typeof p == "function" ? p : zi(!!p), S) : e;
  }, S.touchable = function(p) {
    return arguments.length ? (i = typeof p == "function" ? p : zi(!!p), S) : i;
  }, S.extent = function(p) {
    return arguments.length ? (t = typeof p == "function" ? p : zi([[+p[0][0], +p[0][1]], [+p[1][0], +p[1][1]]]), S) : t;
  }, S.scaleExtent = function(p) {
    return arguments.length ? (o[0] = +p[0], o[1] = +p[1], S) : [o[0], o[1]];
  }, S.translateExtent = function(p) {
    return arguments.length ? (s[0][0] = +p[0][0], s[1][0] = +p[1][0], s[0][1] = +p[0][1], s[1][1] = +p[1][1], S) : [[s[0][0], s[0][1]], [s[1][0], s[1][1]]];
  }, S.constrain = function(p) {
    return arguments.length ? (n = p, S) : n;
  }, S.duration = function(p) {
    return arguments.length ? (a = +p, S) : a;
  }, S.interpolate = function(p) {
    return arguments.length ? (l = p, S) : l;
  }, S.on = function() {
    var p = c.on.apply(c, arguments);
    return p === c ? S : p;
  }, S.clickDistance = function(p) {
    return arguments.length ? (_ = (p = +p) * p, S) : Math.sqrt(_);
  }, S.tapDistance = function(p) {
    return arguments.length ? (w = +p, S) : w;
  }, S;
}
const Rn = {
  error001: () => "[React Flow]: Seems like you have not used zustand provider as an ancestor. Help: https://reactflow.dev/error#001",
  error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
  error003: (e) => `Node type "${e}" not found. Using fallback type "default".`,
  error004: () => "The React Flow parent container needs a width and a height to render the graph.",
  error005: () => "Only child nodes can use a parent extent.",
  error006: () => "Can't create edge. An edge needs a source and a target.",
  error007: (e) => `The old edge with id=${e} does not exist.`,
  error009: (e) => `Marker type "${e}" doesn't exist.`,
  error008: (e, { id: t, sourceHandle: n, targetHandle: r }) => `Couldn't create edge for ${e} handle id: "${e === "source" ? n : r}", edge id: ${t}.`,
  error010: () => "Handle: No node id found. Make sure to only use a Handle inside a custom Node.",
  error011: (e) => `Edge type "${e}" not found. Using fallback type "default".`,
  error012: (e) => `Node with id "${e}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
  error013: (e = "react") => `It seems that you haven't loaded the styles. Please import '@xyflow/${e}/dist/style.css' or base.css to make sure everything is working properly.`,
  error014: () => "useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.",
  error015: () => "It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs."
}, Ms = [
  [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
], au = ["Enter", " ", "Escape"], _y = {
  "node.a11yDescription.default": "Press enter or space to select a node. Press delete to remove it and escape to cancel.",
  "node.a11yDescription.keyboardDisabled": "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.",
  "node.a11yDescription.ariaLiveMessage": ({ direction: e, x: t, y: n }) => `Moved selected node ${e}. New position, x: ${t}, y: ${n}`,
  "edge.a11yDescription.default": "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.",
  // Control elements
  "controls.ariaLabel": "Control Panel",
  "controls.zoomIn.ariaLabel": "Zoom In",
  "controls.zoomOut.ariaLabel": "Zoom Out",
  "controls.fitView.ariaLabel": "Fit View",
  "controls.interactive.ariaLabel": "Toggle Interactivity",
  // Mini map
  "minimap.ariaLabel": "Mini Map",
  // Handle
  "handle.ariaLabel": "Handle"
};
var pr;
(function(e) {
  e.Strict = "strict", e.Loose = "loose";
})(pr || (pr = {}));
var Jn;
(function(e) {
  e.Free = "free", e.Vertical = "vertical", e.Horizontal = "horizontal";
})(Jn || (Jn = {}));
var oo;
(function(e) {
  e.Partial = "partial", e.Full = "full";
})(oo || (oo = {}));
const Cs = {
  inProgress: !1,
  isValid: null,
  from: null,
  fromHandle: null,
  fromPosition: null,
  fromNode: null,
  to: null,
  toHandle: null,
  toPosition: null,
  toNode: null,
  pointer: null
};
var rn;
(function(e) {
  e.Bezier = "default", e.Straight = "straight", e.Step = "step", e.SmoothStep = "smoothstep", e.SimpleBezier = "simplebezier";
})(rn || (rn = {}));
var ii;
(function(e) {
  e.Arrow = "arrow", e.ArrowClosed = "arrowclosed";
})(ii || (ii = {}));
var U;
(function(e) {
  e.Left = "left", e.Top = "top", e.Right = "right", e.Bottom = "bottom";
})(U || (U = {}));
const Ja = {
  [U.Left]: U.Right,
  [U.Right]: U.Left,
  [U.Top]: U.Bottom,
  [U.Bottom]: U.Top
};
function wy(e, t) {
  if (!e && !t)
    return !0;
  if (!e || !t || e.size !== t.size)
    return !1;
  if (!e.size && !t.size)
    return !0;
  for (const n of e.keys())
    if (!t.has(n))
      return !1;
  return !0;
}
function $a(e, t, n) {
  if (!n)
    return;
  const r = [];
  e.forEach((i, o) => {
    t != null && t.has(o) || r.push(i);
  }), r.length && n(r);
}
function xy(e) {
  return e === null ? null : e ? "valid" : "invalid";
}
const lu = (e) => "id" in e && "source" in e && "target" in e, by = (e) => "id" in e && "position" in e && !("source" in e) && !("target" in e), sa = (e) => "id" in e && "internals" in e && !("source" in e) && !("target" in e), ki = (e, t = [0, 0]) => {
  const { width: n, height: r } = Kn(e), i = e.origin ?? t, o = n * i[0], s = r * i[1];
  return {
    x: e.position.x - o,
    y: e.position.y - s
  };
}, Ey = (e, t = { nodeOrigin: [0, 0] }) => {
  if (process.env.NODE_ENV === "development" && !t.nodeLookup && console.warn("Please use `getNodesBounds` from `useReactFlow`/`useSvelteFlow` hook to ensure correct values for sub flows. If not possible, you have to provide a nodeLookup to support sub flows."), e.length === 0)
    return { x: 0, y: 0, width: 0, height: 0 };
  const n = e.reduce((r, i) => {
    const o = typeof i == "string";
    let s = !t.nodeLookup && !o ? i : void 0;
    t.nodeLookup && (s = o ? t.nodeLookup.get(i) : sa(i) ? i : t.nodeLookup.get(i.id));
    const a = s ? so(s, t.nodeOrigin) : { x: 0, y: 0, x2: 0, y2: 0 };
    return Ao(r, a);
  }, { x: 1 / 0, y: 1 / 0, x2: -1 / 0, y2: -1 / 0 });
  return No(n);
}, Co = (e, t = {}) => {
  let n = { x: 1 / 0, y: 1 / 0, x2: -1 / 0, y2: -1 / 0 }, r = !1;
  return e.forEach((i) => {
    (t.filter === void 0 || t.filter(i)) && (n = Ao(n, so(i)), r = !0);
  }), r ? No(n) : { x: 0, y: 0, width: 0, height: 0 };
}, aa = (e, t, [n, r, i] = [0, 0, 1], o = !1, s = !1) => {
  const a = {
    ...Pi(t, [n, r, i]),
    width: t.width / i,
    height: t.height / i
  }, l = [];
  for (const c of e.values()) {
    const { measured: f, selectable: h = !0, hidden: d = !1 } = c;
    if (s && !h || d)
      continue;
    const v = f.width ?? c.width ?? c.initialWidth ?? null, m = f.height ?? c.height ?? c.initialHeight ?? null, _ = oi(a, _r(c)), w = (v ?? 0) * (m ?? 0), S = o && _ > 0;
    (!c.internals.handleBounds || S || _ >= w || c.dragging) && l.push(c);
  }
  return l;
}, ky = (e, t) => {
  const n = /* @__PURE__ */ new Set();
  return e.forEach((r) => {
    n.add(r.id);
  }), t.filter((r) => n.has(r.source) || n.has(r.target));
};
function Sy(e, t) {
  const n = /* @__PURE__ */ new Map(), r = t != null && t.nodes ? new Set(t.nodes.map((i) => i.id)) : null;
  return e.forEach((i) => {
    i.measured.width && i.measured.height && ((t == null ? void 0 : t.includeHiddenNodes) || !i.hidden) && (!r || r.has(i.id)) && n.set(i.id, i);
  }), n;
}
async function Py({ nodes: e, width: t, height: n, panZoom: r, minZoom: i, maxZoom: o }, s) {
  if (e.size === 0)
    return Promise.resolve(!0);
  const a = Sy(e, s), l = Co(a), c = la(l, t, n, (s == null ? void 0 : s.minZoom) ?? i, (s == null ? void 0 : s.maxZoom) ?? o, (s == null ? void 0 : s.padding) ?? 0.1);
  return await r.setViewport(c, {
    duration: s == null ? void 0 : s.duration,
    ease: s == null ? void 0 : s.ease,
    interpolate: s == null ? void 0 : s.interpolate
  }), Promise.resolve(!0);
}
function cu({ nodeId: e, nextPosition: t, nodeLookup: n, nodeOrigin: r = [0, 0], nodeExtent: i, onError: o }) {
  const s = n.get(e), a = s.parentId ? n.get(s.parentId) : void 0, { x: l, y: c } = a ? a.internals.positionAbsolute : { x: 0, y: 0 }, f = s.origin ?? r;
  let h = s.extent || i;
  if (s.extent === "parent" && !s.expandParent)
    if (!a)
      o == null || o("005", Rn.error005());
    else {
      const v = a.measured.width, m = a.measured.height;
      v && m && (h = [
        [l, c],
        [l + v, c + m]
      ]);
    }
  else a && wr(s.extent) && (h = [
    [s.extent[0][0] + l, s.extent[0][1] + c],
    [s.extent[1][0] + l, s.extent[1][1] + c]
  ]);
  const d = wr(h) ? Ln(t, h, s.measured) : t;
  return (s.measured.width === void 0 || s.measured.height === void 0) && (o == null || o("015", Rn.error015())), {
    position: {
      x: d.x - l + (s.measured.width ?? 0) * f[0],
      y: d.y - c + (s.measured.height ?? 0) * f[1]
    },
    positionAbsolute: d
  };
}
async function My({ nodesToRemove: e = [], edgesToRemove: t = [], nodes: n, edges: r, onBeforeDelete: i }) {
  const o = new Set(e.map((d) => d.id)), s = [];
  for (const d of n) {
    if (d.deletable === !1)
      continue;
    const v = o.has(d.id), m = !v && d.parentId && s.find((_) => _.id === d.parentId);
    (v || m) && s.push(d);
  }
  const a = new Set(t.map((d) => d.id)), l = r.filter((d) => d.deletable !== !1), f = ky(s, l);
  for (const d of l)
    a.has(d.id) && !f.find((m) => m.id === d.id) && f.push(d);
  if (!i)
    return {
      edges: f,
      nodes: s
    };
  const h = await i({
    nodes: s,
    edges: f
  });
  return typeof h == "boolean" ? h ? { edges: f, nodes: s } : { edges: [], nodes: [] } : h;
}
const mr = (e, t = 0, n = 1) => Math.min(Math.max(e, t), n), Ln = (e = { x: 0, y: 0 }, t, n) => ({
  x: mr(e.x, t[0][0], t[1][0] - ((n == null ? void 0 : n.width) ?? 0)),
  y: mr(e.y, t[0][1], t[1][1] - ((n == null ? void 0 : n.height) ?? 0))
});
function uu(e, t, n) {
  const { width: r, height: i } = Kn(n), { x: o, y: s } = n.internals.positionAbsolute;
  return Ln(e, [
    [o, s],
    [o + r, s + i]
  ], t);
}
const el = (e, t, n) => e < t ? mr(Math.abs(e - t), 1, t) / t : e > n ? -mr(Math.abs(e - n), 1, t) / t : 0, fu = (e, t, n = 15, r = 40) => {
  const i = el(e.x, r, t.width - r) * n, o = el(e.y, r, t.height - r) * n;
  return [i, o];
}, Ao = (e, t) => ({
  x: Math.min(e.x, t.x),
  y: Math.min(e.y, t.y),
  x2: Math.max(e.x2, t.x2),
  y2: Math.max(e.y2, t.y2)
}), As = ({ x: e, y: t, width: n, height: r }) => ({
  x: e,
  y: t,
  x2: e + n,
  y2: t + r
}), No = ({ x: e, y: t, x2: n, y2: r }) => ({
  x: e,
  y: t,
  width: n - e,
  height: r - t
}), _r = (e, t = [0, 0]) => {
  var i, o;
  const { x: n, y: r } = sa(e) ? e.internals.positionAbsolute : ki(e, t);
  return {
    x: n,
    y: r,
    width: ((i = e.measured) == null ? void 0 : i.width) ?? e.width ?? e.initialWidth ?? 0,
    height: ((o = e.measured) == null ? void 0 : o.height) ?? e.height ?? e.initialHeight ?? 0
  };
}, so = (e, t = [0, 0]) => {
  var i, o;
  const { x: n, y: r } = sa(e) ? e.internals.positionAbsolute : ki(e, t);
  return {
    x: n,
    y: r,
    x2: n + (((i = e.measured) == null ? void 0 : i.width) ?? e.width ?? e.initialWidth ?? 0),
    y2: r + (((o = e.measured) == null ? void 0 : o.height) ?? e.height ?? e.initialHeight ?? 0)
  };
}, Cy = (e, t) => No(Ao(As(e), As(t))), oi = (e, t) => {
  const n = Math.max(0, Math.min(e.x + e.width, t.x + t.width) - Math.max(e.x, t.x)), r = Math.max(0, Math.min(e.y + e.height, t.y + t.height) - Math.max(e.y, t.y));
  return Math.ceil(n * r);
}, tl = (e) => Ut(e.width) && Ut(e.height) && Ut(e.x) && Ut(e.y), Ut = (e) => !isNaN(e) && isFinite(e), du = (e, t) => {
  process.env.NODE_ENV === "development" && console.warn(`[React Flow]: ${t} Help: https://reactflow.dev/error#${e}`);
}, Si = (e, t = [1, 1]) => ({
  x: t[0] * Math.round(e.x / t[0]),
  y: t[1] * Math.round(e.y / t[1])
}), Pi = ({ x: e, y: t }, [n, r, i], o = !1, s = [1, 1]) => {
  const a = {
    x: (e - n) / i,
    y: (t - r) / i
  };
  return o ? Si(a, s) : a;
}, ao = ({ x: e, y: t }, [n, r, i]) => ({
  x: e * i + n,
  y: t * i + r
});
function Wn(e, t) {
  if (typeof e == "number")
    return Math.floor((t - t / (1 + e)) * 0.5);
  if (typeof e == "string" && e.endsWith("px")) {
    const n = parseFloat(e);
    if (!Number.isNaN(n))
      return Math.floor(n);
  }
  if (typeof e == "string" && e.endsWith("%")) {
    const n = parseFloat(e);
    if (!Number.isNaN(n))
      return Math.floor(t * n * 0.01);
  }
  return console.error(`[React Flow] The padding value "${e}" is invalid. Please provide a number or a string with a valid unit (px or %).`), 0;
}
function Ay(e, t, n) {
  if (typeof e == "string" || typeof e == "number") {
    const r = Wn(e, n), i = Wn(e, t);
    return {
      top: r,
      right: i,
      bottom: r,
      left: i,
      x: i * 2,
      y: r * 2
    };
  }
  if (typeof e == "object") {
    const r = Wn(e.top ?? e.y ?? 0, n), i = Wn(e.bottom ?? e.y ?? 0, n), o = Wn(e.left ?? e.x ?? 0, t), s = Wn(e.right ?? e.x ?? 0, t);
    return { top: r, right: s, bottom: i, left: o, x: o + s, y: r + i };
  }
  return { top: 0, right: 0, bottom: 0, left: 0, x: 0, y: 0 };
}
function Ny(e, t, n, r, i, o) {
  const { x: s, y: a } = ao(e, [t, n, r]), { x: l, y: c } = ao({ x: e.x + e.width, y: e.y + e.height }, [t, n, r]), f = i - l, h = o - c;
  return {
    left: Math.floor(s),
    top: Math.floor(a),
    right: Math.floor(f),
    bottom: Math.floor(h)
  };
}
const la = (e, t, n, r, i, o) => {
  const s = Ay(o, t, n), a = (t - s.x) / e.width, l = (n - s.y) / e.height, c = Math.min(a, l), f = mr(c, r, i), h = e.x + e.width / 2, d = e.y + e.height / 2, v = t / 2 - h * f, m = n / 2 - d * f, _ = Ny(e, v, m, f, t, n), w = {
    left: Math.min(_.left - s.left, 0),
    top: Math.min(_.top - s.top, 0),
    right: Math.min(_.right - s.right, 0),
    bottom: Math.min(_.bottom - s.bottom, 0)
  };
  return {
    x: v - w.left + w.right,
    y: m - w.top + w.bottom,
    zoom: f
  };
}, lo = () => {
  var e;
  return typeof navigator < "u" && ((e = navigator == null ? void 0 : navigator.userAgent) == null ? void 0 : e.indexOf("Mac")) >= 0;
};
function wr(e) {
  return e != null && e !== "parent";
}
function Kn(e) {
  var t, n;
  return {
    width: ((t = e.measured) == null ? void 0 : t.width) ?? e.width ?? e.initialWidth ?? 0,
    height: ((n = e.measured) == null ? void 0 : n.height) ?? e.height ?? e.initialHeight ?? 0
  };
}
function Iy(e) {
  var t, n;
  return (((t = e.measured) == null ? void 0 : t.width) ?? e.width ?? e.initialWidth) !== void 0 && (((n = e.measured) == null ? void 0 : n.height) ?? e.height ?? e.initialHeight) !== void 0;
}
function Ty(e, t = { width: 0, height: 0 }, n, r, i) {
  const o = { ...e }, s = r.get(n);
  if (s) {
    const a = s.origin || i;
    o.x += s.internals.positionAbsolute.x - (t.width ?? 0) * a[0], o.y += s.internals.positionAbsolute.y - (t.height ?? 0) * a[1];
  }
  return o;
}
function Oy(e) {
  return { ..._y, ...e || {} };
}
function Wo(e, { snapGrid: t = [0, 0], snapToGrid: n = !1, transform: r, containerBounds: i }) {
  const { x: o, y: s } = St(e), a = Pi({ x: o - ((i == null ? void 0 : i.left) ?? 0), y: s - ((i == null ? void 0 : i.top) ?? 0) }, r), { x: l, y: c } = n ? Si(a, t) : a;
  return {
    xSnapped: l,
    ySnapped: c,
    ...a
  };
}
const hu = (e) => ({
  width: e.offsetWidth,
  height: e.offsetHeight
}), gu = (e) => {
  var t;
  return ((t = e == null ? void 0 : e.getRootNode) == null ? void 0 : t.call(e)) || (window == null ? void 0 : window.document);
}, Dy = ["INPUT", "SELECT", "TEXTAREA"];
function vu(e) {
  var r, i;
  const t = ((i = (r = e.composedPath) == null ? void 0 : r.call(e)) == null ? void 0 : i[0]) || e.target;
  return (t == null ? void 0 : t.nodeType) !== 1 ? !1 : Dy.includes(t.nodeName) || t.hasAttribute("contenteditable") || !!t.closest(".nokey");
}
const yu = (e) => "clientX" in e, St = (e, t) => {
  var o, s;
  const n = yu(e), r = n ? e.clientX : (o = e.touches) == null ? void 0 : o[0].clientX, i = n ? e.clientY : (s = e.touches) == null ? void 0 : s[0].clientY;
  return {
    x: r - ((t == null ? void 0 : t.left) ?? 0),
    y: i - ((t == null ? void 0 : t.top) ?? 0)
  };
}, nl = (e, t, n, r, i) => {
  const o = t.querySelectorAll(`.${e}`);
  return !o || !o.length ? null : Array.from(o).map((s) => {
    const a = s.getBoundingClientRect();
    return {
      id: s.getAttribute("data-handleid"),
      type: e,
      nodeId: i,
      position: s.getAttribute("data-handlepos"),
      x: (a.left - n.left) / r,
      y: (a.top - n.top) / r,
      ...hu(s)
    };
  });
};
function zy({ sourceX: e, sourceY: t, targetX: n, targetY: r, sourceControlX: i, sourceControlY: o, targetControlX: s, targetControlY: a }) {
  const l = e * 0.125 + i * 0.375 + s * 0.375 + n * 0.125, c = t * 0.125 + o * 0.375 + a * 0.375 + r * 0.125, f = Math.abs(l - e), h = Math.abs(c - t);
  return [l, c, f, h];
}
function Ri(e, t) {
  return e >= 0 ? 0.5 * e : t * 25 * Math.sqrt(-e);
}
function rl({ pos: e, x1: t, y1: n, x2: r, y2: i, c: o }) {
  switch (e) {
    case U.Left:
      return [t - Ri(t - r, o), n];
    case U.Right:
      return [t + Ri(r - t, o), n];
    case U.Top:
      return [t, n - Ri(n - i, o)];
    case U.Bottom:
      return [t, n + Ri(i - n, o)];
  }
}
function pu({ sourceX: e, sourceY: t, sourcePosition: n = U.Bottom, targetX: r, targetY: i, targetPosition: o = U.Top, curvature: s = 0.25 }) {
  const [a, l] = rl({
    pos: n,
    x1: e,
    y1: t,
    x2: r,
    y2: i,
    c: s
  }), [c, f] = rl({
    pos: o,
    x1: r,
    y1: i,
    x2: e,
    y2: t,
    c: s
  }), [h, d, v, m] = zy({
    sourceX: e,
    sourceY: t,
    targetX: r,
    targetY: i,
    sourceControlX: a,
    sourceControlY: l,
    targetControlX: c,
    targetControlY: f
  });
  return [
    `M${e},${t} C${a},${l} ${c},${f} ${r},${i}`,
    h,
    d,
    v,
    m
  ];
}
function mu({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
  const i = Math.abs(n - e) / 2, o = n < e ? n + i : n - i, s = Math.abs(r - t) / 2, a = r < t ? r + s : r - s;
  return [o, a, i, s];
}
function Ry({ sourceNode: e, targetNode: t, selected: n = !1, zIndex: r = 0, elevateOnSelect: i = !1, zIndexMode: o = "basic" }) {
  if (o === "manual")
    return r;
  const s = i && n ? r + 1e3 : r, a = Math.max(e.parentId || i && e.selected ? e.internals.z : 0, t.parentId || i && t.selected ? t.internals.z : 0);
  return s + a;
}
function Ly({ sourceNode: e, targetNode: t, width: n, height: r, transform: i }) {
  const o = Ao(so(e), so(t));
  o.x === o.x2 && (o.x2 += 1), o.y === o.y2 && (o.y2 += 1);
  const s = {
    x: -i[0] / i[2],
    y: -i[1] / i[2],
    width: n / i[2],
    height: r / i[2]
  };
  return oi(s, No(o)) > 0;
}
const Hy = ({ source: e, sourceHandle: t, target: n, targetHandle: r }) => `xy-edge__${e}${t || ""}-${n}${r || ""}`, Vy = (e, t) => t.some((n) => n.source === e.source && n.target === e.target && (n.sourceHandle === e.sourceHandle || !n.sourceHandle && !e.sourceHandle) && (n.targetHandle === e.targetHandle || !n.targetHandle && !e.targetHandle)), Fy = (e, t, n = {}) => {
  if (!e.source || !e.target)
    return du("006", Rn.error006()), t;
  const r = n.getEdgeId || Hy;
  let i;
  return lu(e) ? i = { ...e } : i = {
    ...e,
    id: r(e)
  }, Vy(i, t) ? t : (i.sourceHandle === null && delete i.sourceHandle, i.targetHandle === null && delete i.targetHandle, t.concat(i));
};
function xr({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
  const [i, o, s, a] = mu({
    sourceX: e,
    sourceY: t,
    targetX: n,
    targetY: r
  });
  return [`M ${e},${t}L ${n},${r}`, i, o, s, a];
}
const il = {
  [U.Left]: { x: -1, y: 0 },
  [U.Right]: { x: 1, y: 0 },
  [U.Top]: { x: 0, y: -1 },
  [U.Bottom]: { x: 0, y: 1 }
}, Yy = ({ source: e, sourcePosition: t = U.Bottom, target: n }) => t === U.Left || t === U.Right ? e.x < n.x ? { x: 1, y: 0 } : { x: -1, y: 0 } : e.y < n.y ? { x: 0, y: 1 } : { x: 0, y: -1 }, ol = (e, t) => Math.sqrt(Math.pow(t.x - e.x, 2) + Math.pow(t.y - e.y, 2));
function By({ source: e, sourcePosition: t = U.Bottom, target: n, targetPosition: r = U.Top, center: i, offset: o, stepPosition: s }) {
  const a = il[t], l = il[r], c = { x: e.x + a.x * o, y: e.y + a.y * o }, f = { x: n.x + l.x * o, y: n.y + l.y * o }, h = Yy({
    source: c,
    sourcePosition: t,
    target: f
  }), d = h.x !== 0 ? "x" : "y", v = h[d];
  let m = [], _, w;
  const S = { x: 0, y: 0 }, N = { x: 0, y: 0 }, [, , M, E] = mu({
    sourceX: e.x,
    sourceY: e.y,
    targetX: n.x,
    targetY: n.y
  });
  if (a[d] * l[d] === -1) {
    d === "x" ? (_ = i.x ?? c.x + (f.x - c.x) * s, w = i.y ?? (c.y + f.y) / 2) : (_ = i.x ?? (c.x + f.x) / 2, w = i.y ?? c.y + (f.y - c.y) * s);
    const L = [
      { x: _, y: c.y },
      { x: _, y: f.y }
    ], Y = [
      { x: c.x, y: w },
      { x: f.x, y: w }
    ];
    a[d] === v ? m = d === "x" ? L : Y : m = d === "x" ? Y : L;
  } else {
    const L = [{ x: c.x, y: f.y }], Y = [{ x: f.x, y: c.y }];
    if (d === "x" ? m = a.x === v ? Y : L : m = a.y === v ? L : Y, t === r) {
      const p = Math.abs(e[d] - n[d]);
      if (p <= o) {
        const k = Math.min(o - 1, o - p);
        a[d] === v ? S[d] = (c[d] > e[d] ? -1 : 1) * k : N[d] = (f[d] > n[d] ? -1 : 1) * k;
      }
    }
    if (t !== r) {
      const p = d === "x" ? "y" : "x", k = a[d] === l[p], P = c[p] > f[p], C = c[p] < f[p];
      (a[d] === 1 && (!k && P || k && C) || a[d] !== 1 && (!k && C || k && P)) && (m = d === "x" ? L : Y);
    }
    const j = { x: c.x + S.x, y: c.y + S.y }, I = { x: f.x + N.x, y: f.y + N.y }, g = Math.max(Math.abs(j.x - m[0].x), Math.abs(I.x - m[0].x)), x = Math.max(Math.abs(j.y - m[0].y), Math.abs(I.y - m[0].y));
    g >= x ? (_ = (j.x + I.x) / 2, w = m[0].y) : (_ = m[0].x, w = (j.y + I.y) / 2);
  }
  const R = { x: c.x + S.x, y: c.y + S.y }, F = { x: f.x + N.x, y: f.y + N.y };
  return [[
    e,
    // we only want to add the gapped source/target if they are different from the first/last point to avoid duplicates which can cause issues with the bends
    ...R.x !== m[0].x || R.y !== m[0].y ? [R] : [],
    ...m,
    ...F.x !== m[m.length - 1].x || F.y !== m[m.length - 1].y ? [F] : [],
    n
  ], _, w, M, E];
}
function Ky(e, t, n, r) {
  const i = Math.min(ol(e, t) / 2, ol(t, n) / 2, r), { x: o, y: s } = t;
  if (e.x === o && o === n.x || e.y === s && s === n.y)
    return `L${o} ${s}`;
  if (e.y === s) {
    const c = e.x < n.x ? -1 : 1, f = e.y < n.y ? 1 : -1;
    return `L ${o + i * c},${s}Q ${o},${s} ${o},${s + i * f}`;
  }
  const a = e.x < n.x ? 1 : -1, l = e.y < n.y ? -1 : 1;
  return `L ${o},${s + i * l}Q ${o},${s} ${o + i * a},${s}`;
}
function $n({ sourceX: e, sourceY: t, sourcePosition: n = U.Bottom, targetX: r, targetY: i, targetPosition: o = U.Top, borderRadius: s = 5, centerX: a, centerY: l, offset: c = 20, stepPosition: f = 0.5 }) {
  const [h, d, v, m, _] = By({
    source: { x: e, y: t },
    sourcePosition: n,
    target: { x: r, y: i },
    targetPosition: o,
    center: { x: a, y: l },
    offset: c,
    stepPosition: f
  });
  let w = `M${h[0].x} ${h[0].y}`;
  for (let S = 1; S < h.length - 1; S++)
    w += Ky(h[S - 1], h[S], h[S + 1], s);
  return w += `L${h[h.length - 1].x} ${h[h.length - 1].y}`, [w, d, v, m, _];
}
function sl(e) {
  var t;
  return e && !!(e.internals.handleBounds || (t = e.handles) != null && t.length) && !!(e.measured.width || e.width || e.initialWidth);
}
function Xy(e) {
  var h;
  const { sourceNode: t, targetNode: n } = e;
  if (!sl(t) || !sl(n))
    return null;
  const r = t.internals.handleBounds || al(t.handles), i = n.internals.handleBounds || al(n.handles), o = ll((r == null ? void 0 : r.source) ?? [], e.sourceHandle), s = ll(
    // when connection type is loose we can define all handles as sources and connect source -> source
    e.connectionMode === pr.Strict ? (i == null ? void 0 : i.target) ?? [] : ((i == null ? void 0 : i.target) ?? []).concat((i == null ? void 0 : i.source) ?? []),
    e.targetHandle
  );
  if (!o || !s)
    return (h = e.onError) == null || h.call(e, "008", Rn.error008(o ? "target" : "source", {
      id: e.id,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    })), null;
  const a = (o == null ? void 0 : o.position) || U.Bottom, l = (s == null ? void 0 : s.position) || U.Top, c = Hn(t, o, a), f = Hn(n, s, l);
  return {
    sourceX: c.x,
    sourceY: c.y,
    targetX: f.x,
    targetY: f.y,
    sourcePosition: a,
    targetPosition: l
  };
}
function al(e) {
  if (!e)
    return null;
  const t = [], n = [];
  for (const r of e)
    r.width = r.width ?? 1, r.height = r.height ?? 1, r.type === "source" ? t.push(r) : r.type === "target" && n.push(r);
  return {
    source: t,
    target: n
  };
}
function Hn(e, t, n = U.Left, r = !1) {
  const i = ((t == null ? void 0 : t.x) ?? 0) + e.internals.positionAbsolute.x, o = ((t == null ? void 0 : t.y) ?? 0) + e.internals.positionAbsolute.y, { width: s, height: a } = t ?? Kn(e);
  if (r)
    return { x: i + s / 2, y: o + a / 2 };
  switch ((t == null ? void 0 : t.position) ?? n) {
    case U.Top:
      return { x: i + s / 2, y: o };
    case U.Right:
      return { x: i + s, y: o + a / 2 };
    case U.Bottom:
      return { x: i + s / 2, y: o + a };
    case U.Left:
      return { x: i, y: o + a / 2 };
  }
}
function ll(e, t) {
  return e && (t ? e.find((n) => n.id === t) : e[0]) || null;
}
function Ns(e, t) {
  return e ? typeof e == "string" ? e : `${t ? `${t}__` : ""}${Object.keys(e).sort().map((r) => `${r}=${e[r]}`).join("&")}` : "";
}
function qy(e, { id: t, defaultColor: n, defaultMarkerStart: r, defaultMarkerEnd: i }) {
  const o = /* @__PURE__ */ new Set();
  return e.reduce((s, a) => ([a.markerStart || r, a.markerEnd || i].forEach((l) => {
    if (l && typeof l == "object") {
      const c = Ns(l, t);
      o.has(c) || (s.push({ id: c, color: l.color || n, ...l }), o.add(c));
    }
  }), s), []).sort((s, a) => s.id.localeCompare(a.id));
}
const _u = 1e3, Wy = 10, ca = {
  nodeOrigin: [0, 0],
  nodeExtent: Ms,
  elevateNodesOnSelect: !0,
  zIndexMode: "basic",
  defaults: {}
}, Zy = {
  ...ca,
  checkEquality: !0
};
function ua(e, t) {
  const n = { ...e };
  for (const r in t)
    t[r] !== void 0 && (n[r] = t[r]);
  return n;
}
function jy(e, t, n) {
  const r = ua(ca, n);
  for (const i of e.values())
    if (i.parentId)
      da(i, e, t, r);
    else {
      const o = ki(i, r.nodeOrigin), s = wr(i.extent) ? i.extent : r.nodeExtent, a = Ln(o, s, Kn(i));
      i.internals.positionAbsolute = a;
    }
}
function Gy(e, t) {
  if (!e.handles)
    return e.measured ? t == null ? void 0 : t.internals.handleBounds : void 0;
  const n = [], r = [];
  for (const i of e.handles) {
    const o = {
      id: i.id,
      width: i.width ?? 1,
      height: i.height ?? 1,
      nodeId: e.id,
      x: i.x,
      y: i.y,
      position: i.position,
      type: i.type
    };
    i.type === "source" ? n.push(o) : i.type === "target" && r.push(o);
  }
  return {
    source: n,
    target: r
  };
}
function fa(e) {
  return e === "manual";
}
function Uy(e, t, n, r = {}) {
  var f, h;
  const i = ua(Zy, r), o = { i: 0 }, s = new Map(t), a = i != null && i.elevateNodesOnSelect && !fa(i.zIndexMode) ? _u : 0;
  let l = e.length > 0, c = !1;
  t.clear(), n.clear();
  for (const d of e) {
    let v = s.get(d.id);
    if (i.checkEquality && d === (v == null ? void 0 : v.internals.userNode))
      t.set(d.id, v);
    else {
      const m = ki(d, i.nodeOrigin), _ = wr(d.extent) ? d.extent : i.nodeExtent, w = Ln(m, _, Kn(d));
      v = {
        ...i.defaults,
        ...d,
        measured: {
          width: (f = d.measured) == null ? void 0 : f.width,
          height: (h = d.measured) == null ? void 0 : h.height
        },
        internals: {
          positionAbsolute: w,
          // if user re-initializes the node or removes `measured` for whatever reason, we reset the handleBounds so that the node gets re-measured
          handleBounds: Gy(d, v),
          z: wu(d, a, i.zIndexMode),
          userNode: d
        }
      }, t.set(d.id, v);
    }
    (v.measured === void 0 || v.measured.width === void 0 || v.measured.height === void 0) && !v.hidden && (l = !1), d.parentId && da(v, t, n, r, o), c || (c = d.selected ?? !1);
  }
  return { nodesInitialized: l, hasSelectedNodes: c };
}
function Qy(e, t) {
  if (!e.parentId)
    return;
  const n = t.get(e.parentId);
  n ? n.set(e.id, e) : t.set(e.parentId, /* @__PURE__ */ new Map([[e.id, e]]));
}
function da(e, t, n, r, i) {
  const { elevateNodesOnSelect: o, nodeOrigin: s, nodeExtent: a, zIndexMode: l } = ua(ca, r), c = e.parentId, f = t.get(c);
  if (!f) {
    console.warn(`Parent node ${c} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
    return;
  }
  Qy(e, n), i && !f.parentId && f.internals.rootParentIndex === void 0 && l === "auto" && (f.internals.rootParentIndex = ++i.i, f.internals.z = f.internals.z + i.i * Wy), i && f.internals.rootParentIndex !== void 0 && (i.i = f.internals.rootParentIndex);
  const h = o && !fa(l) ? _u : 0, { x: d, y: v, z: m } = Jy(e, f, s, a, h, l), { positionAbsolute: _ } = e.internals, w = d !== _.x || v !== _.y;
  (w || m !== e.internals.z) && t.set(e.id, {
    ...e,
    internals: {
      ...e.internals,
      positionAbsolute: w ? { x: d, y: v } : _,
      z: m
    }
  });
}
function wu(e, t, n) {
  const r = Ut(e.zIndex) ? e.zIndex : 0;
  return fa(n) ? r : r + (e.selected ? t : 0);
}
function Jy(e, t, n, r, i, o) {
  const { x: s, y: a } = t.internals.positionAbsolute, l = Kn(e), c = ki(e, n), f = wr(e.extent) ? Ln(c, e.extent, l) : c;
  let h = Ln({ x: s + f.x, y: a + f.y }, r, l);
  e.extent === "parent" && (h = uu(h, l, t));
  const d = wu(e, i, o), v = t.internals.z ?? 0;
  return {
    x: h.x,
    y: h.y,
    z: v >= d ? v + 1 : d
  };
}
function $y(e, t, n, r = [0, 0]) {
  var s;
  const i = [], o = /* @__PURE__ */ new Map();
  for (const a of e) {
    const l = t.get(a.parentId);
    if (!l)
      continue;
    const c = ((s = o.get(a.parentId)) == null ? void 0 : s.expandedRect) ?? _r(l), f = Cy(c, a.rect);
    o.set(a.parentId, { expandedRect: f, parent: l });
  }
  return o.size > 0 && o.forEach(({ expandedRect: a, parent: l }, c) => {
    var M;
    const f = l.internals.positionAbsolute, h = Kn(l), d = l.origin ?? r, v = a.x < f.x ? Math.round(Math.abs(f.x - a.x)) : 0, m = a.y < f.y ? Math.round(Math.abs(f.y - a.y)) : 0, _ = Math.max(h.width, Math.round(a.width)), w = Math.max(h.height, Math.round(a.height)), S = (_ - h.width) * d[0], N = (w - h.height) * d[1];
    (v > 0 || m > 0 || S || N) && (i.push({
      id: c,
      type: "position",
      position: {
        x: l.position.x - v + S,
        y: l.position.y - m + N
      }
    }), (M = n.get(c)) == null || M.forEach((E) => {
      e.some((R) => R.id === E.id) || i.push({
        id: E.id,
        type: "position",
        position: {
          x: E.position.x + v,
          y: E.position.y + m
        }
      });
    })), (h.width < a.width || h.height < a.height || v || m) && i.push({
      id: c,
      type: "dimensions",
      setAttributes: !0,
      dimensions: {
        width: _ + (v ? d[0] * v - S : 0),
        height: w + (m ? d[1] * m - N : 0)
      }
    });
  }), i;
}
function e0(e, t, n, r, i, o, s) {
  const a = r == null ? void 0 : r.querySelector(".xyflow__viewport");
  let l = !1;
  if (!a)
    return { changes: [], updatedInternals: l };
  const c = [], f = window.getComputedStyle(a), { m22: h } = new window.DOMMatrixReadOnly(f.transform), d = [];
  for (const v of e.values()) {
    const m = t.get(v.id);
    if (!m)
      continue;
    if (m.hidden) {
      t.set(m.id, {
        ...m,
        internals: {
          ...m.internals,
          handleBounds: void 0
        }
      }), l = !0;
      continue;
    }
    const _ = hu(v.nodeElement), w = m.measured.width !== _.width || m.measured.height !== _.height;
    if (!!(_.width && _.height && (w || !m.internals.handleBounds || v.force))) {
      const N = v.nodeElement.getBoundingClientRect(), M = wr(m.extent) ? m.extent : o;
      let { positionAbsolute: E } = m.internals;
      m.parentId && m.extent === "parent" ? E = uu(E, _, t.get(m.parentId)) : M && (E = Ln(E, M, _));
      const R = {
        ...m,
        measured: _,
        internals: {
          ...m.internals,
          positionAbsolute: E,
          handleBounds: {
            source: nl("source", v.nodeElement, N, h, m.id),
            target: nl("target", v.nodeElement, N, h, m.id)
          }
        }
      };
      t.set(m.id, R), m.parentId && da(R, t, n, { nodeOrigin: i, zIndexMode: s }), l = !0, w && (c.push({
        id: m.id,
        type: "dimensions",
        dimensions: _
      }), m.expandParent && m.parentId && d.push({
        id: m.id,
        parentId: m.parentId,
        rect: _r(R, i)
      }));
    }
  }
  if (d.length > 0) {
    const v = $y(d, t, n, i);
    c.push(...v);
  }
  return { changes: c, updatedInternals: l };
}
async function t0({ delta: e, panZoom: t, transform: n, translateExtent: r, width: i, height: o }) {
  if (!t || !e.x && !e.y)
    return Promise.resolve(!1);
  const s = await t.setViewportConstrained({
    x: n[0] + e.x,
    y: n[1] + e.y,
    zoom: n[2]
  }, [
    [0, 0],
    [i, o]
  ], r), a = !!s && (s.x !== n[0] || s.y !== n[1] || s.k !== n[2]);
  return Promise.resolve(a);
}
function cl(e, t, n, r, i, o) {
  let s = i;
  const a = r.get(s) || /* @__PURE__ */ new Map();
  r.set(s, a.set(n, t)), s = `${i}-${e}`;
  const l = r.get(s) || /* @__PURE__ */ new Map();
  if (r.set(s, l.set(n, t)), o) {
    s = `${i}-${e}-${o}`;
    const c = r.get(s) || /* @__PURE__ */ new Map();
    r.set(s, c.set(n, t));
  }
}
function n0(e, t, n) {
  e.clear(), t.clear();
  for (const r of n) {
    const { source: i, target: o, sourceHandle: s = null, targetHandle: a = null } = r, l = { edgeId: r.id, source: i, target: o, sourceHandle: s, targetHandle: a }, c = `${i}-${s}--${o}-${a}`, f = `${o}-${a}--${i}-${s}`;
    cl("source", l, f, e, i, s), cl("target", l, c, e, o, a), t.set(r.id, r);
  }
}
function xu(e, t) {
  if (!e.parentId)
    return !1;
  const n = t.get(e.parentId);
  return n ? n.selected ? !0 : xu(n, t) : !1;
}
function ul(e, t, n) {
  var i;
  let r = e;
  do {
    if ((i = r == null ? void 0 : r.matches) != null && i.call(r, t))
      return !0;
    if (r === n)
      return !1;
    r = r == null ? void 0 : r.parentElement;
  } while (r);
  return !1;
}
function r0(e, t, n, r) {
  const i = /* @__PURE__ */ new Map();
  for (const [o, s] of e)
    if ((s.selected || s.id === r) && (!s.parentId || !xu(s, e)) && (s.draggable || t && typeof s.draggable > "u")) {
      const a = e.get(o);
      a && i.set(o, {
        id: o,
        position: a.position || { x: 0, y: 0 },
        distance: {
          x: n.x - a.internals.positionAbsolute.x,
          y: n.y - a.internals.positionAbsolute.y
        },
        extent: a.extent,
        parentId: a.parentId,
        origin: a.origin,
        expandParent: a.expandParent,
        internals: {
          positionAbsolute: a.internals.positionAbsolute || { x: 0, y: 0 }
        },
        measured: {
          width: a.measured.width ?? 0,
          height: a.measured.height ?? 0
        }
      });
    }
  return i;
}
function Zo({ nodeId: e, dragItems: t, nodeLookup: n, dragging: r = !0 }) {
  var s, a, l;
  const i = [];
  for (const [c, f] of t) {
    const h = (s = n.get(c)) == null ? void 0 : s.internals.userNode;
    h && i.push({
      ...h,
      position: f.position,
      dragging: r
    });
  }
  if (!e)
    return [i[0], i];
  const o = (a = n.get(e)) == null ? void 0 : a.internals.userNode;
  return [
    o ? {
      ...o,
      position: ((l = t.get(e)) == null ? void 0 : l.position) || o.position,
      dragging: r
    } : i[0],
    i
  ];
}
function i0({ dragItems: e, snapGrid: t, x: n, y: r }) {
  const i = e.values().next().value;
  if (!i)
    return null;
  const o = {
    x: n - i.distance.x,
    y: r - i.distance.y
  }, s = Si(o, t);
  return {
    x: s.x - o.x,
    y: s.y - o.y
  };
}
function o0({ onNodeMouseDown: e, getStoreItems: t, onDragStart: n, onDrag: r, onDragStop: i }) {
  let o = { x: null, y: null }, s = 0, a = /* @__PURE__ */ new Map(), l = !1, c = { x: 0, y: 0 }, f = null, h = !1, d = null, v = !1, m = !1, _ = null;
  function w({ noDragClassName: N, handleSelector: M, domNode: E, isSelectable: R, nodeId: F, nodeClickDistance: B = 0 }) {
    d = bt(E);
    function L({ x: g, y: x }) {
      const { nodeLookup: p, nodeExtent: k, snapGrid: P, snapToGrid: C, nodeOrigin: T, onNodeDrag: O, onSelectionDrag: H, onError: D, updateNodePositions: z } = t();
      o = { x: g, y: x };
      let X = !1;
      const V = a.size > 1, Q = V && k ? As(Co(a)) : null, W = V && C ? i0({
        dragItems: a,
        snapGrid: P,
        x: g,
        y: x
      }) : null;
      for (const [G, Z] of a) {
        if (!p.has(G))
          continue;
        let $ = { x: g - Z.distance.x, y: x - Z.distance.y };
        C && ($ = W ? {
          x: Math.round($.x + W.x),
          y: Math.round($.y + W.y)
        } : Si($, P));
        let oe = null;
        if (V && k && !Z.extent && Q) {
          const { positionAbsolute: ne } = Z.internals, ye = ne.x - Q.x + k[0][0], be = ne.x + Z.measured.width - Q.x2 + k[1][0], Se = ne.y - Q.y + k[0][1], Pe = ne.y + Z.measured.height - Q.y2 + k[1][1];
          oe = [
            [ye, Se],
            [be, Pe]
          ];
        }
        const { position: J, positionAbsolute: le } = cu({
          nodeId: G,
          nextPosition: $,
          nodeLookup: p,
          nodeExtent: oe || k,
          nodeOrigin: T,
          onError: D
        });
        X = X || Z.position.x !== J.x || Z.position.y !== J.y, Z.position = J, Z.internals.positionAbsolute = le;
      }
      if (m = m || X, !!X && (z(a, !0), _ && (r || O || !F && H))) {
        const [G, Z] = Zo({
          nodeId: F,
          dragItems: a,
          nodeLookup: p
        });
        r == null || r(_, a, G, Z), O == null || O(_, G, Z), F || H == null || H(_, Z);
      }
    }
    async function Y() {
      if (!f)
        return;
      const { transform: g, panBy: x, autoPanSpeed: p, autoPanOnNodeDrag: k } = t();
      if (!k) {
        l = !1, cancelAnimationFrame(s);
        return;
      }
      const [P, C] = fu(c, f, p);
      (P !== 0 || C !== 0) && (o.x = (o.x ?? 0) - P / g[2], o.y = (o.y ?? 0) - C / g[2], await x({ x: P, y: C }) && L(o)), s = requestAnimationFrame(Y);
    }
    function j(g) {
      var V;
      const { nodeLookup: x, multiSelectionActive: p, nodesDraggable: k, transform: P, snapGrid: C, snapToGrid: T, selectNodesOnDrag: O, onNodeDragStart: H, onSelectionDragStart: D, unselectNodesAndEdges: z } = t();
      h = !0, (!O || !R) && !p && F && ((V = x.get(F)) != null && V.selected || z()), R && O && F && (e == null || e(F));
      const X = Wo(g.sourceEvent, { transform: P, snapGrid: C, snapToGrid: T, containerBounds: f });
      if (o = X, a = r0(x, k, X, F), a.size > 0 && (n || H || !F && D)) {
        const [Q, W] = Zo({
          nodeId: F,
          dragItems: a,
          nodeLookup: x
        });
        n == null || n(g.sourceEvent, a, Q, W), H == null || H(g.sourceEvent, Q, W), F || D == null || D(g.sourceEvent, W);
      }
    }
    const I = Sg().clickDistance(B).on("start", (g) => {
      const { domNode: x, nodeDragThreshold: p, transform: k, snapGrid: P, snapToGrid: C } = t();
      f = (x == null ? void 0 : x.getBoundingClientRect()) || null, v = !1, m = !1, _ = g.sourceEvent, p === 0 && j(g), o = Wo(g.sourceEvent, { transform: k, snapGrid: P, snapToGrid: C, containerBounds: f }), c = St(g.sourceEvent, f);
    }).on("drag", (g) => {
      const { autoPanOnNodeDrag: x, transform: p, snapGrid: k, snapToGrid: P, nodeDragThreshold: C, nodeLookup: T } = t(), O = Wo(g.sourceEvent, { transform: p, snapGrid: k, snapToGrid: P, containerBounds: f });
      if (_ = g.sourceEvent, (g.sourceEvent.type === "touchmove" && g.sourceEvent.touches.length > 1 || // if user deletes a node while dragging, we need to abort the drag to prevent errors
      F && !T.has(F)) && (v = !0), !v) {
        if (!l && x && h && (l = !0, Y()), !h) {
          const H = St(g.sourceEvent, f), D = H.x - c.x, z = H.y - c.y;
          Math.sqrt(D * D + z * z) > C && j(g);
        }
        (o.x !== O.xSnapped || o.y !== O.ySnapped) && a && h && (c = St(g.sourceEvent, f), L(O));
      }
    }).on("end", (g) => {
      if (!(!h || v) && (l = !1, h = !1, cancelAnimationFrame(s), a.size > 0)) {
        const { nodeLookup: x, updateNodePositions: p, onNodeDragStop: k, onSelectionDragStop: P } = t();
        if (m && (p(a, !1), m = !1), i || k || !F && P) {
          const [C, T] = Zo({
            nodeId: F,
            dragItems: a,
            nodeLookup: x,
            dragging: !1
          });
          i == null || i(g.sourceEvent, a, C, T), k == null || k(g.sourceEvent, C, T), F || P == null || P(g.sourceEvent, T);
        }
      }
    }).filter((g) => {
      const x = g.target;
      return !g.button && (!N || !ul(x, `.${N}`, E)) && (!M || ul(x, M, E));
    });
    d.call(I);
  }
  function S() {
    d == null || d.on(".drag", null);
  }
  return {
    update: w,
    destroy: S
  };
}
function s0(e, t, n) {
  const r = [], i = {
    x: e.x - n,
    y: e.y - n,
    width: n * 2,
    height: n * 2
  };
  for (const o of t.values())
    oi(i, _r(o)) > 0 && r.push(o);
  return r;
}
const a0 = 250;
function l0(e, t, n, r) {
  var a, l;
  let i = [], o = 1 / 0;
  const s = s0(e, n, t + a0);
  for (const c of s) {
    const f = [...((a = c.internals.handleBounds) == null ? void 0 : a.source) ?? [], ...((l = c.internals.handleBounds) == null ? void 0 : l.target) ?? []];
    for (const h of f) {
      if (r.nodeId === h.nodeId && r.type === h.type && r.id === h.id)
        continue;
      const { x: d, y: v } = Hn(c, h, h.position, !0), m = Math.sqrt(Math.pow(d - e.x, 2) + Math.pow(v - e.y, 2));
      m > t || (m < o ? (i = [{ ...h, x: d, y: v }], o = m) : m === o && i.push({ ...h, x: d, y: v }));
    }
  }
  if (!i.length)
    return null;
  if (i.length > 1) {
    const c = r.type === "source" ? "target" : "source";
    return i.find((f) => f.type === c) ?? i[0];
  }
  return i[0];
}
function bu(e, t, n, r, i, o = !1) {
  var c, f, h;
  const s = r.get(e);
  if (!s)
    return null;
  const a = i === "strict" ? (c = s.internals.handleBounds) == null ? void 0 : c[t] : [...((f = s.internals.handleBounds) == null ? void 0 : f.source) ?? [], ...((h = s.internals.handleBounds) == null ? void 0 : h.target) ?? []], l = (n ? a == null ? void 0 : a.find((d) => d.id === n) : a == null ? void 0 : a[0]) ?? null;
  return l && o ? { ...l, ...Hn(s, l, l.position, !0) } : l;
}
function Eu(e, t) {
  return e || (t != null && t.classList.contains("target") ? "target" : t != null && t.classList.contains("source") ? "source" : null);
}
function c0(e, t) {
  let n = null;
  return t ? n = !0 : e && !t && (n = !1), n;
}
const ku = () => !0;
function u0(e, { connectionMode: t, connectionRadius: n, handleId: r, nodeId: i, edgeUpdaterType: o, isTarget: s, domNode: a, nodeLookup: l, lib: c, autoPanOnConnect: f, flowId: h, panBy: d, cancelConnection: v, onConnectStart: m, onConnect: _, onConnectEnd: w, isValidConnection: S = ku, onReconnectEnd: N, updateConnection: M, getTransform: E, getFromHandle: R, autoPanSpeed: F, dragThreshold: B = 1, handleDomNode: L }) {
  const Y = gu(e.target);
  let j = 0, I;
  const { x: g, y: x } = St(e), p = Eu(o, L), k = a == null ? void 0 : a.getBoundingClientRect();
  let P = !1;
  if (!k || !p)
    return;
  const C = bu(i, p, r, l, t);
  if (!C)
    return;
  let T = St(e, k), O = !1, H = null, D = !1, z = null;
  function X() {
    if (!f || !k)
      return;
    const [J, le] = fu(T, k, F);
    d({ x: J, y: le }), j = requestAnimationFrame(X);
  }
  const V = {
    ...C,
    nodeId: i,
    type: p,
    position: C.position
  }, Q = l.get(i);
  let G = {
    inProgress: !0,
    isValid: null,
    from: Hn(Q, V, U.Left, !0),
    fromHandle: V,
    fromPosition: V.position,
    fromNode: Q,
    to: T,
    toHandle: null,
    toPosition: Ja[V.position],
    toNode: null,
    pointer: T
  };
  function Z() {
    P = !0, M(G), m == null || m(e, { nodeId: i, handleId: r, handleType: p });
  }
  B === 0 && Z();
  function $(J) {
    if (!P) {
      const { x: Pe, y: ce } = St(J), we = Pe - g, Ie = ce - x;
      if (!(we * we + Ie * Ie > B * B))
        return;
      Z();
    }
    if (!R() || !V) {
      oe(J);
      return;
    }
    const le = E();
    T = St(J, k), I = l0(Pi(T, le, !1, [1, 1]), n, l, V), O || (X(), O = !0);
    const ne = Su(J, {
      handle: I,
      connectionMode: t,
      fromNodeId: i,
      fromHandleId: r,
      fromType: s ? "target" : "source",
      isValidConnection: S,
      doc: Y,
      lib: c,
      flowId: h,
      nodeLookup: l
    });
    z = ne.handleDomNode, H = ne.connection, D = c0(!!I, ne.isValid);
    const ye = l.get(i), be = ye ? Hn(ye, V, U.Left, !0) : G.from, Se = {
      ...G,
      from: be,
      isValid: D,
      to: ne.toHandle && D ? ao({ x: ne.toHandle.x, y: ne.toHandle.y }, le) : T,
      toHandle: ne.toHandle,
      toPosition: D && ne.toHandle ? ne.toHandle.position : Ja[V.position],
      toNode: ne.toHandle ? l.get(ne.toHandle.nodeId) : null,
      pointer: T
    };
    M(Se), G = Se;
  }
  function oe(J) {
    if (!("touches" in J && J.touches.length > 0)) {
      if (P) {
        (I || z) && H && D && (_ == null || _(H));
        const { inProgress: le, ...ne } = G, ye = {
          ...ne,
          toPosition: G.toHandle ? G.toPosition : null
        };
        w == null || w(J, ye), o && (N == null || N(J, ye));
      }
      v(), cancelAnimationFrame(j), O = !1, D = !1, H = null, z = null, Y.removeEventListener("mousemove", $), Y.removeEventListener("mouseup", oe), Y.removeEventListener("touchmove", $), Y.removeEventListener("touchend", oe);
    }
  }
  Y.addEventListener("mousemove", $), Y.addEventListener("mouseup", oe), Y.addEventListener("touchmove", $), Y.addEventListener("touchend", oe);
}
function Su(e, { handle: t, connectionMode: n, fromNodeId: r, fromHandleId: i, fromType: o, doc: s, lib: a, flowId: l, isValidConnection: c = ku, nodeLookup: f }) {
  const h = o === "target", d = t ? s.querySelector(`.${a}-flow__handle[data-id="${l}-${t == null ? void 0 : t.nodeId}-${t == null ? void 0 : t.id}-${t == null ? void 0 : t.type}"]`) : null, { x: v, y: m } = St(e), _ = s.elementFromPoint(v, m), w = _ != null && _.classList.contains(`${a}-flow__handle`) ? _ : d, S = {
    handleDomNode: w,
    isValid: !1,
    connection: null,
    toHandle: null
  };
  if (w) {
    const N = Eu(void 0, w), M = w.getAttribute("data-nodeid"), E = w.getAttribute("data-handleid"), R = w.classList.contains("connectable"), F = w.classList.contains("connectableend");
    if (!M || !N)
      return S;
    const B = {
      source: h ? M : r,
      sourceHandle: h ? E : i,
      target: h ? r : M,
      targetHandle: h ? i : E
    };
    S.connection = B;
    const Y = R && F && (n === pr.Strict ? h && N === "source" || !h && N === "target" : M !== r || E !== i);
    S.isValid = Y && c(B), S.toHandle = bu(M, N, E, f, n, !0);
  }
  return S;
}
const fl = {
  onPointerDown: u0,
  isValid: Su
}, Io = (e) => ({
  x: e.x,
  y: e.y,
  zoom: e.k
}), jo = ({ x: e, y: t, zoom: n }) => Mo.translate(e, t).scale(n), Gn = (e, t) => e.target.closest(`.${t}`), Pu = (e, t) => t === 2 && Array.isArray(e) && e.includes(2), f0 = (e) => ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2, Go = (e, t = 0, n = f0, r = () => {
}) => {
  const i = typeof t == "number" && t > 0;
  return i || r(), i ? e.transition().duration(t).ease(n).on("end", r) : e;
}, Mu = (e) => {
  const t = e.ctrlKey && lo() ? 10 : 1;
  return -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 2e-3) * t;
};
function d0({ zoomPanValues: e, noWheelClassName: t, d3Selection: n, d3Zoom: r, panOnScrollMode: i, panOnScrollSpeed: o, zoomOnPinch: s, onPanZoomStart: a, onPanZoom: l, onPanZoomEnd: c }) {
  return (f) => {
    if (Gn(f, t))
      return f.ctrlKey && f.preventDefault(), !1;
    f.preventDefault(), f.stopImmediatePropagation();
    const h = n.property("__zoom").k || 1;
    if (f.ctrlKey && s) {
      const w = Ct(f), S = Mu(f), N = h * Math.pow(2, S);
      r.scaleTo(n, N, w, f);
      return;
    }
    const d = f.deltaMode === 1 ? 20 : 1;
    let v = i === Jn.Vertical ? 0 : f.deltaX * d, m = i === Jn.Horizontal ? 0 : f.deltaY * d;
    !lo() && f.shiftKey && i !== Jn.Vertical && (v = f.deltaY * d, m = 0), r.translateBy(
      n,
      -(v / h) * o,
      -(m / h) * o,
      // @ts-ignore
      { internal: !0 }
    );
    const _ = Io(n.property("__zoom"));
    clearTimeout(e.panScrollTimeout), e.isPanScrolling ? (l == null || l(f, _), e.panScrollTimeout = setTimeout(() => {
      c == null || c(f, _), e.isPanScrolling = !1;
    }, 150)) : (e.isPanScrolling = !0, a == null || a(f, _));
  };
}
function h0({ noWheelClassName: e, preventScrolling: t, d3ZoomHandler: n }) {
  return function(r, i) {
    const o = r.type === "wheel", s = !t && o && !r.ctrlKey, a = Gn(r, e);
    if (r.ctrlKey && o && a && r.preventDefault(), s || a)
      return null;
    r.preventDefault(), n.call(this, r, i);
  };
}
function g0({ zoomPanValues: e, onDraggingChange: t, onPanZoomStart: n }) {
  return (r) => {
    var o, s, a;
    if ((o = r.sourceEvent) != null && o.internal)
      return;
    const i = Io(r.transform);
    e.mouseButton = ((s = r.sourceEvent) == null ? void 0 : s.button) || 0, e.isZoomingOrPanning = !0, e.prevViewport = i, ((a = r.sourceEvent) == null ? void 0 : a.type) === "mousedown" && t(!0), n && (n == null || n(r.sourceEvent, i));
  };
}
function v0({ zoomPanValues: e, panOnDrag: t, onPaneContextMenu: n, onTransformChange: r, onPanZoom: i }) {
  return (o) => {
    var s, a;
    e.usedRightMouseButton = !!(n && Pu(t, e.mouseButton ?? 0)), (s = o.sourceEvent) != null && s.sync || r([o.transform.x, o.transform.y, o.transform.k]), i && !((a = o.sourceEvent) != null && a.internal) && (i == null || i(o.sourceEvent, Io(o.transform)));
  };
}
function y0({ zoomPanValues: e, panOnDrag: t, panOnScroll: n, onDraggingChange: r, onPanZoomEnd: i, onPaneContextMenu: o }) {
  return (s) => {
    var a;
    if (!((a = s.sourceEvent) != null && a.internal) && (e.isZoomingOrPanning = !1, o && Pu(t, e.mouseButton ?? 0) && !e.usedRightMouseButton && s.sourceEvent && o(s.sourceEvent), e.usedRightMouseButton = !1, r(!1), i)) {
      const l = Io(s.transform);
      e.prevViewport = l, clearTimeout(e.timerId), e.timerId = setTimeout(
        () => {
          i == null || i(s.sourceEvent, l);
        },
        // we need a setTimeout for panOnScroll to suppress multiple end events fired during scroll
        n ? 150 : 0
      );
    }
  };
}
function p0({ zoomActivationKeyPressed: e, zoomOnScroll: t, zoomOnPinch: n, panOnDrag: r, panOnScroll: i, zoomOnDoubleClick: o, userSelectionActive: s, noWheelClassName: a, noPanClassName: l, lib: c, connectionInProgress: f }) {
  return (h) => {
    var w;
    const d = e || t, v = n && h.ctrlKey, m = h.type === "wheel";
    if (h.button === 1 && h.type === "mousedown" && (Gn(h, `${c}-flow__node`) || Gn(h, `${c}-flow__edge`)))
      return !0;
    if (!r && !d && !i && !o && !n || s || f && !m || Gn(h, a) && m || Gn(h, l) && (!m || i && m && !e) || !n && h.ctrlKey && m)
      return !1;
    if (!n && h.type === "touchstart" && ((w = h.touches) == null ? void 0 : w.length) > 1)
      return h.preventDefault(), !1;
    if (!d && !i && !v && m || !r && (h.type === "mousedown" || h.type === "touchstart") || Array.isArray(r) && !r.includes(h.button) && h.type === "mousedown")
      return !1;
    const _ = Array.isArray(r) && r.includes(h.button) || !h.button || h.button <= 1;
    return (!h.ctrlKey || m) && _;
  };
}
function m0({ domNode: e, minZoom: t, maxZoom: n, translateExtent: r, viewport: i, onPanZoom: o, onPanZoomStart: s, onPanZoomEnd: a, onDraggingChange: l }) {
  const c = {
    isZoomingOrPanning: !1,
    usedRightMouseButton: !1,
    prevViewport: {},
    mouseButton: 0,
    timerId: void 0,
    panScrollTimeout: void 0,
    isPanScrolling: !1
  }, f = e.getBoundingClientRect(), h = my().scaleExtent([t, n]).translateExtent(r), d = bt(e).call(h);
  N({
    x: i.x,
    y: i.y,
    zoom: mr(i.zoom, t, n)
  }, [
    [0, 0],
    [f.width, f.height]
  ], r);
  const v = d.on("wheel.zoom"), m = d.on("dblclick.zoom");
  h.wheelDelta(Mu);
  function _(I, g) {
    return d ? new Promise((x) => {
      h == null || h.interpolate((g == null ? void 0 : g.interpolate) === "linear" ? Jr : Xi).transform(Go(d, g == null ? void 0 : g.duration, g == null ? void 0 : g.ease, () => x(!0)), I);
    }) : Promise.resolve(!1);
  }
  function w({ noWheelClassName: I, noPanClassName: g, onPaneContextMenu: x, userSelectionActive: p, panOnScroll: k, panOnDrag: P, panOnScrollMode: C, panOnScrollSpeed: T, preventScrolling: O, zoomOnPinch: H, zoomOnScroll: D, zoomOnDoubleClick: z, zoomActivationKeyPressed: X, lib: V, onTransformChange: Q, connectionInProgress: W, paneClickDistance: G, selectionOnDrag: Z }) {
    p && !c.isZoomingOrPanning && S();
    const $ = k && !X && !p;
    h.clickDistance(Z ? 1 / 0 : !Ut(G) || G < 0 ? 0 : G);
    const oe = $ ? d0({
      zoomPanValues: c,
      noWheelClassName: I,
      d3Selection: d,
      d3Zoom: h,
      panOnScrollMode: C,
      panOnScrollSpeed: T,
      zoomOnPinch: H,
      onPanZoomStart: s,
      onPanZoom: o,
      onPanZoomEnd: a
    }) : h0({
      noWheelClassName: I,
      preventScrolling: O,
      d3ZoomHandler: v
    });
    if (d.on("wheel.zoom", oe, { passive: !1 }), !p) {
      const le = g0({
        zoomPanValues: c,
        onDraggingChange: l,
        onPanZoomStart: s
      });
      h.on("start", le);
      const ne = v0({
        zoomPanValues: c,
        panOnDrag: P,
        onPaneContextMenu: !!x,
        onPanZoom: o,
        onTransformChange: Q
      });
      h.on("zoom", ne);
      const ye = y0({
        zoomPanValues: c,
        panOnDrag: P,
        panOnScroll: k,
        onPaneContextMenu: x,
        onPanZoomEnd: a,
        onDraggingChange: l
      });
      h.on("end", ye);
    }
    const J = p0({
      zoomActivationKeyPressed: X,
      panOnDrag: P,
      zoomOnScroll: D,
      panOnScroll: k,
      zoomOnDoubleClick: z,
      zoomOnPinch: H,
      userSelectionActive: p,
      noPanClassName: g,
      noWheelClassName: I,
      lib: V,
      connectionInProgress: W
    });
    h.filter(J), z ? d.on("dblclick.zoom", m) : d.on("dblclick.zoom", null);
  }
  function S() {
    h.on("zoom", null);
  }
  async function N(I, g, x) {
    const p = jo(I), k = h == null ? void 0 : h.constrain()(p, g, x);
    return k && await _(k), new Promise((P) => P(k));
  }
  async function M(I, g) {
    const x = jo(I);
    return await _(x, g), new Promise((p) => p(x));
  }
  function E(I) {
    if (d) {
      const g = jo(I), x = d.property("__zoom");
      (x.k !== I.zoom || x.x !== I.x || x.y !== I.y) && (h == null || h.transform(d, g, null, { sync: !0 }));
    }
  }
  function R() {
    const I = d ? su(d.node()) : { x: 0, y: 0, k: 1 };
    return { x: I.x, y: I.y, zoom: I.k };
  }
  function F(I, g) {
    return d ? new Promise((x) => {
      h == null || h.interpolate((g == null ? void 0 : g.interpolate) === "linear" ? Jr : Xi).scaleTo(Go(d, g == null ? void 0 : g.duration, g == null ? void 0 : g.ease, () => x(!0)), I);
    }) : Promise.resolve(!1);
  }
  function B(I, g) {
    return d ? new Promise((x) => {
      h == null || h.interpolate((g == null ? void 0 : g.interpolate) === "linear" ? Jr : Xi).scaleBy(Go(d, g == null ? void 0 : g.duration, g == null ? void 0 : g.ease, () => x(!0)), I);
    }) : Promise.resolve(!1);
  }
  function L(I) {
    h == null || h.scaleExtent(I);
  }
  function Y(I) {
    h == null || h.translateExtent(I);
  }
  function j(I) {
    const g = !Ut(I) || I < 0 ? 0 : I;
    h == null || h.clickDistance(g);
  }
  return {
    update: w,
    destroy: S,
    setViewport: M,
    setViewportConstrained: N,
    getViewport: R,
    scaleTo: F,
    scaleBy: B,
    setScaleExtent: L,
    setTranslateExtent: Y,
    syncViewport: E,
    setClickDistance: j
  };
}
var dl;
(function(e) {
  e.Line = "line", e.Handle = "handle";
})(dl || (dl = {}));
function ha() {
  const e = {};
  return [
    (t) => {
      if (t && !Ef(e))
        throw new Error(t);
      return Hs(e);
    },
    (t) => Fl(e, t)
  ];
}
const [_0, w0] = ha(), [x0, b0] = ha(), [E0, k0] = ha();
var S0 = /* @__PURE__ */ de("<div><!></div>");
function ut(e, t) {
  ge(t, !0);
  let n = ee(t, "id", 3, null), r = ee(t, "type", 3, "source"), i = ee(t, "position", 19, () => U.Top), o = ee(t, "isConnectableStart", 3, !0), s = ee(t, "isConnectableEnd", 3, !0), a = /* @__PURE__ */ xi(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "id",
    "type",
    "position",
    "style",
    "class",
    "isConnectable",
    "isConnectableStart",
    "isConnectableEnd",
    "isValidConnection",
    "onconnect",
    "ondisconnect",
    "children"
  ]);
  const l = _0("Handle must be used within a Custom Node component"), c = x0("Handle must be used within a Custom Node component");
  let f = /* @__PURE__ */ b(() => r() === "target"), h = /* @__PURE__ */ b(() => t.isConnectable !== void 0 ? t.isConnectable : c.value), d = Mi(), v = /* @__PURE__ */ b(() => d.ariaLabelConfig), m = null;
  uc(() => {
    if (t.onconnect || t.ondisconnect) {
      d.edges;
      let g = d.connectionLookup.get(`${l}-${r()}${n() ? `-${n()}` : ""}`);
      if (m && !wy(g, m)) {
        const x = g ?? /* @__PURE__ */ new Map();
        $a(m, x, t.ondisconnect), $a(x, m, t.onconnect);
      }
      m = new Map(g);
    }
  });
  let _ = /* @__PURE__ */ b(() => {
    if (!d.connection.inProgress)
      return [!1, !1, !1, !1, null];
    const { fromHandle: g, toHandle: x, isValid: p } = d.connection, k = g && g.nodeId === l && g.type === r() && g.id === n(), P = x && x.nodeId === l && x.type === r() && x.id === n(), C = d.connectionMode === pr.Strict ? (g == null ? void 0 : g.type) !== r() : l !== (g == null ? void 0 : g.nodeId) || n() !== (g == null ? void 0 : g.id);
    return [
      !0,
      k,
      P,
      C,
      P && p
    ];
  }), w = /* @__PURE__ */ b(() => Nn(u(_), 5)), S = /* @__PURE__ */ b(() => u(w)[0]), N = /* @__PURE__ */ b(() => u(w)[1]), M = /* @__PURE__ */ b(() => u(w)[2]), E = /* @__PURE__ */ b(() => u(w)[3]), R = /* @__PURE__ */ b(() => u(w)[4]);
  function F(g) {
    var p;
    const x = d.onbeforeconnect ? d.onbeforeconnect(g) : g;
    x && (d.addEdge(x), (p = d.onconnect) == null || p.call(d, g));
  }
  function B(g) {
    const x = yu(g);
    g.currentTarget && (x && g.button === 0 || !x) && fl.onPointerDown(g, {
      handleId: n(),
      nodeId: l,
      isTarget: u(f),
      connectionRadius: d.connectionRadius,
      domNode: d.domNode,
      nodeLookup: d.nodeLookup,
      connectionMode: d.connectionMode,
      lib: "svelte",
      autoPanOnConnect: d.autoPanOnConnect,
      autoPanSpeed: d.autoPanSpeed,
      flowId: d.flowId,
      isValidConnection: t.isValidConnection || ((...p) => {
        var k;
        return ((k = d.isValidConnection) == null ? void 0 : k.call(d, ...p)) ?? !0;
      }),
      updateConnection: d.updateConnection,
      cancelConnection: d.cancelConnection,
      panBy: d.panBy,
      onConnect: F,
      onConnectStart: d.onconnectstart,
      onConnectEnd: (...p) => {
        var k;
        return (k = d.onconnectend) == null ? void 0 : k.call(d, ...p);
      },
      getTransform: () => [d.viewport.x, d.viewport.y, d.viewport.zoom],
      getFromHandle: () => d.connection.fromHandle,
      dragThreshold: d.connectionDragThreshold,
      handleDomNode: g.currentTarget
    });
  }
  function L(g) {
    var z, X;
    if (!l || !d.clickConnectStartHandle && !o())
      return;
    if (!d.clickConnectStartHandle) {
      (z = d.onclickconnectstart) == null || z.call(d, g, { nodeId: l, handleId: n(), handleType: r() }), d.clickConnectStartHandle = { nodeId: l, type: r(), id: n() };
      return;
    }
    const x = gu(g.target), p = t.isValidConnection ?? d.isValidConnection, { connectionMode: k, clickConnectStartHandle: P, flowId: C, nodeLookup: T } = d, { connection: O, isValid: H } = fl.isValid(g, {
      handle: { nodeId: l, id: n(), type: r() },
      connectionMode: k,
      fromNodeId: P.nodeId,
      fromHandleId: P.id ?? null,
      fromType: P.type,
      isValidConnection: p,
      flowId: C,
      doc: x,
      lib: "svelte",
      nodeLookup: T
    });
    H && O && F(O);
    const D = structuredClone(Vl(d.connection));
    delete D.inProgress, D.toPosition = D.toHandle ? D.toHandle.position : null, (X = d.onclickconnectend) == null || X.call(d, g, D), d.clickConnectStartHandle = null;
  }
  var Y = S0(), j = () => {
  };
  Bn(Y, () => ({
    "data-handleid": n(),
    "data-nodeid": l,
    "data-handlepos": i(),
    "data-id": `${d.flowId ?? ""}-${l ?? ""}-${n() ?? "null" ?? ""}-${r() ?? ""}`,
    class: [
      "svelte-flow__handle",
      `svelte-flow__handle-${i()}`,
      d.noDragClass,
      d.noPanClass,
      i(),
      t.class
    ],
    onmousedown: B,
    ontouchstart: B,
    onclick: d.clickConnect ? L : void 0,
    onkeypress: j,
    style: t.style,
    role: "button",
    "aria-label": u(v)["handle.ariaLabel"],
    tabindex: "-1",
    ...a,
    [tn]: {
      valid: u(R),
      connectingto: u(M),
      connectingfrom: u(N),
      source: !u(f),
      target: u(f),
      connectablestart: o(),
      connectableend: s(),
      connectable: u(h),
      connectionindicator: u(h) && (!u(S) || u(E)) && (u(S) || d.clickConnectStartHandle ? s() : o())
    }
  }));
  var I = ie(Y);
  pn(I, () => t.children ?? br), te(e, Y), ve();
}
var P0 = /* @__PURE__ */ de("<!> <!>", 1);
function Cu(e, t) {
  ge(t, !0);
  let n = ee(t, "targetPosition", 19, () => U.Top), r = ee(t, "sourcePosition", 19, () => U.Bottom);
  var i = P0(), o = Oe(i);
  ut(o, {
    type: "target",
    get position() {
      return n();
    }
  });
  var s = re(o), a = re(s);
  ut(a, {
    type: "source",
    get position() {
      return r();
    }
  }), me(() => {
    var l;
    return He(s, ` ${((l = t.data) == null ? void 0 : l.label) ?? ""} `);
  }), te(e, i), ve();
}
var M0 = /* @__PURE__ */ de(" <!>", 1);
function C0(e, t) {
  ge(t, !0);
  let n = ee(t, "data", 19, () => ({ label: "Node" })), r = ee(t, "sourcePosition", 19, () => U.Bottom);
  var i = M0(), o = Oe(i), s = re(o);
  ut(s, {
    type: "source",
    get position() {
      return r();
    }
  }), me(() => {
    var a;
    return He(o, `${((a = n()) == null ? void 0 : a.label) ?? ""} `);
  }), te(e, i), ve();
}
var A0 = /* @__PURE__ */ de(" <!>", 1);
function N0(e, t) {
  ge(t, !0);
  let n = ee(t, "data", 19, () => ({ label: "Node" })), r = ee(t, "targetPosition", 19, () => U.Top);
  var i = A0(), o = Oe(i), s = re(o);
  ut(s, {
    type: "target",
    get position() {
      return r();
    }
  }), me(() => {
    var a;
    return He(o, `${((a = n()) == null ? void 0 : a.label) ?? ""} `);
  }), te(e, i), ve();
}
function I0(e, t) {
}
function Uo(e, t, n) {
  if (!n || !t)
    return;
  const r = n === "root" ? t : t.querySelector(`.svelte-flow__${n}`);
  r && r.appendChild(e);
}
function Qo(e, t) {
  const n = /* @__PURE__ */ b(Mi), r = /* @__PURE__ */ b(() => u(n).domNode);
  let i;
  return u(r) ? Uo(e, u(r), t) : i = fc(() => {
    ht(() => {
      Uo(e, u(r), t), i == null || i();
    });
  }), {
    async update(o) {
      Uo(e, u(r), o);
    },
    destroy() {
      e.parentNode && e.parentNode.removeChild(e), i == null || i();
    }
  };
}
function T0() {
  let e = /* @__PURE__ */ ue(typeof window > "u");
  if (u(e)) {
    const t = fc(() => {
      ht(() => {
        q(e, !1), t == null || t();
      });
    });
  }
  return {
    get value() {
      return u(e);
    }
  };
}
const hl = (e) => by(e), O0 = (e) => lu(e);
function Ht(e) {
  return e === void 0 ? void 0 : `${e}px`;
}
const co = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
};
var D0 = /* @__PURE__ */ de("<div><!></div>");
function Au(e, t) {
  ge(t, !0);
  let n = ee(t, "x", 3, 0), r = ee(t, "y", 3, 0), i = ee(t, "selectEdgeOnClick", 3, !1), o = ee(t, "transparent", 3, !1), s = /* @__PURE__ */ xi(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "x",
    "y",
    "width",
    "height",
    "selectEdgeOnClick",
    "transparent",
    "class",
    "children"
  ]);
  const a = Mi(), l = E0("EdgeLabel must be used within a Custom Edge component");
  let c = /* @__PURE__ */ b(() => {
    var v;
    return (v = a.visible.edges.get(l)) == null ? void 0 : v.zIndex;
  });
  var f = D0(), h = () => {
    i() && l && a.handleEdgeSelection(l);
  };
  Bn(
    f,
    (v) => ({
      class: [
        "svelte-flow__edge-label",
        { transparent: o() },
        t.class
      ],
      tabindex: "-1",
      onclick: h,
      ...s,
      [nn]: v
    }),
    [
      () => ({
        display: T0().value ? "none" : void 0,
        cursor: i() ? "pointer" : void 0,
        transform: `translate(-50%, -50%) translate(${n() ?? ""}px,${r() ?? ""}px)`,
        "pointer-events": "all",
        width: Ht(t.width),
        height: Ht(t.height),
        "z-index": u(c)
      })
    ],
    void 0,
    void 0,
    "svelte-1wg91mu"
  );
  var d = ie(f);
  pn(d, () => t.children ?? br), Ze(f, (v, m) => Qo == null ? void 0 : Qo(v, m), () => "edge-labels"), te(e, f), ve();
}
var z0 = /* @__PURE__ */ Vt("<path></path>"), R0 = /* @__PURE__ */ Vt('<path fill="none"></path><!><!>', 1);
function Xn(e, t) {
  let n = ee(t, "interactionWidth", 3, 20), r = /* @__PURE__ */ xi(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "id",
    "path",
    "label",
    "labelX",
    "labelY",
    "labelStyle",
    "markerStart",
    "markerEnd",
    "style",
    "interactionWidth",
    "class"
  ]);
  var i = R0(), o = Oe(i), s = re(o);
  {
    var a = (f) => {
      var h = z0();
      Bn(h, () => ({
        d: t.path,
        "stroke-opacity": 0,
        "stroke-width": n(),
        fill: "none",
        class: "svelte-flow__edge-interaction",
        ...r
      })), te(f, h);
    };
    ze(s, (f) => {
      n() > 0 && f(a);
    });
  }
  var l = re(s);
  {
    var c = (f) => {
      Au(f, {
        get x() {
          return t.labelX;
        },
        get y() {
          return t.labelY;
        },
        get style() {
          return t.labelStyle;
        },
        selectEdgeOnClick: !0,
        children: (h, d) => {
          var v = hd();
          me(() => He(v, t.label)), te(h, v);
        },
        $$slots: { default: !0 }
      });
    };
    ze(l, (f) => {
      t.label && f(c);
    });
  }
  me(() => {
    ke(o, "id", t.id), ke(o, "d", t.path), Yn(o, 0, bo(["svelte-flow__edge-path", t.class])), ke(o, "marker-start", t.markerStart), ke(o, "marker-end", t.markerEnd), Be(o, t.style);
  }), te(e, i);
}
function Nu(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => {
    var a;
    return pu({
      sourceX: t.sourceX,
      sourceY: t.sourceY,
      targetX: t.targetX,
      targetY: t.targetY,
      sourcePosition: t.sourcePosition,
      targetPosition: t.targetPosition,
      curvature: (a = t.pathOptions) == null ? void 0 : a.curvature
    });
  }), r = /* @__PURE__ */ b(() => Nn(u(n), 3)), i = /* @__PURE__ */ b(() => u(r)[0]), o = /* @__PURE__ */ b(() => u(r)[1]), s = /* @__PURE__ */ b(() => u(r)[2]);
  Xn(e, {
    get id() {
      return t.id;
    },
    get path() {
      return u(i);
    },
    get labelX() {
      return u(o);
    },
    get labelY() {
      return u(s);
    },
    get label() {
      return t.label;
    },
    get labelStyle() {
      return t.labelStyle;
    },
    get markerStart() {
      return t.markerStart;
    },
    get markerEnd() {
      return t.markerEnd;
    },
    get interactionWidth() {
      return t.interactionWidth;
    },
    get style() {
      return t.style;
    }
  }), ve();
}
function L0(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => $n({
    sourceX: t.sourceX,
    sourceY: t.sourceY,
    targetX: t.targetX,
    targetY: t.targetY,
    sourcePosition: t.sourcePosition,
    targetPosition: t.targetPosition
  })), r = /* @__PURE__ */ b(() => Nn(u(n), 3)), i = /* @__PURE__ */ b(() => u(r)[0]), o = /* @__PURE__ */ b(() => u(r)[1]), s = /* @__PURE__ */ b(() => u(r)[2]);
  Xn(e, {
    get path() {
      return u(i);
    },
    get labelX() {
      return u(o);
    },
    get labelY() {
      return u(s);
    },
    get label() {
      return t.label;
    },
    get labelStyle() {
      return t.labelStyle;
    },
    get markerStart() {
      return t.markerStart;
    },
    get markerEnd() {
      return t.markerEnd;
    },
    get interactionWidth() {
      return t.interactionWidth;
    },
    get style() {
      return t.style;
    }
  }), ve();
}
function H0(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => xr({
    sourceX: t.sourceX,
    sourceY: t.sourceY,
    targetX: t.targetX,
    targetY: t.targetY
  })), r = /* @__PURE__ */ b(() => Nn(u(n), 3)), i = /* @__PURE__ */ b(() => u(r)[0]), o = /* @__PURE__ */ b(() => u(r)[1]), s = /* @__PURE__ */ b(() => u(r)[2]);
  Xn(e, {
    get path() {
      return u(i);
    },
    get labelX() {
      return u(o);
    },
    get labelY() {
      return u(s);
    },
    get label() {
      return t.label;
    },
    get labelStyle() {
      return t.labelStyle;
    },
    get markerStart() {
      return t.markerStart;
    },
    get markerEnd() {
      return t.markerEnd;
    },
    get interactionWidth() {
      return t.interactionWidth;
    },
    get style() {
      return t.style;
    }
  }), ve();
}
function V0(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => $n({
    sourceX: t.sourceX,
    sourceY: t.sourceY,
    targetX: t.targetX,
    targetY: t.targetY,
    sourcePosition: t.sourcePosition,
    targetPosition: t.targetPosition,
    borderRadius: 0
  })), r = /* @__PURE__ */ b(() => Nn(u(n), 3)), i = /* @__PURE__ */ b(() => u(r)[0]), o = /* @__PURE__ */ b(() => u(r)[1]), s = /* @__PURE__ */ b(() => u(r)[2]);
  Xn(e, {
    get path() {
      return u(i);
    },
    get labelX() {
      return u(o);
    },
    get labelY() {
      return u(s);
    },
    get label() {
      return t.label;
    },
    get labelStyle() {
      return t.labelStyle;
    },
    get markerStart() {
      return t.markerStart;
    },
    get markerEnd() {
      return t.markerEnd;
    },
    get interactionWidth() {
      return t.interactionWidth;
    },
    get style() {
      return t.style;
    }
  }), ve();
}
var di, hi;
class F0 {
  /**
   *
   * @param {() => T} fn
   * @param {(update: () => void) => void} onsubscribe
   */
  constructor(t, n) {
    K(this, di);
    K(this, hi);
    se(this, di, t), se(this, hi, Ul(n));
  }
  get current() {
    return y(this, hi).call(this), y(this, di).call(this);
  }
}
di = new WeakMap(), hi = new WeakMap();
const Y0 = /\(.+\)/, B0 = /* @__PURE__ */ new Set(["all", "print", "screen", "and", "or", "not", "only"]);
class K0 extends F0 {
  /**
   * @param {string} query A media query string
   * @param {boolean} [fallback] Fallback value for the server
   */
  constructor(t, n) {
    let r = Y0.test(t) || // we need to use `some` here because technically this `window.matchMedia('random,screen')` still returns true
    t.split(/[\s,]+/).some((o) => B0.has(o.trim())) ? t : `(${t})`;
    const i = window.matchMedia(r);
    super(
      () => i.matches,
      (o) => gs(i, "change", o)
    );
  }
}
function X0(e, t, n, r) {
  const i = /* @__PURE__ */ new Map();
  return aa(e, { x: 0, y: 0, width: n, height: r }, t, !0).forEach((o) => {
    i.set(o.id, o);
  }), i;
}
function gl(e) {
  const { edges: t, defaultEdgeOptions: n, nodeLookup: r, previousEdges: i, connectionMode: o, onerror: s, onlyRenderVisible: a, elevateEdgesOnSelect: l, zIndexMode: c } = e, f = /* @__PURE__ */ new Map();
  for (const h of t) {
    const d = r.get(h.source), v = r.get(h.target);
    if (!d || !v)
      continue;
    if (a) {
      const { visibleNodes: w, transform: S, width: N, height: M } = e;
      if (Ly({
        sourceNode: d,
        targetNode: v,
        width: N,
        height: M,
        transform: S
      }))
        w.set(d.id, d), w.set(v.id, v);
      else
        continue;
    }
    const m = i.get(h.id);
    if (m && h === m.edge && d == m.sourceNode && v == m.targetNode) {
      f.set(h.id, m);
      continue;
    }
    const _ = Xy({
      id: h.id,
      sourceNode: d,
      targetNode: v,
      sourceHandle: h.sourceHandle || null,
      targetHandle: h.targetHandle || null,
      connectionMode: o,
      onError: s
    });
    _ && f.set(h.id, {
      ...n,
      ...h,
      ..._,
      zIndex: Ry({
        selected: h.selected,
        zIndex: h.zIndex ?? n.zIndex,
        sourceNode: d,
        targetNode: v,
        elevateOnSelect: l,
        zIndexMode: c
      }),
      sourceNode: d,
      targetNode: v,
      edge: h
    });
  }
  return f;
}
const Iu = {
  input: C0,
  output: N0,
  default: Cu,
  group: I0
}, Tu = {
  straight: H0,
  smoothstep: L0,
  default: Nu,
  step: V0
};
function q0(e, t, n, r, i, o) {
  if (t && !n && r && i) {
    const s = Co(o, {
      filter: (a) => !!((a.width || a.initialWidth) && (a.height || a.initialHeight))
    });
    return la(s, r, i, 0.5, 2, 0.1);
  } else
    return n ?? { x: 0, y: 0, zoom: 1 };
}
function W0(e) {
  var n, r, i, o, s, a, l, c, f, h, d, v, m, _, w, S, N, M, E, R, F, B, L, Y, j, I, g, x, p, k, P, C, T, O, H, D, z, X, V, Q, W, G, Z, $, oe, J, le, ne, ye, be, Se, Pe, ce, we, Ie, _e, Le, pt, mt, Xe, Sr, Pr, Mr, Cr, Ar, Nr, Ir, Tr, Or, Dr, zr, Rr, Lr, Hr, Vr, Fr;
  class t {
    constructor() {
      K(this, n, /* @__PURE__ */ b(() => e.props.id ?? "1"));
      K(this, r, /* @__PURE__ */ ue(null));
      K(this, i, /* @__PURE__ */ ue(null));
      K(this, o, /* @__PURE__ */ ue(e.width ?? 0));
      K(this, s, /* @__PURE__ */ ue(e.height ?? 0));
      K(this, a, /* @__PURE__ */ ue(e.props.zIndexMode ?? "basic"));
      K(this, l, /* @__PURE__ */ b(() => {
        var st;
        const { nodesInitialized: A } = Uy(e.nodes, this.nodeLookup, this.parentLookup, {
          nodeExtent: this.nodeExtent,
          nodeOrigin: this.nodeOrigin,
          elevateNodesOnSelect: e.props.elevateNodesOnSelect ?? !0,
          checkEquality: !0,
          zIndexMode: this.zIndexMode
        });
        return this.fitViewQueued && A && ((st = this.fitViewOptions) != null && st.duration ? this.resolveFitView() : queueMicrotask(() => {
          this.resolveFitView();
        })), A;
      }));
      K(this, c, /* @__PURE__ */ b(() => this.panZoom !== null));
      K(this, f, /* @__PURE__ */ b(() => (n0(this.connectionLookup, this.edgeLookup, e.edges), e.edges)));
      Ee(this, "_prevSelectedNodes", []);
      Ee(this, "_prevSelectedNodeIds", /* @__PURE__ */ new Set());
      K(this, h, /* @__PURE__ */ b(() => {
        const A = this._prevSelectedNodeIds.size, st = /* @__PURE__ */ new Set(), Yr = this.nodes.filter((at) => (at.selected && (st.add(at.id), this._prevSelectedNodeIds.delete(at.id)), at.selected));
        return (A !== st.size || this._prevSelectedNodeIds.size > 0) && (this._prevSelectedNodes = Yr), this._prevSelectedNodeIds = st, this._prevSelectedNodes;
      }));
      Ee(this, "_prevSelectedEdges", []);
      Ee(this, "_prevSelectedEdgeIds", /* @__PURE__ */ new Set());
      K(this, d, /* @__PURE__ */ b(() => {
        const A = this._prevSelectedEdgeIds.size, st = /* @__PURE__ */ new Set(), Yr = this.edges.filter((at) => (at.selected && (st.add(at.id), this._prevSelectedEdgeIds.delete(at.id)), at.selected));
        return (A !== st.size || this._prevSelectedEdgeIds.size > 0) && (this._prevSelectedEdges = Yr), this._prevSelectedEdgeIds = st, this._prevSelectedEdges;
      }));
      Ee(this, "selectionChangeHandlers", /* @__PURE__ */ new Map());
      Ee(this, "nodeLookup", /* @__PURE__ */ new Map());
      Ee(this, "parentLookup", /* @__PURE__ */ new Map());
      Ee(this, "connectionLookup", /* @__PURE__ */ new Map());
      Ee(this, "edgeLookup", /* @__PURE__ */ new Map());
      Ee(this, "_prevVisibleEdges", /* @__PURE__ */ new Map());
      K(this, v, /* @__PURE__ */ b(() => {
        const {
          // We need to access this._nodes to trigger on changes
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          nodes: A,
          _edges: st,
          _prevVisibleEdges: Yr,
          nodeLookup: at,
          connectionMode: Ru,
          onerror: Lu,
          onlyRenderVisibleElements: Hu,
          defaultEdgeOptions: Vu,
          zIndexMode: Fu
        } = this;
        let Ci, Oo;
        const va = {
          edges: st,
          defaultEdgeOptions: Vu,
          previousEdges: Yr,
          nodeLookup: at,
          connectionMode: Ru,
          elevateEdgesOnSelect: e.props.elevateEdgesOnSelect ?? !0,
          zIndexMode: Fu,
          onerror: Lu
        };
        if (Hu) {
          const { viewport: Do, width: ya, height: pa } = this, ma = [Do.x, Do.y, Do.zoom];
          Ci = X0(at, ma, ya, pa), Oo = gl({
            ...va,
            onlyRenderVisible: !0,
            visibleNodes: Ci,
            transform: ma,
            width: ya,
            height: pa
          });
        } else
          Ci = this.nodeLookup, Oo = gl(va);
        return { nodes: Ci, edges: Oo };
      }));
      K(this, m, /* @__PURE__ */ b(() => e.props.nodesDraggable ?? !0));
      K(this, _, /* @__PURE__ */ b(() => e.props.nodesConnectable ?? !0));
      K(this, w, /* @__PURE__ */ b(() => e.props.elementsSelectable ?? !0));
      K(this, S, /* @__PURE__ */ b(() => e.props.nodesFocusable ?? !0));
      K(this, N, /* @__PURE__ */ b(() => e.props.edgesFocusable ?? !0));
      K(this, M, /* @__PURE__ */ b(() => e.props.disableKeyboardA11y ?? !1));
      K(this, E, /* @__PURE__ */ b(() => e.props.minZoom ?? 0.5));
      K(this, R, /* @__PURE__ */ b(() => e.props.maxZoom ?? 2));
      K(this, F, /* @__PURE__ */ b(() => e.props.nodeOrigin ?? [0, 0]));
      K(this, B, /* @__PURE__ */ b(() => e.props.nodeExtent ?? Ms));
      K(this, L, /* @__PURE__ */ b(() => e.props.translateExtent ?? Ms));
      K(this, Y, /* @__PURE__ */ b(() => e.props.defaultEdgeOptions ?? {}));
      K(this, j, /* @__PURE__ */ b(() => e.props.nodeDragThreshold ?? 1));
      K(this, I, /* @__PURE__ */ b(() => e.props.autoPanOnNodeDrag ?? !0));
      K(this, g, /* @__PURE__ */ b(() => e.props.autoPanOnConnect ?? !0));
      K(this, x, /* @__PURE__ */ b(() => e.props.autoPanOnNodeFocus ?? !0));
      K(this, p, /* @__PURE__ */ b(() => e.props.autoPanSpeed ?? 15));
      K(this, k, /* @__PURE__ */ b(() => e.props.connectionDragThreshold ?? 1));
      Ee(this, "fitViewQueued", e.props.fitView ?? !1);
      Ee(this, "fitViewOptions", e.props.fitViewOptions);
      Ee(this, "fitViewResolver", null);
      K(this, P, /* @__PURE__ */ b(() => e.props.snapGrid ?? null));
      K(this, C, /* @__PURE__ */ ue(!1));
      K(this, T, /* @__PURE__ */ ue(null));
      K(this, O, /* @__PURE__ */ ue(!1));
      K(this, H, /* @__PURE__ */ ue(!1));
      K(this, D, /* @__PURE__ */ ue(!1));
      K(this, z, /* @__PURE__ */ ue(!1));
      K(this, X, /* @__PURE__ */ ue(!1));
      K(this, V, /* @__PURE__ */ ue(null));
      K(this, Q, /* @__PURE__ */ ue(""));
      K(this, W, /* @__PURE__ */ b(() => e.props.selectionMode ?? oo.Partial));
      K(this, G, /* @__PURE__ */ b(() => ({ ...Iu, ...e.props.nodeTypes })));
      K(this, Z, /* @__PURE__ */ b(() => ({ ...Tu, ...e.props.edgeTypes })));
      K(this, $, /* @__PURE__ */ b(() => e.props.noPanClass ?? "nopan"));
      K(this, oe, /* @__PURE__ */ b(() => e.props.noDragClass ?? "nodrag"));
      K(this, J, /* @__PURE__ */ b(() => e.props.noWheelClass ?? "nowheel"));
      K(this, le, /* @__PURE__ */ b(() => Oy(e.props.ariaLabelConfig)));
      K(this, ne, /* @__PURE__ */ ue(q0(this.nodesInitialized, e.props.fitView, e.props.initialViewport, this.width, this.height, this.nodeLookup)));
      K(
        this,
        ye,
        // _connection is viewport independent and originating from XYHandle
        /* @__PURE__ */ ue(Cs)
      );
      K(this, be, /* @__PURE__ */ b(() => this._connection.inProgress ? {
        ...this._connection,
        to: Pi(this._connection.to, [this.viewport.x, this.viewport.y, this.viewport.zoom])
      } : this._connection));
      K(this, Se, /* @__PURE__ */ b(() => e.props.connectionMode ?? pr.Strict));
      K(this, Pe, /* @__PURE__ */ b(() => e.props.connectionRadius ?? 20));
      K(this, ce, /* @__PURE__ */ b(() => e.props.isValidConnection ?? (() => !0)));
      K(this, we, /* @__PURE__ */ b(() => e.props.selectNodesOnDrag ?? !0));
      K(this, Ie, /* @__PURE__ */ b(() => e.props.defaultMarkerColor === void 0 ? "#b1b1b7" : e.props.defaultMarkerColor));
      K(this, _e, /* @__PURE__ */ b(() => qy(e.edges, {
        defaultColor: this.defaultMarkerColor,
        id: this.flowId,
        defaultMarkerStart: this.defaultEdgeOptions.markerStart,
        defaultMarkerEnd: this.defaultEdgeOptions.markerEnd
      })));
      K(this, Le, /* @__PURE__ */ b(() => e.props.onlyRenderVisibleElements ?? !1));
      K(this, pt, /* @__PURE__ */ b(() => e.props.onflowerror ?? du));
      K(this, mt, /* @__PURE__ */ b(() => e.props.ondelete));
      K(this, Xe, /* @__PURE__ */ b(() => e.props.onbeforedelete));
      K(this, Sr, /* @__PURE__ */ b(() => e.props.onbeforeconnect));
      K(this, Pr, /* @__PURE__ */ b(() => e.props.onconnect));
      K(this, Mr, /* @__PURE__ */ b(() => e.props.onconnectstart));
      K(this, Cr, /* @__PURE__ */ b(() => e.props.onconnectend));
      K(this, Ar, /* @__PURE__ */ b(() => e.props.onbeforereconnect));
      K(this, Nr, /* @__PURE__ */ b(() => e.props.onreconnect));
      K(this, Ir, /* @__PURE__ */ b(() => e.props.onreconnectstart));
      K(this, Tr, /* @__PURE__ */ b(() => e.props.onreconnectend));
      K(this, Or, /* @__PURE__ */ b(() => e.props.clickConnect ?? !0));
      K(this, Dr, /* @__PURE__ */ b(() => e.props.onclickconnectstart));
      K(this, zr, /* @__PURE__ */ b(() => e.props.onclickconnectend));
      K(this, Rr, /* @__PURE__ */ ue(null));
      K(this, Lr, /* @__PURE__ */ b(() => e.props.onselectiondrag));
      K(this, Hr, /* @__PURE__ */ b(() => e.props.onselectiondragstart));
      K(this, Vr, /* @__PURE__ */ b(() => e.props.onselectiondragstop));
      Ee(this, "resolveFitView", async () => {
        var A;
        this.panZoom && (await Py(
          {
            nodes: this.nodeLookup,
            width: this.width,
            height: this.height,
            panZoom: this.panZoom,
            minZoom: this.minZoom,
            maxZoom: this.maxZoom
          },
          this.fitViewOptions
        ), (A = this.fitViewResolver) == null || A.resolve(!0), this.fitViewQueued = !1, this.fitViewOptions = void 0, this.fitViewResolver = null);
      });
      Ee(this, "_prefersDark", new K0("(prefers-color-scheme: dark)", e.props.colorModeSSR === "dark"));
      K(this, Fr, /* @__PURE__ */ b(() => e.props.colorMode === "system" ? this._prefersDark.current ? "dark" : "light" : e.props.colorMode ?? "light"));
      process.env.NODE_ENV === "development" && (vl(e.nodes, "nodes"), vl(e.edges, "edges"));
    }
    get flowId() {
      return u(y(this, n));
    }
    set flowId(A) {
      q(y(this, n), A);
    }
    get domNode() {
      return u(y(this, r));
    }
    set domNode(A) {
      q(y(this, r), A);
    }
    get panZoom() {
      return u(y(this, i));
    }
    set panZoom(A) {
      q(y(this, i), A);
    }
    get width() {
      return u(y(this, o));
    }
    set width(A) {
      q(y(this, o), A);
    }
    get height() {
      return u(y(this, s));
    }
    set height(A) {
      q(y(this, s), A);
    }
    get zIndexMode() {
      return u(y(this, a));
    }
    set zIndexMode(A) {
      q(y(this, a), A);
    }
    get nodesInitialized() {
      return u(y(this, l));
    }
    set nodesInitialized(A) {
      q(y(this, l), A);
    }
    get viewportInitialized() {
      return u(y(this, c));
    }
    set viewportInitialized(A) {
      q(y(this, c), A);
    }
    get _edges() {
      return u(y(this, f));
    }
    set _edges(A) {
      q(y(this, f), A);
    }
    get nodes() {
      return this.nodesInitialized, e.nodes;
    }
    set nodes(A) {
      e.nodes = A;
    }
    get edges() {
      return this._edges;
    }
    set edges(A) {
      e.edges = A;
    }
    get selectedNodes() {
      return u(y(this, h));
    }
    set selectedNodes(A) {
      q(y(this, h), A);
    }
    get selectedEdges() {
      return u(y(this, d));
    }
    set selectedEdges(A) {
      q(y(this, d), A);
    }
    get visible() {
      return u(y(this, v));
    }
    set visible(A) {
      q(y(this, v), A);
    }
    get nodesDraggable() {
      return u(y(this, m));
    }
    set nodesDraggable(A) {
      q(y(this, m), A);
    }
    get nodesConnectable() {
      return u(y(this, _));
    }
    set nodesConnectable(A) {
      q(y(this, _), A);
    }
    get elementsSelectable() {
      return u(y(this, w));
    }
    set elementsSelectable(A) {
      q(y(this, w), A);
    }
    get nodesFocusable() {
      return u(y(this, S));
    }
    set nodesFocusable(A) {
      q(y(this, S), A);
    }
    get edgesFocusable() {
      return u(y(this, N));
    }
    set edgesFocusable(A) {
      q(y(this, N), A);
    }
    get disableKeyboardA11y() {
      return u(y(this, M));
    }
    set disableKeyboardA11y(A) {
      q(y(this, M), A);
    }
    get minZoom() {
      return u(y(this, E));
    }
    set minZoom(A) {
      q(y(this, E), A);
    }
    get maxZoom() {
      return u(y(this, R));
    }
    set maxZoom(A) {
      q(y(this, R), A);
    }
    get nodeOrigin() {
      return u(y(this, F));
    }
    set nodeOrigin(A) {
      q(y(this, F), A);
    }
    get nodeExtent() {
      return u(y(this, B));
    }
    set nodeExtent(A) {
      q(y(this, B), A);
    }
    get translateExtent() {
      return u(y(this, L));
    }
    set translateExtent(A) {
      q(y(this, L), A);
    }
    get defaultEdgeOptions() {
      return u(y(this, Y));
    }
    set defaultEdgeOptions(A) {
      q(y(this, Y), A);
    }
    get nodeDragThreshold() {
      return u(y(this, j));
    }
    set nodeDragThreshold(A) {
      q(y(this, j), A);
    }
    get autoPanOnNodeDrag() {
      return u(y(this, I));
    }
    set autoPanOnNodeDrag(A) {
      q(y(this, I), A);
    }
    get autoPanOnConnect() {
      return u(y(this, g));
    }
    set autoPanOnConnect(A) {
      q(y(this, g), A);
    }
    get autoPanOnNodeFocus() {
      return u(y(this, x));
    }
    set autoPanOnNodeFocus(A) {
      q(y(this, x), A);
    }
    get autoPanSpeed() {
      return u(y(this, p));
    }
    set autoPanSpeed(A) {
      q(y(this, p), A);
    }
    get connectionDragThreshold() {
      return u(y(this, k));
    }
    set connectionDragThreshold(A) {
      q(y(this, k), A);
    }
    get snapGrid() {
      return u(y(this, P));
    }
    set snapGrid(A) {
      q(y(this, P), A);
    }
    get dragging() {
      return u(y(this, C));
    }
    set dragging(A) {
      q(y(this, C), A);
    }
    get selectionRect() {
      return u(y(this, T));
    }
    set selectionRect(A) {
      q(y(this, T), A);
    }
    get selectionKeyPressed() {
      return u(y(this, O));
    }
    set selectionKeyPressed(A) {
      q(y(this, O), A);
    }
    get multiselectionKeyPressed() {
      return u(y(this, H));
    }
    set multiselectionKeyPressed(A) {
      q(y(this, H), A);
    }
    get deleteKeyPressed() {
      return u(y(this, D));
    }
    set deleteKeyPressed(A) {
      q(y(this, D), A);
    }
    get panActivationKeyPressed() {
      return u(y(this, z));
    }
    set panActivationKeyPressed(A) {
      q(y(this, z), A);
    }
    get zoomActivationKeyPressed() {
      return u(y(this, X));
    }
    set zoomActivationKeyPressed(A) {
      q(y(this, X), A);
    }
    get selectionRectMode() {
      return u(y(this, V));
    }
    set selectionRectMode(A) {
      q(y(this, V), A);
    }
    get ariaLiveMessage() {
      return u(y(this, Q));
    }
    set ariaLiveMessage(A) {
      q(y(this, Q), A);
    }
    get selectionMode() {
      return u(y(this, W));
    }
    set selectionMode(A) {
      q(y(this, W), A);
    }
    get nodeTypes() {
      return u(y(this, G));
    }
    set nodeTypes(A) {
      q(y(this, G), A);
    }
    get edgeTypes() {
      return u(y(this, Z));
    }
    set edgeTypes(A) {
      q(y(this, Z), A);
    }
    get noPanClass() {
      return u(y(this, $));
    }
    set noPanClass(A) {
      q(y(this, $), A);
    }
    get noDragClass() {
      return u(y(this, oe));
    }
    set noDragClass(A) {
      q(y(this, oe), A);
    }
    get noWheelClass() {
      return u(y(this, J));
    }
    set noWheelClass(A) {
      q(y(this, J), A);
    }
    get ariaLabelConfig() {
      return u(y(this, le));
    }
    set ariaLabelConfig(A) {
      q(y(this, le), A);
    }
    get _viewport() {
      return u(y(this, ne));
    }
    set _viewport(A) {
      q(y(this, ne), A);
    }
    get viewport() {
      return e.viewport ?? this._viewport;
    }
    set viewport(A) {
      e.viewport && (e.viewport = A), this._viewport = A;
    }
    get _connection() {
      return u(y(this, ye));
    }
    set _connection(A) {
      q(y(this, ye), A);
    }
    get connection() {
      return u(y(this, be));
    }
    set connection(A) {
      q(y(this, be), A);
    }
    get connectionMode() {
      return u(y(this, Se));
    }
    set connectionMode(A) {
      q(y(this, Se), A);
    }
    get connectionRadius() {
      return u(y(this, Pe));
    }
    set connectionRadius(A) {
      q(y(this, Pe), A);
    }
    get isValidConnection() {
      return u(y(this, ce));
    }
    set isValidConnection(A) {
      q(y(this, ce), A);
    }
    get selectNodesOnDrag() {
      return u(y(this, we));
    }
    set selectNodesOnDrag(A) {
      q(y(this, we), A);
    }
    get defaultMarkerColor() {
      return u(y(this, Ie));
    }
    set defaultMarkerColor(A) {
      q(y(this, Ie), A);
    }
    get markers() {
      return u(y(this, _e));
    }
    set markers(A) {
      q(y(this, _e), A);
    }
    get onlyRenderVisibleElements() {
      return u(y(this, Le));
    }
    set onlyRenderVisibleElements(A) {
      q(y(this, Le), A);
    }
    get onerror() {
      return u(y(this, pt));
    }
    set onerror(A) {
      q(y(this, pt), A);
    }
    get ondelete() {
      return u(y(this, mt));
    }
    set ondelete(A) {
      q(y(this, mt), A);
    }
    get onbeforedelete() {
      return u(y(this, Xe));
    }
    set onbeforedelete(A) {
      q(y(this, Xe), A);
    }
    get onbeforeconnect() {
      return u(y(this, Sr));
    }
    set onbeforeconnect(A) {
      q(y(this, Sr), A);
    }
    get onconnect() {
      return u(y(this, Pr));
    }
    set onconnect(A) {
      q(y(this, Pr), A);
    }
    get onconnectstart() {
      return u(y(this, Mr));
    }
    set onconnectstart(A) {
      q(y(this, Mr), A);
    }
    get onconnectend() {
      return u(y(this, Cr));
    }
    set onconnectend(A) {
      q(y(this, Cr), A);
    }
    get onbeforereconnect() {
      return u(y(this, Ar));
    }
    set onbeforereconnect(A) {
      q(y(this, Ar), A);
    }
    get onreconnect() {
      return u(y(this, Nr));
    }
    set onreconnect(A) {
      q(y(this, Nr), A);
    }
    get onreconnectstart() {
      return u(y(this, Ir));
    }
    set onreconnectstart(A) {
      q(y(this, Ir), A);
    }
    get onreconnectend() {
      return u(y(this, Tr));
    }
    set onreconnectend(A) {
      q(y(this, Tr), A);
    }
    get clickConnect() {
      return u(y(this, Or));
    }
    set clickConnect(A) {
      q(y(this, Or), A);
    }
    get onclickconnectstart() {
      return u(y(this, Dr));
    }
    set onclickconnectstart(A) {
      q(y(this, Dr), A);
    }
    get onclickconnectend() {
      return u(y(this, zr));
    }
    set onclickconnectend(A) {
      q(y(this, zr), A);
    }
    get clickConnectStartHandle() {
      return u(y(this, Rr));
    }
    set clickConnectStartHandle(A) {
      q(y(this, Rr), A);
    }
    get onselectiondrag() {
      return u(y(this, Lr));
    }
    set onselectiondrag(A) {
      q(y(this, Lr), A);
    }
    get onselectiondragstart() {
      return u(y(this, Hr));
    }
    set onselectiondragstart(A) {
      q(y(this, Hr), A);
    }
    get onselectiondragstop() {
      return u(y(this, Vr));
    }
    set onselectiondragstop(A) {
      q(y(this, Vr), A);
    }
    get colorMode() {
      return u(y(this, Fr));
    }
    set colorMode(A) {
      q(y(this, Fr), A);
    }
    resetStoreValues() {
      this.dragging = !1, this.selectionRect = null, this.selectionRectMode = null, this.selectionKeyPressed = !1, this.multiselectionKeyPressed = !1, this.deleteKeyPressed = !1, this.panActivationKeyPressed = !1, this.zoomActivationKeyPressed = !1, this._connection = Cs, this.clickConnectStartHandle = null, this.viewport = e.props.initialViewport ?? { x: 0, y: 0, zoom: 1 }, this.ariaLiveMessage = "";
    }
  }
  return n = new WeakMap(), r = new WeakMap(), i = new WeakMap(), o = new WeakMap(), s = new WeakMap(), a = new WeakMap(), l = new WeakMap(), c = new WeakMap(), f = new WeakMap(), h = new WeakMap(), d = new WeakMap(), v = new WeakMap(), m = new WeakMap(), _ = new WeakMap(), w = new WeakMap(), S = new WeakMap(), N = new WeakMap(), M = new WeakMap(), E = new WeakMap(), R = new WeakMap(), F = new WeakMap(), B = new WeakMap(), L = new WeakMap(), Y = new WeakMap(), j = new WeakMap(), I = new WeakMap(), g = new WeakMap(), x = new WeakMap(), p = new WeakMap(), k = new WeakMap(), P = new WeakMap(), C = new WeakMap(), T = new WeakMap(), O = new WeakMap(), H = new WeakMap(), D = new WeakMap(), z = new WeakMap(), X = new WeakMap(), V = new WeakMap(), Q = new WeakMap(), W = new WeakMap(), G = new WeakMap(), Z = new WeakMap(), $ = new WeakMap(), oe = new WeakMap(), J = new WeakMap(), le = new WeakMap(), ne = new WeakMap(), ye = new WeakMap(), be = new WeakMap(), Se = new WeakMap(), Pe = new WeakMap(), ce = new WeakMap(), we = new WeakMap(), Ie = new WeakMap(), _e = new WeakMap(), Le = new WeakMap(), pt = new WeakMap(), mt = new WeakMap(), Xe = new WeakMap(), Sr = new WeakMap(), Pr = new WeakMap(), Mr = new WeakMap(), Cr = new WeakMap(), Ar = new WeakMap(), Nr = new WeakMap(), Ir = new WeakMap(), Tr = new WeakMap(), Or = new WeakMap(), Dr = new WeakMap(), zr = new WeakMap(), Rr = new WeakMap(), Lr = new WeakMap(), Hr = new WeakMap(), Vr = new WeakMap(), Fr = new WeakMap(), new t();
}
function vl(e, t) {
  try {
    e && e.length > 0 && structuredClone(e[0]);
  } catch {
    console.warn(`Use $state.raw for ${t} to prevent performance issues.`);
  }
}
function Mi() {
  const e = Hs(Is);
  if (!e)
    throw new Error("To call useStore outside of <SvelteFlow /> you need to wrap your component in a <SvelteFlowProvider />");
  return e.getStore();
}
const Is = Symbol();
function Z0(e) {
  const t = W0(e);
  function n(I) {
    t.nodeTypes = {
      ...Iu,
      ...I
    };
  }
  function r(I) {
    t.edgeTypes = {
      ...Tu,
      ...I
    };
  }
  function i(I) {
    t.edges = Fy(I, t.edges);
  }
  const o = (I, g = !1) => {
    t.nodes = t.nodes.map((x) => {
      if (t.connection.inProgress && t.connection.fromNode.id === x.id) {
        const k = t.nodeLookup.get(x.id);
        k && (t.connection = {
          ...t.connection,
          from: Hn(k, t.connection.fromHandle, U.Left, !0)
        });
      }
      const p = I.get(x.id);
      return p ? { ...x, position: p.position, dragging: g } : x;
    });
  };
  function s(I) {
    var k, P, C;
    const { changes: g, updatedInternals: x } = e0(I, t.nodeLookup, t.parentLookup, t.domNode, t.nodeOrigin, t.nodeExtent, t.zIndexMode);
    if (!x)
      return;
    jy(t.nodeLookup, t.parentLookup, {
      nodeOrigin: t.nodeOrigin,
      nodeExtent: t.nodeExtent,
      zIndexMode: t.zIndexMode
    }), t.fitViewQueued && t.resolveFitView();
    const p = /* @__PURE__ */ new Map();
    for (const T of g) {
      const O = (k = t.nodeLookup.get(T.id)) == null ? void 0 : k.internals.userNode;
      if (!O)
        continue;
      const H = { ...O };
      switch (T.type) {
        case "dimensions": {
          const D = { ...H.measured, ...T.dimensions };
          T.setAttributes && (H.width = ((P = T.dimensions) == null ? void 0 : P.width) ?? H.width, H.height = ((C = T.dimensions) == null ? void 0 : C.height) ?? H.height), H.measured = D;
          break;
        }
        case "position":
          H.position = T.position ?? H.position;
          break;
      }
      p.set(T.id, H);
    }
    t.nodes = t.nodes.map((T) => p.get(T.id) ?? T);
  }
  function a(I) {
    const g = t.fitViewResolver ?? Promise.withResolvers();
    return t.fitViewQueued = !0, t.fitViewOptions = I, t.fitViewResolver = g, t.nodes = [...t.nodes], g.promise;
  }
  async function l(I, g, x) {
    const p = typeof (x == null ? void 0 : x.zoom) < "u" ? x.zoom : t.maxZoom, k = t.panZoom;
    return k ? (await k.setViewport({
      x: t.width / 2 - I * p,
      y: t.height / 2 - g * p,
      zoom: p
    }, { duration: x == null ? void 0 : x.duration, ease: x == null ? void 0 : x.ease, interpolate: x == null ? void 0 : x.interpolate }), Promise.resolve(!0)) : Promise.resolve(!1);
  }
  function c(I, g) {
    const x = t.panZoom;
    return x ? x.scaleBy(I, g) : Promise.resolve(!1);
  }
  function f(I) {
    return c(1.2, I);
  }
  function h(I) {
    return c(1 / 1.2, I);
  }
  function d(I) {
    const g = t.panZoom;
    g && (g.setScaleExtent([I, t.maxZoom]), t.minZoom = I);
  }
  function v(I) {
    const g = t.panZoom;
    g && (g.setScaleExtent([t.minZoom, I]), t.maxZoom = I);
  }
  function m(I) {
    const g = t.panZoom;
    g && (g.setTranslateExtent(I), t.translateExtent = I);
  }
  function _(I, g = null) {
    let x = !1;
    const p = I.map((k) => (g ? g.has(k.id) : !0) && k.selected ? (x = !0, { ...k, selected: !1 }) : k);
    return [x, p];
  }
  function w(I) {
    const g = I != null && I.nodes ? new Set(I.nodes.map((T) => T.id)) : null, [x, p] = _(t.nodes, g);
    x && (t.nodes = p);
    const k = I != null && I.edges ? new Set(I.edges.map((T) => T.id)) : null, [P, C] = _(t.edges, k);
    P && (t.edges = C);
  }
  function S(I) {
    const g = t.multiselectionKeyPressed;
    t.nodes = t.nodes.map((x) => {
      const p = I.includes(x.id), k = g && x.selected || p;
      return !!x.selected !== k ? { ...x, selected: k } : x;
    }), g || w({ nodes: [] });
  }
  function N(I) {
    const g = t.multiselectionKeyPressed;
    t.edges = t.edges.map((x) => {
      const p = I.includes(x.id), k = g && x.selected || p;
      return !!x.selected !== k ? { ...x, selected: k } : x;
    }), g || w({ edges: [] });
  }
  function M(I, g, x) {
    const p = t.nodeLookup.get(I);
    if (!p) {
      console.warn("012", Rn.error012(I));
      return;
    }
    t.selectionRect = null, t.selectionRectMode = null, p.selected ? (g || p.selected && t.multiselectionKeyPressed) && (w({ nodes: [p], edges: [] }), requestAnimationFrame(() => x == null ? void 0 : x.blur())) : S([I]);
  }
  function E(I) {
    const g = t.edgeLookup.get(I);
    if (!g) {
      console.warn("012", Rn.error012(I));
      return;
    }
    (g.selectable || t.elementsSelectable && typeof g.selectable > "u") && (t.selectionRect = null, t.selectionRectMode = null, g.selected ? g.selected && t.multiselectionKeyPressed && w({ nodes: [], edges: [g] }) : N([I]));
  }
  function R(I, g) {
    const { nodeExtent: x, snapGrid: p, nodeOrigin: k, nodeLookup: P, nodesDraggable: C, onerror: T } = t, O = /* @__PURE__ */ new Map(), H = (p == null ? void 0 : p[0]) ?? 5, D = (p == null ? void 0 : p[1]) ?? 5, z = I.x * H * g, X = I.y * D * g;
    for (const V of P.values()) {
      if (!(V.selected && (V.draggable || C && typeof V.draggable > "u")))
        continue;
      let W = {
        x: V.internals.positionAbsolute.x + z,
        y: V.internals.positionAbsolute.y + X
      };
      p && (W = Si(W, p));
      const { position: G, positionAbsolute: Z } = cu({
        nodeId: V.id,
        nextPosition: W,
        nodeLookup: P,
        nodeExtent: x,
        nodeOrigin: k,
        onError: T
      });
      V.position = G, V.internals.positionAbsolute = Z, O.set(V.id, V);
    }
    o(O);
  }
  function F(I) {
    return t0({
      delta: I,
      panZoom: t.panZoom,
      transform: [t.viewport.x, t.viewport.y, t.viewport.zoom],
      translateExtent: t.translateExtent,
      width: t.width,
      height: t.height
    });
  }
  const B = (I) => {
    t._connection = { ...I };
  };
  function L() {
    t._connection = Cs;
  }
  function Y() {
    t.resetStoreValues(), w();
  }
  return Object.assign(t, {
    setNodeTypes: n,
    setEdgeTypes: r,
    addEdge: i,
    updateNodePositions: o,
    updateNodeInternals: s,
    zoomIn: f,
    zoomOut: h,
    fitView: a,
    setCenter: l,
    setMinZoom: d,
    setMaxZoom: v,
    setTranslateExtent: m,
    unselectNodesAndEdges: w,
    addSelectedNodes: S,
    addSelectedEdges: N,
    handleNodeSelection: M,
    handleEdgeSelection: E,
    moveSelectedNodes: R,
    panBy: F,
    updateConnection: B,
    cancelConnection: L,
    reset: Y
  });
}
function Jo(e, t) {
  const { minZoom: n, maxZoom: r, initialViewport: i, onPanZoomStart: o, onPanZoom: s, onPanZoomEnd: a, translateExtent: l, setPanZoomInstance: c, onDraggingChange: f, onTransformChange: h } = t, d = m0({
    domNode: e,
    minZoom: n,
    maxZoom: r,
    translateExtent: l,
    viewport: i,
    onPanZoom: s,
    onPanZoomStart: o,
    onPanZoomEnd: a,
    onDraggingChange: f
  }), v = d.getViewport();
  return (i.x !== v.x || i.y !== v.y || i.zoom !== v.zoom) && h([v.x, v.y, v.zoom]), c(d), d.update(t), {
    update(m) {
      d.update(m);
    }
  };
}
var j0 = /* @__PURE__ */ de('<div class="svelte-flow__zoom svelte-flow__container"><!></div>');
function G0(e, t) {
  ge(t, !0);
  let n = ee(t, "store", 15), r = /* @__PURE__ */ b(() => n().panActivationKeyPressed || t.panOnDrag), i = /* @__PURE__ */ b(() => n().panActivationKeyPressed || t.panOnScroll);
  const { viewport: o } = n();
  let s = !1;
  ht(() => {
    var c;
    !s && n().viewportInitialized && ((c = t.oninit) == null || c.call(t), s = !0);
  });
  var a = j0(), l = ie(a);
  pn(l, () => t.children), Ze(a, (c, f) => Jo == null ? void 0 : Jo(c, f), () => ({
    viewport: n().viewport,
    minZoom: n().minZoom,
    maxZoom: n().maxZoom,
    initialViewport: o,
    onDraggingChange: (c) => {
      n(n().dragging = c, !0);
    },
    setPanZoomInstance: (c) => {
      n(n().panZoom = c, !0);
    },
    onPanZoomStart: t.onmovestart,
    onPanZoom: t.onmove,
    onPanZoomEnd: t.onmoveend,
    zoomOnScroll: t.zoomOnScroll,
    zoomOnDoubleClick: t.zoomOnDoubleClick,
    zoomOnPinch: t.zoomOnPinch,
    panOnScroll: u(i),
    panOnDrag: u(r),
    panOnScrollSpeed: t.panOnScrollSpeed,
    panOnScrollMode: t.panOnScrollMode,
    zoomActivationKeyPressed: n().zoomActivationKeyPressed,
    preventScrolling: typeof t.preventScrolling == "boolean" ? t.preventScrolling : !0,
    noPanClassName: n().noPanClass,
    noWheelClassName: n().noWheelClass,
    userSelectionActive: !!n().selectionRect,
    translateExtent: n().translateExtent,
    lib: "svelte",
    paneClickDistance: t.paneClickDistance,
    selectionOnDrag: t.selectionOnDrag,
    onTransformChange: (c) => {
      n(n().viewport = { x: c[0], y: c[1], zoom: c[2] }, !0);
    },
    connectionInProgress: n().connection.inProgress
  })), te(e, a), ve();
}
function yl(e, t) {
  return (n) => {
    n.target === t && (e == null || e(n));
  };
}
function pl(e) {
  return (t) => {
    const n = e.has(t.id);
    return !!t.selected !== n ? { ...t, selected: n } : t;
  };
}
function ml(e, t) {
  if (e.size !== t.size)
    return !1;
  for (const n of e)
    if (!t.has(n))
      return !1;
  return !0;
}
var U0 = /* @__PURE__ */ de("<div><!></div>");
function Q0(e, t) {
  ge(t, !0);
  let n = ee(t, "store", 15), r = ee(t, "panOnDrag", 3, !0), i = ee(t, "paneClickDistance", 3, 1), o, s = null, a = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ b(() => n().panActivationKeyPressed || r()), f = /* @__PURE__ */ b(() => n().selectionKeyPressed || !!n().selectionRect || t.selectionOnDrag && u(c) !== !0), h = /* @__PURE__ */ b(() => n().elementsSelectable && (u(f) || n().selectionRectMode === "user")), d = !1;
  function v(L) {
    var p, k;
    if (s = o == null ? void 0 : o.getBoundingClientRect(), !s) return;
    const Y = L.target === o, j = !Y && !!L.target.closest(".nokey"), I = t.selectionOnDrag && Y || n().selectionKeyPressed;
    if (j || !u(f) || !I || L.button !== 0 || !L.isPrimary)
      return;
    (k = (p = L.target) == null ? void 0 : p.setPointerCapture) == null || k.call(p, L.pointerId), d = !1;
    const { x: g, y: x } = St(L, s);
    n(n().selectionRect = { width: 0, height: 0, startX: g, startY: x, x: g, y: x }, !0), Y || (L.stopPropagation(), L.preventDefault());
  }
  function m(L) {
    var P;
    if (!u(f) || !s || !n().selectionRect)
      return;
    const Y = St(L, s), { startX: j = 0, startY: I = 0 } = n().selectionRect;
    if (!d) {
      const C = n().selectionKeyPressed ? 0 : i();
      if (Math.hypot(Y.x - j, Y.y - I) <= C)
        return;
      n().unselectNodesAndEdges(), (P = t.onselectionstart) == null || P.call(t, L);
    }
    d = !0;
    const g = {
      ...n().selectionRect,
      x: Y.x < j ? Y.x : j,
      y: Y.y < I ? Y.y : I,
      width: Math.abs(Y.x - j),
      height: Math.abs(Y.y - I)
    }, x = a, p = l;
    a = new Set(aa(
      n().nodeLookup,
      g,
      [
        n().viewport.x,
        n().viewport.y,
        n().viewport.zoom
      ],
      n().selectionMode === oo.Partial,
      !0
    ).map((C) => C.id));
    const k = n().defaultEdgeOptions.selectable ?? !0;
    l = /* @__PURE__ */ new Set();
    for (const C of a) {
      const T = n().connectionLookup.get(C);
      if (T)
        for (const { edgeId: O } of T.values()) {
          const H = n().edgeLookup.get(O);
          H && (H.selectable ?? k) && l.add(O);
        }
    }
    ml(x, a) || n(n().nodes = n().nodes.map(pl(a)), !0), ml(p, l) || n(n().edges = n().edges.map(pl(l)), !0), n(n().selectionRectMode = "user", !0), n(n().selectionRect = g, !0);
  }
  function _(L) {
    var Y, j, I;
    L.button === 0 && ((j = (Y = L.target) == null ? void 0 : Y.releasePointerCapture) == null || j.call(Y, L.pointerId), !d && L.target === o && (N == null || N(L)), n(n().selectionRect = null, !0), d && n(n().selectionRectMode = a.size > 0 ? "nodes" : null, !0), d && ((I = t.onselectionend) == null || I.call(t, L)));
  }
  const w = (L) => {
    var Y;
    if (Array.isArray(u(c)) && u(c).includes(2)) {
      L.preventDefault();
      return;
    }
    (Y = t.onpanecontextmenu) == null || Y.call(t, { event: L });
  }, S = (L) => {
    d && (L.stopPropagation(), d = !1);
  };
  function N(L) {
    var Y;
    if (d || n().connection.inProgress) {
      d = !1;
      return;
    }
    (Y = t.onpaneclick) == null || Y.call(t, { event: L }), n().unselectNodesAndEdges(), n(n().selectionRectMode = null, !0), n(n().selectionRect = null, !0);
  }
  var M = U0();
  let E;
  var R = /* @__PURE__ */ b(() => u(h) ? void 0 : yl(N, o)), F = /* @__PURE__ */ b(() => yl(w, o)), B = ie(M);
  pn(B, () => t.children), wi(M, (L) => o = L, () => o), me((L) => E = Yn(M, 1, "svelte-flow__pane svelte-flow__container", null, E, L), [
    () => ({
      draggable: r() === !0 || Array.isArray(r()) && r().includes(0),
      dragging: n().dragging,
      selection: u(f)
    })
  ]), rt("click", M, function(...L) {
    var Y;
    (Y = u(R)) == null || Y.apply(this, L);
  }), Gi(
    "pointerdown",
    M,
    function(...L) {
      var Y;
      (Y = u(h) ? v : void 0) == null || Y.apply(this, L);
    },
    !0
  ), rt("pointermove", M, function(...L) {
    var Y;
    (Y = u(h) ? m : void 0) == null || Y.apply(this, L);
  }), rt("pointerup", M, function(...L) {
    var Y;
    (Y = u(h) ? _ : void 0) == null || Y.apply(this, L);
  }), rt("contextmenu", M, function(...L) {
    var Y;
    (Y = u(F)) == null || Y.apply(this, L);
  }), Gi(
    "click",
    M,
    function(...L) {
      var Y;
      (Y = u(h) ? S : void 0) == null || Y.apply(this, L);
    },
    !0
  ), te(e, M), ve();
}
xo(["click", "pointermove", "pointerup", "contextmenu"]);
var J0 = /* @__PURE__ */ de('<div class="svelte-flow__viewport xyflow__viewport svelte-flow__container"><!></div>');
function $0(e, t) {
  ge(t, !0);
  var n = J0();
  let r;
  var i = ie(n);
  pn(i, () => t.children), me(() => r = Be(n, "", r, {
    transform: `translate(${t.store.viewport.x ?? ""}px, ${t.store.viewport.y ?? ""}px) scale(${t.store.viewport.zoom ?? ""})`
  })), te(e, n), ve();
}
function er(e, t) {
  const { store: n, onDrag: r, onDragStart: i, onDragStop: o, onNodeMouseDown: s } = t, a = o0({
    onDrag: r,
    onDragStart: i,
    onDragStop: o,
    onNodeMouseDown: s,
    getStoreItems: () => {
      const { snapGrid: c, viewport: f } = n;
      return {
        nodes: n.nodes,
        nodeLookup: n.nodeLookup,
        edges: n.edges,
        nodeExtent: n.nodeExtent,
        snapGrid: c || [0, 0],
        snapToGrid: !!c,
        nodeOrigin: n.nodeOrigin,
        multiSelectionActive: n.multiselectionKeyPressed,
        domNode: n.domNode,
        transform: [f.x, f.y, f.zoom],
        autoPanOnNodeDrag: n.autoPanOnNodeDrag,
        nodesDraggable: n.nodesDraggable,
        selectNodesOnDrag: n.selectNodesOnDrag,
        nodeDragThreshold: n.nodeDragThreshold,
        unselectNodesAndEdges: n.unselectNodesAndEdges,
        updateNodePositions: n.updateNodePositions,
        onSelectionDrag: n.onselectiondrag,
        onSelectionDragStart: n.onselectiondragstart,
        onSelectionDragStop: n.onselectiondragstop,
        panBy: n.panBy
      };
    }
  });
  function l(c, f) {
    if (f.disabled) {
      a.destroy();
      return;
    }
    a.update({
      domNode: c,
      noDragClassName: f.noDragClass,
      handleSelector: f.handleSelector,
      nodeId: f.nodeId,
      isSelectable: f.isSelectable,
      nodeClickDistance: f.nodeClickDistance
    });
  }
  return l(e, t), {
    update(c) {
      l(e, c);
    },
    destroy() {
      a.destroy();
    }
  };
}
var ep = /* @__PURE__ */ de('<div aria-live="assertive" aria-atomic="true" class="a11y-live-msg svelte-13pq11u"> </div>'), tp = /* @__PURE__ */ de('<div class="a11y-hidden svelte-13pq11u"> </div> <div class="a11y-hidden svelte-13pq11u"> </div> <!>', 1);
function np(e, t) {
  ge(t, !0);
  var n = tp(), r = Oe(n), i = ie(r), o = re(r, 2), s = ie(o), a = re(o, 2);
  {
    var l = (c) => {
      var f = ep(), h = ie(f);
      me(() => {
        ke(f, "id", `${rp}-${t.store.flowId}`), He(h, t.store.ariaLiveMessage);
      }), te(c, f);
    };
    ze(a, (c) => {
      t.store.disableKeyboardA11y || c(l);
    });
  }
  me(() => {
    ke(r, "id", `${Ou}-${t.store.flowId}`), He(i, t.store.disableKeyboardA11y ? t.store.ariaLabelConfig["node.a11yDescription.default"] : t.store.ariaLabelConfig["node.a11yDescription.keyboardDisabled"]), ke(o, "id", `${Du}-${t.store.flowId}`), He(s, t.store.ariaLabelConfig["edge.a11yDescription.default"]);
  }), te(e, n), ve();
}
const Ou = "svelte-flow__node-desc", Du = "svelte-flow__edge-desc", rp = "svelte-flow__aria-live";
var ip = /* @__PURE__ */ de("<div><!></div>");
function op(e, t) {
  ge(t, !0);
  let n = ee(t, "store", 15), r = /* @__PURE__ */ b(() => Ye(t.node.data, () => ({}), !0)), i = /* @__PURE__ */ b(() => Ye(t.node.selected, !1)), o = /* @__PURE__ */ b(() => t.node.draggable), s = /* @__PURE__ */ b(() => t.node.selectable), a = /* @__PURE__ */ b(() => Ye(t.node.deletable, !0)), l = /* @__PURE__ */ b(() => t.node.connectable), c = /* @__PURE__ */ b(() => t.node.focusable), f = /* @__PURE__ */ b(() => Ye(t.node.hidden, !1)), h = /* @__PURE__ */ b(() => Ye(t.node.dragging, !1)), d = /* @__PURE__ */ b(() => Ye(t.node.style, "")), v = /* @__PURE__ */ b(() => t.node.class), m = /* @__PURE__ */ b(() => Ye(t.node.type, "default")), _ = /* @__PURE__ */ b(() => t.node.parentId), w = /* @__PURE__ */ b(() => t.node.sourcePosition), S = /* @__PURE__ */ b(() => t.node.targetPosition), N = /* @__PURE__ */ b(() => Ye(t.node.measured, () => ({ width: 0, height: 0 }), !0).width), M = /* @__PURE__ */ b(() => Ye(t.node.measured, () => ({ width: 0, height: 0 }), !0).height), E = /* @__PURE__ */ b(() => t.node.initialWidth), R = /* @__PURE__ */ b(() => t.node.initialHeight), F = /* @__PURE__ */ b(() => t.node.width), B = /* @__PURE__ */ b(() => t.node.height), L = /* @__PURE__ */ b(() => t.node.dragHandle), Y = /* @__PURE__ */ b(() => Ye(t.node.internals.z, 0)), j = /* @__PURE__ */ b(() => t.node.internals.positionAbsolute.x), I = /* @__PURE__ */ b(() => t.node.internals.positionAbsolute.y), g = /* @__PURE__ */ b(() => t.node.internals.userNode), { id: x } = t.node, p = /* @__PURE__ */ b(() => u(o) ?? n().nodesDraggable), k = /* @__PURE__ */ b(() => u(s) ?? n().elementsSelectable), P = /* @__PURE__ */ b(() => u(l) ?? n().nodesConnectable), C = /* @__PURE__ */ b(() => Iy(t.node)), T = /* @__PURE__ */ b(() => !!t.node.internals.handleBounds), O = /* @__PURE__ */ b(() => u(C) && u(T)), H = /* @__PURE__ */ b(() => u(c) ?? n().nodesFocusable);
  function D(ce) {
    return n().parentLookup.has(ce);
  }
  let z = /* @__PURE__ */ b(() => D(x)), X = /* @__PURE__ */ ue(null), V = null, Q = u(m), W = u(w), G = u(S), Z = /* @__PURE__ */ b(() => n().nodeTypes[u(m)] ?? Cu), $ = /* @__PURE__ */ b(() => n().ariaLabelConfig), oe = {
    get value() {
      return u(P);
    }
  };
  w0(x), b0(oe), process.env.NODE_ENV === "development" && ht(() => {
    !!n().nodeTypes[u(m)] || console.warn("003", Rn.error003(u(m)));
  });
  let J = /* @__PURE__ */ b(() => {
    const ce = u(N) === void 0 ? u(F) ?? u(E) : u(F), we = u(M) === void 0 ? u(B) ?? u(R) : u(B);
    if (!(ce === void 0 && we === void 0 && u(d) === void 0))
      return `${u(d)};${ce ? `width:${Ht(ce)};` : ""}${we ? `height:${Ht(we)};` : ""}`;
  });
  ht(() => {
    (u(m) !== Q || u(w) !== W || u(S) !== G) && u(X) !== null && requestAnimationFrame(() => {
      u(X) !== null && n().updateNodeInternals(/* @__PURE__ */ new Map([[x, { id: x, nodeElement: u(X), force: !0 }]]));
    }), Q = u(m), W = u(w), G = u(S);
  }), ht(() => {
    t.resizeObserver && (!u(O) || u(X) !== V) && (V && t.resizeObserver.unobserve(V), u(X) && t.resizeObserver.observe(u(X)), V = u(X));
  }), Js(() => {
    var ce;
    V && ((ce = t.resizeObserver) == null || ce.unobserve(V));
  });
  function le(ce) {
    var we;
    u(k) && (!n().selectNodesOnDrag || !u(p) || n().nodeDragThreshold > 0) && n().handleNodeSelection(x), (we = t.onnodeclick) == null || we.call(t, { node: u(g), event: ce });
  }
  function ne(ce) {
    if (!(vu(ce) || n().disableKeyboardA11y))
      if (au.includes(ce.key) && u(k)) {
        const we = ce.key === "Escape";
        n().handleNodeSelection(x, we, u(X));
      } else u(p) && t.node.selected && Object.prototype.hasOwnProperty.call(co, ce.key) && (ce.preventDefault(), n(
        n().ariaLiveMessage = u($)["node.a11yDescription.ariaLiveMessage"]({
          direction: ce.key.replace("Arrow", "").toLowerCase(),
          x: ~~t.node.internals.positionAbsolute.x,
          y: ~~t.node.internals.positionAbsolute.y
        }),
        !0
      ), n().moveSelectedNodes(co[ce.key], ce.shiftKey ? 4 : 1));
  }
  const ye = () => {
    var Le;
    if (n().disableKeyboardA11y || !n().autoPanOnNodeFocus || !((Le = u(X)) != null && Le.matches(":focus-visible")))
      return;
    const { width: ce, height: we, viewport: Ie } = n();
    aa(/* @__PURE__ */ new Map([[x, t.node]]), { x: 0, y: 0, width: ce, height: we }, [Ie.x, Ie.y, Ie.zoom], !0).length > 0 || n().setCenter(t.node.position.x + (t.node.measured.width ?? 0) / 2, t.node.position.y + (t.node.measured.height ?? 0) / 2, { zoom: Ie.zoom });
  };
  var be = On(), Se = Oe(be);
  {
    var Pe = (ce) => {
      var we = ip();
      Bn(we, () => ({
        "data-id": x,
        class: [
          "svelte-flow__node",
          `svelte-flow__node-${u(m)}`,
          u(v)
        ],
        style: u(J),
        onclick: le,
        onpointerenter: t.onnodepointerenter ? (_e) => t.onnodepointerenter({ node: u(g), event: _e }) : void 0,
        onpointerleave: t.onnodepointerleave ? (_e) => t.onnodepointerleave({ node: u(g), event: _e }) : void 0,
        onpointermove: t.onnodepointermove ? (_e) => t.onnodepointermove({ node: u(g), event: _e }) : void 0,
        oncontextmenu: t.onnodecontextmenu ? (_e) => t.onnodecontextmenu({ node: u(g), event: _e }) : void 0,
        onkeydown: u(H) ? ne : void 0,
        onfocus: u(H) ? ye : void 0,
        tabIndex: u(H) ? 0 : void 0,
        role: t.node.ariaRole ?? (u(H) ? "group" : void 0),
        "aria-roledescription": "node",
        "aria-describedby": n().disableKeyboardA11y ? void 0 : `${Ou}-${n().flowId}`,
        ...t.node.domAttributes,
        [tn]: {
          dragging: u(h),
          selected: u(i),
          draggable: u(p),
          connectable: u(P),
          selectable: u(k),
          nopan: u(p),
          parent: u(z)
        },
        [nn]: {
          "z-index": u(Y),
          transform: `translate(${u(j) ?? ""}px, ${u(I) ?? ""}px)`,
          visibility: u(C) ? "visible" : "hidden"
        }
      }));
      var Ie = ie(we);
      Qs(Ie, () => u(Z), (_e, Le) => {
        Le(_e, {
          get data() {
            return u(r);
          },
          get id() {
            return x;
          },
          get selected() {
            return u(i);
          },
          get selectable() {
            return u(k);
          },
          get deletable() {
            return u(a);
          },
          get sourcePosition() {
            return u(w);
          },
          get targetPosition() {
            return u(S);
          },
          get zIndex() {
            return u(Y);
          },
          get dragging() {
            return u(h);
          },
          get draggable() {
            return u(p);
          },
          get dragHandle() {
            return u(L);
          },
          get parentId() {
            return u(_);
          },
          get type() {
            return u(m);
          },
          get isConnectable() {
            return u(P);
          },
          get positionAbsoluteX() {
            return u(j);
          },
          get positionAbsoluteY() {
            return u(I);
          },
          get width() {
            return u(F);
          },
          get height() {
            return u(B);
          }
        });
      }), Ze(we, (_e, Le) => er == null ? void 0 : er(_e, Le), () => ({
        nodeId: x,
        isSelectable: u(k),
        disabled: !u(p),
        handleSelector: u(L),
        noDragClass: n().noDragClass,
        nodeClickDistance: t.nodeClickDistance,
        onNodeMouseDown: n().handleNodeSelection,
        onDrag: (_e, Le, pt, mt) => {
          var Xe;
          (Xe = t.onnodedrag) == null || Xe.call(t, { event: _e, targetNode: pt, nodes: mt });
        },
        onDragStart: (_e, Le, pt, mt) => {
          var Xe;
          (Xe = t.onnodedragstart) == null || Xe.call(t, { event: _e, targetNode: pt, nodes: mt });
        },
        onDragStop: (_e, Le, pt, mt) => {
          var Xe;
          (Xe = t.onnodedragstop) == null || Xe.call(t, { event: _e, targetNode: pt, nodes: mt });
        },
        store: n()
      })), wi(we, (_e) => q(X, _e), () => u(X)), te(ce, we);
    };
    ze(Se, (ce) => {
      u(f) || ce(Pe);
    });
  }
  te(e, be), ve();
}
var sp = /* @__PURE__ */ de('<div class="svelte-flow__nodes"></div>');
function ap(e, t) {
  ge(t, !0);
  let n = ee(t, "store", 15);
  const r = typeof ResizeObserver > "u" ? null : new ResizeObserver((o) => {
    const s = /* @__PURE__ */ new Map();
    o.forEach((a) => {
      const l = a.target.getAttribute("data-id");
      s.set(l, { id: l, nodeElement: a.target, force: !0 });
    }), n().updateNodeInternals(s);
  });
  Js(() => {
    r == null || r.disconnect();
  });
  var i = sp();
  Kt(i, 21, () => n().visible.nodes.values(), (o) => o.id, (o, s) => {
    op(o, {
      get node() {
        return u(s);
      },
      get resizeObserver() {
        return r;
      },
      get nodeClickDistance() {
        return t.nodeClickDistance;
      },
      get onnodeclick() {
        return t.onnodeclick;
      },
      get onnodepointerenter() {
        return t.onnodepointerenter;
      },
      get onnodepointermove() {
        return t.onnodepointermove;
      },
      get onnodepointerleave() {
        return t.onnodepointerleave;
      },
      get onnodedrag() {
        return t.onnodedrag;
      },
      get onnodedragstart() {
        return t.onnodedragstart;
      },
      get onnodedragstop() {
        return t.onnodedragstop;
      },
      get onnodecontextmenu() {
        return t.onnodecontextmenu;
      },
      get store() {
        return n();
      },
      set store(a) {
        n(a);
      }
    });
  }), te(e, i), ve();
}
var lp = /* @__PURE__ */ Vt('<svg class="svelte-flow__edge-wrapper"><g><!></g></svg>');
function cp(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => t.edge.id), r = /* @__PURE__ */ b(() => t.edge.source), i = /* @__PURE__ */ b(() => t.edge.target), o = /* @__PURE__ */ b(() => t.edge.sourceX), s = /* @__PURE__ */ b(() => t.edge.sourceY), a = /* @__PURE__ */ b(() => t.edge.targetX), l = /* @__PURE__ */ b(() => t.edge.targetY), c = /* @__PURE__ */ b(() => t.edge.sourcePosition), f = /* @__PURE__ */ b(() => t.edge.targetPosition), h = /* @__PURE__ */ b(() => Ye(t.edge.animated, !1)), d = /* @__PURE__ */ b(() => Ye(t.edge.selected, !1)), v = /* @__PURE__ */ b(() => t.edge.label), m = /* @__PURE__ */ b(() => t.edge.labelStyle), _ = /* @__PURE__ */ b(() => Ye(t.edge.data, () => ({}), !0)), w = /* @__PURE__ */ b(() => t.edge.style), S = /* @__PURE__ */ b(() => t.edge.interactionWidth), N = /* @__PURE__ */ b(() => Ye(t.edge.type, "default")), M = /* @__PURE__ */ b(() => t.edge.sourceHandle), E = /* @__PURE__ */ b(() => t.edge.targetHandle), R = /* @__PURE__ */ b(() => t.edge.markerStart), F = /* @__PURE__ */ b(() => t.edge.markerEnd), B = /* @__PURE__ */ b(() => t.edge.selectable), L = /* @__PURE__ */ b(() => t.edge.focusable), Y = /* @__PURE__ */ b(() => Ye(t.edge.deletable, !0)), j = /* @__PURE__ */ b(() => t.edge.hidden), I = /* @__PURE__ */ b(() => t.edge.zIndex), g = /* @__PURE__ */ b(() => t.edge.class), x = /* @__PURE__ */ b(() => t.edge.ariaLabel);
  k0(u(n));
  let p = null, k = /* @__PURE__ */ b(() => u(B) ?? t.store.elementsSelectable), P = /* @__PURE__ */ b(() => u(L) ?? t.store.edgesFocusable), C = /* @__PURE__ */ b(() => t.store.edgeTypes[u(N)] ?? Nu), T = /* @__PURE__ */ b(() => u(R) ? `url('#${Ns(u(R), t.store.flowId)}')` : void 0), O = /* @__PURE__ */ b(() => u(F) ? `url('#${Ns(u(F), t.store.flowId)}')` : void 0);
  function H(W) {
    var Z;
    const G = t.store.edgeLookup.get(u(n));
    G && (u(k) && t.store.handleEdgeSelection(u(n)), (Z = t.onedgeclick) == null || Z.call(t, { event: W, edge: G }));
  }
  function D(W, G) {
    const Z = t.store.edgeLookup.get(u(n));
    Z && G({ event: W, edge: Z });
  }
  function z(W) {
    if (!t.store.disableKeyboardA11y && au.includes(W.key) && u(k)) {
      const { unselectNodesAndEdges: G, addSelectedEdges: Z } = t.store;
      W.key === "Escape" ? (p == null || p.blur(), G({ edges: [t.edge] })) : Z([u(n)]);
    }
  }
  var X = On(), V = Oe(X);
  {
    var Q = (W) => {
      var G = lp();
      let Z;
      var $ = ie(G);
      Bn($, () => ({
        class: ["svelte-flow__edge", u(g)],
        "data-id": u(n),
        onclick: H,
        oncontextmenu: t.onedgecontextmenu ? (J) => {
          D(J, t.onedgecontextmenu);
        } : void 0,
        onpointerenter: t.onedgepointerenter ? (J) => {
          D(J, t.onedgepointerenter);
        } : void 0,
        onpointerleave: t.onedgepointerleave ? (J) => {
          D(J, t.onedgepointerleave);
        } : void 0,
        "aria-label": u(x) === null ? void 0 : u(x) ? u(x) : `Edge from ${u(r)} to ${u(i)}`,
        "aria-describedby": u(P) ? `${Du}-${t.store.flowId}` : void 0,
        role: t.edge.ariaRole ?? (u(P) ? "group" : "img"),
        "aria-roledescription": "edge",
        onkeydown: u(P) ? z : void 0,
        tabindex: u(P) ? 0 : void 0,
        ...t.edge.domAttributes,
        [tn]: {
          animated: u(h),
          selected: u(d),
          selectable: u(k)
        }
      }));
      var oe = ie($);
      Qs(oe, () => u(C), (J, le) => {
        le(J, {
          get id() {
            return u(n);
          },
          get source() {
            return u(r);
          },
          get target() {
            return u(i);
          },
          get sourceX() {
            return u(o);
          },
          get sourceY() {
            return u(s);
          },
          get targetX() {
            return u(a);
          },
          get targetY() {
            return u(l);
          },
          get sourcePosition() {
            return u(c);
          },
          get targetPosition() {
            return u(f);
          },
          get animated() {
            return u(h);
          },
          get selected() {
            return u(d);
          },
          get label() {
            return u(v);
          },
          get labelStyle() {
            return u(m);
          },
          get data() {
            return u(_);
          },
          get style() {
            return u(w);
          },
          get interactionWidth() {
            return u(S);
          },
          get selectable() {
            return u(k);
          },
          get deletable() {
            return u(Y);
          },
          get type() {
            return u(N);
          },
          get sourceHandleId() {
            return u(M);
          },
          get targetHandleId() {
            return u(E);
          },
          get markerStart() {
            return u(T);
          },
          get markerEnd() {
            return u(O);
          }
        });
      }), wi($, (J) => p = J, () => p), me(() => Z = Be(G, "", Z, { "z-index": u(I) })), te(W, G);
    };
    ze(V, (W) => {
      u(j) || W(Q);
    });
  }
  te(e, X), ve();
}
xf();
var up = /* @__PURE__ */ Vt("<defs></defs>");
function fp(e, t) {
  ge(t, !1);
  const n = Mi();
  Id();
  var r = up();
  Kt(r, 5, () => n.markers, (i) => i.id, (i, o) => {
    vp(i, Dd(() => u(o)));
  }), te(e, r), ve();
}
var dp = /* @__PURE__ */ Vt('<polyline class="arrow" fill="none" stroke-linecap="round" stroke-linejoin="round" points="-5,-4 0,0 -5,4"></polyline>'), hp = /* @__PURE__ */ Vt('<polyline class="arrowclosed" stroke-linecap="round" stroke-linejoin="round" points="-5,-4 0,0 -5,4 -5,-4"></polyline>'), gp = /* @__PURE__ */ Vt('<marker class="svelte-flow__arrowhead" viewBox="-10 -10 20 20" refX="0" refY="0"><!></marker>');
function vp(e, t) {
  ge(t, !0);
  let n = ee(t, "width", 3, 12.5), r = ee(t, "height", 3, 12.5), i = ee(t, "markerUnits", 3, "strokeWidth"), o = ee(t, "orient", 3, "auto-start-reverse"), s = ee(t, "color", 3, "none");
  var a = gp(), l = ie(a);
  {
    var c = (h) => {
      var d = dp();
      let v;
      me(() => {
        ke(d, "stroke-width", t.strokeWidth), v = Be(d, "", v, { stroke: s() });
      }), te(h, d);
    }, f = (h) => {
      var d = hp();
      let v;
      me(() => {
        ke(d, "stroke-width", t.strokeWidth), v = Be(d, "", v, { stroke: s(), fill: s() });
      }), te(h, d);
    };
    ze(l, (h) => {
      t.type === ii.Arrow ? h(c) : t.type === ii.ArrowClosed && h(f, 1);
    });
  }
  me(() => {
    ke(a, "id", t.id), ke(a, "markerWidth", `${n()}`), ke(a, "markerHeight", `${r()}`), ke(a, "markerUnits", i()), ke(a, "orient", o());
  }), te(e, a), ve();
}
var yp = /* @__PURE__ */ de('<div class="svelte-flow__edges"><svg class="svelte-flow__marker"><!></svg> <!></div>');
function pp(e, t) {
  ge(t, !0);
  let n = ee(t, "store", 15);
  var r = yp(), i = ie(r), o = ie(i);
  fp(o, {});
  var s = re(i, 2);
  Kt(s, 17, () => n().visible.edges.values(), (a) => a.id, (a, l) => {
    cp(a, {
      get edge() {
        return u(l);
      },
      get onedgeclick() {
        return t.onedgeclick;
      },
      get onedgecontextmenu() {
        return t.onedgecontextmenu;
      },
      get onedgepointerenter() {
        return t.onedgepointerenter;
      },
      get onedgepointerleave() {
        return t.onedgepointerleave;
      },
      get store() {
        return n();
      },
      set store(c) {
        n(c);
      }
    });
  }), te(e, r), ve();
}
var mp = /* @__PURE__ */ de('<div class="svelte-flow__selection svelte-1vr3gfi"></div>');
function zu(e, t) {
  ge(t, !0);
  let n = ee(t, "x", 3, 0), r = ee(t, "y", 3, 0), i = ee(t, "width", 3, 0), o = ee(t, "height", 3, 0), s = ee(t, "isVisible", 3, !0);
  var a = On(), l = Oe(a);
  {
    var c = (f) => {
      var h = mp();
      let d;
      me((v) => d = Be(h, "", d, v), [
        () => ({
          width: typeof i() == "string" ? i() : Ht(i()),
          height: typeof o() == "string" ? o() : Ht(o()),
          transform: `translate(${n()}px, ${r()}px)`
        })
      ]), te(f, h);
    };
    ze(l, (f) => {
      s() && f(c);
    });
  }
  te(e, a), ve();
}
var _p = /* @__PURE__ */ de("<div><!></div>");
function wp(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ ue(void 0);
  ht(() => {
    var h;
    t.store.disableKeyboardA11y || (h = u(n)) == null || h.focus({ preventScroll: !0 });
  });
  let r = /* @__PURE__ */ b(() => {
    if (t.store.selectionRectMode === "nodes") {
      t.store.nodes;
      const h = Co(t.store.nodeLookup, { filter: (d) => !!d.selected });
      if (h.width > 0 && h.height > 0)
        return h;
    }
    return null;
  });
  function i(h) {
    var v;
    const d = t.store.nodes.filter((m) => m.selected);
    (v = t.onselectioncontextmenu) == null || v.call(t, { nodes: d, event: h });
  }
  function o(h) {
    var v;
    const d = t.store.nodes.filter((m) => m.selected);
    (v = t.onselectionclick) == null || v.call(t, { nodes: d, event: h });
  }
  function s(h) {
    Object.prototype.hasOwnProperty.call(co, h.key) && (h.preventDefault(), t.store.moveSelectedNodes(co[h.key], h.shiftKey ? 4 : 1));
  }
  var a = On(), l = Oe(a);
  {
    var c = (h) => {
      var d = _p();
      let v;
      var m = ie(d);
      zu(m, { width: "100%", height: "100%", x: 0, y: 0 }), Ze(d, (_, w) => er == null ? void 0 : er(_, w), () => ({
        disabled: !1,
        store: t.store,
        onDrag: (_, w, S, N) => {
          var M;
          (M = t.onnodedrag) == null || M.call(t, { event: _, targetNode: null, nodes: N });
        },
        onDragStart: (_, w, S, N) => {
          var M;
          (M = t.onnodedragstart) == null || M.call(t, { event: _, targetNode: null, nodes: N });
        },
        onDragStop: (_, w, S, N) => {
          var M;
          (M = t.onnodedragstop) == null || M.call(t, { event: _, targetNode: null, nodes: N });
        }
      })), wi(d, (_) => q(n, _), () => u(n)), me(
        (_) => {
          Yn(d, 1, bo(["svelte-flow__selection-wrapper", t.store.noPanClass]), "svelte-sf2y5e"), ke(d, "role", t.store.disableKeyboardA11y ? void 0 : "button"), ke(d, "tabindex", t.store.disableKeyboardA11y ? void 0 : -1), v = Be(d, "", v, _);
        },
        [
          () => ({
            width: Ht(u(r).width),
            height: Ht(u(r).height),
            transform: `translate(${u(r).x ?? ""}px, ${u(r).y ?? ""}px)`
          })
        ]
      ), rt("contextmenu", d, i), rt("click", d, o), rt("keydown", d, function(..._) {
        var w;
        (w = t.store.disableKeyboardA11y ? void 0 : s) == null || w.apply(this, _);
      }), te(h, d);
    }, f = /* @__PURE__ */ b(() => t.store.selectionRectMode === "nodes" && u(r) && Ut(u(r).x) && Ut(u(r).y));
    ze(l, (h) => {
      u(f) && h(c);
    });
  }
  te(e, a), ve();
}
xo(["contextmenu", "click", "keydown"]);
function xp(e) {
  switch (e) {
    case "ctrl":
      return 8;
    case "shift":
      return 4;
    case "alt":
      return 2;
    case "meta":
      return 1;
  }
}
function pe(e, t) {
  let { enabled: n = !0, trigger: r, type: i = "keydown" } = t;
  function o(a) {
    var f;
    const l = Array.isArray(r) ? r : [r], c = [a.metaKey, a.altKey, a.shiftKey, a.ctrlKey].reduce(
      (h, d, v) => d ? h | 1 << v : h,
      0
    );
    for (const h of l) {
      const d = {
        preventDefault: !1,
        enabled: !0,
        ...h
      }, { modifier: v, key: m, callback: _, preventDefault: w, enabled: S } = d;
      if (S) {
        if (a.key !== m) continue;
        if (v === null || v === !1) {
          if (c !== 0) continue;
        } else if (v !== void 0 && ((f = v == null ? void 0 : v[0]) == null ? void 0 : f.length) > 0) {
          const M = Array.isArray(v) ? v : [v];
          let E = !1;
          for (const R of M)
            if ((Array.isArray(R) ? R : [R]).reduce(
              (B, L) => B | xp(L),
              0
            ) === c) {
              E = !0;
              break;
            }
          if (!E) continue;
        }
        w && a.preventDefault();
        const N = {
          node: e,
          trigger: d,
          originalEvent: a
        };
        e.dispatchEvent(new CustomEvent("shortcut", { detail: N })), _ == null || _(N);
      }
    }
  }
  let s;
  return n && (s = gs(e, i, o)), {
    update: (a) => {
      const { enabled: l = !0, type: c = "keydown" } = a;
      n && (!l || i !== c) ? s == null || s() : !n && l && (s = gs(e, c, o)), n = l, i = c, r = a.trigger;
    },
    destroy: () => {
      s == null || s();
    }
  };
}
function To() {
  const e = /* @__PURE__ */ b(Mi), t = (o) => {
    var c, f;
    const s = hl(o) ? o : u(e).nodeLookup.get(o.id), a = s.parentId ? Ty(s.position, s.measured, s.parentId, u(e).nodeLookup, u(e).nodeOrigin) : s.position, l = {
      ...s,
      position: a,
      width: ((c = s.measured) == null ? void 0 : c.width) ?? s.width,
      height: ((f = s.measured) == null ? void 0 : f.height) ?? s.height
    };
    return _r(l);
  };
  function n(o, s, a = { replace: !1 }) {
    u(e).nodes = Qe(() => u(e).nodes).map((l) => {
      if (l.id === o) {
        const c = typeof s == "function" ? s(l) : s;
        return a != null && a.replace && hl(c) ? c : { ...l, ...c };
      }
      return l;
    });
  }
  function r(o, s, a = { replace: !1 }) {
    u(e).edges = Qe(() => u(e).edges).map((l) => {
      if (l.id === o) {
        const c = typeof s == "function" ? s(l) : s;
        return a.replace && O0(c) ? c : { ...l, ...c };
      }
      return l;
    });
  }
  const i = (o) => u(e).nodeLookup.get(o);
  return {
    zoomIn: u(e).zoomIn,
    zoomOut: u(e).zoomOut,
    getInternalNode: i,
    getNode: (o) => {
      var s;
      return (s = i(o)) == null ? void 0 : s.internals.userNode;
    },
    getNodes: (o) => o === void 0 ? u(e).nodes : _l(u(e).nodeLookup, o),
    getEdge: (o) => u(e).edgeLookup.get(o),
    getEdges: (o) => o === void 0 ? u(e).edges : _l(u(e).edgeLookup, o),
    setZoom: (o, s) => {
      const a = u(e).panZoom;
      return a ? a.scaleTo(o, s) : Promise.resolve(!1);
    },
    getZoom: () => u(e).viewport.zoom,
    setViewport: async (o, s) => {
      const a = u(e).viewport;
      return u(e).panZoom ? (await u(e).panZoom.setViewport(
        {
          x: o.x ?? a.x,
          y: o.y ?? a.y,
          zoom: o.zoom ?? a.zoom
        },
        s
      ), Promise.resolve(!0)) : Promise.resolve(!1);
    },
    getViewport: () => Vl(u(e).viewport),
    setCenter: async (o, s, a) => u(e).setCenter(o, s, a),
    fitView: (o) => u(e).fitView(o),
    fitBounds: async (o, s) => {
      if (!u(e).panZoom)
        return Promise.resolve(!1);
      const a = la(o, u(e).width, u(e).height, u(e).minZoom, u(e).maxZoom, (s == null ? void 0 : s.padding) ?? 0.1);
      return await u(e).panZoom.setViewport(a, {
        duration: s == null ? void 0 : s.duration,
        ease: s == null ? void 0 : s.ease,
        interpolate: s == null ? void 0 : s.interpolate
      }), Promise.resolve(!0);
    },
    /**
     * Partial is defined as "the 2 nodes/areas are intersecting partially".
     * If a is contained in b or b is contained in a, they are both
     * considered fully intersecting.
     */
    getIntersectingNodes: (o, s = !0, a) => {
      const l = tl(o), c = l ? o : t(o);
      return c ? (a || u(e).nodes).filter((f) => {
        const h = u(e).nodeLookup.get(f.id);
        if (!h || !l && f.id === o.id)
          return !1;
        const d = _r(h), v = oi(d, c);
        return s && v > 0 || v >= d.width * d.height || v >= c.width * c.height;
      }) : [];
    },
    isNodeIntersecting: (o, s, a = !0) => {
      const c = tl(o) ? o : t(o);
      if (!c)
        return !1;
      const f = oi(c, s);
      return a && f > 0 || f >= s.width * s.height || f >= c.width * c.height;
    },
    deleteElements: async ({ nodes: o = [], edges: s = [] }) => {
      var c, f;
      const { nodes: a, edges: l } = await My({
        nodesToRemove: o,
        edgesToRemove: s,
        nodes: u(e).nodes,
        edges: u(e).edges,
        onBeforeDelete: u(e).onbeforedelete
      });
      return a && (u(e).nodes = Qe(() => u(e).nodes).filter((h) => !a.some(({ id: d }) => d === h.id))), l && (u(e).edges = Qe(() => u(e).edges).filter((h) => !l.some(({ id: d }) => d === h.id))), (a.length > 0 || l.length > 0) && ((f = (c = u(e)).ondelete) == null || f.call(c, { nodes: a, edges: l })), { deletedNodes: a, deletedEdges: l };
    },
    screenToFlowPosition: (o, s = { snapToGrid: !0 }) => {
      if (!u(e).domNode)
        return o;
      const a = s.snapToGrid ? u(e).snapGrid : !1, { x: l, y: c, zoom: f } = u(e).viewport, { x: h, y: d } = u(e).domNode.getBoundingClientRect(), v = { x: o.x - h, y: o.y - d };
      return Pi(v, [l, c, f], a !== null, a || [1, 1]);
    },
    /**
     *
     * @param position
     * @returns
     */
    flowToScreenPosition: (o) => {
      if (!u(e).domNode)
        return o;
      const { x: s, y: a, zoom: l } = u(e).viewport, { x: c, y: f } = u(e).domNode.getBoundingClientRect(), h = ao(o, [s, a, l]);
      return { x: h.x + c, y: h.y + f };
    },
    toObject: () => structuredClone({
      nodes: [...u(e).nodes],
      edges: [...u(e).edges],
      viewport: { ...u(e).viewport }
    }),
    updateNode: n,
    updateNodeData: (o, s, a) => {
      var f;
      const l = (f = u(e).nodeLookup.get(o)) == null ? void 0 : f.internals.userNode;
      if (!l)
        return;
      const c = typeof s == "function" ? s(l) : s;
      n(o, (h) => ({
        ...h,
        data: a != null && a.replace ? c : { ...h.data, ...c }
      }));
    },
    updateEdge: r,
    getNodesBounds: (o) => Ey(o, {
      nodeLookup: u(e).nodeLookup,
      nodeOrigin: u(e).nodeOrigin
    }),
    getHandleConnections: ({ type: o, id: s, nodeId: a }) => {
      var l;
      return Array.from(((l = u(e).connectionLookup.get(`${a}-${o}-${s ?? null}`)) == null ? void 0 : l.values()) ?? []);
    }
  };
}
function _l(e, t) {
  var r;
  const n = [];
  for (const i of t) {
    const o = e.get(i);
    if (o) {
      const s = "internals" in o ? (r = o.internals) == null ? void 0 : r.userNode : o;
      n.push(s);
    }
  }
  return n;
}
function bp(e, t) {
  ge(t, !0);
  let n = ee(t, "store", 15), r = ee(t, "selectionKey", 3, "Shift"), i = ee(t, "multiSelectionKey", 19, () => lo() ? "Meta" : "Control"), o = ee(t, "deleteKey", 3, "Backspace"), s = ee(t, "panActivationKey", 3, " "), a = ee(t, "zoomActivationKey", 19, () => lo() ? "Meta" : "Control"), { deleteElements: l } = To();
  function c(_) {
    return _ !== null && typeof _ == "object";
  }
  function f(_) {
    return c(_) ? _.modifier || [] : [];
  }
  function h(_) {
    return _ == null ? "" : c(_) ? _.key : _;
  }
  function d(_, w) {
    return (Array.isArray(_) ? _ : [_]).map((N) => {
      const M = h(N);
      return {
        key: M,
        modifier: f(N),
        enabled: M !== null,
        callback: w
      };
    });
  }
  function v() {
    n(n().selectionRect = null, !0), n(n().selectionKeyPressed = !1, !0), n(n().multiselectionKeyPressed = !1, !0), n(n().deleteKeyPressed = !1, !0), n(n().panActivationKeyPressed = !1, !0), n(n().zoomActivationKeyPressed = !1, !0);
  }
  function m() {
    const _ = n().nodes.filter((S) => S.selected), w = n().edges.filter((S) => S.selected);
    l({ nodes: _, edges: w });
  }
  Gi("blur", qe, v), Gi("contextmenu", qe, v), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(r(), () => n(n().selectionKeyPressed = !0, !0)),
    type: "keydown"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(r(), () => n(n().selectionKeyPressed = !1, !0)),
    type: "keyup"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(i(), () => {
      n(n().multiselectionKeyPressed = !0, !0);
    }),
    type: "keydown"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(i(), () => n(n().multiselectionKeyPressed = !1, !0)),
    type: "keyup"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(o(), (_) => {
      !(_.originalEvent.ctrlKey || _.originalEvent.metaKey || _.originalEvent.shiftKey) && !vu(_.originalEvent) && (n(n().deleteKeyPressed = !0, !0), m());
    }),
    type: "keydown"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(o(), () => n(n().deleteKeyPressed = !1, !0)),
    type: "keyup"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(s(), () => n(n().panActivationKeyPressed = !0, !0)),
    type: "keydown"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(s(), () => n(n().panActivationKeyPressed = !1, !0)),
    type: "keyup"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(a(), () => n(n().zoomActivationKeyPressed = !0, !0)),
    type: "keydown"
  })), Ze(qe, (_, w) => pe == null ? void 0 : pe(_, w), () => ({
    trigger: d(a(), () => n(n().zoomActivationKeyPressed = !1, !0)),
    type: "keyup"
  })), ve();
}
var Ep = /* @__PURE__ */ Vt('<path fill="none" class="svelte-flow__connection-path"></path>'), kp = /* @__PURE__ */ Vt('<svg class="svelte-flow__connectionline"><g><!></g></svg>');
function Sp(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => {
    if (!t.store.connection.inProgress)
      return "";
    const s = {
      sourceX: t.store.connection.from.x,
      sourceY: t.store.connection.from.y,
      sourcePosition: t.store.connection.fromPosition,
      targetX: t.store.connection.to.x,
      targetY: t.store.connection.to.y,
      targetPosition: t.store.connection.toPosition
    };
    switch (t.type) {
      case rn.Bezier: {
        const [a] = pu(s);
        return a;
      }
      case rn.Straight: {
        const [a] = xr(s);
        return a;
      }
      case rn.Step:
      case rn.SmoothStep: {
        const [a] = $n({
          ...s,
          borderRadius: t.type === rn.Step ? 0 : void 0
        });
        return a;
      }
    }
  });
  var r = On(), i = Oe(r);
  {
    var o = (s) => {
      var a = kp(), l = ie(a), c = ie(l);
      {
        var f = (d) => {
          var v = On(), m = Oe(v);
          Qs(m, () => t.LineComponent, (_, w) => {
            w(_, {});
          }), te(d, v);
        }, h = (d) => {
          var v = Ep();
          me(() => {
            ke(v, "d", u(n)), Be(v, t.style);
          }), te(d, v);
        };
        ze(c, (d) => {
          t.LineComponent ? d(f) : d(h, -1);
        });
      }
      me(
        (d) => {
          ke(a, "width", t.store.width), ke(a, "height", t.store.height), Be(a, t.containerStyle), Yn(l, 0, d);
        },
        [
          () => bo([
            "svelte-flow__connection",
            xy(t.store.connection.isValid)
          ])
        ]
      ), te(s, a);
    };
    ze(i, (s) => {
      t.store.connection.inProgress && s(o);
    });
  }
  te(e, r), ve();
}
var Pp = /* @__PURE__ */ de("<div><!></div>");
function Mp(e, t) {
  ge(t, !0);
  let n = ee(t, "position", 3, "top-right"), r = /* @__PURE__ */ xi(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "position",
    "style",
    "class",
    "children"
  ]), i = /* @__PURE__ */ b(() => `${n()}`.split("-"));
  var o = Pp();
  Bn(o, (a) => ({ class: a, style: t.style, ...r }), [
    () => [
      "svelte-flow__panel",
      t.class,
      ...u(i)
    ]
  ]);
  var s = ie(o);
  pn(s, () => t.children ?? br), te(e, o), ve();
}
var Cp = /* @__PURE__ */ de('<a href="https://svelteflow.dev" target="_blank" rel="noopener noreferrer" aria-label="Svelte Flow attribution">Svelte Flow</a>');
function Ap(e, t) {
  ge(t, !0);
  let n = ee(t, "position", 3, "bottom-right");
  var r = On(), i = Oe(r);
  {
    var o = (s) => {
      Mp(s, {
        get position() {
          return n();
        },
        class: "svelte-flow__attribution",
        "data-message": "Feel free to remove the attribution or check out how you could support us: https://svelteflow.dev/support-us",
        children: (a, l) => {
          var c = Cp();
          te(a, c);
        },
        $$slots: { default: !0 }
      });
    };
    ze(i, (s) => {
      var a;
      (a = t.proOptions) != null && a.hideAttribution || s(o);
    });
  }
  te(e, r), ve();
}
var Np = /* @__PURE__ */ de("<div><!></div>");
function Ip(e, t) {
  ge(t, !0);
  let n = ee(t, "domNode", 15), r = ee(t, "clientWidth", 15), i = ee(t, "clientHeight", 15), o = /* @__PURE__ */ b(() => t.rest.class), s = /* @__PURE__ */ b(() => Zu(t.rest, [
    "id",
    "class",
    "nodeTypes",
    "edgeTypes",
    "colorMode",
    "isValidConnection",
    "onmove",
    "onmovestart",
    "onmoveend",
    "onflowerror",
    "ondelete",
    "onbeforedelete",
    "onbeforeconnect",
    "onconnect",
    "onconnectstart",
    "onconnectend",
    "onbeforereconnect",
    "onreconnect",
    "onreconnectstart",
    "onreconnectend",
    "onclickconnectstart",
    "onclickconnectend",
    "oninit",
    "onselectionchange",
    "onselectiondragstart",
    "onselectiondrag",
    "onselectiondragstop",
    "onselectionstart",
    "onselectionend",
    "clickConnect",
    "fitView",
    "fitViewOptions",
    "nodeOrigin",
    "nodeDragThreshold",
    "connectionDragThreshold",
    "minZoom",
    "maxZoom",
    "initialViewport",
    "connectionRadius",
    "connectionMode",
    "selectionMode",
    "selectNodesOnDrag",
    "snapGrid",
    "defaultMarkerColor",
    "translateExtent",
    "nodeExtent",
    "onlyRenderVisibleElements",
    "autoPanOnConnect",
    "autoPanOnNodeDrag",
    "colorModeSSR",
    "defaultEdgeOptions",
    "elevateNodesOnSelect",
    "elevateEdgesOnSelect",
    "nodesDraggable",
    "autoPanOnNodeFocus",
    "nodesConnectable",
    "elementsSelectable",
    "nodesFocusable",
    "edgesFocusable",
    "disableKeyboardA11y",
    "noDragClass",
    "noPanClass",
    "noWheelClass",
    "ariaLabelConfig",
    "autoPanSpeed",
    "panOnScrollSpeed",
    "zIndexMode"
  ]));
  function a(f) {
    f.currentTarget.scrollTo({ top: 0, left: 0, behavior: "auto" }), t.rest.onscroll && t.rest.onscroll(f);
  }
  var l = Np();
  Bn(
    l,
    (f) => ({
      class: [
        "svelte-flow",
        "svelte-flow__container",
        u(o),
        t.colorMode
      ],
      "data-testid": "svelte-flow__wrapper",
      role: "application",
      onscroll: a,
      ...u(s),
      [nn]: f
    }),
    [
      () => ({
        width: Ht(t.width),
        height: Ht(t.height)
      })
    ],
    void 0,
    void 0,
    "svelte-mkap6j"
  );
  var c = ie(l);
  pn(c, () => t.children ?? br), wi(l, (f) => n(f), () => n()), Qi(l, "clientHeight", i), Qi(l, "clientWidth", r), te(e, l), ve();
}
var Tp = /* @__PURE__ */ de('<div class="svelte-flow__viewport-back svelte-flow__container"></div> <!> <div class="svelte-flow__edge-labels svelte-flow__container"></div> <!> <!> <!> <div class="svelte-flow__viewport-front svelte-flow__container"></div>', 1), Op = /* @__PURE__ */ de("<!> <!>", 1), Dp = /* @__PURE__ */ de("<!> <!> <!> <!> <!>", 1);
function zp(e, t) {
  ge(t, !0);
  let n = ee(t, "paneClickDistance", 3, 1), r = ee(t, "nodeClickDistance", 3, 1), i = ee(t, "panOnScrollMode", 19, () => Jn.Free), o = ee(t, "preventScrolling", 3, !0), s = ee(t, "zoomOnScroll", 3, !0), a = ee(t, "zoomOnDoubleClick", 3, !0), l = ee(t, "zoomOnPinch", 3, !0), c = ee(t, "panOnScroll", 3, !1), f = ee(t, "panOnScrollSpeed", 3, 0.5), h = ee(t, "panOnDrag", 3, !0), d = ee(t, "selectionOnDrag", 3, !1), v = ee(t, "connectionLineType", 19, () => rn.Bezier), m = ee(t, "nodes", 31, () => Ue([])), _ = ee(t, "edges", 31, () => Ue([])), w = ee(t, "viewport", 15, void 0), S = /* @__PURE__ */ xi(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "width",
    "height",
    "proOptions",
    "selectionKey",
    "deleteKey",
    "panActivationKey",
    "multiSelectionKey",
    "zoomActivationKey",
    "paneClickDistance",
    "nodeClickDistance",
    "onmovestart",
    "onmoveend",
    "onmove",
    "oninit",
    "onnodeclick",
    "onnodecontextmenu",
    "onnodedrag",
    "onnodedragstart",
    "onnodedragstop",
    "onnodepointerenter",
    "onnodepointermove",
    "onnodepointerleave",
    "onselectionclick",
    "onselectioncontextmenu",
    "onselectionstart",
    "onselectionend",
    "onedgeclick",
    "onedgecontextmenu",
    "onedgepointerenter",
    "onedgepointerleave",
    "onpaneclick",
    "onpanecontextmenu",
    "panOnScrollMode",
    "preventScrolling",
    "zoomOnScroll",
    "zoomOnDoubleClick",
    "zoomOnPinch",
    "panOnScroll",
    "panOnScrollSpeed",
    "panOnDrag",
    "selectionOnDrag",
    "connectionLineComponent",
    "connectionLineStyle",
    "connectionLineContainerStyle",
    "connectionLineType",
    "attributionPosition",
    "children",
    "nodes",
    "edges",
    "viewport"
  ]), N = Z0({
    props: S,
    width: t.width,
    height: t.height,
    get nodes() {
      return m();
    },
    set nodes(E) {
      m(E);
    },
    get edges() {
      return _();
    },
    set edges(E) {
      _(E);
    },
    get viewport() {
      return w();
    },
    set viewport(E) {
      w(E);
    }
  });
  const M = Hs(Is);
  M && M.setStore && M.setStore(N), Fl(Is, {
    provider: !1,
    getStore() {
      return N;
    }
  }), ht(() => {
    var R;
    const E = { nodes: N.selectedNodes, edges: N.selectedEdges };
    (R = Qe(() => t.onselectionchange)) == null || R(E);
    for (const F of N.selectionChangeHandlers.values())
      F(E);
  }), Js(() => {
    N.reset();
  }), Ip(e, {
    get colorMode() {
      return N.colorMode;
    },
    get width() {
      return t.width;
    },
    get height() {
      return t.height;
    },
    get rest() {
      return S;
    },
    get domNode() {
      return N.domNode;
    },
    set domNode(E) {
      N.domNode = E;
    },
    get clientWidth() {
      return N.width;
    },
    set clientWidth(E) {
      N.width = E;
    },
    get clientHeight() {
      return N.height;
    },
    set clientHeight(E) {
      N.height = E;
    },
    children: (E, R) => {
      var F = Dp(), B = Oe(F);
      bp(B, {
        get selectionKey() {
          return t.selectionKey;
        },
        get deleteKey() {
          return t.deleteKey;
        },
        get panActivationKey() {
          return t.panActivationKey;
        },
        get multiSelectionKey() {
          return t.multiSelectionKey;
        },
        get zoomActivationKey() {
          return t.zoomActivationKey;
        },
        get store() {
          return N;
        },
        set store(g) {
          N = g;
        }
      });
      var L = re(B, 2);
      G0(L, {
        get panOnScrollMode() {
          return i();
        },
        get preventScrolling() {
          return o();
        },
        get zoomOnScroll() {
          return s();
        },
        get zoomOnDoubleClick() {
          return a();
        },
        get zoomOnPinch() {
          return l();
        },
        get panOnScroll() {
          return c();
        },
        get panOnScrollSpeed() {
          return f();
        },
        get panOnDrag() {
          return h();
        },
        get paneClickDistance() {
          return n();
        },
        get selectionOnDrag() {
          return d();
        },
        get onmovestart() {
          return t.onmovestart;
        },
        get onmove() {
          return t.onmove;
        },
        get onmoveend() {
          return t.onmoveend;
        },
        get oninit() {
          return t.oninit;
        },
        get store() {
          return N;
        },
        set store(g) {
          N = g;
        },
        children: (g, x) => {
          Q0(g, {
            get onpaneclick() {
              return t.onpaneclick;
            },
            get onpanecontextmenu() {
              return t.onpanecontextmenu;
            },
            get onselectionstart() {
              return t.onselectionstart;
            },
            get onselectionend() {
              return t.onselectionend;
            },
            get panOnDrag() {
              return h();
            },
            get paneClickDistance() {
              return n();
            },
            get selectionOnDrag() {
              return d();
            },
            get store() {
              return N;
            },
            set store(p) {
              N = p;
            },
            children: (p, k) => {
              var P = Op(), C = Oe(P);
              $0(C, {
                get store() {
                  return N;
                },
                set store(O) {
                  N = O;
                },
                children: (O, H) => {
                  var D = Tp(), z = re(Oe(D), 2);
                  pp(z, {
                    get onedgeclick() {
                      return t.onedgeclick;
                    },
                    get onedgecontextmenu() {
                      return t.onedgecontextmenu;
                    },
                    get onedgepointerenter() {
                      return t.onedgepointerenter;
                    },
                    get onedgepointerleave() {
                      return t.onedgepointerleave;
                    },
                    get store() {
                      return N;
                    },
                    set store(W) {
                      N = W;
                    }
                  });
                  var X = re(z, 4);
                  Sp(X, {
                    get type() {
                      return v();
                    },
                    get LineComponent() {
                      return t.connectionLineComponent;
                    },
                    get containerStyle() {
                      return t.connectionLineContainerStyle;
                    },
                    get style() {
                      return t.connectionLineStyle;
                    },
                    get store() {
                      return N;
                    },
                    set store(W) {
                      N = W;
                    }
                  });
                  var V = re(X, 2);
                  ap(V, {
                    get nodeClickDistance() {
                      return r();
                    },
                    get onnodeclick() {
                      return t.onnodeclick;
                    },
                    get onnodecontextmenu() {
                      return t.onnodecontextmenu;
                    },
                    get onnodepointerenter() {
                      return t.onnodepointerenter;
                    },
                    get onnodepointermove() {
                      return t.onnodepointermove;
                    },
                    get onnodepointerleave() {
                      return t.onnodepointerleave;
                    },
                    get onnodedrag() {
                      return t.onnodedrag;
                    },
                    get onnodedragstart() {
                      return t.onnodedragstart;
                    },
                    get onnodedragstop() {
                      return t.onnodedragstop;
                    },
                    get store() {
                      return N;
                    },
                    set store(W) {
                      N = W;
                    }
                  });
                  var Q = re(V, 2);
                  wp(Q, {
                    get onselectionclick() {
                      return t.onselectionclick;
                    },
                    get onselectioncontextmenu() {
                      return t.onselectioncontextmenu;
                    },
                    get onnodedrag() {
                      return t.onnodedrag;
                    },
                    get onnodedragstart() {
                      return t.onnodedragstart;
                    },
                    get onnodedragstop() {
                      return t.onnodedragstop;
                    },
                    get store() {
                      return N;
                    },
                    set store(W) {
                      N = W;
                    }
                  }), te(O, D);
                },
                $$slots: { default: !0 }
              });
              var T = re(C, 2);
              {
                let O = /* @__PURE__ */ b(() => !!(N.selectionRect && N.selectionRectMode === "user")), H = /* @__PURE__ */ b(() => {
                  var V;
                  return (V = N.selectionRect) == null ? void 0 : V.width;
                }), D = /* @__PURE__ */ b(() => {
                  var V;
                  return (V = N.selectionRect) == null ? void 0 : V.height;
                }), z = /* @__PURE__ */ b(() => {
                  var V;
                  return (V = N.selectionRect) == null ? void 0 : V.x;
                }), X = /* @__PURE__ */ b(() => {
                  var V;
                  return (V = N.selectionRect) == null ? void 0 : V.y;
                });
                zu(T, {
                  get isVisible() {
                    return u(O);
                  },
                  get width() {
                    return u(H);
                  },
                  get height() {
                    return u(D);
                  },
                  get x() {
                    return u(z);
                  },
                  get y() {
                    return u(X);
                  }
                });
              }
              te(p, P);
            },
            $$slots: { default: !0 }
          });
        },
        $$slots: { default: !0 }
      });
      var Y = re(L, 2);
      Ap(Y, {
        get proOptions() {
          return t.proOptions;
        },
        get position() {
          return t.attributionPosition;
        }
      });
      var j = re(Y, 2);
      np(j, {
        get store() {
          return N;
        }
      });
      var I = re(j, 2);
      pn(I, () => t.children ?? br), te(E, F);
    },
    $$slots: { default: !0 }
  }), ve();
}
const Rp = { palette: { blue: "#4E79A7", orange: "#F28E2B", green: "#59A14F", red: "#E15759", teal: "#76B7B2", purple: "#B07AA1", pink: "#FF9DA7", brown: "#9C755F", yellow: "#EDC948", grey: "#BAB0AC" }, roles: { vgae: "blue", gat: "orange", dqn: "green", kd: "red", data: "teal", normal: "blue", attack: "red", attention: "purple" }, fills: { blue: "#DAE3EF", orange: "#FDE8D0", green: "#D7E8D3", red: "#F8D3D4", teal: "#D9EDEB", purple: "#E6D9E1" } }, { palette: $o, fills: Lp, roles: Hp } = Rp, wl = /* @__PURE__ */ new Set();
function fn(e) {
  if (!e) return { stroke: $o.grey, fill: $o.grey + "40" };
  const t = Hp[e] || e, n = $o[t];
  return n ? { stroke: n, fill: Lp[t] || n + "40" } : (!e.startsWith("#") && !e.startsWith("rgb") && !wl.has(e) && (console.warn(
    `[palette] unknown role/color '${e}' — passing through as raw CSS`
  ), wl.add(e)), { stroke: e, fill: e + "40" });
}
var Vp = /* @__PURE__ */ de('<span class="label svelte-121fxiq"> </span>'), Fp = /* @__PURE__ */ de('<!> <!> <div class="circle-node svelte-121fxiq"><!></div> <!> <!>', 1);
function Yp(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => t.data.r ?? 14), r = /* @__PURE__ */ b(() => u(n) * 2), i = /* @__PURE__ */ b(() => fn(t.data.color).stroke), o = /* @__PURE__ */ b(() => fn(t.data.color).fill);
  var s = Fp(), a = Oe(s);
  ut(a, {
    type: "target",
    get position() {
      return U.Left;
    }
  });
  var l = re(a, 2);
  ut(l, {
    type: "target",
    get position() {
      return U.Top;
    },
    id: "top"
  });
  var c = re(l, 2);
  let f;
  var h = ie(c);
  {
    var d = (_) => {
      var w = Vp(), S = ie(w);
      me(() => He(S, t.data.label)), te(_, w);
    };
    ze(h, (_) => {
      t.data.label && _(d);
    });
  }
  var v = re(c, 2);
  ut(v, {
    type: "source",
    get position() {
      return U.Right;
    }
  });
  var m = re(v, 2);
  ut(m, {
    type: "source",
    get position() {
      return U.Bottom;
    },
    id: "bottom"
  }), me(() => f = Be(c, "", f, {
    width: `${u(r) ?? ""}px`,
    height: `${u(r) ?? ""}px`,
    background: u(o),
    "border-color": u(i),
    "font-size": `${u(n) < 10 ? 4 : 6}px`
  })), te(e, s), ve();
}
function Ts(e) {
  var o, s;
  const t = ((o = e.measured) == null ? void 0 : o.width) ?? 0, n = ((s = e.measured) == null ? void 0 : s.height) ?? 0, r = e.internals.positionAbsolute.x + t / 2, i = e.internals.positionAbsolute.y + n / 2;
  return { cx: r, cy: i, w: t, h: n, isCircle: e.type === "circle" };
}
function Os(e, t) {
  const n = t.cx - e.cx, r = t.cy - e.cy, i = Math.hypot(n, r);
  if (i === 0 || e.w === 0 || e.h === 0)
    return { x: e.cx, y: e.cy };
  if (e.isCircle) {
    const f = Math.min(e.w, e.h) / 2;
    return { x: e.cx + n / i * f, y: e.cy + r / i * f };
  }
  const o = e.w / 2, s = e.h / 2, a = n === 0 ? 1 / 0 : o / Math.abs(n), l = r === 0 ? 1 / 0 : s / Math.abs(r), c = Math.min(a, l);
  return { x: e.cx + n * c, y: e.cy + r * c };
}
function xl(e, t) {
  if (e.isCircle) {
    const a = Math.atan2(t.y - e.cy, t.x - e.cx) * (180 / Math.PI);
    return a >= -45 && a < 45 ? U.Right : a >= 45 && a < 135 ? U.Bottom : a >= -135 && a < -45 ? U.Top : U.Left;
  }
  const n = Math.abs(t.x - (e.cx + e.w / 2)), r = Math.abs(t.x - (e.cx - e.w / 2)), i = Math.abs(t.y - (e.cy - e.h / 2)), o = Math.abs(t.y - (e.cy + e.h / 2)), s = Math.min(n, r, i, o);
  return s === n ? U.Right : s === r ? U.Left : s === i ? U.Top : U.Bottom;
}
function ga(e, t) {
  const n = Ts(e), r = Ts(t), i = Os(n, r), o = Os(r, n);
  return {
    sx: i.x,
    sy: i.y,
    tx: o.x,
    ty: o.y,
    sourcePos: xl(n, i),
    targetPos: xl(r, o)
  };
}
function Zn(e, t) {
  const n = Ts(e);
  return Os(n, {
    cx: t.x,
    cy: t.y
  });
}
function Bp(e, t = 8) {
  if (e.length < 2) return "";
  if (e.length === 2)
    return `M ${e[0].x} ${e[0].y} L ${e[1].x} ${e[1].y}`;
  let n = `M ${e[0].x} ${e[0].y}`;
  for (let r = 1; r < e.length - 1; r++) {
    const i = e[r - 1], o = e[r], s = e[r + 1], a = o.x - i.x, l = o.y - i.y, c = s.x - o.x, f = s.y - o.y, h = Math.hypot(a, l), d = Math.hypot(c, f);
    if (h === 0 || d === 0) continue;
    const v = Math.min(t, h / 2, d / 2), m = o.x - a / h * v, _ = o.y - l / h * v, w = o.x + c / d * v, S = o.y + f / d * v;
    n += ` L ${m} ${_} Q ${o.x} ${o.y} ${w} ${S}`;
  }
  return n += ` L ${e[e.length - 1].x} ${e[e.length - 1].y}`, n;
}
function Kp(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => {
    var l;
    return fn(((l = t.data) == null ? void 0 : l.color) ?? "attention").stroke;
  }), r = /* @__PURE__ */ b(() => {
    var l;
    return ((l = t.data) == null ? void 0 : l.weight) ?? 0.5;
  }), i = /* @__PURE__ */ b(() => 0.5 + u(r) * 4), o = /* @__PURE__ */ b(() => 0.3 + u(r) * 0.7);
  const { getInternalNode: s } = To();
  let a = /* @__PURE__ */ b(() => {
    var f, h;
    const l = s(t.source), c = s(t.target);
    if ((f = l == null ? void 0 : l.measured) != null && f.width && ((h = c == null ? void 0 : c.measured) != null && h.width)) {
      const d = ga(l, c);
      return xr({ sourceX: d.sx, sourceY: d.sy, targetX: d.tx, targetY: d.ty })[0];
    }
    return xr({
      sourceX: t.sourceX,
      sourceY: t.sourceY,
      targetX: t.targetX,
      targetY: t.targetY
    })[0];
  });
  Xn(e, {
    get id() {
      return t.id;
    },
    get path() {
      return u(a);
    },
    get style() {
      return `stroke: ${u(n) ?? ""}; stroke-width: ${u(i) ?? ""}px; stroke-opacity: ${u(o) ?? ""};`;
    }
  }), ve();
}
var Xp = /* @__PURE__ */ de("<div> </div>"), qp = /* @__PURE__ */ de("<!> <!>", 1);
function Wp(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => {
    var M;
    return fn((M = t.data) == null ? void 0 : M.color).stroke;
  }), r = /* @__PURE__ */ b(() => {
    var M;
    return ((M = t.data) == null ? void 0 : M.strokeWidth) ?? 1;
  }), i = /* @__PURE__ */ b(() => {
    var M, E;
    return ((M = t.data) == null ? void 0 : M.dashArray) ?? ((E = t.data) != null && E.dashed ? "4 3" : "none");
  }), o = /* @__PURE__ */ b(() => {
    var M;
    return (M = t.data) != null && M.labelOnStroke ? u(n) : "#666";
  }), s = /* @__PURE__ */ b(() => {
    var M;
    return ((M = t.data) == null ? void 0 : M.labelOffsetX) ?? 0;
  }), a = /* @__PURE__ */ b(() => {
    var M;
    return ((M = t.data) == null ? void 0 : M.boldLabel) ?? !1;
  }), l = /* @__PURE__ */ b(() => {
    var M;
    return ((M = t.data) == null ? void 0 : M.labelLeftAlign) ?? !1;
  });
  const { getInternalNode: c } = To();
  let f = /* @__PURE__ */ b(() => {
    var g, x, p, k, P, C, T, O, H, D;
    const M = (g = t.data) == null ? void 0 : g.sourceAnchor, E = (x = t.data) == null ? void 0 : x.targetAnchor;
    if ((p = t.data) != null && p.straight) {
      const z = c(t.source), X = c(t.target), V = M ?? ((k = z == null ? void 0 : z.measured) != null && k.width ? Zn(z, E ?? (X ? {
        x: X.internals.positionAbsolute.x,
        y: X.internals.positionAbsolute.y
      } : { x: t.targetX, y: t.targetY })) : { x: t.sourceX, y: t.sourceY }), Q = E ?? ((P = X == null ? void 0 : X.measured) != null && P.width ? Zn(X, M ?? V) : { x: t.targetX, y: t.targetY }), W = (V.x + Q.x) / 2, G = (V.y + Q.y) / 2;
      return {
        path: `M ${V.x} ${V.y} L ${Q.x} ${Q.y}`,
        labelX: W,
        labelY: G
      };
    }
    if (M || E) {
      const z = c(t.source), X = c(t.target), V = M ?? ((C = z == null ? void 0 : z.measured) != null && C.width ? Zn(z, E) : { x: t.sourceX, y: t.sourceY }), Q = E ?? ((T = X == null ? void 0 : X.measured) != null && T.width ? Zn(X, M) : { x: t.targetX, y: t.targetY }), W = Q.x - V.x, G = Q.y - V.y, Z = Math.abs(W) >= Math.abs(G) ? W >= 0 ? U.Right : U.Left : G >= 0 ? U.Bottom : U.Top, $ = Z === U.Right ? U.Left : Z === U.Left ? U.Right : Z === U.Bottom ? U.Top : U.Bottom, [oe, J, le] = $n({
        sourceX: V.x,
        sourceY: V.y,
        sourcePosition: Z,
        targetX: Q.x,
        targetY: Q.y,
        targetPosition: $
      });
      return { path: oe, labelX: J, labelY: le };
    }
    const R = c(t.source), F = c(t.target);
    if (!((O = R == null ? void 0 : R.measured) != null && O.width) || !((H = F == null ? void 0 : F.measured) != null && H.width)) return null;
    const B = (D = t.data) == null ? void 0 : D.bendPoints;
    if (B && B.length > 0) {
      const z = Zn(R, B[0]), X = Zn(F, B[B.length - 1]), V = [z, ...B, X], Q = V[Math.floor(V.length / 2)];
      return {
        path: Bp(V, 6),
        labelX: Q.x,
        labelY: Q.y
      };
    }
    const L = ga(R, F), [Y, j, I] = $n({
      sourceX: L.sx,
      sourceY: L.sy,
      sourcePosition: L.sourcePos,
      targetX: L.tx,
      targetY: L.ty,
      targetPosition: L.targetPos
    });
    return { path: Y, labelX: j, labelY: I };
  }), h = /* @__PURE__ */ b(() => {
    const [M, E, R] = $n({
      sourceX: t.sourceX,
      sourceY: t.sourceY,
      sourcePosition: t.sourcePosition,
      targetX: t.targetX,
      targetY: t.targetY,
      targetPosition: t.targetPosition
    });
    return { path: M, labelX: E, labelY: R };
  }), d = /* @__PURE__ */ b(() => (u(f) ?? u(h)).path), v = /* @__PURE__ */ b(() => (u(f) ?? u(h)).labelX), m = /* @__PURE__ */ b(() => (u(f) ?? u(h)).labelY);
  var _ = qp(), w = Oe(_);
  {
    let M = /* @__PURE__ */ b(() => {
      var E;
      return (E = t.data) != null && E.straight ? void 0 : t.markerEnd;
    });
    Xn(w, {
      get id() {
        return t.id;
      },
      get path() {
        return u(d);
      },
      get markerEnd() {
        return u(M);
      },
      get style() {
        return `stroke: ${u(n) ?? ""}; stroke-width: ${u(r) ?? ""}px; stroke-dasharray: ${u(i) ?? ""};`;
      }
    });
  }
  var S = re(w, 2);
  {
    var N = (M) => {
      {
        let E = /* @__PURE__ */ b(() => u(v) + u(s));
        Au(M, {
          get x() {
            return u(E);
          },
          get y() {
            return u(m);
          },
          children: (R, F) => {
            var B = Xp();
            let L, Y;
            var j = ie(B);
            me(() => {
              L = Yn(B, 1, "flow-label svelte-c29w3y", null, L, { bold: u(a), "left-align": u(l) }), Y = Be(B, "", Y, { color: u(o) }), He(j, t.data.label);
            }), te(R, B);
          },
          $$slots: { default: !0 }
        });
      }
    };
    ze(S, (M) => {
      var E;
      (E = t.data) != null && E.label && M(N);
    });
  }
  te(e, _), ve();
}
function Zp(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ b(() => {
    var l;
    return fn((l = t.data) == null ? void 0 : l.color).stroke;
  }), r = /* @__PURE__ */ b(() => {
    var l;
    return ((l = t.data) == null ? void 0 : l.highlighted) ?? !1;
  }), i = /* @__PURE__ */ b(() => u(r) ? 0.85 : 0.4), o = /* @__PURE__ */ b(() => u(r) ? 2 : 1);
  const { getInternalNode: s } = To();
  let a = /* @__PURE__ */ b(() => {
    var f, h;
    const l = s(t.source), c = s(t.target);
    if ((f = l == null ? void 0 : l.measured) != null && f.width && ((h = c == null ? void 0 : c.measured) != null && h.width)) {
      const d = ga(l, c);
      return xr({ sourceX: d.sx, sourceY: d.sy, targetX: d.tx, targetY: d.ty })[0];
    }
    return xr({
      sourceX: t.sourceX,
      sourceY: t.sourceY,
      targetX: t.targetX,
      targetY: t.targetY
    })[0];
  });
  Xn(e, {
    get id() {
      return t.id;
    },
    get path() {
      return u(a);
    },
    get style() {
      return `stroke: ${u(n) ?? ""}; stroke-opacity: ${u(i) ?? ""}; stroke-width: ${u(o) ?? ""}px;`;
    }
  }), ve();
}
var jp = /* @__PURE__ */ Vt('<svg class="shape-svg svelte-5co9n9" xmlns="http://www.w3.org/2000/svg"><polygon stroke-width="1"></polygon></svg>'), Gp = /* @__PURE__ */ de('<span class="label svelte-5co9n9"> </span>'), Up = /* @__PURE__ */ de("<!> <!> <!> <!> <div><!> <!></div>", 1);
function Qp(e, t) {
  ge(t, !0);
  let n = /* @__PURE__ */ ue(0), r = /* @__PURE__ */ ue(0);
  const i = /* @__PURE__ */ b(() => t.data.shape), o = /* @__PURE__ */ b(() => t.data.line ?? "dashed"), s = /* @__PURE__ */ b(() => t.data.padding), a = /* @__PURE__ */ b(() => u(i) === "trapezoid-r" || u(i) === "trapezoid-l"), l = /* @__PURE__ */ b(() => u(i) === "rectangle" ? "0" : "10px"), c = 0.05;
  var f = Up(), h = Oe(f);
  ut(h, {
    type: "target",
    get position() {
      return U.Left;
    }
  });
  var d = re(h, 2);
  ut(d, {
    type: "target",
    get position() {
      return U.Top;
    },
    id: "top"
  });
  var v = re(d, 2);
  ut(v, {
    type: "source",
    get position() {
      return U.Right;
    }
  });
  var m = re(v, 2);
  ut(m, {
    type: "source",
    get position() {
      return U.Bottom;
    },
    id: "bottom"
  });
  var _ = re(m, 2);
  let w, S;
  var N = ie(_);
  {
    var M = (F) => {
      const B = /* @__PURE__ */ b(() => u(r) * c), L = /* @__PURE__ */ b(() => u(r) + 2 * u(B)), Y = /* @__PURE__ */ b(() => u(i) === "trapezoid-r" ? `0,0 ${u(n)},${u(B)} ${u(n)},${u(r) + u(B)} 0,${u(L)}` : `0,${u(B)} ${u(n)},0 ${u(n)},${u(L)} 0,${u(r) + u(B)}`);
      var j = jp(), I = ie(j);
      me(() => {
        ke(j, "width", u(n)), ke(j, "height", u(L)), Be(j, `top: ${-u(B)}px;`), ke(I, "points", u(Y)), ke(I, "fill", t.data.bgColor), ke(I, "stroke", t.data.borderColor), ke(I, "stroke-dasharray", u(o) === "solid" ? void 0 : "4 3");
      }), te(F, j);
    };
    ze(N, (F) => {
      u(a) && u(n) && u(r) && F(M);
    });
  }
  var E = re(N, 2);
  {
    var R = (F) => {
      var B = Gp(), L = ie(B);
      me(() => {
        Be(B, t.data.labelStyle), He(L, t.data.label);
      }), te(F, B);
    };
    ze(E, (F) => {
      t.data.label && F(R);
    });
  }
  me(() => {
    w = Yn(_, 1, "container-node svelte-5co9n9", null, w, { "svg-shape": u(a) }), S = Be(_, u(a) ? "" : t.data.style, S, {
      "border-style": u(a) ? void 0 : u(o),
      "border-radius": u(a) ? void 0 : u(l),
      padding: u(s)
    });
  }), Qi(_, "clientWidth", (F) => q(n, F)), Qi(_, "clientHeight", (F) => q(r, F)), te(e, f), ve();
}
function Jp(e, t = 0, n = 0, r = 40) {
  return Array.from({ length: e }, (i, o) => ({
    x: t + r * Math.cos(2 * Math.PI * o / e - Math.PI / 2),
    y: n + r * Math.sin(2 * Math.PI * o / e - Math.PI / 2)
  }));
}
function $p(e) {
  if (e == null || typeof e != "object" || !("figure" in e) || !("components" in e) || !("layout" in e))
    throw new Error(
      "loadSpec: invalid FigureSpec — missing required fields (figure, components, layout)"
    );
  return e;
}
function bl(e) {
  return e.type === "circle" ? (e.data.r ?? 14) * 2 : e.width ?? (e.type === "container" ? 200 : 90);
}
function El(e) {
  return e.type === "circle" ? (e.data.r ?? 14) * 2 : e.height ?? (e.type === "container" ? 150 : 32);
}
const em = "₁₂₃₄₅₆₇₈₉";
function Li(e, t) {
  if (!e) return t;
  const n = e.match(/(\d+(?:\.\d+)?)/);
  return n ? parseFloat(n[1]) : t;
}
function tm(e, t) {
  return !e || e === "none" ? Array(t).fill("") : e === "auto" ? Array.from({ length: t }, (n, r) => `v${em[r] ?? r + 1}`) : e;
}
async function nm(e, t) {
  var j, I;
  const n = [], r = [], i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
  let l = 0;
  for (const [g, x] of Object.entries(e.components))
    if (x.type === "box") {
      const { stroke: p, fill: k } = fn(x.color ?? "grey"), P = x.width ?? 90, C = x.height ?? 32;
      n.push({
        id: g,
        type: "default",
        position: { x: 0, y: 0 },
        data: { label: x.label },
        style: `--ns: ${p}; --nf: ${k};`,
        width: P,
        height: C,
        sourcePosition: U.Right,
        targetPosition: U.Left
      }), i.set(g, [g]);
    } else if (x.type === "graph") {
      const p = tm(x.labels, x.n), k = (x.scale ?? 80) / 2, P = Jp(x.n, 0, 0, k), C = [], T = x.r ?? (k < 30 ? 10 : 14);
      for (let D = 0; D < x.n; D++) {
        const z = `${g}_${D}`;
        C.push(z), n.push({
          id: z,
          type: "circle",
          position: { x: P[D].x, y: P[D].y },
          data: {
            label: p[D],
            color: x.color ?? "grey",
            r: T
          },
          sourcePosition: U.Right,
          targetPosition: U.Left
        });
      }
      const O = x.variant, H = (D, z) => ({
        color: x.color ?? "grey",
        ...O !== void 0 && { highlighted: D === O - 1 || z === O - 1 }
      });
      if (x.topology === "full")
        for (let D = 0; D < x.n; D++)
          for (let z = D + 1; z < x.n; z++)
            r.push({
              id: `e${l++}`,
              source: C[D],
              target: C[z],
              type: "structural",
              data: H(D, z)
            });
      else if (x.topology === "sparse") {
        for (let D = 0; D < x.n; D++) {
          const z = (D + 1) % x.n;
          r.push({
            id: `e${l++}`,
            source: C[D],
            target: C[z],
            type: "structural",
            data: H(D, z)
          });
        }
        x.n > 3 && r.push({
          id: `e${l++}`,
          source: C[0],
          target: C[2],
          type: "structural",
          data: H(0, 2)
        });
      }
      if (i.set(g, C), x.container) {
        const D = `${g}__container`, { stroke: z, fill: X } = fn(
          x.container.color ?? x.color ?? "grey"
        );
        n.push({
          id: D,
          type: "container",
          position: { x: 0, y: 0 },
          data: {
            label: x.container.label,
            style: `border-color: ${z}; background: ${X};`,
            labelStyle: `color: ${z};`,
            shape: x.container.shape,
            line: x.container.line,
            padding: x.container.padding
          },
          width: k * 2 + 80,
          height: k * 2 + 60,
          style: "z-index: -1;"
        }), o.set(g, D), s.set(D, g);
        for (const V of C) {
          const Q = n.find((W) => W.id === V);
          Q && (Q.parentId = D);
        }
      }
    } else if (x.type === "spec")
      throw new Error(`specToFlow: referenced spec '${x.ref}' not found`);
  const c = /* @__PURE__ */ new Map();
  for (const [g, x] of i.entries()) {
    const p = x.map((O) => n.find((H) => H.id === O)).filter((O) => !!O && O.type !== "container");
    if (p.length === 0) continue;
    let k = 1 / 0, P = 1 / 0, C = -1 / 0, T = -1 / 0;
    for (const O of p) {
      const H = bl(O), D = El(O);
      k = Math.min(k, O.position.x), P = Math.min(P, O.position.y), C = Math.max(C, O.position.x + H), T = Math.max(T, O.position.y + D);
    }
    c.set(g, {
      w: C - k,
      h: T - P,
      cx: (k + C) / 2,
      cy: (P + T) / 2
    });
  }
  const f = 16, h = 18;
  function d(g) {
    var P, C;
    const x = c.get(g), p = (x == null ? void 0 : x.w) ?? 80, k = (x == null ? void 0 : x.h) ?? 40;
    if (o.has(g)) {
      const T = e.components[g], O = Li(
        (T == null ? void 0 : T.type) === "graph" ? (P = T.container) == null ? void 0 : P.padding : void 0,
        f
      ), H = (T == null ? void 0 : T.type) === "graph" && ((C = T.container) != null && C.label) ? h : 0;
      return { w: p + 2 * O, h: k + 2 * O + H };
    }
    return { w: p, h: k };
  }
  function v(g) {
    var H;
    if (typeof g == "string") return d(g);
    const x = g.children ?? g.elements ?? [];
    if (x.length === 0) return { w: 80, h: 40 };
    const p = x.map((D) => v(D)), k = g.gap ?? 40, P = g.container ? Li(g.container.padding, f) : 0, C = g.container ? 2 * P : 0, T = (H = g.container) != null && H.label ? h : 0, O = g.container ? 2 * P + T : 0;
    return g.type === "vstack" ? {
      w: Math.max(...p.map((D) => D.w)) + C,
      h: p.reduce((D, z) => D + z.h, 0) + k * (x.length - 1) + O
    } : {
      w: p.reduce((D, z) => D + z.w, 0) + k * (x.length - 1) + C,
      h: Math.max(...p.map((D) => D.h)) + O
    };
  }
  const m = new Set(n.map((g) => g.id));
  function _(g) {
    if (m.has(g)) return g;
    const x = g.match(/^(.+)__corner-(?:nw|ne|sw|se)$/);
    if (x) {
      const C = x[1], T = o.get(C);
      if (T) return T;
    }
    const p = g.match(/^(.+)__(?:top|bottom|left|right)$/);
    if (p) {
      const C = p[1], T = o.get(C);
      if (T) return T;
      const O = i.get(C);
      if (O != null && O.length) {
        const H = O.find(
          (D) => m.has(D) && !D.endsWith("__container")
        );
        return H || O[0];
      }
    }
    const k = i.get(g);
    if (k != null && k.length) {
      const C = k.find(
        (T) => m.has(T) && !T.endsWith("__container")
      );
      return C || k[0];
    }
    const P = o.get(g);
    return P || null;
  }
  function w(g) {
    const x = o.get(g);
    return x ? [x] : i.get(g) ?? [];
  }
  function S(g, x = 0, p = 0) {
    var V, Q;
    if (typeof g == "string") {
      const W = c.get(g), G = d(g), Z = o.has(g), $ = x + G.w / 2, oe = e.components[g], J = Z && (oe == null ? void 0 : oe.type) === "graph" && ((V = oe.container) != null && V.label) ? h : 0, le = Z ? p + f + J + ((W == null ? void 0 : W.h) ?? 40) / 2 : p + G.h / 2, ne = $ - ((W == null ? void 0 : W.cx) ?? 0), ye = le - ((W == null ? void 0 : W.cy) ?? 0), be = i.get(g) ?? [];
      for (const Se of be) {
        const Pe = n.find((ce) => ce.id === Se);
        Pe && Pe.type !== "container" && (Pe.position = { x: Pe.position.x + ne, y: Pe.position.y + ye });
      }
      return { leafIds: be, topIds: w(g) };
    }
    const k = g.children ?? g.elements ?? [], P = k.map((W) => v(W)), C = g.gap ?? 40, T = [], O = [], H = g.container ? Li(g.container.padding, f) : 0, D = H, z = (Q = g.container) != null && Q.label ? h : 0, X = g.container ? H + z : 0;
    if (g.type === "vstack") {
      const W = P.length > 0 ? Math.max(...P.map((Z) => Z.w)) : 0;
      let G = p + X;
      for (let Z = 0; Z < k.length; Z++) {
        const $ = P[Z], oe = x + D + (W - $.w) / 2, J = S(k[Z], oe, G);
        T.push(...J.leafIds), O.push(...J.topIds), G += $.h + C;
      }
    } else {
      const W = P.length > 0 ? Math.max(...P.map(($) => $.h)) : 0;
      let G = x + D;
      const Z = [];
      for (let $ = 0; $ < k.length; $++) {
        const oe = P[$], J = p + X + (W - oe.h) / 2, le = S(k[$], G, J);
        T.push(...le.leafIds), O.push(...le.topIds), g.type === "pipeline" && le.leafIds.length > 0 && Z.push(le.leafIds[0]), G += oe.w + C;
      }
      if (g.type === "pipeline")
        for (let $ = 0; $ < Z.length - 1; $++)
          r.push({
            id: `e${l++}`,
            source: Z[$],
            target: Z[$ + 1],
            type: "flow",
            data: { color: g.flowColor ?? "grey" }
          });
    }
    if (g.container) {
      const { w: W, h: G } = v(g), Z = `__layout_container_${l++}`, { stroke: $, fill: oe } = fn(
        g.container.color ?? "grey"
      );
      n.push({
        id: Z,
        type: "container",
        position: { x, y: p },
        data: {
          label: g.container.label,
          style: `border-color: ${$}; background: ${oe};`,
          labelStyle: `color: ${$};`,
          borderColor: $,
          bgColor: oe,
          shape: g.container.shape,
          line: g.container.line,
          padding: g.container.padding
        },
        width: W,
        height: G,
        style: "z-index: -1;"
      });
      for (const J of O) {
        const le = n.find((ne) => ne.id === J);
        le && (le.parentId = Z);
      }
      return g.id && (o.set(g.id, Z), s.set(Z, g.id)), { leafIds: T, topIds: [Z] };
    }
    return { leafIds: T, topIds: O };
  }
  S(e.layout);
  const N = f, M = h, E = new Map(n.map((g) => [g.id, g]));
  function R(g) {
    let x = 0, p = g;
    for (; p != null && p.parentId && (p = E.get(p.parentId), !!p); )
      x++;
    return x;
  }
  const F = n.filter((g) => g.type === "container");
  F.sort((g, x) => R(x) - R(g));
  for (const g of F) {
    const x = n.filter((D) => D.parentId === g.id);
    if (x.length === 0) continue;
    let p = 1 / 0, k = 1 / 0, P = -1 / 0, C = -1 / 0;
    for (const D of x) {
      const z = bl(D), X = El(D);
      p = Math.min(p, D.position.x), k = Math.min(k, D.position.y), P = Math.max(P, D.position.x + z), C = Math.max(C, D.position.y + X);
    }
    const T = Li(
      (j = g.data) == null ? void 0 : j.padding,
      N
    ), O = (I = g.data) != null && I.label ? M : 0;
    g.position = {
      x: p - T,
      y: k - T - O
    }, g.width = P - p + 2 * T, g.height = C - k + 2 * T + O;
    for (const D of x)
      D.position = {
        x: D.position.x - g.position.x,
        y: D.position.y - g.position.y
      };
    const H = s.get(g.id);
    if (H) {
      const D = g.width ?? 0, z = g.height ?? 0, X = g.position.x, V = g.position.y;
      a.set(`${H}__corner-nw`, { x: X, y: V }), a.set(`${H}__corner-ne`, { x: X + D, y: V }), a.set(`${H}__corner-sw`, { x: X, y: V + z }), a.set(`${H}__corner-se`, { x: X + D, y: V + z });
    }
  }
  if (e.bridges)
    for (const g of e.bridges) {
      const x = _(g.from), p = _(g.to);
      if (!x || !p) {
        console.warn(
          `[specToFlow] bridge: cannot resolve ${g.from} -> ${g.to}`
        );
        continue;
      }
      const k = g.type === "kd", P = g.type === "line", C = {
        color: g.color ?? (k ? "kd" : "grey"),
        label: g.label ?? (k ? "KD" : void 0),
        dashed: g.style === "dashed" || k
      };
      k && (C.strokeWidth = 2, C.dashArray = "6 4", C.boldLabel = !0, C.labelOnStroke = !0, C.labelOffsetX = 10, C.labelLeftAlign = !0), P && (C.straight = !0);
      const T = a.get(g.from), O = a.get(g.to);
      T && (C.sourceAnchor = T), O && (C.targetAnchor = O), r.push({
        id: `e${l++}`,
        source: x,
        target: p,
        type: g.type === "flow" || g.type === void 0 || k || P ? "flow" : g.type,
        data: C
      });
    }
  const B = /* @__PURE__ */ new Set(), L = [];
  function Y(g) {
    if (!B.has(g.id)) {
      if (B.add(g.id), g.parentId) {
        const x = E.get(g.parentId);
        x && Y(x);
      }
      L.push(g);
    }
  }
  for (const g of n) Y(g);
  return n.length = 0, n.push(...L), { nodes: n, edges: r };
}
var rm = /* @__PURE__ */ de("<option> </option>"), im = /* @__PURE__ */ de('<section class="svelte-1u7cq3j"><h3 class="svelte-1u7cq3j">Component: <code class="svelte-1u7cq3j"> </code></h3> <label class="svelte-1u7cq3j">Label <input type="text" class="svelte-1u7cq3j"/></label> <label class="svelte-1u7cq3j">Role <select class="svelte-1u7cq3j"><option>— none —</option><!></select></label> <button class="svelte-1u7cq3j">Apply</button></section>'), om = /* @__PURE__ */ de('<section class="hint svelte-1u7cq3j">Click a node to edit it.</section>'), sm = /* @__PURE__ */ de("<option> </option>"), am = /* @__PURE__ */ de("<option> </option>"), lm = /* @__PURE__ */ de('<div class="bridge-row svelte-1u7cq3j"><select class="svelte-1u7cq3j"></select> <span>→</span> <select class="svelte-1u7cq3j"></select> <button class="remove-btn svelte-1u7cq3j">✕</button></div>'), cm = /* @__PURE__ */ de('<p class="hint svelte-1u7cq3j">No bridges.</p>'), um = /* @__PURE__ */ de('<span> <em class="svelte-1u7cq3j"> </em></span>'), fm = /* @__PURE__ */ de('<div class="change-row svelte-1u7cq3j"><code class="svelte-1u7cq3j"> </code>: <!></div>'), dm = /* @__PURE__ */ de('<section class="pending svelte-1u7cq3j"><h3 class="svelte-1u7cq3j">Pending changes</h3> <!> <p class="hint svelte-1u7cq3j">Call <code class="svelte-1u7cq3j">editor.save()</code> to write to spec.yaml.</p></section>'), hm = /* @__PURE__ */ de('<div class="spec-editor svelte-1u7cq3j"><div class="canvas-wrap svelte-1u7cq3j"><!></div> <aside class="side-panel svelte-1u7cq3j"><!> <section class="svelte-1u7cq3j"><h3 class="svelte-1u7cq3j">Bridges <button class="add-btn svelte-1u7cq3j">+ Add</button></h3> <!> <!></section> <!></aside></div>');
function gm(e, t) {
  ge(t, !0);
  const n = { circle: Yp, container: Qp }, r = {
    structural: Zp,
    flow: Wp,
    encoded: Kp
  }, i = {
    markerEnd: { type: ii.ArrowClosed, width: 12, height: 12 }
  };
  let o = /* @__PURE__ */ ue(Ue([])), s = /* @__PURE__ */ ue(Ue([])), a = /* @__PURE__ */ ue(Ue({})), l = /* @__PURE__ */ ue(Ue([])), c = /* @__PURE__ */ ue(Ue([])), f = /* @__PURE__ */ ue(Ue({})), h = /* @__PURE__ */ ue(null), d = /* @__PURE__ */ ue(""), v = /* @__PURE__ */ ue("");
  const m = ["vgae", "gat", "kd", "neutral"];
  async function _() {
    const z = JSON.parse(t.model.get("spec") || "{}");
    q(a, z, !0), q(l, Object.keys(z.components ?? {}), !0), q(c, JSON.parse(JSON.stringify(z.bridges ?? [])), !0), q(f, {}, !0), q(h, null);
    try {
      const X = $p(z), V = await nm(X);
      q(o, V.nodes, !0), q(s, V.edges, !0);
    } catch (X) {
      console.error("specToFlow failed:", X);
    }
  }
  ht(() => (_(), t.model.on("change:spec", _), () => t.model.off("change:spec", _)));
  function w({ nodes: z }) {
    var G;
    if (z.length === 0) {
      q(h, null);
      return;
    }
    const X = z[0].id, V = u(l).find((Z) => X === Z || X.startsWith(Z + "__")) ?? null;
    if (!V) return;
    q(h, V, !0);
    const Q = ((G = u(a).components) == null ? void 0 : G[V]) ?? {}, W = u(f)[V] ?? {};
    q(d, W.label ?? Q.label ?? V, !0), q(v, W.role ?? Q.role ?? "", !0);
  }
  function S() {
    var V;
    if (!u(h)) return;
    const z = ((V = u(a).components) == null ? void 0 : V[u(h)]) ?? {}, X = {};
    u(d) !== (z.label ?? u(h)) && (X.label = u(d)), u(v) !== (z.role ?? "") && (X.role = u(v)), Object.keys(X).length > 0 && q(
      f,
      {
        ...u(f),
        [u(h)]: { ...u(f)[u(h)], ...X }
      },
      !0
    ), R();
  }
  function N() {
    u(l).length < 2 || (q(
      c,
      [
        ...u(c),
        { from: u(l)[0], to: u(l)[1] }
      ],
      !0
    ), R());
  }
  function M(z) {
    q(c, u(c).filter((X, V) => V !== z), !0), R();
  }
  function E(z, X, V) {
    q(c, u(c).map((Q, W) => W === z ? { ...Q, [X]: V } : Q), !0), R();
  }
  function R() {
    const z = {};
    Object.keys(u(f)).length > 0 && (z.components = u(f)), z.bridges = u(c), t.model.set("patch", JSON.stringify(z)), t.model.save_changes();
  }
  var F = hm(), B = ie(F), L = ie(B);
  zp(L, {
    get nodeTypes() {
      return n;
    },
    get edgeTypes() {
      return r;
    },
    get defaultEdgeOptions() {
      return i;
    },
    fitView: !0,
    elementsSelectable: !0,
    nodesDraggable: !1,
    nodesConnectable: !1,
    panOnDrag: !0,
    zoomOnScroll: !0,
    minZoom: 0.2,
    maxZoom: 4,
    proOptions: { hideAttribution: !0 },
    onselectionchange: w,
    get nodes() {
      return u(o);
    },
    set nodes(z) {
      q(o, z, !0);
    },
    get edges() {
      return u(s);
    },
    set edges(z) {
      q(s, z, !0);
    }
  });
  var Y = re(B, 2), j = ie(Y);
  {
    var I = (z) => {
      var X = im(), V = ie(X), Q = re(ie(V)), W = ie(Q), G = re(V, 2), Z = re(ie(G)), $ = re(G, 2), oe = re(ie($)), J = ie(oe);
      J.value = J.__value = "";
      var le = re(J);
      Kt(le, 17, () => m, qn, (ye, be) => {
        var Se = rm(), Pe = ie(Se), ce = {};
        me(() => {
          He(Pe, u(be)), ce !== (ce = u(be)) && (Se.value = (Se.__value = u(be)) ?? "");
        }), te(ye, Se);
      });
      var ne = re($, 2);
      me(() => He(W, u(h))), Ad(Z, () => u(d), (ye) => q(d, ye)), kd(oe, () => u(v), (ye) => q(v, ye)), rt("click", ne, S), te(z, X);
    }, g = (z) => {
      var X = om();
      te(z, X);
    };
    ze(j, (z) => {
      u(h) ? z(I) : z(g, -1);
    });
  }
  var x = re(j, 2), p = ie(x), k = re(ie(p)), P = re(p, 2);
  Kt(P, 17, () => u(c), qn, (z, X, V) => {
    var Q = lm(), W = ie(Q);
    Kt(W, 21, () => u(l), qn, (J, le) => {
      var ne = sm(), ye = ie(ne), be = {};
      me(() => {
        He(ye, u(le)), be !== (be = u(le)) && (ne.value = (ne.__value = u(le)) ?? "");
      }), te(J, ne);
    });
    var G;
    Ui(W);
    var Z = re(W, 4);
    Kt(Z, 21, () => u(l), qn, (J, le) => {
      var ne = am(), ye = ie(ne), be = {};
      me(() => {
        He(ye, u(le)), be !== (be = u(le)) && (ne.value = (ne.__value = u(le)) ?? "");
      }), te(J, ne);
    });
    var $;
    Ui(Z);
    var oe = re(Z, 2);
    me(() => {
      G !== (G = u(X).from) && (W.value = (W.__value = u(X).from) ?? "", gr(W, u(X).from)), $ !== ($ = u(X).to) && (Z.value = (Z.__value = u(X).to) ?? "", gr(Z, u(X).to));
    }), rt("change", W, (J) => E(V, "from", J.target.value)), rt("change", Z, (J) => E(V, "to", J.target.value)), rt("click", oe, () => M(V)), te(z, Q);
  });
  var C = re(P, 2);
  {
    var T = (z) => {
      var X = cm();
      te(z, X);
    };
    ze(C, (z) => {
      u(c).length === 0 && z(T);
    });
  }
  var O = re(x, 2);
  {
    var H = (z) => {
      var X = dm(), V = re(ie(X), 2);
      Kt(V, 17, () => Object.entries(u(f)), qn, (Q, W) => {
        var G = /* @__PURE__ */ b(() => Nn(u(W), 2));
        let Z = () => u(G)[0], $ = () => u(G)[1];
        var oe = fm(), J = ie(oe), le = ie(J), ne = re(J, 2);
        Kt(ne, 17, () => Object.entries($()), qn, (ye, be) => {
          var Se = /* @__PURE__ */ b(() => Nn(u(be), 2));
          let Pe = () => u(Se)[0], ce = () => u(Se)[1];
          var we = um(), Ie = ie(we), _e = re(Ie), Le = ie(_e);
          me(() => {
            He(Ie, `${Pe() ?? ""} → `), He(Le, ce());
          }), te(ye, we);
        }), me(() => He(le, Z())), te(Q, oe);
      }), te(z, X);
    }, D = /* @__PURE__ */ b(() => Object.keys(u(f)).length > 0);
    ze(O, (z) => {
      u(D) && z(H);
    });
  }
  rt("click", k, N), te(e, F), ve();
}
xo(["click", "change"]);
function mm({ model: e, el: t }) {
  const n = gd(gm, { target: t, props: { model: e } });
  return () => yd(n);
}
export {
  mm as render
};
