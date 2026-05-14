// Mock-only booking flow: this does not send real enquiries to any backend.
document.addEventListener('DOMContentLoaded',()=>{
  const modal=document.getElementById('bookingModal');
  if(!modal) return;

  const form=document.getElementById('bookingForm');
  const closeButtons=()=>modal.querySelectorAll('[data-book-close]');
  let lastTrigger=null;

  const getFocusable=()=>[...modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(el=>!el.disabled);

  const open=trigger=>{
    lastTrigger=trigger||document.activeElement;
    modal.classList.add('show');
    document.body.style.overflow='hidden';
    setTimeout(()=>{
      const first=getFocusable()[0];
      first?.focus();
    },20);
  };

  const close=()=>{
    modal.classList.remove('show');
    document.body.style.overflow='';
    lastTrigger?.focus?.();
  };

  document.body.addEventListener('click',e=>{
    if(e.target.matches('[data-book-open]')) open(e.target);
    if(e.target.matches('[data-book-close]')||e.target===modal) close();
  });

  modal.addEventListener('keydown',e=>{
    if(e.key==='Escape') close();
    if(e.key!=='Tab') return;
    const focusables=getFocusable();
    if(!focusables.length) return;
    const first=focusables[0];
    const last=focusables[focusables.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });

  closeButtons().forEach(btn=>btn.addEventListener('click',close));

  form?.addEventListener('submit',e=>{
    e.preventDefault();
    const req=[...form.querySelectorAll('[required]')];
    let ok=true;
    req.forEach(i=>{
      if(!i.value.trim()){
        ok=false;
        i.setAttribute('aria-invalid','true');
      } else i.removeAttribute('aria-invalid');
    });
    if(!ok) return;
    form.innerHTML='<div class="card"><h3>Thank you — your mock appointment request has been submitted.</h3><p>Our team will be in touch soon.</p></div>';
  });
});
