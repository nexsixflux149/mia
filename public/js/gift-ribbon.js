/** Place ribbon strips on the exposed faces of a parcel. The top cross has one shared center strip. */
export function wrapGift(addStrip, { width, depth, bottom, lidBottom, top, lidWidth, lidDepth, ribbonWidth }) {
  const thickness = .006;
  const halfRibbon = ribbonWidth / 2;
  for (const [w, d, base, upper] of [[width, depth, bottom, lidBottom], [lidWidth, lidDepth, lidBottom, top]]) {
    const height = upper - base, y = (base + upper) / 2;
    for (const sign of [-1, 1]) {
      addStrip(0, y, sign * (d + thickness) / 2, ribbonWidth, height, thickness);
      addStrip(sign * (w + thickness) / 2, y, 0, thickness, height, ribbonWidth);
    }
  }
  const y = top + thickness / 2;
  addStrip(0, y, 0, ribbonWidth, thickness, lidDepth);
  const arm = (lidWidth - ribbonWidth) / 2;
  for (const sign of [-1, 1]) {
    addStrip(sign * (halfRibbon + arm / 2), y, 0, arm, thickness, ribbonWidth);
  }
}
