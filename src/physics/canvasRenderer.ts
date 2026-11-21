import { LessonId, ParamMap } from './types';
import { computeLessonMetrics, PHYSICS_CONSTANTS, wavelengthToHex } from './engine';

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  const step = 32;
  ctx.beginPath();
  for (let x = step; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = step; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label?: string,
  lineWidth = 2.2
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const angle = Math.atan2(dy, dx);
  const head = Math.min(10, len * 0.35);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(label, x2 + 6, y2 + (dy >= 0 ? 12 : -6));
  }
  ctx.restore();
}

function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  coils = 14,
  radius = 12
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  const lead = 14;
  ctx.lineTo(lead, 0);
  const body = Math.max(10, len - 2 * lead);
  const seg = body / (coils * 2);
  for (let i = 0; i < coils * 2; i++) {
    const px = lead + (i + 0.5) * seg;
    const py = i % 2 === 0 ? -radius : radius;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(len - lead, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();
  ctx.restore();
}

function drawHudTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, accent = '#38bdf8') {
  ctx.save();
  ctx.font = '600 11.5px "JetBrains Mono", monospace';
  ctx.fillStyle = accent;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function renderPhysicsScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lessonId: LessonId,
  params: ParamMap,
  simTime: number
) {
  drawGrid(ctx, w, h);

  switch (lessonId) {
    case 'kinematics-1d': {
      const v0 = params.v0 ?? 6;
      const a = params.a ?? 2;
      const tMax = Math.max(1, params.t ?? 6);
      const t = simTime % tMax;
      const v = v0 + a * t;
      const d = v0 * t + 0.5 * a * t * t;

      // Compute bounds along track
      let minD = 0;
      let maxD = 0;
      for (let i = 0; i <= 40; i++) {
        const ti = (i / 40) * tMax;
        const di = v0 * ti + 0.5 * a * ti * ti;
        minD = Math.min(minD, di);
        maxD = Math.max(maxD, di);
      }
      const span = Math.max(10, maxD - minD);
      const padL = 60;
      const padR = 60;
      const trackY = h * 0.6;
      const toX = (pos: number) => padL + ((pos - minD) / span) * (w - padL - padR);

      // Rail
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(padL - 20, trackY + 24);
      ctx.lineTo(w - padR + 20, trackY + 24);
      ctx.stroke();

      // Ruler ticks
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "JetBrains Mono", monospace';
      for (let i = 0; i <= 6; i++) {
        const val = minD + (i / 6) * span;
        const px = toX(val);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, trackY + 24);
        ctx.lineTo(px, trackY + 32);
        ctx.stroke();
        ctx.fillText(`${val.toFixed(0)}m`, px - 12, trackY + 46);
      }

      // Origin marker
      const ox = toX(0);
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ox, trackY - 60);
      ctx.lineTo(ox, trackY + 24);
      ctx.stroke();
      ctx.setLineDash([]);
      drawHudTag(ctx, ox - 18, trackY - 68, 'O (x=0)', '#38bdf8');

      // Displacement trace
      const cx = toX(d);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox, trackY + 20);
      ctx.lineTo(cx, trackY + 20);
      ctx.stroke();

      // Cart body
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 26, trackY - 12, 52, 26, 5);
      ctx.fill();
      ctx.stroke();

      // Wheels
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(cx - 14, trackY + 18, 6, 0, Math.PI * 2);
      ctx.arc(cx + 14, trackY + 18, 6, 0, Math.PI * 2);
      ctx.fill();

      // Vectors v and a
      const vLen = Math.max(-110, Math.min(110, v * 3.5));
      drawArrow(ctx, cx, trackY - 22, cx + vLen, trackY - 22, '#34d399', `v=${v.toFixed(1)} m/s`);
      const aLen = Math.max(-90, Math.min(90, a * 8));
      drawArrow(ctx, cx, trackY - 46, cx + aLen, trackY - 46, '#f59e0b', `a=${a.toFixed(1)} m/s²`);

      drawHudTag(ctx, 20, 28, `t = ${t.toFixed(2)} s / ${tMax.toFixed(1)} s`, '#e2e8f0');
      drawHudTag(ctx, 20, 48, `d = ${d.toFixed(2)} m   |   v = ${v.toFixed(2)} m/s`, '#38bdf8');
      break;
    }

    case 'projectile-motion': {
      const v0 = params.v0 ?? 24;
      const rad = ((params.angle ?? 40) * Math.PI) / 180;
      const h0 = params.h0 ?? 5;
      const g = params.g ?? 9.8;
      const vx = v0 * Math.cos(rad);
      const vy0 = v0 * Math.sin(rad);
      const tFlight = (vy0 + Math.sqrt(Math.max(0, vy0 * vy0 + 2 * g * h0))) / g;
      const rangeL = Math.max(5, vx * tFlight);
      const hMax = Math.max(5, h0 + (vy0 > 0 ? (vy0 * vy0) / (2 * g) : 0));

      const padL = 56;
      const padB = 46;
      const padT = 44;
      const padR = 44;
      const scaleX = (w - padL - padR) / (rangeL * 1.08);
      const scaleY = (h - padT - padB) / (hMax * 1.18);
      const scale = Math.min(scaleX, scaleY);
      const toX = (mx: number) => padL + mx * scale;
      const toY = (my: number) => h - padB - my * scale;

      // Ground
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL - 20, toY(0));
      ctx.lineTo(w - 20, toY(0));
      ctx.stroke();

      // Launch platform if h0 > 0
      if (h0 > 0) {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.fillRect(padL - 24, toY(h0), 24, toY(0) - toY(h0));
        ctx.strokeRect(padL - 24, toY(h0), 24, toY(0) - toY(h0));
      }

      // Full parabolic trajectory dashed
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const ti = (i / 60) * tFlight;
        const px = toX(vx * ti);
        const py = toY(Math.max(0, h0 + vy0 * ti - 0.5 * g * ti * ti));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Moving projectile
      const tCycle = tFlight + 0.8;
      const tCurr = Math.min(tFlight, simTime % tCycle);
      const xPos = vx * tCurr;
      const yPos = Math.max(0, h0 + vy0 * tCurr - 0.5 * g * tCurr * tCurr);
      const vyCurr = vy0 - g * tCurr;
      const bx = toX(xPos);
      const by = toY(yPos);

      // Trail up to tCurr
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const ti = (i / 40) * tCurr;
        const px = toX(vx * ti);
        const py = toY(Math.max(0, h0 + vy0 * ti - 0.5 * g * ti * ti));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Projectile sphere
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Velocity component vectors
      const vScale = 2.2;
      drawArrow(ctx, bx, by, bx + vx * vScale, by, '#34d399', 'v_x', 1.8);
      drawArrow(ctx, bx, by, bx, by - vyCurr * vScale, '#f472b6', 'v_y', 1.8);
      drawArrow(ctx, bx, by, bx + vx * vScale, by - vyCurr * vScale, '#fbbf24', 'v', 2.4);

      // Apex & Range markers
      const tApex = Math.max(0, vy0 / g);
      const ax = toX(vx * tApex);
      const ay = toY(hMax);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
      ctx.fill();
      drawHudTag(ctx, ax - 36, ay - 10, `H=${hMax.toFixed(1)}m`, '#38bdf8');
      drawHudTag(ctx, toX(rangeL) - 42, toY(0) + 20, `L=${rangeL.toFixed(1)}m`, '#fbbf24');
      drawHudTag(ctx, 20, 26, `t = ${tCurr.toFixed(2)} s   |   x = ${xPos.toFixed(1)} m, y = ${yPos.toFixed(1)} m`, '#e2e8f0');
      break;
    }

    case 'newton-inclined': {
      const m = params.m ?? 5;
      const alphaDeg = params.alpha ?? 30;
      const fPull = params.fPull ?? 0;
      const rad = (alphaDeg * Math.PI) / 180;
      const metrics = computeLessonMetrics(lessonId, params);
      const a = metrics.find((it) => it.key === 'a')?.value ?? 0;
      const N = metrics.find((it) => it.key === 'N')?.value ?? 0;
      const fMs = metrics.find((it) => it.key === 'fMs')?.value ?? 0;
      const P = m * (params.g ?? 9.8);

      const baseX = w * 0.16;
      const baseY = h * 0.82;
      const rampLen = Math.min(w * 0.65, h * 0.95);
      const topX = baseX + rampLen * Math.cos(rad);
      const topY = baseY - rampLen * Math.sin(rad);

      // Draw wedge ramp
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(topX, topY);
      ctx.lineTo(topX, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Angle arc
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(baseX, baseY, 42, -rad, 0);
      ctx.stroke();
      drawHudTag(ctx, baseX + 48, baseY - 10, `α=${alphaDeg}°`, '#38bdf8');

      // Block slide position along ramp
      const tLoop = simTime % 3.2;
      let sNorm = 0.5;
      if (Math.abs(a) > 0.01) {
        const dir = Math.sign(a); // +1 slides down toward baseX, -1 pulled up toward topX
        const travel = 0.5 * Math.abs(a) * tLoop * tLoop * 0.08;
        sNorm = dir > 0 ? Math.max(0.18, 0.78 - (travel % 0.6)) : Math.min(0.82, 0.22 + (travel % 0.6));
      }
      const bx = baseX + rampLen * sNorm * Math.cos(rad);
      const by = baseY - rampLen * sNorm * Math.sin(rad);

      // Draw rotated block
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(-rad);
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.fillRect(-26, -34, 52, 34);
      ctx.strokeRect(-26, -34, 52, 34);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText(`${m}kg`, -16, -13);
      ctx.restore();

      // Center of mass in world coords
      const cx = bx - 17 * Math.sin(rad);
      const cy = by - 17 * Math.cos(rad);
      const fScale = Math.min(1.6, 85 / Math.max(20, P));

      // Gravity vector P (straight down)
      drawArrow(ctx, cx, cy, cx, cy + P * fScale, '#f43f5e', `P=${P.toFixed(0)}N`);
      // Normal force N (perpendicular out of incline)
      drawArrow(ctx, cx, cy, cx - N * fScale * Math.sin(rad), cy - N * fScale * Math.cos(rad), '#38bdf8', `N=${N.toFixed(0)}N`);
      // Friction force F_ms (opposes sliding or driving tendency along the incline)
      const fDrive = P * Math.sin(rad) - fPull;
      const fDirUp = fDrive >= 0 ? 1 : -1;
      if (fMs > 0.1) {
        drawArrow(
          ctx,
          cx,
          cy,
          cx + fDirUp * fMs * fScale * Math.cos(rad),
          cy - fDirUp * fMs * fScale * Math.sin(rad),
          '#f59e0b',
          `F_ms=${fMs.toFixed(1)}N`
        );
      }
      // Pull force up incline
      if (fPull > 0.5) {
        drawArrow(
          ctx,
          cx,
          cy,
          cx + fPull * fScale * Math.cos(rad),
          cy - fPull * fScale * Math.sin(rad),
          '#34d399',
          `F_k=${fPull.toFixed(0)}N`
        );
      }

      drawHudTag(ctx, 20, 26, `Gia tốc a = ${a.toFixed(2)} m/s²  (${a > 0.01 ? 'Trượt xuống' : a < -0.01 ? 'Kéo lên dốc' : 'Cân bằng tĩnh'})`, '#e2e8f0');
      break;
    }

    case 'energy-conservation': {
      const m = params.m ?? 2;
      const h0 = params.h0 ?? 15;
      const v0 = params.v0 ?? 4;
      const g = params.g ?? 9.8;
      const W = m * g * h0 + 0.5 * m * v0 * v0;
      const hMax = Math.max(1, W / (m * g));

      // Parabolic frictionless track U-shape
      const cx = w * 0.42;
      const trackW = w * 0.56;
      const baseY = h * 0.82;
      const topY = h * 0.2;
      const trackH = baseY - topY;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const u = -1 + (2 * i) / 60; // -1 to 1
        const px = cx + u * (trackW / 2);
        const py = baseY - u * u * trackH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Animated ball oscillating along the frictionless U-track
      const uPos = Math.cos(simTime * 1.9);
      const currH = uPos * uPos * hMax;
      const currWt = m * g * currH;
      const currWd = Math.max(0, W - currWt);
      const bx = cx + uPos * (trackW / 2);
      const by = baseY - uPos * uPos * trackH;

      // Height reference line for hCurr
      const hSurvey = Math.min(hMax, params.hCurr ?? 6);
      const surveyY = baseY - (hSurvey / hMax) * trackH;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - trackW / 2 - 16, surveyY);
      ctx.lineTo(cx + trackW / 2 + 16, surveyY);
      ctx.stroke();
      ctx.setLineDash([]);
      drawHudTag(ctx, cx - trackW / 2 - 14, surveyY - 6, `Mức khảo sát h=${hSurvey.toFixed(1)}m`, '#fbbf24');

      // Ball
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(bx, by - 9, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Live Energy Bar Chart on the right side of canvas
      const barX = w * 0.77;
      const barBaseY = h * 0.82;
      const maxBarH = h * 0.56;
      const barW = 34;

      const drawBar = (offset: number, val: number, color: string, label: string) => {
        const bh = (val / Math.max(1, W)) * maxBarH;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillRect(barX + offset, barBaseY - maxBarH, barW, maxBarH);
        ctx.fillStyle = color;
        ctx.fillRect(barX + offset, barBaseY - bh, barW, bh);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(label, barX + offset + 4, barBaseY + 18);
      };

      drawBar(0, currWd, '#3b82f6', 'W_đ');
      drawBar(46, currWt, '#10b981', 'W_t');
      drawBar(92, W, '#f59e0b', 'W');
      drawHudTag(ctx, barX, barBaseY - maxBarH - 12, `W = ${W.toFixed(1)} J (Bảo toàn)`, '#fbbf24');
      drawHudTag(ctx, 20, 26, `h(t) = ${currH.toFixed(2)} m  |  W_đ = ${currWd.toFixed(1)} J  |  W_t = ${currWt.toFixed(1)} J`, '#e2e8f0');
      break;
    }

    case 'momentum-collision': {
      const m1 = params.m1 ?? 3;
      const v1 = params.v1 ?? 6;
      const m2 = params.m2 ?? 2;
      const v2 = params.v2 ?? -2;
      const metrics = computeLessonMetrics(lessonId, params);
      const v1a = metrics.find((m) => m.key === 'v1After')?.value ?? 0;
      const v2a = metrics.find((m) => m.key === 'v2After')?.value ?? 0;

      const trackY = h * 0.62;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, trackY + 28);
      ctx.lineTo(w - 30, trackY + 28);
      ctx.stroke();

      // 4-second loop: t < 2 before impact, t >= 2 after impact
      const tLoop = simTime % 4.0;
      const tImpact = 2.0;
      const midX = w * 0.5;
      const r1 = 18 + m1 * 2;
      const r2 = 18 + m2 * 2;
      const pxPerM = 12;

      const dt = tLoop - tImpact;
      let x1: number;
      let x2: number;
      let curV1: number;
      let curV2: number;

      if (dt < 0) {
        curV1 = v1;
        curV2 = v2;
        x1 = midX - r1 + v1 * dt * pxPerM;
        x2 = midX + r2 + v2 * dt * pxPerM;
      } else {
        curV1 = v1a;
        curV2 = v2a;
        x1 = midX - r1 + v1a * dt * pxPerM;
        x2 = midX + r2 + v2a * dt * pxPerM;
      }

      // Clamp gracefully to canvas bounds
      x1 = Math.max(40, Math.min(w - 40, x1));
      x2 = Math.max(40, Math.min(w - 40, x2));

      // Impact flash ring
      if (Math.abs(dt) < 0.2) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(midX, trackY, 34 * (1 - Math.abs(dt) / 0.2), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Object 1
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x1 - r1, trackY - r1, r1 * 2, r1 + 26, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText(`m₁=${m1}`, x1 - 20, trackY + 4);

      // Object 2
      ctx.fillStyle = '#059669';
      ctx.strokeStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.roundRect(x2 - r2, trackY - r2, r2 * 2, r2 + 26, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillText(`m₂=${m2}`, x2 - 20, trackY + 4);

      drawArrow(ctx, x1, trackY - r1 - 14, x1 + curV1 * 8, trackY - r1 - 14, '#60a5fa', `v₁=${curV1.toFixed(1)}`);
      drawArrow(ctx, x2, trackY - r2 - 14, x2 + curV2 * 8, trackY - r2 - 14, '#34d399', `v₂=${curV2.toFixed(1)}`);

      drawHudTag(ctx, 20, 26, dt < 0 ? 'GIAI ĐOẠN: TRƯỚC VA CHẠM' : 'GIAI ĐOẠN: SAU VA CHẠM', dt < 0 ? '#38bdf8' : '#fbbf24');
      drawHudTag(ctx, 20, 46, `Tổng động lượng p = ${(m1 * curV1 + m2 * curV2).toFixed(2)} kg·m/s (Không đổi)`, '#34d399');
      break;
    }

    case 'circular-motion': {
      const r = params.r ?? 2;
      const omega = params.omega ?? 4;
      const cx = w * 0.48;
      const cy = h * 0.52;
      const Rpx = Math.min(w, h) * 0.34;
      const angle = omega * simTime;

      // Orbit circle
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
      ctx.stroke();

      // Projection diameter (linking to SHM!)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - Rpx - 20, cy);
      ctx.lineTo(cx + Rpx + 20, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      const bx = cx + Rpx * Math.cos(angle);
      const by = cy - Rpx * Math.sin(angle);

      // Radius vector
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Projection line to Ox
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Tangential velocity vector v
      const vLen = 58;
      drawArrow(ctx, bx, by, bx - vLen * Math.sin(angle), by - vLen * Math.cos(angle), '#34d399', 'v');
      // Centripetal acceleration / force vector toward O
      drawArrow(ctx, bx, by, bx - 52 * Math.cos(angle), by + 52 * Math.sin(angle), '#f43f5e', 'F_ht, a_ht');

      // Moving mass
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(bx, by, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      drawHudTag(ctx, 20, 26, `v = ${(omega * r).toFixed(2)} m/s   |   a_ht = ${(omega * omega * r).toFixed(2)} m/s²`, '#e2e8f0');
      drawHudTag(ctx, 20, 46, `Hình chiếu trên Ox: x = ${(r * Math.cos(angle)).toFixed(2)} m (Dao động điều hòa)`, '#fbbf24');
      break;
    }

    case 'spring-shm': {
      const m = params.m ?? 0.4;
      const k = params.k ?? 100;
      const A_cm = params.A ?? 8;
      const phi = ((params.phi ?? 0) * Math.PI) / 180;
      const omega = Math.sqrt(k / m);
      const phase = omega * simTime + phi;
      const xCm = A_cm * Math.cos(phase);
      const vMs = -omega * (A_cm / 100) * Math.sin(phase);

      // Left half: Horizontal spring-mass oscillator
      const wallX = 44;
      const eqX = w * 0.34;
      const trackY = h * 0.56;
      const pxPerCm = Math.min(9, (w * 0.22) / Math.max(8, A_cm));
      const massX = eqX + xCm * pxPerCm;

      // Wall
      ctx.fillStyle = '#334155';
      ctx.fillRect(wallX - 10, trackY - 46, 10, 82);
      // Floor
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wallX, trackY + 26);
      ctx.lineTo(w * 0.62, trackY + 26);
      ctx.stroke();

      // Equilibrium & amplitude markers
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(eqX, trackY - 56);
      ctx.lineTo(eqX, trackY + 34);
      ctx.stroke();
      ctx.setLineDash([]);
      drawHudTag(ctx, eqX - 16, trackY + 48, 'VTCB', '#38bdf8');
      drawHudTag(ctx, eqX - A_cm * pxPerCm - 12, trackY + 48, '-A', '#94a3b8');
      drawHudTag(ctx, eqX + A_cm * pxPerCm - 8, trackY + 48, '+A', '#94a3b8');

      // Spring
      drawSpring(ctx, wallX, trackY, massX - 24, trackY, 13, 13);

      // Mass block
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(massX - 24, trackY - 22, 48, 46, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText(`${m}kg`, massX - 16, trackY + 4);

      // Velocity & restoring force vectors
      drawArrow(ctx, massX, trackY - 34, massX + vMs * 42, trackY - 34, '#34d399', 'v');
      drawArrow(ctx, massX, trackY - 52, massX - xCm * 4.5, trackY - 52, '#f43f5e', 'F_kv');

      // Right half: Live Phase Circle (Vòng tròn lượng giác)
      const pcX = w * 0.79;
      const pcY = h * 0.52;
      const pcR = Math.min(w * 0.14, h * 0.3);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(pcX, pcY, pcR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pcX - pcR - 14, pcY);
      ctx.lineTo(pcX + pcR + 14, pcY);
      ctx.moveTo(pcX, pcY - pcR - 14);
      ctx.lineTo(pcX, pcY + pcR + 14);
      ctx.stroke();

      const px = pcX + pcR * Math.cos(phase);
      const py = pcY - pcR * Math.sin(phase);
      drawArrow(ctx, pcX, pcY, px, py, '#38bdf8', 'M');
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, pcY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, pcY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      drawHudTag(ctx, pcX - 54, pcY - pcR - 20, 'Vòng tròn pha', '#cbd5e1');

      drawHudTag(ctx, 20, 26, `x = ${xCm.toFixed(2)} cm  |  v = ${vMs.toFixed(2)} m/s  |  ω = ${omega.toFixed(1)} rad/s`, '#e2e8f0');
      break;
    }

    case 'simple-pendulum': {
      const l = params.l ?? 1.0;
      const g = params.g ?? 9.81;
      const alpha0 = ((params.alpha0 ?? 12) * Math.PI) / 180;
      const omega = Math.sqrt(g / l);
      const alpha = alpha0 * Math.cos(omega * simTime);

      const pivotX = w * 0.5;
      const pivotY = 44;
      const Lpx = Math.min(h * 0.68, 95 + l * 65);
      const bobX = pivotX + Lpx * Math.sin(alpha);
      const bobY = pivotY + Lpx * Math.cos(alpha);

      // Ceiling support
      ctx.fillStyle = '#334155';
      ctx.fillRect(pivotX - 48, pivotY - 10, 96, 10);

      // Vertical reference line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pivotX, pivotY + Lpx + 28);
      ctx.stroke();
      ctx.setLineDash([]);

      // Trajectory arc
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, Lpx, Math.PI / 2 - alpha0, Math.PI / 2 + alpha0);
      ctx.stroke();

      // String
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Vectors: Gravity P, Tension T, Tangential restoring Pt
      drawArrow(ctx, bobX, bobY, bobX, bobY + 58, '#f43f5e', 'P');
      drawArrow(ctx, bobX, bobY, bobX - 66 * Math.sin(alpha), bobY - 66 * Math.cos(alpha), '#38bdf8', 'T_dây');

      // Brass bob
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bobX, bobY, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      drawHudTag(ctx, 20, 26, `α(t) = ${((alpha * 180) / Math.PI).toFixed(1)}°  |  l = ${l.toFixed(1)} m  |  T = ${(2 * Math.PI * Math.sqrt(l / g)).toFixed(3)} s`, '#e2e8f0');
      break;
    }

    case 'wave-interference': {
      const f = params.f ?? 20;
      const v = params.v ?? 40;
      const s1s2 = params.s1s2 ?? 12;
      const lambda = v / f; // cm
      const scale = Math.min((w * 0.56) / Math.max(8, s1s2), 26);
      const s1x = w * 0.5 - (s1s2 * scale) / 2;
      const s2x = w * 0.5 + (s1s2 * scale) / 2;
      const sy = h * 0.54;
      const lamPx = Math.max(12, lambda * scale);

      // Concentric wave crests from S1 and S2
      const phaseShift = (simTime * 2.5) % 1;
      const maxR = Math.hypot(w, h) * 0.65;
      const rings = Math.ceil(maxR / lamPx);

      for (let i = 0; i < rings; i++) {
        const r = (i + phaseShift) * lamPx;
        const alpha = Math.max(0.08, 0.55 - r / maxR);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(s1x, sy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s2x, sy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw antinodal markers along S1-S2 segment
      const maxK = Math.floor((s1s2 - 1e-6) / lambda);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s1x, sy);
      ctx.lineTo(s2x, sy);
      ctx.stroke();

      for (let k = -maxK; k <= maxK; k++) {
        const mx = w * 0.5 + (k * lambda * 0.5) * scale;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(mx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sources S1, S2
      [
        { x: s1x, label: 'S₁' },
        { x: s2x, label: 'S₂' },
      ].forEach((s) => {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(s.x, sy, 7, 0, Math.PI * 2);
        ctx.fill();
        drawHudTag(ctx, s.x - 8, sy + 24, s.label, '#fda4af');
      });

      drawHudTag(ctx, 20, 26, `λ = ${lambda.toFixed(2)} cm  |  Cực đại (chấm vàng): ${2 * maxK + 1} vân`, '#e2e8f0');
      break;
    }

    case 'young-double-slit': {
      const lambdaNm = params.lambda ?? 550;
      const aMm = params.a ?? 1.0;
      const Dm = params.D ?? 2.0;
      const Lmm = params.L ?? 15;
      const iMm = ((lambdaNm / 1000) * Dm) / aMm;
      const hex = wavelengthToHex(lambdaNm);

      const srcX = 54;
      const slitX = w * 0.34;
      const screenX = w * 0.78;
      const midY = h * 0.52;
      const slitGap = Math.max(14, Math.min(48, aMm * 18));

      // Laser beam from source to slits
      ctx.strokeStyle = hex;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(srcX, midY);
      ctx.lineTo(slitX, midY - slitGap / 2);
      ctx.moveTo(srcX, midY);
      ctx.lineTo(slitX, midY + slitGap / 2);
      ctx.stroke();

      // Slit plate
      ctx.fillStyle = '#475569';
      ctx.fillRect(slitX - 4, 44, 8, midY - slitGap / 2 - 48);
      ctx.fillRect(slitX - 4, midY - slitGap / 2 + 4, 8, slitGap - 8);
      ctx.fillRect(slitX - 4, midY + slitGap / 2 + 4, 8, h - 44 - (midY + slitGap / 2 + 4));

      // Expanding coherent fan to screen
      const grad = ctx.createLinearGradient(slitX, midY, screenX, midY);
      grad.addColorStop(0, `${hex}55`);
      grad.addColorStop(1, `${hex}14`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(slitX + 4, midY - slitGap / 2);
      ctx.lineTo(screenX, 46);
      ctx.lineTo(screenX, h - 46);
      ctx.lineTo(slitX + 4, midY + slitGap / 2);
      ctx.closePath();
      ctx.fill();

      // Realistic Interference Fringe Screen on right
      const scrH = h - 92;
      const scrTop = 46;
      const scrW = 72;
      ctx.fillStyle = '#020617';
      ctx.fillRect(screenX, scrTop, scrW, scrH);
      for (let py = 0; py < scrH; py++) {
        const xMm = ((py / scrH) - 0.5) * Lmm;
        const intensity = Math.pow(Math.cos((Math.PI * xMm) / iMm), 2);
        ctx.fillStyle = hex;
        ctx.globalAlpha = intensity;
        ctx.fillRect(screenX + 2, scrTop + py, scrW - 4, 1.5);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(screenX, scrTop, scrW, scrH);

      drawHudTag(ctx, 20, 26, `λ = ${lambdaNm} nm  |  Khoảng vân i = ${iMm.toFixed(3)} mm`, hex);
      drawHudTag(ctx, slitX - 28, h - 18, `a = ${aMm.toFixed(1)} mm`, '#94a3b8');
      drawHudTag(ctx, (slitX + screenX) / 2 - 26, h - 18, `D = ${Dm.toFixed(1)} m`, '#94a3b8');
      drawHudTag(ctx, screenX - 4, scrTop - 10, `Màn L=${Lmm}mm`, '#e2e8f0');
      break;
    }

    case 'coulomb-capacitor': {
      const q1 = params.q1 ?? 4;
      const q2 = params.q2 ?? -2;
      const r = params.r ?? 10;
      const U = params.U ?? 12;
      const d = params.d ?? 2;

      // Top zone: Two point charges Coulomb interaction
      const qY = h * 0.28;
      const distPx = Math.max(90, Math.min(w * 0.52, r * 12));
      const x1 = w * 0.5 - distPx / 2;
      const x2 = w * 0.5 + distPx / 2;
      const attract = q1 * q2 < 0;

      // Dashed distance line
      ctx.strokeStyle = '#475569';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, qY);
      ctx.lineTo(x2, qY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Force arrows
      const fDir = attract ? 1 : -1;
      drawArrow(ctx, x1, qY, x1 + fDir * 48, qY, '#fbbf24', 'F₁₂');
      drawArrow(ctx, x2, qY, x2 - fDir * 48, qY, '#fbbf24', 'F₂₁');

      const drawCharge = (x: number, y: number, q: number, name: string) => {
        ctx.fillStyle = q >= 0 ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.fillText(q >= 0 ? '+' : '−', x - 4, y + 5);
        drawHudTag(ctx, x - 26, y - 24, `${name}=${q}µC`, q >= 0 ? '#fca5a5' : '#93c5fd');
      };
      drawCharge(x1, qY, q1, 'q₁');
      drawCharge(x2, qY, q2, 'q₂');

      // Bottom zone: Parallel plate capacitor uniform electric field E
      const capTop = h * 0.58;
      const capBot = h * 0.88;
      const plateGap = Math.max(80, Math.min(w * 0.45, d * 28));
      const pLeft = w * 0.5 - plateGap / 2;
      const pRight = w * 0.5 + plateGap / 2;

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(pLeft - 8, capTop, 8, capBot - capTop);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(pRight, capTop, 8, capBot - capTop);

      // Uniform E field lines
      for (let i = 1; i <= 4; i++) {
        const ly = capTop + ((capBot - capTop) * i) / 5;
        drawArrow(ctx, pLeft + 6, ly, pRight - 6, ly, 'rgba(56, 189, 248, 0.7)', i === 1 ? 'E' : undefined, 1.5);
      }
      // Animated test charge drifting along E
      const drift = (simTime * 0.55) % 1;
      const tx = pLeft + 14 + drift * (plateGap - 28);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(tx, (capTop + capBot) / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      drawHudTag(ctx, 20, 24, `Tương tác Cu-lông (${attract ? 'Hút nhau' : 'Đẩy nhau'})  |  r = ${r} cm`, '#e2e8f0');
      drawHudTag(ctx, 20, capTop - 10, `Điện trường đều tụ phẳng: E = U/d = ${(U / (d / 100)).toFixed(0)} V/m`, '#38bdf8');
      break;
    }

    case 'ohms-closed-circuit': {
      const E = params.E ?? 12;
      const r = params.r ?? 2;
      const RN = params.RN ?? 4;
      const I = E / (RN + r);
      const UN = I * RN;

      const left = w * 0.18;
      const right = w * 0.82;
      const top = h * 0.24;
      const bot = h * 0.78;

      // Circuit loop
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(left, top, right - left, bot - top);

      // Animated current dots flowing clockwise (conventional current I)
      const speed = Math.min(260, 28 + I * 36);
      const perim = 2 * (right - left) + 2 * (bot - top);
      const nDots = 16;
      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < nDots; i++) {
        const dist = ((i / nDots) * perim + simTime * speed) % perim;
        let dx = left;
        let dy = top;
        const wLen = right - left;
        const hLen = bot - top;
        if (dist < wLen) {
          dx = left + dist;
          dy = top;
        } else if (dist < wLen + hLen) {
          dx = right;
          dy = top + (dist - wLen);
        } else if (dist < 2 * wLen + hLen) {
          dx = right - (dist - wLen - hLen);
          dy = bot;
        } else {
          dx = left;
          dy = bot - (dist - 2 * wLen - hLen);
        }
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Battery + internal resistor on top wire
      const midX = (left + right) / 2;
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(midX - 55, top - 24, 110, 48);
      // Battery plates
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(midX - 28, top - 18);
      ctx.lineTo(midX - 28, top + 18);
      ctx.lineWidth = 5;
      ctx.moveTo(midX - 16, top - 9);
      ctx.lineTo(midX - 16, top + 9);
      ctx.stroke();
      // Internal r box
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.strokeRect(midX + 2, top - 10, 40, 20);
      drawHudTag(ctx, midX - 42, top - 26, `ℰ=${E}V, r=${r}Ω`, '#fbbf24');

      // External resistor RN on bottom wire
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.fillRect(midX - 48, bot - 14, 96, 28);
      ctx.strokeRect(midX - 48, bot - 14, 96, 28);
      ctx.fillStyle = '#ecfdf5';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText(`R_N=${RN}Ω`, midX - 32, bot + 4);

      // Ammeter on right side
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(right, (top + bot) / 2, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('A', right - 4, (top + bot) / 2 + 5);

      drawHudTag(ctx, 20, 24, `I = ${I.toFixed(2)} A  |  U_N = ${UN.toFixed(2)} V  |  P_N = ${(I * I * RN).toFixed(2)} W`, '#e2e8f0');
      if (Math.abs(RN - r) < 0.05) {
        drawHudTag(ctx, 20, 44, '★ ĐẠT CỰC ĐẠI CÔNG SUẤT MẠCH NGOÀI (R_N = r, H = 50%)', '#34d399');
      }
      break;
    }

    case 'thermo-first-law': {
      const dT = params.dT ?? 25;
      const A = params.A ?? -15000;
      const Q = (params.m ?? 1.5) * (params.c ?? 4180) * dT;
      const dU = A + Q;

      const cylX = w * 0.28;
      const cylW = w * 0.44;
      const cylBot = h * 0.84;
      const cylTop = h * 0.2;

      // Piston height reacts to work A (<0 expands up, >0 compresses down)
      const expandFactor = Math.max(-0.22, Math.min(0.22, -A / 150000));
      const pistonY = h * 0.48 - expandFactor * (cylBot - cylTop) + Math.sin(simTime * 2) * 3;

      // Chamber interior thermal glow
      const tempRatio = Math.max(0, Math.min(1, (dT + 30) / 110));
      ctx.fillStyle = `rgba(${Math.round(40 + tempRatio * 200)}, ${Math.round(90 - tempRatio * 30)}, ${Math.round(210 - tempRatio * 170)}, 0.26)`;
      ctx.fillRect(cylX, pistonY, cylW, cylBot - pistonY);

      // Animated molecules inside chamber
      const speed = 25 + tempRatio * 95;
      ctx.fillStyle = tempRatio > 0.5 ? '#fb923c' : '#38bdf8';
      for (let i = 0; i < 24; i++) {
        const px = cylX + 12 + ((((i * 67 + simTime * speed * (i % 2 === 0 ? 1 : -1)) % (cylW - 24)) + (cylW - 24)) % (cylW - 24));
        const chH = Math.max(24, cylBot - pistonY - 16);
        const py = pistonY + 10 + ((((i * 43 + simTime * speed * (i % 3 === 0 ? 1 : -1)) % chH) + chH) % chH);
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cylinder glass walls
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cylX, cylTop);
      ctx.lineTo(cylX, cylBot);
      ctx.lineTo(cylX + cylW, cylBot);
      ctx.lineTo(cylX + cylW, cylTop);
      ctx.stroke();

      // Piston head
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cylX + 2, pistonY - 12, cylW - 4, 14);
      ctx.fillRect(cylX + cylW / 2 - 8, cylTop - 16, 16, pistonY - cylTop + 4);

      // Work arrow A
      if (Math.abs(A) > 500) {
        const up = A < 0;
        drawArrow(ctx, cylX + cylW / 2, pistonY - 22, cylX + cylW / 2, pistonY + (up ? -62 : 22), '#34d399', up ? 'Khí sinh công (A<0)' : 'Nhận công (A>0)');
      }
      // Heat transfer Q arrows at bottom
      if (Math.abs(Q) > 100) {
        const heating = Q > 0;
        for (let k = -1; k <= 1; k++) {
          const qx = cylX + cylW / 2 + k * 46;
          drawArrow(ctx, qx, heating ? cylBot + 36 : cylBot + 6, qx, heating ? cylBot + 6 : cylBot + 36, '#f43f5e');
        }
        drawHudTag(ctx, cylX + cylW + 14, cylBot - 6, heating ? `Nhận nhiệt Q = +${(Q / 1000).toFixed(1)} kJ` : `Tỏa nhiệt Q = ${(Q / 1000).toFixed(1)} kJ`, '#fda4af');
      }

      drawHudTag(ctx, 20, 26, `ΔU = A + Q = ${(dU / 1000).toFixed(2)} kJ  (${dU >= 0 ? 'Nội năng tăng' : 'Nội năng giảm'})`, '#e2e8f0');
      break;
    }

    case 'ideal-gas-kinetic': {
      const n = params.n ?? 1.0;
      const T = params.T ?? 300;
      const V = params.V ?? 10;
      const M = params.M ?? 28;
      const vRms = Math.sqrt((3 * PHYSICS_CONSTANTS.R_GAS * T) / (M * 1e-3));
      const pAtm = (n * PHYSICS_CONSTANTS.R_GAS * T) / (V * 1e-3) / 101325;

      const boxX = 64;
      const boxY = 58;
      const boxH = h - 98;
      const maxBoxW = w - 128;
      const boxW = Math.max(90, (V / 30) * maxBoxW);

      // Chamber
      ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Movable piston wall on right
      ctx.fillStyle = '#475569';
      ctx.fillRect(boxX + boxW - 6, boxY, 12, boxH);

      // Kinetic particles bouncing deterministically
      const count = Math.max(12, Math.min(60, Math.round(n * 24)));
      const speedPx = Math.max(30, Math.min(240, vRms * 0.22));
      const color = T > 500 ? '#f97316' : T < 250 ? '#38bdf8' : '#22d3ee';
      ctx.fillStyle = color;

      for (let i = 0; i < count; i++) {
        const ang = (i * 2.39996) % (Math.PI * 2);
        const vx = Math.cos(ang) * speedPx;
        const vy = Math.sin(ang) * speedPx;
        const xSpan = Math.max(20, boxW - 22);
        const ySpan = Math.max(20, boxH - 18);
        const rawX = Math.abs((((i * 37 + vx * simTime) % (2 * xSpan)) + 2 * xSpan) % (2 * xSpan) - xSpan);
        const rawY = Math.abs((((i * 53 + vy * simTime) % (2 * ySpan)) + 2 * ySpan) % (2 * ySpan) - ySpan);
        ctx.beginPath();
        ctx.arc(boxX + 9 + rawX, boxY + 9 + rawY, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }

      drawHudTag(ctx, 20, 26, `p = ${pAtm.toFixed(2)} atm  |  V = ${V.toFixed(1)} lít  |  T = ${T} K  |  v_rms = ${vRms.toFixed(0)} m/s`, '#e2e8f0');
      break;
    }

    case 'ac-generator-em': {
      const B = params.B ?? 0.25;
      const f = params.f ?? 50;
      const angle = (simTime * (f / 25) * 2.2) % (Math.PI * 2);

      // N & S Magnetic poles
      const poleY = h * 0.3;
      const poleH = h * 0.44;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(36, poleY, 44, poleH);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(w * 0.56, poleY, 44, poleH);
      ctx.fillStyle = '#fff';
      ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('N', 51, poleY + poleH / 2 + 6);
      ctx.fillText('S', w * 0.56 + 15, poleY + poleH / 2 + 6);

      // B field lines
      for (let i = 0; i < 5; i++) {
        const fy = poleY + 18 + (i * (poleH - 36)) / 4;
        drawArrow(ctx, 84, fy, w * 0.56 - 4, fy, 'rgba(56, 189, 248, 0.35)', i === 0 ? 'B' : undefined, 1.4);
      }

      // Rotating copper coil (foreshortened perspective)
      const cx = (80 + w * 0.56) / 2;
      const cy = poleY + poleH / 2;
      const coilW = 58 * Math.cos(angle);
      const coilH = 54;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - coilW, cy - coilH);
      ctx.lineTo(cx + coilW, cy - coilH + Math.sin(angle) * 14);
      ctx.lineTo(cx + coilW, cy + coilH + Math.sin(angle) * 14);
      ctx.lineTo(cx - coilW, cy + coilH);
      ctx.closePath();
      ctx.stroke();

      // Normal vector n
      drawArrow(ctx, cx, cy, cx + 48 * Math.cos(angle), cy - 48 * Math.sin(angle), '#34d399', 'n');

      // Right side live oscilloscope mini-preview of Φ(t) and e(t)
      const ox = w * 0.66;
      const ow = w * 0.3;
      const oy = h * 0.52;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox, h * 0.22, ow, h * 0.6);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + ow, oy);
      ctx.stroke();

      // Plot e(t) sine and Phi(t) cosine
      const amp = h * 0.22;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const px = ox + (i / 50) * ow;
        const py = oy - Math.sin(angle + (i / 50) * Math.PI * 2) * amp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const px = ox + (i / 50) * ow;
        const py = oy - Math.cos(angle + (i / 50) * Math.PI * 2) * amp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      drawHudTag(ctx, ox + 8, h * 0.22 - 8, 'e(t) xanh  ·  Φ(t) vàng (vuông pha π/2)', '#cbd5e1');
      drawHudTag(ctx, 20, 26, `B = ${B} T  |  f = ${f} Hz  |  Góc quay α = ${((angle * 180) / Math.PI).toFixed(0)}°`, '#e2e8f0');
      break;
    }

    case 'rlc-resonance': {
      const metrics = computeLessonMetrics(lessonId, params);
      const ZL = metrics.find((m) => m.key === 'ZL')?.value ?? 100;
      const ZC = metrics.find((m) => m.key === 'ZC')?.value ?? 100;
      const Z = metrics.find((m) => m.key === 'Z')?.value ?? 100;
      const R = params.R ?? 60;
      const phiDeg = metrics.find((m) => m.key === 'phiDeg')?.value ?? 0;
      const phiRad = (phiDeg * Math.PI) / 180;

      // Left half: Fresnel Impedance / Voltage Phasor Diagram
      const ox = w * 0.16;
      const oy = h * 0.56;
      const maxOhm = Math.max(120, R, ZL, ZC, Z);
      const sc = Math.min(w * 0.24, h * 0.34) / maxOhm;

      // Reference I axis
      drawArrow(ctx, ox, oy, ox + R * sc + 38, oy, '#64748b', 'I', 1.5);
      // U_R along I
      drawArrow(ctx, ox, oy, ox + R * sc, oy, '#34d399', `R=${R}Ω`, 2.6);
      // Z_L upward
      drawArrow(ctx, ox, oy, ox, oy - ZL * sc, '#38bdf8', `Z_L=${ZL.toFixed(0)}Ω`, 2.4);
      // Z_C downward
      drawArrow(ctx, ox, oy, ox, oy + ZC * sc, '#f472b6', `Z_C=${ZC.toFixed(0)}Ω`, 2.4);
      // Net Z vector
      const zx = ox + R * sc;
      const zy = oy - (ZL - ZC) * sc;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ox + R * sc, oy);
      ctx.lineTo(zx, zy);
      ctx.lineTo(ox, zy);
      ctx.stroke();
      ctx.setLineDash([]);
      drawArrow(ctx, ox, oy, zx, zy, '#fbbf24', `Z=${Z.toFixed(1)}Ω`, 3);

      // Right half: Live u(t) & i(t) Oscilloscope
      const sx = w * 0.54;
      const sw = w * 0.41;
      const sy = h * 0.54;
      const sh = h * 0.62;
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(sx, sy - sh / 2, sw, sh);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + sw, sy);
      ctx.stroke();

      const shift = simTime * 4;
      // i(t)
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i <= 70; i++) {
        const px = sx + (i / 70) * sw;
        const py = sy - Math.sin((i / 70) * Math.PI * 4 - shift) * (sh * 0.34);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // u(t) shifted by phiRad
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= 70; i++) {
        const px = sx + (i / 70) * sw;
        const py = sy - Math.sin((i / 70) * Math.PI * 4 - shift + phiRad) * (sh * 0.42);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const isResonant = Math.abs(ZL - ZC) < 2.5;
      drawHudTag(ctx, 20, 26, `Giản đồ Fresnel  |  φ = ${phiDeg.toFixed(1)}°  |  ${isResonant ? '★ ĐANG CỘNG HƯỞNG ĐIỆN (Z_L ≈ Z_C)' : ZL > ZC ? 'Mạch có tính cảm kháng (u sớm pha i)' : 'Mạch có tính dung kháng (u trễ pha i)'}`, isResonant ? '#34d399' : '#e2e8f0');
      drawHudTag(ctx, sx + 8, sy - sh / 2 - 8, 'Dao động ký: u(t) vàng · i(t) xanh lá', '#cbd5e1');
      break;
    }

    case 'photoelectric-bohr': {
      const lambdaNm = params.lambda ?? 280;
      const A_eV = params.A ?? 2.3;
      const nBohr = Math.round(params.nBohr ?? 3);
      const eps_eV =
        (PHYSICS_CONSTANTS.H_PLANCK * PHYSICS_CONSTANTS.C_LIGHT) /
        (lambdaNm * 1e-9) /
        PHYSICS_CONSTANTS.E_CHARGE;
      const occurs = eps_eV >= A_eV;
      const hex = wavelengthToHex(lambdaNm);

      // Left half: Photoelectric vacuum chamber
      const catX = 72;
      const anoX = w * 0.48;
      const topY = 64;
      const botY = h - 54;

      // Vacuum tube
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(44, topY, w * 0.48, botY - topY, 24);
      ctx.stroke();

      // Cathode & Anode plates
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(catX, topY + 24, 10, botY - topY - 48);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(anoX, topY + 24, 8, botY - topY - 48);
      drawHudTag(ctx, catX - 10, botY + 18, 'Catốt (K)', '#cbd5e1');
      drawHudTag(ctx, anoX - 12, botY + 18, 'Anốt (A)', '#cbd5e1');

      // Incoming photon wave packets striking cathode
      for (let i = 0; i < 4; i++) {
        const prog = ((simTime * 0.9 + i * 0.25) % 1);
        const px = anoX - 20 - prog * (anoX - catX - 30);
        const py = topY + 18 + prog * (botY - topY - 64) + i * 14;
        ctx.strokeStyle = hex;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let s = 0; s <= 12; s++) {
          const sx = px + s * 2.2;
          const sy = py + Math.sin(s * 1.4) * 4;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // Ejected photoelectrons if eps >= A
      if (occurs) {
        const keRatio = Math.min(2.5, Math.sqrt(eps_eV - A_eV));
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 8; i++) {
          const prog = (simTime * (0.5 + keRatio * 0.6) + i * 0.125) % 1;
          const ex = catX + 12 + prog * (anoX - catX - 16);
          const ey = topY + 36 + ((i * 23) % (botY - topY - 72));
          ctx.beginPath();
          ctx.arc(ex, ey, 3.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Right half: Bohr Hydrogen Atom stationary orbits
      const bx = w * 0.77;
      const by = h * 0.54;
      const maxR = Math.min(w * 0.18, h * 0.34);
      for (let n = 1; n <= 6; n++) {
        const rn = (n / 6) * maxR;
        ctx.strokeStyle = n === nBohr ? '#fbbf24' : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = n === nBohr ? 2.2 : 1;
        ctx.beginPath();
        ctx.arc(bx, by, rn, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Nucleus
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      // Orbiting electron on level nBohr
      const orbR = (nBohr / 6) * maxR;
      const eAng = simTime * (3.2 / nBohr);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(bx + orbR * Math.cos(eAng), by + orbR * Math.sin(eAng), 5, 0, Math.PI * 2);
      ctx.fill();
      drawHudTag(ctx, bx - 54, topY - 12, `Quỹ đạo Bo n = ${nBohr}`, '#fbbf24');

      drawHudTag(
        ctx,
        20,
        26,
        occurs
          ? `★ XẢY RA QUANG ĐIỆN (ε = ${eps_eV.toFixed(2)} eV ≥ A = ${A_eV.toFixed(2)} eV)`
          : `✖ KHÔNG XẢY RA QUANG ĐIỆN (ε = ${eps_eV.toFixed(2)} eV < A = ${A_eV.toFixed(2)} eV)`,
        occurs ? '#34d399' : '#f87171'
      );
      break;
    }

    case 'nuclear-decay': {
      const T = params.T ?? 8;
      const tTarget = params.t ?? 16;
      const tAnim = (simTime * 3.5) % Math.max(T * 4, tTarget + 4);
      const remainRatio = Math.pow(2, -tAnim / T);

      // Left half: 10x10 Radioactive Isotope Grid (100 representative nuclei)
      const cols = 10;
      const rows = 10;
      const startX = 48;
      const startY = 62;
      const cell = Math.min((w * 0.4) / cols, (h - 104) / rows);

      // Deterministic pseudo-random decay threshold per isotope cell
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          // Deterministic hash in (0, 1]
          const threshold = (((idx * 37 + 13) % 100) + 0.5) / 100;
          const alive = threshold <= remainRatio;
          const cx = startX + c * cell + cell / 2;
          const cy = startY + r * cell + cell / 2;
          ctx.fillStyle = alive ? '#38bdf8' : '#475569';
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
          ctx.fill();
          if (alive) {
            ctx.strokeStyle = '#bae6fd';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Right half: Live Exponential Half-Life Curve N(t) = N0 * 2^(-t/T)
      const gx = w * 0.53;
      const gy = h * 0.82;
      const gw = w * 0.41;
      const gh = h * 0.56;
      const tSpan = Math.max(T * 4, tTarget + 2);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(gx, gy - gh);
      ctx.lineTo(gx, gy);
      ctx.lineTo(gx + gw, gy);
      ctx.stroke();

      // Exponential curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const ti = (i / 60) * tSpan;
        const px = gx + (ti / tSpan) * gw;
        const py = gy - Math.pow(2, -ti / T) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Current marker at user slider tTarget
      const targetX = gx + (tTarget / tSpan) * gw;
      const targetY = gy - Math.pow(2, -tTarget / T) * gh;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      drawHudTag(ctx, targetX - 24, targetY - 10, `t=${tTarget}d`, '#fbbf24');

      // Animated tracer dot
      const animX = gx + (tAnim / tSpan) * gw;
      const animY = gy - remainRatio * gh;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(animX, animY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      drawHudTag(ctx, 20, 26, `Phóng xạ trực quan: t = ${tAnim.toFixed(1)} ngày  |  Còn lại ${(remainRatio * 100).toFixed(1)}% hạt mẹ`, '#e2e8f0');
      drawHudTag(ctx, startX, h - 18, 'Xanh: Hạt nhân mẹ chưa phân rã  ·  Xám: Đã phân rã thành hạt con', '#94a3b8');
      break;
    }
  }
}
