// Genera las imágenes originales del sitio con un raymarcher GLSL en Chrome sin interfaz.
// Uso: npm run art            -> todas
//      npm run art -- portico -> solo las que contengan "portico" en el nombre
//      PREVIEW=1 npm run art  -> baja resolución para revisar encuadres
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { feature } from 'topojson-client';

const OUT = 'public/assets/images';
fs.mkdirSync(OUT, { recursive: true });
const PREVIEW = !!process.env.PREVIEW;
const filter = process.argv[2];

const SHADER = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec3 uRo, uTa, uSun, uTintS, uTintH; uniform float uFov, uSeed, uExposure, uAmb;
out vec4 fragColor;
#define PI 3.14159265
float hash(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+7.1; a*=.5; } return s; }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdBox(vec3 p,vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
float sdRBox(vec3 p,vec3 b,float r){ return sdBox(p,b-r)-r; }
float sdCyl(vec3 p,float r,float h){ vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h); return min(max(d.x,d.y),0.)+length(max(d,0.)); }
float sdTorus(vec3 p,vec2 t){ return length(vec2(length(p.xz)-t.x,p.y))-t.y; }
float sdEll(vec3 p,vec3 r){ float k0=length(p/r),k1=length(p/(r*r)); return k0*(k0-1.)/k1; }
float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float sdCaps(vec3 p,vec3 a,vec3 b,float r){ vec3 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float gAlb; // albedo modificado por la escena
float gSpec;

#if SCENE==0 // Pórtico: galería con arcos y sol lateral
float arches(vec3 p){
 float w=sdBox(p-vec3(0.,3.,0.),vec3(.45,3.,60.));
 float z=mod(p.z+2.1,4.2)-2.1;
 vec2 q=vec2(z,p.y);
 float rect=max(abs(q.x)-1.35,q.y-2.7);
 float circ=length(q-vec2(0.,2.7))-1.35;
 return max(w,-min(rect,circ));
}
float map(vec3 p){ gAlb=.78; gSpec=.03;
 float d=p.y; d=min(d,sdBox(p-vec3(-3.,6.3,0.),vec3(3.5,.3,70.))); d=min(d,p.x+6.5); d=min(d,arches(p));
 return d; }
#elif SCENE==1 // Luz de ventana sobre un muro, con un jarrón
float map(vec3 p){ gAlb=.8; gSpec=.02;
 float d=min(-p.z,p.y);
 d=min(d,sdRBox(p-vec3(1.15,.45,-.42),vec3(.95,.45,.38),.015));
 vec3 q=p-vec3(1.45,1.14,-.42);
 float r=.17*(1.-.25*sin(q.y*6.5+.6)); float vase=max(length(q.xz)-r,abs(q.y)-.25);
 d=min(d,vase*.7);
 return d; }
#elif SCENE==2 // Escalera de piedra
float map(vec3 p){ gAlb=.74; gSpec=.03;
 float s=.46,h=.2;
 float n0=clamp(floor(p.z/s),-1.,22.); float st2=1e5;
 for(int k=-1;k<=1;k++){ float n=n0+float(k); if(n<-1.) continue; vec2 c=vec2((n+.5)*s,((n+1.)*h-1.)*.5), b=vec2(s*.5,((n+1.)*h+1.)*.5); vec2 q=abs(vec2(p.z,p.y)-c)-b; st2=min(st2,length(max(q,0.))+min(max(q.x,q.y),0.)); }
 float d=min(st2,p.y);
 d=min(d,max(p.x+2.2,p.y-(p.z*.43+1.5)));
 d=min(d,3.4-p.x);
 return d*.9; }
#elif SCENE==3 // Equilibrio: piedras apiladas sobre un plinto
float map(vec3 p){ gAlb=.5; gSpec=.08;
 float bg=min(p.y,2.8-p.z); float d=bg;
 float pl=sdRBox(p-vec3(0.,.28,0.),vec3(1.5,.28,1.),.015);
 d=min(d,pl); if(pl<.01||bg<.01){ gAlb=.72; }
 float dn=.012*fbm(p*14.);
 float s=sdEll(p-vec3(.0,.72,0.),vec3(.78,.18,.56));
 s=min(s,sdEll(rotY(p-vec3(.05,1.03,0.),.5),vec3(.56,.14,.42)));
 s=min(s,sdEll(rotY(p-vec3(-.03,1.27,0.),1.1),vec3(.38,.105,.3)));
 s=min(s,sdEll(rotY(p-vec3(.015,1.45,0.),.2),vec3(.23,.08,.19)));
 s+=dn; if(s<d){ gAlb=.42+.2*fbm(p*5.); gSpec=.18; }
 return min(d,s); }
#elif SCENE==4 // Documentos y pluma sobre una mesa
float paper(vec3 p,vec2 c,float a,float y,out vec2 uv){ vec3 q=p-vec3(c.x,y,c.y); q.xz=rot(a)*q.xz; uv=q.xz; return sdBox(q,vec3(1.05,.006,1.48)); }
float map(vec3 p){ gAlb=.035+.055*fbm(vec3(p.x*1.6,0.,p.z*15.)+3.); gSpec=.22; float d=p.y;
 vec2 uv; float b; float top=1e5; vec2 tuv=vec2(0.);
 b=paper(p,vec2(-.25,.1),.32,.012,uv); if(b<d){d=b;gAlb=.86;gSpec=.02;}
 b=paper(p,vec2(.12,-.08),-.16,.028,uv); if(b<d){d=b;gAlb=.88;gSpec=.02;}
 b=paper(p,vec2(0.,0.),.06,.044,uv); if(b<d){d=b;gSpec=.02;
   float lines=smoothstep(.012,.0,abs(fract(uv.y*7.)-.5)-.012);
   float row=floor(uv.y*7.); float len=.55+.3*hash(vec3(row,3.,1.));
   float word=smoothstep(.15,.45,noise(vec3(uv.x*16.,row,2.)));
   float mask=step(abs(uv.x+.05),len)*step(abs(uv.y),1.25);
   gAlb=.9-.62*lines*mask*word; }
 vec3 a=vec3(-.75,.1,.85),bb=vec3(.72,.1,-.5);
 float pen=sdCaps(p,a,bb,.055); float tip=sdCaps(p,bb,bb+normalize(bb-a)*.22,.018);
 float pd=smin(pen,tip,.03); if(pd<d){ d=pd; gAlb=.03; gSpec=.9;
   float band=abs(dot(p-a,normalize(bb-a))-1.25); if(band<.03) {gAlb=.55; gSpec=1.;} }
 return d; }
#elif SCENE==5 // Tela con pliegues
float h(vec2 q){ float w=fbm(vec3(q*.3,uSeed))*1.5; return .3*sin(q.x*2.3+w*2.2)+.1*sin(q.x*4.9+q.y*.35+w*2.8)+.018*sin(q.x*10.5+w*4.); }
float map(vec3 p){ gAlb=.58; gSpec=.05; return (p.y-h(p.xz))*.42; }
#elif SCENE==6 // Cordillera
float ridge(float x,float s){ float a=1.,v=0.; for(int i=0;i<7;i++){ float n=noise(vec3(x,s,uSeed)); v+=a*(1.-abs(2.*n-1.)); x=x*2.05+1.7; a*=.47; } return v/1.9; }
float map(vec3 p){ gAlb=0.; gSpec=0.; return 100.; }
vec3 mountains(vec3 rd){
 vec2 q=rd.xy/rd.z; float s=max(dot(rd,uSun),0.);
 vec3 c=vec3(mix(1.02,.62,clamp(q.y*1.9+.1,0.,1.)))+.5*pow(s,18.)+.22*pow(s,4.);
 for(int i=0;i<7;i++){ float f=float(i)/6.;
  float base=mix(.17,-.4,f), amp=mix(.15,.2,f), fr=mix(2.4,3.6,f);
  float y=base+amp*(ridge(q.x*fr+f*17.,f*9.)-.55)*1.6;
  float edge=smoothstep(.0014,-.0014,q.y-y);
  float tone=mix(.62,.1,pow(f,.8));
  float mist=smoothstep(y-mix(.2,.3,f),y,q.y);
  vec3 lc=vec3(mix(mix(.85,.55,f),tone,mist));
  c=mix(c,lc,edge);
 }
 return c; }
#elif SCENE==7 // Dos anillos enlazados sobre un plinto
float map(vec3 p){ gAlb=.74; gSpec=.03; float d=min(p.y,3.5-p.z);
 float pl=sdRBox(p-vec3(0.,.2,0.),vec3(1.7,.2,1.1),.012); d=min(d,pl);
 vec3 a=p-vec3(-.3,1.,0.); a.yz=rot(1.5708)*a.yz; a.xz=rot(.22)*a.xz; float r1=sdTorus(a,vec2(.55,.05));
 vec3 b=p-vec3(.27,.82,0.); b.xy=rot(-.72)*b.xy; float r2=sdTorus(b,vec2(.55,.05));
 float r=min(r1,r2); if(r<d){ d=r; gAlb=.16; gSpec=.85; }
 return d; }
#elif SCENE==8 // Columnata institucional
float col(vec3 p){ float a=atan(p.z,p.x); float r=.56+.012*cos(a*20.); float h=length(p.xz)-(r-.03*p.y/9.);
 float s=max(h,abs(p.y-4.5)-4.5);
 s=min(s,sdRBox(p-vec3(0.,.14,0.),vec3(.78,.14,.78),.01));
 s=min(s,sdRBox(p-vec3(0.,8.9,0.),vec3(.76,.12,.76),.02));
 return s*.8; }
float map(vec3 p){ gAlb=.76; gSpec=.04; float d=p.y; d=min(d,sdBox(p-vec3(0.,10.,0.),vec3(40.,1.,3.)));
 vec3 q=p; q.x=mod(q.x+1.9,3.8)-1.9; q.z=abs(p.z)-1.; d=min(d,col(q-vec3(0.,0.,1.)));
 d=min(d,p.z+7.);
 return d; }
#elif SCENE==9 // Umbral: puerta abierta y luz en un interior oscuro
float map(vec3 p){ gAlb=.6; gSpec=.03;
 float d=p.y; d=min(d,max(5.-p.y,p.z-7.7));
 d=min(d,max(p.x+5.,p.z-7.7)); d=min(d,max(6.-p.x,p.z-7.7));
 float wall=sdBox(p-vec3(0.,2.5,8.),vec3(12.,3.,.3));
 float door=sdBox(p-vec3(.7,1.7,8.),vec3(1.05,1.7,1.));
 d=min(d,max(wall,-door));
 vec3 q=p-vec3(1.72,1.7,7.05); q.xz=rot(-.55)*q.xz;
 d=min(d,sdBox(q-vec3(0.,0.,-.9),vec3(.04,1.7,1.)));
 return d; }
#endif

vec3 normalAt(vec3 p){ vec2 e=vec2(.0012,0.); return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx))); }
float shadow(vec3 ro,vec3 rd,float k){ float res=1.,t=.02; for(int i=0;i<64;i++){ float h=map(ro+rd*t); res=min(res,k*h/t); t+=clamp(h,.012,.45); if(res<.002||t>TMAX) break; } res=clamp(res,0.,1.); return res*res*(3.-2.*res); }
float ao(vec3 p,vec3 n){ float o=0.,s=1.; for(int i=1;i<=5;i++){ float h=.05*float(i)*AOSCALE; o+=(h-map(p+n*h))*s; s*=.6; } return clamp(1.-1.6*o/AOSCALE,0.,1.); }

float windowMask(vec3 p, vec3 sun){
#if SCENE==1
 // Proyección analítica de una ventana con parteluces y sombra de hojas.
 float t=(p.z+7.)/(-sun.z)*-1.; vec3 o=p+sun*(7.+p.z)/abs(sun.z);
 vec2 u=o.xy+vec2(3.57,-4.9);
 float pen=.05+.012*(7.+p.z);
 float W=smoothstep(-pen,pen,1.3-abs(u.x))*smoothstep(-pen,pen,1.55-abs(u.y-1.5));
 float mx=smoothstep(.0,pen*1.6,abs(mod(u.x+.8,.78)-.39)-.035);
 float my=smoothstep(.0,pen*1.6,abs(mod(u.y,.9)-.45)-.035);
 W*=mix(1.,mx*my,.92);
 float leaves=1.;
 for(int i=0;i<16;i++){ float f=float(i); vec2 c=vec2(-1.4+.18*f+.2*sin(f*2.1),2.9-.09*f+.34*sin(f*1.7)); vec2 v=rot(f*1.3)*(u-c); float e=length(v/vec2(.34,.11)); leaves*=smoothstep(.75,1.25,e); }
 W*=mix(.12,1.,leaves);
 return W;
#else
 return 1.;
#endif
}

vec3 sky(vec3 rd){
#if SCENE==6
 float s=max(dot(rd,uSun),0.); float g=clamp(rd.y*2.2+.1,0.,1.);
 return mix(vec3(.92),vec3(.5),g)+.6*pow(s,14.)+.4*pow(s,3.);
#elif SCENE==8
 float g=clamp(rd.y,0.,1.); return mix(vec3(1.2),vec3(.82),g);
#elif SCENE==9
 return vec3(2.6);
#else
 return vec3(1.1);
#endif
}

vec3 render(vec3 ro,vec3 rd){
 #if SCENE==6
 return mountains(rd);
 #endif
 float t=.01; bool hit=false; vec3 p;
 for(int i=0;i<MAXSTEPS;i++){ p=ro+rd*t; float d=map(p); if(d<.0006*t){ hit=true; break; } t+=d; if(t>TMAX) break; }
 if(!hit) return sky(rd);
 map(p); float alb=gAlb, spec=gSpec;
 vec3 n=normalAt(p);
#if SCENE==0||SCENE==1||SCENE==2||SCENE==8||SCENE==9
 alb*=.86+.26*fbm(p*2.4+11.);
 vec3 bq=p*38.; n=normalize(n+.018*(vec3(noise(bq),noise(bq+5.),noise(bq+9.))-.5));
#endif
#if SCENE==5
 alb*=.97+.06*noise(p*120.);
#endif
#if SCENE==6
 float rock=smoothstep(.45,.95,n.y); alb=mix(.22,.42,rock)*(.7+.6*fbm(p*3.));
#endif
 float dif=max(dot(n,uSun),0.);
 float sh=dif>0.?shadow(p+n*.003,uSun,SHK)*windowMask(p,uSun):0.;
 float occ=ao(p,n);
 float amb=(.64+.36*n.y)*occ*uAmb;
 float bounce=max(dot(n,normalize(vec3(-uSun.x,.05,-uSun.z))),0.)*occ*uAmb*.45;
 vec3 h=normalize(uSun-rd);
 float sp=pow(max(dot(n,h),0.),mix(14.,180.,spec))*spec*sh*2.2;
 float fre=pow(1.-max(dot(n,-rd),0.),4.)*spec*occ*.7;
 float c=alb*(dif*sh*SUNI+amb+bounce)+sp+fre;
 vec3 col=vec3(c);
#if SCENE==0||SCENE==8
 col=mix(col,vec3(.95),1.-exp(-t*.006));
#endif
#if SCENE==6
 float fog=1.-exp(-pow(t*.058,1.5)); float low=exp(-max(p.y+.25,0.)*1.5);
 col=mix(col,sky(rd)*.95,clamp(fog+low*.55*smoothstep(4.,18.,t),0.,1.));
#endif
 return col;
}
void main(){
 vec3 tot=vec3(0.);
 for(int m=0;m<AA;m++) for(int k=0;k<AA;k++){
  vec2 o=(vec2(float(m),float(k))+.5)/float(AA)-.5;
  vec2 uv=(2.*(gl_FragCoord.xy+o)-uRes)/uRes.y;
  vec3 ww=normalize(uTa-uRo),uu=normalize(cross(ww,vec3(0,1,0))),vv=cross(uu,ww);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+uFov*ww);
  tot+=render(uRo,rd);
 }
 tot/=float(AA*AA);
 float l=tot.r*uExposure;
 l=(l*(2.51*l+.03))/(l*(2.43*l+.59)+.14); // ACES
 l=pow(clamp(l,0.,1.),1./2.2);
 vec2 v=gl_FragCoord.xy/uRes-.5; l*=1.-.42*dot(v,v);
 l=mix(l,l*l*(3.-2.*l),.55); // contraste
 float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+uSeed)*43758.5453)-.5;
 l=clamp(l+g*.038,0.,1.);
 fragColor=vec4(mix(uTintS,uTintH,l)*(.15+.85*l)/.999,1.);
}`;

const PREFIX = s => `#version 300 es
#define SCENE ${s.scene}
#define AA ${PREVIEW ? 1 : s.aa ?? 3}
#define MAXSTEPS ${s.steps ?? 150}
#define TMAX ${(s.tmax ?? 60).toFixed(1)}
#define SHK ${(s.shk ?? 26).toFixed(1)}
#define SUNI ${(s.suni ?? 2.6).toFixed(2)}
#define AOSCALE ${(s.ao ?? 1).toFixed(2)}
`;

const WARM = [[.075, .072, .07], [1, .985, .96]];
const COOL = [[.06, .08, .105], [.97, .985, 1]];
const MONO = [[.07, .07, .07], [1, 1, 1]];

// Formato: nombre, escena, ancho, alto, cámara, objetivo, sol, fov, opciones.
const P = (name, scene, w, h, ro, ta, sun, fov, o = {}) => ({ name, scene, w, h, ro, ta, sun, fov, tint: WARM, exp: 1, amb: .5, seed: 1, ...o });

const IMAGES = [
  // Portadas y grandes composiciones
  P('luz-ventana', 1, 1600, 1000, [0, 1.55, -5.2], [.25, 1.25, 0], [-.42, .52, -.74], 2.1, { tmax: 16, shk: 90, exp: 1.05, amb: .38 }),
  P('luz-ventana-vertical', 1, 900, 1100, [.7, 1.35, -4.6], [.9, 1.15, 0], [-.42, .52, -.74], 2.1, { tmax: 16, shk: 90, exp: 1.05, amb: .38, tint: WARM }),
  P('portico', 0, 1600, 1000, [-4.6, 1.5, -9.5], [-.6, 2.1, 3], [.74, .46, .34], 1.55, { exp: 1.05, amb: .44 }),
  P('portico-vertical', 0, 900, 1200, [-3.4, 1.35, -7], [-1.2, 2.5, 3], [.74, .46, .34], 1.7, { exp: 1.05, amb: .44 }),
  P('columnata', 8, 1600, 1000, [-7.5, 1.3, -6.2], [3.5, 3.7, .6], [.5, .62, -.6], 1.7, { tmax: 90, exp: .82, amb: .42, shk: 34 }),
  P('columnata-vertical', 8, 900, 1200, [-1.6, 1.1, -5.6], [1.5, 5.5, 1], [.5, .62, -.6], 1.6, { tmax: 90, exp: .82, amb: .42, shk: 34 }),
  P('escalera', 2, 1200, 1400, [.2, 2.4, -3.8], [.4, 1.7, 3], [-.6, .65, -.3], 1.75, { exp: 1, amb: .36, shk: 40 }),
  P('escalera-ancha', 2, 1600, 900, [-1.7, 1.2, -2.6], [.9, 1.5, 3], [-.6, .65, -.3], 1.5, { exp: 1, amb: .36, shk: 40 }),
  P('equilibrio', 3, 1200, 1200, [.5, 1.3, -4.6], [0, .98, 0], [-.62, .6, -.5], 2.3, { exp: 1.02, amb: .46, shk: 18, tmax: 20 }),
  P('equilibrio-ancho', 3, 1600, 1000, [-.9, 1.35, -4.8], [0, 1, 0], [.62, .6, -.5], 2.05, { exp: 1.02, amb: .46, shk: 18, tmax: 20 }),
  P('documentos', 4, 1200, 1400, [.35, 4.1, -2.1], [0, 0, 0], [-.55, .55, .63], 2.0, { exp: 1, amb: .36, shk: 40, tmax: 14, ao: .35 }),
  P('documentos-ancho', 4, 1600, 1000, [-.7, 2.5, -2.5], [.1, 0, .1], [-.55, .55, .63], 1.9, { exp: 1, amb: .36, shk: 40, tmax: 14, ao: .35 }),
  P('lino', 5, 1600, 1000, [0, 2.6, -2.2], [0, 0, .4], [-.88, .36, -.2], 1.9, { exp: 1.05, amb: .4, steps: 220, tmax: 14, shk: 7, seed: 2 }),
  P('lino-vertical', 5, 900, 1200, [.5, 2.5, -1.6], [.4, 0, .4], [.88, .36, -.2], 1.9, { exp: 1.05, amb: .4, steps: 220, tmax: 14, shk: 7, seed: 5 }),
  P('cordillera', 6, 1920, 900, [0, 2.4, -9], [0, 1.45, 8], [.5, .28, .82], 1.9, { tint: COOL, exp: 1, amb: .6, tmax: 70, seed: 3 }),
  P('cordillera-alta', 6, 1000, 1200, [5, 2.2, -8], [5, 1.5, 8], [-.5, .28, .82], 1.8, { tint: COOL, exp: 1, amb: .6, tmax: 70, seed: 8 }),
  P('anillos', 7, 1200, 1200, [.15, 1.35, -4.4], [0, .96, 0], [-.55, .68, -.48], 2.25, { exp: 1.02, amb: .48, tmax: 20, shk: 22 }),
  P('anillos-ancho', 7, 1600, 1000, [-.9, 1.5, -4.5], [0, .95, 0], [.55, .68, -.48], 2.05, { exp: 1.02, amb: .48, tmax: 20, shk: 22 }),
  P('umbral', 9, 1600, 1000, [-.8, 1.5, -1], [.8, 1.5, 8], [.2, .5, .84], 1.65, { exp: 1.05, amb: .22, tmax: 30, shk: 60, suni: 3.8, tint: COOL }),
  P('umbral-vertical', 9, 900, 1200, [.25, 1.5, 1], [.8, 1.6, 8], [.2, .5, .84], 1.6, { exp: 1.05, amb: .22, tmax: 30, shk: 60, suni: 3.8, tint: COOL }),
  // Miniaturas del blog
  ...[
    ['blog-01', 4, [.5, 3.5, -1.5], [.1, 0, .1], [-.55, .55, .63], 2.0, { tmax: 14, ao: .35, amb: .36, shk: 40 }],
    ['blog-02', 7, [1.3, 1.5, -3.8], [0, .95, 0], [-.55, .68, -.48], 2.2, { tmax: 20, amb: .48, shk: 22 }],
    ['blog-03', 8, [-3, .6, -5], [2.5, 4.5, 1], [.5, .62, -.6], 1.5, { tmax: 90, amb: .5, shk: 34 }],
    ['blog-04', 3, [-1.2, 1.1, -4.1], [0, 1.05, 0], [.62, .6, -.5], 2.5, { tmax: 20, amb: .46, shk: 18 }],
    ['blog-05', 1, [-.6, 1.5, -4.4], [-.4, 1.5, 0], [-.42, .52, -.74], 2.1, { tmax: 16, shk: 90, amb: .38 }],
    ['blog-06', 0, [-5.5, 1.1, -7], [-1, 2.2, 2], [.74, .46, .34], 1.5, { amb: .44 }],
    ['blog-07', 2, [1.8, 1.4, -2.2], [-.2, 1.5, 3], [-.6, .65, -.3], 1.6, { amb: .36, shk: 40 }],
    ['blog-08', 5, [0, 2.3, -1.9], [.2, 0, .6], [.88, .36, -.2], 2.1, { amb: .4, steps: 220, tmax: 14, shk: 7, seed: 9 }],
    ['blog-09', 6, [12, 2.5, -8], [12, 1.6, 8], [.5, .28, .82], 1.8, { tint: COOL, amb: .6, tmax: 70, seed: 12 }],
    ['blog-10', 9, [-.2, 1.5, 0], [.8, 1.4, 8], [.2, .5, .84], 1.7, { amb: .22, tmax: 30, shk: 60, suni: 3.8, tint: COOL }],
    ['blog-11', 4, [-.9, 2.6, -1.9], [.25, 0, .2], [.6, .55, .58], 1.8, { tmax: 14, ao: .35, amb: .36, shk: 40 }],
    ['blog-12', 8, [-5, 1.7, -3.5], [5, 3.2, 1], [.5, .62, -.6], 1.7, { tmax: 90, amb: .5, shk: 34 }],
    ['blog-13', 0, [-2.5, 1.5, -6], [-3, 1.5, 2], [.74, .46, .34], 1.6, { amb: .44 }],
    ['blog-14', 1, [1.4, 1.1, -3.6], [1.3, .95, 0], [-.42, .52, -.74], 2.15, { tmax: 16, shk: 90, amb: .38 }],
    ['blog-15', 2, [.3, 1.4, -1.4], [.3, 1.1, 2], [-.6, .65, -.3], 1.7, { amb: .36, shk: 40 }]
  ].map(([n, sc, ro, ta, sun, fov, o]) => P(n, sc, 1400, 1400, ro, ta, sun, fov, o))
];

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog']
});
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 900)); });
page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 900)));
await page.setContent('<canvas id="c"></canvas>');

const list = IMAGES.filter(i => !filter || i.name.includes(filter));
for (const im of list) {
  const started = Date.now();
  const w = PREVIEW ? Math.round(im.w / 2.5) : im.w;
  const h = PREVIEW ? Math.round(im.h / 2.5) : im.h;
  const src = SHADER.replace('#version 300 es', PREFIX(im))
    .replace('float gAlb;', `vec3 rotY(vec3 p,float a){ float c=cos(a),s=sin(a); return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z); }\nfloat gAlb;`);
  const dataUrl = await page.evaluate(async ({ src, im, w, h }) => {
    const old = document.getElementById('c');
    const c = document.createElement('canvas');
    old.replaceWith(c); c.id = 'c'; c.width = w; c.height = h;
    const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error('WebGL2 no disponible');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, `#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, src));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.bindAttribLocation(pr, 0, 'a');
    gl.vertexAttribPointer(gl.getAttribLocation(pr, 'a'), 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(pr, n);
    const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    gl.uniform2f(U('uRes'), w, h);
    gl.uniform3fv(U('uRo'), im.ro); gl.uniform3fv(U('uTa'), im.ta); gl.uniform3fv(U('uSun'), norm(im.sun));
    gl.uniform3fv(U('uTintS'), im.tint[0]); gl.uniform3fv(U('uTintH'), im.tint[1]);
    gl.uniform1f(U('uFov'), im.fov); gl.uniform1f(U('uSeed'), im.seed); gl.uniform1f(U('uExposure'), im.exp); gl.uniform1f(U('uAmb'), im.amb);
    gl.enable(gl.SCISSOR_TEST);
    const T = 160;
    for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) {
      gl.scissor(x, y, T, T); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();
      await new Promise(r => setTimeout(r, 0));
    }
    return c.toDataURL('image/png');
  }, { src, im, w, h });
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  const dir = PREVIEW ? (process.env.PREVIEW_DIR || 'var/art-preview') : OUT;
  fs.mkdirSync(dir, { recursive: true });
  await sharp(buf).webp({ quality: 78, effort: 5 }).toFile(path.join(dir, `${im.name}.webp`));
  // Variante liviana para tarjetas y pantallas pequeñas.
  await sharp(buf).resize({ width: Math.min(700, w) }).webp({ quality: 72, effort: 5 }).toFile(path.join(dir, `${im.name}-sm.webp`));
  if (PREVIEW) await sharp(buf).png().toFile(path.join(dir, `${im.name}.png`));
  console.log(`${im.name} ${w}x${h} ${((Date.now() - started) / 1000).toFixed(1)}s`);
}
await browser.close();

// Mapa vectorial de Costa Rica a partir de Natural Earth (dominio público).
if (!filter || filter === 'mapa') {
  const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-10m.json', 'utf8'));
  const cr = feature(topo, topo.objects.countries).features.find(f => f.id === '188');
  const polys = cr.geometry.type === 'MultiPolygon' ? cr.geometry.coordinates : [cr.geometry.coordinates];
  const main = polys.map(p => p[0]).filter(r => {
    const xs = r.map(c => c[0]);
    return Math.min(...xs) > -87; // excluye la Isla del Coco para encuadrar el territorio continental
  });
  const all = main.flat();
  const minX = Math.min(...all.map(c => c[0])), maxX = Math.max(...all.map(c => c[0]));
  const minY = Math.min(...all.map(c => c[1])), maxY = Math.max(...all.map(c => c[1]));
  const W = 800, k = W / (maxX - minX), H = Math.ceil((maxY - minY) * k * 1.01);
  const d = main.map(r => 'M' + r.map(([x, y]) => `${((x - minX) * k).toFixed(1)} ${((maxY - y) * k * 1.01).toFixed(1)}`).join('L') + 'Z').join('');
  fs.writeFileSync(path.join(OUT, 'mapa-costa-rica.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${W + 16} ${H + 16}" role="img" aria-label="Silueta de Costa Rica"><path d="${d}" fill="#1b1a18" stroke="#8e867a" stroke-width="1.5" stroke-linejoin="round"/></svg>\n`);
  console.log('mapa-costa-rica.svg');
}
