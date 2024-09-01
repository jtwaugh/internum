"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[406],{5406:function(e,t,a){a.r(t),a.d(t,{default:function(){return N}});var s=a(7437),r=a(2265),l=a(7020),n=a.n(l),i=a(1648),o=a(6598),d=a(9354);let c=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsxs)(o.fC,{ref:t,className:(0,d.cn)("relative flex w-full touch-none select-none items-center",a),...r,children:[(0,s.jsx)(o.fQ,{className:"relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",children:(0,s.jsx)(o.e6,{className:"absolute h-full bg-primary"})}),(0,s.jsx)(o.bU,{className:"block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"})]})});c.displayName=o.fC.displayName;var u=a(9733),x=a(698);let f=x.fC,h=x.xz;x.ee;let m=r.forwardRef((e,t)=>{let{className:a,align:r="center",sideOffset:l=4,...n}=e;return(0,s.jsx)(x.h_,{children:(0,s.jsx)(x.VY,{ref:t,align:r,sideOffset:l,className:(0,d.cn)("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",a),...n})})});m.displayName=x.VY.displayName;var p=a(8364);let g=(0,a(2218).j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),b=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(p.f,{ref:t,className:(0,d.cn)(g(),a),...r})});b.displayName=p.f.displayName;let j=r.forwardRef((e,t)=>{let{className:a,type:r,...l}=e;return(0,s.jsx)("input",{type:r,className:(0,d.cn)("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",a),ref:t,...l})});j.displayName="Input";let v=e=>{let[t,a]=(0,r.useState)(e.value);return(0,s.jsxs)("div",{className:"mb-4 flex space-x-2",children:[(0,s.jsx)("div",{className:"flex items-center justify-start w-1/2",children:(0,s.jsx)(b,{className:"items-center text-xs font-semibold",children:e.text})}),(0,s.jsx)("div",{className:"flex items-center justify-end w-1/2",children:(0,s.jsx)("div",{className:"flex items-center space-x-4 resize-none",children:(0,s.jsx)(j,{className:"border leading-tight text-xs",value:t,onChange:t=>{let s=t.target.value.toLowerCase();a(s=s.startsWith("#")?"#"+s.slice(1).replace(/[^0-9a-f]/gi,""):"#"+s.replace(/[^0-9a-f]/gi,"")),/^#[0-9a-f]{6}$/i.test(s)&&e.onChange(s)},placeholder:e.placeholder})})}),(0,s.jsx)("div",{className:"w-[10px] rounded-full border",style:{backgroundColor:t}})]})};var y=e=>{let[t,a]=(0,r.useState)(e.currentGradient[0]),[l,n]=(0,r.useState)(e.currentGradient[1]),[o,d]=(0,r.useState)(e.currentGradient[2]),[c,u]=(0,r.useState)(e.currentGradient[3]);return(0,r.useEffect)(()=>{console.log([t,l,o,c]),e.onChange([t,l,o,c])},[t,l,o,c]),(0,s.jsxs)("div",{children:[(0,s.jsx)(v,{text:"Highlands",value:c,placeholder:i.ob[3],onChange:u}),(0,s.jsx)(v,{text:"Midlands",value:o,placeholder:i.ob[2],onChange:d}),(0,s.jsx)(v,{text:"Lowlands",value:l,placeholder:i.ob[1],onChange:n}),(0,s.jsx)(v,{text:"Water",value:t,placeholder:i.ob[0],onChange:a})]})},N=e=>{let[t,a]=(0,r.useState)(.1),[l,o]=(0,r.useState)(400),[d,x]=(0,r.useState)(.5),[p,g]=(0,r.useState)(1),[j,N]=(0,r.useState)(1),[w,C]=(0,r.useState)(i.ob),[S,k]=(0,r.useState)(i.KT),[z,V]=(0,r.useState)(i.VB);(0,r.useEffect)(()=>{e.onColorsChanged({terrainGradient:w,ambientLight:S,directionalLight:z})},[w,S,z]);let G=e=>{let a=[],s=l/2,r=l/2,n=e.dist(0,0,s,r)*p;for(let i=0;i<l;i++){a[i]=[];for(let o=0;o<l;o++){let l=e.noise(i*t,o*t)-e.dist(i,o,s,r)/n;l=e.constrain(l,0,1),a[i][o]=l<d?0:l}}return a},L=e=>{let t=e,a=e;for(let e=0;e<j;e++){a=t.map(e=>[...e]);for(let e=1;e<l-1;e++)for(let s=1;s<l-1;s++)a[e][s]=(3*t[e][s]+t[e-1][s]+t[e+1][s]+t[e][s-1]+t[e][s+1]+t[e-1][s-1]+t[e-1][s+1]+t[e+1][s-1]+t[e+1][s+1])/11;t=a}return a},M=e=>{let t=Array(l).fill(null).map(()=>Array(l).fill(!1)),a=[{x:l-1,y:0}];for(;a.length>0;){let{x:s,y:r}=a.shift();if(!t[s][r]&&!(e[s][r]>.001))for(let e of(t[s][r]=!0,[{x:s-1,y:r},{x:s+1,y:r},{x:s,y:r-1},{x:s,y:r+1}]))e.x>=0&&e.x<l&&e.y>=0&&e.y<l&&a.push(e)}return t},B=(e,t)=>Math.floor(Math.random()*(t-e+1))+e,E=e=>{let t=e.length,a=[];for(let s=0;s<t;s++)for(let r=0;r<t;r++)e[s][r]>d&&a.push({x:s,y:r});if(0===a.length)throw Error("No land tiles available to place the town square.");let s=B(0,a.length-1),r=a[s];return console.log(r),console.log(e[r.x][r.y]),r},R=(e,t,a,s)=>{let r=e.length,l=t,n=e[t.x][t.y];for(let i=-s;i<=s;i++)if(!(i>-a)||!(i<a))for(let o=-s;o<=s;o++){if(o>-a&&o<a)continue;let s=t.x+i,d=t.y+o;s>=0&&d>=0&&s<r&&d<r&&e[s][d]>n&&(n=e[s][d],l={x:s,y:d})}return l},W=(e,t)=>{let a=M(e),s=e.length,r=null,l=1/0;for(let e=0;e<s;e++)for(let n=0;n<s;n++)if(a[e][n]){let a=Math.abs(e-t.x)+Math.abs(n-t.y);a<l&&(l=a,r={x:e,y:n})}return r};return e.display?(0,s.jsxs)("div",{id:"island-generator-container",tabIndex:1,children:[(0,s.jsx)("div",{className:"p-4 flex justify-center",children:(0,s.jsx)(b,{className:"text-4xl font-extrabold",children:"Demiurge Studio"})}),(0,s.jsxs)("div",{className:"flex bg-primary border-input items-center",children:[(0,s.jsx)("div",{className:"flex w-1/3 p-2",children:(0,s.jsxs)(f,{children:[(0,s.jsx)(h,{asChild:!0,children:(0,s.jsx)(u.z,{variant:"outline",children:"Worldgen Parameters"})}),(0,s.jsxs)(m,{className:"w-80",children:[(0,s.jsx)("div",{children:(0,s.jsxs)("label",{children:[(0,s.jsxs)("span",{className:"p-2 font-bold text-xs",children:["Noise Scale: ",t]}),(0,s.jsx)(c,{className:"p-2",min:.01,max:.3,step:.01,value:[t],onValueChange:e=>a(e[0])})]})}),(0,s.jsx)("div",{children:(0,s.jsxs)("label",{children:[(0,s.jsxs)("span",{className:"p-2 font-bold text-xs",children:["Canvas Size: ",l]}),(0,s.jsx)(c,{className:"p-2",min:200,max:800,step:50,value:[l],onValueChange:e=>o(e[0])})]})}),(0,s.jsx)("div",{children:(0,s.jsxs)("label",{children:[(0,s.jsxs)("span",{className:"p-2 font-bold text-xs",children:["Max Distance Factor: ",p]}),(0,s.jsx)(c,{className:"p-2",min:.5,max:2,step:.1,value:[p],onValueChange:e=>g(e[0])})]})}),(0,s.jsx)("div",{children:(0,s.jsxs)("label",{children:[(0,s.jsxs)("span",{className:"p-2 font-bold text-xs",children:["Threshold: ",d]}),(0,s.jsx)(c,{className:"p-2",min:0,max:1,step:.05,value:[d],onValueChange:e=>x(e[0])})]})}),(0,s.jsx)("div",{children:(0,s.jsxs)("label",{children:[(0,s.jsxs)("span",{className:"p-2 font-bold text-xs",children:["Blur Iterations: ",j]}),(0,s.jsx)(c,{className:"p-2",min:0,max:10,step:1,value:[j],onValueChange:e=>{N(e[0])}})]})})]})]})}),(0,s.jsx)("div",{className:"flex w-1/3 p-2 justify-center",children:(0,s.jsx)(u.z,{className:"pt-6 pb-6 border",style:{backgroundColor:"#0000aa"},onClick:()=>{let t=L(G(new(n())(e=>{}))),a=E(t),s=R(t,a,i.Br,i.ip),r=W(t,a);e.onWorldGenerated({heightmap:t,townSquare:a,temple:s,docks:r})},children:(0,s.jsx)("div",{className:"text-2xl font-extrabold",children:"Generate"})})}),(0,s.jsx)("div",{className:"flex w-1/3 p-2 justify-end",children:(0,s.jsxs)(f,{children:[(0,s.jsx)(h,{asChild:!0,children:(0,s.jsx)(u.z,{variant:"outline",children:"Color Parameters"})}),(0,s.jsxs)(m,{className:"w-80",children:[(0,s.jsx)(v,{text:"Ambient Light",value:S,placeholder:i.KT,onChange:k}),(0,s.jsx)(v,{text:"Directional Light",value:z,placeholder:i.VB,onChange:V}),(0,s.jsxs)(f,{children:[(0,s.jsx)(h,{asChild:!0,children:(0,s.jsxs)("div",{className:"flex space-x-4",children:[(0,s.jsx)("div",{className:"w-1/2 flex justify-start",children:(0,s.jsx)(u.z,{variant:"outline",children:"Gradient"})}),(0,s.jsx)("div",{className:"w-1/2 flex justify-end",children:(0,s.jsx)("div",{className:"aspect-square border rounded-md",style:{background:"linear-gradient(180deg, ".concat(w[3],", ").concat(w[2],", ").concat(w[1],", ").concat(w[0],")")}})})]})}),(0,s.jsx)(m,{children:(0,s.jsx)(y,{currentGradient:w,onChange:e=>{console.log(e),C(e)}})})]})]})]})})]})]}):(0,s.jsx)(s.Fragment,{})}},9733:function(e,t,a){a.d(t,{z:function(){return d}});var s=a(7437),r=a(2265),l=a(1538),n=a(2218),i=a(9354);let o=(0,n.j)("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),d=r.forwardRef((e,t)=>{let{className:a,variant:r,size:n,asChild:d=!1,...c}=e,u=d?l.g7:"button";return(0,s.jsx)(u,{className:(0,i.cn)(o({variant:r,size:n,className:a})),ref:t,...c})});d.displayName="Button"},9354:function(e,t,a){a.d(t,{cn:function(){return l}});var s=a(4839),r=a(6164);function l(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return(0,r.m6)((0,s.W)(t))}}}]);