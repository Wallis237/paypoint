import johnnyDepp from "@/assets/tasks/johnny-depp.jpg.asset.json";
import africanMusicArtist from "@/assets/tasks/african-music-artist.jpg.asset.json";
import dogecoin from "@/assets/tasks/dogecoin.jpg.asset.json";
import ethereum from "@/assets/tasks/ethereum.jpg.asset.json";
import luxuryCar from "@/assets/tasks/luxury-car.jpg.asset.json";
import tabletWorkstation from "@/assets/tasks/tablet-workstation.jpg.asset.json";
import bitcoinMarket from "@/assets/tasks/bitcoin-market.jpg.asset.json";
import breguetWatch from "@/assets/tasks/breguet-watch.jpg.asset.json";
import leonardoDiCaprio from "@/assets/tasks/leonardo-dicaprio.jpg.asset.json";

const TASK_IMAGES: Record<string, { url: string; altFr: string; altEn: string }> = {
  p1: { url: luxuryCar.url, altFr: "Voiture de luxe blanche", altEn: "White luxury car" },
  p3: { url: breguetWatch.url, altFr: "Montre Breguet de luxe", altEn: "Luxury Breguet watch" },
  p4: { url: tabletWorkstation.url, altFr: "Tablette avec clavier et accessoires", altEn: "Tablet with keyboard and accessories" },
  c1: { url: dogecoin.url, altFr: "Pièce Dogecoin dorée", altEn: "Gold Dogecoin coin" },
  c2: { url: ethereum.url, altFr: "Pièce Ethereum", altEn: "Ethereum coin" },
  c3: { url: bitcoinMarket.url, altFr: "Bitcoin sur un graphique de marché", altEn: "Bitcoin on a market chart" },
  s1: { url: johnnyDepp.url, altFr: "Portrait de Johnny Depp", altEn: "Portrait of Johnny Depp" },
  s2: { url: africanMusicArtist.url, altFr: "Portrait d’un artiste de musique africaine", altEn: "Portrait of an African music artist" },
  s3: { url: leonardoDiCaprio.url, altFr: "Portrait de Leonardo DiCaprio", altEn: "Portrait of Leonardo DiCaprio" },
};

export function taskImage(taskId: string) {
  return TASK_IMAGES[taskId];
}