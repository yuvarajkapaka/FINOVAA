import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * FINOVA Liquid Metal WebGL Shader Canvas
 * 
 * Inspired by paper.design, aidesigner.ai, and fluidkit.
 * Uses domain-warped Fractal Brownian Motion (FBM), finite-difference normal calculation,
 * and reflective metallic environment shading tuned for FINOVA's light theme.
 * 
 * License: MIT / Public Domain GLSL procedural shading.
 * Zero external dependencies.
 */

// Fullscreen quad vertex shader
const VS_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Domain-Warped Liquid Chrome Fragment Shader
const FS_SOURCE = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_speed;
uniform float u_intensity;

// Simplex-inspired fast procedural noise building blocks
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// 3-octave FBM for smooth liquid evaluation
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = p * 2.04 + vec3(0.15, 0.28, 0.41);
    a *= 0.5;
  }
  return v;
}

// Organic Domain Warping (creates swirling, viscous liquid-chrome folds)
float liquidHeight(vec2 p, float time, vec2 mouse) {
  // Subtle cursor ripple influence
  vec2 mDiff = p - mouse;
  float mDist = length(mDiff);
  float mInfluence = smoothstep(0.75, 0.0, mDist) * 0.16;
  vec2 warpOffset = mDiff * mInfluence;

  vec3 pos = vec3((p + warpOffset) * 1.6, time * 0.14);

  // Layer 1 warp
  vec3 q = vec3(
    fbm(pos),
    fbm(pos + vec3(4.3, 1.7, 0.8)),
    0.0
  );

  // Layer 2 warp
  vec3 r = vec3(
    fbm(pos + 2.8 * q + vec3(1.7, 9.2, 0.5)),
    fbm(pos + 2.8 * q + vec3(8.3, 2.8, 1.2)),
    0.0
  );

  return fbm(pos + 3.2 * r);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / min(u_resolution.x, u_resolution.y),
                     u_resolution.y / min(u_resolution.x, u_resolution.y));
  vec2 p = (v_uv - 0.5) * aspect;
  vec2 m = (u_mouse - 0.5) * aspect;

  float t = u_time * u_speed;

  // Calculate surface gradient & normals via finite differences
  float eps = 0.0035;
  float h = liquidHeight(p, t, m);
  float hx = liquidHeight(p + vec2(eps, 0.0), t, m);
  float hy = liquidHeight(p + vec2(0.0, eps), t, m);

  vec3 normal = normalize(vec3((hx - h) / eps, (hy - h) / eps, 0.82));

  // Incident view direction and reflection vector
  vec3 viewDir = vec3(0.0, 0.0, -1.0);
  vec3 ref = reflect(viewDir, normal);

  // Simulated liquid-metal studio lighting setup
  float studioBand = sin(ref.x * 3.2 + ref.y * 2.2 + t * 0.22) * 0.5 + 0.5;
  float chromeLight = pow(studioBand, 2.6);

  // High-order specular highlights along fluid crests
  vec3 lightDir = normalize(vec3(0.35, 0.55, 0.75));
  float specPop = pow(max(dot(ref, lightDir), 0.0), 14.0);

  // FINOVA Palette Color Grading for Warm Light Theme:
  // Warm Ivory Canvas: #F2F0E8
  vec3 cIvory = vec3(0.949, 0.941, 0.910);
  // White Specular Gleam: #FFFFFF
  vec3 cWhite = vec3(1.0, 1.0, 1.0);
  // Muted Sage Reflection: #A8B39A
  vec3 cSage = vec3(0.659, 0.702, 0.604);
  // Soft Emerald Reflection: #2F6A4F
  vec3 cEmerald = vec3(0.184, 0.416, 0.310);
  // Muted Gold Accent: #D8C18A
  vec3 cGold = vec3(0.847, 0.757, 0.541);

  // Liquid metallic color blending
  vec3 metalTone = mix(cIvory, cWhite, chromeLight * 0.75);
  metalTone = mix(metalTone, cSage, clamp(normal.x * 0.55 + 0.25, 0.0, 0.42));
  metalTone = mix(metalTone, cEmerald, clamp(normal.y * 0.45, 0.0, 0.22));
  metalTone = mix(metalTone, cGold, clamp(ref.z * 0.28 - 0.05, 0.0, 0.18));

  // Specular sheen
  vec3 finalColor = metalTone + specPop * cWhite * 0.38;

  // Luminous light-theme alpha
  gl_FragColor = vec4(finalColor, u_intensity);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Shader compile failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function LiquidMetalCanvas({
  intensity = 0.45,
  speed = 0.5,
  onFallback = null
}) {
  const canvasRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  // Mouse interpolation state for smooth cursor ripple
  const mouseRef = useRef({ currentX: 0.5, currentY: 0.5, targetX: 0.5, targetY: 0.5 });
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  const triggerFallback = useCallback(() => {
    setHasError(true);
    if (onFallback) onFallback();
  }, [onFallback]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Get WebGL context (WebGL2 preferred, fallback to WebGL1)
    let gl = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) {
      gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    }

    if (!gl) {
      console.warn('WebGL not supported on this browser. Activating CSS fallback.');
      triggerFallback();
      return;
    }

    // Handle WebGL context loss and recovery
    const handleContextLost = (e) => {
      e.preventDefault();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      console.warn('WebGL Context Lost. Liquid metal paused.');
    };

    const handleContextRestored = () => {
      console.info('WebGL Context Restored. Reinitializing Liquid Metal...');
      initGL();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    let program = null;
    let positionBuffer = null;
    let uniforms = {};

    function initGL() {
      program = createProgram(gl, VS_SOURCE, FS_SOURCE);
      if (!program) {
        triggerFallback();
        return;
      }

      gl.useProgram(program);

      // Create fullscreen quad buffer (two triangles)
      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const aPositionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(aPositionLocation);
      gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

      // Cache uniform locations
      uniforms = {
        u_resolution: gl.getUniformLocation(program, 'u_resolution'),
        u_time: gl.getUniformLocation(program, 'u_time'),
        u_mouse: gl.getUniformLocation(program, 'u_mouse'),
        u_speed: gl.getUniformLocation(program, 'u_speed'),
        u_intensity: gl.getUniformLocation(program, 'u_intensity'),
      };
    }

    initGL();

    // Resize handler (scales appropriately for mobile and desktop screens)
    function resizeCanvas() {
      if (!canvas || !gl) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25); // Cap resolution for maximum GPU efficiency
      const displayWidth = Math.max(1, Math.floor(rect.width * dpr));
      const displayHeight = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Track mouse on desktop (fine pointer devices only)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const handleMouseMove = (e) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = (e.clientX - rect.left) / rect.width;
      mouseRef.current.targetY = 1.0 - (e.clientY - rect.top) / rect.height; // WebGL Y is inverted
    };

    if (isFinePointer && !prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Render loop
    let isPaused = false;
    const handleVisibilityChange = () => {
      isPaused = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    function render(now) {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const delta = (now - lastTimeRef.current) * 0.001;
      lastTimeRef.current = now;

      if (!isPaused && gl && program) {
        // Increment time
        if (!prefersReducedMotion) {
          timeRef.current += delta;
        } else {
          timeRef.current = 2.0; // Static frame for reduced motion
        }

        // Smooth mouse lerping
        mouseRef.current.currentX += (mouseRef.current.targetX - mouseRef.current.currentX) * 0.05;
        mouseRef.current.currentY += (mouseRef.current.targetY - mouseRef.current.currentY) * 0.05;

        gl.useProgram(program);
        gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.u_time, timeRef.current);
        gl.uniform2f(uniforms.u_mouse, mouseRef.current.currentX, mouseRef.current.currentY);
        gl.uniform1f(uniforms.u_speed, speed);
        gl.uniform1f(uniforms.u_intensity, intensity);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      if (!prefersReducedMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    }

    animFrameRef.current = requestAnimationFrame(render);

    // Initial render for reduced motion
    if (prefersReducedMotion) {
      render(performance.now());
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
      if (isFinePointer) window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      if (gl) {
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (program) gl.deleteProgram(program);
      }
    };
  }, [intensity, speed, triggerFallback]);

  if (hasError) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none transition-opacity duration-700"
      style={{
        transform: 'translateZ(0)',
        willChange: 'opacity'
      }}
      aria-hidden="true"
    />
  );
}
