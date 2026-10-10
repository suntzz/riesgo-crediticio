import React, { useEffect, useRef } from 'react';

/**
 * Recurso gráfico distintivo CrediRisk Quantitative Atelier:
 * Representa la proyección dimensional de las 23 variables del solicitante
 * sobre una retícula matemática con pesos de covarianza y enlaces neuronales tenues.
 * Optimizado para rendimiento estricto, 0 dependencias pesadas y respeto por prefers-reduced-motion.
 */
export const QuantitativeMesh: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Verificar preferencia de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    window.addEventListener('resize', handleResize);

    // 23 nodos que corresponden a las 23 variables crediticias
    const nodes = Array.from({ length: 23 }, (_, i) => {
      const angle = (i / 23) * Math.PI * 2;
      const radiusRatio = 0.25 + (i % 5) * 0.12;
      return {
        id: i,
        baseAngle: angle,
        baseRadius: radiusRatio,
        x: 0,
        y: 0,
        weight: 0.8 + ((i * 7) % 10) * 0.15,
        speed: prefersReducedMotion ? 0 : 0.0004 + (i % 3) * 0.0002,
        phase: i * 0.4,
      };
    });

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxR = Math.min(width, height) * 0.45;

      const isDark = document.documentElement.classList.contains('dark');
      const strokeColor = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.10)';
      const nodeColor = isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(37, 99, 235, 0.55)';
      const ringColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)';

      // 1. Dibujar anillos métricos de referencia analítica
      ctx.lineWidth = 1 * window.devicePixelRatio;
      [0.3, 0.6, 0.9].forEach((ring) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * ring, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.stroke();
      });

      // 2. Calcular coordenadas proyectadas de los 23 nodos
      nodes.forEach((node) => {
        const curAngle = node.baseAngle + (prefersReducedMotion ? 0 : time * node.speed);
        const r = maxR * (node.baseRadius + (prefersReducedMotion ? 0 : Math.sin(time * 0.001 + node.phase) * 0.03));
        node.x = cx + Math.cos(curAngle) * r;
        node.y = cy + Math.sin(curAngle) * r;
      });

      // 3. Trazar conexiones ponderadas entre nodos contiguos y correlacionados
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;
          const maxDistSq = (maxR * 0.65) ** 2;

          if (distSq < maxDistSq) {
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
          }
        }
      }
      ctx.stroke();

      // 4. Dibujar puntos de datos (nodos de la red)
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.2 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        time += 16;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative pointer-events-none select-none overflow-hidden ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default QuantitativeMesh;
