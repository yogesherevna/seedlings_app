import rawProducts from './products.json';
export type Product = typeof rawProducts[number];
export const products = rawProducts;
