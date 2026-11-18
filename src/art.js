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
  plant(scene, obj, key);
  if (a.frames > 1 && !a.once && obj.play) obj.play(`${key}-anim`);
  return obj;
}

// A physics body that covers most of what is drawn, in texture pixels (Arcade scales it).
export function fitBody(obj, fx = 0.8, fy = 0.7) {
  const w = obj.frame.realWidth, h = obj.frame.realHeight;
  obj.body.setSize(w * fx, h * fy);
  return obj;
}

// Sets the art origin, mirrored when the sprite is flipped, so the body stays put when it turns.
export function plant(scene, obj, key) {
  const a = artInfo(scene, key);
  if (!a?.origin) return obj;
  const fw = a.frameWidth || obj.frame.realWidth, fh = a.frameHeight || obj.frame.realHeight;
  const ox = obj.flipX ? fw - a.origin[0] : a.origin[0];
  return obj.setOrigin(ox / fw, a.origin[1] / fh);
}

// World position of a pixel in the sprite's frame (art space), honouring origin, scale, flip and angle.
export function framePoint(obj, px, py) {
  const fw = obj.frame.realWidth, x = obj.flipX ? fw - px : px; // a flipped sprite mirrors its frame
  const dx = (x - obj.originX * fw) * obj.scaleX;
  const dy = (py - obj.originY * obj.frame.realHeight) * obj.scaleY;
  const c = Math.cos(obj.rotation), s = Math.sin(obj.rotation);
  return { x: obj.x + dx * c - dy * s, y: obj.y + dx * s + dy * c };
}

// Fit the physics body to a box [x, y, w, h] in frame pixels (the art's "body" or a placeholder box),
// mirrored when the sprite is flipped so a long tail never counts as a hit.
export function setBox(scene, obj, key, fallback) {
  const box = artInfo(scene, key)?.body || (!artInfo(scene, key) && fallback);
  if (!box || !obj.body) return false;
  const [x, y, w, h] = box, fw = obj.frame.realWidth;
  obj.body.setSize(w, h, false).setOffset(obj.flipX ? fw - x - w : x, y);
  return true;
}
