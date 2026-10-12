import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * FINOVA Liquid Metal WebGL Shader Canvas
 * 
 * Inspired by aidesigner.ai/backgrounds/liquid-metal and paper.design/liquid-metal.
 * Features:
 * - Domain-warped harmonic fluid dynamics simulating viscous liquid mercury.
 * - Finite-difference normal calculation with heightened surface curvature.
 * - Multi-band studio lighting reflections (specular platinum glints, Fresnel sheen).
 * - Calibrated FINOVA luxury palette (warm ivory, platinum white, sage, forest green, gold, copper).
 * - Interactive cursor ripple with smooth spring interpolation.
 * - Continuous, organic fluid motion even when stationary.
 * - Respects prefers-reduced-motion; pauses on inactive tabs; zero memory leaks.
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

// Molten Liquid Chrome Fragment Shader
const FS_SOURCE = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_speed;
uniform float u_intensity;

// 2D Rotation matrix for multi-angle wave domain warping
mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

// Multi-layered domain-warped fluid field simulating molten mercury
float liquidField(vec2 p, float time, vec2 mouse) {
  // Cursor-reactive gentle fluid ripple & displacement
  vec2 d = p - mouse;
  float dist = length(d);
  float mousePush = exp(-dist * 3.6) * 0.28;
  p += (d / (dist + 0.001)) * mousePush;

  vec2 q = p;
  float w = 0.0;

  // Harmonic 1: Broad sweeping tidal current
  q = rot(0.54) * q;
  w += sin(q.x * 1.9 + time * 0.44 + sin(q.y * 1.5)) * 0.48;

  // Harmonic 2: Swirling domain warp fold
  q = rot(1.14) * q * 1.40 + vec2(w * 0.65, time * 0.30);
  w += sin(q.y * 2.3 + cos(q.x * 1.9 + time * 0.54)) * 0.38;

  // Harmonic 3: Viscous eddy currents
  q = rot(-0.70) * q * 1.54 + vec2(time * 0.22, w * 0.70);
  w += sin(q.x * 2.9 + q.y * 2.3 + time * 0.64) * 0.26;

  // Harmonic 4: Fine fluid ripples
  q = rot(0.84) * q * 1.70;
  w += sin(q.x * 3.8 - time * 0.74) * sin(q.y * 3.8 + time * 0.48) * 0.16;

  return w;
}

void main() {
  vec2 aspect = vec2(u_resolution.x / min(u_resolution.x, u_resolution.y),
                     u_resolution.y / min(u_resolution.x, u_resolution.y));
  vec2 p = (v_uv - 0.5) * aspect;
  vec2 m = (u_mouse - 0.5) * aspect;

  float t = u_time * u_speed;

  // Finite differences for accurate surface gradient and normals
  float eps = 0.006;
  float h  = liquidField(p, t, m);
  float hx = liquidField(p + vec2(eps, 0.0), t, m);
  float hy = liquidField(p + vec2(0.0, eps), t, m);

  vec2 grad = vec2((hx - h) / eps, (hy - h) / eps);
  vec3 normal = normalize(vec3(-grad * 2.2, 1.0));

  // Incident view vector and reflection ray
  vec3 viewDir = vec3(0.0, 0.0, -1.0);
  vec3 ref = reflect(viewDir, normal);

  // Chrome Studio Environment Lighting (curved lightboxes & luminous strips)
  float studioBand1 = sin(ref.x * 3.4 + ref.y * 2.2 + t * 0.32) * 0.5 + 0.5;
  float studioBand2 = cos(ref.x * 2.0 - ref.y * 3.4 - t * 0.22) * 0.5 + 0.5;
  float chromeLight = pow(studioBand1, 2.2) * 0.65 + pow(studioBand2, 3.0) * 0.35;

  // Dual specular lights for fluid crest glints
  vec3 light1 = normalize(vec3(0.35, 0.65, 0.75));
  vec3 light2 = normalize(vec3(-0.45, 0.35, 0.85));
  float spec1 = pow(max(0.0, dot(ref, light1)), 32.0);
  float spec2 = pow(max(0.0, dot(ref, light2)), 18.0);

  // Fresnel rim reflection
  float fresnel = pow(1.0 - max(0.0, dot(normal, -viewDir)), 2.8);

  // FINOVA Luxury Palette:
  vec3 cIvory   = vec3(0.949, 0.941, 0.910); // Warm Ivory Canvas #F2F0E8
  vec3 cWhite   = vec3(1.000, 1.000, 1.000); // White Gleam #FFFFFF
  vec3 cPewter  = vec3(0.620, 0.680, 0.640); // Shaded mercury crease
  vec3 cSage    = vec3(0.659, 0.702, 0.604); // Sage #A8B39A
  vec3 cEmerald = vec3(0.184, 0.416, 0.310); // Soft Emerald #2F6A4F
  vec3 cForest  = vec3(0.145, 0.294, 0.231); // Forest Green #254B3B
  vec3 cGold    = vec3(0.847, 0.757, 0.541); // Muted Gold #D8C18A
  vec3 cCopper  = vec3(0.784, 0.475, 0.322); // Warm Copper #C87952

  // Base molten mercury surface: transitioning from cool shaded pewter in creases to platinum crests
  vec3 mercury = mix(cPewter, cWhite, smoothstep(-0.65, 0.70, h));

  // Add studio chrome reflective sheen
  mercury = mix(mercury, cWhite, chromeLight * 0.52);

  // Dynamic metallic reflections matching FINOVA color identity
  mercury = mix(mercury, cSage, clamp(normal.x * 0.42 + 0.14, 0.0, 0.26));
  mercury = mix(mercury, cEmerald, clamp(-normal.y * 0.36, 0.0, 0.22));
  mercury = mix(mercury, cForest, clamp(-normal.x * 0.32 - 0.04, 0.0, 0.16));
  mercury = mix(mercury, cGold, clamp(ref.x * 0.32 + ref.y * 0.22, 0.0, 0.20));
  mercury = mix(mercury, cCopper, clamp(-ref.x * 0.26 - 0.04, 0.0, 0.15));

  // High-order specular highlights along crests
  mercury += (spec1 * 0.65 + spec2 * 0.35) * cWhite;

  // Fresnel edge luminosity
  mercury = mix(mercury, cWhite, fresnel * 0.35);

  // Editorial blend over warm ivory canvas
  vec3 finalColor = mix(cIvory, mercury, clamp(u_intensity, 0.0, 1.0));

  gl_FragColor = vec4(finalColor, 1.0);
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
  intensity = 0.72,
  speed = 0.50,
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
    let gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
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
      const delta = Math.min((now - lastTimeRef.current) * 0.001, 0.1);
      lastTimeRef.current = now;

      if (!isPaused && gl && program) {
        // Increment time
        if (!prefersReducedMotion) {
          timeRef.current += delta;
        } else {
          timeRef.current = 2.5; // Static frame for reduced motion
        }

        // Smooth mouse lerping
        mouseRef.current.currentX += (mouseRef.current.targetX - mouseRef.current.currentX) * 0.06;
        mouseRef.current.currentY += (mouseRef.current.targetY - mouseRef.current.currentY) * 0.06;

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
