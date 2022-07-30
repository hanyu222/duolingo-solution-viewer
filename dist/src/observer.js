!function(){"use strict";const e=()=>{},t=e=>"number"==typeof e&&Number.isFinite(e),n=e=>"string"==typeof e,a=Array.isArray,l=e=>"object"==typeof e&&!!e&&!a(e),o=e=>"function"==typeof e,s=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),i=e=>{for(let t in e)if(s(e,t))return!1;return!0},r=e=>{let t=null;if("/"===e.charAt(0)&&("/"===e.charAt(1)?e=`https://${e}`:t=e),null===t)try{t=new URL(e).pathname}catch(n){t=e}return t},u=e=>`__duo-toolbox__-${e}`,d=u("global_variables"),c=(e,t)=>(l(window[d])||(window[d]={}),s(window[d],e)?window[d][e]:t),p=(e,t)=>{l(window[d])||(window[d]={}),window[d][e]=t},v=(e,t,n)=>{const a=t(c(e,n));return p(e,a),a},f=u("original_function"),g=u("override_version"),_=(t,n,a,i=1)=>((e,t,n,a,l=1)=>{s(window,e)&&t(window[e])?n(window[e]):v("pending_global_listeners",((o={})=>{var s;if(!o[e]){o[e]={};let n=window[e];Object.defineProperty(window,e,{get:()=>n,set:a=>{t(a)?(Object.defineProperty(window,e,{value:a,configurable:!0,enumerable:!0,writable:!0}),Object.values(o[e]).forEach((e=>e.callback(a)))):n=a},configurable:!0})}return l>(Number(null===(s=o[e][a])||void 0===s?void 0:s.version)||0)&&(o[e][a]={callback:n,version:l}),o}))})(t,o,(t=>((t,n,a,o=1)=>{var s;if(l(t)&&o>(Number(null===(s=t[n])||void 0===s?void 0:s[g])||0)){var i;const l=(null===(i=t[n])||void 0===i?void 0:i[f])||t[n]||e;t[n]=a(l),t[n][f]=l,t[n][g]=o}})(null==t?void 0:t.prototype,n,a,i)),`instance_method:${n}`,i),m=u("logging_iframe"),h=u("ui_event_notification"),y=(e,t)=>{window.postMessage({type:h,event:e,value:t},"*")},b=()=>(()=>{let e=document.getElementById(m);return e&&e.isConnected||(e=document.createElement("iframe"),e.id=m,e.style.display="none",document.body.appendChild(e)),e})().contentWindow.console,w=(...e)=>b().error(...e),O=["characterIntro","characterMatch","characterPuzzle","characterSelect","characterTrace","selectPronunciation","selectTranscription"],k=e=>{var t,n;return(null===(t=e.metadata)||void 0===t?void 0:t.source_language)||e.sourceLanguage||(null===(n=e.metadata)||void 0===n?void 0:n.learning_language)},x=e=>{var t;return(null===(t=e.metadata)||void 0===t?void 0:t.target_language)||e.targetLanguage||k(e)},K="effect",$="tts_sentence",V="tts_word",j="tts_morpheme",L="unknown",M="normal",T="slow",N="howler",q="rate",E="volume",P=u("forced_setting"),S=e=>l(e)&&!!e[P],C=e=>e.value,R=e=>({[P]:!0,value:e}),A=(e,n)=>q===e&&t(n)||E===e&&n>=0&&n<=1,I=(e,n)=>((e,t,n,a=1)=>{if(!l(e))return;const o=u(`${t}_override_version`);a>(Number(e[o])||0)&&Object.defineProperty(e,t,n(Object.getOwnPropertyDescriptor(e,t)))})(HTMLMediaElement,n,(n=>({...n,set:function(a){const l=U[e];t(a)?(this[l.originalValueKey]=a,s(this,l.valueKey)&&(a=this[l.isRelativeKey]?D(e,a*this[l.valueKey]):this[l.valueKey])):S(a)&&(a=C(a)),t(a)&&(this[l.listenerValueKey]=a),n.set.call(this,a)}}))),H=(e,t)=>_("Howl",t,(n=>function(){const a=this,l=arguments,o=U[e];let i=!1;const r=a._queue.length;(1===l.length||2===l.length&&void 0===l[1])&&-1===a._getSoundIds().indexOf(l[0])&&(S(l[0])?(i=!0,l[0]=C(l[0])):A(e,l[0])&&(a[o.originalValueKey]=l[0],s(a,o.valueKey)&&(i=!0,a[o.isRelativeKey]?l[0]=D(e,l[0]*a[o.valueKey]):l[0]=a[o.valueKey])),i&&(a[o.listenerValueKey]=l[0]));const u=n.apply(a,arguments);return i&&r<a._queue.length&&(a._queue[a._queue.length-1].action=function(){l[0]=R(l[0]),a[t](...l)}),u})),z=(e,t,n,a)=>({...a,functions:{audio:{applyOverride:()=>I(e,n),getter:e=>e[t],setter:(e,n)=>e[t]=n,hasQueuedUpdate:()=>!1},[N]:{applyOverride:()=>H(e,n),getter:e=>e[n](),setter:(e,t)=>e[n](t),hasQueuedUpdate:e=>e._queue.find((e=>e.event===n))}},priorityKey:u(`${e}_priority`),isRelativeKey:u(`${e}_is_relative`),valueKey:u(`forced_${e}_value`),originalValueKey:u(`original_${e}_value`),listenerValueKey:u(`${e}_value`)}),U={[q]:z(q,"playbackRate","rate",{minValue:.5,maxValue:4,defaultValue:1}),[E]:z(E,"volume","volume",{minValue:0,maxValue:1,defaultValue:1})},D=(e,t)=>U[e]?Math.max(U[e].minValue,Math.min(t,U[e].maxValue)):t,Q="event_listeners",X=()=>{return`__listener::${e="last_event_listener_id",v(`__counter::${e}__`,(e=>e+1),0)}__`;var e},B=e=>{var t;return(null===(t=c(Q,{}))||void 0===t?void 0:t[e])||{}},F=(e,t)=>{v(Q,(n=>Object.assign(n||{},{[e]:t})))},J=e=>!i(B(e)),W=(e,t)=>{const n=B(e);return i(n)?null:t(Object.values(n))},G=(e,t,n=X())=>{const a=B(e);return a[n]=t,F(e,a),()=>Z(e,n)},Y=(e,t,n,l,o=G,s=X())=>{const i=`__${t}::${e}__`;var r;r=i,B(t)[r]||o(t,((...t)=>{const n=l(...t);a(n)&&ee(e,...n)}),i);const u=G(e,n,s);return()=>{u(),J(e)||Z(t,i)}},Z=(e,t)=>{const n=B(e);delete n[t],F(e,n)},ee=(e,...t)=>W(e,(e=>e.flatMap((e=>{try{return[e(...t)]}catch(e){return[]}})))),te="practice_session_loaded",ne="story_loaded",ae="alphabets_loaded",le="forum_discussion_loaded",oe="dictionary_lexeme_loaded",se="sound_playback_requested",ie="sound_playback_confirmed",re="sound_playback_cancelled",ue={[ae]:/\/[\d]{4}-[\d]{2}-[\d]{2}\/alphabets\/courses\/(?<toLanguage>[^/]+)\/(?<fromLanguage>[^/?]+)\/?/g,[oe]:/\/api\/1\/dictionary_page/g,[le]:/\/comments\/([\d]+)/g,[te]:/\/[\d]{4}-[\d]{2}-[\d]{2}\/sessions/g,[ne]:/\/api2\/stories/g,user_data_loaded:/\/[\d]{4}-[\d]{2}-[\d]{2}\/users\/[\d]+/g},de=(e,t,n=X())=>(_("XMLHttpRequest","open",(e=>function(t,n,a,o,s){let i,r;for(const[e,t]of Object.entries(ue))if(r=Array.from(n.matchAll(t))[0],r){i=e;break}return i&&W(i,(e=>{this.addEventListener("load",(()=>{try{const t=l(this.response)?this.response:JSON.parse(this.responseText);e.forEach((e=>e(t,r.groups||{})))}catch(e){w(e,`Could not handle the XHR result (event: ${i}): `)}}))})),e.call(this,t,n,a,o,s)}),2),G(e,t,n)),ce=e=>de(le,e),pe=e=>Y("practice_challenges_loaded",te,e,(e=>{let t;if(l(e)){var n;t=[{challenges:[e.challenges,e.adaptiveChallenges,null===(n=e.adaptiveInterleavedChallenges)||void 0===n?void 0:n.challenges].filter(a).flat(),sessionMetaData:e.metadata||{}}]}return t}),de),ve=(e,t)=>({url:e,type:$,speed:M,language:t}),fe=(e,t)=>({url:e,type:V,speed:M,language:t}),ge=(e,t)=>({url:e,type:j,speed:M,language:t}),_e=Object.fromEntries(["/sounds/7abe057dc8446ad325229edd6d8fd250.mp3","/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3","/sounds/421d48c53ad6d52618dba715722278e0.mp3","/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3","/sounds/0a27c1ee63dd220647e8410a0029aed2.mp3","/sounds/a28ff0a501ef5f33ca78c0afc45ee53e.mp3","/sounds/2e4669d8cf839272f0731f8afa488caf.mp3","/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3"].map((e=>{return[e,(t=e,{url:t,type:K,speed:M,language:null})];var t}))),me=/\/duolingo-data\/tts\/(?<language>[a-z-_]+)\/token\//i,he="sound_type_map",ye=()=>c(he,_e),be=[L,$,V,j,K],we=[M,T],Oe=(e,t)=>((e,t,n)=>{for(const a of e){const e=Number(a(t,n));if(!isNaN(e)&&0!==e)return e}return 0})([(e,t)=>be.indexOf(e.type)-be.indexOf(t.type),(e,t)=>we.indexOf(e.speed)-we.indexOf(t.speed)],e,t),ke=e=>{const t=ye()||{};for(const n of e){const e=r(n.url);(!t[e]||Oe(n,t[e])>0)&&(t[e]=n)}p(he,t)},xe="sound_detection_listeners_version",Ke="sound_detection_unregistration_callbacks",$e=(e,t,n)=>{var a;return{url:e.url,type:t,speed:(null===(a=e.speed)||void 0===a?void 0:a.value)||M,language:n}},Ve=()=>{const e=2<=(Number(c(xe))||0);var t,o,s,i;!!c(Ke)&&e||(e||je(),p(xe,2),p(Ke,[(i=e=>(e=>{const t=e.learningLanguage;a(null==e?void 0:e.elements)&&ke(e.elements.map((e=>{var t;return(null==e||null===(t=e.line)||void 0===t?void 0:t.content)||(null==e?void 0:e.learningLanguageTitleContent)})).flatMap((e=>[null==e?void 0:e.audio,null==e?void 0:e.audioPrefix,null==e?void 0:e.audioSuffix])).map((e=>null==e?void 0:e.url)).filter(n).map((e=>ve(e,t))))})(e),de(ne,i)),(o=(e,t)=>((e,t)=>{const l=t.toLanguage;a(null==e?void 0:e.alphabets)&&n(null==t?void 0:t.toLanguage)&&ke(e.alphabets.flatMap((e=>null==e?void 0:e.groups)).flatMap((e=>null==e?void 0:e.characters)).flat().map((e=>null==e?void 0:e.ttsUrl)).filter(n).map((e=>ge(e,l))))})(e,t),de(ae,o,s)),ce((e=>{var t;n(null==(t=e)?void 0:t.tts_url)&&ke([ve(t.tts_url,t.sentence_language)])})),(t=e=>(e=>{const t=[],l=e.learning_language;n(e.tts)&&t.push(fe(e.tts,l)),a(e.alternative_forms)&&t.push(e.alternative_forms.map((e=>null==e?void 0:e.tts)).filter(n).map((e=>ve(e,l)))),ke(t.flat())})(e),de(oe,t)),pe((e=>(e=>{const t=[];for(const r of e){var o;const e=r.type,u=k(r),d=x(r);if(n(r.tts)){const n=O.indexOf(e)>=0?ge:ve;t.push(n(r.tts,u))}if(n(r.slowTts)&&t.push({url:r.slowTts,type:$,speed:T,language:u}),n(r.solutionTts)&&t.push(ve(r.solutionTts,d)),a(r.choices)){const a=-1===O.indexOf(e)?fe:ge;t.push(r.choices.map((e=>null==e?void 0:e.tts)).filter(n).map((e=>a(e,d))))}if(a(r.tokens)&&t.push(r.tokens.map((e=>null==e?void 0:e.tts)).filter(n).map((e=>fe(e,u)))),a(r.questionTokens)&&t.push(r.questionTokens.map((e=>null==e?void 0:e.tts)).filter(n).map((e=>fe(e,d)))),a(null===(o=r.metadata)||void 0===o?void 0:o.speakers))for(const e of r.metadata.speakers){var s,i;l(null===(s=e.tts)||void 0===s?void 0:s.tokens)&&t.push(Object.values(e.tts.tokens).filter((e=>n(e.url))).map((e=>$e(e,V,d)))),a(null===(i=e.tts)||void 0===i?void 0:i.sentence)&&t.push(e.tts.sentence.filter((e=>n(e.url))).map((e=>$e(e,$,d))))}if(a(r.pairs)){const a=-1===O.indexOf(e)?fe:ge;t.push(r.pairs.map((e=>null==e?void 0:e.tts)).filter(n).map((e=>a(e,d))))}a(r.options)&&t.push(r.options.map((e=>null==e?void 0:e.tts)).filter(n).map((e=>fe(e,d))))}ke(t.flat())})(e.challenges)))]))},je=()=>{const e=c(Ke);!a(e)||J("sound_initialized")||J(se)||J(re)||J(ie)||(e.forEach((e=>e())),p(xe,null),p(Ke,null))},Le=(e,t,n)=>{const a=(e=>{const t=ye()[e];if(l(t))return t;const n=e.match(me);return n?fe(e,n.language):null})(r(t));return{url:t,type:(null==a?void 0:a.type)||L,speed:(null==a?void 0:a.speed)||M,language:null==a?void 0:a.language,playbackStrategy:n,sound:e}},Me=(e,t)=>{_("Howl","play",(e=>function(t){var n;p("is_howler_used",!0);const a=String(this._src||(null===(n=this._parent)||void 0===n?void 0:n._src)||"").trim();return""!==a?((e,t,n,a)=>{const l=Le(e,t,n);let o=!1;try{var s;o=null===(s=ee(se,l))||void 0===s?void 0:s.some((e=>!1===e)),ee(o?re:ie,l)}catch(e){w(e,`Could not handle playback for sound "${t}" (using "${n}"): `)}return o?null:a()})(this,a,N,(()=>e.call(this,t))):e.call(this,t)})),Ve();const n=G(e,t);return()=>{n(),je()}};pe((e=>y("session_loaded",e))),ce((e=>{e.id>0&&e.sentence_id&&e.translation_language&&y("discussion_loaded",{commentId:Number(e.id),discussionId:String(e.sentence_id).trim(),locale:String(e.translation_language).trim()})})),Me(se,(e=>y("sound_played",null==e?void 0:e.url)))}();
