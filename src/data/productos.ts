// src/data/productos.ts
// Catálogo de productos de Skincare botánico con temática de naturaleza y hojas relajantes

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock?: number;
  categoria: string;
  img: string;        // Imagen principal (portada)
  galeria: string[];  // Imágenes adicionales para la galería/lightbox
}

// Lista de categorías
export const categorias = [
  "Facial",
  "Cuidado Diario",
  "Limpieza",
  "Tratamiento",
  "Exfoliación",
  "Hidratación",
];

export const productosMock: Producto[] = [
  {
    id: 1,
    nombre: "Serum Revitalizante",
    descripcion:
      "Fórmula botánica concentrada con ácido hialurónico vegetal y vitamina C. Ilumina la piel y aporta una hidratación profunda desde la primera gota.",
    precio: 45.0,
    stock: 97,
    categoria: "Facial",
    img: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 2,
    nombre: "Crema Hidratante Pro",
    descripcion:
      "Hidratación profunda 24h para todo tipo de piel enriquecida con niacinamida y manteca de karité sobre base botánica relajante.",
    precio: 32.5,
    stock: 100,
    categoria: "Cuidado Diario",
    img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 3,
    nombre: "Tónico Purificante",
    descripcion:
      "Equilibra el pH y minimiza los poros suavemente con infusión botánica de hamamelis y extractos de hojas frescas de eucalipto.",
    precio: 28.0,
    stock: 100,
    categoria: "Limpieza",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 4,
    nombre: "Mascarilla Nocturna",
    descripcion:
      "Nutrición intensiva durante el sueño con extractos botánicos y antioxidantes. Despierta con la piel descansada, fresca y radiante.",
    precio: 50.0,
    stock: 100,
    categoria: "Tratamiento",
    img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 5,
    nombre: "Agua Micelar Botánica",
    descripcion:
      "Limpiador suave sin enjuague con extracto de manzanilla silvestre y aloe vera para calmar, remover impurezas y reconfortar la piel.",
    precio: 24.0,
    stock: 85,
    categoria: "Limpieza",
    img: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 6,
    nombre: "Exfoliante Facial de Bambú",
    descripcion:
      "Micropartículas naturales de bambú y té verde para renovar la textura de la piel suavemente sin dañar la barrera cutánea.",
    precio: 36.0,
    stock: 70,
    categoria: "Exfoliación",
    img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 7,
    nombre: "Bruma Facial de Rosas y Lavanda",
    descripcion:
      "Rocío refrescante con hidrolato de lavanda y agua de rosas orgánicas para tonificar y relajar la mente y la piel a cualquier hora.",
    precio: 22.5,
    stock: 95,
    categoria: "Hidratación",
    img: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 8,
    nombre: "Contorno de Ojos Cafeína Verde",
    descripcion:
      "Descongestiona ojeras y líneas finas con extracto de cafeína verde, péptidos y pepino fresco en textura gel ultraligera.",
    precio: 38.0,
    stock: 60,
    categoria: "Facial",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 9,
    nombre: "Aceite Facial Jojoba y Rosa Mosqueta",
    descripcion:
      "Elixir regenerador nocturno 100% puro prensado en frío, rico en antioxidantes, omegas y ácidos grasos esenciales.",
    precio: 42.0,
    stock: 75,
    categoria: "Tratamiento",
    img: "https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 10,
    nombre: "Protector Solar Mineral SPF 50+",
    descripcion:
      "Filtros físicos minerales de óxido de zinc con acabado invisible, textura sedosa no grasa y protección de amplio espectro.",
    precio: 34.5,
    stock: 110,
    categoria: "Cuidado Diario",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 11,
    nombre: "Mascarilla Arcilla Verde y Eucalipto",
    descripcion:
      "Purifica profundamente los poros y equilibra el exceso de brillo con arcilla volcánica francesa y eucalipto silvestre.",
    precio: 29.0,
    stock: 65,
    categoria: "Tratamiento",
    img: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: 12,
    nombre: "Bálsamo Reparador Cica y Karité",
    descripcion:
      "Nutrición y reparación intensiva para labios resecos con centella asiática silvestre y manteca de karité virgen.",
    precio: 16.5,
    stock: 120,
    categoria: "Cuidado Diario",
    img: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80",
    ],
  },
];