/**
 * The object that turns on the contact page, as geometry rather than as a
 * picture of geometry.
 *
 * It is one slab with a face on each side: the chain link on the front, the
 * envelope and its speech bubble on the back. Turning it is then simply
 * turning it — there is no flip, no pair of images swapping at the edge, and
 * nothing that stops looking right when it is halfway round. It is also
 * resolution-free, which is the other half of why it is built rather than
 * drawn: the artwork this replaces was a 280-pixel screen grab.
 *
 * `THREE` is passed in rather than imported so this file can be built twice —
 * once by the page and once by tools/preview-contact.mjs, which renders it
 * without a browser so the proportions can be looked at before they ship.
 */

/** The clay it is all made of, sampled off the reference renders. */
export const CLAY = {
  plate: 0x2c3c78,
  plateDeep: 0x1b2550,
  gold: 0xe4dc9c,
  pink: 0xecc5b6,
  pinkLit: 0xf3d3c6,
  pinkDeep: 0xdcaf9f,
  dot: 0x2a3a7a,
}

/** A rounded rectangle, which is most of what these icons are made of. */
function roundedRect(THREE, w, h, r) {
  const x = w / 2
  const y = h / 2
  const s = new THREE.Shape()
  s.moveTo(-x + r, -y)
  s.lineTo(x - r, -y)
  s.quadraticCurveTo(x, -y, x, -y + r)
  s.lineTo(x, y - r)
  s.quadraticCurveTo(x, y, x - r, y)
  s.lineTo(-x + r, y)
  s.quadraticCurveTo(-x, y, -x, y - r)
  s.lineTo(-x, -y + r)
  s.quadraticCurveTo(-x, -y, -x + r, -y)
  return s
}

/**
 * An extruded shape with its bevel, centred on its own thickness.
 *
 * The bevel is what makes it clay: a slab with a square edge reads as a box,
 * and every one of these shapes in the reference has a soft roll on the edge
 * catching the light.
 */
function slab(THREE, shape, depth, bevel = depth * 0.34, curveSegments = 24) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments,
  })
  geometry.translate(0, 0, -depth / 2 + bevel)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * The path a chain link runs along: a stadium, so the straight sides are
 * straight and the ends are true half-circles. Swept as a tube, it is a link.
 */
function linkPath(THREE, length, width) {
  const r = width / 2
  const run = Math.max(length - width, 0) / 2
  const perimeter = 4 * run + 2 * Math.PI * r

  return new (class extends THREE.Curve {
    getPoint(t, target = new THREE.Vector3()) {
      let d = (((t % 1) + 1) % 1) * perimeter
      if (d < 2 * run) return target.set(r, -run + d, 0)
      d -= 2 * run
      if (d < Math.PI * r) {
        const a = d / r
        return target.set(r * Math.cos(a), run + r * Math.sin(a), 0)
      }
      d -= Math.PI * r
      if (d < 2 * run) return target.set(-r, run - d, 0)
      d -= 2 * run
      const a = d / r
      return target.set(-r * Math.cos(a), -run - r * Math.sin(a), 0)
    }
  })()
}

/**
 * Builds the whole object and returns it, with every material it used so a
 * renderer can dispose of them.
 *
 * Everything is in plate widths: the slab is 2.2 across and each face sits a
 * little proud of it, which is what gives the shapes their own shadows on it.
 */
export function buildIcon(THREE) {
  const group = new THREE.Group()
  const made = []

  const clay = (color, roughness = 0.58) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
    made.push(m)
    return m
  }

  // ---- the slab everything sits on ----
  const plateDepth = 0.4
  const plate = new THREE.Mesh(
    slab(THREE, roundedRect(THREE, 2.2, 2.2, 0.62), plateDepth, 0.1, 32),
    clay(CLAY.plate, 0.64)
  )
  plate.rotation.z = 0.4
  group.add(plate)

  // ---- the front: two links, interlocked ----
  const chain = new THREE.Group()
  const gold = clay(CLAY.gold, 0.48)
  // Short and fat. The first try was long and thin, and two long links
  // overlapping at the middle is not a chain, it is a paperclip: they have to
  // meet end to end, with the second's arc sitting inside the first's hole.
  const length = 1.02
  const width = 0.64
  const tube = 0.12
  const linkGeometry = new THREE.TubeGeometry(
    linkPath(THREE, length, width),
    220,
    tube,
    18,
    true
  )

  // Both links are turned about the line they share, which is the axis the
  // chain runs along: the second a right angle further round than the first,
  // because that is what interlocks them, and the pair a further third of a
  // right angle so that neither is edge-on. Perpendicular links seen square on
  // give you one oval and one rod.
  //
  // This is a rotation of each link about its own centre, not of the group
  // around them. Turning the group swung the links out of the plane they sit
  // in and straight through the slab — a length of gold came out of the back
  // and hung over the envelope on the other side.
  const tilt = 0.62
  const first = new THREE.Mesh(linkGeometry, gold)
  first.rotation.y = tilt
  const second = new THREE.Mesh(linkGeometry, gold)
  second.rotation.y = tilt + Math.PI / 2
  // Far enough into the first's hole to be caught, near enough its end to read
  // as a join.
  second.position.y = -length * 0.78
  chain.add(first, second)

  chain.rotation.z = Math.PI * 0.28
  // Standing off the slab rather than on it. At this tilt a link reaches a
  // quarter of a unit behind its own centre, and the slab is only two tenths
  // thick: any closer and the chain is buried in it.
  chain.position.set(0.02, 0.18, plateDepth / 2 + 0.26)
  group.add(chain)

  // ---- the back: an envelope, and something being said ----
  const back = new THREE.Group()

  const body = new THREE.Mesh(
    slab(THREE, roundedRect(THREE, 1.55, 1.08, 0.07), 0.13, 0.04),
    clay(CLAY.pink, 0.56)
  )
  back.add(body)

  // The flap, as the two panels that fold down to make the V on the front of
  // every envelope: a half each, meeting on the crease. They are given
  // different shades because that is what an envelope does — the two halves of
  // a folded flap never catch the light at the same angle.
  const half = (side) => {
    const s = new THREE.Shape()
    const w = 1.55 / 2
    const h = 1.08 / 2
    s.moveTo(0, h)
    s.lineTo(side * w, h)
    s.lineTo(0, -h * 0.34)
    s.lineTo(0, h)
    return s
  }
  // Two tones rather than two angles, and it took a fold to find out why: the
  // flap is a sixth as thick as it is wide, so tipping the halves apart by
  // enough to light them differently swings their outer corners a quarter of a
  // unit backwards — clean through the pocket they are lying on. Any fold
  // shallow enough to stay in front is too shallow to see. So they are flat,
  // and the light they would have caught is painted on.
  for (const side of [-1, 1]) {
    const flap = new THREE.Mesh(
      slab(THREE, half(side), 0.05, 0.016, 8),
      clay(side < 0 ? CLAY.pinkLit : CLAY.pinkDeep, 0.56)
    )
    flap.position.z = 0.085
    back.add(flap)
  }

  // The speech bubble over its shoulder.
  const bubble = new THREE.Group()
  const puff = new THREE.Mesh(
    slab(THREE, roundedRect(THREE, 0.66, 0.44, 0.18), 0.13, 0.04),
    clay(CLAY.gold, 0.48)
  )
  bubble.add(puff)
  const tail = new THREE.Mesh(
    slab(
      THREE,
      (() => {
        const s = new THREE.Shape()
        s.moveTo(-0.14, 0.06)
        s.lineTo(0.1, 0.06)
        s.lineTo(-0.1, -0.2)
        s.lineTo(-0.14, 0.06)
        return s
      })(),
      0.12,
      0.03,
      8
    ),
    clay(CLAY.gold, 0.48)
  )
  tail.position.set(-0.16, -0.2, 0)
  bubble.add(tail)
  for (const x of [-0.17, 0, 0.17]) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), clay(CLAY.dot, 0.5))
    dot.position.set(x, 0, 0.07)
    bubble.add(dot)
  }
  bubble.position.set(0.72, 0.66, 0.02)
  back.add(bubble)

  back.rotation.z = -0.16
  back.position.set(-0.02, -0.04, -(plateDepth / 2 + 0.02))
  // Turned to face the other way, so it is the right way up when the slab has
  // turned round to show it.
  back.rotation.y = Math.PI
  group.add(back)

  return { group, materials: made }
}
