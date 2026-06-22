const LANG_KEY = 'learnhands_language';

const translations = {
  es: {
    // UI General
    title_hub: 'LearnHands Hub',
    subtitle_hub: 'Plataforma Educativa de Movimiento Natural',
    btn_start: 'COMENZAR',
    btn_exit: 'Salir',
    btn_back: 'Volver',
    btn_change_user: 'Cambiar de Alumno',
    label_level: 'Nivel',
    label_pts: 'PTS',
    label_points: 'PUNTOS',
    label_preparing: 'Preparando…',
    label_ai_active: 'IA Activa',
    label_module: 'Módulo',
    hint_scroll: 'Pellizca índice + pulgar y arrastra para desplazar',
    
    // Categorías del Menú
    section_learn: 'Aprende',
    section_learn_sub: 'Módulos educativos',
    section_play: 'Diversión',
    section_play_sub: 'Juegos interactivos',
    
    // Títulos de Módulos (Menu)
    mod_lab: 'Laboratorio',
    mod_solar_sys: 'Sistema Solar',
    mod_syllables: 'Sílabas',
    mod_english: 'English',
    mod_abacus: 'Ábaco',
    mod_eco: 'Reciclaje',
    mod_circuits: 'Circuitos',
    mod_atoms: 'Átomos',
    mod_coding: 'Programación',
    mod_accounting: 'Contabilidad',
    mod_timeline: 'Historia',
    mod_anatomy: 'Anatomía',
    mod_drawing: 'Pizarra',
    mod_piano: 'Piano',
    mod_puzzle: 'Puzzle',
    mod_solar: 'Constelación',
    mod_bricks: 'Balls Crush',

    // Pantalla de Registro / Login Inicial
    login_title: '¡Hola! ¿Cómo te llamas?',
    login_placeholder: 'Escribe tu nombre aquí...',
    login_btn_enter: 'ENTRAR A JUGAR',
    login_required: 'Por favor, ingresa tu nombre para poder jugar y guardar tus puntos.',
    login_invalid_name: 'Por favor, ingresa un nombre válido (letras y espacios, 3-25 letras).',
    login_teacher_toggle: 'Acceso Docente',
    login_student_toggle: 'Acceso Estudiante',
    login_password_placeholder: 'Escribe la contraseña...',
    login_password_required: 'Por favor, ingresa la contraseña.',
    login_incorrect_password: 'Contraseña incorrecta.',
    login_use_teacher_login: 'El usuario docente debe ingresar por el Acceso Docente.',
    login_teacher_title: 'Acceso Docente (KathePastaz)',
    login_teacher_username_invalid: 'Solo el usuario KathePastaz tiene rol de profesora.',

    // Estado de Sincronización
    sync_status_online: 'Conectado · Sincronizado',
    sync_status_offline: 'Modo Offline · Local',
    sync_status_pending: 'Sincronizando {count} partida(s)...',
    sync_status_error: 'Error de conexión',

    // Mensajes comunes dentro de juegos
    game_win: '¡Felicidades!',
    game_gameover: 'Fin de la Partida',
    game_try_again: 'Volver a intentar',

    // Adiciones de la Profesora e Irregular Verbs
    mod_verbs: 'Verbos Irregulares',
    teacher_dashboard: 'Panel de la Profesora',
    teacher_subtitle: 'Control y puntajes de alumnos',
    teacher_col_student: 'Estudiante',
    teacher_col_score: 'Puntuación Total',
    teacher_col_last_played: 'Última Partida',
    teacher_title: 'Dashboard de la Profesora KathePastaz',
    teacher_no_students: 'No se encontraron alumnos registrados en el sistema.',
    teacher_refresh: 'Actualizar Lista'
  },
  en: {
    // UI General
    title_hub: 'LearnHands Hub',
    subtitle_hub: 'Natural Movement Educational Platform',
    btn_start: 'START',
    btn_exit: 'Exit',
    btn_back: 'Back',
    btn_change_user: 'Change Student',
    label_level: 'Level',
    label_pts: 'PTS',
    label_points: 'POINTS',
    label_preparing: 'Preparing…',
    label_ai_active: 'AI Active',
    label_module: 'Module',
    hint_scroll: 'Pinch index + thumb and drag to scroll',
    
    // Categorías del Menú
    section_learn: 'Learn',
    section_learn_sub: 'Educational modules',
    section_play: 'Play',
    section_play_sub: 'Interactive games',
    
    // Títulos de Módulos (Menu)
    mod_lab: 'Laboratory',
    mod_solar_sys: 'Solar System',
    mod_syllables: 'Syllables',
    mod_english: 'English',
    mod_abacus: 'Abacus',
    mod_eco: 'Recycling',
    mod_circuits: 'Circuits',
    mod_atoms: 'Atoms',
    mod_coding: 'Coding',
    mod_accounting: 'Accounting',
    mod_timeline: 'History',
    mod_anatomy: 'Anatomy',
    mod_drawing: 'Drawing',
    mod_piano: 'Piano',
    mod_puzzle: 'Puzzle',
    mod_solar: 'Constellation',
    mod_bricks: 'Balls Crush',

    // Pantalla de Registro / Login Inicial
    login_title: 'Hello! What is your name?',
    login_placeholder: 'Type your name here...',
    login_btn_enter: 'ENTER TO PLAY',
    login_required: 'Please enter your name to play and save your points.',
    login_invalid_name: 'Please enter a valid name (letters and spaces, 3-25 letters).',
    login_teacher_toggle: 'Teacher Access',
    login_student_toggle: 'Student Access',
    login_password_placeholder: 'Type password...',
    login_password_required: 'Please enter the password.',
    login_incorrect_password: 'Incorrect password.',
    login_use_teacher_login: 'Teacher username must use Teacher Access.',
    login_teacher_title: 'Teacher Access (KathePastaz)',
    login_teacher_username_invalid: 'Only KathePastaz has teacher access.',

    // Estado de Sincronización
    sync_status_online: 'Connected · Synced',
    sync_status_offline: 'Offline Mode · Local',
    sync_status_pending: 'Syncing {count} game(s)...',
    sync_status_error: 'Connection error',

    // Mensajes comunes dentro de juegos
    game_win: 'Congratulations!',
    game_gameover: 'Game Over',
    game_try_again: 'Try Again',

    // Adiciones de la Profesora e Irregular Verbs
    mod_verbs: 'Irregular Verbs',
    teacher_dashboard: 'Teacher Dashboard',
    teacher_subtitle: 'Student scores and control',
    teacher_col_student: 'Student',
    teacher_col_score: 'Total Score',
    teacher_col_last_played: 'Last Played',
    teacher_title: 'KathePastaz Teacher Dashboard',
    teacher_no_students: 'No registered students found in the system.',
    teacher_refresh: 'Refresh List'
  }
};

export function getLanguage() {
  return localStorage.getItem(LANG_KEY) || 'es';
}

export function setLanguage(lang) {
  if (lang === 'es' || lang === 'en') {
    localStorage.setItem(LANG_KEY, lang);
  }
  return lang;
}

export function t(key, lang) {
  const activeLang = lang || getLanguage();
  const dict = translations[activeLang] || translations['es'];
  return dict[key] || key;
}

export default {
  getLanguage,
  setLanguage,
  t
};
