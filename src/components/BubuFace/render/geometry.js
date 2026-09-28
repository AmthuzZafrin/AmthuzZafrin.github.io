export function getFaceGeometry(w, h) {
  const shellMargin = w * 0.06;
  const shellX = shellMargin;
  const shellY = shellMargin;
  const shellW = w - shellMargin * 2;
  const shellH = h - shellMargin * 2;
  const shellRadius = shellW * 0.16;

  const screenInset = shellW * 0.055;
  const screenX = shellX + screenInset;
  const screenY = shellY + shellH * 0.15;
  const screenW = shellW - screenInset * 2;
  const screenH = shellH * 0.72;
  const screenRadius = shellRadius * 0.6;

  const eyeW = screenW * 0.24;
  const eyeH = eyeW * 0.86;
  const eyeY = screenY + screenH * 0.37 - eyeH / 2;
  const eyeGapRatio = 0.215;
  const leftEyeX = screenX + screenW * (0.5 - eyeGapRatio) - eyeW / 2;
  const rightEyeX = screenX + screenW * (0.5 + eyeGapRatio) - eyeW / 2;

  const mouthY = screenY + screenH * 0.7;
  const mouthW = screenW * 0.17;
  const mouthCx = screenX + screenW / 2;

  return {
    shellX,
    shellY,
    shellW,
    shellH,
    shellRadius,
    screenX,
    screenY,
    screenW,
    screenH,
    screenRadius,
    eyeW,
    eyeH,
    eyeY,
    leftEyeX,
    rightEyeX,
    mouthY,
    mouthW,
    mouthCx,
  };
}
