import { Product, Coupon } from '../types';

export const CATEGORIES = [
  { id: 'celulares', name: 'Celulares', icon: 'Smartphone' },
  { id: 'eletronicos', name: 'Eletrônicos', icon: 'Tv' },
  { id: 'moda', name: 'Moda', icon: 'Shirt' },
  { id: 'beleza', name: 'Beleza', icon: 'Sparkles' },
  { id: 'calcados', name: 'Calçados', icon: 'Footprints' },
  { id: 'casa', name: 'Casa', icon: 'Home' },
  { id: 'esportes', name: 'Esportes', icon: 'Dumbbell' },
  { id: 'brinquedos', name: 'Brinquedos', icon: 'Gamepad2' },
];

export const BANNERS = [
  {
    id: 'b1',
    gradient: 'from-blue-700 to-blue-900',
    title: 'Super ItaOfertas!',
    badge: 'Até 70% OFF',
    subtitle: 'Frete Grátis acima de R$39',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=70',
  },
  {
    id: 'b2',
    gradient: 'from-blue-600 to-indigo-800',
    title: 'Semana do Smartphone',
    badge: 'ItaCoins em Dobro',
    subtitle: 'Lançamentos com Cupons Exclusivos',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=70',
  },
  {
    id: 'b3',
    gradient: 'from-yellow-400 to-blue-800',
    title: 'Liquida ItaBuy',
    badge: 'Cupom de R$20',
    subtitle: 'Tudo em até 10x sem juros',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=70',
  },
];

export const COUPONS: Coupon[] = [];

export const PRODUCTS: Product[] = [];

export const REVIEWS: any[] = [];
