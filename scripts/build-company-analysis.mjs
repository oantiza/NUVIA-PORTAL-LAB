/**
 * Compila «Análisis y valoración de empresas» SOLO si se pide con
 * NUVIA_EMPRESAS=1. En la alfa (Entrega 2b) la vista está «En preparación»
 * y el módulo queda fuera de la publicación: `npm run build` no debe
 * depender de él ni arrastrarlo a dist/.
 *
 *   NUVIA_EMPRESAS=1 npm run build:company-analysis   (Linux/macOS)
 *   $env:NUVIA_EMPRESAS = '1'; npm run build:company-analysis   (PowerShell)
 */
import { execSync } from 'node:child_process';

if (process.env.NUVIA_EMPRESAS !== '1') {
  console.log('company-analysis: no se compila (alfa; define NUVIA_EMPRESAS=1 para hacerlo).');
  process.exit(0);
}
execSync('npm ci --prefix company-analysis', { stdio: 'inherit' });
execSync('npm run build --prefix company-analysis', { stdio: 'inherit' });
