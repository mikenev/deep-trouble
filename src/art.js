// Applies Art Dev's sprite settings (scale, origin, animation) when a key has real art, and
// leaves placeholder shapes at scale 1 with a centred origin.
export function artInfo(scene, key) {
  const m = scene.registry.get('manifest') || {};
  const s = m.sprites?.[key];
  if (!s || !scene.registry.get('art')?.[key]) return null;
  return { ...s, scale: s.scale ?? m.scale ?? 1 };
}

export function dress(scene, obj, key) {
  const a = artInfo(scene, key);
  if (!a) { obj.setScale(1).setOrigin(0.5); return obj; }
  const fw = a.frameWidth || obj.frame.realWidth, fh = a.frameHeight || obj.frame.realHeight;
  obj.setScale(a.scale);
  if (a.origin) obj.setOrigin(a.origin[0] / fw, a.origin[1] / fh);
  if (a.frames > 1 && !a.once && obj.play) obj.play(`${key}-anim`);
  return obj;
}

// A physics body that covers most of what is drawn, in texture pixels (Arcade scales it).
export function fitBody(obj, fx = 0.8, fy = 0.7) {
  const w = obj.frame.realWidth, h = obj.frame.realHeight;
  obj.body.setSize(w * fx, h * fy);
  return obj;
}
