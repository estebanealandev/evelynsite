// Todas las rutas con contenido jurídico, leídas de los archivos para no olvidar ninguna.
import fs from 'node:fs';
import { principales } from './routes';

const slugs = (d: string) => (fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')) : []);
export const getRutas = () => [...principales, '/orientacion', '/biblioteca-juridica', ...slugs('src/content/fichas').map(s => `/orientacion/${s}`), ...slugs('src/content/articulos').map(s => `/blog/${s}`)];
