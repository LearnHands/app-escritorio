import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Palette, Music, Puzzle, Play, ArrowLeft, Trophy, LogOut, BookOpen,
  Gamepad2, Compass, Shield, Award, Lock, FlaskConical, GraduationCap, Joystick,
  Zap, Atom, Code2, DollarSign, Clock, Heart, Languages, Wifi, WifiOff, RefreshCw, User, LogIn,
  Plus, Trash2, Copy, CheckCircle, Users, KeyRound, RotateCcw, Settings
} from 'lucide-react';

// Hooks
import { useMediaPipe } from './hooks/useMediaPipe';

// Components — always needed
import LayeredEngine from './components/hub/LayeredEngine';
import HandButton    from './components/hub/HandButton';
import GameErrorBoundary from './components/hub/GameErrorBoundary';

// Services
import { t, getLanguage, setLanguage } from './services/i18n';
import { addGameMetric, addLocalLog, triggerSync, getMetricsQueue, getApiUrl, setApiUrl, seedMetricsHistory } from './services/sync';
import { addUxMetric, triggerUxSync, getUxQueue, seedUxHistory } from './services/uxTracker';

// ── Game modules — lazy-loaded so each becomes its own JS chunk ───────────────
const PianoModule       = lazy(() => import('./components/hub/modules/PianoModule'));
const DrawingModule     = lazy(() => import('./components/hub/modules/DrawingModule'));
const PuzzleModule      = lazy(() => import('./components/hub/modules/PuzzleModule'));
const SolarModule       = lazy(() => import('./components/hub/modules/SolarModule'));
const BricksModule      = lazy(() => import('./components/hub/modules/BricksModule'));
const SyllablesModule   = lazy(() => import('./components/hub/modules/SyllablesModule'));
const EcoGuardianModule = lazy(() => import('./components/hub/modules/EcoGuardianModule'));
const MathAbacusModule  = lazy(() => import('./components/hub/modules/MathAbacusModule'));
const SolarSystemModule = lazy(() => import('./components/hub/modules/SolarSystemModule'));
const LabModule         = lazy(() => import('./components/hub/modules/LabModule'));
const CircuitsModule    = lazy(() => import('./components/hub/modules/CircuitsModule'));
const AtomsModule       = lazy(() => import('./components/hub/modules/AtomsModule'));
const CodingBlocksModule= lazy(() => import('./components/hub/modules/CodingBlocksModule'));
const AccountingModule  = lazy(() => import('./components/hub/modules/AccountingModule'));
const TimelineModule    = lazy(() => import('./components/hub/modules/TimelineModule'));
const AnatomyModule     = lazy(() => import('./components/hub/modules/AnatomyModule'));
const EnglishModule     = lazy(() => import('./components/hub/modules/EnglishModule'));
const IrregularVerbsModule = lazy(() => import('./components/hub/modules/IrregularVerbsModule'));

import puceLogo from './assets/puce.png';

// Time (ms) the menu cards stay locked after entering the menu
const MENU_LOCK_MS = 2000;

const SystemHub = ({ onExit }) => {
  // Configuración de vista y flujo
  const [view, setView] = useState(() => {
    // Forzar cierre de sesión por única vez al instalar v4.2.0 (cambio breaking a cédula)
    const cleaned = localStorage.getItem('learnhands_session_cleaned_v420');
    if (!cleaned) {
      const savedRole = localStorage.getItem('learnhands_session_role');
      const savedUser = localStorage.getItem('learnhands_session_user');
      if (savedRole !== 'teacher' || !savedUser || !/^\d{10}$/.test(savedUser)) {
        localStorage.removeItem('learnhands_session_user');
        localStorage.removeItem('learnhands_session_role');
        localStorage.removeItem('learnhands_session_display_name');
        localStorage.removeItem('learnhands_student_classes');
        localStorage.removeItem('learnhands_active_class');
      }
      localStorage.setItem('learnhands_session_cleaned_v420', 'true');
    }
    const savedUser = localStorage.getItem('learnhands_session_user');
    return savedUser ? 'HOME' : 'LOGIN';
  });
  
  const [sessionUser, setSessionUser] = useState(() => localStorage.getItem('learnhands_session_user') || '');
  const [sessionDisplayName, setSessionDisplayName] = useState(() => localStorage.getItem('learnhands_session_display_name') || '');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('learnhands_session_role') || 'student');
  
  const [loginInput, setLoginInput] = useState('');        // cédula (alumnos) o username (profe)
  const [displayNameInput, setDisplayNameInput] = useState(''); // nombre completo (solo registro nuevo)
  const [classCodeInput, setClassCodeInput] = useState('');     // código de clase opcional
  const [isNewStudent, setIsNewStudent] = useState(false);      // true = registro, false = login
  const [loginError, setLoginError] = useState('');
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Clases del alumno
  const [studentClasses, setStudentClasses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('learnhands_student_classes') || '[]'); } catch { return []; }
  });
  const [activeStudentClass, setActiveStudentClass] = useState(() => localStorage.getItem('learnhands_active_class') || null);
  const [showClassSwitcher, setShowClassSwitcher] = useState(false);
  const [joinClassInput, setJoinClassInput] = useState('');
  const [joinClassError, setJoinClassError] = useState('');
  const [isJoiningClass, setIsJoiningClass] = useState(false);

  // Servidor API
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(() => getApiUrl());

  const [currentGame, setCurrentGame] = useState(null);
  const [menuLocked, setMenuLocked] = useState(false);
  const [activeCardLock, setActiveCardLock] = useState(null);

  const handleCardHoverChange = (cardId, isHovered) => {
    if (isHovered) {
      setActiveCardLock(cardId);
    } else {
      setActiveCardLock(prev => prev === cardId ? null : prev);
    }
  };
  const [showHubOnboarding, setShowHubOnboarding] = useState(() => {
    return !localStorage.getItem('learnhands_onboarded');
  });
  const [showGameTutorial, setShowGameTutorial] = useState(false);
  const [tutorialGameKey, setTutorialGameKey] = useState(null);
  
  // Idioma
  const [lang, setLangState] = useState(() => getLanguage());
  
  // Puntuaciones separadas por juego. Cada partida empieza en 0.
  const [scores, setScores] = useState({});
  
  // Sincronización y Red
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => getMetricsQueue().length);
  const [isSyncingState, setIsSyncingState] = useState(false);

  // Estados para el Dashboard del Profesor
  const [studentsList, setStudentsList] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState('');
  const [selectedTeacherClassCode, setSelectedTeacherClassCode] = useState('');

  // Estados para Gestión de Clases
  const [classesList, setClassesList] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesError, setClassesError] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [createClassError, setCreateClassError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null); // code string | null
  const [deletingCode, setDeletingCode] = useState(null); // code being deleted

  // Dashboard states
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('summary');
  const [dashboardStudentFilter, setDashboardStudentFilter] = useState('ALL');
  const [dashboardMetrics, setDashboardMetrics] = useState([]);
  const [dashboardUx, setDashboardUx] = useState([]);

  const loadDashboardData = () => {
    try {
      const mh = JSON.parse(localStorage.getItem('learnhands_metrics_history') || '[]');
      const uxh = JSON.parse(localStorage.getItem('learnhands_ux_history') || '[]');
      setDashboardMetrics(mh);
      setDashboardUx(uxh);
    } catch (e) {
      console.error('[Dashboard] Error loading metrics history:', e);
    }
  };

  useEffect(() => {
    if (view === 'HOME' || showDashboard) {
      loadDashboardData();
    }
  }, [view, showDashboard]);

  // Dashboard calculations filtered by student
  const uniqueStudents = useMemo(() => {
    const students = new Set(dashboardMetrics.map(m => m.username));
    return Array.from(students);
  }, [dashboardMetrics]);

  const filteredMetrics = useMemo(() => {
    if (dashboardStudentFilter === 'ALL') return dashboardMetrics;
    return dashboardMetrics.filter(m => m.username === dashboardStudentFilter);
  }, [dashboardMetrics, dashboardStudentFilter]);

  const filteredUx = useMemo(() => {
    if (dashboardStudentFilter === 'ALL') return dashboardUx;
    return dashboardUx.filter(u => u.username === dashboardStudentFilter);
  }, [dashboardUx, dashboardStudentFilter]);

  // 1. Average Scores by Game
  const gameScores = useMemo(() => {
    const scoresByGame = {};
    filteredMetrics.forEach(m => {
      if (!scoresByGame[m.game_name]) scoresByGame[m.game_name] = [];
      scoresByGame[m.game_name].push(m.score);
    });
    return Object.keys(scoresByGame).map(game => {
      const list = scoresByGame[game];
      const avg = list.reduce((a, b) => a + b, 0) / list.length;
      return { game, avg: Math.round(avg), count: list.length };
    });
  }, [filteredMetrics]);

  // 2. Activity Timeline (last 7 days)
  const timelineData = useMemo(() => {
    const last7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      last7Days.push({
        dateStr: d.toLocaleDateString(lang === 'es' ? 'es-EC' : 'en-US', { day: 'numeric', month: 'short' }),
        dateKey: d.toDateString(),
        score: 0,
        count: 0
      });
    }
    
    filteredMetrics.forEach(m => {
      const mDate = new Date(m.played_at).toDateString();
      const day = last7Days.find(d => d.dateKey === mDate);
      if (day) {
        day.score += m.score;
        day.count += 1;
      }
    });
    
    return last7Days;
  }, [filteredMetrics, lang]);

  // 3. Module Popularity (usage counts)
  const moduleUsage = useMemo(() => {
    const counts = {};
    filteredUx.forEach(u => {
      if (u.metric_type === 'ACTIVE_MODULE' || u.game_name) {
        const name = u.game_name || 'GENERAL';
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    if (Object.keys(counts).length === 0) {
      filteredMetrics.forEach(m => {
        counts[m.game_name] = (counts[m.game_name] || 0) + 1;
      });
    }
    return Object.keys(counts)
      .map(name => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredUx, filteredMetrics]);

  // 4. Summary Stats
  const totalSessions = useMemo(() => filteredMetrics.length, [filteredMetrics]);
  
  const totalTimeMins = useMemo(() => {
    const sec = filteredMetrics.reduce((sum, m) => sum + (m.duration_seconds || 0), 0);
    return Math.round(sec / 60);
  }, [filteredMetrics]);

  const avgAutonomy = useMemo(() => {
    const auts = filteredUx.filter(u => u.metric_type === 'AUTONOMY_TIME');
    if (auts.length === 0) return 12; // fallback mins
    const avg = auts.reduce((sum, u) => sum + u.metric_value, 0) / auts.length;
    return Math.round(avg);
  }, [filteredUx]);

  const recognitionAccuracy = useMemo(() => {
    const accs = filteredUx.filter(u => u.metric_type === 'RECOGNITION_ACCURACY' || u.metric_type === 'GESTURE_EFFICIENCY');
    if (accs.length === 0) return 92; // fallback %
    const avg = accs.reduce((sum, u) => sum + u.metric_value, 0) / accs.length;
    return Math.round(avg);
  }, [filteredUx]);

  const menuLockTimerRef = useRef(null);
  const menuScrollRef = useRef(null);
  const videoRef = useRef(null);
  
  // Guardar hora de inicio del juego
  const gameStartTimeRef = useRef(null);

  const { isLoaded, initMediaPipe, error } = useMediaPipe();

  useEffect(() => {
    initMediaPipe(videoRef.current);
    seedMetricsHistory();
    seedUxHistory();
  }, [initMediaPipe]);

  // Habilitar detección de 2 manos solo para el módulo Solar System
  useEffect(() => {
    window.activeHandCount = currentGame === 'SOLAR_SYS' ? 2 : 1;
  }, [currentGame]);

  // Actualizar el estado de red de forma reactiva y forzar modo estudiante si se desconecta
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsTeacherMode(false);
      setLoginInput('');
      setPasswordInput('');
      setLoginError('');
      updatePendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Si iniciamos offline, asegurar que no empiece en modo profesor
    if (!navigator.onLine) {
      setIsTeacherMode(false);
    }


    // Escuchas para eventos de sincronización exitosa o fallida
    const handleSyncComplete = () => {
      updatePendingCount();
      setIsSyncingState(false);
    };

    const handleSyncFailed = () => {
      updatePendingCount();
      setIsSyncingState(false);
    };

    window.addEventListener('learnhands_sync_completed', handleSyncComplete);
    window.addEventListener('learnhands_sync_failed', handleSyncFailed);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('learnhands_sync_completed', handleSyncComplete);
      window.removeEventListener('learnhands_sync_failed', handleSyncFailed);
    };
  }, []);

  const updatePendingCount = () => {
    setPendingSyncCount(getMetricsQueue().length);
  };

  const handleManualSync = async () => {
    setIsSyncingState(true);
    await triggerSync();
    updatePendingCount();
  };

  // Alternar idioma global
  const toggleLanguage = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    setLanguage(newLang);
    setLangState(newLang);
    addLocalLog('LANGUAGE_CHANGED', `Idioma cambiado globalmente a: ${newLang.toUpperCase()}`);
  };

  // Iniciar Sesión / Ingresar Nombre (con registro en base de datos)
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (isLoggingIn) return;
    const usernameClean = loginInput.trim();
    
    if (isTeacherMode) {
      if (!usernameClean) {
        setLoginError(t('login_required', lang));
        return;
      }
      if (!passwordInput) {
        setLoginError(t('login_password_required', lang));
        return;
      }

      setIsLoggingIn(true);
      setLoginError('');

      // Intentar validación contra la API; fallback local si offline o cuenta local especial
      let authOk = false;
      const isLocalTeacher = (usernameClean === 'KathePastaz' || usernameClean === 'GrupoAdmin') && passwordInput === 'secreto123';

      if (isLocalTeacher) {
        authOk = true;
      } else {
        try {
          const resp = await fetch(`${getApiUrl()}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameClean, password: passwordInput, role: 'teacher' }),
            signal: AbortSignal.timeout(5000)
          });
          if (resp.ok) {
            const data = await resp.json();
            authOk = data.success === true;
            if (!authOk) {
              setLoginError(data.message || t('login_incorrect_password', lang));
              setIsLoggingIn(false);
              return;
            }
          } else if (resp.status === 401) {
            setLoginError(t('login_incorrect_password', lang));
            setIsLoggingIn(false);
            return;
          } else {
            // Server error — fallback a credenciales locales para no bloquear la app
            console.warn('[Login] Error del servidor, usando fallback local.');
            authOk = ((usernameClean === 'KathePastaz' || usernameClean === 'GrupoAdmin') && passwordInput === 'secreto123');
            if (!authOk) {
              setLoginError(t('login_incorrect_password', lang));
              setIsLoggingIn(false);
              return;
            }
          }
        } catch (err) {
          // Sin conexión — fallback a credenciales locales
          console.warn('[Login] Sin conexión, usando fallback local:', err.message);
          authOk = ((usernameClean === 'KathePastaz' || usernameClean === 'GrupoAdmin') && passwordInput === 'secreto123');
          if (!authOk) {
            setLoginError(lang === 'es' ? 'Sin conexión y credenciales incorrectas.' : 'No connection and incorrect credentials.');
            setIsLoggingIn(false);
            return;
          }
        }
      }

      const role = 'teacher';
      localStorage.setItem('learnhands_session_user', usernameClean);
      localStorage.setItem('learnhands_session_role', role);
      setSessionUser(usernameClean);
      setUserRole(role);
      setLoginError('');
      setIsLoggingIn(false);
      setScores({});
      addLocalLog('USER_LOGIN', `El usuario "${usernameClean}" ha iniciado sesión con rol: TEACHER.`);
      addUxMetric(usernameClean, 'LOGIN', 'HUB', 1, { role });
      setView('HOME');
      triggerSync();
      triggerUxSync();
    } else {
      // ── MODO ALUMNO ─────────────────────────────────────────────────────────
      const raw = loginInput.trim();

      if (!raw) {
        setLoginError(lang === 'es' ? 'Ingresa tu cédula.' : 'Enter your ID number.');
        return;
      }

      // Validar 10 dígitos numéricos
      if (!/^\d{10}$/.test(raw)) {
        setLoginError(lang === 'es' ? 'La cédula debe tener exactamente 10 dígitos.' : 'ID must be exactly 10 digits.');
        return;
      }

      // Si es un nuevo alumno (ya detectado), validar nombre
      if (isNewStudent) {
        // Sanitizar nombre: sin tildes, sin símbolos
        const nameRaw = displayNameInput.trim();
        const nameSanitized = nameRaw
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quitar tildes
          .replace(/[^a-zA-Z0-9\s]/g, '')                    // quitar símbolos
          .replace(/\s+/g, ' ').trim();

        if (!nameSanitized || nameSanitized.length < 2) {
          setLoginError(lang === 'es' ? 'Ingresa tu nombre completo (sin tildes ni símbolos).' : 'Enter your full name (no accents or symbols).');
          return;
        }
        if (nameSanitized.length > 50) {
          setLoginError(lang === 'es' ? 'El nombre no puede tener más de 50 caracteres.' : 'Name cannot exceed 50 characters.');
          return;
        }
      }

      setIsLoggingIn(true);
      setLoginError('');

      // Si no tenemos internet y no es un alumno nuevo: entrar con cédula local
      if (!navigator.onLine) {
        const savedCedula = localStorage.getItem('learnhands_session_user');
        const savedDisplay = localStorage.getItem('learnhands_session_display_name');
        if (savedCedula === raw) {
          const role = 'student';
          setSessionUser(raw);
          setSessionDisplayName(savedDisplay || raw);
          setUserRole(role);
          setLoginError('');
          setIsLoggingIn(false);
          setScores({});
          addLocalLog('USER_LOGIN', `Alumno '${savedDisplay || raw}' inició sesión offline.`);
          setView('HOME');
          return;
        } else {
          setLoginError(lang === 'es' ? 'Sin conexión: solo puedes ingresar con tu cédula guardada.' : 'Offline: can only log in with your saved ID.');
          setIsLoggingIn(false);
          return;
        }
      }

      try {
        // Verificar si la cédula existe en la API
        if (!isNewStudent) {
          const checkRes = await fetch(`${getApiUrl()}/api/auth/check-cedula/${raw}`, {
            signal: AbortSignal.timeout(5000)
          });
          const checkData = await checkRes.json();

          if (!checkData.valid) {
            setLoginError(lang === 'es' ? 'Cédula inválida.' : 'Invalid ID number.');
            setIsLoggingIn(false);
            return;
          }

          if (!checkData.exists) {
            // Nuevo alumno — pedir nombre y clase
            setIsNewStudent(true);
            setIsLoggingIn(false);
            setLoginError(lang === 'es' ? '¡Cédula nueva! Ingresa tu nombre para registrarte.' : 'New ID! Enter your name to register.');
            return;
          }

          // Alumno existente → login (POST a register que actúa como login)
          const resp = await fetch(`${getApiUrl()}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula: raw }),
            signal: AbortSignal.timeout(5000)
          });
          const data = await resp.json();
          if (!resp.ok || !data.success) {
            setLoginError(data.error || 'Error al iniciar sesión.');
            setIsLoggingIn(false);
            return;
          }

          const displayName = data.display_name || raw;
          const classes = data.classes || [];
          const activeClass = data.class_code || (classes[0]?.class_code) || null;

          localStorage.setItem('learnhands_session_user', raw);
          localStorage.setItem('learnhands_session_display_name', displayName);
          localStorage.setItem('learnhands_session_role', 'student');
          localStorage.setItem('learnhands_student_classes', JSON.stringify(classes));
          if (activeClass) localStorage.setItem('learnhands_active_class', activeClass);

          setSessionUser(raw);
          setSessionDisplayName(displayName);
          setUserRole('student');
          setStudentClasses(classes);
          setActiveStudentClass(activeClass);
          setLoginError('');
          setIsLoggingIn(false);
          setScores({});
          addLocalLog('USER_LOGIN', `Alumno '${displayName}' (${raw}) inició sesión.`);
          addUxMetric(raw, 'LOGIN', 'HUB', 1, { role: 'student' });
          setView('HOME');
          triggerSync();
          triggerUxSync();
          return;
        }

        // ── Registro de nuevo alumno ────────────────────────────────────────
        const nameSanitized = displayNameInput.trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

        const classCode = classCodeInput.trim().toUpperCase() || null;

        const resp = await fetch(`${getApiUrl()}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula: raw, display_name: nameSanitized, class_code: classCode }),
          signal: AbortSignal.timeout(8000)
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setLoginError(data.error || 'Error al registrarte.');
          setIsLoggingIn(false);
          return;
        }

        const displayName = data.display_name || nameSanitized;
        const classes = data.classes || [];
        const activeClass = data.class_code || (classes[0]?.class_code) || null;

        localStorage.setItem('learnhands_session_user', raw);
        localStorage.setItem('learnhands_session_display_name', displayName);
        localStorage.setItem('learnhands_session_role', 'student');
        localStorage.setItem('learnhands_student_classes', JSON.stringify(classes));
        if (activeClass) localStorage.setItem('learnhands_active_class', activeClass);

        setSessionUser(raw);
        setSessionDisplayName(displayName);
        setUserRole('student');
        setStudentClasses(classes);
        setActiveStudentClass(activeClass);
        setLoginError('');
        setIsLoggingIn(false);
        setScores({});
        addLocalLog('USER_LOGIN', `Nuevo alumno '${displayName}' (${raw}) registrado.`);
        addUxMetric(raw, 'LOGIN', 'HUB', 1, { role: 'student' });
        setView('HOME');
        triggerSync();
        triggerUxSync();

      } catch (err) {
        console.error('[Login Alumno] Error:', err.message);
        // Si tenemos datos locales para esta cédula, permitir acceso offline
        const savedCedula = localStorage.getItem('learnhands_session_user');
        if (savedCedula === raw) {
          const savedDisplay = localStorage.getItem('learnhands_session_display_name') || raw;
          setSessionUser(raw);
          setSessionDisplayName(savedDisplay);
          setUserRole('student');
          setLoginError('');
          setIsLoggingIn(false);
          setScores({});
          addLocalLog('USER_LOGIN', `Alumno '${savedDisplay}' inició sesión offline (fallback).`);
          setView('HOME');
        } else {
          setLoginError(lang === 'es' ? 'Sin conexión. No se pudo verificar tu cédula.' : 'No connection. Could not verify your ID.');
          setIsLoggingIn(false);
        }
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('learnhands_session_user');
    localStorage.removeItem('learnhands_session_role');
    localStorage.removeItem('learnhands_session_display_name');
    localStorage.removeItem('learnhands_student_classes');
    localStorage.removeItem('learnhands_active_class');
    setSessionUser('');
    setSessionDisplayName('');
    setUserRole('student');
    setStudentClasses([]);
    setActiveStudentClass(null);
    setIsNewStudent(false);
    setView('LOGIN');
    setLoginInput('');
    setPasswordInput('');
    setLoginError('');
    setIsTeacherMode(false);
    addLocalLog('USER_LOGOUT', 'Usuario ha cerrado sesión.');
  };

  // Unirse a una clase (alumno)
  const handleJoinClass = async () => {
    const code = joinClassInput.trim().toUpperCase();
    if (!code) {
      setJoinClassError(lang === 'es' ? 'Ingresa un código de clase.' : 'Enter a class code.');
      return;
    }
    setIsJoiningClass(true);
    setJoinClassError('');
    try {
      const res = await fetch(`${getApiUrl()}/api/student/join-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sessionUser, class_code: code }),
        signal: AbortSignal.timeout(6000)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al unirse a la clase');

      const newClass = { class_code: data.class_code, class_name: data.class_name, teacher_username: data.teacher };
      const updatedClasses = [...studentClasses.filter(c => c.class_code !== data.class_code), newClass];
      
      localStorage.setItem('learnhands_student_classes', JSON.stringify(updatedClasses));
      localStorage.setItem('learnhands_active_class', data.class_code);

      setStudentClasses(updatedClasses);
      setActiveStudentClass(data.class_code);
      setJoinClassInput('');
      setShowClassSwitcher(false);
      addLocalLog('STUDENT_JOINED_CLASS', `Alumno se unió a clase ${data.class_code} (${data.class_name || ''})`);
    } catch (err) {
      setJoinClassError(err.message);
    } finally {
      setIsJoiningClass(false);
    }
  };

  // Cambiar la clase activa del alumno
  const handleSwitchActiveClass = async (code) => {
    if (code === activeStudentClass) {
      setShowClassSwitcher(false);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/student/active-class`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sessionUser, class_code: code }),
        signal: AbortSignal.timeout(5000)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar clase activa');

      localStorage.setItem('learnhands_active_class', code);
      setActiveStudentClass(code);
      setShowClassSwitcher(false);
      addLocalLog('STUDENT_SWITCH_CLASS', `Clase activa cambiada a ${code}`);
    } catch (err) {
      console.error('[Switch Class] Error:', err.message);
      localStorage.setItem('learnhands_active_class', code);
      setActiveStudentClass(code);
      setShowClassSwitcher(false);
    }
  };

  // Cargar lista de clases del profesor
  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    setClassesError('');
    try {
      const response = await fetch(`${getApiUrl()}/api/teacher/classes?teacher=${encodeURIComponent(sessionUser)}`);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      setClassesList(data);
    } catch (err) {
      setClassesError('No se pudo cargar las clases: ' + err.message);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Crear nueva clase
  const handleCreateClass = async () => {
    const name = newClassName.trim();
    if (!name) { setCreateClassError('Ingresa un nombre para la clase.'); return; }
    setIsCreatingClass(true);
    setCreateClassError('');
    try {
      const res = await fetch(`${getApiUrl()}/api/teacher/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher: sessionUser, class_name: name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear clase');
      setNewClassName('');
      fetchClasses();
    } catch (err) {
      setCreateClassError(err.message);
    } finally {
      setIsCreatingClass(false);
    }
  };

  // Eliminar clase
  const handleDeleteClass = async (code) => {
    setDeletingCode(code);
    try {
      const res = await fetch(`${getApiUrl()}/api/teacher/classes/${code}?teacher=${encodeURIComponent(sessionUser)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      fetchClasses();
    } catch (err) {
      setClassesError('Error al eliminar clase: ' + err.message);
    } finally {
      setDeletingCode(null);
    }
  };

  // Copiar código al portapapeles
  const handleCopyCode = (code) => {
    try {
      navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  useEffect(() => {
    if (view === 'TEACHER_CLASSES') {
      fetchClasses();
    }
  }, [view]);

  // Cargar lista de estudiantes para el panel del Profesor (filtrado por clase si se selecciona)
  const fetchStudents = async (classCode = selectedTeacherClassCode) => {
    setIsLoadingStudents(true);
    setStudentsError('');
    try {
      const url = classCode 
        ? `${getApiUrl()}/api/teacher/students?class_code=${encodeURIComponent(classCode)}`
        : `${getApiUrl()}/api/teacher/students`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error del servidor (${response.status})`);
      const data = await response.json();
      setStudentsList(data);
    } catch (err) {
      console.error('[Dashboard] Error cargando alumnos:', err.message);
      setStudentsError(t('sync_status_error', lang) + ': ' + err.message);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (view === 'TEACHER_DASHBOARD') {
      fetchClasses();
      fetchStudents(selectedTeacherClassCode);
    }
  }, [view, selectedTeacherClassCode]);

  // Sumar/Restar puntos en el juego actual (con penalización, mínimo 0)
  const addPoints = (p) => {
    if (!currentGame) return;
    setScores(prev => {
      const currentScore = prev[currentGame] || 0;
      const newPoints = Math.max(0, currentScore + p);
      return {
        ...prev,
        [currentGame]: newPoints
      };
    });
  };

  // Nivel basado en la suma de puntos en la sesión actual
  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((acc, curr) => acc + curr, 0);
  }, [scores]);

  const level = useMemo(() => Math.floor(totalScore / 100) + 1, [totalScore]);

  const saveActiveGameMetric = () => {
    if (view === 'GAME' && currentGame) {
      const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      const gameScore = scores[currentGame] || 0;
      
      // Solo registramos si la partida duró más de 2 segundos para evitar falsos positivos
      if (duration > 2) {
        addGameMetric(sessionUser, currentGame, gameScore, duration);

        // Guardar métricas de UX
        const ux = window.currentSessionUX;
        if (ux && ux.gameName === currentGame) {
          addUxMetric(sessionUser, 'MODULE_PLAYTIME', currentGame, duration);

          const successRate = ux.totalGestureFrames > 0
            ? (ux.successGestureFrames / ux.totalGestureFrames) * 100
            : 100;

          addUxMetric(sessionUser, 'GESTURE_EFFICIENCY', currentGame, successRate, {
            total_frames: ux.totalGestureFrames,
            success_frames: ux.successGestureFrames,
            false_positives: ux.falsePositives,
            false_negatives: ux.falseNegatives,
            interaction_count: ux.interactionCount
          });

          if (ux.autonomyTime !== null) {
            addUxMetric(sessionUser, 'AUTONOMY_TIME', currentGame, ux.autonomyTime);
          }
        }
        window.currentSessionUX = null;
        return true;
      }
    }
    return false;
  };

  const goToMenu = () => {
    if (saveActiveGameMetric()) {
      updatePendingCount();
    }

    setView('MENU');
    setMenuLocked(true);
    clearTimeout(menuLockTimerRef.current);
    menuLockTimerRef.current = setTimeout(() => setMenuLocked(false), MENU_LOCK_MS);
  };

  // Escuchar beforeunload para guardar y sincronizar al cerrar la aplicación (X de Electron)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 1. Guardar síncronamente en localStorage la métrica de la partida actual
      saveActiveGameMetric();
      
      // 2. Si estamos conectados, forzar envío inmediato por Beacon antes de que se destruya el proceso
      if (navigator.onLine) {
        const queue = getMetricsQueue();
        if (queue.length > 0) {
          try {
            const blob = new Blob([JSON.stringify(queue)], { type: 'application/json' });
            const success = navigator.sendBeacon(`${getApiUrl()}/api/metrics`, blob);
            if (success) {
              // Limpiar la cola local ya que se delegó el envío a sendBeacon exitosamente
              localStorage.setItem('learnhands_metrics_queue', JSON.stringify([]));
            }
          } catch (e) {
            console.error('[Unload Sync] Falló sendBeacon:', e);
          }
        }

        const uxQueue = getUxQueue();
        if (uxQueue.length > 0) {
          try {
            const blobUx = new Blob([JSON.stringify(uxQueue)], { type: 'application/json' });
            const successUx = navigator.sendBeacon(`${getApiUrl()}/api/ux-metrics`, blobUx);
            if (successUx) {
              localStorage.setItem('learnhands_ux_queue', JSON.stringify([]));
            }
          } catch (e) {
            console.error('[Unload UX Sync] Falló sendBeacon:', e);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [view, currentGame, sessionUser, scores]);

  // Iniciar un juego (muestra el tutorial antes de entrar)
  const startModule = (gameKey) => {
    setTutorialGameKey(gameKey);
    setShowGameTutorial(true);
  };

  // Se ejecuta al completar exitosamente el tutorial interactivo
  const completeTutorial = useCallback(() => {
    const gameKey = tutorialGameKey;
    setShowGameTutorial(false);

    // El sistema de puntaje se reinicia para que comience en 0 por cada partida
    setScores(prev => ({
      ...prev,
      [gameKey]: 0
    }));
    
    // Inicializar el registrador de sesión de UX
    window.currentSessionUX = {
      gameName: gameKey,
      startTime: Date.now(),
      firstGestureTime: null,
      autonomyTime: null,
      consecutiveSuccessCount: 0,
      tooltipTriggered: false,
      totalGestureFrames: 0,
      successGestureFrames: 0,
      falsePositives: 0,
      falseNegatives: 0,
      interactionCount: 0,
      wasGestureActive: false,
      gestureStartTime: null,
      tooltipActiveThisTime: false,
      lastInteractionTime: null
    };

    setCurrentGame(gameKey);
    gameStartTimeRef.current = Date.now();
    setView('GAME');
    addLocalLog('GAME_START', `Usuario "${sessionUser}" inició módulo: ${gameKey}`);
  }, [tutorialGameKey, sessionUser]);

  // Pinch-to-scroll: pellizcar índice+pulgar y arrastrar desplaza el menú
  useEffect(() => {
    if (view !== 'MENU') {
      window.isHandScrolling = false;
      return;
    }
    let rafId;
    let prevY = null;
    let scrollActive = false;
    let clearScrollTimer = null;

    const tick = () => {
      const data = window.latestHandData || {};
      const cursor = data.cursors?.[0];
      const gesture = data.gestures?.[0];

      if (gesture?.isPinching && cursor?.isVisible) {
        window.isHandScrolling = true;
        scrollActive = true;
        clearTimeout(clearScrollTimer);

        if (prevY !== null && menuScrollRef.current) {
          const delta = (cursor.y - prevY) * 2.2;
          menuScrollRef.current.scrollTop += delta;
        }
        prevY = cursor.y;
      } else {
        prevY = null;
        if (scrollActive) {
          scrollActive = false;
          clearScrollTimer = setTimeout(() => { window.isHandScrolling = false; }, 300);
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.isHandScrolling = false;
    };
  }, [view]);

  return (
    <LayeredEngine videoRef={videoRef} isLoaded={isLoaded} error={error} transparent={!(view === 'GAME' && currentGame === 'PIZARRA')} lang={lang}>

      {/* Tutorial interactivo previo a juegos */}
      {showGameTutorial && (
        <GameTutorialOverlay gameKey={tutorialGameKey} lang={lang} onComplete={completeTutorial} />
      )}

      {/* Botón flotante superior derecho para alternar idioma en cualquier vista (excepto jugando) */}
      {view !== 'GAME' && (
        <div className="absolute top-12 right-12 z-50 flex gap-4">
          {view === 'LOGIN' && (
            <HandButton
              onClick={() => setShowApiSettings(true)}
              className="p-4 flex items-center justify-center animate-pulse"
              variant="purple"
              dwellMs={700}
            >
              <Settings size={14} />
            </HandButton>
          )}
          {view !== 'LOGIN' && userRole === 'student' && (
            <HandButton
              onClick={() => setShowClassSwitcher(true)}
              className="px-5 py-4 text-xs font-black tracking-widest flex items-center gap-2"
              variant="cyan"
              dwellMs={700}
            >
              <Users size={14} />
              <span>
                {activeStudentClass 
                  ? `${lang === 'es' ? 'Clase' : 'Class'}: ${activeStudentClass}` 
                  : (lang === 'es' ? 'Sin Clase' : 'No Class')}
              </span>
            </HandButton>
          )}
          <HandButton onClick={toggleLanguage} className="px-5 py-4 text-xs font-black tracking-widest flex items-center gap-2" variant="purple" dwellMs={700}>
            <Languages size={14} />
            <span>{lang === 'es' ? '🇺🇸 EN' : '🇪🇸 ES'}</span>
          </HandButton>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* PANTALLA DE REGISTRO / LOGIN INICIAL */}
        {view === 'LOGIN' && (
          <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 flex flex-col items-center justify-center p-20 z-30">
            <div className="absolute top-12 left-12 flex items-center gap-6">
              <img src={puceLogo} alt="PUCE Logo" className="h-20 w-auto drop-shadow-lg" />
              <div className="h-12 w-[1px] bg-white/20" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Sede Quito</span>
            </div>

            <div className="glass p-16 rounded-[60px] border border-white/10 flex flex-col items-center gap-10 text-center max-w-xl w-full shadow-2xl bg-black/55 backdrop-blur-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl border border-white/20">👤</div>
              
              <div className="space-y-4 w-full">
                <h2 className="text-4xl font-display font-black tracking-tighter italic uppercase text-gradient">
                  {isTeacherMode ? t('login_teacher_title', lang) : t('login_title', lang)}
                </h2>
                <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 mt-6">
                  {isTeacherMode ? (
                    <>
                      <input
                        type="text"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        placeholder={t('login_placeholder', lang)}
                        className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-center text-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-white/20"
                        maxLength={30}
                      />
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder={t('login_password_placeholder', lang)}
                        className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-center text-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-white/20"
                        maxLength={30}
                        autoFocus
                      />
                    </>
                  ) : isNewStudent ? (
                    <>
                      <div className="w-full px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm font-bold text-center">
                        {lang === 'es' ? `Cédula: ${loginInput}` : `ID: ${loginInput}`}
                      </div>
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => {
                          const cleanVal = e.target.value
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-zA-Z0-9\s]/g, '');
                          setDisplayNameInput(cleanVal);
                        }}
                        placeholder={lang === 'es' ? 'Nombre Completo' : 'Full Name'}
                        className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-center text-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-white/20"
                        maxLength={50}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={classCodeInput}
                        onChange={(e) => {
                          const cleanVal = e.target.value
                            .replace(/[^a-zA-Z0-9]/g, '')
                            .toUpperCase();
                          setClassCodeInput(cleanVal);
                        }}
                        placeholder={lang === 'es' ? 'Código de Clase (Opcional)' : 'Class Code (Optional)'}
                        className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-center text-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-white/20"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewStudent(false);
                          setLoginError('');
                          setDisplayNameInput('');
                          setClassCodeInput('');
                        }}
                        className="text-purple-400 text-xs font-bold uppercase tracking-wider underline hover:text-purple-300 transition-colors"
                      >
                        {lang === 'es' ? '← Cambiar Cédula' : '← Change ID'}
                      </button>
                    </>
                  ) : (
                    <input
                      type="text"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value.replace(/\D/g, ''))} // Solo dígitos
                      placeholder={lang === 'es' ? 'Ingresa tu cédula' : 'Enter your ID number'}
                      className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-center text-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-white/20"
                      maxLength={10}
                      autoFocus
                    />
                  )}
                  {loginError && (
                    <p className="text-red-400 text-xs font-black uppercase tracking-wider mt-1">{loginError}</p>
                  )}
                  {!isOnline && (
                    <p className="text-amber-400 text-xs font-black uppercase tracking-wider mt-2 animate-pulse">
                      {lang === 'es' ? '⚠️ Sin conexión: Solo acceso como Estudiante' : '⚠️ Offline: Student access only'}
                    </p>
                  )}
                </form>
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <HandButton onClick={handleLogin} disabled={isLoggingIn} className="px-16 py-8 text-xl w-full h-24" variant="purple" dwellMs={900}>
                  {isLoggingIn ? (
                    <><div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> {lang === 'es' ? 'Verificando...' : 'Verifying...'}</>
                  ) : (
                    <><LogIn size={20} /> {t('login_btn_enter', lang)}</>
                  )}
                </HandButton>
                
                <HandButton
                  onClick={() => {
                    if (!isOnline) return;
                    setIsTeacherMode(prev => {
                      const next = !prev;
                      if (next) {
                        setLoginInput('KathePastaz');
                      } else {
                        setLoginInput('');
                      }
                      setPasswordInput('');
                      setLoginError('');
                      return next;
                    });
                  }}
                  disabled={!isOnline}
                  className={`px-8 py-3.5 text-[10px] ${!isOnline ? 'opacity-40 cursor-not-allowed' : ''}`}
                  variant="default"
                  dwellMs={700}
                >
                  {isTeacherMode ? t('login_student_toggle', lang) : t('login_teacher_toggle', lang)}
                </HandButton>
                
                {onExit && (
                  <HandButton onClick={onExit} className="px-10 py-3 text-[10px]" variant="red" dwellMs={700}>
                    {t('btn_exit', lang)}
                  </HandButton>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* PANTALLA PRINCIPAL (HOME) */}
        {view === 'HOME' && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 z-30">
            {/* Logo PUCE */}
            <div className="absolute top-12 left-12 flex items-center gap-6">
              <img src={puceLogo} alt="PUCE Logo" className="h-20 w-auto drop-shadow-lg" />
              <div className="h-12 w-[1px] bg-white/20" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Sede Quito</span>
            </div>

            <div className={`glass p-8 lg:p-12 rounded-[50px] border border-white/10 flex flex-col lg:flex-row items-center lg:items-stretch gap-8 text-center w-full shadow-2xl relative bg-black/45 backdrop-blur-md transition-all duration-500 ${showDashboard ? 'max-w-6xl' : 'max-w-2xl'}`}>
              
              {/* COLUMNA IZQUIERDA: MENÚ HOME */}
              <div className={`flex flex-col items-center justify-center text-center gap-6 shrink-0 transition-all duration-500 ${showDashboard ? 'w-full lg:w-96' : 'w-full lg:max-w-xl mx-auto py-8 lg:py-12'}`}>
                <div className="relative w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl border border-white/20">🖐️</div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl lg:text-5xl font-display font-black tracking-tighter italic uppercase text-gradient leading-tight">{t('title_hub', lang)}</h2>
                  <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px] italic leading-normal">{t('subtitle_hub', lang)}</p>

                  {/* Chip de usuario actual */}
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                      <User size={14} className="text-purple-400" />
                      <span className="text-sm font-black text-white/80 uppercase tracking-widest">{sessionUser}</span>
                      {userRole === 'teacher' && <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/20 px-2 py-0.5 rounded-full ml-1">🎓 Profe</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-5 w-full">
                  <HandButton
                    onClick={() => { setShowHubOnboarding(false); goToMenu(); }}
                    disabled={showHubOnboarding}
                    className="px-12 py-6 text-xl w-full max-w-sm h-24 animate-pulse flex items-center justify-center gap-3"
                    variant="purple"
                    dwellMs={showHubOnboarding ? 99999 : 800}
                  >
                    <Play fill="white" size={24} /> {t('btn_start', lang)}
                  </HandButton>
                  
                  <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm">
                    <HandButton
                      onClick={() => setShowDashboard(prev => !prev)}
                      disabled={showHubOnboarding}
                      className="px-6 py-3 text-[10px] font-black tracking-widest flex items-center gap-2 flex-1 justify-center min-w-[150px]"
                      variant={showDashboard ? "purple" : "default"}
                      dwellMs={800}
                    >
                      <Award size={14} />
                      {showDashboard ? (lang === 'es' ? 'Ocultar Estadísticas' : 'Hide Statistics') : (lang === 'es' ? 'Ver Estadísticas' : 'View Statistics')}
                    </HandButton>

                    <HandButton
                      onClick={handleLogout}
                      disabled={showHubOnboarding}
                      className="px-6 py-3 text-[10px] font-black tracking-widest flex items-center gap-2 flex-1 justify-center min-w-[150px]"
                      variant="red"
                      dwellMs={800}
                    >
                      <LogOut size={14} />
                      {lang === 'es' ? 'Cerrar Sesión' : 'Log Out'}
                    </HandButton>

                    {onExit && (
                      <HandButton onClick={onExit} disabled={showHubOnboarding} className="px-6 py-3 text-[10px] font-black tracking-widest flex-1 justify-center min-w-[100px]" variant="red" dwellMs={750}>
                        {t('btn_exit', lang)}
                      </HandButton>
                    )}
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: DASHBOARD DE ESTADÍSTICAS */}
              {showDashboard && (
                <div className="flex-1 flex flex-col gap-6 text-left min-w-0 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 overflow-hidden h-[600px]">
                  <div className="flex flex-col gap-2 shrink-0">
                    <h3 className="text-2xl font-display font-black text-gradient uppercase tracking-tight italic">
                      {lang === 'es' ? 'Métricas de Aprendizaje & UX' : 'Learning & UX Metrics'}
                    </h3>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                      {lang === 'es' ? 'Datos de interacción y autonomía de estudiantes' : 'Student interaction and autonomy data'}
                    </p>
                  </div>

                  {/* Selector de estudiantes */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
                      {lang === 'es' ? 'Filtrar por Alumno' : 'Filter by Student'}
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                      <HandButton
                        onClick={() => setDashboardStudentFilter('ALL')}
                        className={`px-3 py-1.5 text-[8px] font-black tracking-widest ${dashboardStudentFilter === 'ALL' ? '!bg-purple-500/20 !border-purple-500/50 text-white' : ''}`}
                        dwellMs={400}
                      >
                        {lang === 'es' ? 'TODOS' : 'ALL'}
                      </HandButton>
                      {uniqueStudents.map(student => (
                        <HandButton
                          key={student}
                          onClick={() => setDashboardStudentFilter(student)}
                          className={`px-3 py-1.5 text-[8px] font-black tracking-widest ${dashboardStudentFilter === student ? '!bg-purple-500/20 !border-purple-500/50 text-white' : ''}`}
                          dwellMs={450}
                        >
                          {student.toUpperCase()}
                        </HandButton>
                      ))}
                    </div>
                  </div>

                  {/* Tabs del Dashboard */}
                  <div className="flex gap-3 shrink-0 border-b border-white/5 pb-3">
                    <HandButton
                      onClick={() => setDashboardTab('summary')}
                      className={`px-4 py-2 text-[9px] font-black tracking-widest ${dashboardTab === 'summary' ? 'variant-purple' : '!bg-white/5 !border-white/5'}`}
                      variant={dashboardTab === 'summary' ? 'purple' : 'default'}
                      dwellMs={500}
                    >
                      {lang === 'es' ? 'RESUMEN GENERAL' : 'SUMMARY'}
                    </HandButton>
                    <HandButton
                      onClick={() => setDashboardTab('timeline')}
                      className={`px-4 py-2 text-[9px] font-black tracking-widest ${dashboardTab === 'timeline' ? 'variant-purple' : '!bg-white/5 !border-white/5'}`}
                      variant={dashboardTab === 'timeline' ? 'purple' : 'default'}
                      dwellMs={500}
                    >
                      {lang === 'es' ? 'EVOLUCIÓN TEMPORAL' : 'TIMELINE'}
                    </HandButton>
                    <HandButton
                      onClick={() => setDashboardTab('ux')}
                      className={`px-4 py-2 text-[9px] font-black tracking-widest ${dashboardTab === 'ux' ? 'variant-purple' : '!bg-white/5 !border-white/5'}`}
                      variant={dashboardTab === 'ux' ? 'purple' : 'default'}
                      dwellMs={500}
                    >
                      {lang === 'es' ? 'ANÁLISIS UX' : 'UX METRICS'}
                    </HandButton>
                  </div>

                  {/* Contenido de la pestaña */}
                  <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {dashboardTab === 'summary' && (
                      <div className="space-y-6">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="glass p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col gap-1">
                            <span className="text-[8.5px] font-black text-white/30 uppercase tracking-widest">{lang === 'es' ? 'Total Sesiones' : 'Total Sessions'}</span>
                            <span className="text-xl font-display font-black text-white italic">{totalSessions}</span>
                          </div>
                          <div className="glass p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col gap-1">
                            <span className="text-[8.5px] font-black text-white/30 uppercase tracking-widest">{lang === 'es' ? 'Tiempo Activo' : 'Active Time'}</span>
                            <span className="text-xl font-display font-black text-purple-400 italic">{totalTimeMins} <span className="text-xs not-italic text-white/40">min</span></span>
                          </div>
                          <div className="glass p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col gap-1">
                            <span className="text-[8.5px] font-black text-white/30 uppercase tracking-widest">{lang === 'es' ? 'Autonomía Prom.' : 'Avg Autonomy'}</span>
                            <span className="text-xl font-display font-black text-amber-400 italic">{avgAutonomy} <span className="text-xs not-italic text-white/40">min</span></span>
                          </div>
                          <div className="glass p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col gap-1">
                            <span className="text-[8.5px] font-black text-white/30 uppercase tracking-widest">{lang === 'es' ? 'Precisión Gestual' : 'Gesture Acc.'}</span>
                            <span className="text-xl font-display font-black text-emerald-400 italic">{recognitionAccuracy}%</span>
                          </div>
                        </div>

                        {/* Average scores chart */}
                        <div className="glass p-5 rounded-3xl border border-white/10 bg-black/35 flex flex-col gap-4">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{lang === 'es' ? 'Puntajes Promedio por Juego' : 'Average Scores by Game'}</span>
                          {gameScores.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-[10px] font-black uppercase text-white/20">{lang === 'es' ? 'Sin datos de puntaje' : 'No score data'}</div>
                          ) : (
                            <div className="w-full">
                              {/* SVG Vertical Bar Chart */}
                              <svg viewBox="0 0 500 200" className="w-full h-48">
                                <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                                <line x1="40" y1="80" x2="480" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                                <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                                <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.2)" />
                                {(() => {
                                  const maxAvg = Math.max(...gameScores.map(g => g.avg), 100);
                                  return gameScores.map((g, idx) => {
                                    const colWidth = 420 / Math.max(gameScores.length, 1);
                                    const x = 50 + idx * colWidth + (colWidth - 24) / 2;
                                    const barHeight = (g.avg / maxAvg) * 140;
                                    const y = 170 - barHeight;
                                    return (
                                      <g key={g.game}>
                                        <defs>
                                          <linearGradient id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#c084fc" />
                                            <stop offset="100%" stopColor="#6366f1" />
                                          </linearGradient>
                                        </defs>
                                        <rect
                                          x={x}
                                          y={y}
                                          width="24"
                                          height={barHeight}
                                          rx="6"
                                          fill={`url(#barGrad-${idx})`}
                                        />
                                        <text x={x + 12} y={y - 6} textAnchor="middle" fill="#fff" className="text-[9px] font-black">{g.avg}</text>
                                        <text x={x + 12} y="185" textAnchor="middle" fill="rgba(255,255,255,0.4)" className="text-[8px] font-black uppercase tracking-wider">{g.game.substring(0, 5)}</text>
                                      </g>
                                    );
                                  });
                                })()}
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Module usage Horizontal progress bars */}
                        <div className="glass p-5 rounded-3xl border border-white/10 bg-black/35 flex flex-col gap-4">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{lang === 'es' ? 'Módulos Más Utilizados (Aperturas)' : 'Most Used Modules (Opens)'}</span>
                          {moduleUsage.length === 0 ? (
                            <div className="py-8 text-center text-[10px] font-black uppercase text-white/20">{lang === 'es' ? 'Sin datos de uso' : 'No usage data'}</div>
                          ) : (
                            <div className="space-y-4">
                              {(() => {
                                const maxCount = Math.max(...moduleUsage.map(m => m.count), 1);
                                return moduleUsage.map(m => (
                                  <div key={m.name} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                      <span className="text-white/75">{m.name}</span>
                                      <span className="text-purple-400">{m.count} {lang === 'es' ? 'veces' : 'times'}</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                      <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                        style={{ width: `${(m.count / maxCount) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {dashboardTab === 'timeline' && (
                      <div className="space-y-6">
                        {/* Bezier Line Chart */}
                        <div className="glass p-5 rounded-3xl border border-white/10 bg-black/35 flex flex-col gap-4">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{lang === 'es' ? 'Puntos Totales Obtenidos (Últimos 7 Días)' : 'Total Points Obtained (Last 7 Days)'}</span>
                          <div className="w-full">
                            <svg viewBox="0 0 500 200" className="w-full h-48">
                              <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgba(167, 139, 250, 0.4)" />
                                  <stop offset="100%" stopColor="rgba(167, 139, 250, 0.0)" />
                                </linearGradient>
                              </defs>
                              <line x1="40" y1="40" x2="480" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                              <line x1="40" y1="105" x2="480" y2="105" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                              <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.2)" />
                              {(() => {
                                const maxVal = Math.max(...timelineData.map(d => d.score), 100);
                                const points = timelineData.map((d, idx) => {
                                  const x = 55 + idx * (410 / 6);
                                  const y = 170 - (d.score / maxVal) * 130;
                                  return { x, y };
                                });
                                const pathD = points.reduce((acc, p, idx) => {
                                  if (idx === 0) return `M ${p.x} ${p.y}`;
                                  const prev = points[idx - 1];
                                  const cpX1 = prev.x + (p.x - prev.x) / 2;
                                  const cpY1 = prev.y;
                                  const cpX2 = prev.x + (p.x - prev.x) / 2;
                                  const cpY2 = p.y;
                                  return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
                                }, '');
                                const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z` : '';
                                
                                return (
                                  <>
                                    {areaD && <path d={areaD} fill="url(#areaGrad)" />}
                                    {pathD && <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="3" />}
                                    {points.map((p, idx) => (
                                      <g key={idx}>
                                        <circle cx={p.x} cy={p.y} r="5" fill="#a78bfa" stroke="#fff" strokeWidth="1.5" />
                                        <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#fff" className="text-[9px] font-black">{timelineData[idx].score}</text>
                                        <text x={p.x} y="185" textAnchor="middle" fill="rgba(255,255,255,0.4)" className="text-[8px] font-black uppercase tracking-wider">{timelineData[idx].dateStr}</text>
                                      </g>
                                    ))}
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        </div>

                        {/* Recent metrics logs table */}
                        <div className="glass p-5 rounded-3xl border border-white/10 bg-black/35 flex flex-col gap-4">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{lang === 'es' ? 'Partidas Recientes de la Base de Datos' : 'Recent Games from Database'}</span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[10px] border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 text-white/30 uppercase tracking-widest font-black">
                                  <th className="py-2">{lang === 'es' ? 'Estudiante' : 'Student'}</th>
                                  <th className="py-2">{lang === 'es' ? 'Juego' : 'Game'}</th>
                                  <th className="py-2 text-center">{lang === 'es' ? 'Puntaje' : 'Score'}</th>
                                  <th className="py-2 text-right">{lang === 'es' ? 'Fecha' : 'Date'}</th>
                                </tr>
                              </thead>
                              <tbody className="text-white/80 font-bold">
                                {filteredMetrics.slice(-5).reverse().map((m, idx) => (
                                  <tr key={idx} className="border-b border-white/5 last:border-0">
                                    <td className="py-2.5 uppercase text-purple-400">{m.username}</td>
                                    <td className="py-2.5">{m.game_name}</td>
                                    <td className="py-2.5 text-center text-amber-400 font-display italic">{m.score} pts</td>
                                    <td className="py-2.5 text-right text-white/30">{new Date(m.played_at).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                                {filteredMetrics.length === 0 && (
                                  <tr>
                                    <td colSpan="4" className="py-4 text-center text-white/20 uppercase font-black">{lang === 'es' ? 'Sin partidas registradas' : 'No recorded games'}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {dashboardTab === 'ux' && (
                      <div className="space-y-6">
                        {/* Gesture efficiency details */}
                        <div className="glass p-5 rounded-3xl border border-white/10 bg-black/35 flex flex-col gap-4">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{lang === 'es' ? 'Eficiencia y Precisión Gestual' : 'Gesture Efficiency & Accuracy'}</span>
                          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
                            {/* Radial accuracy progress */}
                            <div className="relative w-36 h-36 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="72" cy="72" r="58" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                                <circle
                                  cx="72"
                                  cy="72"
                                  r="58"
                                  stroke="#10b981"
                                  strokeWidth="12"
                                  fill="transparent"
                                  strokeDasharray={2 * Math.PI * 58}
                                  strokeDashoffset={2 * Math.PI * 58 * (1 - recognitionAccuracy / 100)}
                                  strokeLinecap="round"
                                  className="transition-all duration-1000"
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-display font-black text-white italic">{recognitionAccuracy}%</span>
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{lang === 'es' ? 'PRECISIÓN' : 'ACCURACY'}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4 max-w-xs text-[11px] text-white/70 leading-relaxed">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{lang === 'es' ? 'Precisión ideal (>85%): Refleja una detección gestual fluida.' : 'Ideal accuracy (>85%): Reflects fluid gesture detection.'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                <span>{lang === 'es' ? 'Tolerancia al error: El grace period evita rebotes accidentales.' : 'Error tolerance: The grace period prevents accidental double triggers.'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Autonomy index */}
                        <div className="glass p-5 rounded-3xl border border-white/10 bg-black/35 flex flex-col gap-4">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{lang === 'es' ? 'Tiempo de Autonomía de Estudiantes' : 'Student Autonomy Time'}</span>
                          <div className="flex items-end gap-3 justify-around pt-6 h-36">
                            {(() => {
                              const auts = filteredUx.filter(u => u.metric_type === 'AUTONOMY_TIME');
                              const displayList = auts.slice(-8);
                              if (displayList.length === 0) {
                                return (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase text-white/20">
                                    {lang === 'es' ? 'Sin datos de autonomía' : 'No autonomy data'}
                                  </div>
                                );
                              }
                              const maxAut = Math.max(...displayList.map(d => d.metric_value), 10);
                              return displayList.map((d, idx) => {
                                const heightPct = (d.metric_value / maxAut) * 85;
                                return (
                                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[28px]">
                                    <span className="text-[8px] font-black text-amber-400">{d.metric_value}m</span>
                                    <div className="w-full bg-gradient-to-t from-amber-600 to-yellow-400 rounded-t-lg transition-all duration-500" style={{ height: `${heightPct}px` }} />
                                    <span className="text-[6px] font-black text-white/20 truncate w-full text-center">{d.game_name.substring(0, 4)}</span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          <p className="text-[10px] text-white/40 text-center leading-relaxed">
                            {lang === 'es' ? 'Minutos promedio que interactúa un alumno de forma independiente antes de solicitar ayuda o guía docente.' : 'Average minutes a student interacts independently before requesting help or teacher guidance.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PANTALLA DEL MENÚ DE JUEGOS */}
        {view === 'MENU' && (
          <motion.div key="menu" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex-1 flex flex-col items-center pt-28 pb-4 px-12 overflow-hidden z-30">
            {/* Header */}
            <div className="absolute top-12 left-12 flex items-center gap-6 z-10">
              <HandButton onClick={() => setView('HOME')} className="px-5 py-3.5 text-xs flex items-center gap-2" variant="red" dwellMs={600}>
                <ArrowLeft size={16} /> {lang === 'es' ? 'Volver' : 'Back'}
              </HandButton>
              <img src={puceLogo} alt="PUCE Logo" className="h-16 w-auto drop-shadow-2xl" />
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <User size={12} className="text-purple-400" />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{sessionUser}</span>
              </div>
            </div>

            {/* Lock countdown badge */}
            <AnimatePresence>
              {menuLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-12 right-44 z-10 flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl"
                >
                  <Lock size={12} className="text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('label_preparing', lang)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <h2 className="shrink-0 text-4xl md:text-5xl font-display font-black mb-6 italic text-gradient tracking-tighter uppercase underline decoration-purple-500/30 decoration-8 underline-offset-[16px]">{t('section_learn', lang)} & {t('section_play', lang)}</h2>

            {/* Scrollable area */}
            <div
              ref={menuScrollRef}
              className="w-full max-w-6xl flex flex-col gap-10 overflow-y-auto px-2 flex-1 min-h-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* ── Sección: Profesor (sólo visible para la profesora KathePastaz) ── */}
              {/* ── Sección: Profesor (sólo visible para la profesora KathePastaz) ── */}
              {userRole === 'teacher' && (
                <div>
                  <SectionHeader icon={<User size={16} />} title={t('teacher_dashboard', lang)} subtitle={t('teacher_subtitle', lang)} color="purple" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center mb-4">
                    <MenuCard
                      icon={<BookOpen />}
                      title={t('teacher_dashboard', lang)}
                      color="purple"
                      locked={menuLocked || (activeCardLock !== null && activeCardLock !== 'teacher_db')}
                      onHoverChange={(h) => handleCardHoverChange('teacher_db', h)}
                      onSelect={() => setView('TEACHER_DASHBOARD')}
                    />
                    <MenuCard
                      icon={<Users />}
                      title={lang === 'es' ? 'Mis Clases' : 'My Classes'}
                      color="cyan"
                      locked={menuLocked || (activeCardLock !== null && activeCardLock !== 'teacher_classes')}
                      onHoverChange={(h) => handleCardHoverChange('teacher_classes', h)}
                      onSelect={() => setView('TEACHER_CLASSES')}
                    />
                  </div>
                </div>
              )}

              {/* ── Sección: Aprende (educativos) ── */}
              <div>
                <SectionHeader icon={<GraduationCap size={16} />} title={t('section_learn', lang)} subtitle={t('section_learn_sub', lang)} color="emerald" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center">
                  {[
                    { id: 'LAB', icon: <FlaskConical />, title: t('mod_lab', lang), color: 'cyan', onSelect: () => startModule('LAB') },
                    { id: 'SOLAR_SYS', icon: <span className="text-4xl">🪐</span>, title: t('mod_solar_sys', lang), color: 'cyan', onSelect: () => startModule('SOLAR_SYS') },
                    { id: 'SILABAS', icon: <BookOpen />, title: t('mod_syllables', lang), color: 'purple', onSelect: () => startModule('SILABAS') },
                    { id: 'IRREGULAR_VERBS', icon: <span className="text-4xl">📚</span>, title: t('mod_verbs', lang), color: 'cyan', onSelect: () => startModule('IRREGULAR_VERBS') },
                    { id: 'ENGLISH', icon: <span className="text-4xl">🇺🇸</span>, title: t('mod_english', lang), color: 'cyan', onSelect: () => startModule('ENGLISH') },
                    { id: 'ABACUS', icon: <Award />, title: t('mod_abacus', lang), color: 'orange', onSelect: () => startModule('ABACUS') },
                    { id: 'ECO', icon: <Shield />, title: t('mod_eco', lang), color: 'emerald', onSelect: () => startModule('ECO') },
                    { id: 'CIRCUITS', icon: <Zap />, title: t('mod_circuits', lang), color: 'orange', onSelect: () => startModule('CIRCUITS') },
                    { id: 'ATOMS', icon: <Atom />, title: t('mod_atoms', lang), color: 'cyan', onSelect: () => startModule('ATOMS') },
                    { id: 'CODING', icon: <Code2 />, title: t('mod_coding', lang), color: 'emerald', onSelect: () => startModule('CODING') },
                    { id: 'ACCOUNTING', icon: <DollarSign />, title: t('mod_accounting', lang), color: 'purple', onSelect: () => startModule('ACCOUNTING') },
                    { id: 'TIMELINE', icon: <Clock />, title: t('mod_timeline', lang), color: 'orange', onSelect: () => startModule('TIMELINE') },
                    { id: 'ANATOMY', icon: <Heart />, title: t('mod_anatomy', lang), color: 'cyan', onSelect: () => startModule('ANATOMY') }
                  ].map(m => (
                    <MenuCard
                      key={m.id}
                      icon={m.icon}
                      title={m.title}
                      color={m.color}
                      locked={menuLocked || (activeCardLock !== null && activeCardLock !== m.id)}
                      onHoverChange={(h) => handleCardHoverChange(m.id, h)}
                      onSelect={m.onSelect}
                    />
                  ))}
                </div>
              </div>

              {/* ── Sección: Diversión (juegos) ── */}
              <div className="pb-4">
                <SectionHeader icon={<Joystick size={16} />} title={t('section_play', lang)} subtitle={t('section_play_sub', lang)} color="orange" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
                  {[
                    { id: 'PIZARRA', icon: <Palette />, title: t('mod_drawing', lang), color: 'purple', onSelect: () => startModule('PIZARRA') },
                    { id: 'PIANO', icon: <Music />, title: t('mod_piano', lang), color: 'cyan', onSelect: () => startModule('PIANO') },
                    { id: 'PUZZLE', icon: <Puzzle />, title: t('mod_puzzle', lang), color: 'orange', onSelect: () => startModule('PUZZLE') },
                    { id: 'SOLAR', icon: <Compass />, title: t('mod_solar', lang), color: 'cyan', onSelect: () => startModule('SOLAR') },
                    { id: 'BRICKS', icon: <Gamepad2 />, title: t('mod_bricks', lang), color: 'orange', onSelect: () => startModule('BRICKS') }
                  ].map(m => (
                    <MenuCard
                      key={m.id}
                      icon={m.icon}
                      title={m.title}
                      color={m.color}
                      locked={menuLocked || (activeCardLock !== null && activeCardLock !== m.id)}
                      onHoverChange={(h) => handleCardHoverChange(m.id, h)}
                      onSelect={m.onSelect}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Hint de scroll */}
            <div className="shrink-0 mt-3 flex items-center gap-2 text-white/25 text-[9px] font-black uppercase tracking-widest">
              <span>🤏</span>
              <span>{t('hint_scroll', lang)}</span>
              <span>🤏</span>
            </div>
          </motion.div>
        )}

        {/* INTERFAZ DE JUEGO (GAME) */}
        {view === 'GAME' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col z-30">
            <div className="flex-1 relative">
              <GameErrorBoundary gameKey={currentGame} lang={lang} onGoToMenu={goToMenu}>
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{t('label_preparing', lang)}</span>
                    </div>
                  </div>
                }>
                  {currentGame === 'PIZARRA'   && <DrawingModule     addPoints={addPoints} lang={lang} />}
                  {currentGame === 'PIANO'     && <PianoModule       addPoints={addPoints} videoRef={videoRef} lang={lang} />}
                  {currentGame === 'PUZZLE'    && <PuzzleModule      addPoints={addPoints} lang={lang} />}
                  {currentGame === 'SOLAR'     && <SolarModule       addPoints={addPoints} lang={lang} />}
                  {currentGame === 'BRICKS'    && <BricksModule      addPoints={addPoints} lang={lang} />}
                  {currentGame === 'SILABAS'   && <SyllablesModule   addPoints={addPoints} lang={lang} />}
                  {currentGame === 'ECO'       && <EcoGuardianModule addPoints={addPoints} lang={lang} />}
                  {currentGame === 'ABACUS'    && <MathAbacusModule  addPoints={addPoints} lang={lang} />}
                  {currentGame === 'SOLAR_SYS' && <SolarSystemModule addPoints={addPoints} lang={lang} />}
                  {currentGame === 'LAB'       && <LabModule         addPoints={addPoints} lang={lang} />}
                  {currentGame === 'CIRCUITS'  && <CircuitsModule     addPoints={addPoints} lang={lang} />}
                  {currentGame === 'ATOMS'     && <AtomsModule        addPoints={addPoints} lang={lang} />}
                  {currentGame === 'CODING'    && <CodingBlocksModule addPoints={addPoints} lang={lang} />}
                  {currentGame === 'ACCOUNTING'&& <AccountingModule   addPoints={addPoints} lang={lang} />}
                  {currentGame === 'TIMELINE'  && <TimelineModule     addPoints={addPoints} lang={lang} />}
                  {currentGame === 'ANATOMY'   && <AnatomyModule      addPoints={addPoints} lang={lang} />}
                  {currentGame === 'ENGLISH'   && <EnglishModule     addPoints={addPoints} lang={lang} />}
                  {currentGame === 'IRREGULAR_VERBS' && <IrregularVerbsModule addPoints={addPoints} lang={lang} />}
                </Suspense>
              </GameErrorBoundary>
            </div>

            {/* Footer Bar del Juego */}
            <div className="h-16 glass-dark border-t border-white/10 flex items-center justify-between px-8 z-[100] bg-black/50 backdrop-blur-md">
              <div className="flex items-center gap-6">
                <HandButton onClick={goToMenu} className="p-3" variant="red" dwellMs={800}><ArrowLeft size={18} /></HandButton>
                <div className="flex items-center gap-3">
                  <img src={puceLogo} alt="PUCE Logo" className="h-9 w-auto" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 italic">{t('title_hub', lang)}</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{t('label_module', lang)}: {currentGame} ({sessionUser})</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-5 items-center">
                <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 bg-black/20">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{t('label_ai_active', lang)}</span>
                </div>
                {/* Puntos obtenidos en esta partida de este juego */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 rounded-xl border border-amber-500/30">
                  <Trophy size={14} className="text-amber-400" />
                  <span className="text-lg font-display font-black text-amber-400 italic">{scores[currentGame] || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PANTALLA DASHBOARD DE LA PROFESORA */}
        {/* ══ TEACHER CLASSES VIEW ══════════════════════════════════════════════ */}
        {view === 'TEACHER_CLASSES' && (
          <motion.div key="teacher-classes" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 flex flex-col items-center pt-28 pb-8 px-12 overflow-hidden z-30">
            {/* Header */}
            <div className="absolute top-12 left-12 flex items-center gap-8 z-10">
              <HandButton onClick={() => setView('MENU')} className="px-6 py-4 text-sm" variant="red" dwellMs={600}>
                <ArrowLeft size={20} /> {t('btn_back', lang)}
              </HandButton>
              <img src={puceLogo} alt="PUCE Logo" className="h-16 w-auto drop-shadow-2xl" />
            </div>

            <h2 className="shrink-0 text-3xl md:text-4xl font-display font-black mb-6 italic text-gradient uppercase tracking-tighter">
              {lang === 'es' ? 'Mis Clases' : 'My Classes'}
            </h2>

            <div className="w-full max-w-4xl flex flex-col gap-6 overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth: 'thin' }}>

              {/* Formulario crear clase */}
              <div className="p-6 rounded-[32px] border border-purple-500/20 bg-purple-500/5 flex flex-col gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
                  <Plus size={11} className="inline mr-1" />
                  {lang === 'es' ? 'Crear nueva clase' : 'Create new class'}
                </p>
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={e => {
                      const cleanVal = e.target.value
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-zA-Z0-9\s-]/g, '');
                      setNewClassName(cleanVal);
                      setCreateClassError('');
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleCreateClass()}
                    placeholder={lang === 'es' ? 'Nombre de la clase (ej: 3ro B Matematicas)' : 'Class name (e.g., 3rd B Math)'}
                    maxLength={80}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                  <HandButton
                    onClick={handleCreateClass}
                    disabled={isCreatingClass || !newClassName.trim()}
                    className="px-6 py-3 text-xs flex items-center gap-2 shrink-0"
                    variant="purple"
                    dwellMs={700}
                  >
                    {isCreatingClass
                      ? <RefreshCw size={13} className="animate-spin" />
                      : <Plus size={13} />}
                    {lang === 'es' ? 'Crear' : 'Create'}
                  </HandButton>
                </div>
                {createClassError && (
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">{createClassError}</p>
                )}
              </div>

              {/* Listado de clases */}
              <div className="p-6 rounded-[32px] border border-white/10 bg-slate-900 flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
                    {lang === 'es' ? 'Clases activas' : 'Active classes'} ({classesList.length})
                  </span>
                  <HandButton onClick={fetchClasses} className="px-4 py-2 text-[9px] flex items-center gap-2" variant="purple" dwellMs={700}>
                    <RefreshCw size={11} className={isLoadingClasses ? 'animate-spin' : ''} />
                    {lang === 'es' ? 'Actualizar' : 'Refresh'}
                  </HandButton>
                </div>

                {classesError && (
                  <div className="text-red-400 text-[10px] font-bold text-center py-4 uppercase tracking-wider">{classesError}</div>
                )}

                {isLoadingClasses ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  </div>
                ) : classesList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
                    <Users size={40} />
                    <p className="text-xs font-black uppercase tracking-widest">
                      {lang === 'es' ? 'No tienes clases creadas' : 'No classes yet'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {classesList.map(cls => (
                      <div key={cls.class_code} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                        {/* Info */}
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <span className="text-white font-bold text-sm truncate">{cls.class_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-display font-black tracking-[0.25em] text-purple-300 italic">{cls.class_code}</span>
                            <button
                              onClick={() => handleCopyCode(cls.class_code)}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all active:scale-95"
                              title="Copiar código"
                            >
                              {copiedCode === cls.class_code
                                ? <CheckCircle size={12} className="text-green-400" />
                                : <Copy size={12} className="text-white/40" />}
                            </button>
                            <span className="text-[9px] text-white/25 uppercase font-bold tracking-wider">
                              <Users size={9} className="inline mr-1" />
                              {cls.student_count} {lang === 'es' ? 'alumnos' : 'students'}
                            </span>
                          </div>
                          <span className="text-[9px] text-white/20 font-bold">
                            {lang === 'es' ? 'Creada' : 'Created'}: {new Date(cls.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 shrink-0">
                          <HandButton
                            onClick={() => handleDeleteClass(cls.class_code)}
                            disabled={deletingCode === cls.class_code}
                            className="p-3 text-[9px]"
                            variant="red"
                            dwellMs={1200}
                          >
                            {deletingCode === cls.class_code
                              ? <RefreshCw size={13} className="animate-spin" />
                              : <Trash2 size={13} />}
                          </HandButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nota informativa */}
              <div className="p-4 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 text-[10px] text-cyan-300/60 font-bold uppercase tracking-wider leading-relaxed shrink-0">
                <KeyRound size={11} className="inline mr-2" />
                {lang === 'es'
                  ? 'El código de 6 caracteres es el que los alumnos ingresan al registrarse desde la app o la web con conexión a internet.'
                  : 'The 6-character code is what students enter when registering from the app or web with internet access.'}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ TEACHER DASHBOARD VIEW ═══════════════════════════════════════════ */}
        {view === 'TEACHER_DASHBOARD' && (
          <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 flex flex-col items-center pt-28 pb-8 px-12 overflow-hidden z-30">
            {/* Header */}
            <div className="absolute top-12 left-12 flex items-center gap-8 z-10">
              <HandButton onClick={() => setView('MENU')} className="px-6 py-4 text-sm" variant="red" dwellMs={600}>
                <ArrowLeft size={20} /> {t('btn_back', lang)}
              </HandButton>
              <img src={puceLogo} alt="PUCE Logo" className="h-16 w-auto drop-shadow-2xl" />
            </div>

            <h2 className="shrink-0 text-3xl md:text-4xl font-display font-black mb-6 italic text-gradient uppercase tracking-tighter">{t('teacher_title', lang)}</h2>

            {/* Listado de Estudiantes */}
            <div className="w-full max-w-6xl p-8 rounded-[40px] border border-white/15 flex flex-col gap-6 overflow-hidden flex-1 bg-slate-900 shadow-2xl min-h-0">
              <div className="flex justify-between items-center shrink-0 flex-wrap gap-4">
                <span className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">{t('teacher_subtitle', lang)}</span>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedTeacherClassCode}
                    onChange={(e) => setSelectedTeacherClassCode(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500/60 font-bold"
                  >
                    <option value="" className="bg-slate-900 text-white font-bold">
                      {lang === 'es' ? 'Todas las Clases' : 'All Classes'}
                    </option>
                    {classesList.map((cls) => (
                      <option key={cls.class_code} value={cls.class_code} className="bg-slate-900 text-white font-bold">
                        {cls.class_name} ({cls.class_code})
                      </option>
                    ))}
                  </select>
                  <HandButton onClick={() => fetchStudents(selectedTeacherClassCode)} className="px-4 py-2.5 text-[9px] flex items-center gap-2" variant="purple" dwellMs={700}>
                    <RefreshCw size={12} className={isLoadingStudents ? 'animate-spin' : ''} /> {t('teacher_refresh', lang)}
                  </HandButton>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto w-full pr-2" style={{ scrollbarWidth: 'thin' }}>
                {isLoadingStudents ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  </div>
                ) : studentsError ? (
                  <div className="w-full h-full flex items-center justify-center text-red-400 font-bold text-center text-xs uppercase tracking-wider px-4">
                    {studentsError}
                  </div>
                ) : studentsList.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-white/30 font-bold text-center text-xs uppercase tracking-wider">
                    {t('teacher_no_students', lang)}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/15 text-white/50 text-[9px] font-black uppercase tracking-widest bg-white/5">
                        <th className="py-3 px-3">{t('teacher_col_student', lang)}</th>
                        <th className="py-3 px-3 text-center">{t('teacher_col_score', lang)}</th>
                        <th className="py-3 px-2 text-center text-emerald-400 font-extrabold">{lang === 'es' ? 'Inglés 🔤' : 'English 🔤'}</th>
                        <th className="py-3 px-2 text-center text-emerald-400 font-extrabold">{lang === 'es' ? 'Verbos 🗣️' : 'Verbs 🗣️'}</th>
                        <th className="py-3 px-2 text-center text-cyan-400 font-extrabold">{lang === 'es' ? 'Circ. ⚡' : 'Circ. ⚡'}</th>
                        <th className="py-3 px-2 text-center text-cyan-400 font-extrabold">{lang === 'es' ? 'Código 💻' : 'Code 💻'}</th>
                        <th className="py-3 px-2 text-center text-purple-400 font-extrabold">{lang === 'es' ? 'Anat. 🫀' : 'Anat. 🫀'}</th>
                        <th className="py-3 px-2 text-center text-purple-400 font-extrabold">{lang === 'es' ? 'Contab. 📊' : 'Acc. 📊'}</th>
                        <th className="py-3 px-2 text-center text-white/30">{lang === 'es' ? 'Otros 🎮' : 'Others 🎮'}</th>
                        <th className="py-3 px-3 text-center">{lang === 'es' ? 'Último Acceso' : 'Last Access'}</th>
                        <th className="py-3 px-3 text-right">{t('teacher_col_last_played', lang)}</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80 text-[10.5px] font-bold font-sans">
                      {(() => {
                        // Helper inside map block to load scores from history
                        const getScoresByGame = (username) => {
                          try {
                            const history = JSON.parse(localStorage.getItem('learnhands_metrics_history') || '[]');
                            const userHistory = history.filter(h => h.username.toLowerCase() === username.toLowerCase());
                            
                            const gs = { ingles: 0, verbos: 0, circuitos: 0, coding: 0, anatomia: 0, contabilidad: 0, otros: 0 };
                            userHistory.forEach(item => {
                              const gName = (item.game_name || '').toUpperCase();
                              if (gName === 'INGLES') {
                                gs.ingles = Math.max(gs.ingles, item.score || 0);
                              } else if (gName === 'VERBOS' || gName === 'IRREGULAR_VERBS' || gName === 'VERBOS_IRREGULARES') {
                                gs.verbos = Math.max(gs.verbos, item.score || 0);
                              } else if (gName === 'CIRCUITOS') {
                                gs.circuitos = Math.max(gs.circuitos, item.score || 0);
                              } else if (gName === 'CODING') {
                                gs.coding = Math.max(gs.coding, item.score || 0);
                              } else if (gName === 'ANATOMIA') {
                                gs.anatomia = Math.max(gs.anatomia, item.score || 0);
                              } else if (gName === 'CONTABILIDAD') {
                                gs.contabilidad = Math.max(gs.contabilidad, item.score || 0);
                              } else {
                                gs.otros = Math.max(gs.otros, item.score || 0);
                              }
                            });
                            return gs;
                          } catch (e) {
                            return { ingles: 0, verbos: 0, circuitos: 0, coding: 0, anatomia: 0, contabilidad: 0, otros: 0 };
                          }
                        };

                        return studentsList.map((student, idx) => {
                          const scoresByGame = getScoresByGame(student.username);
                          return (
                            <tr key={student.username} className="border-b border-white/5 hover:bg-white/10 bg-slate-900/50 transition-colors">
                              <td className="py-3 px-3 flex flex-col justify-center gap-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-400 font-display italic text-xs">#{idx + 1}</span>
                                  <span className="uppercase tracking-wider truncate max-w-[150px] font-bold text-white">
                                    {student.display_name || student.username}
                                  </span>
                                </div>
                                <span className="text-[9px] text-white/30 tracking-wider font-mono">
                                  {student.username}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center text-amber-400 font-display italic text-xs">
                                {student.total_score || 0} pts
                              </td>
                              <td className="py-3 px-2 text-center text-emerald-400 font-display text-xs bg-emerald-500/5 font-extrabold">
                                {scoresByGame.ingles > 0 ? `${scoresByGame.ingles} pts` : <span className="text-white/10">-</span>}
                              </td>
                              <td className="py-3 px-2 text-center text-emerald-400 font-display text-xs bg-emerald-500/5 font-extrabold">
                                {scoresByGame.verbos > 0 ? `${scoresByGame.verbos} pts` : <span className="text-white/10">-</span>}
                              </td>
                              <td className="py-3 px-2 text-center text-cyan-300 font-display text-xs">
                                {scoresByGame.circuitos > 0 ? `${scoresByGame.circuitos} pts` : <span className="text-white/10">-</span>}
                              </td>
                              <td className="py-3 px-2 text-center text-cyan-300 font-display text-xs">
                                {scoresByGame.coding > 0 ? `${scoresByGame.coding} pts` : <span className="text-white/10">-</span>}
                              </td>
                              <td className="py-3 px-2 text-center text-purple-400 font-display text-xs">
                                {scoresByGame.anatomia > 0 ? `${scoresByGame.anatomia} pts` : <span className="text-white/10">-</span>}
                              </td>
                              <td className="py-3 px-2 text-center text-purple-400 font-display text-xs">
                                {scoresByGame.contabilidad > 0 ? `${scoresByGame.contabilidad} pts` : <span className="text-white/10">-</span>}
                              </td>
                              <td className="py-3 px-2 text-center text-white/30 text-xs">
                                {scoresByGame.otros > 0 ? `${scoresByGame.otros} pts` : <span className="text-white/10">-</span>}
                              </td>
                              <td className="py-3 px-3 text-center text-white/30 text-[9.5px]">
                                {student.last_login_at ? new Date(student.last_login_at).toLocaleDateString() : (
                                  <span className="text-white/15">{lang === 'es' ? 'Sin acceso' : 'No access'}</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right text-white/30 text-[9.5px]">
                                {student.last_played_at ? new Date(student.last_played_at).toLocaleDateString() : (
                                  <span className="text-white/15 italic">{lang === 'es' ? 'Sin partidas' : 'No games yet'}</span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Global de Puntos — sólo visible en HOME y MENU */}
      <div className={`fixed bottom-8 right-8 z-50 pointer-events-none transition-opacity ${view === 'GAME' || view === 'LOGIN' || view === 'TEACHER_DASHBOARD' || view === 'TEACHER_CLASSES' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="glass p-6 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-6 bg-black/40 backdrop-blur-md">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
            <Trophy className="text-amber-400" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">{t('label_level', lang)} {level}</span>
            <span className="text-2xl font-display font-black text-white italic tracking-tighter">{totalScore} <span className="text-[10px] text-white/20 not-italic ml-1">{t('label_pts', lang)}</span></span>
          </div>
        </div>
      </div>

      {/* Barra de Estado de Sincronización — visible abajo a la izquierda en HOME y MENU */}
      {view !== 'GAME' && view !== 'LOGIN' && view !== 'TEACHER_DASHBOARD' && view !== 'TEACHER_CLASSES' && (
        <div className="fixed bottom-8 left-8 z-50 flex items-center gap-3 bg-black/45 border border-white/10 px-5 py-3 rounded-full backdrop-blur-md">
          {isOnline ? (
            <Wifi size={14} className="text-green-400 animate-pulse" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
          
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-white/70">
              {isOnline ? t('sync_status_online', lang) : t('sync_status_offline', lang)}
            </span>
            {pendingSyncCount > 0 && (
              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                {t('sync_status_pending', lang).replace('{count}', pendingSyncCount)}
              </span>
            )}
          </div>

          {isOnline && pendingSyncCount > 0 && (
            <HandButton
              onClick={handleManualSync}
              className={`p-2 rounded-full h-8 w-8 flex items-center justify-center ${isSyncingState ? 'animate-spin' : ''}`}
              variant="purple"
              dwellMs={600}
            >
              <RefreshCw size={12} />
            </HandButton>
          )}
        </div>
      )}

      {/* Onboarding del Hub — renderizado al final para estar por encima del contenido pero el botón COMENZAR lo descarta */}
      {showHubOnboarding && view === 'HOME' && (
        <HubOnboarding lang={lang} onClose={() => setShowHubOnboarding(false)} />
      )}

      {/* MODAL DE SELECTOR DE CLASE PARA ALUMNOS */}
      {showClassSwitcher && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/75 backdrop-blur-md">
          <div className="glass p-10 rounded-[40px] border border-white/10 flex flex-col gap-6 text-center max-w-lg w-full shadow-2xl bg-slate-900/90 max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-xl font-display font-black text-white uppercase italic tracking-wider">
                {lang === 'es' ? 'Mis Clases' : 'My Classes'}
              </h3>
              <HandButton onClick={() => { setShowClassSwitcher(false); setJoinClassError(''); }} className="px-4 py-2 text-[9px]" variant="red" dwellMs={600}>
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </HandButton>
            </div>

            {/* Listado de clases del alumno */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 my-2" style={{ scrollbarWidth: 'thin' }}>
              {studentClasses.length === 0 ? (
                <div className="py-6 text-white/30 text-xs font-bold uppercase tracking-wider">
                  {lang === 'es' ? 'No estás registrado en ninguna clase.' : 'You are not enrolled in any class.'}
                </div>
              ) : (
                studentClasses.map((cls) => {
                  const isActive = cls.class_code === activeStudentClass;
                  return (
                    <div
                      key={cls.class_code}
                      onClick={() => !isActive && handleSwitchActiveClass(cls.class_code)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-white text-xs font-black uppercase tracking-wider truncate">
                          {cls.class_name || (lang === 'es' ? 'Clase' : 'Class')}
                        </span>
                        <span className="text-lg font-display font-black tracking-widest text-purple-300 italic font-mono">
                          {cls.class_code}
                        </span>
                      </div>
                      {isActive ? (
                        <span className="text-[9px] font-black uppercase bg-purple-500 text-white px-3 py-1 rounded-full tracking-widest">
                          {lang === 'es' ? 'Activa' : 'Active'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors">
                          {lang === 'es' ? 'Seleccionar' : 'Select'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulario para unirse a nueva clase */}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3 shrink-0">
              <span className="text-white/40 font-black uppercase tracking-[0.2em] text-[9px] text-left">
                {lang === 'es' ? 'Unirse a una nueva clase' : 'Join a new class'}
              </span>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={joinClassInput}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    setJoinClassInput(cleanVal);
                    setJoinClassError('');
                  }}
                  placeholder={lang === 'es' ? 'Código (ej: N4MK2L)' : 'Code (e.g., N4MK2L)'}
                  maxLength={6}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 font-bold font-mono focus:outline-none focus:border-cyan-500/60 text-center"
                />
                <HandButton
                  onClick={handleJoinClass}
                  disabled={isJoiningClass || !joinClassInput.trim()}
                  className="px-6 py-2.5 text-[10px] shrink-0"
                  variant="cyan"
                  dwellMs={700}
                >
                  {isJoiningClass ? (lang === 'es' ? 'Uniendo...' : 'Joining...') : (lang === 'es' ? 'Unirse' : 'Join')}
                </HandButton>
              </div>
              {joinClassError && (
                <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider text-left">{joinClassError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURACIÓN DE API (GEAR ICON DESDE LOGIN) */}
      {showApiSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/75 backdrop-blur-md">
          <div className="glass p-10 rounded-[40px] border border-white/10 flex flex-col gap-6 text-center max-w-lg w-full shadow-2xl bg-slate-900/90">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-xl font-display font-black text-white uppercase italic tracking-wider">
                {lang === 'es' ? 'Configuración de Servidor' : 'Server Settings'}
              </h3>
              <HandButton onClick={() => setShowApiSettings(false)} className="px-4 py-2 text-[9px]" variant="red" dwellMs={600}>
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </HandButton>
            </div>
            <div className="flex flex-col gap-4 text-left">
              <p className="text-white/45 text-[10px] uppercase font-black tracking-widest leading-relaxed">
                {lang === 'es' 
                  ? 'Configura la URL del backend de LearnHands. Esto determina dónde se sincronizan las métricas y se verifican los alumnos.' 
                  : 'Configure the LearnHands backend URL. This determines where metrics sync and student accounts are verified.'}
              </p>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-purple-400">URL del Servidor API</span>
                <input
                  type="text"
                  value={tempApiUrl}
                  onChange={(e) => setTempApiUrl(e.target.value)}
                  placeholder="https://learnhands.edutecsalpuce.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 font-bold focus:outline-none focus:border-purple-500/60"
                />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <HandButton
                  onClick={() => {
                    setTempApiUrl('https://learnhands.edutecsalpuce.com');
                  }}
                  className="px-5 py-2.5 text-[9px]"
                  variant="default"
                  dwellMs={700}
                >
                  {lang === 'es' ? 'Restablecer' : 'Reset'}
                </HandButton>
                <HandButton
                  onClick={() => {
                    setApiUrl(tempApiUrl.trim());
                    setShowApiSettings(false);
                    window.location.reload();
                  }}
                  className="px-6 py-2.5 text-[9px]"
                  variant="purple"
                  dwellMs={700}
                >
                  {lang === 'es' ? 'Guardar y Reiniciar' : 'Save & Reload'}
                </HandButton>
              </div>
            </div>
          </div>
        </div>
      )}

    </LayeredEngine>
  );
};

const SectionHeader = ({ icon, title, subtitle, color }) => {
  const tint = color === 'emerald' ? 'text-emerald-400' : color === 'orange' ? 'text-orange-400' : 'text-purple-400';
  const line = color === 'emerald' ? 'from-emerald-500/40' : color === 'orange' ? 'from-orange-500/40' : 'from-purple-500/40';
  return (
    <div className="flex items-center gap-4 mb-6 px-2">
      <div className={`flex items-center gap-2 ${tint}`}>
        {icon}
        <span className="font-display text-2xl font-black italic uppercase tracking-tight">{title}</span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{subtitle}</span>
      <div className={`flex-1 h-px bg-gradient-to-r ${line} to-transparent`} />
    </div>
  );
};

const MenuCard = ({ icon, title, color, onSelect, locked, onHoverChange }) => (
  <div className="group relative w-44 md:w-48">
    <div className={`absolute -inset-1.5 bg-gradient-to-br blur-md rounded-[38px] transition-all duration-500 pointer-events-none ${locked ? 'opacity-0' : 'opacity-20 group-hover:opacity-100'} ${
      color === 'purple'  ? 'from-purple-500 to-indigo-500'  :
      color === 'cyan'    ? 'from-cyan-400 to-teal-500'      :
      color === 'orange'  ? 'from-orange-500 to-amber-500'   :
      color === 'emerald' ? 'from-emerald-500 to-teal-600'   :
      'from-purple-500 to-indigo-500'
    }`} />

    <HandButton
      onClick={locked ? undefined : onSelect}
      onHoverChange={onHoverChange}
      className={`w-full aspect-[4/3] rounded-[36px] flex flex-col items-center justify-center gap-4 border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl transition-all ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
      variant={locked ? 'default' : color}
      dwellMs={locked ? 99999 : 900}
    >
      <div className={`p-4 bg-white/10 rounded-2xl ring-1 ring-white/15 transition-transform duration-500 ${locked ? '' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon, { size: 36 })}
      </div>
      <div className="flex flex-col items-center gap-1 w-full px-2">
        <span className="font-display text-base md:text-lg font-black italic tracking-tight uppercase text-white drop-shadow-md text-center leading-tight break-words w-full">{title}</span>
        <div className={`h-1 bg-white/30 rounded-full transition-all duration-500 ${locked ? 'w-6' : 'w-10 group-hover:w-16'}`} />
      </div>
    </HandButton>
  </div>
);

// ── Componente de Onboarding de Slide Deck ────────────────────────────────────
const HubOnboarding = ({ lang, onClose }) => {
  const [slide, setSlide] = useState(0);
  // Control de dwell manual para el botón SIGUIENTE (evita conflicto con HandButton del fondo)
  const [dwellProgress, setDwellProgress] = useState(0);
  const dwellRef = useRef(null);
  const DWELL_MS = 1000; // 1 segundo para SIGUIENTE

  const slides = [
    {
      icon: '🖐️',
      title: lang === 'es' ? '¡Bienvenido a LearnHands!' : 'Welcome to LearnHands!',
      desc: lang === 'es' 
        ? 'Aprende y diviértete usando tus manos y gestos en el aire, sin teclado ni ratón.' 
        : 'Learn and have fun using your hands and gestures in the air, without keyboard or mouse.'
    },
    {
      icon: '⏱️',
      title: lang === 'es' ? 'Hover y Clic Virtual' : 'Hover and Virtual Click',
      desc: lang === 'es'
        ? 'Apunta a un botón con tu mano y mantén el cursor ahí por un momento. Verás un anillo cargándose. ¡Cuando se complete, se activará el botón!'
        : 'Point at a button with your hand and hold the cursor there for a moment. You will see a ring filling up. Once complete, the button triggers!'
    },
    {
      icon: '🤏',
      title: lang === 'es' ? 'Gesto de Pellizco' : 'Pinch Gesture',
      desc: lang === 'es'
        ? 'Une tu dedo pulgar e índice (pellizco 🤏) para agarrar piezas de rompecabezas, mover palabras o lanzar proyectiles.'
        : 'Join your thumb and index finger (pinch 🤏) to grab puzzle pieces, move words, or launch projectiles.'
    },
    {
      icon: '☝️',
      title: lang === 'es' ? 'Dedo Índice' : 'Index Finger',
      desc: lang === 'es'
        ? 'Levanta tu dedo índice ☝️ en el módulo de la Pizarra para pintar libremente en la pantalla como si fuera un pincel mágico.'
        : 'Raise your index finger ☝️ in the Canvas Board module to draw freely on the screen like a magic paintbrush.'
    }
  ];

  const handleNext = () => {
    setDwellProgress(0);
    clearInterval(dwellRef.current);
    if (slide < slides.length - 1) {
      setSlide(s => s + 1);
    } else {
      localStorage.setItem('learnhands_onboarded', 'true');
      onClose();
    }
  };

  // Dwell manual usando la posición del cursor virtual (window.latestHandData)
  // En lugar de HandButton para evitar conflicto con botones del fondo
  const btnRef = useRef(null);
  useEffect(() => {
    let animId;
    let holdStart = null;

    const tick = () => {
      const data = window.latestHandData || {};
      const cursor = data.cursors?.[0];
      if (!cursor?.isVisible || !btnRef.current) {
        holdStart = null;
        setDwellProgress(0);
        animId = requestAnimationFrame(tick);
        return;
      }

      const rect = btnRef.current.getBoundingClientRect();
      const inBtn = cursor.x >= rect.left && cursor.x <= rect.right
                 && cursor.y >= rect.top  && cursor.y <= rect.bottom;

      if (inBtn) {
        if (!holdStart) holdStart = Date.now();
        const elapsed = Date.now() - holdStart;
        const progress = Math.min((elapsed / DWELL_MS) * 100, 100);
        setDwellProgress(progress);
        if (progress >= 100) {
          holdStart = null;
          setDwellProgress(0);
          handleNext();
          animId = requestAnimationFrame(tick);
          return;
        }
      } else {
        holdStart = null;
        setDwellProgress(0);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide]);

  const s = slides[slide];
  const isLast = slide === slides.length - 1;

  return (
    <div className="fixed inset-0 bg-[#03030b]/92 z-[2000] flex items-center justify-center p-8 select-none backdrop-blur-md">
      <motion.div
        key={slide}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        className="glass max-w-md w-full p-12 rounded-[50px] border border-white/10 flex flex-col items-center gap-8 shadow-2xl bg-black/70 relative overflow-hidden"
      >
        {/* Skip siempre disponible */}
        <button
          onClick={() => { localStorage.setItem('learnhands_onboarded', 'true'); onClose(); }}
          className="absolute top-5 right-6 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
        >
          {lang === 'es' ? 'Omitir' : 'Skip'}
        </button>

        {/* Indicadores de slide */}
        <div className="flex gap-2 justify-center">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${idx === slide ? 'w-6 bg-purple-500' : idx < slide ? 'w-2 bg-purple-500/40' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>

        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-xl border border-white/25">
          {s.icon}
        </div>

        <div className="space-y-3 text-center">
          <h3 className="text-2xl font-display font-black tracking-tight text-white uppercase italic">{s.title}</h3>
          <p className="text-white/60 text-xs font-semibold px-2 leading-relaxed">{s.desc}</p>
        </div>

        {/* Botón SIGUIENTE con dwell propio (NO usa HandButton para no interferir) */}
        <div
          ref={btnRef}
          onClick={handleNext}
          className="relative w-full overflow-hidden rounded-2xl cursor-pointer select-none"
          style={{ userSelect: 'none' }}
        >
          {/* Fondo con dwell progress */}
          <div
            className="absolute inset-0 bg-purple-500/30 transition-none"
            style={{ width: `${dwellProgress}%` }}
          />
          <div className={`relative z-10 w-full py-5 rounded-2xl border font-black text-xs tracking-widest uppercase text-center transition-colors ${
            isLast
              ? 'bg-purple-600/80 border-purple-500/50 text-white hover:bg-purple-500'
              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
          }`}>
            {isLast
              ? (lang === 'es' ? '¡ENTENDIDO! ✓' : 'UNDERSTOOD! ✓')
              : (lang === 'es' ? 'SIGUIENTE →' : 'NEXT →')}
          </div>
        </div>

        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 text-center">
          {lang === 'es' ? 'Apunta aquí con tu mano para continuar' : 'Point here with your hand to continue'}
        </p>
      </motion.div>
    </div>
  );
};

// ── Componente de Tutorial Interactivo previo a Juegos ────────────────────────
const GameTutorialOverlay = ({ gameKey, lang, onComplete }) => {
  const holdStartTimeRef = useRef(null);

  const getGestureInfo = () => {
    if (gameKey === 'PIZARRA') {
      return {
        title: lang === 'es' ? 'Dibujo en Pizarra' : 'Board Drawing',
        gesture: lang === 'es' ? 'Dedo índice arriba ☝️' : 'Index finger up ☝️',
        desc: lang === 'es' 
          ? 'Levanta tu dedo índice para pintar en la pizarra. Mantén el gesto para comenzar.' 
          : 'Raise your index finger to paint on the canvas. Hold the gesture to start.',
        check: (g) => g?.isIndexUp
      };
    } else if (gameKey === 'PIANO') {
      return {
        title: lang === 'es' ? 'Piano Táctil' : 'Tactile Piano',
        gesture: lang === 'es' ? 'Mano frente a la cámara 🖐️' : 'Hand in front of camera 🖐️',
        desc: lang === 'es' 
          ? 'Acerca tus dedos a las teclas para tocar las notas. Coloca tu mano frente a la cámara para comenzar.' 
          : 'Move your fingers near the keys to play notes. Show your hand to start.',
        check: (g, c) => c?.isVisible
      };
    } else {
      return {
        title: gameKey.replace('_', ' '),
        gesture: lang === 'es' ? 'Gesto de Pellizco 🤏' : 'Pinch Gesture 🤏',
        desc: lang === 'es' 
          ? 'Une tu dedo pulgar e índice (pellizco 🤏) para agarrar y mover elementos. Mantén el pellizco para comenzar.' 
          : 'Join your thumb and index finger (pinch 🤏) to grab and move elements. Hold the pinch to start.',
        check: (g) => g?.isPinching
      };
    }
  };

  const info = useMemo(() => getGestureInfo(), [gameKey, lang]);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const infoRef = useRef(info);
  infoRef.current = info;
  const langRef = useRef(lang);
  langRef.current = lang;

  // Manage the global overlay active flag
  useEffect(() => {
    window.showGameTutorialActive = true;
    return () => {
      window.showGameTutorialActive = false;
    };
  }, []);

  useEffect(() => {
    let animId;
    const checkLoop = () => {
      const data = window.latestHandData || {};
      const gesture = data.gestures?.[0];
      const cursor = data.cursors?.[0];
      
      const isPerforming = infoRef.current.check(gesture, cursor);
      let progress = 0;
      if (isPerforming) {
        if (!holdStartTimeRef.current) {
          holdStartTimeRef.current = Date.now();
        }
        const elapsed = Date.now() - holdStartTimeRef.current;
        progress = Math.min((elapsed / 1200) * 100, 100);
        if (progress >= 100) {
          onCompleteRef.current();
          return;
        }
      } else {
        holdStartTimeRef.current = null;
      }

      // Direct DOM updates to avoid React re-renders at 60 FPS
      const bar = document.getElementById('tutorial-progress-bar');
      const textEl = document.getElementById('tutorial-progress-text');
      if (bar) {
        bar.style.width = `${progress}%`;
      }
      if (textEl) {
        textEl.textContent = progress > 0 
          ? (langRef.current === 'es' ? '¡Mantén el gesto! ...' : 'Hold the gesture! ...') 
          : (langRef.current === 'es' ? 'Esperando detección...' : 'Waiting for detection...');
      }

      animId = requestAnimationFrame(checkLoop);
    };

    animId = requestAnimationFrame(checkLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#050515] via-[#02020a] to-[#010105] z-[999] flex flex-col items-center justify-center p-10 text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass max-w-lg w-full p-12 rounded-[50px] border border-white/10 flex flex-col items-center gap-8 shadow-2xl bg-black/60"
      >
        <div className="text-sm font-black text-purple-400 uppercase tracking-[0.2em]">{info.title}</div>
        <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tight">{lang === 'es' ? 'Preparación Gestual' : 'Gesture Preparation'}</h2>
        
        <div className="w-24 h-24 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-5xl animate-pulse">
          {gameKey === 'PIZARRA' ? '☝️' : gameKey === 'PIANO' ? '🎹' : '🤏'}
        </div>

        <div className="space-y-3">
          <p className="text-white font-bold text-lg uppercase tracking-wide">{lang === 'es' ? 'Realiza este gesto para entrar:' : 'Perform this gesture to enter:'}</p>
          <div className="text-gradient font-display text-2xl font-black italic uppercase tracking-tight">{info.gesture}</div>
          <p className="text-white/40 text-xs font-medium px-4 leading-relaxed">{info.desc}</p>
        </div>

        <div className="w-full h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden mt-2 relative">
          <div
            id="tutorial-progress-bar"
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: '0%' }}
          />
        </div>
        
        <div id="tutorial-progress-text" className="text-[10px] font-black uppercase tracking-widest text-white/30 animate-pulse">
          {lang === 'es' ? 'Esperando detección...' : 'Waiting for detection...'}
        </div>
      </motion.div>
    </div>
  );
};

export default SystemHub;
