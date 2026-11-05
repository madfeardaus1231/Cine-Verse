const API='/api/api';let movies=[],categories=[],ads=[];let activeGenre='All',selected=null;
const $=id=>document.getElementById(id);
const saved=()=>JSON.parse(localStorage.getItem('cv-list')||'[]');
function saveList(a){localStorage.setItem('cv-list',JSON.stringify(a));render();}
function artStyle(m){return m.poster?`background-image:linear-gradient(0deg,#000b,transparent 70%),url("${String(m.poster).replaceAll('"','')}")`:`background-image:linear-gradient(145deg,${colorFor(m.title)},#062f39)`;}
function colorFor(s){let h=0;for(const c of String(s||''))h=(h*31+c.charCodeAt(0))%360;return `hsl(${h} 55% 42%)`;}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function card(m){return `<article class="movie-card" data-id="${esc(m.id)}"><div class="poster" style='${artStyle(m)}'><button class="save-dot" data-save="${esc(m.id)}" aria-label="Save ${esc(m.title)}">${saved().includes(m.id)?'✓':'+'}</button><strong>${esc(m.title)}</strong></div><div class="movie-info"><span>${esc(m.year||'')}</span><span>${esc(m.rating||'NR')}</span></div></article>`;}
function render(){
 const q=$('search').value.toLowerCase();let list=movies.filter(m=>(activeGenre==='All'||(m.genre||[]).includes(activeGenre))&&(`${m.title} ${(m.genre||[]).join(' ')} ${m.description||''}`).toLowerCase().includes(q));
 $('movie-grid').innerHTML=list.slice(0,18).map(card).join('')||'<div class="empty">No movies found.</div>';
 $('latest-grid').innerHTML=[...list].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,12).map(card).join('');
 $('my-list').innerHTML=movies.filter(m=>saved().includes(m.id)).map(card).join('')||'<div class="empty">Your list is empty. Tap + on a movie to save it on this device.</div>';
 document.querySelectorAll('.movie-card').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('[data-save]'))return;openMovie(el.dataset.id)}));
 document.querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const id=b.dataset.save;let a=saved();a=a.includes(id)?a.filter(x=>x!==id):[...a,id];saveList(a)}));
}
function adMode(a){return a.displayMode||'standard';}
function adContent(a){
 if(a.type==='banner'&&a.imageUrl)return `<img src="${esc(a.imageUrl)}" alt="${esc(a.name||'Advertisement')}">`;
 if(a.type==='script'&&a.code)return `<iframe class="ad-provider-frame" sandbox="allow-scripts allow-forms allow-popups" referrerpolicy="no-referrer" title="Advertisement" srcdoc="${esc(a.code)}"></iframe>`;
 return `<p>${esc(a.name||'Sponsored advertisement')}</p>`;
}
function adVisitLink(a){return a.url?`<a class="btn ghost" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">Visit sponsor</a>`:'';}
function addInlineAds(){
 const slot=$('ad-slot');if(!slot)return;
 const normal=ads.filter(a=>a.active!==false&&adMode(a)==='standard'&&a.placement==='homepage');
 slot.innerHTML=normal.map(a=>`<section class="ad-card"><span class="ad-label">Advertisement · ${esc(a.name||'Sponsor')}</span>${adContent(a)}${adVisitLink(a)}</section>`).join('');
}
function canShowAgain(a){
 const key='cv-ad-last-'+a.id, last=Number(localStorage.getItem(key)||0), interval=Math.max(0,Number(a.repeatMinutes??60))*60000;
 if(!last)return true;
 if(interval===0)return false;
 return Date.now()-last>=interval;
}
function markAdShown(a){localStorage.setItem('cv-ad-last-'+a.id,String(Date.now()));}
function showAdDialog(a,kind,onContinue){
 const overlay=document.createElement('div');overlay.className='ad-overlay';
 const isPopup=kind==='popup';
 overlay.innerHTML=`<section class="ad-dialog" role="dialog" aria-modal="true" aria-label="Advertisement"><button class="ad-close" type="button" aria-label="Close advertisement">×</button><span class="ad-label">Advertisement</span><h2>${esc(a.name||'Sponsored')}</h2><div class="ad-body">${adContent(a)}</div><div class="ad-actions">${adVisitLink(a)}${isPopup?'<button class="btn primary ad-dismiss" type="button">Close advertisement</button>':'<button class="btn primary ad-continue" type="button">Continue to movie</button>'}</div><p class="ad-note">${isPopup?'You can close this advertisement at any time.':'The movie will continue only when you choose Continue.'}</p></section>`;
 const close=()=>overlay.remove();
 overlay.querySelector('.ad-close').onclick=close;
 const dismiss=overlay.querySelector('.ad-dismiss');if(dismiss)dismiss.onclick=close;
 const cont=overlay.querySelector('.ad-continue');if(cont)cont.onclick=()=>{close();if(onContinue)onContinue();};
 document.body.appendChild(overlay);
}
function showPopup(placement='homepage'){
 const candidates=ads.filter(a=>a.active!==false&&adMode(a)==='popup'&&(a.placement===placement||a.placement==='homepage')&&canShowAgain(a));
 if(!candidates.length)return;
 // Show one popup at a time and rotate among configured popup ads on subsequent visits.
 const index=Number(localStorage.getItem('cv-popup-rotation')||0)%candidates.length;
 const a=candidates[index];localStorage.setItem('cv-popup-rotation',String(index+1));markAdShown(a);
 const delay=Math.max(0,Math.min(3600,Number(a.delaySeconds??5)))*1000;
 window.setTimeout(()=>showAdDialog(a,'popup'),delay);
}
function playSelectedMovie(){
 if(!selected)return;
 if(!selected.videoUrl){$('player-note').textContent='No authorized video source is configured for this title yet.';return;}
 const p=$('player');p.src=selected.videoUrl;p.classList.remove('hidden');p.play().catch(()=>{});localStorage.setItem('cv-progress-'+selected.id,'1');
}
function watchWithAds(){
 if(!selected)return;
 if(!selected.videoUrl){$('player-note').textContent='No authorized video source is configured for this title yet.';return;}
 const clickAd=ads.find(a=>a.active!==false&&adMode(a)==='click'&&canShowAgain(a));
 if(clickAd){markAdShown(clickAd);showAdDialog(clickAd,'click',playSelectedMovie);return;}
 playSelectedMovie();
}
function openMovie(id){
 selected=movies.find(m=>m.id===id);if(!selected)return;
 $('modal-title').textContent=selected.title;
 $('modal-meta').textContent=`${selected.year||''} • ${(selected.genre||[]).join(' / ')} • ${selected.duration||''} • ${selected.language||''}`;
 $('modal-description').textContent=selected.description||'';
 $('modal-art').style.background=selected.backdrop?`linear-gradient(0deg,#0008,transparent),url("${String(selected.backdrop).replaceAll('"','')}") center/cover`:`linear-gradient(120deg,${colorFor(selected.title)},#073c40)`;
 $('player').classList.add('hidden');$('player').pause();$('player').removeAttribute('src');
 $('player-note').textContent='Video playback is available only when an authorized video URL has been added by the site administrator.';
 $('modal-save').textContent=saved().includes(id)?'✓ In My List':'＋ My List';
 $('modal').classList.remove('hidden');
 showPopup('detail');
}
$('close-modal').onclick=()=>$('modal').classList.add('hidden');$('modal').querySelector('.modal-backdrop').onclick=()=>$('modal').classList.add('hidden');
$('modal-save').onclick=()=>{if(!selected)return;let a=saved();a=a.includes(selected.id)?a.filter(x=>x!==selected.id):[...a,selected.id];saveList(a);$('modal-save').textContent=a.includes(selected.id)?'✓ In My List':'＋ My List';};
$('modal-watch').onclick=watchWithAds;
$('search').addEventListener('input',render);
async function init(){
 try{
  const [m,c,s,a]=await Promise.all(['/movies','/categories','/settings','/ads'].map(x=>fetch(API+x).then(r=>r.ok?r.json():Promise.reject())));
  movies=m;categories=c;ads=Array.isArray(a)?a:[];
  $('footer-copy').textContent=s.footerText||s.tagline||'';$('year').textContent=new Date().getFullYear();document.title=(s.siteName||'CineVerse')+' — Discover Movies';
  $('genre-list').innerHTML=['All',...categories].map(g=>`<button class="genre ${g==='All'?'active':''}" data-genre="${esc(g)}">${esc(g)}</button>`).join('');
  document.querySelectorAll('[data-genre]').forEach(b=>b.onclick=()=>{activeGenre=b.dataset.genre;document.querySelectorAll('.genre').forEach(x=>x.classList.toggle('active',x===b));render();});
  const featured=movies.find(m=>m.featured)||movies[0];
  if(featured){$('hero').style.background=featured.backdrop?`linear-gradient(0deg,#080808 0%,#08080844 85%),url("${String(featured.backdrop).replaceAll('"','')}") center/cover`:$('hero').style.background;$('hero-watch').onclick=e=>{e.preventDefault();openMovie(featured.id)};$('hero-list').onclick=()=>{let a=saved();saveList(a.includes(featured.id)?a.filter(x=>x!==featured.id):[...a,featured.id]);};}
  addInlineAds();render();showPopup('homepage');
 }catch(e){$('movie-grid').innerHTML='<div class="empty">The catalog API is not available yet. Deploy the project with Netlify Functions enabled and configure the environment variables.</div>';}
}
init();
