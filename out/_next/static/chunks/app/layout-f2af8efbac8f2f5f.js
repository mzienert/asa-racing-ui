(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[177],{1220:(e,t,a)=>{Promise.resolve().then(a.t.bind(a,4147,23)),Promise.resolve().then(a.t.bind(a,8489,23)),Promise.resolve().then(a.bind(a,814)),Promise.resolve().then(a.t.bind(a,347,23)),Promise.resolve().then(a.bind(a,8909))},8909:(e,t,a)=>{"use strict";a.d(t,{Providers:()=>w});var r=a(5155),s=a(3391),l=a(8943),n=a(8296),i=a(7588),o=a(5684);let c=(0,l.U1)({reducer:{auth:n.Ay,races:i.Ay,racers:o.Ay},middleware:e=>e({serializableCheck:{}}),devTools:!1});var d=a(2115),m=(e,t,a,r,s,l,n,i)=>{let o=document.documentElement,c=["light","dark"];function d(t){(Array.isArray(e)?e:[e]).forEach(e=>{let a="class"===e,r=a&&l?s.map(e=>l[e]||e):s;a?(o.classList.remove(...r),o.classList.add(t)):o.setAttribute(e,t)}),i&&c.includes(t)&&(o.style.colorScheme=t)}if(r)d(r);else try{let e=localStorage.getItem(t)||a,r=n&&"system"===e?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":e;d(r)}catch(e){}},u=["light","dark"],h="(prefers-color-scheme: dark)",y="undefined"==typeof window,f=d.createContext(void 0),p=e=>d.useContext(f)?d.createElement(d.Fragment,null,e.children):d.createElement(b,{...e}),g=["light","dark"],b=e=>{let{forcedTheme:t,disableTransitionOnChange:a=!1,enableSystem:r=!0,enableColorScheme:s=!0,storageKey:l="theme",themes:n=g,defaultTheme:i=r?"system":"light",attribute:o="data-theme",value:c,children:m,nonce:y,scriptProps:p}=e,[b,N]=d.useState(()=>v(l,i)),[w,k]=d.useState(()=>v(l)),_=c?Object.values(c):n,E=d.useCallback(e=>{let t=e;if(!t)return;"system"===e&&r&&(t=C());let l=c?c[t]:t,n=a?I(y):null,d=document.documentElement,m=e=>{"class"===e?(d.classList.remove(..._),l&&d.classList.add(l)):e.startsWith("data-")&&(l?d.setAttribute(e,l):d.removeAttribute(e))};if(Array.isArray(o)?o.forEach(m):m(o),s){let e=u.includes(i)?i:null,a=u.includes(t)?t:e;d.style.colorScheme=a}null==n||n()},[y]),O=d.useCallback(e=>{let t="function"==typeof e?e(b):e;N(t);try{localStorage.setItem(l,t)}catch(e){}},[b]),A=d.useCallback(e=>{k(C(e)),"system"===b&&r&&!t&&E("system")},[b,t]);d.useEffect(()=>{let e=window.matchMedia(h);return e.addListener(A),A(e),()=>e.removeListener(A)},[A]),d.useEffect(()=>{let e=e=>{e.key===l&&(e.newValue?N(e.newValue):O(i))};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[O]),d.useEffect(()=>{E(null!=t?t:b)},[t,b]);let T=d.useMemo(()=>({theme:b,setTheme:O,forcedTheme:t,resolvedTheme:"system"===b?w:b,themes:r?[...n,"system"]:n,systemTheme:r?w:void 0}),[b,O,t,w,r,n]);return d.createElement(f.Provider,{value:T},d.createElement(S,{forcedTheme:t,storageKey:l,attribute:o,enableSystem:r,enableColorScheme:s,defaultTheme:i,value:c,themes:n,nonce:y,scriptProps:p}),m)},S=d.memo(e=>{let{forcedTheme:t,storageKey:a,attribute:r,enableSystem:s,enableColorScheme:l,defaultTheme:n,value:i,themes:o,nonce:c,scriptProps:u}=e,h=JSON.stringify([r,a,n,t,o,i,s,l]).slice(1,-1);return d.createElement("script",{...u,suppressHydrationWarning:!0,nonce:"undefined"==typeof window?c:"",dangerouslySetInnerHTML:{__html:"(".concat(m.toString(),")(").concat(h,")")}})}),v=(e,t)=>{let a;if(!y){try{a=localStorage.getItem(e)||void 0}catch(e){}return a||t}},I=e=>{let t=document.createElement("style");return e&&t.setAttribute("nonce",e),t.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(t),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(t)},1)}},C=e=>(e||(e=window.matchMedia(h)),e.matches?"dark":"light");function N(e){let{children:t,...a}=e,[s,l]=d.useState(!1);return(d.useEffect(()=>{l(!0)},[]),s)?(0,r.jsx)(p,{...a,children:t}):(0,r.jsx)("div",{style:{visibility:"hidden"},children:t})}function w(e){let{children:t}=e;return(0,r.jsx)(s.Kq,{store:c,children:(0,r.jsx)(N,{attribute:"class",defaultTheme:"system",enableSystem:!0,disableTransitionOnChange:!0,children:t})})}},8296:(e,t,a)=>{"use strict";a.d(t,{Ay:()=>n,gV:()=>s,ri:()=>l});let r=(0,a(8943).Z0)({name:"auth",initialState:{isAuthenticated:!1,user:null},reducers:{setUser:(e,t)=>{e.user=t.payload,e.isAuthenticated=!!t.payload},logout:e=>{e.user=null,e.isAuthenticated=!1}}}),{setUser:s,logout:l}=r.actions,n=r.reducer},5684:(e,t,a)=>{"use strict";a.d(t,{Ay:()=>o,G6:()=>s,Wk:()=>i,aJ:()=>n,gj:()=>l});var r=a(8943);let s=(0,r.zD)("racers/loadFromStorage",async()=>{let e=localStorage.getItem("racers");return e?JSON.parse(e):{}}),l=(0,r.zD)("racers/persistRacer",async(e,t)=>{let{rejectWithValue:a}=t,r=localStorage.getItem("racers"),s=r?JSON.parse(r):{},l=Object.values(s).flat().find(t=>t.bibNumber===e.bibNumber);if(l)return a({message:"Duplicate bib number",existingRacer:l});s[e.classId]||(s[e.classId]=[]);let n={...e,id:crypto.randomUUID(),position:s[e.classId].length+1};return s[e.classId].push(n),localStorage.setItem("racers",JSON.stringify(s)),n}),n=(0,r.zD)("racers/updatePersistedRacer",async e=>{var t;let a=localStorage.getItem("racers"),r=a?JSON.parse(a):{},s=null===(t=r[e.classId])||void 0===t?void 0:t.findIndex(t=>t.id===e.id);return void 0!==s&&-1!==s&&(r[e.classId][s]=e,localStorage.setItem("racers",JSON.stringify(r))),e}),i=(0,r.zD)("racers/deletePersistedRacer",async e=>{let{id:t,classId:a}=e,r=localStorage.getItem("racers"),s=r?JSON.parse(r):{};return s[a]=s[a].filter(e=>e.id!==t),localStorage.setItem("racers",JSON.stringify(s)),{id:t,classId:a}}),o=(0,r.Z0)({name:"racers",initialState:{racers:{}},reducers:{},extraReducers:e=>{e.addCase(s.fulfilled,(e,t)=>{e.racers=t.payload}).addCase(l.fulfilled,(e,t)=>{let{classId:a}=t.payload;e.racers[a]||(e.racers[a]=[]),e.racers[a].push(t.payload)}).addCase(n.fulfilled,(e,t)=>{var a;let{id:r,classId:s}=t.payload,l=null===(a=e.racers[s])||void 0===a?void 0:a.findIndex(e=>e.id===r);void 0!==l&&-1!==l&&(e.racers[s][l]=t.payload)}).addCase(i.fulfilled,(e,t)=>{let{id:a,classId:r}=t.payload;e.racers[r]=e.racers[r].filter(e=>e.id!==a)})}}).reducer},7588:(e,t,a)=>{"use strict";a.d(t,{Ay:()=>i,QX:()=>n,aR:()=>s,qp:()=>l});var r=a(8943);let s=(0,r.zD)("races/loadFromStorage",async()=>{let e=localStorage.getItem("races");return e?JSON.parse(e):[]}),l=(0,r.zD)("races/persistRace",async e=>{let t={...e,id:crypto.randomUUID()},a=localStorage.getItem("races"),r=a?JSON.parse(a):[];return r.push(t),localStorage.setItem("races",JSON.stringify(r)),t}),n=(0,r.zD)("races/updatePersistedRace",async e=>{let t=localStorage.getItem("races"),a=t?JSON.parse(t):[];return a=a.map(t=>t.id===e.id?e:t),localStorage.setItem("races",JSON.stringify(a)),e}),i=(0,r.Z0)({name:"races",initialState:[],reducers:{},extraReducers:e=>{e.addCase(s.fulfilled,(e,t)=>t.payload).addCase(l.fulfilled,(e,t)=>{e.push(t.payload)}).addCase(n.fulfilled,(e,t)=>{let a=e.findIndex(e=>e.id===t.payload.id);-1!==a&&(e[a]=t.payload)})}}).reducer},347:()=>{},4147:e=>{e.exports={style:{fontFamily:"'Geist', 'Geist Fallback'",fontStyle:"normal"},className:"__className_4d318d",variable:"__variable_4d318d"}},8489:e=>{e.exports={style:{fontFamily:"'Geist Mono', 'Geist Mono Fallback'",fontStyle:"normal"},className:"__className_ea5f4b",variable:"__variable_ea5f4b"}}},e=>{var t=t=>e(e.s=t);e.O(0,[896,505,814,441,517,358],()=>t(1220)),_N_E=e.O()}]);