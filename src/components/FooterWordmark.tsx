"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Logo, LOGO_PATH_D, LOGO_VIEWBOX } from "./Logo";

/**
 * Large decorative wordmark strip in the footer. Purely visual — aria-hidden,
 * mouse-driven only, no keyboard interaction expected (the real accessible
 * "berneldiaz" link lives in Nav.tsx).
 *
 * Hover interaction: a faithful port of originkit.dev's "Mesh Text Hover"
 * component (source supplied directly by the user, not reverse-engineered
 * from the demo alone). It's raw WebGL2 — no Three.js/mesh library, so this
 * adds zero dependencies, same tier as the Canvas2D/DOM APIs already used
 * elsewhere in the codebase. The mechanic: the wordmark is rasterized once
 * onto an offscreen canvas (reusing Logo.tsx's own path data via Path2D, so
 * the letterforms match the nav exactly) and uploaded as a texture mapped
 * onto a dense 96x40 vertex grid. Every vertex runs its own tiny physics sim
 * each frame — cursor *velocity* (not position) pulls nearby vertices via an
 * inverse-distance falloff, a spring term constantly pulls displacement back
 * to 0, a damping term bleeds off velocity. There is no per-letter logic
 * anywhere — letters only look like they lean individually because the grid
 * cells under them get dragged. An earlier attempt at this used an SVG
 * feTurbulence/feDisplacementMap filter (noise-based distortion) and was
 * explicitly rejected by the user as not matching this feel — turbulence
 * noise and velocity-driven grid drag are different kinds of motion, not
 * just different tuning of the same idea.
 *
 * Reduced motion / non-mouse input: gsap.matchMedia() gates the pointer
 * listeners and physics loop behind
 * `(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)`,
 * matching the full-bypass convention used everywhere else in this codebase.
 * The WebGL setup and one static draw always run regardless (so there's
 * always a correctly-rendered wordmark), only the interactive layer is
 * gated. gsap is used here purely for its matchMedia utility, not for
 * tweening anything — the mesh physics runs its own requestAnimationFrame
 * loop, same as the reference, since a live per-vertex Float32Array
 * spring/damping sim isn't something GSAP's tweening engine drives anyway.
 *
 * A follow-up attempt at giving the mesh "bleed" room (so displaced edge
 * vertices wouldn't clip against the canvas boundary) was tried and then
 * explicitly undone per user request mid-diagnosis — that fix surfaced a
 * separate, pre-existing bug (the WebGL render going fully blank in narrow
 * browser windows, unrelated to the bleed change itself, confirmed present
 * even with the bleed disabled) that wasn't resolved before the request to
 * revert. If clipping or the narrow-window blank-render bug need revisiting,
 * start from a fresh diagnosis rather than assuming either investigation's
 * partial findings still apply.
 *
 * Fallback (2026-07-29): a user report showed this rendering as a solid
 * opaque black block instead of the wordmark. Extensive testing (texture
 * upload, shader, geometry, and the CPU-side rasterized source were all
 * confirmed correct across many viewport widths) couldn't reproduce it, which
 * points at something environment-specific rather than a deterministic code
 * bug — most likely a browser privacy/anti-fingerprinting extension
 * intercepting canvas/WebGL calls, which some implementations satisfy with a
 * blank or solid-filled canvas instead of throwing. Since that class of
 * failure can't be reliably detected via `!gl`, there's now a one-time
 * synchronous sanity check right after the first draw (verifyRender, below)
 * that samples the actual rendered pixels and expects the mix of transparent/
 * opaque values a real wordmark has; if it doesn't, GL resources are torn
 * down and `<Logo>` (the same SVG the nav uses) renders in place of the
 * canvas instead of risking the opaque-black failure mode reaching the page.
 */

const GRID_W = 96;
const GRID_H = 40;
// Tuned 2026-07-29 for a "premium" feel per Apple's fluid-interfaces spring
// defaults (critically damped, no overshoot — the "move/reposition"
// archetype, since this is a continuous cursor-follow field, not a
// flick/release gesture that would earn some bounce). The original values
// (FORCE 0.8, SPRING_K 0.08, DAMPING 0.9 — matching the reference's captured
// `force: 8` prop) numerically settle in ~1.4s with a small negative
// overshoot: a slow, floaty "hold at max then drift back" character. These
// settle in exactly 1.0s (explicit target) with a smooth, monotonic decay
// and no sign flip — still reach-and-settle, not reach-hold-drift, just
// with more dwell than the earlier ~0.56s/~0.65s/~0.35s settle times tried
// and rejected as too snappy during live tuning. FORCE was raised alongside
// the (still comparatively) stiffer spring/faster damping-decay specifically
// to keep the peak displacement comparable — a faster-decaying spring alone
// pulls vertices back before they can travel as far under the same cursor
// input.
const FORCE = 2.8;
const SPRING_K = 0.18;
const DAMPING = 0.77;
const DT = 0.1;

const VERT_SRC = `#version 300 es
in vec2 aPos;
in vec2 aUv;
in vec2 aDisp;
out vec2 vUv;
void main() {
    gl_Position = vec4(aPos + aDisp, 0.0, 1.0);
    vUv = aUv;
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTex;
void main() {
    outColor = texture(uTex, vUv);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

export function FooterWordmark() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Flips true if WebGL setup fails outright, or if a one-time post-render
  // sanity check (see verifyRender below) finds the canvas didn't actually
  // render a real wordmark — most commonly a browser privacy/anti-
  // fingerprinting extension intercepting canvas/WebGL calls, which some
  // implementations satisfy by returning a blank or solid-black canvas
  // rather than throwing. Either way, falls back to the plain SVG Logo
  // rather than risk an opaque black block sitting in the footer.
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!gl) {
      console.error("WebGL2 not available");
      setUseFallback(true);
      return;
    }

    const [minX, minY, vbW] = LOGO_VIEWBOX.split(" ").map(Number);
    const logoPath = new Path2D(LOGO_PATH_D);

    // ── Grid geometry ───────────────────────────────────────────────
    const vertCount = (GRID_W + 1) * (GRID_H + 1);
    const positions = new Float32Array(vertCount * 2);
    const uvs = new Float32Array(vertCount * 2);
    for (let y = 0; y <= GRID_H; y++) {
      for (let x = 0; x <= GRID_W; x++) {
        const i = y * (GRID_W + 1) + x;
        const u = x / GRID_W;
        const v = y / GRID_H;
        positions[i * 2] = u * 2 - 1;
        positions[i * 2 + 1] = 1 - v * 2;
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
      }
    }
    const indexCount = GRID_W * GRID_H * 6;
    const indices = new Uint32Array(indexCount);
    let idx = 0;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const a = y * (GRID_W + 1) + x;
        const b = a + 1;
        const c = a + (GRID_W + 1);
        const d = c + 1;
        indices[idx++] = a;
        indices[idx++] = c;
        indices[idx++] = b;
        indices[idx++] = b;
        indices[idx++] = c;
        indices[idx++] = d;
      }
    }

    const disp = new Float32Array(vertCount * 2);
    const vel = new Float32Array(vertCount * 2);

    // ── GL setup ────────────────────────────────────────────────────
    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;
    const program = linkProgram(gl, vs, fs);
    if (!program) return;

    const aPos = gl.getAttribLocation(program, "aPos");
    const aUv = gl.getAttribLocation(program, "aUv");
    const aDisp = gl.getAttribLocation(program, "aDisp");
    const uTex = gl.getUniformLocation(program, "uTex");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    const dispBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dispBuf);
    gl.bufferData(gl.ARRAY_BUFFER, disp, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aDisp);
    gl.vertexAttribPointer(aDisp, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Seeds a 1x1 transparent pixel immediately, before any draw() can
    // possibly run. A texture with no image data at all is "incomplete" per
    // the WebGL/GLES spec, and sampling an incomplete texture is defined to
    // return opaque black — this closes that window entirely rather than
    // relying on rasterize() always winning the race to upload real content
    // first.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

    // Rasterizes Logo.tsx's own path data (not system-font text, unlike the
    // reference) onto an offscreen canvas sized to the real device-pixel
    // dimensions, in the current resolved --foreground color so it flips
    // correctly with the site's light/dark theme.
    const rasterize = () => {
      const w = Math.max(2, canvas.width);
      const h = Math.max(2, canvas.height);
      const c2 = document.createElement("canvas");
      c2.width = w;
      c2.height = h;
      const ctx = c2.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getComputedStyle(wrapper).color;
      const scale = w / vbW;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(-minX, -minY);
      ctx.fill(logoPath);
      ctx.restore();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
    };

    const draw = () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, dispBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, disp);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uTex, 0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
    };

    // ── Resize ──────────────────────────────────────────────────────
    // hasRasterized is scoped to this effect invocation, not to the canvas
    // element — that distinction matters under React Strict Mode's dev-only
    // mount→cleanup→mount double-invoke, which reuses the same already-
    // committed <canvas> DOM node across both invocations (only the effect
    // re-runs, not the element). canvas.width/canvas.height are DOM
    // attributes that persist across that double-invoke, but gl/tex/buffers
    // are fresh JS objects created fresh each invocation — so on the second
    // invocation, canvas.width already equals the freshly computed target
    // (carried over from the first invocation's resize()), and a dimensions-
    // only guard would skip rasterize() entirely, leaving this invocation's
    // brand-new texture holding only the 1x1 placeholder pixel from
    // creation. That reads as a blank canvas to verifyRender() below and
    // wrongly triggers the SVG fallback — confirmed via a real repro
    // (client-side nav to an already-settled page, where there's no font-
    // load/layout jitter between the two ~10ms-apart invocations to make
    // the dimensions genuinely differ and paper over the bug).
    let hasRasterized = false;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = wrapper.getBoundingClientRect();
      const w = Math.max(2, Math.round(rect.width * dpr));
      const h = Math.max(2, Math.round(rect.height * dpr));
      if (!hasRasterized || canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        rasterize();
        hasRasterized = true;
      }
      draw();
    };
    resize();

    // One-time sanity check, read in the same synchronous call stack as the
    // draw() just above — without preserveDrawingBuffer set, the drawing
    // buffer isn't guaranteed to still hold this frame's content by the time
    // a later tick runs, so this can't be deferred. A real wordmark has a
    // healthy mix of transparent (letter gaps) and opaque (ink) pixels; a
    // canvas that's been blanked or solid-filled — most commonly by a
    // browser privacy/anti-fingerprinting extension intercepting canvas/
    // WebGL calls — reads as uniform instead. If this fails, tear down the
    // GL resources and fall back to the plain SVG Logo (see the JSX below)
    // rather than risk an opaque black block sitting in the footer.
    const verifyRender = () => {
      const cols = 12;
      const rows = 4;
      const buf = new Uint8Array(4);
      let sawTransparent = false;
      let sawOpaque = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = Math.min(canvas.width - 1, Math.floor((c / cols) * canvas.width));
          const y = Math.min(canvas.height - 1, Math.floor((r / rows) * canvas.height));
          gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
          if (buf[3] === 0) sawTransparent = true;
          else if (buf[3] > 200) sawOpaque = true;
        }
      }
      return sawTransparent && sawOpaque;
    };

    if (!verifyRender()) {
      console.error("FooterWordmark: render verification failed, falling back to static Logo");
      setUseFallback(true);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(dispBuf);
      gl.deleteBuffer(idxBuf);
      gl.deleteTexture(tex);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const onColorSchemeChange = () => {
      rasterize();
      draw();
    };
    colorScheme.addEventListener("change", onColorSchemeChange);

    // ── Interactive layer (pointer tracking + physics loop) ───────────
    // Gated behind reduced-motion + real-mouse capability; everything above
    // this point (the static rasterized render) still applies regardless.
    const mm = gsap.matchMedia();
    mm.add(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
      () => {
        const cursor = { x: 99, y: 99, px: 99, py: 99, vx: 0, vy: 0, inside: false };

        const onMove = (e: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width;
          const ny = (e.clientY - rect.top) / rect.height;
          const x = nx * 2 - 1;
          const y = 1 - ny * 2;
          if (!cursor.inside) {
            cursor.px = x;
            cursor.py = y;
            cursor.inside = true;
          }
          cursor.x = x;
          cursor.y = y;
        };
        const onLeave = () => {
          cursor.inside = false;
          cursor.x = 99;
          cursor.y = 99;
          cursor.vx = 0;
          cursor.vy = 0;
        };
        wrapper.addEventListener("pointermove", onMove);
        wrapper.addEventListener("pointerleave", onLeave);

        let rafId = 0;
        const tick = () => {
          cursor.vx = cursor.x - cursor.px;
          cursor.vy = cursor.y - cursor.py;
          const vmag = Math.hypot(cursor.vx, cursor.vy);
          if (vmag > 0.3) {
            cursor.vx = 0;
            cursor.vy = 0;
          }
          cursor.px = cursor.x;
          cursor.py = cursor.y;

          // The reference's falloff radius (0.05) is tuned for a roughly
          // square canvas, where 1 NDC unit means the same number of
          // physical pixels on both axes. This wordmark's canvas is ~5.6:1
          // (79:14 viewBox), so without correction the same NDC radius
          // becomes a squashed ellipse in real pixels — nearly zero
          // effective height, which reads as almost no visible distortion.
          // Scale the y-delta into x-equivalent units so proximity reads as
          // a true circle in physical pixels regardless of aspect ratio.
          const aspect = canvas.width / canvas.height;

          for (let i = 0; i < vertCount; i++) {
            const i2 = i * 2;
            const px = positions[i2];
            const py = positions[i2 + 1];
            const dx = disp[i2];
            const dy = disp[i2 + 1];

            const cx = cursor.x - (px + dx);
            const cy = (cursor.y - (py + dy)) / aspect;
            const cd = Math.hypot(cx, cy);
            const proximity = Math.max(0, 1 / (1 + cd / 0.05) - 0.1);

            let vx = vel[i2];
            let vy = vel[i2 + 1];

            vx += cursor.vx * FORCE * proximity;
            vy += cursor.vy * FORCE * proximity;

            vx -= dx * SPRING_K;
            vy -= dy * SPRING_K;

            vx *= DAMPING;
            vy *= DAMPING;

            vel[i2] = vx;
            vel[i2 + 1] = vy;

            let ndx = dx + vx * DT;
            let ndy = dy + vy * DT;
            if (ndx > 1) ndx = 1;
            else if (ndx < -1) ndx = -1;
            if (ndy > 1) ndy = 1;
            else if (ndy < -1) ndy = -1;
            disp[i2] = ndx;
            disp[i2 + 1] = ndy;
          }

          draw();
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
          cancelAnimationFrame(rafId);
          wrapper.removeEventListener("pointermove", onMove);
          wrapper.removeEventListener("pointerleave", onLeave);
          disp.fill(0);
          vel.fill(0);
          draw();
        };
      },
    );

    return () => {
      mm.revert();
      ro.disconnect();
      colorScheme.removeEventListener("change", onColorSchemeChange);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(dispBuf);
      gl.deleteBuffer(idxBuf);
      gl.deleteTexture(tex);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <div aria-hidden="true" className="px-6 py-6 text-foreground">
      <div ref={wrapperRef} className="relative w-full" style={{ aspectRatio: "79 / 14" }}>
        {useFallback ? (
          <Logo className="block h-full w-full" />
        ) : (
          <canvas ref={canvasRef} className="block h-full w-full" />
        )}
      </div>
    </div>
  );
}
