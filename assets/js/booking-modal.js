
// Mock-only booking flow: this does not send real enquiries to any backend.
document.addEventListener('DOMContentLoaded',()=>{
  const modal=document.getElementById('bookingModal'); if(!modal) return;
  const open=()=>modal.classList.add('show'); const close=()=>modal.classList.remove('show');
  document.body.addEventListener('click',e=>{if(e.target.matches('[data-book-open]')) open(); if(e.target.matches('[data-book-close]')||e.target===modal) close();});
  const form=document.getElementById('bookingForm');
  form?.addEventListener('submit',e=>{e.preventDefault(); const req=[...form.querySelectorAll('[required]')]; let ok=true; req.forEach(i=>{if(!i.value.trim()){ok=false;i.setAttribute('aria-invalid','true');} else i.removeAttribute('aria-invalid');}); if(!ok)return; form.innerHTML='<div class="card"><h3>Thank you — your mock appointment request has been submitted.</h3><p>Our team will be in touch soon.</p></div>';});
});
