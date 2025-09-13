// src/gmm.ts
import * as math from 'mathjs';

export class GaussianMixture {
  private nComponents: number;
  private maxIter: number;
  private tol: number;
  private randomState: number | null;
  
  private weights: number[] = [];
  private means: number[][] = [];
  private covariances: number[][][] = [];
  private converged: boolean = false;
  
  constructor(nComponents: number, options: { 
    maxIter?: number, 
    tol?: number, 
    seed?: number 
  } = {}) {
    this.nComponents = nComponents;
    this.maxIter = options.maxIter || 100;
    this.tol = options.tol || 1e-3;
    this.randomState = options.seed || null;
  }
  
  private seedRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }
  
  private initializeParameters(data: number[][]): void {
    const n = data.length;
    const d = data[0].length;
    const rng = this.randomState ? this.seedRandom(this.randomState) : Math.random;
    
    // Initialize weights uniformly
    this.weights = new Array(this.nComponents).fill(1.0 / this.nComponents);
    
    // Initialize means using random samples from data
    const indices = new Set<number>();
    while (indices.size < this.nComponents) {
      indices.add(Math.floor(rng() * n));
    }
    this.means = Array.from(indices).map(i => [...data[i]]);
    
    // Initialize covariances as identity matrices
    this.covariances = Array(this.nComponents).fill(null).map(() => {
      const cov = Array(d).fill(null).map(() => Array(d).fill(0));
      for (let i = 0; i < d; i++) {
        cov[i][i] = 1.0;
      }
      return cov;
    });
  }
  
  private gaussianPdf(x: number[], mean: number[], cov: number[][]): number {
    const d = x.length;
    const diff = x.map((xi, i) => xi - mean[i]);
    
    // Add small regularization to diagonal for numerical stability
    const regularizedCov = cov.map((row, i) => 
      row.map((val, j) => i === j ? val + 1e-6 : val)
    );
    
    try {
      const covInv = math.inv(regularizedCov) as number[][];
      const det = math.det(regularizedCov) as number;
      
      if (det <= 0) {
        return 1e-10; // Return small probability for singular matrices
      }
      
      const temp = math.multiply(diff, covInv) as number[];
      const mahalanobis = math.dot(temp, diff) as number;
      
      const coefficient = 1.0 / Math.sqrt(Math.pow(2 * Math.PI, d) * det);
      return coefficient * Math.exp(-0.5 * mahalanobis);
    } catch (e) {
      // Handle singular matrix case
      return 1e-10;
    }
  }
  
  private eStep(data: number[][]): number[][] {
    const n = data.length;
    const responsibilities = Array(n).fill(null).map(() => Array(this.nComponents).fill(0));
    
    for (let i = 0; i < n; i++) {
      let sumProb = 0;
      for (let k = 0; k < this.nComponents; k++) {
        const prob = this.weights[k] * this.gaussianPdf(data[i], this.means[k], this.covariances[k]);
        responsibilities[i][k] = prob;
        sumProb += prob;
      }
      
      // Normalize
      if (sumProb > 0) {
        for (let k = 0; k < this.nComponents; k++) {
          responsibilities[i][k] /= sumProb;
        }
      }
    }
    
    return responsibilities;
  }
  
  private mStep(data: number[][], responsibilities: number[][]): void {
    const n = data.length;
    const d = data[0].length;
    
    for (let k = 0; k < this.nComponents; k++) {
      const nk = responsibilities.reduce((sum, r) => sum + r[k], 0);
      
      if (nk < 1e-10) {
        continue; // Skip empty clusters
      }
      
      // Update weight
      this.weights[k] = nk / n;
      
      // Update mean
      const newMean = Array(d).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < d; j++) {
          newMean[j] += responsibilities[i][k] * data[i][j];
        }
      }
      this.means[k] = newMean.map(m => m / nk);
      
      // Update covariance
      const newCov = Array(d).fill(null).map(() => Array(d).fill(0));
      for (let i = 0; i < n; i++) {
        const diff = data[i].map((x, j) => x - this.means[k][j]);
        for (let j = 0; j < d; j++) {
          for (let l = 0; l < d; l++) {
            newCov[j][l] += responsibilities[i][k] * diff[j] * diff[l];
          }
        }
      }
      this.covariances[k] = newCov.map(row => row.map(val => val / nk));
    }
  }
  
  private computeLogLikelihood(data: number[][]): number {
    const n = data.length;
    let logLikelihood = 0;
    
    for (let i = 0; i < n; i++) {
      let prob = 0;
      for (let k = 0; k < this.nComponents; k++) {
        prob += this.weights[k] * this.gaussianPdf(data[i], this.means[k], this.covariances[k]);
      }
      logLikelihood += Math.log(Math.max(prob, 1e-10));
    }
    
    return logLikelihood;
  }
  
  fit(data: number[][]): void {
    if (data.length < this.nComponents) {
      throw new Error(`Number of samples (${data.length}) must be >= number of components (${this.nComponents})`);
    }
    
    this.initializeParameters(data);
    
    let prevLogLikelihood = -Infinity;
    
    for (let iter = 0; iter < this.maxIter; iter++) {
      // E-step
      const responsibilities = this.eStep(data);
      
      // M-step
      this.mStep(data, responsibilities);
      
      // Check convergence
      const logLikelihood = this.computeLogLikelihood(data);
      if (Math.abs(logLikelihood - prevLogLikelihood) < this.tol) {
        this.converged = true;
        break;
      }
      prevLogLikelihood = logLikelihood;
    }
  }
  
  predict_proba(data: number[][]): number[][] {
    return this.eStep(data);
  }
  
  bic(data: number[][]): number {
    const n = data.length;
    const d = data[0].length;
    
    // Number of parameters: weights (k-1) + means (k*d) + covariances (k*d*(d+1)/2)
    const nParams = (this.nComponents - 1) + 
                    (this.nComponents * d) + 
                    (this.nComponents * d * (d + 1) / 2);
    
    const logLikelihood = this.computeLogLikelihood(data);
    return -2 * logLikelihood + nParams * Math.log(n);
  }
  
  predict(data: number[][]): number[] {
    const proba = this.predict_proba(data);
    return proba.map(p => p.indexOf(Math.max(...p)));
  }
}