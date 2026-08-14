import { FREE_TOOL_COUNT, FORMULA_COUNT } from './catalog-stats';

/**
 * French overlay for the shared UI dictionary. The language store merges this
 * over the English dictionary so future keys retain an explicit English
 * fallback instead of rendering undefined text.
 */
export const frenchUiStrings = {
  // App identity
  appName: 'Formula Atlas',
  appSubtitle: 'Votre plateforme agronomique propulsée par l’IA',
  appTagline: `${FORMULA_COUNT} formules · ${FREE_TOOL_COUNT} outils gratuits · 10 spécialistes IA · 1 plateforme gratuite`,

  // Top-level navigation tabs
  tabHome: 'Accueil',
  tabFormulas: 'Formules',
  tabTools: 'Outils',
  tabFarm: 'Ferme',
  tabInsights: 'Analyses',
  tabAbout: 'À propos',

  // Header actions
  takeTour: 'Visite guidée',
  installApp: 'Installer l’application',
  installed: 'Installée',
  openLanding: 'Page d’accueil',
  aboutLink: 'À propos',
  browse: 'Parcourir',

  // Command palette / search
  searchPlaceholder: 'Rechercher par nom, code, formule ou mot-clé… (appuyez sur /)',
  searchTitle: 'Recherche',
  searchPrompt: 'Saisissez une commande ou recherchez…',
  searchNoResults: 'Aucun résultat',
  searchHint: 'Astuce : appuyez sur / pour rechercher, ⌘K pour ouvrir la palette',

  // Formulas tab
  allFormulas: 'Toutes les formules',
  sections: 'Sections',
  formulas: 'Formules',
  interactiveCalculators: 'Calculateurs interactifs',
  ofFormulas: 'sur',
  partLabel: 'Partie',
  sectionLabel: 'Section',
  calculatorOnly: 'Avec calculateur uniquement',
  clear: 'Effacer',
  clearFilters: 'Effacer les filtres',
  noFormulasMatch: 'Aucune formule correspondante',
  noFormulasMatchDesc: 'Supprimez certains filtres ou essayez une autre recherche.',
  bookmarkedFormulas: 'Formules enregistrées',

  // Farm tab
  farmManagement: 'Gestion de la ferme',
  farmManagementSubtitle: 'Parcelles · Cultures · Sol · Élevage · Irrigation · Protection',
  fieldsAndCrops: 'Parcelles et cultures',
  plantProtection: 'Protection des cultures',
  soilAndLivestock: 'Sol et élevage',
  irrigation: 'Irrigation',

  // Insights tab
  intelligenceAndInsights: 'Intelligence et analyses',
  intelligenceAndInsightsSubtitle: 'Satellite · Météo · IA · Finance · Marché · Communauté',
  intelligenceAndAI: 'Intelligence et IA',
  businessAndMarketplace: 'Entreprise et marché',
  communityAndReports: 'Communauté et rapports',
  settingsAndIntegrations: 'Paramètres et intégrations',

  // Tools tab
  guidedWorkflows: 'Parcours guidés',
  guidedWorkflowsDesc: 'Des calculateurs étape par étape pour les tâches agricoles courantes. Choisissez un objectif et avancez.',

  // Common actions / buttons
  close: 'Fermer',
  cancel: 'Annuler',
  save: 'Enregistrer',
  saved: 'Enregistré',
  delete: 'Supprimer',
  edit: 'Modifier',
  add: 'Ajouter',
  remove: 'Retirer',
  reset: 'Réinitialiser',
  export: 'Exporter',
  exportPDF: 'Exporter en PDF',
  exportCSV: 'Exporter en CSV',
  exportJSON: 'Exporter en JSON',
  print: 'Imprimer',
  copy: 'Copier',
  copied: 'Copié',
  share: 'Partager',
  calculate: 'Calculer',
  result: 'Résultat',
  results: 'Résultats',
  loading: 'Chargement…',
  retry: 'Réessayer',
  next: 'Suivant',
  previous: 'Précédent',
  finish: 'Terminer',
  skip: 'Passer',
  back: 'Retour',
  confirm: 'Confirmer',
  apply: 'Appliquer',
  select: 'Sélectionner',
  selectAll: 'Tout sélectionner',
  deselectAll: 'Tout désélectionner',
  expand: 'Développer',
  collapse: 'Réduire',
  showMore: 'Afficher plus',
  showLess: 'Afficher moins',

  // Stats / counters
  statsFormulas: 'Formules',
  statsTools: 'Outils',
  statsAgents: 'Spécialistes IA',
  statsCrops: 'Cultures',
  statsParts: 'Parties',
  statsSections: 'Sections',

  // Footer
  footerVersion: 'Version',
  footerFormulas: 'formules',
  footerParts: 'parties',
  footerSections: 'sections',

  // Achievements / gamification
  achievements: 'Réalisations et classement',
  achievementsDesc: 'Badges · Niveaux · Points · Classement mondial · Suivi de progression',

  // Onboarding / tour
  onboardingWelcome: 'Bienvenue dans Formula Atlas',
  onboardingSkip: 'Passer la visite',
  onboardingNext: 'Suivant',
  onboardingDone: 'Commencer',

  // Units
  kgPerHa: 'kg/ha',
  tPerHa: 't/ha',
  m3PerHa: 'm³/ha',
  mmPerDay: 'mm/jour',
  literPerHa: 'L/ha',
  days: 'jours',
  weeks: 'semaines',
  months: 'mois',
  hectares: 'hectares',
  acres: 'acres',

  // Theme toggle
  themeLight: 'Clair',
  themeDark: 'Sombre',
  themeSystem: 'Système',

  // Language toggle tooltip
  switchLanguage: 'Changer de langue',
  switchToArabic: 'Passer à l’arabe',
  switchToFrench: 'Passer au français',
  switchToEnglish: 'Passer à l’anglais',

  // Empty states
  emptyStateTitle: 'Rien ici pour le moment',
  emptyStateSubtitle: 'Commencez par ajouter des données ou lancer un calcul.',
  emptyStateAction: 'Commencer',

  // Errors
  errorGeneric: 'Une erreur est survenue',
  errorRetry: 'Veuillez réessayer.',
  errorNetwork: 'Erreur réseau. Vérifiez votre connexion.',
  errorNotFound: 'Introuvable',

  // Bookmarks
  bookmarkAdded: 'Ajouté aux favoris',
  bookmarkRemoved: 'Retiré des favoris',
  bookmarkEmpty: 'Aucun favori pour le moment — appuyez sur ⭐ sur une formule pour l’épingler ici.',

  // Formula dialog
  formulaPurpose: 'Objectif',
  formulaVariables: 'Variables',
  formulaExample: 'Exemple',
  formulaPitfall: 'Piège courant',
  formulaSource: 'Source',
  formulaReference: 'Référence',
  openCalculator: 'Ouvrir le calculateur',
  addToBookmarks: 'Ajouter aux favoris',
  removeFromBookmarks: 'Retirer des favoris',
  compare: 'Comparer',
  relatedFormulas: 'Formules associées',
} as const;
