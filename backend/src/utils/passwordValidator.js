/**
 * Validation de mot de passe - Niveau BANCAIRE
 *
 * Exigences:
 * - Minimum 12 caractères
 * - Au moins 1 majuscule
 * - Au moins 1 minuscule
 * - Au moins 1 chiffre
 * - Au moins 1 caractère spécial
 * - Pas de mots de passe communs (liste OWASP)
 */

// Liste des 100 mots de passe les plus communs (source: OWASP)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', '12345678', '12345', '1234567', 'password1',
  '123123', '1234567890', '000000', 'abc123', '111111', '123321', 'qwerty',
  'monkey', 'dragon', 'master', 'login', 'welcome', 'admin', 'password123',
  'letmein', 'solo', 'sunshine', 'princess', 'qwerty123', 'passw0rd',
  'football', 'shadow', 'michael', 'jennifer', 'superman', 'batman',
  'starwars', 'freedom', 'whatever', 'trustno1', 'jordan', '12341234'
];

/**
 * Valide la force d'un mot de passe
 * @param {string} password - Le mot de passe à valider
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validatePassword(password) {
  const errors = [];

  // Vérifier la longueur minimale
  if (!password || password.length < 12) {
    errors.push('Le mot de passe doit contenir au moins 12 caractères');
  }

  // Vérifier la longueur maximale (prévenir DoS sur bcrypt)
  if (password && password.length > 128) {
    errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
  }

  // Vérifier la présence d'une majuscule
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }

  // Vérifier la présence d'une minuscule
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }

  // Vérifier la présence d'un chiffre
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  // Vérifier la présence d'un caractère spécial
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)');
  }

  // Vérifier contre les mots de passe communs
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Ce mot de passe est trop commun. Veuillez en choisir un plus sécurisé');
  }

  // Vérifier les patterns faibles (ex: 12 caractères identiques)
  if (/(.)\1{11,}/.test(password)) {
    errors.push('Le mot de passe ne peut pas contenir plus de 11 caractères identiques consécutifs');
  }

  // Vérifier les séquences évidentes (abc, 123, etc.)
  const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiopasdfghjklzxcvbnm'];
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const subseq = seq.substring(i, i + 4);
      if (password.toLowerCase().includes(subseq)) {
        errors.push('Le mot de passe ne doit pas contenir de séquences évidentes (abc, 123, qwerty...)');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Génère un mot de passe fort aléatoire
 * Utile pour les mots de passe temporaires
 * @param {number} length - Longueur du mot de passe (minimum 12)
 * @returns {string} - Mot de passe généré
 */
export function generateStrongPassword(length = 16) {
  const minLength = Math.max(12, length);
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;

  let password = '';

  // Garantir au moins un de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Remplir le reste aléatoirement
  for (let i = 4; i < minLength; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Calcule le score de force d'un mot de passe (0-100)
 * @param {string} password - Le mot de passe à évaluer
 * @returns {number} - Score de 0 à 100
 */
export function calculatePasswordStrength(password) {
  if (!password) return 0;

  let score = 0;

  // Longueur
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 10;

  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 5;

  // Diversité des caractères
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password)) score += 15;

  // Complexité
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 10) score += 10;
  if (uniqueChars >= 15) score += 10;

  // Pénalités
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) score -= 50;
  if (/(.)\1{3,}/.test(password)) score -= 10; // Répétitions

  return Math.max(0, Math.min(100, score));
}
