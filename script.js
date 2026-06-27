document.addEventListener('DOMContentLoaded', () => {
  // Clocks initialization
  initClocks();
  
  // Radar system initialization
  initRadar();

  // FIDS accordion initialization
  initFidsAccordion();

  // Active flight counter
  initMockMetrics();

  // Modal console initialization
  initModalConsole();
});

/* =========================================================================
   1. Live Clocks: Zulu (UTC) & Local (DC - Eastern Time)
   ========================================================================= */
function initClocks() {
  const zuluClock = document.getElementById('zulu-clock');
  const localClock = document.getElementById('local-clock');

  function updateClocks() {
    const now = new Date();

    // Zulu Time (UTC)
    const zuluHours = String(now.getUTCHours()).padStart(2, '0');
    const zuluMinutes = String(now.getUTCMinutes()).padStart(2, '0');
    const zuluSeconds = String(now.getUTCSeconds()).padStart(2, '0');
    zuluClock.textContent = `${zuluHours}:${zuluMinutes}:${zuluSeconds} Z`;

    // Local Time (Washington, DC - US Eastern)
    try {
      const localStr = now.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      localClock.textContent = `${localStr} LCL`;
    } catch (e) {
      const localHours = String(now.getHours()).padStart(2, '0');
      const localMinutes = String(now.getMinutes()).padStart(2, '0');
      const localSeconds = String(now.getSeconds()).padStart(2, '0');
      localClock.textContent = `${localHours}:${localMinutes}:${localSeconds} LCL`;
    }
  }

  updateClocks();
  setInterval(updateClocks, 1000);
}

/* =========================================================================
   2. Radar Screen Simulation (High-Precision Telemetry Console)
   ========================================================================= */
function initRadar() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  
  // High-res display scaling
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // Target coordinates mapped relative to radius scale
  const targets = [
    { name: 'RTN-25', x: 45, y: -45, label: 'RAYTHEON', intensity: 0, angle: 0, distance: 0 },
    { name: 'GWU-SL', x: -55, y: 35, label: 'GWU SEC LAB', intensity: 0, angle: 0, distance: 0 },
    { name: 'GWU-TA', x: -25, y: -65, label: 'GWU TA', intensity: 0, angle: 0, distance: 0 },
    { name: 'ATF-24', x: 60, y: 50, label: 'TEST FAC', intensity: 0, angle: 0, distance: 0 },
    { name: 'PRO-24', x: -65, y: -30, label: 'PROUT SCH', intensity: 0, angle: 0, distance: 0 }
  ];

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) - 10;

  // Polar conversion for sweeping check
  targets.forEach(t => {
    t.distance = Math.sqrt(t.x * t.x + t.y * t.y) * (maxRadius / 100);
    t.angle = Math.atan2(t.y, t.x);
    if (t.angle < 0) t.angle += 2 * Math.PI;
  });

  let sweepAngle = 0;
  const sweepSpeed = 0.008; // Slower, more authentic sweep rotation

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw radar concentric circles
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.lineWidth = 0.75;
    
    // Rings
    for (let r = maxRadius / 4; r <= maxRadius; r += maxRadius / 4) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw crosshair axes with subtle dashes
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Rotate sweep
    sweepAngle += sweepSpeed;
    if (sweepAngle >= 2 * Math.PI) sweepAngle = 0;

    // Check targets sweep alignment
    targets.forEach(t => {
      let angleDiff = sweepAngle - t.angle;
      if (angleDiff < 0) angleDiff += 2 * Math.PI;

      // Bright sweep trigger
      if (angleDiff < 0.08 && angleDiff > 0) {
        t.intensity = 1.0;
      } else {
        // Slow telemetry fade
        t.intensity = Math.max(0, t.intensity - 0.005);
      }
    });

    // Draw radar sweep beam
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.03)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, maxRadius, sweepAngle - 0.3, sweepAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // Draw leading sweep line (extremely thin)
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.25)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(sweepAngle) * maxRadius,
      centerY + Math.sin(sweepAngle) * maxRadius
    );
    ctx.stroke();

    // Draw Targets (Blips)
    targets.forEach(t => {
      if (t.intensity > 0) {
        const tx = centerX + Math.cos(t.angle) * t.distance;
        const ty = centerY + Math.sin(t.angle) * t.distance;

        // Blip point
        ctx.fillStyle = `rgba(16, 185, 129, ${t.intensity})`;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
        ctx.shadowBlur = 4 * t.intensity;
        
        ctx.beginPath();
        ctx.arc(tx, ty, 2.0, 0, 2 * Math.PI);
        ctx.fill();

        // Target range rings (very subtle)
        ctx.strokeStyle = `rgba(16, 185, 129, ${t.intensity * 0.15})`;
        ctx.shadowBlur = 0;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(tx, ty, 6 * (1 - t.intensity + 0.1), 0, 2 * Math.PI);
        ctx.stroke();

        // Label text (cleaner alignment)
        ctx.fillStyle = `rgba(16, 185, 129, ${t.intensity * 0.8})`;
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.fillText(t.name, tx + 6, ty - 2);
        ctx.fillStyle = `rgba(156, 163, 175, ${t.intensity * 0.5})`;
        ctx.fillText(t.label, tx + 6, ty + 5);
      }
    });

    ctx.shadowBlur = 0;

    // Monitor coordinates sync
    const coordsElement = document.getElementById('radar-coords');
    if (coordsElement) {
      const currentX = (Math.cos(sweepAngle) * 90 + 38.8951).toFixed(4);
      const currentY = (Math.sin(sweepAngle) * 90 - 77.0369).toFixed(4);
      coordsElement.textContent = `LAT ${currentX} / LON ${currentY}`;
    }

    requestAnimationFrame(animate);
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  });

  animate();
}

/* =========================================================================
   3. FIDS (Flight Information Display System) Accordion Rows
   ========================================================================= */
function initFidsAccordion() {
  const fidsRows = document.querySelectorAll('.fids-row');
  
  fidsRows.forEach((row, index) => {
    const summary = row.querySelector('.fids-row-summary');
    
    if (index === 0) {
      row.classList.add('expanded');
    }

    summary.addEventListener('click', () => {
      const isExpanded = row.classList.contains('expanded');
      
      fidsRows.forEach(r => r.classList.remove('expanded'));
      
      if (!isExpanded) {
        row.classList.add('expanded');
      }
    });
  });
}

/* =========================================================================
   4. Mock Aviation Metrics
   ========================================================================= */
function initMockMetrics() {
  const trafficCounter = document.getElementById('active-flights');
  if (!trafficCounter) return;

  function updateTraffic() {
    const baseCount = 8;
    const offset = Math.floor(Math.random() * 4) - 2; // -2 to +2
    trafficCounter.textContent = Math.max(5, baseCount + offset);
  }

  updateTraffic();
  setInterval(updateTraffic, 12000);
}

/* =========================================================================
   5. Native HTML5 Dialog Modal Telemetry Consoles
   ========================================================================= */
function initModalConsole() {
  const tileCards = document.querySelectorAll('.tile-card[data-open]');
  const closeButtons = document.querySelectorAll('[data-close]');
  const modals = document.querySelectorAll('dialog.telemetry-modal');

  // Open modal triggers
  tileCards.forEach(card => {
    card.addEventListener('click', () => {
      const targetId = card.getAttribute('data-open');
      const dialog = document.getElementById(targetId);
      if (dialog) {
        dialog.showModal();
        document.body.classList.add('modal-open');
      }
    });
  });

  // Close modal triggers (close buttons)
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      const dialog = document.getElementById(targetId);
      if (dialog) {
        dialog.close();
      }
    });
  });

  // Dialog-specific bindings
  modals.forEach(dialog => {
    // Backdrop click listener to close
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });

    // Native dialog close state cleanup (triggered by ESC key or close() methods)
    dialog.addEventListener('close', () => {
      // Check if any other dialogs are still open before resetting body scroll
      const anyOpen = Array.from(modals).some(m => m.open);
      if (!anyOpen) {
        document.body.classList.remove('modal-open');
      }
    });
  });
}
