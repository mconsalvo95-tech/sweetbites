export type ChristmasMockProduct = {
  id: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  priceCents: number;
  imageUrl: string;
};

/** Local mock catalog for /specials Christmas concept — not synced to Square or cart. */
export const CHRISTMAS_MOCK_PRODUCTS: ChristmasMockProduct[] = [
  {
    id: "christmas-cookie-box",
    nameEn: "Christmas Cookie Box",
    nameEs: "Caja de galletas navideñas",
    descriptionEn: "Assorted butter cookies with festive icing.",
    descriptionEs: "Galletas de mantequilla surtidas con glaseado festivo.",
    priceCents: 2400,
    imageUrl: "/test-images/photoroom-140123.jpg",
  },
  {
    id: "gingerbread-bites",
    nameEn: "Gingerbread Bites",
    nameEs: "Bocados de jengibre",
    descriptionEn: "Soft gingerbread squares with a hint of spice.",
    descriptionEs: "Cuadritos de jengibre suaves con un toque especiado.",
    priceCents: 1800,
    imageUrl: "/test-images/photoroom-140003.jpg",
  },
  {
    id: "holiday-brownie-box",
    nameEn: "Holiday Brownie Box",
    nameEs: "Caja de brownies navideños",
    descriptionEn: "Rich chocolate brownies for sharing.",
    descriptionEs: "Brownies de chocolate intensos para compartir.",
    priceCents: 2600,
    imageUrl: "/test-images/img-1128.jpeg",
  },
  {
    id: "festive-sweet-box",
    nameEn: "Festive Sweet Box",
    nameEs: "Caja dulce festiva",
    descriptionEn: "A mix of seasonal favourites from our kitchen.",
    descriptionEs: "Una mezcla de favoritos de temporada de nuestra cocina.",
    priceCents: 3200,
    imageUrl: "/test-images/swb-banner.png",
  },
];
