import React, { useEffect, useRef } from 'react';

/**
 * Componente per animazione di rete a grafo sullo sfondo
 * Rappresenta visivamente la connessione dei dati aperti
 * Ottimizzato per performance con caching e throttling
 */
export default function NetworkBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const fiberIndexRef = useRef(new Map()); // Mappa particelle per fibra
  const cachedPathsRef = useRef(new Map()); // Cache percorsi pre-calcolati
  const gradientsRef = useRef(new Map()); // Cache gradienti riutilizzabili
  const lastFrameTimeRef = useRef(0);
  const fpsHistoryRef = useRef([]); // Storia FPS per monitoraggio performance
  const shouldRenderRef = useRef(true); // Flag per render del canvas
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Rileva dispositivi molto deboli che non possono gestire l'animazione
    const isVeryLowEnd = () => {
      // Controlla indicatori hardware
      const hasLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
      const isOldMobile = /Android [4-6]\./i.test(navigator.userAgent);
      const isSlowConnection = navigator.connection && 
        (navigator.connection.effectiveType === 'slow-2g' || 
         navigator.connection.effectiveType === '2g');
      
      return hasLowCores || hasLowMemory || isOldMobile || isSlowConnection;
    };

    // Se dispositivo molto debole, disabilita completamente l'animazione
    if (isVeryLowEnd()) {
      console.info('NetworkBackground: Animazione disabilitata per dispositivo low-end');
      shouldRenderRef.current = false;
      canvas.style.display = 'none'; // Nascondi canvas, sfondo gestito da Home
      return; // Esci senza inizializzare animazione
    }

    // Ottimizzazione Canvas: alpha false per migliori performance
    const ctx = canvas.getContext('2d', { 
      alpha: true, 
      desynchronized: true // Permette rendering asincrono
    });
    let width = canvas.parentElement.offsetWidth;
    let height = canvas.parentElement.offsetHeight;
    let animationEnabled = true; // Flag per disabilitare se FPS troppo bassi

    // Imposta dimensioni canvas
    const setCanvasSize = () => {
      width = canvas.parentElement.offsetWidth;
      height = canvas.parentElement.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Rimuovi cache quando cambiano le dimensioni
      cachedPathsRef.current.clear();
      gradientsRef.current.clear();
    };
    setCanvasSize();

    // Rileva dispositivi meno potenti per ridurre carico
    const isMobileOrLowEnd = () => {
      return window.innerWidth < 768 || 
             (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    };

    // Configurazione particelle ottimizzata per dispositivo
    const performanceMultiplier = isMobileOrLowEnd() ? 0.5 : 1;
    const particleCount = Math.floor((width * height) / 30000 * performanceMultiplier);
    const baseSpeed = 0.2;
    const fiberCount = Math.floor(12 * performanceMultiplier); // Ridotto per performance

    // Monitoraggio FPS per rilevare performance inadeguate
    const monitorFPS = (deltaTime) => {
      const fps = 1000 / deltaTime;
      fpsHistoryRef.current.push(fps);
      
      // Mantieni solo ultimi 60 frame (1 secondo)
      if (fpsHistoryRef.current.length > 60) {
        fpsHistoryRef.current.shift();
      }
      
      // Dopo 2 secondi di monitoraggio, controlla se FPS troppo bassi
      if (fpsHistoryRef.current.length >= 120) { // 2 secondi
        const avgFPS = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        
        // Se FPS medio sotto 25, disabilita animazione
        if (avgFPS < 25 && animationEnabled) {
          console.warn(`NetworkBackground: FPS troppo bassi (${avgFPS.toFixed(1)}), disabilitazione animazione`);
          animationEnabled = false;
          shouldRenderRef.current = false;
          
          // Nascondi canvas, lo sfondo blu della Home rimane visibile
          canvas.style.display = 'none';
        }
      }
    };

    // Area del palazzo - multipli punti di interazione
    const palazzoArea = {
      centerX: width / 2,
      topY: height * 0.15,
      midY: height * 0.25,
      bottomY: height * 0.35,
      width: 200
    };

    // Fibre ottiche (percorsi fissi)
    const fibers = [];

    // Genera percorsi delle fibre ottiche
    const generateFibers = () => {
      fibers.length = 0;
      const offset = 30;
      
      for (let i = 0; i < fiberCount; i++) {
        const fiber = { 
          incoming: [], 
          outgoing: [],
          id: i // ID per caching
        };
        
        // Punto di interazione sul palazzo (parte sinistra dell'SVG)
        const palazzoInteractionX = palazzoArea.centerX - palazzoArea.width * 0.3 + (Math.random() * 50);
        const palazzoInteractionY = palazzoArea.topY + (Math.random() * (palazzoArea.bottomY - palazzoArea.topY));
        
        // Percorso in entrata da SINISTRA con Y casuali distribuiti
        const startX = -offset;
        const startY = height * 0.2 + (Math.random() * height * 0.6);
        
        // Punti di controllo per curve
        const midX1 = startX + (palazzoInteractionX - startX) * 0.25 + (Math.random() - 0.5) * 400;
        const midY1 = startY + (palazzoInteractionY - startY) * 0.25 + (Math.random() - 0.5) * 600;
        const midX2 = startX + (palazzoInteractionX - startX) * 0.75 + (Math.random() - 0.5) * 400;
        const midY2 = startY + (palazzoInteractionY - startY) * 0.75 + (Math.random() - 0.5) * 600;
        
        fiber.incoming = [
          { x: startX, y: startY },
          { x: midX1, y: midY1 },
          { x: midX2, y: midY2 },
          { x: palazzoInteractionX, y: palazzoInteractionY }
        ];
        
        // Percorso in uscita verso DESTRA
        const outEndX = width + offset;
        const outEndY = height * 0.2 + (Math.random() * height * 0.6);
        
        const outPalazzoX = palazzoArea.centerX + palazzoArea.width * 0.8 + (Math.random() * 30);
        const outPalazzoY = palazzoArea.topY + (Math.random() * (palazzoArea.bottomY - palazzoArea.topY));
        
        const outMidX1 = outPalazzoX + (outEndX - outPalazzoX) * 0.25 + (Math.random() - 0.5) * 400;
        const outMidY1 = outPalazzoY + (outEndY - outPalazzoY) * 0.25 + (Math.random() - 0.5) * 600;
        const outMidX2 = outPalazzoX + (outEndX - outPalazzoX) * 0.75 + (Math.random() - 0.5) * 400;
        const outMidY2 = outPalazzoY + (outEndY - outPalazzoY) * 0.75 + (Math.random() - 0.5) * 600;
        
        fiber.outgoing = [
          { x: outPalazzoX, y: outPalazzoY },
          { x: outMidX1, y: outMidY1 },
          { x: outMidX2, y: outMidY2 },
          { x: outEndX, y: outEndY }
        ];
        
        fibers.push(fiber);
      }
      
      // Pre-calcola tutti i percorsi per evitare calcoli ripetuti
      precomputeFiberPaths();
    };
    
    // Pre-calcola i punti dei percorsi Bezier per tutti i fiber
    const precomputeFiberPaths = () => {
      cachedPathsRef.current.clear();
      const segments = 20; // Ridotto da 25 per migliori performance
      
      fibers.forEach((fiber, fiberIndex) => {
        ['incoming', 'outgoing'].forEach(direction => {
          const path = fiber[direction];
          const points = [];
          
          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;
            const t2 = t * t;
            const t3 = t2 * t;
            
            points.push({
              x: mt3 * path[0].x + 3 * mt2 * t * path[1].x + 3 * mt * t2 * path[2].x + t3 * path[3].x,
              y: mt3 * path[0].y + 3 * mt2 * t * path[1].y + 3 * mt * t2 * path[2].y + t3 * path[3].y,
              t: t
            });
          }
          
          const key = `${fiberIndex}-${direction}`;
          cachedPathsRef.current.set(key, points);
        });
      });
    };
    
    generateFibers();
    
    // Crea gradienti riutilizzabili (ottimizzazione importante)
    const createReusableGradients = () => {
      gradientsRef.current.clear();
      
      // Gradienti per particelle normali (3 livelli di intensità)
      for (let intensity = 0; intensity < 3; intensity++) {
        const radius = 8 + intensity * 4;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
        gradient.addColorStop(0.3, `rgba(255, 255, 255, 0.5)`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        gradientsRef.current.set(`normal-${intensity}`, gradient);
      }
      
      // Gradienti per particelle importanti
      for (let intensity = 0; intensity < 3; intensity++) {
        const radius = 12 + intensity * 6;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
        gradient.addColorStop(0.3, `rgba(255, 255, 255, 0.7)`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        gradientsRef.current.set(`important-${intensity}`, gradient);
      }
      
      // Gradienti per alone centrale (3 livelli)
      for (let level = 0; level < 3; level++) {
        const radius = 80 - level * 15;
        const opacity = 0.15 - level * 0.025;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, `rgba(100, 180, 255, ${opacity})`);
        gradient.addColorStop(0.6, `rgba(100, 180, 255, ${opacity * 0.33})`);
        gradient.addColorStop(1, `rgba(100, 180, 255, 0)`);
        gradientsRef.current.set(`glow-${level}`, gradient);
      }
    };
    createReusableGradients();

    // Classe Particella ottimizzata
    class DataPulse {
      constructor(isIncoming = true, fiberIndex = 0) {
        this.isIncoming = isIncoming;
        this.fiberIndex = fiberIndex;
        this.progress = isIncoming ? Math.random() * 0.6 : 0;
        this.isImportant = Math.random() < 0.05;
        
        if (this.isImportant) {
          this.speed = (Math.random() * 0.5 + 2.0) * baseSpeed * 0.01;
        } else {
          this.speed = (Math.random() * 0.15 + 0.5) * baseSpeed * 0.01;
        }
        
        this.radius = Math.random() * 1.5 + 1;
        this.opacity = Math.random() * 0.4 + 0.6;
        this.fadeOut = false;
        this.fadeProgress = 1;
        
        // Cache del path key per lookup veloce
        const direction = this.isIncoming ? 'incoming' : 'outgoing';
        this.pathKey = `${fiberIndex}-${direction}`;
        this.cachedPath = cachedPathsRef.current.get(this.pathKey);
      }

      update() {
        if (this.fadeOut) {
          this.fadeProgress -= 0.08;
          if (this.fadeProgress <= 0) {
            return true; // Completato - respawn
          }
        } else {
          this.progress += this.speed;
          
          if (this.isIncoming && this.progress >= 0.7) {
            this.fadeOut = true;
          } else if (!this.isIncoming && this.progress >= 1) {
            return true;
          }
        }
        return false;
      }

      getPosition() {
        if (!this.cachedPath) return { x: 0, y: 0 };
        
        // Usa path pre-calcolato - interpolazione lineare tra punti
        const t = Math.min(this.progress, 1);
        const segments = this.cachedPath.length - 1;
        const segmentIndex = Math.floor(t * segments);
        const segmentT = (t * segments) - segmentIndex;
        
        const p1 = this.cachedPath[segmentIndex];
        const p2 = this.cachedPath[Math.min(segmentIndex + 1, segments)];
        
        return {
          x: p1.x + (p2.x - p1.x) * segmentT,
          y: p1.y + (p2.y - p1.y) * segmentT
        };
      }

      draw() {
        const pos = this.getPosition();
        const currentOpacity = this.opacity * this.fadeProgress;
        
        const glowMultiplier = this.isImportant ? 1.6 : 1;
        const gradientType = this.isImportant ? 'important' : 'normal';
        const intensityLevel = Math.floor(currentOpacity * 2); // 0, 1, o 2
        
        // Usa gradiente pre-creato
        const gradient = gradientsRef.current.get(`${gradientType}-${intensityLevel}`);
        
        if (gradient) {
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.globalAlpha = currentOpacity;
          
          // Alone luminoso
          ctx.beginPath();
          ctx.arc(0, 0, this.radius * 8 * glowMultiplier, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // Nucleo luminoso (senza creare nuovo gradiente)
          ctx.beginPath();
          ctx.arc(0, 0, this.radius * 1.2 * glowMultiplier, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
          ctx.fill();
          
          ctx.restore();
        }
      }
    }

    // Inizializza impulsi con indicizzazione per fibra
    const initParticles = () => {
      nodesRef.current = [];
      fiberIndexRef.current.clear();
      const halfCount = Math.floor(particleCount / 2);
      
      // Inizializza mappa per fibra
      for (let i = 0; i < fiberCount; i++) {
        fiberIndexRef.current.set(i, []);
      }
      
      // Crea particelle in entrata
      for (let i = 0; i < halfCount; i++) {
        const fiberIndex = Math.floor(Math.random() * fiberCount);
        const pulse = new DataPulse(true, fiberIndex);
        nodesRef.current.push(pulse);
        fiberIndexRef.current.get(fiberIndex).push(pulse);
      }
      
      // Crea particelle in uscita
      for (let i = 0; i < halfCount; i++) {
        const fiberIndex = Math.floor(Math.random() * fiberCount);
        const pulse = new DataPulse(false, fiberIndex);
        nodesRef.current.push(pulse);
        fiberIndexRef.current.get(fiberIndex).push(pulse);
      }
    };
    initParticles();

    // Disegna le fibre ottiche ottimizzate
    const drawFibers = () => {
      fibers.forEach((fiber, fiberIndex) => {
        drawFiberPath(fiberIndex, 'incoming', 200);
        drawFiberPath(fiberIndex, 'outgoing', 160);
      });
    };

    const drawFiberPath = (fiberIndex, direction, hue) => {
      const pathKey = `${fiberIndex}-${direction}`;
      const points = cachedPathsRef.current.get(pathKey);
      if (!points) return;
      
      // Ottiene particelle su questa fibra tramite indice
      const particlesOnFiber = fiberIndexRef.current.get(fiberIndex) || [];
      const relevantPulses = particlesOnFiber.filter(p => {
        return (direction === 'incoming' && p.isIncoming) || 
               (direction === 'outgoing' && !p.isIncoming);
      }).slice(0, 3); // Limita a 3 per ottimizzazione
      
      // Verifica presenza dati importanti
      const hasImportantPulse = relevantPulses.some(p => 
        p.isImportant && p.progress > 0.2 && p.progress < 0.6
      );
      
      const segments = points.length - 1;
      const baseOpacity = 0.08;
      const lineWidth = hasImportantPulse ? 4.5 : 3;
      
      // Disegna segmenti con batch di path
      ctx.lineWidth = lineWidth;
      
      for (let i = 0; i < segments; i++) {
        const t = points[i].t;
        let segmentOpacity = baseOpacity;
        
        // Calcola illuminazione solo se ci sono particelle
        if (relevantPulses.length > 0) {
          for (const pulse of relevantPulses) {
            const distance = Math.abs(pulse.progress - t);
            if (distance < 0.15) {
              const fade = 1 - (distance / 0.15);
              const pulseOpacity = pulse.isImportant ? 0.5 : 0.35;
              segmentOpacity = Math.max(segmentOpacity, pulseOpacity * fade * pulse.fadeProgress);
            }
          }
        }
        
        if (hasImportantPulse) {
          segmentOpacity = Math.max(segmentOpacity, 0.25);
        }
        
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.strokeStyle = `hsla(${hue}, 60%, 55%, ${segmentOpacity})`;
        ctx.stroke();
      }
    };

    // Disegna alone diffuso sul palazzo con gradienti riutilizzabili
    const drawCentralGlow = () => {
      const positions = [
        { x: palazzoArea.centerX, y: palazzoArea.topY, level: 0, radius: 80 },
        { x: palazzoArea.centerX, y: palazzoArea.midY, level: 1, radius: 60 },
        { x: palazzoArea.centerX, y: palazzoArea.bottomY, level: 2, radius: 50 }
      ];
      
      positions.forEach(pos => {
        const gradient = gradientsRef.current.get(`glow-${pos.level}`);
        if (gradient) {
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.beginPath();
          ctx.arc(0, 0, pos.radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.restore();
        }
      });
    };

    // Loop animazione con throttling FPS e monitoraggio performance
    const animate = (currentTime) => {
      // Se animazione disabilitata, ferma il loop
      if (!animationEnabled) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }
      
      // Throttle a targetFPS
      const elapsed = currentTime - lastFrameTimeRef.current;
      
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTimeRef.current = currentTime - (elapsed % frameInterval);
      
      // Monitora FPS per rilevare performance inadeguate
      monitorFPS(elapsed);
      
      // Clear con compositing ottimizzato
      ctx.clearRect(0, 0, width, height);
      
      // Disegna elementi statici
      drawFibers();
      drawCentralGlow();
      
      // Aggiorna e disegna impulsi
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const pulse = nodesRef.current[i];
        const shouldRemove = pulse.update();
        
        if (shouldRemove) {
          // Rimuovi dalla mappa fibra
          const fiberPulses = fiberIndexRef.current.get(pulse.fiberIndex);
          if (fiberPulses) {
            const idx = fiberPulses.indexOf(pulse);
            if (idx > -1) fiberPulses.splice(idx, 1);
          }
          
          // Crea nuovo impulso
          const fiberIndex = Math.floor(Math.random() * fiberCount);
          const newPulse = new DataPulse(pulse.isIncoming, fiberIndex);
          nodesRef.current[i] = newPulse;
          
          // Aggiungi alla mappa fibra
          fiberIndexRef.current.get(fiberIndex).push(newPulse);
        } else {
          pulse.draw();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Gestisci resize con debounce
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setCanvasSize();
        generateFibers();
        createReusableGradients();
        initParticles();
      }, 250); // Debounce di 250ms
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      
      // Pulizia cache
      cachedPathsRef.current.clear();
      gradientsRef.current.clear();
      fiberIndexRef.current.clear();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.5
      }}
      aria-hidden="true"
    />
  );
}
