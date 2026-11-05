import { crearBosque } from './bosque';

self.onmessage = (e: MessageEvent<boolean>) => {
  self.postMessage(crearBosque(e.data));
};
