import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, Info, X, Trash2, Plus, Play, Power, HelpCircle } from 'lucide-react';
import HandButton from '../HandButton';
import GameInstruction from '../GameInstruction';

// Component constants
const COMPONENT_TYPES = [
  { type: 'battery', labelEs: 'Batería (9V)', labelEn: 'Battery (9V)', emoji: '🔋', color: '#ffb300' },
  { type: 'led', labelEs: 'LED Lumínico', labelEn: 'Light LED', emoji: '💡', color: '#4caf50' },
  { type: 'resistor', labelEs: 'Resistencia', labelEn: 'Resistor', emoji: '⚡', color: '#ff5722' },
  { type: 'switch', labelEs: 'Interruptor', labelEn: 'Switch', emoji: '🎛️', color: '#00bcd4' },
  { type: 'capacitor', labelEs: 'Condensador', labelEn: 'Capacitor', emoji: '🔋', color: '#9c27b0' }
];

const CircuitsModule = memo(({ addPoints, lang = 'es' }) => {
  const [components, setComponents] = useState([
    { id: 'comp_1', type: 'battery', x: 120, y: 200, state: {} },
    { id: 'comp_2', type: 'led', x: 480, y: 200, state: { isLit: false } }
  ]);
  const [connections, setConnections] = useState([]);
  const [selectedTerminal, setSelectedTerminal] = useState(null); // 'comp_id-t1' or 'comp_id-t2'
  const [movingCompId, setMovingCompId] = useState(null);
  const [elemLocked, setElemLocked] = useState(false);
  
  const [showIntro, setShowIntro] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationResult, setSimulationResult] = useState({ status: 'idle', messageEs: '', messageEn: '' });

  const workspaceRef = useRef(null);
  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const overlayOpen = showIntro || showInfo;

  // Spawns a component in the center of the canvas
  const addComponent = (type) => {
    if (components.length >= 10 || elemLocked) return;
    const id = `comp_${Date.now()}`;
    const x = 200 + Math.random() * 150;
    const y = 150 + Math.random() * 100;
    const state = type === 'switch' ? { isOpen: true } : type === 'led' ? { isLit: false } : {};
    setComponents(prev => [...prev, { id, type, x, y, state }]);
    setSimulationActive(false);

    // Lock component adding temporarily to prevent double spawns during hand tracking dwell
    setElemLocked(true);
    setTimeout(() => setElemLocked(false), 1200);
  };

  // Delete component and all connected wires
  const deleteComponent = (id) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setConnections(prev => prev.filter(conn => !conn.from.startsWith(id) && !conn.to.startsWith(id)));
    if (selectedTerminal && selectedTerminal.startsWith(id)) {
      setSelectedTerminal(null);
    }
    setSimulationActive(false);
  };

  // Handle Switch toggle (ON/OFF)
  const toggleSwitch = (id) => {
    setComponents(prev => prev.map(c => {
      if (c.id === id && c.type === 'switch') {
        return { ...c, state: { ...c.state, isOpen: !c.state.isOpen } };
      }
      return c;
    }));
    setSimulationActive(false);
  };

  // Clear all connections and components
  const clearWorkspace = () => {
    setComponents([
      { id: 'comp_1', type: 'battery', x: 120, y: 200, state: {} },
      { id: 'comp_2', type: 'led', x: 480, y: 200, state: { isLit: false } }
    ]);
    setConnections([]);
    setSelectedTerminal(null);
    setMovingCompId(null);
    setSimulationActive(false);
    setSimulationResult({ status: 'idle', messageEs: '', messageEn: '' });
  };

  // Handle terminal clicks to draw connections
  const handleTerminalClick = (terminalId) => {
    if (overlayOpen) return;
    if (selectedTerminal === null) {
      setSelectedTerminal(terminalId);
    } else {
      if (selectedTerminal === terminalId) {
        setSelectedTerminal(null); // Cancel
        return;
      }
      // Check if connection already exists
      const exists = connections.some(c => 
        (c.from === selectedTerminal && c.to === terminalId) || 
        (c.from === terminalId && c.to === selectedTerminal)
      );
      if (!exists) {
        setConnections(prev => [...prev, { from: selectedTerminal, to: terminalId }]);
        setSimulationActive(false);
      }
      setSelectedTerminal(null);
    }
  };

  // Delete a connection
  const removeConnection = (index) => {
    setConnections(prev => prev.filter((_, i) => i !== index));
    setSimulationActive(false);
  };

  // Hand movement tracking in RAF loop for drag-and-drop
  useEffect(() => {
    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      if (!movingCompId || overlayOpen) return;
      const hand = window.latestHandData;
      const workspace = workspaceRef.current;
      if (!workspace || !hand?.cursors?.[0]?.isVisible) return;
      
      const rect = workspace.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      const cx = hand.cursors[0].x;
      const cy = hand.cursors[0].y;
      if (cx === undefined || cy === undefined || !isFinite(cx) || !isFinite(cy)) return;
      
      // Update coordinates relative to workspace container
      if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
        const x = Math.max(50, Math.min(rect.width - 50, cx - rect.left));
        const y = Math.max(50, Math.min(rect.height - 50, cy - rect.top));
        setComponents(prev => prev.map(c => c.id === movingCompId ? { ...c, x: Math.round(x), y: Math.round(y) } : c));
      }
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [movingCompId, overlayOpen]);

  // Handle workspace click to place component
  const placeComponent = () => {
    if (movingCompId) {
      setMovingCompId(null);
    }
  };

  // Get coordinates of a terminal point
  const getTerminalCoords = (terminalId) => {
    const [compId, termKey] = terminalId.split('-');
    const comp = components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    // Left terminal t1 is x - 40, Right terminal t2 is x + 40
    const offset = termKey === 't1' ? -38 : 38;
    return { x: comp.x + offset, y: comp.y };
  };

  // --- Graph Simulation Engine ---
  const runSimulation = () => {
    if (components.length === 0) return;

    // Reset LEDs
    setComponents(prev => prev.map(c => {
      if (c.type === 'led') return { ...c, state: { isLit: false } };
      return c;
    }));

    // Find all batteries
    const batteries = components.filter(c => c.type === 'battery');
    if (batteries.length === 0) {
      setSimulationResult({
        status: 'open',
        messageEs: '⚠️ Circuito Abierto: Se requiere una Batería (fuente de poder) para energizar.',
        messageEn: '⚠️ Open Circuit: A Battery (power source) is required to power the circuit.'
      });
      setSimulationActive(true);
      return;
    }

    // Build adjacency list for terminals
    // Nodes are terminal IDs: 'comp_id-t1' or 'comp_id-t2'
    const adj = {};
    const addEdge = (u, v) => {
      if (!adj[u]) adj[u] = [];
      if (!adj[v]) adj[v] = [];
      adj[u].push(v);
      adj[v].push(u);
    };

    // Add wires
    connections.forEach(conn => {
      addEdge(conn.from, conn.to);
    });

    // Add internal component links (traversal rules)
    // Note: Batteries, Resistors, Switches (if closed) connect internally
    // LED connects anode (t1) to cathode (t2) in one direction during current tracing,
    // but in adjacency representation, we treat it as connected to trace paths.
    components.forEach(c => {
      const t1 = `${c.id}-t1`;
      const t2 = `${c.id}-t2`;
      
      if (c.type === 'resistor') {
        addEdge(t1, t2);
      } else if (c.type === 'switch' && !c.state.isOpen) {
        addEdge(t1, t2);
      } else if (c.type === 'led') {
        addEdge(t1, t2);
      } else if (c.type === 'capacitor') {
        // Capacitors block DC current, so we do NOT add edge internally.
      }
    });

    // Let's trace paths from positive terminal of each battery to negative terminal of same battery
    let closedLoopFound = false;
    let isShortCircuit = false;
    let isLEDLit = false;
    let isLEDBurned = false;
    let pathComponents = new Set();

    batteries.forEach(bat => {
      const startNode = `${bat.id}-t1`; // Positive
      const endNode = `${bat.id}-t2`;   // Negative

      // DFS to find path from startNode to endNode
      const visited = new Set();
      const parentMap = {};

      const dfs = (curr) => {
        if (curr === endNode) return true;
        visited.add(curr);

        const neighbors = adj[curr] || [];
        for (const next of neighbors) {
          // Check LED direction: if transitioning within LED from t2 (cathode) to t1 (anode), it's reverse biased!
          // t2 -> t1 is reverse direction.
          const [currCompId, currTerm] = curr.split('-');
          const [nextCompId, nextTerm] = next.split('-');
          if (currCompId === nextCompId) {
            const comp = components.find(c => c.id === currCompId);
            if (comp?.type === 'led' && currTerm === 't2' && nextTerm === 't1') {
              // Backward LED direction, block current
              continue;
            }
          }

          if (!visited.has(next)) {
            parentMap[next] = curr;
            if (dfs(next)) return true;
          }
        }
        return false;
      };

      if (dfs(startNode)) {
        closedLoopFound = true;
        // Reconstruct path to find components involved
        let curr = endNode;
        const pathNodes = [endNode];
        while (curr !== startNode) {
          curr = parentMap[curr];
          pathNodes.push(curr);
        }

        // Identify components in this loop
        pathNodes.forEach(node => {
          const compId = node.split('-')[0];
          pathComponents.add(compId);
        });
      }
    });

    if (closedLoopFound) {
      // Analyze components in the path
      const activeComps = components.filter(c => pathComponents.has(c.id));
      const hasResistor = activeComps.some(c => c.type === 'resistor');
      const hasLED = activeComps.some(c => c.type === 'led');

      // Check if it's a short circuit: closed loop with battery, but no loads (no resistor, no LED)
      if (!hasResistor && !hasLED) {
        isShortCircuit = true;
      } else if (hasLED && !hasResistor) {
        // LED connected directly to battery without a resistor -> burns the LED!
        isLEDBurned = true;
      } else if (hasLED && hasResistor) {
        isLEDLit = true;
      }

      if (isShortCircuit) {
        setSimulationResult({
          status: 'short',
          messageEs: '💥 ¡CORTOCIRCUITO! La corriente fluye sin resistencia. La batería se calentará y podría dañarse. ¡Agrega un LED o una resistencia!',
          messageEn: '💥 SHORT CIRCUIT! Current flows without resistance. The battery will heat up and could be damaged. Add a LED or a resistor!'
        });
      } else if (isLEDBurned) {
        setSimulationResult({
          status: 'burned',
          messageEs: '⚠️ ¡LED QUEMADO! Conectaste el LED directo sin resistencia. Demasiada corriente lo fundió. ¡Agrega una resistencia en serie!',
          messageEn: '⚠️ LED BURNED! You connected the LED directly without a resistor. Too much current blew it. Add a resistor in series!'
        });
      } else if (isLEDLit) {
        // Light up LEDs in the loop
        setComponents(prev => prev.map(c => {
          if (c.type === 'led' && pathComponents.has(c.id)) {
            return { ...c, state: { ...c.state, isLit: true } };
          }
          return c;
        }));
        
        // Add points for successful sandbox creation
        addPointsRef.current(40);

        setSimulationResult({
          status: 'success',
          messageEs: '🎉 ¡CIRCUITO CORRECTO! El LED se enciende brillantemente. La corriente fluye de forma segura gracias a la resistencia.',
          messageEn: '🎉 CORRECT CIRCUIT! The LED lights up brightly. Current flows safely thanks to the resistor.'
        });
      } else {
        // Just resistor/switch, closed loop
        setSimulationResult({
          status: 'running',
          messageEs: '⚡ Circuito cerrado: La corriente fluye de forma segura por las resistencias.',
          messageEn: '⚡ Closed circuit: Current flows safely through the resistors.'
        });
      }
    } else {
      // Check if there is a capacitor in the wires, to show an educational tip
      const hasCapacitor = components.some(c => c.type === 'capacitor');
      setSimulationResult({
        status: 'open',
        messageEs: hasCapacitor 
          ? 'ℹ️ Circuito Abierto: Los condensadores bloquean la corriente continua (CC). El circuito está interrumpido.' 
          : '🔌 Circuito Abierto: Cierra los interruptores y conecta todos los cables para completar el ciclo.',
        messageEn: hasCapacitor 
          ? 'ℹ️ Open Circuit: Capacitors block direct current (DC). The circuit is interrupted.' 
          : '🔌 Open Circuit: Close switches and connect all wires to complete the loop.'
      });
    }

    setSimulationActive(true);
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <Zap size={16} className="text-yellow-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
          {lang === 'es' ? 'Simulador de Circuitos' : 'Circuit Simulator'}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">
          {lang === 'es' ? 'Modo Sandbox Creativo' : 'Creative Sandbox Mode'}
        </span>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex gap-6 pt-16 pb-3 px-6 items-stretch">
        
        {/* Left component shelf */}
        <div className="w-48 glass-dark rounded-3xl border border-white/10 p-4 flex flex-col gap-3 justify-center shrink-0">
          <p className="text-[8.5px] font-black uppercase tracking-widest text-white/40 text-center mb-1">
            {lang === 'es' ? 'Añadir Componentes' : 'Add Components'}
          </p>
          {COMPONENT_TYPES.map(comp => (
            <HandButton
              key={comp.type}
              onClick={() => addComponent(comp.type)}
              disabled={overlayOpen || elemLocked}
              dwellMs={650}
              variant="default"
              className="py-3 text-[10px] flex items-center gap-2 justify-start !bg-white/5 !border-white/10 hover:!bg-white/10"
            >
              <Plus size={12} className="text-white/40" />
              <span className="text-sm">{comp.emoji}</span>
              <span className="font-bold text-white/80">{lang === 'es' ? comp.labelEs : comp.labelEn}</span>
            </HandButton>
          ))}
          {elemLocked && !overlayOpen && (
            <p className="text-center text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse mt-2">
              {lang === 'es' ? 'Recargando…' : 'Recharging...'}
            </p>
          )}
        </div>

        {/* Center: Canvas Workspace */}
         <div 
          ref={workspaceRef}
          onClick={placeComponent}
          className={`flex-1 relative glass-dark rounded-3xl border border-white/10 overflow-hidden bg-slate-950/80 cursor-default ${overlayOpen ? 'pointer-events-none' : ''}`}
        >
          {/* Fixed button to place component */}
          {movingCompId && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
              <HandButton
                onClick={() => setMovingCompId(null)}
                dwellMs={700}
                variant="yellow"
                className="px-6 py-3 text-xs shadow-2xl animate-pulse flex items-center gap-1.5"
              >
                <span>✓ {lang === 'es' ? 'FIJAR COMPONENTE' : 'PLACE COMPONENT'}</span>
              </HandButton>
            </div>
          )}
          {/* Wire rendering under components */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="currentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffee55" />
                <stop offset="100%" stopColor="#ff5500" />
              </linearGradient>
            </defs>

            {/* Placed connection wires */}
            {connections.map((conn, idx) => {
              const start = getTerminalCoords(conn.from);
              const end = getTerminalCoords(conn.to);
              
              // Draw a smooth bezier curve between terminals
              const dx = Math.abs(end.x - start.x) * 0.5;
              const pathStr = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
              
              const isFlowing = simulationActive && simulationResult.status === 'success';

              return (
                <g key={idx}>
                  {/* Outer wire casing */}
                  <path 
                    d={pathStr} 
                    fill="none" 
                    stroke="rgba(30,41,59,0.9)" 
                    strokeWidth="8" 
                    className="cursor-pointer pointer-events-auto"
                    onClick={() => removeConnection(idx)}
                  />
                  {/* Inner wire copper line */}
                  <path 
                    d={pathStr} 
                    fill="none" 
                    stroke={isFlowing ? 'url(#currentGrad)' : '#475569'} 
                    strokeWidth="3" 
                  />
                  {/* Glowing current animation */}
                  {isFlowing && (
                    <path
                      d={pathStr}
                      fill="none"
                      stroke="#ffff88"
                      strokeWidth="2"
                      strokeDasharray="8, 12"
                      className="animate-[dash_1s_linear_infinite]"
                      style={{
                        animation: 'dash 1.2s linear infinite',
                        strokeLinecap: 'round'
                      }}
                    />
                  )}
                </g>
              );
            })}

            {/* Currently drawing wire */}
            {selectedTerminal && (() => {
              const start = getTerminalCoords(selectedTerminal);
              const hand = window.latestHandData;
              const rect = workspaceRef.current?.getBoundingClientRect();
              
              let endX = start.x + 30;
              let endY = start.y + 30;
              
              if (hand?.cursors?.[0]?.isVisible && rect) {
                endX = hand.cursors[0].x - rect.left;
                endY = hand.cursors[0].y - rect.top;
              }

              const pathStr = `M ${start.x} ${start.y} L ${endX} ${endY}`;
              return (
                <path
                  d={pathStr}
                  fill="none"
                  stroke="#ffee55"
                  strokeWidth="2"
                  strokeDasharray="4, 4"
                  className="animate-pulse"
                />
              );
            })()}
          </svg>

          {/* Placed Components */}
          {components.map(comp => {
            const isMoving = comp.id === movingCompId;
            const compDef = COMPONENT_TYPES.find(ct => ct.type === comp.type);
            const isLit = comp.type === 'led' && comp.state.isLit;
            const isOpen = comp.type === 'switch' && comp.state.isOpen;

            return (
              <div
                key={comp.id}
                className={`absolute z-10 p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-shadow duration-300
                  ${isMoving ? 'border-yellow-400 shadow-[0_0_24px_rgba(234,179,8,0.3)] z-30' : 'border-white/10 bg-black/45 backdrop-blur-md'}`}
                style={{
                  left: `${comp.x}px`,
                  top: `${comp.y}px`,
                  transform: 'translate(-50%, -50%)',
                  width: '120px'
                }}
              >
                {/* Visual Representation */}
                <div className="flex items-center justify-center relative w-12 h-12">
                  {/* Glowing LED aura */}
                  {isLit && (
                    <div className="absolute inset-0 bg-green-500/35 rounded-full blur-xl animate-pulse" />
                  )}
                  {comp.type === 'led' && simulationActive && simulationResult.status === 'burned' && (
                    <div className="absolute inset-0 bg-red-600/20 rounded-full blur-md" />
                  )}
                  <span className={`text-3xl z-10 transition-transform ${isLit ? 'scale-110' : ''}`}>
                    {comp.type === 'led' && simulationActive && simulationResult.status === 'burned' 
                      ? '💥' 
                      : (isLit ? '💡' : compDef.emoji)}
                  </span>
                </div>

                {/* Info Text */}
                <span className="text-[8.5px] font-black uppercase tracking-wider text-white/50 text-center">
                  {lang === 'es' ? compDef.labelEs : compDef.labelEn}
                  {comp.type === 'switch' && (isOpen ? ' (OFF)' : ' (ON)')}
                </span>

                {/* Component Actions */}
                <div className="flex gap-1 items-center mt-1">
                  {comp.type === 'switch' && (
                    <HandButton
                      onClick={() => toggleSwitch(comp.id)}
                      disabled={isMoving}
                      dwellMs={550}
                      variant={isOpen ? 'default' : 'cyan'}
                      className="p-1 px-2 text-[7px]"
                    >
                      <Power size={8} />
                      {isOpen ? 'Close' : 'Open'}
                    </HandButton>
                  )}
                  <HandButton
                    onClick={() => setMovingCompId(isMoving ? null : comp.id)}
                    dwellMs={650}
                    variant={isMoving ? 'yellow' : 'default'}
                    className="p-1 px-1.5 text-[7px] !bg-white/5"
                  >
                    {isMoving ? 'Ok' : 'Move'}
                  </HandButton>
                  <HandButton
                    onClick={() => deleteComponent(comp.id)}
                    dwellMs={750}
                    variant="red"
                    className="p-1 px-1.5 text-[7px]"
                  >
                    <Trash2 size={8} />
                  </HandButton>
                </div>

                {/* Terminals (t1 left, t2 right) */}
                <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20">
                  <HandButton
                    onClick={() => handleTerminalClick(`${comp.id}-t1`)}
                    disabled={isMoving}
                    dwellMs={550}
                    variant={selectedTerminal === `${comp.id}-t1` ? 'yellow' : 'default'}
                    className="w-7 h-7 rounded-full flex items-center justify-center p-0 !bg-slate-900 border-2 border-white/20 hover:border-yellow-400"
                  >
                    <span className="text-[7.5px] font-black text-white/60">{comp.type === 'battery' ? '+' : 't1'}</span>
                  </HandButton>
                </div>
                <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20">
                  <HandButton
                    onClick={() => handleTerminalClick(`${comp.id}-t2`)}
                    disabled={isMoving}
                    dwellMs={550}
                    variant={selectedTerminal === `${comp.id}-t2` ? 'yellow' : 'default'}
                    className="w-7 h-7 rounded-full flex items-center justify-center p-0 !bg-slate-900 border-2 border-white/20 hover:border-yellow-400"
                  >
                    <span className="text-[7.5px] font-black text-white/60">{comp.type === 'battery' ? '−' : 't2'}</span>
                  </HandButton>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Pane: Controls & Simulation Status */}
        <div className="w-56 flex flex-col gap-3 shrink-0">
          
          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <HandButton
              onClick={runSimulation}
              disabled={overlayOpen || movingCompId}
              dwellMs={800}
              variant="emerald"
              className="py-3.5 text-[11px] flex items-center gap-2 justify-center shadow-lg"
            >
              <Play size={13} fill="currentColor" />
              {lang === 'es' ? 'Simular Circuito' : 'Simulate Circuit'}
            </HandButton>

            <HandButton
              onClick={() => setShowInfo(true)}
              disabled={overlayOpen}
              dwellMs={850}
              variant="orange"
              className="py-2.5 text-[10px] flex items-center gap-2 justify-center"
            >
              <Info size={12} />
              {lang === 'es' ? 'Aprender Más' : 'Learn More'}
            </HandButton>

            <HandButton
              onClick={clearWorkspace}
              disabled={overlayOpen}
              dwellMs={900}
              variant="red"
              className="py-2.5 text-[10px] flex items-center gap-2 justify-center"
            >
              <RotateCcw size={12} />
              {lang === 'es' ? 'Borrar Todo' : 'Clear All'}
            </HandButton>
          </div>

          {/* Simulation Output Area */}
          <div className="flex-1 glass-dark rounded-3xl border border-white/10 p-4 flex flex-col gap-2.5 min-h-[160px]">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-1.5">
              {lang === 'es' ? 'Estado Físico' : 'Physical State'}
            </p>
            
            <div className="flex-1 flex flex-col justify-center items-center gap-2 text-center">
              {simulationActive ? (
                <>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md
                    ${simulationResult.status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
                      simulationResult.status === 'short' ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-bounce' :
                      simulationResult.status === 'burned' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-slate-500/10 text-white/50 border border-white/10'}`}
                  >
                    {simulationResult.status === 'success' ? '⚡' :
                     simulationResult.status === 'short' ? '🔥' :
                     simulationResult.status === 'burned' ? '💥' : '🔌'}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider"
                     style={{
                       color: simulationResult.status === 'success' ? '#4adf50' : 
                              (simulationResult.status === 'short' || simulationResult.status === 'burned') ? '#f87171' : '#94a3b8'
                     }}
                  >
                    {simulationResult.status === 'success' ? (lang === 'es' ? 'Excelente' : 'Excellent') :
                     simulationResult.status === 'short' ? (lang === 'es' ? 'Peligro' : 'Danger') :
                     simulationResult.status === 'burned' ? (lang === 'es' ? 'Falla' : 'Failure') :
                     (lang === 'es' ? 'Abierto' : 'Open')}
                  </p>
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                    {lang === 'es' ? simulationResult.messageEs : simulationResult.messageEn}
                  </p>
                </>
              ) : (
                <>
                  <HelpCircle size={32} className="text-white/20" />
                  <p className="text-[10.5px] text-white/40 italic leading-normal px-2">
                    {lang === 'es' 
                      ? 'Conecta los componentes y presiona "Simular Circuito" para ver la corriente.' 
                      : 'Connect components and press "Simulate Circuit" to test current.'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center px-8 pointer-events-auto">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-[32px] border border-cyan-500/30 bg-[#0a0a18]/95 shadow-2xl p-7 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-xl">
                <Zap size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-display font-black italic uppercase text-yellow-400">
                {lang === 'es' ? 'Conceptos de Circuitos' : 'Circuit Concepts'}
              </h3>
              <p className="text-[12px] text-white/75 leading-relaxed text-justify">
                {lang === 'es' 
                  ? '• Batería: Aporta el voltaje (+ es el polo de salida, − es de regreso).\n• Resistencia: Limita el paso de electricidad para proteger componentes.\n• LED: Emite luz cuando la corriente circula de positivo (+) a negativo (−).\n• Interruptor: ON cierra el circuito (pasa corriente); OFF lo interrumpe.'
                  : '• Battery: Supplies voltage (+ is exit terminal, − is return).\n• Resistor: Limits electricity flow to protect components.\n• LED: Emits light when current flows from anode (+) to cathode (−).\n• Switch: ON closes circuit (current flows); OFF breaks it.'}
              </p>
              <HandButton onClick={() => setShowInfo(false)} dwellMs={800} graceMs={600} variant="cyan" className="px-10 py-3 text-xs">
                <X size={14} /> {lang === 'es' ? 'Cerrar' : 'Close'}
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-8 pointer-events-auto">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl text-5xl">⚡</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">
                {lang === 'es' ? 'Laboratorio de Circuitos' : 'Circuit Laboratory'}
              </h2>
              <p className="text-[12.5px] text-white/70 leading-relaxed">
                {lang === 'es' 
                  ? '¡Crea tus propias conexiones! Añade componentes, arrástralos para ordenarlos y haz dwell click en sus terminales circulares para tender cables. Recuerda usar resistencias en serie con los LEDs para evitar que se quemen.'
                  : 'Build your own custom circuits! Add components, drag to position them, and dwell-click their circular terminals to connect wires. Remember to place a resistor in series with LEDs to prevent them from burning!'}
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="cyan" className="px-10 py-4 text-sm">
                <Zap size={16} /> {lang === 'es' ? '¡Empezar Sandbox!' : 'Start Sandbox!'}
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GameInstruction
        messageEs="Arrastra componentes y conecta sus terminales para simular"
        messageEn="Drag components and connect their terminals to simulate"
        lang={lang}
        icon="⚡"
      />
    </div>
  );
});

export default CircuitsModule;
