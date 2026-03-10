
    (() => {
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const overlay = document.getElementById('overlay');
      const stackCountEl = document.getElementById('stackCount');
      const bestCountEl = document.getElementById('bestCount');
      const nextPreview = document.getElementById('nextPreview');
      const messageEl = document.getElementById('message');
      const startBtn = document.getElementById('startBtn');
      const rotateLeftCanvasBtn = document.getElementById('rotateLeftCanvasBtn');
      const rotateRightCanvasBtn = document.getElementById('rotateRightCanvasBtn');
      const dropBtn = document.getElementById('dropBtn');
      const restartBtn = document.getElementById('restartBtn');
      const itemBtn = document.getElementById('itemBtn');
      const itemCountEl = document.getElementById('itemCount');
      const itemProgressRing = document.getElementById('itemProgressRing');
      const canvasWrap = canvas.parentElement;
      const versionEl = document.getElementById('appVersion');

      const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const STORAGE_KEY = 'trollTowerBattleBest';
      const FIXED_DT = 1 / 60;
      const MAX_STEPS = 3;
      const TAU = Math.PI * 2;
      const WORLD_WIDTH = 420;
      const WORLD_HEIGHT = 760;
      const STAGE_WIDTH = 228;
      const MOBILE_BREAKPOINT = 640;
      const STAGE_MARGIN = 26;
      const GROUND_OFFSET = 68;
      const DEFAULT_TROLL_HEIGHT = 84;
      const SIZE_REDUCTION = 0.8;
      const ROTATION_STEP = Math.PI / 12;
      const SPAWN_SCREEN_Y = 126;
      const STAGE_TRAY_CENTER_DROP = 7;
      const STAGE_TRAY_RIM_LIFT = 4;
      const STAGE_TRAY_CENTER_FLAT_RATIO = 0.34;
      const STAGE_TRAY_SLOPE_RATIO = 0.22;

      const state = {
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        groundY: WORLD_HEIGHT - GROUND_OFFSET,
        leftWall: STAGE_MARGIN,
        rightWall: WORLD_WIDTH - STAGE_MARGIN,
        stageLeft: (WORLD_WIDTH - STAGE_WIDTH) * 0.5,
        stageRight: (WORLD_WIDTH + STAGE_WIDTH) * 0.5,
        stageWidth: STAGE_WIDTH,
        running: false,
        gameOver: false,
        bodies: [],
        particles: [],
        assets: [],
        currentAsset: null,
        nextAsset: null,
        pointerX: WORLD_WIDTH * 0.5,
        lastTime: 0,
        accumulator: 0,
        stackCount: 0,
        bestCount: Number(localStorage.getItem(STORAGE_KEY) || 0),
        message: 'ステージ中央を狙って、押して離してドロップ！',
        messageTimer: 0,
        spawnTick: 0,
        towerShake: 0,
        spawnY: SPAWN_SCREEN_Y,
        cameraY: 0,
        idSeed: 1,
        dropLocked: false,
        activeDropId: null,
        currentRotation: 0,
        isDragging: false,
        gameOverScreenshot: null,
        simTime: 0,
        itemCount: 0,
        itemDropCounter: 0,
        itemActive: false,
      };

      bestCountEl.textContent = String(state.bestCount);

      async function loadVersion() {
        if (!versionEl) return;
        try {
          const response = await fetch('version.json', { cache: 'no-store' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const version = typeof data.version === 'string' ? data.version.trim() : '';
          if (version) {
            versionEl.textContent = `v${version}`;
            return;
          }
        } catch (_) {}
        versionEl.textContent = 'vdev';
      }

      function svgToDataUrl(svg) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      }

      function defaultTrollSvgs() {
        return [
          { name: "トロール 1", src: "images/troll_01.png", kind: "light", desiredH: 82, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 2", src: "images/troll_02.png", kind: "light", desiredH: 82, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 3", src: "images/troll_03.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 4", src: "images/troll_04.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 5", src: "images/troll_05.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 6", src: "images/troll_06.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 7", src: "images/troll_07.png", kind: "light", desiredH: 82, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 8", src: "images/troll_08.png", kind: "light", desiredH: 82, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 9", src: "images/troll_09.png", kind: "light", desiredH: 82, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 10", src: "images/troll_10.png", kind: "light", desiredH: 82, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 11", src: "images/troll_11.png", kind: "light", desiredH: 82, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 12", src: "images/troll_12.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 13", src: "images/troll_13.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 14", src: "images/troll_14.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 15", src: "images/troll_15.png", kind: "light", desiredH: 82, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 16", src: "images/troll_16.png", kind: "light", desiredH: 110, minWidth: 34, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 17", src: "images/troll_17.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 18", src: "images/troll_18.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 19", src: "images/troll_19.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 20", src: "images/troll_20.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 21", src: "images/troll_21.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 22", src: "images/troll_22.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 23", src: "images/troll_23.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 24", src: "images/troll_24.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 25", src: "images/troll_25.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
          { name: "トロール 26", src: "images/troll_26.png", kind: "light", desiredH: 88, density: 0.92, restitution: 0.01, friction: 1.08 },
        ];
      }

      function loadImage(src) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      }

      async function prepareSprite({ name, src, kind, desiredH, minWidth = 60, minHeight = 80, density, restitution, friction }) {
        const img = await loadImage(src);
        const collider = buildAlphaCircles(img, desiredH, { minWidth, minHeight });
        return {
          name,
          src,
          img,
          kind,
          desiredH,
          density,
          restitution,
          friction,
          width: collider.width,
          height: collider.height,
          circles: collider.circles,
        };
      }

      function buildAlphaCircles(img, targetH, { minWidth = 60, minHeight = 80 } = {}) {
        const scale = targetH / img.height;
        const width = Math.max(minWidth, Math.round(img.width * scale));
        const height = Math.max(minHeight, Math.round(img.height * scale));
        const off = document.createElement('canvas');
        off.width = width;
        off.height = height;
        const octx = off.getContext('2d', { willReadFrequently: true });
        octx.clearRect(0, 0, width, height);
        octx.drawImage(img, 0, 0, width, height);
        const data = octx.getImageData(0, 0, width, height).data;

        let minX = width, minY = height, maxX = 0, maxY = 0, found = false;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const a = data[(y * width + x) * 4 + 3];
            if (a > 28) {
              found = true;
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (!found) {
          const r = Math.min(width, height) * 0.3;
          return { width, height, circles: [{ x: 0, y: 0, r }] };
        }

        const grid = Math.max(12, Math.round(Math.min(width, height) / 6));
        const step = Math.max(10, grid * 0.78);
        const radius = grid * 0.42;
        const circles = [];

        function sampleAlpha(px, py) {
          if (px < 0 || py < 0 || px >= width || py >= height) return 0;
          return data[(Math.floor(py) * width + Math.floor(px)) * 4 + 3];
        }

        function opaqueScore(cx, cy, r) {
          const pts = [
            [0, 0], [0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55],
            [0.35, 0.35], [-0.35, 0.35], [0.35, -0.35], [-0.35, -0.35]
          ];
          let score = 0;
          for (const [ox, oy] of pts) {
            if (sampleAlpha(cx + ox * r, cy + oy * r) > 50) score++;
          }
          return score / pts.length;
        }

        for (let y = minY + radius; y <= maxY - radius; y += step) {
          for (let x = minX + radius; x <= maxX - radius; x += step) {
            const score = opaqueScore(x, y, radius);
            if (score >= 0.46) {
              let tooClose = false;
              for (const c of circles) {
                if (Math.hypot(c.x - x, c.y - y) < radius * 1.18) {
                  tooClose = true;
                  break;
                }
              }
              if (!tooClose) circles.push({ x, y, r: radius });
            }
          }
        }

        if (circles.length < 4) {
          const bodyR = Math.min(maxX - minX, maxY - minY) * 0.2;
          circles.push(
            { x: width * 0.5, y: minY + (maxY - minY) * 0.25, r: bodyR },
            { x: width * 0.5, y: minY + (maxY - minY) * 0.55, r: bodyR * 1.1 },
            { x: width * 0.34, y: minY + (maxY - minY) * 0.8, r: bodyR * 0.7 },
            { x: width * 0.66, y: minY + (maxY - minY) * 0.8, r: bodyR * 0.7 }
          );
        }

        return {
          width,
          height,
          circles: circles.map(c => ({ x: c.x - width / 2, y: c.y - height / 2, r: c.r }))
        };
      }

      function createBody(asset, x, y, angle = 0) {
        const sizeScale = (0.96 + Math.random() * 0.08) * SIZE_REDUCTION;
        const circles = asset.circles.map(c => ({
          x: c.x * sizeScale,
          y: c.y * sizeScale,
          r: c.r * sizeScale,
        }));

        let mass = 0;
        let inertia = 0;
        for (const c of circles) {
          const m = Math.PI * c.r * c.r * asset.density * 0.008;
          mass += m;
          inertia += m * (c.x * c.x + c.y * c.y + c.r * c.r * 0.5);
        }

        return {
          id: state.idSeed++,
          asset,
          x,
          y,
          vx: 0,
          vy: 0,
          angle,
          av: 0,
          circles,
          width: asset.width * sizeScale,
          height: asset.height * sizeScale,
          mass,
          invMass: 1 / mass,
          inertia: Math.max(inertia, 1),
          invInertia: 1 / Math.max(inertia, 1),
          restitution: 0,
          friction: Math.max(asset.friction, 1.6),
          hitSomething: false,
          counted: false,
          stableFrames: 0,
          readyFrames: 0,
          sleep: false,
          glow: 0,
          bornAt: performance.now(),
          stageAnchorX: null,
          stageAnchorStrength: 0,
        };
      }

      function getGravity() {
        return 1500;
      }

      function getSpawnWorldY() {
        return state.spawnY - state.cameraY;
      }

      function unlockNextPiece() {
        if (!state.dropLocked) return;
        state.dropLocked = false;
        state.activeDropId = null;
        if (!state.currentAsset) {
          state.currentAsset = state.nextAsset || chooseRandomAsset();
          state.nextAsset = chooseRandomAsset();
          state.currentRotation = 0;
          refreshNextPreview();
        }
        updateDropAvailability();
      }

      function updateCamera() {
        let towerTop = state.groundY;
        for (const body of state.bodies) {
          if (!(body.hitSomething || body.counted || body.sleep || body.stableFrames > 0)) continue;
          const ext = getBodyExtents(body);
          towerTop = Math.min(towerTop, ext.minY);
        }
        const desiredHeadroom = 170;
        const maxRise = Math.max(0, state.groundY - 170);
        const target = clamp(desiredHeadroom - towerTop, 0, maxRise);
        state.cameraY += (target - state.cameraY) * 0.12;
        if (Math.abs(target - state.cameraY) < 0.35) state.cameraY = target;
      }

      function resize() {
        state.width = WORLD_WIDTH;
        state.height = WORLD_HEIGHT;
        canvas.width = Math.round(WORLD_WIDTH * DPR);
        canvas.height = Math.round(WORLD_HEIGHT * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        const viewportW = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const appRect = document.getElementById('app').getBoundingClientRect();
        const mobile = viewportW <= MOBILE_BREAKPOINT;
        const horizontalPadding = mobile ? 20 : 24;
        const availableWidth = Math.max(280, appRect.width - horizontalPadding);
        const desktopCap = Math.min(viewportW - horizontalPadding, 860);
        const displayWidth = mobile ? availableWidth : Math.max(availableWidth, Math.min(desktopCap, availableWidth));
        const scale = Math.max(0.1, displayWidth / WORLD_WIDTH);
        const displayHeight = WORLD_HEIGHT * scale;

        canvasWrap.style.height = `${Math.round(displayHeight)}px`;
        canvas.style.width = `${Math.round(displayWidth)}px`;
        canvas.style.height = `${Math.round(displayHeight)}px`;

        state.leftWall = STAGE_MARGIN;
        state.rightWall = state.width - STAGE_MARGIN;
        state.groundY = state.height - GROUND_OFFSET;
        state.stageWidth = STAGE_WIDTH;
        state.stageLeft = (state.width - state.stageWidth) * 0.5;
        state.stageRight = state.stageLeft + state.stageWidth;
        state.spawnY = 126;
        const bounds = getCurrentDropBounds();
        state.pointerX = clamp(state.pointerX, bounds.min, bounds.max);
      }

      function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
      }

      function normalizeAngle(angle) {
        while (angle > Math.PI) angle -= TAU;
        while (angle < -Math.PI) angle += TAU;
        return angle;
      }

      function getPreviewHalfWidth(asset, angle = 0) {
        if (!asset) return 28;
        const width = asset.width * SIZE_REDUCTION;
        const height = asset.height * SIZE_REDUCTION;
        const c = Math.abs(Math.cos(angle));
        const s = Math.abs(Math.sin(angle));
        return Math.max(28, (width * c + height * s) * 0.5);
      }

      function getCurrentDropBounds() {
        const halfWidth = getPreviewHalfWidth(state.currentAsset, state.currentRotation);
        return {
          min: state.leftWall + halfWidth,
          max: state.rightWall - halfWidth,
        };
      }

      function rotateCurrent(delta) {
        if (!state.running || state.gameOver || !state.currentAsset || state.dropLocked) return;
        state.currentRotation = normalizeAngle(state.currentRotation + delta);
        const bounds = getCurrentDropBounds();
        state.pointerX = clamp(state.pointerX, bounds.min, bounds.max);
        setMessage(`回転 ${Math.round(state.currentRotation * 180 / Math.PI)}°`, 0.5);
        updateDropAvailability();
      }

      function worldPoint(body, local) {
        const c = Math.cos(body.angle);
        const s = Math.sin(body.angle);
        return {
          x: body.x + local.x * c - local.y * s,
          y: body.y + local.x * s + local.y * c,
        };
      }

      function velocityAtPoint(body, local) {
        const c = Math.cos(body.angle);
        const s = Math.sin(body.angle);
        const rx = local.x * c - local.y * s;
        const ry = local.x * s + local.y * c;
        return {
          x: body.vx - body.av * ry,
          y: body.vy + body.av * rx,
        };
      }

      function applyImpulse(body, local, ix, iy) {
        body.vx += ix * body.invMass;
        body.vy += iy * body.invMass;
        const c = Math.cos(body.angle);
        const s = Math.sin(body.angle);
        const rx = local.x * c - local.y * s;
        const ry = local.x * s + local.y * c;
        const torque = rx * iy - ry * ix;
        body.av += torque * body.invInertia;
      }

      function getEffectiveInvMass(body) {
        return (body.sleep || body.frozenByItem) ? 0 : body.invMass;
      }

      function getEffectiveInvInertia(body) {
        return (body.sleep || body.frozenByItem) ? 0 : body.invInertia;
      }

      function applyImpulseMaybe(body, local, ix, iy) {
        if (body.sleep || body.frozenByItem) return;
        applyImpulse(body, local, ix, iy);
      }

      function markBodyContact(body) {
        body.hitSomething = true;
        if (body.firstContactAt < 0) body.firstContactAt = state.simTime;
      }

      function freezeOnContactNow(body) {
        if (!body.freezeOnContact || body.frozenByItem) return;
        body.frozenByItem = true;
        body.sleep = true;
        body.vx = 0;
        body.vy = 0;
        body.av = 0;
        body.counted = true;
        body.glow = 1.0;
        spawnParticles(body.x, body.y, 16, '#8be9fd');
        updateBodyAabb(body);
        if (body.id === state.activeDropId) {
          onBodySettled(body);
          unlockNextPiece();
        }
      }

      function wakeBody(body, impact = 0) {
        if (!body.sleep) return;
        if (body.frozenByItem) return;
        if (impact < 80 && body.timeSinceDrop > 0.28) return;
        body.sleep = false;
        body.sleepFrames = 0;
        body.stableFrames = 0;
        body.readyFrames = 0;
        body.stageAnchorStrength = 0;
        body.stageAnchorX = null;
      }

      function updateBodyAabb(body) {
        body.aabb = getBodyExtents(body);
        return body.aabb;
      }

      function aabbOverlap(aabbA, aabbB, pad = 0) {
        return !(aabbA.maxX + pad < aabbB.minX ||
                 aabbA.minX - pad > aabbB.maxX ||
                 aabbA.maxY + pad < aabbB.minY ||
                 aabbA.minY - pad > aabbB.maxY);
      }

      function resolveBodyCollision(a, b, ca, cb) {
        if (a.frozenByItem && b.frozenByItem) return false;
        const pa = worldPoint(a, ca);
        const pb = worldPoint(b, cb);
        let nx = pb.x - pa.x;
        let ny = pb.y - pa.y;
        let dist = Math.hypot(nx, ny);
        const minDist = ca.r + cb.r;

        if (dist === 0) {
          nx = 1;
          ny = 0;
          dist = 0.0001;
        } else {
          nx /= dist;
          ny /= dist;
        }
        if (dist >= minDist) return false;

        const va0 = velocityAtPoint(a, ca);
        const vb0 = velocityAtPoint(b, cb);
        const rvx0 = vb0.x - va0.x;
        const rvy0 = vb0.y - va0.y;
        const velAlongNormal0 = rvx0 * nx + rvy0 * ny;
        const penetration = minDist - dist;
        const wakeImpact = Math.max(Math.abs(velAlongNormal0), penetration * 18);
        if (a.sleep && !b.sleep) wakeBody(a, wakeImpact);
        if (b.sleep && !a.sleep) wakeBody(b, wakeImpact);
        if (a.sleep && b.sleep && penetration > Math.min(ca.r, cb.r) * 0.55) {
          wakeBody(a, wakeImpact);
          wakeBody(b, wakeImpact);
        }

        const aInvMass = getEffectiveInvMass(a);
        const bInvMass = getEffectiveInvMass(b);
        const aInvInertia = getEffectiveInvInertia(a);
        const bInvInertia = getEffectiveInvInertia(b);
        const totalInvMass = aInvMass + bInvMass;
        if (totalInvMass === 0) return true;

        const correction = penetration * 0.45 / Math.max(totalInvMass, 0.0001);
        a.x -= nx * correction * aInvMass;
        a.y -= ny * correction * aInvMass;
        b.x += nx * correction * bInvMass;
        b.y += ny * correction * bInvMass;

        const va = velocityAtPoint(a, ca);
        const vb = velocityAtPoint(b, cb);
        const rvx = vb.x - va.x;
        const rvy = vb.y - va.y;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal > 0) {
          markBodyContact(a);
          markBodyContact(b);
          a.glow = Math.max(a.glow, 0.25);
          b.glow = Math.max(b.glow, 0.25);
          freezeOnContactNow(a);
          freezeOnContactNow(b);
          return true;
        }

        const raCrossN = (pa.x - a.x) * ny - (pa.y - a.y) * nx;
        const rbCrossN = (pb.x - b.x) * ny - (pb.y - b.y) * nx;
        const denom = totalInvMass + (raCrossN * raCrossN) * aInvInertia + (rbCrossN * rbCrossN) * bInvInertia;
        const restitution = 0;
        const j = -(1 + restitution) * velAlongNormal / Math.max(denom, 0.0001);
        const ix = nx * j;
        const iy = ny * j;
        applyImpulseMaybe(a, ca, -ix, -iy);
        applyImpulseMaybe(b, cb, ix, iy);

        const tx = rvx - velAlongNormal * nx;
        const ty = rvy - velAlongNormal * ny;
        const tLen = Math.hypot(tx, ty);
        if (tLen > 0.0001) {
          const tnx = tx / tLen;
          const tny = ty / tLen;
          const jt = -(rvx * tnx + rvy * tny) / Math.max(denom, 0.0001);
          const supportContact = a.sleep || b.sleep;
          const muBase = Math.sqrt(a.friction * b.friction);
          const mu = supportContact ? Math.min(3.6, muBase * 2.6) : Math.min(1.85, muBase * 1.35);
          const maxFriction = Math.max(j * mu, 0);
          const fj = clamp(jt, -maxFriction, maxFriction);
          applyImpulseMaybe(a, ca, -tnx * fj, -tny * fj);
          applyImpulseMaybe(b, cb, tnx * fj, tny * fj);
        }

        markBodyContact(a);
        markBodyContact(b);
        a.glow = Math.max(a.glow, 0.25);
        freezeOnContactNow(a);
        freezeOnContactNow(b);
        b.glow = Math.max(b.glow, 0.25);
        return true;
      }

      function resolveStaticPlane(body, circle, nx, ny, planeOffset) {
        if (body.frozenByItem) return false;
        const wp = worldPoint(body, circle);
        const distance = wp.x * nx + wp.y * ny - planeOffset;
        if (distance >= circle.r) return false;

        const separationBias = 0.65;
        const penetration = circle.r - distance;
        body.x += nx * (penetration + separationBias);
        body.y += ny * (penetration + separationBias);

        const wp2 = worldPoint(body, circle);
        const vel = velocityAtPoint(body, circle);
        const velAlongNormal = vel.x * nx + vel.y * ny;
        if (velAlongNormal < 0) {
          const rx = wp2.x - body.x;
          const ry = wp2.y - body.y;
          const rCrossN = rx * ny - ry * nx;
          const denom = body.invMass + (rCrossN * rCrossN) * body.invInertia;
          const j = -velAlongNormal / Math.max(denom, 0.0001);
          applyImpulse(body, circle, nx * j, ny * j);

          const tx = vel.x - velAlongNormal * nx;
          const ty = vel.y - velAlongNormal * ny;
          const tLen = Math.hypot(tx, ty);
          if (tLen > 0.0001) {
            const tnx = tx / tLen;
            const tny = ty / tLen;
            const jt = -(vel.x * tnx + vel.y * tny) / Math.max(denom, 0.0001);
            const surfaceGrip = 220;
            const fj = clamp(jt, -j * body.friction * surfaceGrip, j * body.friction * surfaceGrip);
            applyImpulse(body, circle, tnx * fj, tny * fj);
          }

          if (ny < 0) {
            const contactRadius = Math.max((wp2.y + circle.r) - body.y, 12);
            const tangentialVel = body.vx - body.av * contactRadius;
            const noSlipDenom = body.invMass + (contactRadius * contactRadius) * body.invInertia;
            const lambda = clamp(-tangentialVel / Math.max(noSlipDenom, 0.0001), -260, 260);
            body.vx += lambda * body.invMass;
            body.av += (-contactRadius * lambda) * body.invInertia;
            body.vy = Math.min(body.vy, 0);
            if (Math.abs(body.vy) < 12) body.vy = 0;
          }
        }
        markBodyContact(body);
        body.glow = Math.max(body.glow, 0.35);
        freezeOnContactNow(body);
        return true;
      }

      function spawnParticles(x, y, count, color = '#ffd166') {
        for (let i = 0; i < count; i++) {
          state.particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 180,
            vy: -Math.random() * 180 - 40,
            life: 0.8 + Math.random() * 0.4,
            age: 0,
            size: 3 + Math.random() * 5,
            color,
          });
        }
      }

      function setMessage(text, seconds = 1.6) {
        state.message = text;
        state.messageTimer = seconds;
        messageEl.textContent = text;
      }

      function updateHud() {
        stackCountEl.textContent = String(state.stackCount);
        bestCountEl.textContent = String(state.bestCount);
        itemCountEl.textContent = String(state.itemCount);
        const progress = (state.itemDropCounter % 5) / 5;
        const circ = 94.25;
        if (itemProgressRing) itemProgressRing.setAttribute('stroke-dasharray', `${(progress * circ).toFixed(2)} ${circ}`);
        itemBtn.disabled = state.itemCount <= 0 || !state.running || state.gameOver;
        if (state.itemActive) {
          itemBtn.classList.add('active-item');
        } else {
          itemBtn.classList.remove('active-item');
        }
      }

      function chooseRandomAsset() {
        return state.assets[Math.floor(Math.random() * state.assets.length)];
      }

      function refreshNextPreview() {
        nextPreview.src = (state.nextAsset || state.currentAsset || state.assets[0]).src;
      }

      function updateDropAvailability() {
        const canDrop = state.running && !state.gameOver && !state.dropLocked && !state.isDragging && !!state.currentAsset;
        if (dropBtn) dropBtn.disabled = !canDrop;
        rotateLeftCanvasBtn.disabled = !canDrop;
        rotateRightCanvasBtn.disabled = !canDrop;
      }

      function startRound() {
        state.currentAsset = chooseRandomAsset();
        state.nextAsset = chooseRandomAsset();
        state.currentRotation = 0;
        refreshNextPreview();
        updateHud();
        updateDropAvailability();
        setMessage('ステージ中央を狙って、押して離してドロップ！', 2.2);
      }

      function restartGame(hideIntro = true) {
        state.bodies.length = 0;
        state.particles.length = 0;
        state.running = hideIntro;
        state.gameOver = false;
        state.stackCount = 0;
        state.pointerX = state.width / 2;
        state.cameraY = 0;
        state.dropLocked = false;
        state.activeDropId = null;
        state.currentRotation = 0;
        state.isDragging = false;
        state.gameOverScreenshot = null;
        state.simTime = 0;
        state.itemCount = 0;
        state.itemDropCounter = 0;
        state.itemActive = false;
        startRound();
        updateHud();
        overlay.classList.toggle('show', !hideIntro);
      }

      function onBodySettled(body) {
        body.sleep = true;
        body.vx = 0;
        body.vy = 0;
        body.av = 0;

        if (body.id === state.activeDropId) {
          unlockNextPiece();
        }

        updateHud();
        updateDropAvailability();
      }


      function captureGameOverScreenshot() {
        try {
          render();

          const shotCanvas = document.createElement('canvas');
          shotCanvas.width = canvas.width;
          shotCanvas.height = canvas.height;
          const shotCtx = shotCanvas.getContext('2d');
          shotCtx.drawImage(canvas, 0, 0);

          const scale = shotCanvas.width / state.width;
          const pad = Math.round(16 * scale);
          const panelW = Math.round(Math.min(shotCanvas.width * 0.52, 200 * scale));
          const panelH = Math.round(88 * scale);
          const radius = Math.round(18 * scale);
          const x = pad;
          const y = pad;

          shotCtx.beginPath();
          shotCtx.moveTo(x + radius, y);
          shotCtx.arcTo(x + panelW, y, x + panelW, y + panelH, radius);
          shotCtx.arcTo(x + panelW, y + panelH, x, y + panelH, radius);
          shotCtx.arcTo(x, y + panelH, x, y, radius);
          shotCtx.arcTo(x, y, x + panelW, y, radius);
          shotCtx.closePath();
          shotCtx.fillStyle = 'rgba(18, 10, 36, 0.82)';
          shotCtx.fill();
          shotCtx.lineWidth = Math.max(1, Math.round(1.5 * scale));
          shotCtx.strokeStyle = 'rgba(255,255,255,0.14)';
          shotCtx.stroke();

          shotCtx.fillStyle = 'rgba(255,255,255,0.88)';
          shotCtx.font = `700 ${Math.max(12, Math.round(13 * scale))}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          shotCtx.fillText('トロールタワーバトル', x + Math.round(14 * scale), y + Math.round(20 * scale));

          shotCtx.fillStyle = '#ffd166';
          shotCtx.font = `900 ${Math.max(18, Math.round(24 * scale))}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          shotCtx.fillText(`記録 ${state.stackCount}`, x + Math.round(14 * scale), y + Math.round(52 * scale));

          shotCtx.fillStyle = 'rgba(255,248,242,0.96)';
          shotCtx.font = `700 ${Math.max(12, Math.round(13 * scale))}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          shotCtx.fillText(`ベスト ${state.bestCount}`, x + Math.round(14 * scale), y + Math.round(72 * scale));

          const stamp = new Date();
          const stampText = `${stamp.getFullYear()}/${String(stamp.getMonth() + 1).padStart(2, '0')}/${String(stamp.getDate()).padStart(2, '0')} ${String(stamp.getHours()).padStart(2, '0')}:${String(stamp.getMinutes()).padStart(2, '0')}`;
          shotCtx.fillStyle = 'rgba(220,206,214,0.90)';
          shotCtx.font = `600 ${Math.max(9, Math.round(10 * scale))}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          shotCtx.textAlign = 'right';
          shotCtx.fillText(stampText, x + panelW - Math.round(14 * scale), y + panelH - Math.round(12 * scale));
          shotCtx.textAlign = 'left';

          state.gameOverScreenshot = shotCanvas.toDataURL('image/png');
        } catch (error) {
          console.error('screenshot capture failed', error);
          state.gameOverScreenshot = null;
        }
        return state.gameOverScreenshot;
      }

      function downloadGameOverScreenshot() {
        const shot = state.gameOverScreenshot || captureGameOverScreenshot();
        if (!shot) {
          setMessage('スクショの保存に失敗しました。', 1.8);
          return;
        }
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const a = document.createElement('a');
        a.href = shot;
        a.download = `troll_tower_battle_${stamp}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setMessage('ステージ全体のスクショを保存しました。', 1.3);
      }

      function triggerGameOver(reason = 'ステージの外へ落下しました。') {
        if (state.gameOver) return;
        state.running = false;
        state.gameOver = true;
        const screenshot = captureGameOverScreenshot();
        overlay.querySelector('.dialog').innerHTML = `
          <h2>ゲームオーバー</h2>
          <p>${reason}</p>
          <div class="big">積んだ数: ${state.stackCount}</div>
          <p>ベスト記録: ${state.bestCount}</p>
          ${screenshot ? `<img class="screenshot-preview" src="${screenshot}" alt="ゲームオーバー時のステージ全体スクリーンショット" />` : ''}
          <div class="actions">
            <button id="saveShotBtn">スクショ保存</button>
            <button id="playAgainBtn" class="primary">もう一回</button>
          </div>
          <p class="screenshot-note">ゲームオーバー時点のステージ全体を、記録入りPNGで保存できます。</p>
        `;
        updateDropAvailability();
        overlay.classList.add('show');
        const saveShotBtn = overlay.querySelector('#saveShotBtn');
        if (saveShotBtn) saveShotBtn.addEventListener('click', downloadGameOverScreenshot, { once: false });
        overlay.querySelector('#playAgainBtn').addEventListener('click', () => restartGame(true), { once: true });
      }

      function dropCurrent() {
        if (!state.running || state.gameOver || !state.currentAsset || state.dropLocked || state.isDragging) return;
        const bounds = getCurrentDropBounds();
        const x = clamp(state.pointerX, bounds.min, bounds.max);
        const body = createBody(state.currentAsset, x, getSpawnWorldY(), state.currentRotation);
        body.vx = 0;
        body.vy = 2;
        body.angle = state.currentRotation;
        body.av = 0;
        body.timeSinceDrop = 0;
        body.firstContactAt = -1;

        // アイテム効果：触れた瞬間に完全固定
        if (state.itemActive) {
          body.freezeOnContact = true;
          state.itemActive = false;
          setMessage('🧲 固定アイテム発動！ 触れた瞬間にピタッと固定！', 1.8);
        } else {
          body.freezeOnContact = false;
        }

        state.bodies.push(body);
        state.stackCount += 1;
        state.bestCount = Math.max(state.bestCount, state.stackCount);
        localStorage.setItem(STORAGE_KEY, String(state.bestCount));

        // 5回落下でアイテム付与
        state.itemDropCounter += 1;
        if (state.itemDropCounter % 5 === 0) {
          state.itemCount += 1;
          spawnParticles(state.width * 0.5, state.height * 0.18, 12, '#8be9fd');
          setMessage('🧲 固定アイテム獲得！ 5回落としてGET！', 2.0);
        }

        state.currentAsset = null;
        state.dropLocked = true;
        state.activeDropId = body.id;
        updateHud();
        updateDropAvailability();
        if (!body.freezeOnContact) setMessage(`${body.asset.name} をドロップ！`, 0.8);
      }

      function updatePhysics(dt) {
        state.simTime += dt;
        const gravity = getGravity();
        if (state.messageTimer > 0) {
          state.messageTimer -= dt;
          if (state.messageTimer <= 0) messageEl.textContent = state.message;
        }
        for (const body of state.bodies) {
          body.timeSinceDrop += dt;
          if (body.sleep || body.frozenByItem) {
            body.vx = 0;
            body.vy = 0;
            body.av = 0;
            body.glow = Math.max(0, body.glow - dt * 0.6);
            updateBodyAabb(body);
            continue;
          }
          body.vy += gravity * dt;
          const touchingStageNow = isTouchingStage(body);


          if (body.hitSomething) {
            body.vx *= 0.88;
            body.av *= 0.82;
          } else {
            body.vx *= 0.994;
            body.av *= 0.972;
          }
          const motionNow = Math.hypot(body.vx, body.vy) + Math.abs(body.av) * 18;
          if (body.hitSomething && motionNow < 84) {
            body.vx *= 0.72;
            body.av *= 0.72;
          }
          if (body.hitSomething && motionNow < 34) {
            body.vx *= 0.58;
            body.av *= 0.42;
            if (Math.abs(body.vx) < 3.8) body.vx = 0;
            if (Math.abs(body.av) < 0.09) body.av = 0;
          }
          body.vy *= 0.999;
          body.av = clamp(body.av, -1.35, 1.35);
          if (Math.abs(body.angle) < 0.05 && Math.abs(body.av) < 0.18) {
            body.angle *= 0.985;
          }
          body.x += body.vx * dt;
          body.y += body.vy * dt;
          body.angle += body.av * dt;
          body.glow = Math.max(0, body.glow - dt * 0.9);
          updateBodyAabb(body);
        }

        const bodyCount = state.bodies.length;
        const solverPasses = bodyCount > 10 ? 2 : 3;
        for (let k = 0; k < solverPasses; k++) {
          for (const body of state.bodies) {
            if (!body.aabb) updateBodyAabb(body);
            for (const circle of body.circles) {
              resolveStageTop(body, circle);
            }
            updateBodyAabb(body);
          }
          for (let i = 0; i < state.bodies.length; i++) {
            const a = state.bodies[i];
            const aabbA = a.aabb || updateBodyAabb(a);
            for (let j = i + 1; j < state.bodies.length; j++) {
              const b = state.bodies[j];
              if (a.sleep && b.sleep) continue;
              const aabbB = b.aabb || updateBodyAabb(b);
              if (!aabbOverlap(aabbA, aabbB, 8)) continue;
              let collided = false;
              for (const ca of a.circles) {
                for (const cb of b.circles) {
                  if (resolveBodyCollision(a, b, ca, cb)) collided = true;
                }
              }
              if (collided) {
                updateBodyAabb(a);
                updateBodyAabb(b);
              }
            }
          }
        }

        for (const body of state.bodies) {
          if (!body.aabb) updateBodyAabb(body);
          if (body.sleep) continue;
          const stageContact = getStageContactInfo(body);
          const supported = stageContact.touching || isSupportedByBodies(body);
          const ext = body.aabb || updateBodyAabb(body);

          if (stageContact.touching) {
            enforceStageGrip(body, stageContact, bodyCount > 22 ? 0.95 : 1);
            if (!supported) {
              body.stageAnchorStrength = 0;
              body.stageAnchorX = null;
            }
            if (Math.abs(body.vx) < 0.018 && Math.abs(body.av) < 0.0022) {
              body.vx = 0;
              body.av = 0;
            }
            updateBodyAabb(body);
          } else {
            body.stageAnchorStrength = 0;
            body.stageAnchorX = null;
          }

          const motion = Math.hypot(body.vx, body.vy) + Math.abs(body.av) * 18;
          const activeBody = body.id === state.activeDropId;
          const contactAge = body.firstContactAt >= 0 ? state.simTime - body.firstContactAt : 0;
          if (activeBody && body.hitSomething && supported && contactAge > 0.18 && Math.abs(body.vy) < 34 && Math.abs(body.av) < 0.5 && motion < 62) {
            body.readyFrames += 1;
            if (body.readyFrames >= 2) {
              unlockNextPiece();
            }
          } else if (activeBody && (!supported || motion > 78 || Math.abs(body.vy) > 48)) {
            body.readyFrames = 0;
          }

          const settleThreshold = activeBody ? 12 : 9;
          const settleFramesNeeded = activeBody ? 4 : 6;
          if (body.hitSomething && supported && motion < settleThreshold && body.y > -80) {
            body.stableFrames += 1;
            body.sleepFrames += 1;
            if (stageContact.touching) {
              enforceStageGrip(body, stageContact, 0.72);
            } else {
              body.vx *= 0.55;
              body.av *= 0.72;
            }
            if (Math.abs(body.vx) < 0.035) body.vx = 0;
            if (Math.abs(body.av) < 0.0035) body.av = 0;
            if (!body.counted && body.stableFrames >= settleFramesNeeded) {
              body.counted = true;
              onBodySettled(body);
            } else if (body.counted && body.sleepFrames >= 5 && Math.abs(body.vy) < 4) {
              body.sleep = true;
              body.vx = 0;
              body.vy = 0;
              body.av = 0;
            }
          } else {
            body.stableFrames = 0;
            body.sleepFrames = 0;
          }
        }

        for (const body of state.bodies) {
          const ext = body.aabb || updateBodyAabb(body);
          const offStage = ext.maxX < state.stageLeft || ext.minX > state.stageRight;
          const fellBelowStage = ext.minY > state.groundY + 10;
          const outOfView = ext.minY > state.height + 8 || ext.maxX < -8 || ext.minX > state.width + 8;
          if ((offStage && fellBelowStage) || outOfView) {
            triggerGameOver('トロールがステージの端から落下しました。');
            break;
          }
        }

        if (!state.gameOver) {
          state.bodies = state.bodies.filter(body => {
            const ext = body.aabb || updateBodyAabb(body);
            return ext.minY < state.height + 260 && ext.maxX > -260 && ext.minX < state.width + 260;
          });
        }

        for (const p of state.particles) {
          p.age += dt;
          p.vy += 260 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        state.particles = state.particles.filter(p => p.age < p.life);
      }

      function getBodyExtents(body) {
        const c = Math.cos(body.angle);
        const s = Math.sin(body.angle);
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const circle of body.circles) {
          const wx = body.x + circle.x * c - circle.y * s;
          const wy = body.y + circle.x * s + circle.y * c;
          minX = Math.min(minX, wx - circle.r);
          maxX = Math.max(maxX, wx + circle.r);
          minY = Math.min(minY, wy - circle.r);
          maxY = Math.max(maxY, wy + circle.r);
        }

        return { minX, maxX, minY, maxY };
      }

      function getStageCenterX() {
        return (state.stageLeft + state.stageRight) * 0.5;
      }

      function getStageSurfaceY(x) {
        return state.groundY;
      }

      function getStageSurfaceSlope(x) {
        return 0;
      }

      function resolveStageTop(body, circle) {
        if (body.frozenByItem) return;
        const wp = worldPoint(body, circle);
        if (wp.x < state.stageLeft - circle.r * 0.45 || wp.x > state.stageRight + circle.r * 0.45) return false;
        const surfaceY = getStageSurfaceY(clamp(wp.x, state.stageLeft, state.stageRight));
        const slope = getStageSurfaceSlope(wp.x);
        const invLen = 1 / Math.max(Math.hypot(slope, -1), 0.0001);
        const nx = slope * invLen;
        const ny = -1 * invLen;
        const planeOffset = wp.x * nx + surfaceY * ny;
        return resolveStaticPlane(body, circle, nx, ny, planeOffset);
      }

      function getStageContactInfo(body) {
        const ext = body.aabb || updateBodyAabb(body);
        if (ext.maxX < state.stageLeft - 16 || ext.minX > state.stageRight + 16 || ext.maxY < state.groundY - 26 || ext.minY > state.groundY + 30) {
          return { touching: false, rollRadius: 0, contactSpan: 0, contacts: [] };
        }
        let touching = false;
        let rollRadius = 0;
        let minContactX = Infinity;
        let maxContactX = -Infinity;
        const contacts = [];
        for (const circle of body.circles) {
          const wp = worldPoint(body, circle);
          const nearStageX = wp.x >= state.stageLeft - circle.r * 0.62 && wp.x <= state.stageRight + circle.r * 0.62;
          const surfaceY = getStageSurfaceY(clamp(wp.x, state.stageLeft, state.stageRight));
          const stageDelta = (wp.y + circle.r) - surfaceY;
          const nearStageY = stageDelta > -3 && stageDelta < 10;
          if (nearStageX && nearStageY) {
            touching = true;
            const contactRadius = Math.max((wp.y + circle.r) - body.y, 12);
            rollRadius = Math.max(rollRadius, contactRadius);
            minContactX = Math.min(minContactX, wp.x);
            maxContactX = Math.max(maxContactX, wp.x);
            contacts.push({ circle, wp, contactRadius, stageDelta, surfaceY });
          }
        }
        const contactSpan = touching ? Math.max(0, maxContactX - minContactX) : 0;
        return { touching, rollRadius, contactSpan, contacts };
      }

      function isTouchingStage(body) {
        return getStageContactInfo(body).touching;
      }

      function enforceStageGrip(body, stageContact, strength = 1) {
        if (body.frozenByItem) return;
        if (!stageContact.touching || !stageContact.contacts.length) return;

        const ext = body.aabb || updateBodyAabb(body);
        const bodyWidth = Math.max(18, ext.maxX - ext.minX);
        const widePatch = stageContact.contactSpan > bodyWidth * 0.24;
        const nearlyFlat = Math.abs(body.angle) < 0.52;
        const anchoredPatch = widePatch && nearlyFlat;
        const basePasses = anchoredPatch ? 9 : 6;
        const gripPasses = Math.max(3, Math.round(basePasses * strength));
        const lambdaCap = (anchoredPatch ? 460 : 300) * Math.max(0.65, strength);

        for (let iter = 0; iter < gripPasses; iter++) {
          for (const contact of stageContact.contacts) {
            const wp = worldPoint(body, contact.circle);
            const contactRadius = Math.max((wp.y + contact.circle.r) - body.y, 12);
            const tangentialVel = body.vx - body.av * contactRadius;
            const denom = body.invMass + (contactRadius * contactRadius) * body.invInertia;
            const lambda = clamp(-tangentialVel / Math.max(denom, 0.0001), -lambdaCap, lambdaCap);
            body.vx += lambda * body.invMass;
            body.av += (-contactRadius * lambda) * body.invInertia;
          }
        }

        if (anchoredPatch) {
          if (body.stageAnchorX == null) body.stageAnchorX = body.x;
          body.stageAnchorStrength = Math.min(1, body.stageAnchorStrength + 0.2 * strength);
          const anchorPull = clamp((body.stageAnchorX - body.x) * (1.18 + body.stageAnchorStrength * 0.62), -14 * strength, 14 * strength);
          body.x += anchorPull;
          body.vx *= 0.08;
          if (Math.abs(body.vx) < 10) body.vx = 0;
          if (Math.abs(body.av) < 0.035) body.av = 0;
        } else {
          body.stageAnchorStrength = Math.max(0, body.stageAnchorStrength - 0.28 * strength);
          if (body.stageAnchorStrength <= 0.02) {
            body.stageAnchorStrength = 0;
            body.stageAnchorX = null;
          }
        }

        body.vy = Math.min(body.vy, 0);
        if (Math.abs(body.vy) < 9) body.vy = 0;
        if (Math.abs(body.vx) < 0.014) body.vx = 0;
      }

      function isSupportedByBodies(body) {
        const bodyAabb = body.aabb || updateBodyAabb(body);
        for (const other of state.bodies) {
          if (other === body) continue;
          const otherAabb = other.aabb || updateBodyAabb(other);
          if (otherAabb.maxX < bodyAabb.minX - 10 || otherAabb.minX > bodyAabb.maxX + 10) continue;
          if (otherAabb.minY > bodyAabb.maxY + 12 || otherAabb.maxY < bodyAabb.minY - 6) continue;
          for (const circle of body.circles) {
            const wp = worldPoint(body, circle);
            for (const oc of other.circles) {
              const op = worldPoint(other, oc);
              const dx = op.x - wp.x;
              const dy = op.y - wp.y;
              const reach = circle.r + oc.r + 2.5;
              if (dy > 0.5 && dy < reach && Math.abs(dx) < reach && (dx * dx + dy * dy) <= reach * reach) {
                return true;
              }
            }
          }
        }
        return false;
      }

      function drawRoundedRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }

      function render() {
        ctx.clearRect(0, 0, state.width, state.height);

        const sky = ctx.createLinearGradient(0, 0, 0, state.height);
        sky.addColorStop(0, '#36245d');
        sky.addColorStop(0.5, '#241542');
        sky.addColorStop(1, '#160d2c');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, state.width, state.height);

        drawStars();

        ctx.save();
        ctx.translate(0, state.cameraY);
        drawStage();
        for (const body of state.bodies) drawBody(body);
        drawGhostPiece();
        drawParticles();
        ctx.restore();

      }

      function drawStars() {
        ctx.save();
        for (let i = 0; i < 26; i++) {
          const x = (i * 43.7) % state.width;
          const y = (i * 61.3) % (state.height * 0.55);
          const alpha = 0.08 + (Math.sin(performance.now() * 0.0015 + i) + 1) * 0.05;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, i % 3 === 0 ? 2.1 : 1.2, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }

      function drawStage() {
        ctx.save();

        const stageGlow = ctx.createRadialGradient(
          state.width * 0.5,
          state.groundY - 16,
          14,
          state.width * 0.5,
          state.groundY - 16,
          state.stageWidth * 1.28
        );
        stageGlow.addColorStop(0, 'rgba(255,209,102,0.18)');
        stageGlow.addColorStop(1, 'rgba(255,209,102,0)');
        ctx.fillStyle = stageGlow;
        ctx.fillRect(0, state.groundY - 140, state.width, 210);

        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, state.groundY + 12, state.stageLeft - 8, state.height - state.groundY);
        ctx.fillRect(state.stageRight + 8, state.groundY + 12, state.width - state.stageRight - 8, state.height - state.groundY);

        const sampleCount = 22;
        const pts = [];
        for (let i = 0; i <= sampleCount; i++) {
          const t = i / sampleCount;
          const x = state.stageLeft + state.stageWidth * t;
          pts.push({ x, y: getStageSurfaceY(x) });
        }

        const trayThickness = 18;
        const trayOverhang = 12;
        const trayTopGrad = ctx.createLinearGradient(0, state.groundY - 20, 0, state.groundY + 26);
        trayTopGrad.addColorStop(0, '#8d6fb2');
        trayTopGrad.addColorStop(0.55, '#6b4f8a');
        trayTopGrad.addColorStop(1, '#46305c');
        ctx.fillStyle = trayTopGrad;

        ctx.beginPath();
        ctx.moveTo(pts[0].x - trayOverhang, pts[0].y + 8);
        ctx.lineTo(pts[0].x - 2, pts[0].y + 1);
        for (const p of pts) ctx.lineTo(p.x, p.y);
        ctx.lineTo(pts[pts.length - 1].x + 2, pts[pts.length - 1].y + 1);
        ctx.lineTo(pts[pts.length - 1].x + trayOverhang, pts[pts.length - 1].y + 8);
        ctx.lineTo(pts[pts.length - 1].x + 4, pts[pts.length - 1].y + trayThickness);
        for (let i = pts.length - 1; i >= 0; i--) {
          const p = pts[i];
          ctx.lineTo(p.x, p.y + trayThickness);
        }
        ctx.lineTo(pts[0].x - 4, pts[0].y + trayThickness);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y - 1);
        for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y - 1);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(58,37,81,0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pts[0].x - 1, pts[0].y + trayThickness - 2);
        for (const p of pts.slice(1)) ctx.lineTo(p.x + 1, p.y + trayThickness - 2);
        ctx.stroke();

        const baseGrad = ctx.createLinearGradient(0, state.groundY + 16, 0, state.height);
        baseGrad.addColorStop(0, '#6d4d86');
        baseGrad.addColorStop(1, '#39264f');
        ctx.fillStyle = baseGrad;
        drawRoundedRect(state.stageLeft + 12, state.groundY + 16, state.stageWidth - 24, state.height - state.groundY + 24, 20);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        drawRoundedRect(state.stageLeft + 26, state.groundY + 22, state.stageWidth - 52, 16, 8);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = '700 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE', state.width * 0.5, state.groundY + 48);
        ctx.textAlign = 'start';
        ctx.restore();
      }

      function drawBody(body) {
        ctx.save();
        ctx.translate(body.x, body.y);
        ctx.rotate(body.angle);

        if (body.glow > 0.01) {
          ctx.save();
          ctx.globalAlpha = Math.min(0.3, body.glow * 0.35);
          ctx.filter = 'blur(14px)';
          ctx.drawImage(body.asset.img, -body.width / 2, -body.height / 2, body.width, body.height);
          ctx.restore();
        }

        ctx.drawImage(body.asset.img, -body.width / 2, -body.height / 2, body.width, body.height);
        ctx.restore();
      }

      function drawGhostPiece() {
        if (!state.running || state.gameOver || !state.currentAsset) return;
        const bounds = getCurrentDropBounds();
        const x = clamp(state.pointerX, bounds.min, bounds.max);
        const bob = Math.sin(performance.now() * 0.0035) * 4;
        const angle = state.currentRotation;
        const width = state.currentAsset.width * SIZE_REDUCTION;
        const height = state.currentAsset.height * SIZE_REDUCTION;

        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = state.itemActive ? 'rgba(139,233,253,0.60)' : 'rgba(255,255,255,0.26)';
        const spawnY = getSpawnWorldY();
        ctx.beginPath();
        ctx.moveTo(x, -state.cameraY + 36);
        ctx.lineTo(x, state.groundY - 28);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.translate(x, spawnY + bob);
        ctx.rotate(angle);

        if (state.itemActive) {
          // アイテム装備中は青いグロー
          ctx.save();
          ctx.globalAlpha = 0.45 + Math.sin(performance.now() * 0.006) * 0.15;
          ctx.filter = 'blur(12px)';
          ctx.fillStyle = 'rgba(139,233,253,0.7)';
          ctx.fillRect(-width / 2, -height / 2, width, height);
          ctx.restore();
          // アイテムアイコン
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.font = `bold ${Math.round(width * 0.45)}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧲', 0, 0);
          ctx.restore();
        }

        ctx.drawImage(state.currentAsset.img, -width / 2, -height / 2, width, height);
        ctx.restore();
      }

      function drawParticles() {
        for (const p of state.particles) {
          const t = 1 - p.age / p.life;
          ctx.save();
          ctx.globalAlpha = Math.max(0, t);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * t, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }

      function loop(ts) {
        if (!state.lastTime) state.lastTime = ts;
        const frameTime = Math.min(0.05, (ts - state.lastTime) / 1000);
        state.lastTime = ts;

        if (state.running) {
          state.accumulator += frameTime;
          let steps = 0;
          while (state.accumulator >= FIXED_DT && steps < MAX_STEPS) {
            updatePhysics(FIXED_DT);
            updateCamera();
            state.accumulator -= FIXED_DT;
            steps++;
          }
        }

        render();
        requestAnimationFrame(loop);
      }

      function getPointerX(evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        return clamp((clientX - rect.left) * (state.width / rect.width), 0, state.width);
      }

      function beginDrag(evt) {
        state.pointerX = getPointerX(evt);
        if (!state.running || state.gameOver || state.dropLocked || !state.currentAsset) return;
        state.isDragging = true;
        if (evt.pointerId != null && canvas.setPointerCapture) {
          try { canvas.setPointerCapture(evt.pointerId); } catch (_) {}
        }
        updateDropAvailability();
      }

      function moveDrag(evt) {
        state.pointerX = getPointerX(evt);
      }

      function endDrag(evt, shouldDrop = true) {
        if (!state.isDragging) return;
        state.isDragging = false;
        if (evt && evt.pointerId != null && canvas.releasePointerCapture) {
          try { if (canvas.hasPointerCapture(evt.pointerId)) canvas.releasePointerCapture(evt.pointerId); } catch (_) {}
        }
        updateDropAvailability();
        if (shouldDrop && state.running && !state.gameOver && !state.dropLocked && state.currentAsset) {
          dropCurrent();
        }
      }

      canvas.addEventListener('pointermove', evt => {
        moveDrag(evt);
      });
      canvas.addEventListener('pointerdown', evt => {
        beginDrag(evt);
      });
      canvas.addEventListener('pointerup', evt => {
        endDrag(evt, true);
      });
      canvas.addEventListener('pointercancel', evt => {
        endDrag(evt, false);
      });
      canvas.addEventListener('touchstart', evt => {
        beginDrag(evt);
      }, { passive: true });
      canvas.addEventListener('touchmove', evt => {
        moveDrag(evt);
      }, { passive: true });
      canvas.addEventListener('touchend', evt => {
        endDrag(evt, true);
      }, { passive: true });
      canvas.addEventListener('touchcancel', evt => {
        endDrag(evt, false);
      }, { passive: true });
      window.addEventListener('keydown', evt => {
        if (evt.code === 'Space') {
          evt.preventDefault();
          dropCurrent();
        } else if (evt.code === 'KeyQ' || evt.code === 'KeyA') {
          evt.preventDefault();
          rotateCurrent(-ROTATION_STEP);
        } else if (evt.code === 'KeyE' || evt.code === 'KeyD') {
          evt.preventDefault();
          rotateCurrent(ROTATION_STEP);
        } else if (evt.code === 'KeyR') {
          restartGame(true);
        }
      });

      startBtn.addEventListener('click', () => {
        overlay.classList.remove('show');
        restartGame(true);
      });
      function handleRotateButton(evt, delta) {
        evt.preventDefault();
        evt.stopPropagation();
        rotateCurrent(delta);
      }

      if (rotateLeftCanvasBtn) {
        rotateLeftCanvasBtn.addEventListener('click', evt => {
          handleRotateButton(evt, -ROTATION_STEP);
        });
      }
      if (rotateRightCanvasBtn) {
        rotateRightCanvasBtn.addEventListener('click', evt => {
          handleRotateButton(evt, ROTATION_STEP);
        });
      }
      if (dropBtn) {
        dropBtn.addEventListener('click', evt => {
          evt.preventDefault();
          if (!state.dropLocked) dropCurrent();
        });
      }
      restartBtn.addEventListener('click', () => restartGame(true));

      if (itemBtn) {
        itemBtn.addEventListener('click', () => {
          if (state.itemCount <= 0 || !state.running || state.gameOver) return;
          if (state.itemActive) {
            // キャンセル
            state.itemActive = false;
            setMessage('アイテムをキャンセルしました。', 1.0);
          } else {
            state.itemActive = true;
            state.itemCount -= 1;
            setMessage('🧲 次のトロールに固定アイテム装備！ 落としてね！', 2.0);
          }
          updateHud();
        });
      }



      async function init() {
        resize();
        await loadVersion();
        const defs = defaultTrollSvgs();
        const prepared = await Promise.allSettled(defs.map(prepareSprite));
        state.assets = prepared.filter(r => r.status === 'fulfilled').map(r => r.value);
        prepared.filter(r => r.status === 'rejected').forEach(r => console.warn('sprite load skipped:', r.reason));
        if (!state.assets.length) throw new Error('No sprite assets could be loaded.');
        startRound();
        updateDropAvailability();
        requestAnimationFrame(loop);
      }

      window.addEventListener('resize', resize);
      init().catch(error => {
        console.error(error);
        overlay.querySelector('.dialog').innerHTML = `
          <h2>読み込みエラー</h2>
          <p>アセットの初期化に失敗しました。</p>
          <div class="actions"><button id="reloadBtn" class="primary">再読み込み</button></div>
        `;
        overlay.classList.add('show');
        overlay.querySelector('#reloadBtn').addEventListener('click', () => location.reload(), { once: true });
      });
    })();
  
