function t(){}function n(t){return t()}function e(){return Object.create(null)}function o(t){t.forEach(n)}function r(t){return"function"==typeof t}function u(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function c(t,n){t.appendChild(n)}function s(t,n,e){t.insertBefore(n,e||null)}function a(t){t.parentNode.removeChild(t)}function i(t){return document.createElement(t)}function f(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function l(t){return document.createTextNode(t)}function d(){return l(" ")}function p(t,n,e,o){return t.addEventListener(n,e,o),()=>t.removeEventListener(n,e,o)}function h(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function m(t){return Array.from(t.childNodes)}function $(t,n,e,o){for(let r=0;r<t.length;r+=1){const o=t[r];if(o.nodeName===n){let n=0;const u=[];for(;n<o.attributes.length;){const t=o.attributes[n++];e[t.name]||u.push(t.name)}for(let t=0;t<u.length;t++)o.removeAttribute(u[t]);return t.splice(r,1)[0]}}return o?f(n):i(n)}function g(t,n){for(let e=0;e<t.length;e+=1){const o=t[e];if(3===o.nodeType)return o.data=""+n,t.splice(e,1)[0]}return l(n)}function b(t){return g(t," ")}function y(t,n){n=""+n,t.wholeText!==n&&(t.data=n)}function _(t,n,e,o){t.style.setProperty(n,e,o?"important":"")}let x;function w(t){x=t}function v(t){(function(){if(!x)throw new Error("Function called outside component initialization");return x})().$$.on_mount.push(t)}const E=[],k=[],A=[],N=[],j=Promise.resolve();let S=!1;function O(t){A.push(t)}let T=!1;const q=new Set;function C(){if(!T){T=!0;do{for(let t=0;t<E.length;t+=1){const n=E[t];w(n),L(n.$$)}for(w(null),E.length=0;k.length;)k.pop()();for(let t=0;t<A.length;t+=1){const n=A[t];q.has(n)||(q.add(n),n())}A.length=0}while(E.length);for(;N.length;)N.pop()();S=!1,T=!1,q.clear()}}function L(t){if(null!==t.fragment){t.update(),o(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(O)}}const P=new Set;function z(t,n){t&&t.i&&(P.delete(t),t.i(n))}function B(t,n,e,o){if(t&&t.o){if(P.has(t))return;P.add(t),undefined.c.push((()=>{P.delete(t),o&&(e&&t.d(1),o())})),t.o(n)}}function F(t){t&&t.c()}function M(t,n){t&&t.l(n)}function D(t,e,u,c){const{fragment:s,on_mount:a,on_destroy:i,after_update:f}=t.$$;s&&s.m(e,u),c||O((()=>{const e=a.map(n).filter(r);i?i.push(...e):o(e),t.$$.on_mount=[]})),f.forEach(O)}function G(t,n){const e=t.$$;null!==e.fragment&&(o(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function H(t,n){-1===t.$$.dirty[0]&&(E.push(t),S||(S=!0,j.then(C)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function I(n,r,u,c,s,i,f=[-1]){const l=x;w(n);const d=n.$$={fragment:null,ctx:null,props:i,update:t,not_equal:s,bound:e(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(l?l.$$.context:r.context||[]),callbacks:e(),dirty:f,skip_bound:!1};let p=!1;if(d.ctx=u?u(n,r.props||{},((t,e,...o)=>{const r=o.length?o[0]:e;return d.ctx&&s(d.ctx[t],d.ctx[t]=r)&&(!d.skip_bound&&d.bound[t]&&d.bound[t](r),p&&H(n,t)),e})):[],d.update(),p=!0,o(d.before_update),d.fragment=!!c&&c(d.ctx),r.target){if(r.hydrate){const t=m(r.target);d.fragment&&d.fragment.l(t),t.forEach(a)}else d.fragment&&d.fragment.c();r.intro&&z(n.$$.fragment),D(n,r.target,r.anchor,r.customElement),C()}w(l)}class J{$destroy(){G(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(t){var n;this.$$set&&(n=t,0!==Object.keys(n).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}export{J as S,c as a,f as b,d as c,$ as d,i as e,m as f,a as g,b as h,I as i,g as j,h as k,_ as l,s as m,y as n,t as o,F as p,M as q,D as r,u as s,l as t,z as u,B as v,G as w,v as x,p as y};