const gridEl=document.getElementById('grid');
const emptyEl=document.getElementById('empty');
const addPinBtn=document.getElementById('addPinBtn');
const addModal=document.getElementById('addModal');
const closeAdd=document.getElementById('closeAdd');
const addForm=document.getElementById('addForm');
const imgUrl=document.getElementById('imgUrl');
const imgTitle=document.getElementById('imgTitle');
const imgLink=document.getElementById('imgLink');
const viewModal=document.getElementById('viewModal');
const closeView=document.getElementById('closeView');
const viewImg=document.getElementById('viewImg');
const viewTitle=document.getElementById('viewTitle');
const viewLink=document.getElementById('viewLink');
const searchInput=document.getElementById('searchInput');
const themeToggle=document.getElementById('themeToggle');
const allPinsBtn=document.getElementById('allPinsBtn');
const likedPinsBtn=document.getElementById('likedPinsBtn');
const savedPinsBtn=document.getElementById('savedPinsBtn');

let pins=[], currentView='all', scale=1,isDragging=false,startX=0,startY=0,originX=0,originY=0;

function loadPins(){ try{ pins=JSON.parse(localStorage.getItem('pinterest_lite_pins')||'[]'); }catch(e){pins=[];} }
function savePins(){ localStorage.setItem('pinterest_lite_pins', JSON.stringify(pins)); }
function escapeHtml(text){ const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}; return String(text).replace(/[&<>"']/g,m=>map[m]); }

function renderPins(filter=''){
  gridEl.innerHTML='';
  let filtered=pins;
  if(currentView==='liked') filtered=pins.filter(p=>p.liked);
  else if(currentView==='saved') filtered=pins.filter(p=>p.saved);
  if(filter) filtered=filtered.filter(p=>p.title.toLowerCase().includes(filter.toLowerCase()));

  if(filtered.length===0){ emptyEl.style.display='block'; }
  else{
    emptyEl.style.display='none';
    filtered.forEach((p,idx)=>{
      const card=document.createElement('article'); card.className='pin';
      card.innerHTML=`
        <a class="imgwrap" href="#"><img src="${p.url}" alt="${escapeHtml(p.title)}"/></a>
        <div class="meta">
          <h4>${escapeHtml(p.title)}</h4>
          <div class="actions">
            <button class="like-btn"><i class="${p.liked?'fa-solid fa-heart':'fa-regular fa-heart'}"></i></button>
            <button class="save-btn"><i class="${p.saved?'fa-solid fa-bookmark':'fa-regular fa-bookmark'}"></i></button>
          </div>
        </div>
      `;
      card.querySelector('.imgwrap').addEventListener('click', e=>{ e.preventDefault(); openView(p); });
      card.querySelector('.like-btn').addEventListener('click', ()=>{ p.liked=!p.liked; savePins(); renderPins(searchInput.value); });
      card.querySelector('.save-btn').addEventListener('click', ()=>{ p.saved=!p.saved; savePins(); renderPins(searchInput.value); });
      gridEl.appendChild(card);
    });
  }
}

function openView(pin){
  viewModal.classList.remove('hidden'); viewModal.setAttribute('aria-hidden','false');
  viewImg.src=pin.url; viewImg.alt=pin.title;
  viewTitle.textContent=pin.title;
  if(pin.link){ viewLink.href=pin.link; viewLink.style.display='inline-block'; }
  else{ viewLink.style.display='none'; }
  scale=1; originX=0; originY=0; viewImg.style.transform='scale(1) translate(0px,0px)';
}

function resetZoom(){ scale=1; originX=0; originY=0; viewImg.style.transform='scale(1) translate(0px,0px)'; }

viewImg.addEventListener('wheel', e=>{ e.preventDefault(); const delta=e.deltaY>0?-0.1:0.1; scale=Math.min(Math.max(1,scale+delta),5); viewImg.style.transform=`scale(${scale}) translate(${originX}px,${originY}px)`; });
viewImg.addEventListener('mousedown', e=>{ isDragging=true; startX=e.clientX; startY=e.clientY; viewImg.style.cursor='grabbing'; });
document.addEventListener('mouseup', e=>{ isDragging=false; viewImg.style.cursor='grab'; });
document.addEventListener('mousemove', e=>{ if(!isDragging)return; const dx=e.clientX-startX; const dy=e.clientY-startY; startX=e.clientX; startY=e.clientY; originX+=dx/scale; originY+=dy/scale; viewImg.style.transform=`scale(${scale}) translate(${originX}px,${originY}px)`; });

closeView.addEventListener('click', ()=>{ viewModal.classList.add('hidden'); viewModal.setAttribute('aria-hidden','true'); resetZoom(); });
viewModal.addEventListener('click', e=>{ if(e.target===viewModal){ viewModal.classList.add('hidden'); viewModal.setAttribute('aria-hidden','true'); resetZoom(); } });
closeAdd.addEventListener('click', ()=>{ addModal.classList.add('hidden'); addModal.setAttribute('aria-hidden','true'); });
addPinBtn.addEventListener('click', ()=>{ addModal.classList.remove('hidden'); addModal.setAttribute('aria-hidden','false'); });

searchInput.addEventListener('input', e=>{ renderPins(e.target.value); });
addForm.addEventListener('submit', e=>{
  e.preventDefault();
  const url=imgUrl.value.trim(), title=imgTitle.value.trim(), link=imgLink.value.trim();
  if(!url||!title) return;
  const newPin={url,title,link:link||'',liked:false,saved:false,created:Date.now()};
  pins.unshift(newPin); savePins(); renderPins(searchInput.value);
  addForm.reset(); addModal.classList.add('hidden');
});

// Theme
if(localStorage.getItem('theme')==='dark'){ document.body.classList.add('dark-mode'); themeToggle.innerHTML='<i class="fa-solid fa-sun"></i>'; }
themeToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('dark-mode');
  if(document.body.classList.contains('dark-mode')) themeToggle.innerHTML='<i class="fa-solid fa-sun"></i>'; 
  else themeToggle.innerHTML='<i class="fa-solid fa-moon"></i>';
  localStorage.setItem('theme', document.body.classList.contains('dark-mode')?'dark':'light');
});

// Tabs
function setTab(tab){ currentView=tab; [allPinsBtn,likedPinsBtn,savedPinsBtn].forEach(b=>b.classList.remove('active'));
  if(tab==='all') allPinsBtn.classList.add('active'); else if(tab==='liked') likedPinsBtn.classList.add('active'); else savedPinsBtn.classList.add('active');
  renderPins(searchInput.value);
}
allPinsBtn.addEventListener('click', ()=>setTab('all'));
likedPinsBtn.addEventListener('click', ()=>setTab('liked'));
savedPinsBtn.addEventListener('click', ()=>setTab('saved'));

// Seed 100 sample pins
function seedIfEmpty(){
  if(pins.length===0){
    const titles=Array.from({length:1000}, (_,i)=>`Sample Image ${i+1}`);
    pins=titles.map((title,i)=>({url:`https://picsum.photos/seed/${i+1}/600/800`, title, link:'', liked:false, saved:false}));
    savePins();
  }
}

// Init
loadPins(); seedIfEmpty(); renderPins();

// Esc to close
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ addModal.classList.add('hidden'); viewModal.classList.add('hidden'); resetZoom(); } });
