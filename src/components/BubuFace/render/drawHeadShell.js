import { getOrCreateCanvas } from './offscreenCache';
import { getFaceGeometry } from './geometry';
import { roundedRectPath, hexToRgba } from './path';
import { COLORS } from '../constants';

function drawEarBump(ctx, cx, cy, length, glowColor, innerDir = 0) {
  const width = length * 0.23;
  const x0 = cx - width / 2;
  const y0 = cy - length / 2;

  roundedRectPath(ctx, x0, y0, width, length, width / 2);
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = glowColor;
  ctx.stroke();
  ctx.restore();

  const overhang = length * 0.12;
  const lineX = cx + innerDir * width * 0.28;
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.beginPath();
  ctx.moveTo(lineX, y0 - overhang);
  ctx.lineTo(lineX, y0 + length + overhang);
  ctx.stroke();
  ctx.restore();
}

function drawTopDetails(ctx, g) {
  const camX = g.shellX + g.shellW / 2;
  const camY = g.shellY + g.shellH * 0.08;
  const camR = g.shellW * 0.014;

  // camera housing — a dark capsule the lens dot sits inside, echoing the grille's housing
  const camHousingW = camR * 5.2;
  const camHousingH = camR * 2.6;
  ctx.save();
  ctx.fillStyle = 'rgba(20,18,26,0.55)';
  roundedRectPath(
    ctx,
    camX - camHousingW / 2,
    camY - camHousingH / 2,
    camHousingW,
    camHousingH,
    camHousingH / 2
  );
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = COLORS.glowSecondary;
  ctx.shadowBlur = g.shellW * 0.02;
  const camGrad = ctx.createRadialGradient(camX, camY, 0, camX, camY, camR);
  camGrad.addColorStop(0, '#4a4a52');
  camGrad.addColorStop(0.55, '#2a2a30');
  camGrad.addColorStop(1, '#101013');
  ctx.beginPath();
  ctx.arc(camX, camY, camR, 0, Math.PI * 2);
  ctx.fillStyle = camGrad;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke();
  ctx.restore();

  const grilleY = camY + g.shellH * 0.045;
  const grilleW = g.shellW * 0.18;
  const dots = 9;

  ctx.save();
  ctx.fillStyle = 'rgba(20,18,26,0.55)';
  roundedRectPath(ctx, camX - grilleW / 2 - 3, grilleY - 3, grilleW + 6, 6, 3);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < dots; i++) {
    const gx = camX - grilleW / 2 + (grilleW / (dots - 1)) * i;
    ctx.save();
    ctx.shadowColor = COLORS.glowSecondary;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(gx, grilleY, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = '#3a3a42';
    ctx.fill();
    ctx.restore();
  }
}

function buildShell(ctx, w, h) {
  const g = getFaceGeometry(w, h);
  const { shellX, shellY, shellW, shellH, shellRadius } = g;

  // base material — one directional light source, top-left to bottom-right
  roundedRectPath(ctx, shellX, shellY, shellW, shellH, shellRadius);
  const base = ctx.createLinearGradient(shellX, shellY, shellX + shellW, shellY + shellH);
  base.addColorStop(0, '#332f42');
  base.addColorStop(0.45, COLORS.shellBase);
  base.addColorStop(1, COLORS.shellShadow);
  ctx.fillStyle = base;
  ctx.fill();

  // soft ambient glow wash so the grey shell reads as lit, not flat/dull
  ctx.save();
  roundedRectPath(ctx, shellX, shellY, shellW, shellH, shellRadius);
  ctx.clip();
  const ambient = ctx.createRadialGradient(
    shellX + shellW / 2,
    shellY + shellH * 0.45,
    0,
    shellX + shellW / 2,
    shellY + shellH * 0.45,
    shellW * 0.75
  );
  ambient.addColorStop(0, hexToRgba(COLORS.glowSecondary, 0.14));
  ambient.addColorStop(1, hexToRgba(COLORS.glowSecondary, 0));
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = ambient;
  ctx.fillRect(shellX, shellY, shellW, shellH);
  ctx.restore();

  // specular sheen, upper-left
  ctx.save();
  roundedRectPath(ctx, shellX, shellY, shellW, shellH, shellRadius);
  ctx.clip();
  const sheen = ctx.createRadialGradient(
    shellX + shellW * 0.28,
    shellY + shellH * 0.2,
    0,
    shellX + shellW * 0.28,
    shellY + shellH * 0.2,
    shellW * 0.6
  );
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = sheen;
  ctx.fillRect(shellX, shellY, shellW, shellH);
  ctx.restore();

  // ambient occlusion near the interior edge
  ctx.save();
  roundedRectPath(ctx, shellX, shellY, shellW, shellH, shellRadius);
  ctx.clip();
  roundedRectPath(ctx, shellX, shellY, shellW, shellH, shellRadius);
  ctx.lineWidth = shellW * 0.05;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = shellW * 0.04;
  ctx.stroke();
  ctx.restore();

  // bevel — outer edge light-to-dark, inner inset edge dark-to-light
  roundedRectPath(ctx, shellX, shellY, shellW, shellH, shellRadius);
  const outerStroke = ctx.createLinearGradient(shellX, shellY, shellX, shellY + shellH);
  outerStroke.addColorStop(0, 'rgba(255,255,255,0.35)');
  outerStroke.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.lineWidth = 2;
  ctx.strokeStyle = outerStroke;
  ctx.stroke();

  const insetPad = shellW * 0.012;
  roundedRectPath(
    ctx,
    shellX + insetPad,
    shellY + insetPad,
    shellW - insetPad * 2,
    shellH - insetPad * 2,
    shellRadius * 0.85
  );
  const innerStroke = ctx.createLinearGradient(shellX, shellY + shellH, shellX, shellY);
  innerStroke.addColorStop(0, 'rgba(255,255,255,0.18)');
  innerStroke.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.lineWidth = 2;
  ctx.strokeStyle = innerStroke;
  ctx.stroke();

  // subtle static rim-light tracing the outer silhouette
  ctx.save();
  roundedRectPath(ctx, shellX, shellY, shellW, shellH, shellRadius);
  ctx.clip();
  roundedRectPath(ctx, shellX, shellY, shellW, shellH, shellRadius);
  const rim = ctx.createLinearGradient(shellX, shellY, shellX + shellW, shellY + shellH);
  rim.addColorStop(0, hexToRgba(COLORS.glowSecondary, 0.35));
  rim.addColorStop(0.4, hexToRgba(COLORS.glowSecondary, 0.08));
  rim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rim;
  ctx.shadowColor = COLORS.glowSecondary;
  ctx.shadowBlur = shellW * 0.015;
  ctx.stroke();
  ctx.restore();

  drawTopDetails(ctx, g);
  drawEarBump(
    ctx,
    shellX - shellW * 0.015,
    shellY + shellH * 0.357,
    shellH * 0.18,
    COLORS.glowPrimary,
    1
  );
  drawEarBump(
    ctx,
    shellX + shellW + shellW * 0.015,
    shellY + shellH * 0.357,
    shellH * 0.18,
    COLORS.glowPrimary,
    -1
  );
}

/** Cached offscreen head-shell layer — rebuilt only on resize/DPR change. */
export function getShellLayer(w, h, dpr) {
  return getOrCreateCanvas('shell', w, h, dpr, buildShell);
}
