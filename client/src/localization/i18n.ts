/**
 * Localization configuration using i18n-js.
 * Supports English (en) and Spanish (es).
 * Add more languages by adding new translation files.
 */

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

// ─── Translation dictionaries ─────────────────────────────────────────────────

const translations = {
  en: {
    // Auth
    auth: {
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      phone: 'Phone Number',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      resetPassword: 'Reset Password',
      resetSent: 'Password reset link sent to your email.',
      loginError: 'Invalid email or password.',
      signupError: 'Failed to create account. Please try again.',
    },

    // Navigation / Tabs
    nav: {
      home: 'Home',
      appointments: 'Appointments',
      profile: 'Profile',
      settings: 'Settings',
      back: 'Back',
    },

    // Home
    home: {
      welcome: 'Welcome back,',
      tagline: 'How can we help you today?',
      emergency: 'Emergency',
      consultation: 'Consultation',
      emergencyDesc: 'Get immediate help or call EMS',
      consultationDesc: 'Consult with a doctor online',
      findDoctors: 'Find Doctors',
      symptomCheck: 'Symptom Check',
      upcomingAppointments: 'Upcoming Appointments',
      noAppointments: 'No upcoming appointments',
      bookNow: 'Book Now',
    },

    // Doctors
    doctors: {
      title: 'Find a Doctor',
      search: 'Search doctors or specialty…',
      filter: 'Filter',
      sort: 'Sort',
      noResults: 'No doctors found',
      yearsExp: 'yrs exp.',
      reviews: 'reviews',
      available: 'Available Now',
      bookAppointment: 'Book Appointment',
      startChat: 'Start Chat',
      videoConsult: 'Video Consult',
      about: 'About',
      qualifications: 'Qualifications',
      languages: 'Languages Spoken',
      consultationFee: 'Consultation Fee',
      selectSlot: 'Select a Time Slot',
    },

    // Appointments
    appointments: {
      title: 'Appointments',
      upcoming: 'Upcoming',
      past: 'Past',
      cancelled: 'Cancelled',
      status: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        inProgress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      joinCall: 'Join Call',
      cancel: 'Cancel Appointment',
      reschedule: 'Reschedule',
      noUpcoming: 'No upcoming appointments',
      noPast: 'No past appointments',
    },

    // Booking
    booking: {
      title: 'Book Appointment',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
      consultationType: 'Consultation Type',
      symptoms: 'Describe your symptoms (optional)',
      notes: 'Additional notes',
      confirm: 'Confirm Booking',
      success: 'Appointment booked successfully!',
      failed: 'Failed to book appointment. Please try again.',
    },

    // Triage / Chat
    triage: {
      title: 'Symptom Check',
      subtitle: 'Tell us how you are feeling',
      startChat: 'Start Assessment',
      placeholder: 'Describe your symptoms…',
      send: 'Send',
      result: 'Assessment Result',
      severity: {
        low: 'Low – Self-care recommended',
        moderate: 'Moderate – Consult a doctor soon',
        high: 'High – See a doctor today',
        critical: 'Critical – Call emergency services now',
      },
    },

    // Emergency
    emergency: {
      title: 'Emergency Services',
      call: 'Call',
      nearest: 'Nearest Services',
      callAmbulance: 'Call Ambulance',
      callPoison: 'Poison Control',
      callEmergency: 'Emergency – 911',
      locating: 'Locating nearest services…',
    },

    // Profile
    profile: {
      title: 'My Profile',
      editProfile: 'Edit Profile',
      medicalHistory: 'Medical History',
      allergies: 'Allergies',
      bloodGroup: 'Blood Group',
      emergencyContact: 'Emergency Contact',
      settings: 'Settings',
    },

    // Settings
    settings: {
      title: 'Settings',
      language: 'Language',
      notifications: 'Notifications',
      darkMode: 'Dark Mode',
      location: 'Location Access',
      biometric: 'Biometric Login',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      version: 'App Version',
      logout: 'Logout',
    },

    // Common
    common: {
      loading: 'Loading…',
      error: 'Something went wrong',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      submit: 'Submit',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      next: 'Next',
      previous: 'Previous',
      done: 'Done',
      km: 'km away',
      rating: 'Rating',
      fee: 'Fee',
    },
  },

  // ─── Spanish translations ──────────────────────────────────────────────────
  es: {
    auth: {
      login: 'Iniciar sesión',
      signup: 'Registrarse',
      logout: 'Cerrar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      fullName: 'Nombre completo',
      phone: 'Número de teléfono',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?',
      resetPassword: 'Restablecer contraseña',
      resetSent: 'Enlace de restablecimiento enviado a tu correo.',
      loginError: 'Correo o contraseña inválidos.',
      signupError: 'Error al crear la cuenta. Inténtalo de nuevo.',
    },
    nav: {
      home: 'Inicio',
      appointments: 'Citas',
      profile: 'Perfil',
      settings: 'Ajustes',
      back: 'Volver',
    },
    home: {
      welcome: 'Bienvenido,',
      tagline: '¿Cómo podemos ayudarte hoy?',
      emergency: 'Emergencia',
      consultation: 'Consulta',
      emergencyDesc: 'Obtén ayuda inmediata o llama al SEM',
      consultationDesc: 'Consulta con un médico en línea',
      findDoctors: 'Buscar Médicos',
      symptomCheck: 'Verificar Síntomas',
      upcomingAppointments: 'Próximas Citas',
      noAppointments: 'No hay citas próximas',
      bookNow: 'Reservar ahora',
    },
    doctors: {
      title: 'Buscar un Médico',
      search: 'Buscar médicos o especialidad…',
      filter: 'Filtrar',
      sort: 'Ordenar',
      noResults: 'No se encontraron médicos',
      yearsExp: 'años exp.',
      reviews: 'reseñas',
      available: 'Disponible ahora',
      bookAppointment: 'Reservar cita',
      startChat: 'Iniciar chat',
      videoConsult: 'Videoconsulta',
      about: 'Acerca de',
      qualifications: 'Calificaciones',
      languages: 'Idiomas',
      consultationFee: 'Tarifa de consulta',
      selectSlot: 'Seleccionar horario',
    },
    appointments: {
      title: 'Citas',
      upcoming: 'Próximas',
      past: 'Pasadas',
      cancelled: 'Canceladas',
      status: {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        inProgress: 'En curso',
        completed: 'Completada',
        cancelled: 'Cancelada',
      },
      joinCall: 'Unirse a la llamada',
      cancel: 'Cancelar cita',
      reschedule: 'Reprogramar',
      noUpcoming: 'No hay citas próximas',
      noPast: 'No hay citas pasadas',
    },
    booking: {
      title: 'Reservar cita',
      selectDate: 'Seleccionar fecha',
      selectTime: 'Seleccionar hora',
      consultationType: 'Tipo de consulta',
      symptoms: 'Describe tus síntomas (opcional)',
      notes: 'Notas adicionales',
      confirm: 'Confirmar reserva',
      success: '¡Cita reservada con éxito!',
      failed: 'Error al reservar. Inténtalo de nuevo.',
    },
    triage: {
      title: 'Verificación de síntomas',
      subtitle: 'Cuéntanos cómo te sientes',
      startChat: 'Iniciar evaluación',
      placeholder: 'Describe tus síntomas…',
      send: 'Enviar',
      result: 'Resultado de la evaluación',
      severity: {
        low: 'Bajo – Autocuidado recomendado',
        moderate: 'Moderado – Consulta a un médico pronto',
        high: 'Alto – Ve a un médico hoy',
        critical: 'Crítico – Llama a servicios de emergencia',
      },
    },
    emergency: {
      title: 'Servicios de emergencia',
      call: 'Llamar',
      nearest: 'Servicios más cercanos',
      callAmbulance: 'Llamar ambulancia',
      callPoison: 'Control de intoxicaciones',
      callEmergency: 'Emergencia – 911',
      locating: 'Localizando servicios cercanos…',
    },
    profile: {
      title: 'Mi Perfil',
      editProfile: 'Editar perfil',
      medicalHistory: 'Historial médico',
      allergies: 'Alergias',
      bloodGroup: 'Grupo sanguíneo',
      emergencyContact: 'Contacto de emergencia',
      settings: 'Ajustes',
    },
    settings: {
      title: 'Ajustes',
      language: 'Idioma',
      notifications: 'Notificaciones',
      darkMode: 'Modo oscuro',
      location: 'Acceso a ubicación',
      biometric: 'Inicio biométrico',
      privacy: 'Política de privacidad',
      terms: 'Términos de servicio',
      version: 'Versión de la app',
      logout: 'Cerrar sesión',
    },
    common: {
      loading: 'Cargando…',
      error: 'Algo salió mal',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      save: 'Guardar',
      submit: 'Enviar',
      confirm: 'Confirmar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      next: 'Siguiente',
      previous: 'Anterior',
      done: 'Hecho',
      km: 'km de distancia',
      rating: 'Valoración',
      fee: 'Tarifa',
    },
  },
};

// ─── i18n instance setup ──────────────────────────────────────────────────────

const i18n = new I18n(translations);

// Use the device locale, falling back to English
i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'en';

// Fallback to English if a key is missing in the selected locale
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export { i18n };

/** Supported locales */
export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];
