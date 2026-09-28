/**
 * Renders the contact page's object without a browser.
 *
 *     node tools/preview-contact.mjs <out.ppm> [turns]
 *
 * It builds the same geometry the page builds — src/components/contactObject.js
 * is imported by both, so there is no second copy to drift — projects it, and
 * rasterises it with a z-buffer and a flat Lambert. It is not the page's
 * renderer and is not trying to be: it is here so the proportions, the
 * interlock of the links and the fold of the envelope can be looked at and
 * corrected before any of it is shipped, on a machine with no display.
 *
 * PPM out, because it is six lines to write and Pillow turns it into a PNG.
 */

import { writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { buildIcon } from '../src/components/contactObject.js'

const OUT = process.argv[2] ?? 'preview.ppm'
const TURNS = (process.argv[3] ?? '0,0.5,0.25').split(',').map(Number)
const SIZE = 460
const BG = [10, 10, 18]

// Roughly the page's lighting: a key from over your left shoulder, a cool fill
// from below right, and enough ambient that nothing goes to pure black.
const KEY = new THREE.Vector3(-0.45, 0.8, 0.9).normalize()
const FILL = new THREE.Vector3(0.7, -0.5, 0.45).normalize()
const AMBIENT = 0.4

function triangles(root) {
  const out = []
  root.updateMatrixWorld(true)
  root.traverse((node) => {
    if (!node.isMesh) return
    const g = node.geometry
    const pos = g.attributes.position
    const nor = g.attributes.normal
    const idx = g.index
    const count = idx ? idx.count : pos.count
    const colour = new THREE.Color(node.material.color)
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(node.matrixWorld)

    for (let i = 0; i < count; i += 3) {
      const tri = []
      const normals = []
      for (let k = 0; k < 3; k += 1) {
        const v = idx ? idx.getX(i + k) : i + k
        tri.push(
          new THREE.Vector3(pos.getX(v), pos.getY(v), pos.getZ(v)).applyMatrix4(node.matrixWorld)
        )
        normals.push(
          new THREE.Vector3(nor.getX(v), nor.getY(v), nor.getZ(v))
            .applyMatrix3(normalMatrix)
            .normalize()
        )
      }
      const n = normals[0].clone().add(normals[1]).add(normals[2]).normalize()
      out.push({ tri, n, colour })
    }
  })
  return out
}

function render(root, turn) {
  root.rotation.set(-0.16, turn * Math.PI * 2, 0)

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0.25, 6.4)
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld(true)
  const viewProjection = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  )

  const pixels = new Uint8Array(SIZE * SIZE * 3)
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    pixels[i * 3] = BG[0]
    pixels[i * 3 + 1] = BG[1]
    pixels[i * 3 + 2] = BG[2]
  }
  const depth = new Float32Array(SIZE * SIZE).fill(Infinity)

  for (const { tri, n, colour } of triangles(root)) {
    const screen = tri.map((p) => {
      const q = p.clone().applyMatrix4(viewProjection)
      return { x: (q.x * 0.5 + 0.5) * SIZE, y: (0.5 - q.y * 0.5) * SIZE, z: q.z }
    })
    if (screen.some((p) => p.z < -1 || p.z > 1)) continue

    // Back faces are never seen on closed solids, and skipping them is also
    // what keeps the inside of the slab from painting over its own front.
    const area =
      (screen[1].x - screen[0].x) * (screen[2].y - screen[0].y) -
      (screen[2].x - screen[0].x) * (screen[1].y - screen[0].y)
    if (area >= 0) continue

    const light =
      AMBIENT +
      0.72 * Math.max(0, n.dot(KEY)) +
      0.22 * Math.max(0, n.dot(FILL))
    const shade = [
      Math.min(255, colour.r * 255 * light),
      Math.min(255, colour.g * 255 * light),
      Math.min(255, colour.b * 255 * light),
    ]

    const minX = Math.max(0, Math.floor(Math.min(...screen.map((p) => p.x))))
    const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(...screen.map((p) => p.x))))
    const minY = Math.max(0, Math.floor(Math.min(...screen.map((p) => p.y))))
    const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(...screen.map((p) => p.y))))

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const px = x + 0.5
        const py = y + 0.5
        const w0 =
          ((screen[1].x - screen[0].x) * (py - screen[0].y) -
            (px - screen[0].x) * (screen[1].y - screen[0].y)) / area
        const w1 =
          ((px - screen[0].x) * (screen[2].y - screen[0].y) -
            (screen[2].x - screen[0].x) * (py - screen[0].y)) / area
        if (w0 < 0 || w1 < 0 || w0 + w1 > 1) continue
        const z = screen[0].z * (1 - w0 - w1) + screen[1].z * w1 + screen[2].z * w0
        const at = y * SIZE + x
        if (z >= depth[at]) continue
        depth[at] = z
        pixels[at * 3] = shade[0]
        pixels[at * 3 + 1] = shade[1]
        pixels[at * 3 + 2] = shade[2]
      }
    }
  }
  return pixels
}

const { group } = buildIcon(THREE)
const frames = TURNS.map((t) => render(group, t))

// Side by side, so one look covers the front, the back and the way round.
const width = SIZE * frames.length
const sheet = Buffer.alloc(width * SIZE * 3)
frames.forEach((frame, f) => {
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const from = (y * SIZE + x) * 3
      const to = (y * width + f * SIZE + x) * 3
      sheet[to] = frame[from]
      sheet[to + 1] = frame[from + 1]
      sheet[to + 2] = frame[from + 2]
    }
  }
})

writeFileSync(OUT, Buffer.concat([Buffer.from(`P6\n${width} ${SIZE}\n255\n`), sheet]))
console.log(`${OUT}  ${width}x${SIZE}  turns ${TURNS.join(', ')}`)
