import * as THREE from "three";
import "./style.css";

const $ = (id) => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
let seed = 73912;
const rand = (a = 0, b = 1) => {
  seed = (seed * 16807) % 2147483647;
  return a + (seed / 2147483647) * (b - a);
};
const scene = new THREE.Scene();
scene.background = new THREE.Color("#9bab91");
scene.fog = new THREE.FogExp2("#9bab91", 0.0105);
const renderer = new THREE.WebGLRenderer({
  canvas: $("world"),
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
const camera = new THREE.PerspectiveCamera(
  44,
  innerWidth / innerHeight,
  0.1,
  260,
);
scene.add(new THREE.HemisphereLight("#e7ecc6", "#375649", 2.3));
const sunlight = new THREE.DirectionalLight("#ffdfa3", 3.1);
sunlight.position.set(-35, 55, 22);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -65;
sunlight.shadow.camera.right = 65;
sunlight.shadow.camera.top = 65;
sunlight.shadow.camera.bottom = -65;
sunlight.shadow.camera.near = 1;
sunlight.shadow.camera.far = 160;
sunlight.shadow.normalBias = 0.08;
sunlight.shadow.bias = -0.00015;
scene.add(sunlight);
const materials = new Map();
function mat(color, extras = {}) {
  const key = color + JSON.stringify(extras);
  if (!materials.has(key))
    materials.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        flatShading: true,
        ...extras,
      }),
    );
  return materials.get(key);
}
function mesh(geometry, color, parent = scene, extras = {}) {
  const m = new THREE.Mesh(geometry, mat(color, extras));
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(x, y, z, w, h, d, color, parent = scene, extras) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), color, parent, extras);
  m.position.set(x, y, z);
  return m;
}
function ball(x, y, z, radius, color, parent = scene, detail = 0) {
  const m = mesh(new THREE.IcosahedronGeometry(radius, detail), color, parent);
  m.position.set(x, y, z);
  return m;
}
function cyl(x, y, z, top, bottom, height, color, parent = scene, sides = 8) {
  const m = mesh(
    new THREE.CylinderGeometry(top, bottom, height, sides),
    color,
    parent,
  );
  m.position.set(x, y, z);
  return m;
}
function ring(radius, color, parent = scene, width = 0.07) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(radius - width, radius, 56),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.09;
  parent.add(m);
  return m;
}
const colliders = [];
function obstacle(x, z, radius) {
  colliders.push({ x, z, radius });
}
const terrain = mesh(new THREE.PlaneGeometry(190, 190, 50, 50), "#577344");
terrain.rotation.x = -Math.PI / 2;
terrain.castShadow = false;
const colors = [];
const attr = terrain.geometry.attributes.position;
for (let i = 0; i < attr.count; i++) {
  const x = attr.getX(i),
    z = -attr.getY(i);
  const shade = 0.88 + rand(0, 0.17);
  const c = new THREE.Color(z < -30 ? "#435e47" : "#637c45").multiplyScalar(
    shade,
  );
  colors.push(c.r, c.g, c.b);
}
terrain.geometry.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(colors, 3),
);
terrain.material = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 1,
});
function path(points, width, color) {
  const vertices = [],
    indices = [];
  points.forEach(([x, z], i) => {
    const p = points[Math.max(0, i - 1)],
      n = points[Math.min(points.length - 1, i + 1)];
    const dx = n[0] - p[0],
      dz = n[1] - p[1],
      len = Math.hypot(dx, dz) || 1;
    vertices.push(
      x - ((dz / len) * width) / 2,
      0.028,
      z + ((dx / len) * width) / 2,
      x + ((dz / len) * width) / 2,
      0.028,
      z - ((dx / len) * width) / 2,
    );
    if (i < points.length - 1) {
      const j = i * 2;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const m = mesh(g, color);
  m.castShadow = false;
  m.material.side = THREE.DoubleSide;
}
path(
  [
    [-34, 45],
    [-17, 32],
    [0, 25],
    [3, 14],
    [0, 4],
    [0, -8],
    [6, -19],
    [0, -32],
    [0, -48],
  ],
  5,
  "#a49a6b",
);
path(
  [
    [0, 23],
    [-9, 18],
    [-20, 13],
    [-30, 9],
  ],
  3.8,
  "#a49a6b",
);
path(
  [
    [3, -12],
    [15, -18],
    [24, -18],
  ],
  3.5,
  "#8f8964",
);
// A shallow river, a timber crossing, and reeds along its banks.
path(
  [
    [-91, -3],
    [-45, -5],
    [-20, -2],
    [0, -4],
    [30, -3],
    [60, -8],
    [91, -3],
  ],
  8,
  "#a7a17b",
);
const river = mesh(new THREE.PlaneGeometry(190, 4.7, 80, 2), "#68a9a4", scene, {
  transparent: true,
  opacity: 0.87,
  metalness: 0.25,
  roughness: 0.3,
});
river.rotation.x = -Math.PI / 2;
river.position.set(0, 0.045, -4);
river.castShadow = false;
const waterLines = [];
for (let i = 0; i < 50; i++) {
  const line = box(
    rand(-80, 80),
    0.07,
    rand(-6, -2),
    rand(0.4, 2),
    0.015,
    0.025,
    "#c7d6b3",
  );
  line.castShadow = false;
  waterLines.push(line);
}
for (let i = 0; i < 14; i++)
  box(0, 0.3, -8 + i * 0.61, 4.8, 0.28, 0.56, i % 3 ? "#79664a" : "#947d52");
for (const x of [-2.4, 2.4]) {
  box(x, 1.05, -4, 0.14, 0.17, 9, "#584c3a");
  for (const z of [-8, -5.5, -3, 0])
    box(x, 0.75, z, 0.23, 1.5, 0.23, "#5c503c");
}
function tree(x, z, scale = 1, autumn = false, pine = false) {
  const g = new THREE.Group();
  scene.add(g);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  cyl(0, 2, 0, 0.23, 0.43, 4.8, "#665340", g, 6);
  if (pine) {
    for (let j = 0; j < 3; j++) {
      const m = mesh(
        new THREE.ConeGeometry(2.5 - j * 0.5, 3.8 - j * 0.4, 7),
        ["#345b48", "#406a4e", "#517957"][j],
        g,
      );
      m.position.y = 3.6 + j * 1.5;
    }
  } else {
    const palette = autumn
      ? ["#b3a14f", "#cfb761", "#91984e"]
      : ["#658a49", "#7d9852", "#92a25b"];
    ball(0, 5.2, 0, 2.6, palette[0], g, 1).scale.set(1.15, 0.86, 1);
    ball(-1.4, 4.8, 0.6, 1.9, palette[1], g, 0);
    ball(1.4, 4.9, -0.5, 1.85, palette[2], g, 0);
  }
  obstacle(x, z, 0.5 * scale);
}
for (let i = 0; i < 115; i++) {
  const x = rand(-68, 68),
    z = rand(-65, 60);
  if (
    Math.abs(x) < 7 ||
    Math.abs(z + 4) < 6 ||
    Math.hypot(x + 12, z - 29) < 16 ||
    Math.hypot(x + 20, z - 13) < 8 ||
    Math.hypot(x - 18, z + 18) < 10 ||
    Math.hypot(x, z + 43) < 15
  )
    continue;
  tree(x, z, rand(0.9, 1.55), rand() > 0.5, z < -22 || rand() > 0.75);
}
for (let i = 0; i < 13; i++)
  tree(-35 + i * 5.5, -61 - rand(0, 9), rand(1.5, 2), false, true);
for (let i = 0; i < 28; i++) {
  const x = rand(-60, 60),
    z = rand(-62, 55);
  if (Math.abs(x) < 7 || Math.hypot(x + 13, z - 28) < 15 || Math.abs(z + 4) < 5)
    continue;
  const rock = ball(x, 0.4, z, rand(0.7, 2), "#849080");
  rock.scale.set(1.3, 0.7, 0.8);
  obstacle(x, z, rock.geometry.parameters.radius * 0.8);
}
// Background hills remain outside the traversable valley.
for (let i = 0; i < 14; i++) {
  const hill = mesh(
    new THREE.ConeGeometry(rand(14, 27), rand(18, 32), 5),
    i % 2 ? "#647969" : "#71816e",
  );
  hill.position.set(-96 + i * 15, 7, -88 - rand(0, 12));
  hill.rotation.y = rand(0, 5);
}
const grassGeometry = new THREE.ConeGeometry(0.12, 0.65, 3);
const grass = new THREE.InstancedMesh(grassGeometry, mat("#8fa35b"), 1300);
const dummy = new THREE.Object3D();
for (let i = 0; i < 1300; i++) {
  let x = rand(-70, 70),
    z = rand(-64, 60);
  if (Math.abs(x) < 5 || Math.abs(z + 4) < 5) x += x >= 0 ? 8 : -8;
  dummy.position.set(x, 0.2, z);
  dummy.rotation.set(rand(-0.25, 0.25), rand(0, 6), rand(-0.3, 0.3));
  dummy.scale.setScalar(rand(0.6, 1.4));
  dummy.updateMatrix();
  grass.setMatrixAt(i, dummy.matrix);
}
scene.add(grass);
const flowers = new THREE.InstancedMesh(
  new THREE.IcosahedronGeometry(0.09),
  mat("#d4c58d"),
  170,
);
for (let i = 0; i < 170; i++) {
  dummy.position.set(rand(-34, 25), 0.35, rand(6, 44));
  dummy.scale.setScalar(1);
  dummy.updateMatrix();
  flowers.setMatrixAt(i, dummy.matrix);
}
scene.add(flowers);
function roof(x, y, z, w, h, d, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(0, h);
  shape.lineTo(w / 2, 0);
  shape.closePath();
  const m = mesh(
    new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }),
    color,
  );
  m.position.set(x, y, z - d / 2);
  return m;
}
function house(x, z, w = 7, d = 6) {
  box(x, 2.2, z, w, 4.4, d, "#d4c49d");
  box(x, 0.4, z, w + 0.3, 0.8, d + 0.3, "#828574");
  roof(x, 4.4, z, w + 1.2, 3.1, d + 1.2, "#536e80");
  for (const dx of [-w / 2 + 0.1, 0, w / 2 - 0.1])
    box(x + dx, 2.6, z + d / 2 + 0.035, 0.2, 3.6, 0.17, "#685943");
  box(x, 3.9, z + d / 2 + 0.06, w, 0.22, 0.18, "#6b5b43");
  box(x, 1.45, z + d / 2 + 0.1, 1.3, 2.1, 0.18, "#645440");
  for (const dx of [-2, 2]) {
    box(x + dx, 2.65, z + d / 2 + 0.13, 1.1, 1.3, 0.12, "#594e3e");
    box(x + dx, 2.65, z + d / 2 + 0.22, 0.82, 1.05, 0.08, "#e8c981", scene, {
      emissive: "#eebd5c",
      emissiveIntensity: 0.45,
    });
    box(x + dx, 2.65, z + d / 2 + 0.28, 0.07, 1.1, 0.08, "#776549");
  }
  box(x + w * 0.26, 6.2, z - 1, 0.9, 3.5, 0.9, "#898875");
  obstacle(x, z, Math.max(w, d) * 0.58);
}
house(-16, 30, 8, 7);
house(-27, 22, 6, 5);
house(14, 33, 6, 6);
function tower(x, z) {
  cyl(x, 4.8, z, 2.5, 2.8, 9.6, "#b3b6a0", scene, 8);
  cyl(x, 9.8, z, 2.85, 2.85, 0.7, "#898e7c");
  const top = mesh(new THREE.ConeGeometry(3.6, 5.3, 8), "#486c84");
  top.position.set(x, 12.7, z);
  cyl(x, 16, z, 0.06, 0.09, 2, "#c6ac70");
  box(x + 0.7, 16.5, z, 1.4, 0.75, 0.04, "#447fab");
  for (const dx of [-1, 1])
    box(x + dx, 6.4, z + 2.35, 0.38, 1.8, 0.08, "#3e534f");
  obstacle(x, z, 2.9);
}
tower(-21, 40);
for (let i = 0; i < 7; i++) {
  box(-34 + i * 2, 1, 35, 0.16, 2, 0.16, "#796b4c");
  if (i < 6) box(-33 + i * 2, 1.5, 35, 2, 0.14, 0.15, "#796b4c");
}
function banner(x, z) {
  cyl(x, 3, z, 0.07, 0.1, 6, "#998361");
  ball(x, 6.2, z, 0.16, "#d2b76d");
  box(x + 0.7, 4.6, z, 1.45, 2.1, 0.04, "#376b96");
  const sigil = mesh(new THREE.OctahedronGeometry(0.37), "#d7bf7e");
  sigil.position.set(x + 0.7, 4.65, z + 0.08);
  sigil.scale.z = 0.12;
}
banner(-6, 28);
banner(6, 25);
banner(-4, 2);
banner(4, -10);
const fire = new THREE.Group();
scene.add(fire);
fire.position.set(-7, 0, 22);
for (let i = 0; i < 8; i++)
  ball(
    Math.cos((i * Math.PI) / 4) * 0.9,
    0.18,
    Math.sin((i * Math.PI) / 4) * 0.9,
    0.28,
    "#8c8b74",
    fire,
  );
for (let i = 0; i < 3; i++) {
  const log = box(0, 0.3, 0, 1.65, 0.24, 0.3, "#62503b", fire);
  log.rotation.y = (i * Math.PI) / 3;
}
const flame = mesh(new THREE.ConeGeometry(0.5, 1.45, 6), "#ffcc76", fire, {
  emissive: "#ff8c36",
  emissiveIntensity: 2,
});
flame.position.y = 1;
const fireLight = new THREE.PointLight("#ffa451", 7, 10);
fireLight.position.set(-7, 2.5, 22);
scene.add(fireLight);
// The marauder camp and the ruined gate.
for (const [x, z] of [
  [20, -21],
  [26, -15],
]) {
  roof(x, 0, z, 4.3, 3, 4.5, "#895e45");
  box(x, 0.15, z + 2.3, 0.12, 3, 0.12, "#584b36");
  obstacle(x, z, 2.2);
}
for (const [x, z] of [
  [14, -23],
  [24, -24],
  [28, -18],
]) {
  box(x, 0.6, z, 1.2, 1.2, 1.2, "#927d56");
  box(x, 0.6, z + 0.61, 1.25, 0.12, 0.04, "#5d4e37");
}
const ruinFloor = cyl(0, 0.05, -45, 11, 11, 0.12, "#7f887c", scene, 12);
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  if (i > 1 && i < 5) continue;
  const x = Math.cos(angle) * 10,
    z = -45 + Math.sin(angle) * 10;
  const h = rand(2.7, 5.8);
  box(x, h / 2, z, 1.5, h, 1.6, "#93998a");
  box(x, h + 0.2, z, 1.9, 0.5, 1.9, "#a2a492");
  obstacle(x, z, 1.1);
}
box(-4.5, 4.2, -51, 2.2, 8.4, 2, "#737f77");
box(4.5, 4.2, -51, 2.2, 8.4, 2, "#737f77");
box(0, 8.5, -51, 11, 1.7, 2.3, "#8c9384");
const portal = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 48),
  new THREE.MeshBasicMaterial({
    color: "#9064c0",
    transparent: true,
    opacity: 0.74,
    side: THREE.DoubleSide,
  }),
);
portal.position.set(0, 4.3, -51);
portal.scale.set(1, 1.27, 1);
scene.add(portal);
const portalEdge = new THREE.Mesh(
  new THREE.TorusGeometry(3.2, 0.12, 6, 48),
  mat("#c897e9", { emissive: "#8e40de", emissiveIntensity: 2 }),
);
portalEdge.position.copy(portal.position);
portalEdge.scale.y = 1.27;
scene.add(portalEdge);
const rune = ring(7.5, "#bda1d6", scene, 0.09);
rune.position.set(0, 0.15, -45);
const portalLight = new THREE.PointLight("#bb65ff", 15, 22);
portalLight.position.set(0, 4, -48);
scene.add(portalLight);

const CLASS = {
  warrior: {
    title: "Warrior",
    name: "Aldren",
    icon: "♜",
    hp: 200,
    color: "#416b95",
    range: 3.2,
    attack: 23,
    description:
      "A steadfast knight. Heavy armor, sweeping strikes, and unbreakable resolve.",
    skills: [
      [
        "⚔",
        "Strike",
        "A heavy melee strike. 23 base damage. Hold Space to repeat.",
        0.72,
        0,
      ],
      [
        "✹",
        "Whirlwind",
        "Strike every foe within 6m. 52 damage. Costs 25 energy.",
        5,
        25,
      ],
      [
        "◈",
        "Iron Guard",
        "Reduce incoming damage by 70% for 5 seconds.",
        12,
        20,
      ],
      ["✧", "Second Wind", "Restore 85 health. Costs 30 energy.", 14, 30],
    ],
  },
  mage: {
    title: "Mage",
    name: "Elyra",
    icon: "✦",
    hp: 145,
    color: "#786caa",
    range: 12,
    attack: 27,
    description:
      "A master of the arcane. Cast fire from afar, freeze your foes, and bend the battle.",
    skills: [
      [
        "✦",
        "Firebolt",
        "Launch a firebolt up to 12m away. 27 base damage.",
        0.9,
        0,
      ],
      [
        "❄",
        "Frost Nova",
        "Deal 52 base damage in a 7m radius and freeze enemies for 3 seconds.",
        6,
        25,
      ],
      [
        "◈",
        "Mana Shield",
        "Reduce incoming damage by 70% for 5 seconds.",
        12,
        20,
      ],
      ["✧", "Renew", "Restore 85 health. Costs 30 mana.", 14, 30],
    ],
  },
  ranger: {
    title: "Ranger",
    name: "Thalen",
    icon: "➶",
    hp: 165,
    color: "#4e7c57",
    range: 14,
    attack: 22,
    description:
      "A watchful hunter. Swift arrows, a piercing volley, and the healing touch of nature.",
    skills: [
      [
        "➶",
        "Quick Shot",
        "Fire an arrow up to 14m away. 22 base damage.",
        0.65,
        0,
      ],
      [
        "⋙",
        "Arrow Rain",
        "Strike all foes within 8m of your target. 52 damage.",
        6,
        25,
      ],
      ["◈", "Evasion", "Reduce incoming damage by 70% for 5 seconds.", 12, 20],
      ["✧", "Regrowth", "Restore 85 health. Costs 30 energy.", 14, 30],
    ],
  },
};
function humanoid(color, enemy = false) {
  const g = new THREE.Group();
  const parts = {};
  parts.body = box(
    0,
    1.35,
    0,
    0.85,
    0.96,
    0.5,
    enemy ? "#76674f" : "#bac1ba",
    g,
  );
  box(0, 1.2, 0.28, 0.6, 0.7, 0.08, color, g);
  box(0, 0.82, 0, 0.95, 0.24, 0.6, "#5f5443", g);
  parts.head = ball(0, 2.18, 0, 0.33, enemy ? "#92a278" : "#dbc6a4", g, 1);
  if (!enemy) {
    cyl(0, 2.39, 0, 0.34, 0.35, 0.22, "#bfc5bc", g);
    box(0, 2.18, 0.28, 0.58, 0.09, 0.1, "#34434a", g);
    box(0, 2.19, 0.36, 0.06, 0.4, 0.08, "#d8c790", g);
    const plume = box(0, 2.73, -0.08, 0.13, 0.51, 0.35, color, g);
    plume.rotation.x = -0.25;
    const cape = box(0, 1.35, -0.36, 0.85, 1.15, 0.06, color, g);
    cape.rotation.x = 0.18;
  } else {
    const hood = ball(0, 2.27, -0.03, 0.39, "#695b48", g);
    hood.scale.set(1, 1, 0.8);
    box(0, 2.17, 0.31, 0.45, 0.16, 0.1, "#353e35", g);
  }
  parts.leftLeg = box(-0.24, 0.4, 0, 0.31, 0.75, 0.35, "#405051", g);
  parts.rightLeg = box(0.24, 0.4, 0, 0.31, 0.75, 0.35, "#405051", g);
  for (const x of [-0.55, 0.55])
    ball(x, 1.72, 0, 0.31, enemy ? "#7c775f" : "#c5c9bd", g);
  parts.arm = new THREE.Group();
  parts.arm.position.set(0.63, 1.6, 0);
  g.add(parts.arm);
  box(0, -0.3, 0, 0.27, 0.65, 0.28, enemy ? "#8b9876" : "#a7afa5", parts.arm);
  parts.weapon = box(0, -0.13, 0.58, 0.12, 0.12, 1.35, "#d4d7c3", parts.arm);
  box(0, -0.13, 0.06, 0.4, 0.1, 0.1, "#c5a368", parts.arm);
  const shield = cyl(
    -0.67,
    1.18,
    0.18,
    0.44,
    0.44,
    0.12,
    enemy ? "#8a6046" : color,
    g,
    6,
  );
  shield.rotation.z = Math.PI / 2;
  shield.rotation.y = -0.2;
  g.userData.parts = parts;
  return g;
}
function wolf() {
  const g = new THREE.Group();
  ball(0, 0.72, 0, 0.7, "#939484", g, 1).scale.set(0.65, 0.78, 1.45);
  ball(0, 1, 0.76, 0.42, "#a5a592", g, 1);
  box(0, 0.9, 1.08, 0.3, 0.25, 0.48, "#b8b5a0", g);
  ball(0, 0.92, 1.32, 0.12, "#3e4941", g);
  for (const x of [-0.24, 0.24]) {
    const ear = mesh(new THREE.ConeGeometry(0.17, 0.4, 4), "#737e6c", g);
    ear.position.set(x, 1.41, 0.67);
    for (const z of [-0.45, 0.45])
      box(x, 0.3, z, 0.15, 0.6, 0.18, "#6d7767", g);
    ball(x, 1.07, 1, 0.06, "#e7c474", g);
  }
  const tail = box(0, 0.7, -1, 0.2, 0.22, 0.72, "#8c9783", g);
  tail.rotation.x = -0.4;
  return g;
}
const player = humanoid(CLASS.warrior.color);
player.position.set(0, 0, 26);
player.rotation.y = Math.PI;
scene.add(player);
const playerRing = ring(0.78, "#d2dba2");
const npc = humanoid("#355a82");
npc.position.set(-4, 0, 23);
npc.rotation.y = 0.7;
scene.add(npc);
const npcLabel = document.createElement("div");
npcLabel.className = "world-label";
npcLabel.innerHTML =
  '<span class="quest-mark">!</span>Marshal Aldric<small>Northshire Watch</small>';
$("world-labels").append(npcLabel);
const enemies = [];
function makeEnemy(type, x, z) {
  const g =
    type === "wolf"
      ? wolf()
      : humanoid(type === "boss" ? "#6e436e" : "#925e42", true);
  if (type === "boss") {
    g.scale.setScalar(2.05);
    for (const x of [-0.38, 0.38]) {
      const horn = mesh(new THREE.ConeGeometry(0.15, 0.8, 5), "#c0b59c", g);
      horn.position.set(x, 2.72, 0);
      horn.rotation.z = -x;
    }
    g.userData.parts.weapon.material = mat("#c999e7", {
      emissive: "#743b8e",
      emissiveIntensity: 0.8,
    });
  }
  g.position.set(x, 0, z);
  scene.add(g);
  const hp = type === "wolf" ? 70 : type === "boss" ? 600 : 110;
  const e = {
    type,
    disposition: type === "wolf" ? "neutral" : "hostile",
    aggroRadius: type === "wolf" ? 0 : type === "boss" ? 13 : 8,
    mesh: g,
    hp,
    maxHp: hp,
    home: new THREE.Vector3(x, 0, z),
    timer: rand(0.5, 2),
    hit: 0,
    frozen: 0,
    dead: false,
    name:
      type === "wolf"
        ? "Timber Wolf"
        : type === "boss"
          ? "Mordrath, the Hollow King"
          : "Blackrock Marauder",
    aggro: false,
  };
  e.label = document.createElement("div");
  e.label.className = "world-label enemy" + (type === "boss" ? " boss" : "");
  e.label.innerHTML = `${e.name}<div class="enemy-bar"><i></i></div>`;
  $("world-labels").append(e.label);
  enemies.push(e);
  return e;
}
function isHostile(enemy) {
  return enemy.disposition === "hostile" || enemy.aggro;
}
makeEnemy("wolf", -17, 13);
makeEnemy("wolf", -23, 10);
makeEnemy("wolf", -22, 19);
makeEnemy("wolf", -29, 15);
makeEnemy("bandit", 14, -17);
makeEnemy("bandit", 22, -13);
makeEnemy("bandit", 19, -25);
makeEnemy("bandit", 26, -21);
const boss = makeEnemy("boss", 0, -43);
const targetRing = ring(1.15, "#e4aa7f");
targetRing.visible = false;
const destinationRing = ring(0.48, "#e4d8a2");
destinationRing.visible = false;
const bossWarning = new THREE.Mesh(
  new THREE.CircleGeometry(7, 64),
  new THREE.MeshBasicMaterial({
    color: "#c45a65",
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  }),
);
bossWarning.rotation.x = -Math.PI / 2;
bossWarning.position.y = 0.13;
bossWarning.visible = false;
scene.add(bossWarning);
const warningBorder = new THREE.Mesh(
  new THREE.RingGeometry(6.85, 7, 64),
  new THREE.MeshBasicMaterial({ color: "#ff8872", side: THREE.DoubleSide }),
);
warningBorder.position.z = 0.01;
bossWarning.add(warningBorder);
const particles = [],
  projectiles = [];
const state = {
  started: false,
  paused: false,
  dead: false,
  won: false,
  class: "warrior",
  hp: 200,
  maxHp: 200,
  mp: 100,
  level: 1,
  xp: 0,
  gold: 0,
  potions: 3,
  kills: { wolf: 0, bandit: 0, boss: 0 },
  quest: 0,
  cooldowns: [0, 0, 0, 0, 0],
  guard: 0,
  target: null,
  destination: null,
  autoAttack: false,
  attackAnim: 0,
  equipment: [],
  elapsed: 0,
  deaths: 0,
  damageBonus: 0,
  sound: true,
  bossCharge: 0,
  bossTimer: 7,
  zone: "",
  map: false,
};
const keys = new Set();
let selectedClass = "warrior",
  totalTime = 0,
  zoneBannerTimer = 0,
  toastTimer = 0,
  uiTimer = 0;
let audioContext;
function sound(kind) {
  if (!state.sound || !audioContext) return;
  const tones = {
    attack: [180, 70, 0.1, "triangle"],
    hurt: [100, 40, 0.13, "sawtooth"],
    heal: [400, 800, 0.3, "sine"],
    quest: [440, 880, 0.45, "sine"],
    level: [520, 1040, 0.5, "triangle"],
    spell: [260, 920, 0.22, "sine"],
    click: [600, 450, 0.08, "sine"],
  };
  const [from, to, duration, type] = tones[kind] || tones.click;
  const o = audioContext.createOscillator(),
    gain = audioContext.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, audioContext.currentTime);
  o.frequency.exponentialRampToValueAtTime(
    to,
    audioContext.currentTime + duration,
  );
  gain.gain.setValueAtTime(0.045, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );
  o.connect(gain).connect(audioContext.destination);
  o.start();
  o.stop(audioContext.currentTime + duration);
}
function log(message, source = "World") {
  const p = document.createElement("p");
  p.innerHTML = `<span>[${source}]</span> ${message}`;
  $("chat-lines").append(p);
  while ($("chat-lines").children.length > 5)
    $("chat-lines").firstChild.remove();
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").style.opacity = 1;
  toastTimer = 3;
}
function floatText(position, text, style = "") {
  const p = position.clone();
  p.y += 2.8;
  p.project(camera);
  const el = document.createElement("div");
  el.className = "floater " + style;
  el.textContent = text;
  el.style.left = (p.x * 0.5 + 0.5) * innerWidth + "px";
  el.style.top = (-p.y * 0.5 + 0.5) * innerHeight + "px";
  $("floaters").append(el);
  setTimeout(() => el.remove(), 1000);
}
function burst(position, color, count = 14, force = 4) {
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.08 + rand(0, 0.09)),
      new THREE.MeshBasicMaterial({ color, transparent: true }),
    );
    m.position.copy(position);
    m.position.y += 1;
    scene.add(m);
    particles.push({
      mesh: m,
      v: new THREE.Vector3(
        rand(-force, force),
        rand(1, force + 1),
        rand(-force, force),
      ),
      life: rand(0.35, 0.75),
      max: 0.75,
    });
  }
}
function shoot(from, to, color) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 6, 6),
    new THREE.MeshBasicMaterial({ color }),
  );
  m.position.copy(from);
  m.position.y += 1.4;
  scene.add(m);
  projectiles.push({
    mesh: m,
    dest: to.clone().add(new THREE.Vector3(0, 1, 0)),
    life: 0.35,
  });
}
function maxXP() {
  return state.level * 80;
}
function gainXP(amount) {
  state.xp += amount;
  while (state.xp >= maxXP()) {
    state.xp -= maxXP();
    state.level++;
    state.maxHp += 30;
    state.hp = state.maxHp;
    state.mp = 100;
    burst(player.position, "#e8d293", 35, 5);
    toast(`Level ${state.level} · Health and power increased`);
    sound("level");
    log(
      `You reached level ${state.level}. Health and energy restored.`,
      "Level",
    );
  }
}
const questData = [
  {
    title: "A shadow in the forest",
    description:
      "The watch has heard strange howls. Speak to Marshal Aldric beside the campfire.",
    reward: "80 XP · 20 GOLD",
  },
  {
    title: "Wolves at our doorstep",
    description:
      "The timber wolves have grown restless. Clear the western grove, then return to Aldric.",
    reward: "80 XP · 20 GOLD",
  },
  {
    title: "Across the river",
    description:
      "Blackrock marauders guard a dark relic. Cross the bridge and clear their eastern camp.",
    reward: "120 XP · 35 GOLD",
  },
  {
    title: "The Hollow King",
    description:
      "A forgotten king has risen at the northern gate. Defeat Mordrath and close the rift.",
    reward: "200 XP · 100 GOLD",
  },
  {
    title: "The valley remembers",
    description:
      "Mordrath has fallen. Return to Marshal Aldric and bring the good news home.",
    reward: "HERO OF NORTHSHIRE",
  },
  {
    title: "A hero comes home",
    description:
      "The valley is safe. Your first chapter is complete. Explore the forest or begin a new adventure.",
    reward: "CHAPTER COMPLETE",
  },
];
function updateQuest() {
  const q = questData[state.quest];
  $("quest-title").textContent = q.title;
  $("quest-description").textContent = q.description;
  $("reward").textContent = q.reward;
  const objectives = [];
  if (state.quest === 0)
    objectives.push(["Speak to Marshal Aldric", "", false]);
  if (state.quest === 1) {
    objectives.push([
      "Defeat timber wolves",
      `${Math.min(3, state.kills.wolf)} / 3`,
      state.kills.wolf >= 3,
    ]);
    objectives.push(["Return to Marshal Aldric", "", false]);
  }
  if (state.quest === 2) {
    objectives.push([
      "Defeat marauders",
      `${Math.min(3, state.kills.bandit)} / 3`,
      state.kills.bandit >= 3,
    ]);
    objectives.push(["Return to Marshal Aldric", "", false]);
  }
  if (state.quest === 3)
    objectives.push(["Defeat the Hollow King", "0 / 1", false]);
  if (state.quest === 4)
    objectives.push(["Return to Marshal Aldric", "", false]);
  if (state.quest === 5) objectives.push(["Northshire is safe", "✓", true]);
  $("objectives").innerHTML = objectives
    .map(
      ([text, count, done]) =>
        `<div class="objective ${done ? "done" : ""}"><i>${done ? "✓" : "◇"}</i><span>${text}</span><b>${count}</b></div>`,
    )
    .join("");
  npcLabel.querySelector(".quest-mark").textContent =
    state.quest === 5 ? "✦" : state.quest === 0 ? "!" : canTurnIn() ? "?" : "·";
  $("quest-count").textContent = state.quest === 5 ? "COMPLETE" : "1 ACTIVE";
}
function canTurnIn() {
  return (
    (state.quest === 1 && state.kills.wolf >= 3) ||
    (state.quest === 2 && state.kills.bandit >= 3) ||
    state.quest === 4
  );
}
function openModal(html) {
  state.paused = true;
  keys.clear();
  $("modal").innerHTML =
    '<button class="close" aria-label="Close">×</button>' + html;
  $("modal-backdrop").classList.add("open");
  $("modal").querySelector(".close").onclick = closeModal;
}
function closeModal() {
  if (state.dead) return;
  $("modal-backdrop").classList.remove("open");
  state.paused = false;
}
function talk() {
  if (!state.started || state.dead) return;
  if (player.position.distanceTo(npc.position) > 5) {
    toast("Move closer to Marshal Aldric");
    return;
  }
  state.destination = null;
  state.autoAttack = false;
  const complete = canTurnIn();
  let text, button;
  if (state.quest === 0) {
    text =
      "Welcome to Northshire, traveler. Something has unsettled the timber wolves in the western grove. Our people cannot safely leave the camp. Defeat three wolves, and we will see what courage you carry.";
    button = "ACCEPT QUEST";
  } else if (state.quest === 1 && complete) {
    text =
      "Well fought! But those wolves were only a warning. Blackrock marauders have crossed the river. Take this tempered weapon, clear three marauders from their camp east of the bridge, and return to me.";
    button = "CLAIM REWARD & CONTINUE";
  } else if (state.quest === 2 && complete) {
    text =
      "The marauders carried the mark of Mordrath. The Hollow King has opened a rift at the northern ruins. Take this watchkeeper armor and fresh potions. Stay out of his crimson circle when he prepares a ground slam. End this, hero.";
    button = "CLAIM REWARD & FACE MORDRATH";
  } else if (state.quest === 4) {
    text =
      "The light has returned to the valley. You faced the darkness and came home. Today you are more than a traveler. Northshire will remember your name.";
    button = "COMPLETE YOUR ADVENTURE";
  } else if (state.quest === 5) {
    text =
      "Rest easy, hero. The valley is safe because of you. There are still quiet trails to wander and stories to make.";
    button = "RETURN TO THE VALLEY";
  } else {
    text =
      state.quest === 1
        ? "The timber wolves roam the western grove. Defeat three and return. Your map marks their territory. If you are wounded, use your healing skill or a potion."
        : state.quest === 2
          ? "Cross the bridge and follow the trail east. Defeat three Blackrock marauders, then return for your reward."
          : "Mordrath waits at the ruins in the far north. Watch for the red warning circle. Step out before the slam, and use your guard when danger is close.";
    button = "BACK TO THE ADVENTURE";
  }
  openModal(
    `<div class="eyebrow">NORTHSHIRE WATCH</div><h2>Marshal Aldric</h2><p>“${text}”</p><div class="row"><span>${questData[state.quest].title}</span><strong>${questData[state.quest].reward}</strong></div><button class="primary" id="quest-accept">${button}</button>`,
  );
  $("quest-accept").onclick = () => {
    sound("quest");
    if (state.quest === 0) {
      state.quest = 1;
      log("Quest accepted: Wolves at our doorstep.", "Quest");
    } else if (state.quest === 1 && complete) {
      state.quest = 2;
      state.gold += 20;
      gainXP(80);
      state.damageBonus += 8;
      state.equipment.push("Tempered Watchblade");
      state.potions += 2;
      toast("Acquired: Tempered Watchblade · +8 attack");
      log("Tempered Watchblade equipped. +8 attack. +2 potions.", "Loot");
    } else if (state.quest === 2 && complete) {
      state.quest = 3;
      state.gold += 35;
      gainXP(120);
      state.maxHp += 40;
      state.equipment.push("Watchkeeper Armor");
      state.potions += 3;
      toast("Acquired: Watchkeeper Armor · +40 max health");
      log("Watchkeeper Armor equipped. +40 health. +3 potions.", "Loot");
    } else if (state.quest === 4) {
      state.quest = 5;
      state.gold += 100;
      gainXP(200);
      state.won = true;
      state.equipment.push("Medallion of Northshire");
      closeModal();
      updateQuest();
      victory();
      return;
    }
    state.hp = state.maxHp;
    state.mp = 100;
    updateQuest();
    closeModal();
    updateUI();
  };
}
function victory() {
  burst(player.position, "#e6cc87", 45, 6);
  sound("level");
  $("rank").textContent = "Hero of Northshire";
  openModal(
    `<div class="eyebrow">CHAPTER I · COMPLETE</div><h2>The valley remembers.</h2><p>The rift is sealed. The Hollow King is no more.<br>Your watch has ended, but your legend has only begun.</p><div class="stats"><div class="stat"><b>${state.level}</b><small>HERO LEVEL</small></div><div class="stat"><b>${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, "0")}</b><small>ADVENTURE TIME</small></div><div class="stat"><b>${state.gold}</b><small>GOLD EARNED</small></div></div><div class="equipment"><strong>✦ Medallion of Northshire</strong><small>A memento of your first great adventure.</small></div><button id="explore" class="primary">CONTINUE EXPLORING</button><button id="restart" style="width:100%;padding:12px;margin-top:10px">NEW ADVENTURE</button>`,
  );
  $("explore").onclick = closeModal;
  $("restart").onclick = () => location.reload();
}
function inventory() {
  if (!state.started || state.dead) return;
  const gear = [
    `${CLASS[state.class].title}'s starting gear`,
    ...state.equipment,
  ];
  openModal(
    `<div class="eyebrow">CHARACTER & EQUIPMENT</div><h2>${CLASS[state.class].name}, level ${state.level}</h2><div class="stats"><div class="stat"><b>${state.maxHp}</b><small>MAX HEALTH</small></div><div class="stat"><b>${CLASS[state.class].attack + state.damageBonus + (state.level - 1) * 4}</b><small>ATTACK</small></div><div class="stat"><b>${state.gold}</b><small>GOLD</small></div></div>${gear.map((name, i) => `<div class="equipment"><strong>${i === 0 ? "◇" : "✦"} ${name}</strong><small>${i === 0 ? "Common · Equipped" : name.includes("Watchblade") ? "Uncommon · Equipped · +8 attack" : name.includes("Armor") ? "Uncommon · Equipped · +40 max health" : "Rare · Quest trophy"}</small></div>`).join("")}<div class="row"><span>Healing potions</span><strong>${state.potions} available · restores 100 HP</strong></div><p>Quest equipment is equipped automatically. Marshal Aldric restores health and energy when you speak with him.</p><button class="primary" id="inventory-close">BACK TO THE WORLD</button>`,
  );
  $("inventory-close").onclick = closeModal;
}
function help() {
  if (state.dead) return;
  openModal(
    '<div class="eyebrow">FIELD GUIDE</div><h2>Your adventure awaits</h2><div class="row"><span>Move</span><strong>W A S D / Arrow keys / Click ground</strong></div><div class="row"><span>Camera / Zoom</span><strong>Right mouse drag / Mouse wheel</strong></div><div class="row"><span>Target enemy</span><strong>Click enemy / Tab</strong></div><div class="row"><span>Basic attack</span><strong>Hold Space / 1</strong></div><div class="row"><span>Abilities / Healing potion</span><strong>2 · 3 · 4 / Q</strong></div><div class="row"><span>Talk / Inventory / Map</span><strong>E / B / M</strong></div><div class="row"><span>Pause / Help</span><strong>Esc / H</strong></div><p>Right drag to orbit the camera; use the wheel to zoom. Movement follows the camera. Yellow names are neutral and retaliate only when damaged. Red names attack within their own aggro range. Click an enemy to approach and attack automatically. Skills also work by clicking the action bar. Stay out of the Hollow King’s red circle. Healing potions and your fourth skill keep you in the fight.</p><p>Follow the gold quest markers. Clear the wolves to the west, the marauders across the bridge, then the ruins in the north. Return to Aldric after each quest for stronger equipment.</p><button class="primary" id="help-close">GOT IT</button>',
  );
  $("help-close").onclick = closeModal;
}
function setTarget(enemy) {
  state.target = enemy;
  targetRing.visible = !!enemy;
  updateUI();
}
function nearestEnemy(range = Infinity) {
  let closest = null,
    distance = range;
  for (const e of enemies) {
    if (e.dead) continue;
    const d = e.mesh.position.distanceTo(player.position);
    if (d < distance) {
      distance = d;
      closest = e;
    }
  }
  return closest;
}
function damageEnemy(e, amount) {
  if (e.dead) return;
  if (e.type === "boss" && state.quest < 3) {
    toast("Complete Aldric’s quests to break the king’s ward");
    return;
  }
  const critical = rand() < 0.15;
  amount = Math.round(amount * (critical ? 1.5 : 1));
  e.hp = Math.max(0, e.hp - amount);
  e.aggro = true;
  e.hit = 0.18;
  floatText(e.mesh.position, (critical ? "✦ " : "") + amount);
  burst(e.mesh.position, e.type === "boss" ? "#c8a1dc" : "#e0bf86", 7, 2.5);
  if (e.hp === 0) {
    e.dead = true;
    e.label.hidden = true;
    state.kills[e.type]++;
    state.gold += e.type === "boss" ? 50 : e.type === "wolf" ? 5 : 9;
    gainXP(e.type === "boss" ? 160 : e.type === "wolf" ? 28 : 44);
    log(
      `${e.name} defeated. +${e.type === "boss" ? 160 : e.type === "wolf" ? 28 : 44} XP.`,
      "Combat",
    );
    if (state.target === e) {
      setTarget(null);
      state.autoAttack = false;
      state.destination = null;
    }
    if (e.type === "boss") {
      state.quest = 4;
      state.bossCharge = 0;
      bossWarning.visible = false;
      portal.visible = false;
      portalEdge.visible = false;
      portalLight.intensity = 0;
      rune.visible = false;
      toast("The rift is sealed. Return to Marshal Aldric.");
      sound("level");
    } else if (canTurnIn()) {
      toast("Objective complete · Return to Marshal Aldric");
      sound("quest");
    }
    updateQuest();
  }
}
function damagePlayer(amount) {
  if (state.dead || state.won) return;
  if (state.guard > 0) amount *= 0.3;
  amount = Math.round(amount);
  state.hp = Math.max(0, state.hp - amount);
  floatText(player.position, "−" + amount, "hurt");
  sound("hurt");
  $("damage-flash").style.opacity = 0.17;
  setTimeout(() => ($("damage-flash").style.opacity = 0), 180);
  if (state.hp <= 0) {
    state.dead = true;
    state.deaths++;
    state.destination = null;
    state.autoAttack = false;
    player.rotation.z = Math.PI / 2;
    openModal(
      '<div class="eyebrow">YOUR STORY IS NOT OVER</div><h2>A moment of darkness</h2><p>The Northshire Watch carries you back to camp. Your equipment, gold, and quest progress are kept. Gather your strength and return to the fight.</p><button id="revive" class="primary">REVIVE AT NORTHSHIRE</button>',
    );
    $("revive").onclick = () => {
      state.dead = false;
      player.position.set(0, 0, 26);
      player.rotation.z = 0;
      state.hp = state.maxHp;
      state.mp = 100;
      state.cooldowns.fill(0);
      state.guard = 0;
      state.bossCharge = 0;
      state.bossTimer = 7;
      bossWarning.visible = false;
      for (const e of enemies)
        if (!e.dead) {
          e.hp = e.maxHp;
          e.mesh.position.copy(e.home);
          e.aggro = false;
          e.frozen = 0;
        }
      setTarget(null);
      closeModal();
      toast("Restored at Northshire");
      updateUI();
    };
  }
}
function useSkill(index) {
  if (
    !state.started ||
    state.paused ||
    state.dead ||
    state.cooldowns[index] > 0
  )
    return;
  const c = CLASS[state.class];
  if (index === 4) {
    if (state.potions <= 0) {
      toast("No potions left · Use your healing skill");
      return;
    }
    if (state.hp >= state.maxHp) {
      toast("Health is already full");
      return;
    }
    state.potions--;
    state.hp = Math.min(state.maxHp, state.hp + 100);
    state.cooldowns[4] = 10;
    floatText(player.position, "+100", "heal");
    burst(player.position, "#9dd494");
    sound("heal");
    updateUI();
    return;
  }
  const skill = c.skills[index];
  if (state.mp < skill[4]) {
    toast("Not enough energy · It regenerates over time");
    return;
  }
  if (index < 2) {
    if (!state.target || state.target.dead)
      setTarget(nearestEnemy(index === 0 ? c.range + 0.5 : 16));
    const target = state.target;
    if (!target) {
      toast("No enemy in range");
      return;
    }
    const distance = target.mesh.position.distanceTo(player.position);
    const range =
      index === 0
        ? c.range
        : state.class === "ranger"
          ? 16
          : state.class === "mage"
            ? 7
            : 6;
    if (distance > range + (target.type === "boss" ? 1 : 0)) {
      if (!keys.has(" ")) toast("Move closer to your target");
      return;
    }
    player.rotation.y = Math.atan2(
      target.mesh.position.x - player.position.x,
      target.mesh.position.z - player.position.z,
    );
    state.attackAnim = 0.35;
    if (index === 0) {
      if (state.class !== "warrior")
        shoot(
          player.position,
          target.mesh.position,
          state.class === "mage" ? "#ffd697" : "#bddbaa",
        );
      damageEnemy(target, c.attack + state.damageBonus + (state.level - 1) * 4);
    } else {
      const center =
        state.class === "ranger"
          ? target.mesh.position.clone()
          : player.position.clone();
      burst(center, state.class === "mage" ? "#a3dcf0" : "#f6d692", 35, 7);
      for (const e of enemies)
        if (
          !e.dead &&
          e.mesh.position.distanceTo(center) <
            (state.class === "ranger" ? 8 : 7)
        ) {
          damageEnemy(e, 52 + state.damageBonus + (state.level - 1) * 6);
          if (state.class === "mage") e.frozen = 3;
        }
    }
    sound(state.class === "warrior" ? "attack" : "spell");
  } else if (index === 2) {
    state.guard = 5;
    burst(player.position, "#aad5ea", 22, 3);
    toast(`${skill[1]} · Damage reduced for 5 seconds`);
    sound("spell");
  } else {
    if (state.hp >= state.maxHp) {
      toast("Health is already full");
      return;
    }
    state.hp = Math.min(state.maxHp, state.hp + 85);
    floatText(player.position, "+85", "heal");
    burst(player.position, "#a3e8a4", 20, 3);
    sound("heal");
  }
  state.mp -= skill[4];
  state.cooldowns[index] = skill[3];
  updateUI();
}
function updateUI() {
  $("level").textContent = state.level;
  $("hp-bar").style.width = (state.hp / state.maxHp) * 100 + "%";
  $("hp-text").textContent = `${Math.ceil(state.hp)} / ${state.maxHp}`;
  $("mp-bar").style.width = state.mp + "%";
  $("mp-text").textContent = `${Math.floor(state.mp)} / 100`;
  $("gold").textContent = state.gold;
  $("xp-bar").style.width = (state.xp / maxXP()) * 100 + "%";
  $("xp-text").textContent =
    `LEVEL ${state.level} · ${state.xp} / ${maxXP()} XP`;
  $("target-frame").hidden = !state.target || state.target.dead;
  if (state.target && !state.target.dead) {
    const hostile = isHostile(state.target);
    $("target-frame").classList.toggle("neutral", !hostile);
    $("target-name").textContent = state.target.name;
    $("target-kind").textContent =
      (hostile ? "HOSTILE" : "NEUTRAL") +
      (state.target.type === "boss"
        ? " · ELITE · LEVEL 5"
        : " · LEVEL " + (state.target.type === "wolf" ? "1" : "3"));
    $("target-kind").title =
      state.target.disposition === "neutral"
        ? "Retaliates only when attacked"
        : `Attacks within ${state.target.aggroRadius} meters`;
    $("target-hp").style.width =
      (state.target.hp / state.target.maxHp) * 100 + "%";
    $("target-health").textContent =
      `${state.target.hp} / ${state.target.maxHp}`;
  }
  document.querySelectorAll(".skill").forEach((button, i) => {
    const cd = button.querySelector(".cd"),
      remaining = state.cooldowns[i];
    cd.style.display = remaining > 0 ? "grid" : "none";
    cd.textContent = Math.ceil(remaining);
    if (i === 4)
      button.querySelector(".label").textContent = `POTION ×${state.potions}`;
  });
  for (const enemy of enemies) {
    enemy.label.classList.toggle("neutral", !isHostile(enemy));
  }
  if (state.target) {
    targetRing.material.color.set(
      isHostile(state.target) ? "#f17e70" : "#f0d769",
    );
  }
}
function buildHotbar() {
  const skills = [
    ...CLASS[state.class].skills,
    ["♥", "Potion", "Restore 100 health. 10-second cooldown. Key: Q", 10, 0],
  ];
  $("hotbar").innerHTML = skills
    .map(
      (s, i) =>
        `<button class="skill" data-skill="${i}" aria-label="${s[1]}"><kbd>${i === 4 ? "Q" : i + 1}</kbd><span class="icon">${s[0]}</span><span class="label">${s[1].toUpperCase()}</span><span class="cd"></span><span class="tooltip"><strong>${s[1]}</strong>${s[2]}</span></button>`,
    )
    .join("");
  document
    .querySelectorAll(".skill")
    .forEach((el) => (el.onclick = () => useSkill(Number(el.dataset.skill))));
}
function begin() {
  state.class = selectedClass;
  const c = CLASS[state.class];
  state.maxHp = c.hp;
  state.hp = c.hp;
  state.started = true;
  $("start").hidden = true;
  $("player-name").textContent = c.name;
  $("class-label").textContent = c.title.toUpperCase();
  $("portrait-icon").textContent = c.icon;
  $("footer-class").textContent = "Alliance " + c.title;
  player.traverse((m) => {
    if (m.isMesh && m.material === mat(CLASS.warrior.color))
      m.material = mat(c.color);
  });
  if (state.class === "mage") {
    player.userData.parts.weapon.scale.set(1.6, 1.6, 1.1);
    player.userData.parts.weapon.material = mat("#b1956c");
    ball(0, -0.13, 1.35, 0.2, "#b7d8f0", player.userData.parts.arm);
  }
  if (state.class === "ranger") {
    player.userData.parts.weapon.material = mat("#a48b59");
    player.userData.parts.weapon.scale.set(0.7, 0.8, 0.8);
  }
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
  } catch {
    state.sound = false;
  }
  buildHotbar();
  updateQuest();
  updateUI();
  sound("quest");
  log("Welcome to Elwynn Forest. Your adventure begins.", "World");
  log("Speak to Marshal Aldric beside the campfire. [E]", "Quest");
  toast("Welcome, adventurer · Speak to Marshal Aldric [E]");
  showZone("Northshire Valley");
}
function showZone(name) {
  $("zone-banner").querySelector("strong").textContent = name;
  $("zone-banner").style.opacity = 1;
  zoneBannerTimer = 3.5;
}
document.querySelectorAll(".class-card").forEach(
  (el) =>
    (el.onclick = () => {
      selectedClass = el.dataset.class;
      document
        .querySelectorAll(".class-card")
        .forEach((b) => b.classList.toggle("selected", b === el));
      $("class-description").textContent = CLASS[selectedClass].description;
    }),
);
$("begin").onclick = begin;
$("inventory-button").onclick = inventory;
$("help").onclick = help;
$("journal-button").onclick = () => {
  if (!state.started || state.dead) return;
  openModal(
    `<div class="eyebrow">CHAPTER I · QUEST JOURNAL</div><h2>${questData[state.quest].title}</h2><p>${questData[state.quest].description}</p>${$("objectives").innerHTML}<div class="row"><span>Quest reward</span><strong>${questData[state.quest].reward}</strong></div><p>Your minimap shows your position in white, the marshal in gold, neutral creatures in yellow, and hostile creatures in red. Press M to expand it.</p><button class="primary" id="journal-close">CONTINUE ADVENTURE</button>`,
  );
  $("journal-close").onclick = closeModal;
};
$("pause").onclick = () => {
  if (!state.started || state.dead) return;
  if (state.paused) closeModal();
  else {
    openModal(
      '<div class="eyebrow">TAKE A BREATH</div><h2>Adventure paused</h2><p>Your journey will be here when you return.</p><button id="resume" class="primary">RESUME ADVENTURE</button>',
    );
    $("resume").onclick = closeModal;
  }
};
$("sound").onclick = () => {
  state.sound = !state.sound;
  $("sound").textContent = state.sound ? "♫" : "♪";
  $("sound").style.opacity = state.sound ? 1 : 0.4;
  if (audioContext?.state === "suspended") audioContext.resume();
};
function toggleMap() {
  if (!state.started || state.dead || state.paused) return;
  state.map = !state.map;
  document.body.classList.toggle("map-expanded", state.map);
  $("map-toggle").innerHTML = `${state.map ? "CLOSE" : "EXPAND"} <kbd>M</kbd>`;
}
$("map-toggle").onclick = toggleMap;
addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (
    [" ", "tab", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
      key,
    )
  )
    event.preventDefault();
  if (!state.started) {
    if (key === "enter") begin();
    return;
  }
  if (event.repeat) return;
  if (key === "escape") {
    if (state.map) {
      toggleMap();
      return;
    }
    $("pause").click();
    return;
  }
  if (state.paused || state.dead) return;
  keys.add(key);
  if (key === "e") talk();
  if (key === "b") inventory();
  if (key === "h") help();
  if (key === "j") $("journal-button").click();
  if (key === "m") toggleMap();
  if (key === "q") useSkill(4);
  if ("1234".includes(key)) useSkill(Number(key) - 1);
  if (key === "tab") {
    const sorted = enemies
      .filter(
        (e) => !e.dead && e.mesh.position.distanceTo(player.position) < 23,
      )
      .sort(
        (a, b) =>
          a.mesh.position.distanceTo(player.position) -
          b.mesh.position.distanceTo(player.position),
      );
    if (sorted.length)
      setTarget(sorted[(sorted.indexOf(state.target) + 1) % sorted.length]);
  }
});
addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
const cameraOrbit = {
  yaw: Math.atan2(20, 30),
  pitch: Math.atan2(26, Math.hypot(20, 30)),
  distance: Math.hypot(20, 26, 30),
};
let cameraDrag = null;
function endCameraDrag() {
  const pointerId = cameraDrag?.id;
  cameraDrag = null;
  $("world").classList.remove("rotating-camera");
  if (pointerId !== undefined && $("world").hasPointerCapture(pointerId)) {
    $("world").releasePointerCapture(pointerId);
  }
}
addEventListener("blur", () => {
  keys.clear();
  endCameraDrag();
});
document.addEventListener("contextmenu", (event) => event.preventDefault());
const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2();
$("world").addEventListener("pointerdown", (event) => {
  if (!state.started || state.paused || state.dead || state.map) return;
  if (event.button === 2) {
    event.preventDefault();
    cameraDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    $("world").setPointerCapture(event.pointerId);
    $("world").classList.add("rotating-camera");
    return;
  }
  if (event.button !== 0 || cameraDrag) return;
  pointer.set(
    (event.clientX / innerWidth) * 2 - 1,
    (-event.clientY / innerHeight) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const clickedNPC = raycaster.intersectObject(npc, true)[0];
  if (clickedNPC) {
    if (player.position.distanceTo(npc.position) < 5) talk();
    else {
      state.destination = npc.position
        .clone()
        .add(new THREE.Vector3(1.8, 0, 1.8));
      state.autoAttack = false;
    }
    return;
  }
  const hits = raycaster.intersectObjects(
    enemies.filter((e) => !e.dead).map((e) => e.mesh),
    true,
  );
  if (hits.length) {
    let root = hits[0].object;
    while (root.parent && root.parent !== scene) root = root.parent;
    const e = enemies.find((e) => e.mesh === root);
    if (e) {
      setTarget(e);
      state.autoAttack = true;
      state.destination = null;
      return;
    }
  }
  const hit = raycaster.intersectObject(terrain)[0];
  if (hit) {
    state.destination = hit.point.clone();
    state.destination.y = 0;
    state.destination.x = clamp(state.destination.x, -46, 46);
    state.destination.z = clamp(state.destination.z, -57, 48);
    state.autoAttack = false;
    destinationRing.position.copy(state.destination);
    destinationRing.position.y = 0.12;
    destinationRing.visible = true;
  }
});
$("world").addEventListener("pointermove", (event) => {
  if (!cameraDrag || cameraDrag.id !== event.pointerId) return;
  if (state.paused || state.dead || state.map || !(event.buttons & 2)) {
    endCameraDrag();
    return;
  }
  cameraOrbit.yaw -= (event.clientX - cameraDrag.x) * 0.006;
  cameraOrbit.pitch = clamp(
    cameraOrbit.pitch + (event.clientY - cameraDrag.y) * 0.004,
    0.22,
    1.25,
  );
  cameraDrag.x = event.clientX;
  cameraDrag.y = event.clientY;
});
$("world").addEventListener("pointerup", (event) => {
  if (event.button === 2 && cameraDrag?.id === event.pointerId) endCameraDrag();
});
$("world").addEventListener("pointercancel", endCameraDrag);
$("world").addEventListener("lostpointercapture", endCameraDrag);
$("world").addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    if (!state.started || state.paused || state.dead || state.map) return;
    const delta =
      event.deltaY *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    cameraOrbit.distance = clamp(
      cameraOrbit.distance * Math.exp(clamp(delta * 0.001, -1, 1)),
      12,
      60,
    );
  },
  { passive: false },
);
function canMove(x, z) {
  if (x < -46 || x > 46 || z < -57 || z > 48) return false;
  for (const c of colliders)
    if (Math.hypot(x - c.x, z - c.z) < c.radius + 0.38) return false;
  return true;
}
function movePlayer(direction, dt) {
  if (direction.lengthSq() < 0.01) return false;
  direction.normalize();
  const speed = 7.8,
    x = player.position.x + direction.x * speed * dt,
    z = player.position.z + direction.z * speed * dt;
  const old = player.position.clone();
  if (canMove(x, player.position.z)) player.position.x = x;
  if (canMove(player.position.x, z)) player.position.z = z;
  player.rotation.y = Math.atan2(direction.x, direction.z);
  return old.distanceToSquared(player.position) > 0.00001;
}
function updatePlayer(dt) {
  state.elapsed += dt;
  state.mp = Math.min(100, state.mp + dt * 6);
  state.guard = Math.max(0, state.guard - dt);
  state.attackAnim = Math.max(0, state.attackAnim - dt);
  for (let i = 0; i < 5; i++)
    state.cooldowns[i] = Math.max(0, state.cooldowns[i] - dt);
  const movement = new THREE.Vector3();
  const forward = camera.getWorldDirection(new THREE.Vector3());
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  if (keys.has("w") || keys.has("arrowup")) movement.add(forward);
  if (keys.has("s") || keys.has("arrowdown")) movement.sub(forward);
  if (keys.has("a") || keys.has("arrowleft")) movement.sub(right);
  if (keys.has("d") || keys.has("arrowright")) movement.add(right);
  if (movement.lengthSq() > 0) {
    state.destination = null;
    state.autoAttack = false;
    destinationRing.visible = false;
  } else if (state.autoAttack && state.target && !state.target.dead) {
    const distance = state.target.mesh.position.distanceTo(player.position),
      range =
        CLASS[state.class].range + (state.target.type === "boss" ? 0.8 : -0.25);
    if (distance > range)
      movement.subVectors(state.target.mesh.position, player.position);
    else useSkill(0);
  } else if (state.destination) {
    movement.subVectors(state.destination, player.position);
    if (movement.length() < 0.35) {
      state.destination = null;
      movement.set(0, 0, 0);
      destinationRing.visible = false;
    }
  }
  const moving = movePlayer(movement, dt);
  const parts = player.userData.parts;
  parts.leftLeg.rotation.x = moving ? Math.sin(totalTime * 12) * 0.55 : 0;
  parts.rightLeg.rotation.x = moving ? -Math.sin(totalTime * 12) * 0.55 : 0;
  player.position.y = moving ? Math.abs(Math.sin(totalTime * 12)) * 0.07 : 0;
  parts.arm.rotation.x =
    state.attackAnim > 0
      ? -Math.sin((state.attackAnim / 0.35) * Math.PI) * 1.6
      : 0;
  playerRing.position.set(player.position.x, 0.1, player.position.z);
  playerRing.material.color.set(state.guard > 0 ? "#85d4f0" : "#d2dba2");
  if (keys.has(" ")) useSkill(0);
  const nearNPC = player.position.distanceTo(npc.position) < 5;
  $("interaction").hidden = !nearNPC || state.paused;
  $("interaction").querySelector("span").textContent = canTurnIn()
    ? "Complete quest · Marshal Aldric"
    : "Speak to Marshal Aldric";
  if (nearNPC && !enemies.some((e) => e.aggro && !e.dead))
    state.hp = Math.min(state.maxHp, state.hp + dt * 15);
  const zone =
    player.position.z < -31
      ? "The Forgotten Gate"
      : player.position.z < -8
        ? "Blackrock Crossing"
        : player.position.x < -12 && player.position.z < 22
          ? "Whispering Grove"
          : "Northshire Valley";
  if (zone !== state.zone) {
    if (state.zone) showZone(zone);
    state.zone = zone;
    $("zone").textContent = zone.toUpperCase();
    $("zone-sub").textContent =
      zone === "The Forgotten Gate"
        ? "CONTESTED TERRITORY · ELITE ENCOUNTER"
        : "ALLIANCE TERRITORY · LEVEL 1–5";
  }
}
function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) {
      e.mesh.rotation.z = THREE.MathUtils.lerp(
        e.mesh.rotation.z,
        Math.PI / 2,
        dt * 5,
      );
      e.mesh.position.y = Math.max(-2, e.mesh.position.y - dt * 0.4);
      if (e.mesh.position.y <= -2) e.mesh.visible = false;
      continue;
    }
    e.frozen = Math.max(0, e.frozen - dt);
    e.hit = Math.max(0, e.hit - dt);
    const d = e.mesh.position.distanceTo(player.position);
    if (e.disposition === "hostile" && d < e.aggroRadius) e.aggro = true;
    if (e.aggro && (d > 24 || player.position.distanceTo(npc.position) < 7))
      e.aggro = false;
    if (e.type === "boss" && state.bossCharge > 0) continue;
    if (e.frozen > 0) continue;
    if (e.aggro) {
      const range = e.type === "boss" ? 3.2 : e.type === "wolf" ? 1.65 : 2;
      if (d > range) {
        const dir = new THREE.Vector3()
          .subVectors(player.position, e.mesh.position)
          .normalize();
        e.mesh.position.addScaledVector(
          dir,
          dt * (e.type === "wolf" ? 3.5 : e.type === "boss" ? 2.6 : 3.1),
        );
        e.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        e.mesh.position.y = Math.abs(Math.sin(totalTime * 10)) * 0.09;
      } else {
        e.timer -= dt;
        if (e.timer <= 0) {
          damagePlayer(e.type === "boss" ? 23 : e.type === "wolf" ? 8 : 12);
          e.timer = e.type === "wolf" ? 1.45 : 1.8;
          e.mesh.rotation.y = Math.atan2(
            player.position.x - e.mesh.position.x,
            player.position.z - e.mesh.position.z,
          );
        }
      }
      if (e.type === "boss") {
        state.bossTimer -= dt;
        if (state.bossTimer <= 0) {
          state.bossCharge = 2.2;
          state.bossTimer = 8;
          bossWarning.position.set(e.mesh.position.x, 0.13, e.mesh.position.z);
          bossWarning.visible = true;
          toast("Ground slam! Leave the red circle!");
          log("Mordrath is charging Ground Slam. Move out!", "Combat");
        }
      }
    } else if (e.mesh.position.distanceTo(e.home) > 0.5) {
      const dir = new THREE.Vector3()
        .subVectors(e.home, e.mesh.position)
        .normalize();
      e.mesh.position.addScaledVector(dir, dt * 2);
      e.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }
  if (state.bossCharge > 0 && !boss.dead) {
    state.bossCharge -= dt;
    bossWarning.material.opacity = 0.4 + Math.sin(totalTime * 14) * 0.1;
    if (state.bossCharge <= 0) {
      if (player.position.distanceTo(bossWarning.position) < 7)
        damagePlayer(65);
      burst(bossWarning.position, "#bc83b1", 45, 9);
      bossWarning.visible = false;
      sound("hurt");
    }
  }
}
const mapContext = $("minimap").getContext("2d");
function drawMap() {
  const ctx = mapContext,
    w = 240,
    h = 190;
  const px = (x) => ((x + 48) / 96) * w,
    pz = (z) => ((z + 60) / 112) * h;
  ctx.fillStyle = "#344b36";
  ctx.fillRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#213c3b");
  grad.addColorStop(1, "#6d7746");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#314933";
  colliders.forEach((c) => {
    ctx.beginPath();
    ctx.arc(
      px(c.x),
      pz(c.z),
      c.radius > 2 ? c.radius * 2.3 : 4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });
  ctx.strokeStyle = "#72a2a0";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, pz(-4));
  ctx.lineTo(w, pz(-4));
  ctx.stroke();
  ctx.strokeStyle = "#b0a575";
  ctx.lineWidth = 3;
  ctx.beginPath();
  [
    [-34, 45],
    [-17, 32],
    [0, 25],
    [3, 14],
    [0, -4],
    [6, -19],
    [0, -43],
  ].forEach(([x, z], i) =>
    i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z)),
  );
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px(0), pz(23));
  ctx.lineTo(px(-23), pz(13));
  ctx.moveTo(px(3), pz(-12));
  ctx.lineTo(px(23), pz(-18));
  ctx.stroke();
  for (const [x, z] of [
    [-16, 30],
    [-27, 22],
    [14, 33],
    [-21, 40],
  ]) {
    ctx.fillStyle = "#c5b992";
    ctx.fillRect(px(x) - 4, pz(z) - 3, 8, 6);
    ctx.strokeStyle = "#6a6b50";
    ctx.strokeRect(px(x) - 4, pz(z) - 3, 8, 6);
  }
  ctx.strokeStyle = "#a89aa9";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(px(0), pz(-45), 15, 0, Math.PI * 2);
  ctx.stroke();
  for (const e of enemies) {
    if (e.dead) continue;
    ctx.fillStyle = isHostile(e) ? "#f17e70" : "#f0d769";
    ctx.beginPath();
    ctx.arc(
      px(e.mesh.position.x),
      pz(e.mesh.position.z),
      e.type === "boss" ? 3.5 : 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = "#f1d384";
  ctx.beginPath();
  ctx.arc(px(npc.position.x), pz(npc.position.z), 3, 0, Math.PI * 2);
  ctx.fill();
  let objective =
    state.quest === 1 && state.kills.wolf < 3
      ? { x: -22, z: 13 }
      : state.quest === 2 && state.kills.bandit < 3
        ? { x: 20, z: -18 }
        : state.quest === 3
          ? { x: 0, z: -43 }
          : npc.position;
  ctx.strokeStyle = "#ebcf88";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(
    px(objective.x),
    pz(objective.z),
    6 + Math.sin(totalTime * 3) * 1.5,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  ctx.save();
  ctx.translate(px(player.position.x), pz(player.position.z));
  ctx.rotate(-player.rotation.y);
  ctx.fillStyle = "#f7f2d8";
  ctx.shadowColor = "#0b2629";
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(-3.5, -4);
  ctx.lineTo(0, -2);
  ctx.lineTo(3.5, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#d3d8b1";
  ctx.font = "8px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("N", w / 2, 10);
  ctx.font = "6px Arial";
  ctx.fillStyle = "#ded5b3";
  ctx.fillText("FORGOTTEN GATE", px(0), pz(-56));
  ctx.fillText("NORTHSHIRE", px(-12), pz(46));
  ctx.fillStyle = "#172b26";
  ctx.fillText("WHISPERING GROVE", px(-25), pz(4));
  $("coords").textContent =
    `${Math.round(player.position.x + 48)}, ${Math.round(player.position.z + 60)}`;
  $("clock").textContent = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function positionLabel(element, position, height, visible = true) {
  const p = position.clone();
  p.y += height;
  p.project(camera);
  element.style.display =
    visible && p.z < 1 && Math.abs(p.x) < 1.2 && Math.abs(p.y) < 1.2
      ? "block"
      : "none";
  element.style.left = (p.x * 0.5 + 0.5) * innerWidth + "px";
  element.style.top = (-p.y * 0.5 + 0.5) * innerHeight + "px";
}
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener("resize", resize);
const look = new THREE.Vector3(0, 1, 20),
  desiredCamera = new THREE.Vector3();
camera.position.set(34, 34, 57);
camera.lookAt(0, 1, 16);
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  totalTime += dt;
  if (state.started && !state.paused && !state.dead) {
    updatePlayer(dt);
    updateEnemies(dt);
  }
  if (state.started) {
    const horizontal = Math.cos(cameraOrbit.pitch) * cameraOrbit.distance;
    desiredCamera
      .copy(player.position)
      .add(
        new THREE.Vector3(
          Math.sin(cameraOrbit.yaw) * horizontal,
          1 + Math.sin(cameraOrbit.pitch) * cameraOrbit.distance,
          Math.cos(cameraOrbit.yaw) * horizontal,
        ),
      );
    camera.position.lerp(desiredCamera, 1 - Math.exp(-dt * 4));
    look.lerp(
      player.position.clone().add(new THREE.Vector3(0, 1, 0)),
      1 - Math.exp(-dt * 5),
    );
    camera.lookAt(look);
  } else {
    camera.position.set(34 + Math.sin(totalTime * 0.06) * 3, 34, 57);
    camera.lookAt(-1, 1, 13);
  }
  flame.scale.set(
    1 + Math.sin(totalTime * 7) * 0.15,
    1 + Math.cos(totalTime * 9) * 0.18,
    1,
  );
  fireLight.intensity = 7 + Math.sin(totalTime * 9);
  portal.material.opacity = 0.64 + Math.sin(totalTime * 2) * 0.1;
  portalEdge.rotation.z = totalTime * 0.1;
  waterLines.forEach((m, i) => {
    m.position.x += dt * (0.12 + (i % 3) * 0.05);
    if (m.position.x > 85) m.position.x = -85;
  });
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.mesh.position.addScaledVector(p.v, dt);
    p.v.y -= dt * 8;
    p.mesh.material.opacity = Math.max(0, p.life / p.max);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.life -= dt;
    p.mesh.position.lerp(p.dest, Math.min(1, dt * 15));
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      projectiles.splice(i, 1);
    }
  }
  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) $("toast").style.opacity = 0;
  }
  if (zoneBannerTimer > 0) {
    zoneBannerTimer -= dt;
    if (zoneBannerTimer <= 0) $("zone-banner").style.opacity = 0;
  }
  positionLabel(npcLabel, npc.position, 3.2, state.started);
  for (const e of enemies) {
    positionLabel(
      e.label,
      e.mesh.position,
      e.type === "boss" ? 6 : 2.8,
      state.started &&
        !e.dead &&
        e.mesh.position.distanceTo(player.position) < 24,
    );
    e.label.querySelector("i").style.width = (e.hp / e.maxHp) * 100 + "%";
  }
  if (state.target && !state.target.dead) {
    targetRing.position.set(
      state.target.mesh.position.x,
      0.11,
      state.target.mesh.position.z,
    );
    targetRing.scale.setScalar(state.target.type === "boss" ? 1.8 : 1);
  } else targetRing.visible = false;
  uiTimer += dt;
  if (uiTimer > 0.1) {
    uiTimer = 0;
    updateUI();
    drawMap();
  }
  renderer.render(scene, camera);
}
buildHotbar();
updateQuest();
updateUI();
requestAnimationFrame(frame);
// Read-only diagnostics make rendering and user-boundary playthroughs inspectable.
window.gameStatus = () => ({
  started: state.started,
  paused: state.paused,
  class: state.class,
  hp: Math.round(state.hp),
  maxHp: state.maxHp,
  mp: Math.round(state.mp),
  level: state.level,
  xp: state.xp,
  gold: state.gold,
  potions: state.potions,
  quest: state.quest,
  questTitle: questData[state.quest].title,
  kills: { ...state.kills },
  won: state.won,
  dead: state.dead,
  position: { x: player.position.x, z: player.position.z },
  camera: {
    ...cameraOrbit,
    position: camera.position.toArray(),
    dragging: !!cameraDrag,
  },
  destination: state.destination
    ? { x: state.destination.x, z: state.destination.z }
    : null,
  autoAttack: state.autoAttack,
  target: state.target?.name ?? null,
  enemies: enemies.map((e) => ({
    name: e.name,
    type: e.type,
    disposition: e.disposition,
    aggroRadius: e.aggroRadius,
    aggro: e.aggro,
    hp: e.hp,
    dead: e.dead,
    x: e.mesh.position.x,
    z: e.mesh.position.z,
  })),
  drawCalls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
});
