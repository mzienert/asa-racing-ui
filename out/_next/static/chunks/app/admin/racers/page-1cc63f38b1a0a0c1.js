(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[17],{5510:(e,r,s)=>{Promise.resolve().then(s.bind(s,680))},680:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>u});var a=s(5155),t=s(5684),l=s(7368),i=s(2115),n=s(3391),d=s(9749),c=s(814);let o=e=>{let{classId:r,editRacer:s,onCancelEdit:l}=e,d=(0,n.wA)(),[o,u]=(0,i.useState)((null==s?void 0:s.name)||""),[f,m]=(0,i.useState)((null==s?void 0:s.bibNumber)||"");(0,i.useEffect)(()=>{s&&(u(s.name),m(s.bibNumber))},[s]);let p=async e=>{if(e.preventDefault(),s)d((0,t.aJ)({...s,name:o,bibNumber:f,classId:r})),c.o.success("Updated ".concat(o," with bib #").concat(f)),null==l||l();else{let e=await d((0,t.gj)({name:o,bibNumber:f,classId:r}));if("racers/persistRacer/rejected"===e.type){let r=e.payload;c.o.error("Bib #".concat(f," is already assigned to ").concat(r.existingRacer.name))}else c.o.success("Added ".concat(o," with bib #").concat(f))}u(""),m("")};return(0,a.jsx)("form",{onSubmit:p,className:"mt-4",children:(0,a.jsxs)("div",{className:"flex gap-2",children:[(0,a.jsx)("input",{type:"text",value:f,onChange:e=>m(e.target.value),placeholder:"Bib",maxLength:3,className:"flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"}),(0,a.jsx)("input",{type:"text",value:o,onChange:e=>u(e.target.value),placeholder:"Racer Name",className:"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"}),(0,a.jsx)("button",{type:"submit",className:"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2",children:s?"Update Racer":"Add Racer"}),s&&(0,a.jsx)("button",{type:"button",onClick:()=>{u(""),m(""),null==l||l()},className:"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2",children:"Cancel"})]})})},u=()=>{let e=(0,n.wA)(),[r,s]=(0,i.useState)(null),u=(0,n.d4)(l.G0),f=(0,n.d4)(l.Kq),m=(0,n.d4)(e=>{let r={};return f.forEach(s=>{r[s]=(0,l.Gv)(e,s)}),r});return((0,i.useEffect)(()=>{e((0,t.G6)())},[e]),u)?(0,a.jsxs)("div",{children:[(0,a.jsx)("h1",{className:"text-3xl font-bold mb-6",children:"Racer Management"}),(0,a.jsx)("div",{className:"space-y-6",children:f.map(l=>{var i;return(0,a.jsxs)(d.Zp,{children:[(0,a.jsx)(d.aR,{children:(0,a.jsx)("h2",{className:"text-2xl font-semibold",children:l})}),(0,a.jsx)(d.Wu,{children:(0,a.jsxs)("div",{className:"space-y-4",children:[null===(i=m[l])||void 0===i?void 0:i.map(l=>(0,a.jsxs)("div",{className:"flex items-center justify-between p-2 rounded transition-colors\n                      ".concat((null==r?void 0:r.id)===l.id?"bg-primary/5 border border-primary/20":"bg-gray-50"),children:[(0,a.jsxs)("div",{className:"flex items-center gap-4",children:[(0,a.jsxs)("span",{className:"font-medium",children:["#",l.bibNumber]}),(0,a.jsx)("span",{children:l.name})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)("button",{onClick:()=>s(l),className:"p-2 rounded-full transition-colors\n                          ".concat((null==r?void 0:r.id)===l.id?"bg-primary/10 hover:bg-primary/20":"hover:bg-gray-200"),children:(0,a.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:(null==r?void 0:r.id)===l.id?"text-primary":"",children:(0,a.jsx)("path",{d:"M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"})})}),(0,a.jsx)("button",{onClick:()=>{e((0,t.Wk)({id:l.id,classId:l.classId})),c.o.success("Removed ".concat(l.name," with bib #").concat(l.bibNumber))},className:"p-2 rounded-full transition-colors hover:bg-red-100",children:(0,a.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:"text-red-500",children:[(0,a.jsx)("path",{d:"M3 6h18"}),(0,a.jsx)("path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}),(0,a.jsx)("path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"})]})})]})]},l.id)),(0,a.jsx)(o,{classId:l,editRacer:(null==r?void 0:r.classId)===l?r:null,onCancelEdit:()=>s(null)})]})})]},l)})})]}):(0,a.jsxs)("div",{children:[(0,a.jsx)("h1",{className:"text-3xl font-bold mb-6",children:"Racer Management"}),(0,a.jsx)("div",{className:"space-y-4",children:(0,a.jsx)(d.Zp,{children:(0,a.jsxs)("div",{className:"flex flex-col",children:[(0,a.jsx)(d.aR,{children:(0,a.jsx)("p",{className:"text-muted-foreground",children:"Manage your racers here."})}),(0,a.jsx)(d.Wu,{className:"flex flex-col items-center",children:(0,a.jsx)("p",{className:"text-muted-foreground",children:"Please create a race first"})})]})})})]})}},5684:(e,r,s)=>{"use strict";s.d(r,{Ay:()=>d,G6:()=>t,Wk:()=>n,aJ:()=>i,gj:()=>l});var a=s(8943);let t=(0,a.zD)("racers/loadFromStorage",async()=>{let e=localStorage.getItem("racers");return e?JSON.parse(e):{}}),l=(0,a.zD)("racers/persistRacer",async(e,r)=>{let{rejectWithValue:s}=r,a=localStorage.getItem("racers"),t=a?JSON.parse(a):{},l=Object.values(t).flat().find(r=>r.bibNumber===e.bibNumber);if(l)return s({message:"Duplicate bib number",existingRacer:l});t[e.classId]||(t[e.classId]=[]);let i={...e,id:crypto.randomUUID(),position:t[e.classId].length+1};return t[e.classId].push(i),localStorage.setItem("racers",JSON.stringify(t)),i}),i=(0,a.zD)("racers/updatePersistedRacer",async e=>{var r;let s=localStorage.getItem("racers"),a=s?JSON.parse(s):{},t=null===(r=a[e.classId])||void 0===r?void 0:r.findIndex(r=>r.id===e.id);return void 0!==t&&-1!==t&&(a[e.classId][t]=e,localStorage.setItem("racers",JSON.stringify(a))),e}),n=(0,a.zD)("racers/deletePersistedRacer",async e=>{let{id:r,classId:s}=e,a=localStorage.getItem("racers"),t=a?JSON.parse(a):{};return t[s]=t[s].filter(e=>e.id!==r),localStorage.setItem("racers",JSON.stringify(t)),{id:r,classId:s}}),d=(0,a.Z0)({name:"racers",initialState:{racers:{}},reducers:{},extraReducers:e=>{e.addCase(t.fulfilled,(e,r)=>{e.racers=r.payload}).addCase(l.fulfilled,(e,r)=>{let{classId:s}=r.payload;e.racers[s]||(e.racers[s]=[]),e.racers[s].push(r.payload)}).addCase(i.fulfilled,(e,r)=>{var s;let{id:a,classId:t}=r.payload,l=null===(s=e.racers[t])||void 0===s?void 0:s.findIndex(e=>e.id===a);void 0!==l&&-1!==l&&(e.racers[t][l]=r.payload)}).addCase(n.fulfilled,(e,r)=>{let{id:s,classId:a}=r.payload;e.racers[a]=e.racers[a].filter(e=>e.id!==s)})}}).reducer},7368:(e,r,s)=>{"use strict";s.d(r,{G0:()=>t,Gv:()=>n,Is:()=>l,Kq:()=>i,tT:()=>d});var a=s(4399);let t=e=>e.races.some(e=>!1===e.completed),l=e=>e.races.find(e=>!1===e.completed),i=e=>{let r=l(e);return(null==r?void 0:r.raceClasses)||[]},n=(e,r)=>e.racers.racers[r]||[],d=(0,a.Mz)([i,e=>e],(e,r)=>e.reduce((e,s)=>({...e,[s]:n(r,s)}),{}))},9749:(e,r,s)=>{"use strict";s.d(r,{Wu:()=>c,ZB:()=>d,Zp:()=>i,aR:()=>n});var a=s(5155),t=s(2115),l=s(1567);let i=t.forwardRef((e,r)=>{let{className:s,...t}=e;return(0,a.jsx)("div",{ref:r,className:(0,l.cn)("rounded-xl border bg-card text-card-foreground shadow",s),...t})});i.displayName="Card";let n=t.forwardRef((e,r)=>{let{className:s,...t}=e;return(0,a.jsx)("div",{ref:r,className:(0,l.cn)("flex flex-col space-y-1.5 p-6",s),...t})});n.displayName="CardHeader";let d=t.forwardRef((e,r)=>{let{className:s,...t}=e;return(0,a.jsx)("div",{ref:r,className:(0,l.cn)("font-semibold leading-none tracking-tight",s),...t})});d.displayName="CardTitle",t.forwardRef((e,r)=>{let{className:s,...t}=e;return(0,a.jsx)("div",{ref:r,className:(0,l.cn)("text-sm text-muted-foreground",s),...t})}).displayName="CardDescription";let c=t.forwardRef((e,r)=>{let{className:s,...t}=e;return(0,a.jsx)("div",{ref:r,className:(0,l.cn)("p-6 pt-0",s),...t})});c.displayName="CardContent",t.forwardRef((e,r)=>{let{className:s,...t}=e;return(0,a.jsx)("div",{ref:r,className:(0,l.cn)("flex items-center p-6 pt-0",s),...t})}).displayName="CardFooter"},1567:(e,r,s)=>{"use strict";s.d(r,{cn:()=>l});var a=s(3463),t=s(9795);function l(){for(var e=arguments.length,r=Array(e),s=0;s<e;s++)r[s]=arguments[s];return(0,t.QP)((0,a.$)(r))}}},e=>{var r=r=>e(e.s=r);e.O(0,[505,181,399,814,441,517,358],()=>r(5510)),_N_E=e.O()}]);