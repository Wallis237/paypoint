// Shared catalog: types and constants used by both the UI and the server
// functions. Keep this module free of DOM, React and Node APIs so it can be
// imported from either side.

export type Domain = "products" | "crypto" | "celebrities" | "videos";

export const DOMAINS: { id: Domain; name: string; fr: string; desc: string; descFr: string }[] = [
  {
    id: "products",
    name: "Product Promotion",
    fr: "Promotion de produits",
    desc: "Post and promote dresses, tools, perfumes and rare watches.",
    descFr: "Publiez et promouvez des vêtements, outils, parfums et montres rares.",
  },
  {
    id: "crypto",
    name: "Crypto Promotion",
    fr: "Promotion de cryptomonnaies",
    desc: "Share and promote rare and emerging crypto coins.",
    descFr: "Partagez et promouvez des cryptomonnaies rares ou émergentes.",
  },
  {
    id: "celebrities",
    name: "Celebrity Votes",
    fr: "Votes et célébrités",
    desc: "Vote for and promote celebrities and campaigns.",
    descFr: "Votez et faites la promotion de célébrités et de campagnes.",
  },
  {
    id: "videos",
    name: "Video Engagement",
    fr: "Engagement vidéo",
    desc: "Watch and like videos to earn small commissions.",
    descFr: "Regardez et aimez des vidéos pour gagner de petites commissions.",
  },
];

export type Task = {
  id: string;
  domain: Domain;
  title: string;
  titleFr: string;
  desc: string;
  descFr: string;
  reward: number;
  seconds: number;
};

export const TASKS: Task[] = [
  {
    id: "p1",
    domain: "products",
    title: "Promote a luxury car",
    titleFr: "Promouvoir une voiture de luxe",
    desc: "Share the luxury car post on your social status.",
    descFr: "Partagez la publication de la voiture de luxe sur votre statut.",
    reward: 50,
    seconds: 8,
  },
  {
    id: "p2",
    domain: "products",
    title: "Post Oud Royal perfume",
    titleFr: "Publier le parfum Oud Royal",
    desc: "Publish the perfume ad with the provided caption.",
    descFr: "Publiez la publicité du parfum avec le texte fourni.",
    reward: 50,
    seconds: 8,
  },
  {
    id: "p3",
    domain: "products",
    title: "Promote a Breguet luxury watch",
    titleFr: "Promouvoir une montre de luxe Breguet",
    desc: "Share the luxury watch listing in 2 groups.",
    descFr: "Partagez l’annonce de la montre de luxe dans deux groupes.",
    reward: 50,
    seconds: 10,
  },
  {
    id: "p4",
    domain: "products",
    title: "Promote a tablet workstation",
    titleFr: "Promouvoir une tablette de travail",
    desc: "Write a short promotional post for the tablet and its accessories.",
    descFr: "Rédigez une courte publication promotionnelle sur la tablette et ses accessoires.",
    reward: 50,
    seconds: 6,
  },
  {
    id: "c1",
    domain: "crypto",
    title: "Share a Dogecoin campaign",
    titleFr: "Partager une campagne Dogecoin",
    desc: "Repost the Dogecoin campaign visual.",
    descFr: "Republiez le visuel de la campagne Dogecoin.",
    reward: 50,
    seconds: 8,
  },
  {
    id: "c2",
    domain: "crypto",
    title: "Promote Ethereum",
    titleFr: "Promouvoir Ethereum",
    desc: "Share the Ethereum visual with your network.",
    descFr: "Partagez le visuel Ethereum avec votre réseau.",
    reward: 50,
    seconds: 8,
  },
  {
    id: "c3",
    domain: "crypto",
    title: "Share a Bitcoin market post",
    titleFr: "Partager une publication sur le marché du Bitcoin",
    desc: "Share the Bitcoin market visual with your community.",
    descFr: "Partagez le visuel du marché du Bitcoin avec votre communauté.",
    reward: 50,
    seconds: 6,
  },
  {
    id: "s1",
    domain: "celebrities",
    title: "Vote: Johnny Depp",
    titleFr: "Voter : Johnny Depp",
    desc: "Cast your vote in the public popularity poll.",
    descFr: "Votez dans le sondage public de popularité.",
    reward: 50,
    seconds: 5,
  },
  {
    id: "s2",
    domain: "celebrities",
    title: "Promote an African music artist",
    titleFr: "Promouvoir un artiste de musique africaine",
    desc: "Share the artist profile and invite 3 friends.",
    descFr: "Partagez le profil de l’artiste et invitez trois amis.",
    reward: 50,
    seconds: 7,
  },
  {
    id: "s3",
    domain: "celebrities",
    title: "Vote: Leonardo DiCaprio",
    titleFr: "Voter : Leonardo DiCaprio",
    desc: "Vote in the public cinema poll.",
    descFr: "Participez au sondage public sur le cinéma.",
    reward: 50,
    seconds: 5,
  },
  {
    id: "v1",
    domain: "videos",
    title: "Watch & like: Douala street food",
    titleFr: "Regarder et aimer : cuisine de rue à Douala",
    desc: "Watch the video fully, then like it.",
    descFr: "Regardez toute la vidéo, puis aimez-la.",
    reward: 50,
    seconds: 10,
  },
  {
    id: "v2",
    domain: "videos",
    title: "Watch & like: Dakar fashion week",
    titleFr: "Regarder et aimer : Fashion Week de Dakar",
    desc: "Watch the video fully, then like it.",
    descFr: "Regardez toute la vidéo, puis aimez-la.",
    reward: 50,
    seconds: 10,
  },
  {
    id: "v3",
    domain: "videos",
    title: "Watch & like: Abidjan comedy",
    titleFr: "Regarder et aimer : humour à Abidjan",
    desc: "Watch the video fully, then like it.",
    descFr: "Regardez toute la vidéo, puis aimez-la.",
    reward: 50,
    seconds: 8,
  },
  {
    id: "v4",
    domain: "videos",
    title: "Watch & like: Kinshasa music clip",
    titleFr: "Regarder et aimer : clip musical de Kinshasa",
    desc: "Watch the video fully, then like it.",
    descFr: "Regardez toute la vidéo, puis aimez-la.",
    reward: 50,
    seconds: 8,
  },
];

export const PAYMENTS: Record<string, string[]> = {
  Cameroon: ["MTN Mobile Money", "Orange Money"],
  "Côte d'Ivoire": ["Orange Money", "MTN Mobile Money", "Moov Money", "Wave"],
  Senegal: ["Orange Money", "Wave", "Free Money"],
  "DR Congo": ["M-Pesa", "Orange Money", "Airtel Money"],
  Congo: ["MTN Mobile Money", "Airtel Money"],
  Gabon: ["Airtel Money", "Moov Money"],
  Benin: ["MTN Mobile Money", "Moov Money"],
  Togo: ["T-Money", "Moov Money"],
  "Burkina Faso": ["Orange Money", "Moov Money"],
  Mali: ["Orange Money", "Moov Money"],
  Niger: ["Airtel Money", "Moov Money"],
  Guinea: ["Orange Money", "MTN Mobile Money"],
  Chad: ["Airtel Money", "Moov Money"],
  Madagascar: ["MVola", "Orange Money", "Airtel Money"],
  Rwanda: ["MTN Mobile Money", "Airtel Money"],
  Burundi: ["Lumicash", "EcoCash"],
};
export const COUNTRIES = Object.keys(PAYMENTS);
export const DAILY_LIMIT = 8;
export const REVIEW_MS = 10 * 60 * 1000;
export const MIN_WITHDRAW = 2000;
export const DEMO_WITHDRAWAL_MS = 8000;
export const today = () => new Date().toISOString().slice(0, 10);
export const doneToday = (u: { completed: string[] }, id?: string) =>
  u.completed.filter((c) => c.startsWith(today() + ":") && (!id || c.endsWith(":" + id)));

export type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  number: string;
  date: string;
  status: "processing" | "paid";
  demo?: boolean;
};
export type Application = {
  fullName: string;
  country: string;
  phone: string;
  domains: Domain[];
  motivation: string;
  payment: string;
  cv: string;
  coverLetter: string;
  submittedAt: number;
  status: "pending" | "accepted";
};
export type Proof = { taskId: string; date: string; link: string };
export const taskLink = (username: string, id: string) => `https://paypoint.eu/p/${id}/${username}`;

// Shape the client works with — never contains credentials.
export type User = {
  username: string;
  balance: number;
  completed: string[];
  withdrawals: Withdrawal[];
  proofs: Proof[];
  application?: Application;
  simulateSaturday: boolean;
};

export function withdrawalOpen(
  db: { simulateSaturday: boolean } | null | undefined,
  now = new Date(),
) {
  if (db?.simulateSaturday) return true;
  const h = now.getHours();
  return now.getDay() === 6 && h >= 10 && h < 15;
}

export const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
