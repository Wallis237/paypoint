const TASK_IMAGES: Record<string, { url: string; altFr: string; altEn: string }> = {
  p1: { url: "/tasks/luxury-car.jpg", altFr: "Voiture de luxe blanche", altEn: "White luxury car" },
  p3: { url: "/tasks/breguet-watch.jpg", altFr: "Montre Breguet de luxe", altEn: "Luxury Breguet watch" },
  p4: { url: "/tasks/tablet-workstation.jpg", altFr: "Tablette avec clavier et accessoires", altEn: "Tablet with keyboard and accessories" },
  c1: { url: "/tasks/dogecoin.jpg", altFr: "Pièce Dogecoin dorée", altEn: "Gold Dogecoin coin" },
  c2: { url: "/tasks/ethereum.jpg", altFr: "Pièce Ethereum", altEn: "Ethereum coin" },
  c3: { url: "/tasks/bitcoin-market.jpg", altFr: "Bitcoin sur un graphique de marché", altEn: "Bitcoin on a market chart" },
  s1: { url: "/tasks/johnny-depp.jpg", altFr: "Portrait de Johnny Depp", altEn: "Portrait of Johnny Depp" },
  s2: { url: "/tasks/african-music-artist.jpg", altFr: "Portrait d’un artiste de musique africaine", altEn: "Portrait of an African music artist" },
  s3: { url: "/tasks/leonardo-dicaprio.jpg", altFr: "Portrait de Leonardo DiCaprio", altEn: "Portrait of Leonardo DiCaprio" },
};

export function taskImage(taskId: string) {
  return TASK_IMAGES[taskId];
}