import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "fr" | "en";

const copy = {
  dashboard: { fr: "Tableau de bord", en: "Dashboard" },
  signOut: { fr: "Déconnexion", en: "Sign out" },
  signIn: { fr: "Connexion", en: "Sign in" },
  joinFree: { fr: "S’inscrire gratuitement", en: "Join free" },
  freeRemote: { fr: "Travail à distance · 100 % gratuit", en: "Remote work · 100% free" },
  heroTitle: { fr: "Travaillez depuis l’Afrique. Recevez vos gains sur votre mobile money.", en: "Work from anywhere in Africa. Get paid to your mobile money." },
  heroCopy: { fr: "Rejoignez PayPoint gratuitement, choisissez un domaine, réalisez des missions simples et retirez vos gains par MTN Mobile Money ou Orange Money chaque samedi.", en: "Join PayPoint for free, apply to a work domain, complete simple tasks and withdraw to MTN Mobile Money or Orange Money every Saturday." },
  createFree: { fr: "Créer un compte gratuit", en: "Create free account" },
  haveAccount: { fr: "J’ai déjà un compte", en: "I have an account" },
  chooseDomain: { fr: "Choisissez votre domaine d’activité", en: "Choose your work domain" },
  signupStep: { fr: "Inscription", en: "Sign up" },
  signupStepDesc: { fr: "Un nom d’utilisateur et un mot de passe suffisent.", en: "Just a username and password." },
  applyStep: { fr: "Candidature", en: "Apply" },
  applyStepDesc: { fr: "Choisissez vos domaines et envoyez votre candidature.", en: "Pick your domains and submit your application." },
  tasksStep: { fr: "Missions", en: "Complete tasks" },
  tasksStepDesc: { fr: "Votre solde augmente après chaque mission terminée.", en: "Your balance grows after each completed task." },
  withdrawStep: { fr: "Retrait", en: "Withdraw" },
  withdrawStepDesc: { fr: "Chaque samedi de 10 h à 15 h par MTN ou Orange Money.", en: "Saturdays 10:00–15:00 to MTN or Orange Money." },
  footer: { fr: "Une branche d’une entreprise européenne · Aucun frais, jamais.", en: "A branch of a European company · No fees, ever." },
  username: { fr: "Nom d’utilisateur", en: "Username" },
  password: { fr: "Mot de passe", en: "Password" },
  repeatPassword: { fr: "Répéter le mot de passe", en: "Repeat password" },
  passwordsMismatch: { fr: "Les mots de passe ne correspondent pas", en: "Passwords do not match" },
  createAccount: { fr: "Créer un compte", en: "Create account" },
  signupFree: { fr: "S’inscrire — gratuit", en: "Sign up — free" },
  alreadyAccount: { fr: "Vous avez déjà un compte ?", en: "Have an account?" },
  newHere: { fr: "Nouveau sur PayPoint ?", en: "New to PayPoint?" },
  jobApplication: { fr: "Candidature", en: "Job application" },
  noPayment: { fr: "Gratuit — aucun paiement demandé.", en: "Free — no payment required." },
  fullName: { fr: "Nom complet", en: "Full name" },
  phone: { fr: "Téléphone (ex. 237670000000)", en: "Phone (e.g. 237670000000)" },
  motivation: { fr: "Pourquoi souhaitez-vous nous rejoindre ? (facultatif)", en: "Why do you want to join? (optional)" },
  submitApplication: { fr: "Envoyer ma candidature", en: "Submit application" },
  pleaseSignIn: { fr: "Veuillez vous connecter d’abord.", en: "Please sign in first." },
  welcome: { fr: "Bienvenue", en: "Welcome" },
  applyUnlock: { fr: "Candidatez à un domaine pour accéder à vos missions.", en: "Apply to a work domain to unlock your tasks." },
  applyNow: { fr: "Candidater maintenant", en: "Apply now" },
  reviewTitle: { fr: "Candidature en cours d’examen", en: "Application under review" },
  reviewCopy: { fr: "Merci. Nous examinerons votre candidature prochainement.", en: "Thank you. We’ll review your application shortly." },
  demoApprove: { fr: "Démo : accepter ma candidature", en: "Demo: approve my application" },
  balance: { fr: "Solde", en: "Balance" },
  totalEarned: { fr: "Total gagné", en: "Total earned" },
  tasksCompleted: { fr: "Missions terminées", en: "Tasks completed" },
  wallet: { fr: "Portefeuille et retrait", en: "Wallet & withdraw" },
  playing: { fr: "Lecture", en: "Playing" },
  videoFinished: { fr: "Vidéo terminée", en: "Video finished" },
  completedReward: { fr: "Terminée — récompense ajoutée", en: "Completed — reward added" },
  watchVideo: { fr: "Regarder la vidéo", en: "Watch video" },
  startTask: { fr: "Commencer la mission", en: "Start task" },
  keepWatching: { fr: "Continuez à regarder", en: "Keep watching" },
  performing: { fr: "Mission en cours", en: "Performing task" },
  likeClaim: { fr: "♥ Aimer et recevoir", en: "♥ Like & claim" },
  confirmCompleted: { fr: "Confirmer la mission", en: "Confirm completed" },
  withdraw: { fr: "Retirer mes gains", en: "Withdraw" },
  withdrawalOpen: { fr: "✓ Les retraits sont OUVERTS", en: "✓ Withdrawal window is OPEN" },
  withdrawalClosed: { fr: "Fermé — retraits ouverts le samedi de 10 h à 15 h", en: "Closed — withdrawals open Saturdays 10:00–15:00" },
  mobileNumber: { fr: "Numéro mobile money", en: "Mobile money number" },
  amount: { fr: "Montant", en: "Amount" },
  requestWithdrawal: { fr: "Demander le retrait", en: "Request withdrawal" },
  withdrawalSuccess: { fr: "Retrait demandé — il sera envoyé sur votre mobile money.", en: "Withdrawal requested — it will be sent to your mobile money." },
  demoSaturday: { fr: "Démo : simuler un samedi à 11 h", en: "Demo: pretend it’s Saturday 11:00" },
  history: { fr: "Historique", en: "History" },
  noWithdrawals: { fr: "Aucun retrait pour le moment.", en: "No withdrawals yet." },
  processing: { fr: "En cours", en: "Processing" },
  paid: { fr: "Payé", en: "Paid" },
  country: { fr: "Pays", en: "Country" },
  paymentMethod: { fr: "Moyen de paiement mobile", en: "Mobile payment method" },
  cvUpload: { fr: "Votre CV (PDF, Word)", en: "Your CV (PDF, Word)" },
  coverUpload: { fr: "Lettre de motivation (PDF, Word)", en: "Cover letter (PDF, Word)" },
  applyHelp: { fr: "Étape 1 : vos informations · Étape 2 : pays et paiement · Étape 3 : domaines · Étape 4 : CV et lettre.", en: "Step 1: your details · Step 2: country & payment · Step 3: domains · Step 4: CV & cover letter." },
  reviewTimer: { fr: "Examen en cours — restez sur cette page. Réponse dans", en: "Review in progress — stay on this page. Answer in" },
  reviewSteps: { fr: "Nos recruteurs vérifient votre CV, votre lettre et vos domaines choisis. Votre tableau de bord s’ouvrira automatiquement.", en: "Our recruiters are checking your CV, cover letter and chosen domains. Your dashboard will open automatically." },
  dashHelp: { fr: "Instructions : réalisez jusqu’à 8 missions par jour, collez le lien de la mission comme preuve, puis votre récompense est ajoutée. Chaque mission rapporte 50 €.", en: "Instructions: complete up to 8 tasks per day, paste the task link as proof, then your reward is added. Each task pays €50." },
  todayTasks: { fr: "Missions aujourd’hui", en: "Tasks today" },
  proofLabel: { fr: "Preuve : capture d’écran de la mission terminée", en: "Proof: screenshot of the completed task" },
  proofNote: { fr: "Lien ou commentaire (facultatif)", en: "Link or comment (optional)" },
  submitProof: { fr: "Envoyer la preuve et recevoir", en: "Submit proof & claim" },
  doneToday: { fr: "Terminée aujourd’hui — revenez demain", en: "Done today — come back tomorrow" },
  limitReached: { fr: "Limite quotidienne atteinte — revenez demain", en: "Daily limit reached — come back tomorrow" },
  progressGoal: { fr: "Progression vers 2 000 €", en: "Progress to €2,000" },
  walletHelp: { fr: "Instructions : choisissez le moyen de paiement de votre pays, saisissez votre numéro et un montant d’au moins 2 000 €.", en: "Instructions: choose your country’s payment method, enter your number and an amount of at least €2,000." },
} as const;

type CopyKey = keyof typeof copy;
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: CopyKey) => string };
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr");
  useEffect(() => {
    const saved = localStorage.getItem("paypoint_language");
    if (saved === "fr" || saved === "en") setLanguage(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("paypoint_language", language);
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t: (key) => copy[key][language] }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is missing");
  return context;
}

const errors: Record<string, string> = {
  "Username: 3–20 letters, numbers or _": "Nom d’utilisateur : 3 à 20 lettres, chiffres ou _",
  "Password must be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
  "Passwords do not match": "Les mots de passe ne correspondent pas",
  "Username already taken": "Ce nom d’utilisateur est déjà pris",
  "Wrong username or password": "Nom d’utilisateur ou mot de passe incorrect",
  "Not signed in": "Vous n’êtes pas connecté",
  "Withdrawals are only open on Saturdays from 10:00 to 15:00": "Les retraits sont ouverts uniquement le samedi de 10 h à 15 h",
  "Amount is higher than your balance": "Le montant dépasse votre solde",
  "Enter a valid mobile money number": "Saisissez un numéro mobile money valide",
  "Paste the exact task link as proof": "Collez exactement le lien de la mission comme preuve",
  "Task already done today": "Mission déjà réalisée aujourd’hui",
  "Daily task limit reached": "Limite quotidienne de missions atteinte",
};

export function localizedError(message: string, language: Language) {
  if (language === "en") return message;
  if (message.startsWith("Minimum withdrawal is ")) return message.replace("Minimum withdrawal is ", "Le retrait minimum est de ");
  return errors[message] ?? message;
}