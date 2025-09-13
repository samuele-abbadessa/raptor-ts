declare module 'gaussian-mixture' {
  export class GaussianMixture {
    constructor(nComponents: number, options?: { seed?: number });
    fit(data: number[][]): void;
    predict_proba(data: number[][]): number[][];
    bic(data: number[][]): number;
  }
}