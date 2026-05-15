// Mock-only booking flow: this does not send real enquiries to any backend.
document.addEventListener('DOMContentLoaded',()=>{
  const modal=document.getElementById('bookingModal');
  if(!modal) return;

  const form=document.getElementById('bookingForm');
  let stepper=document.getElementById('bookingStepper');
  let progress=document.querySelector('.progress-row');
  let nextBtn=document.getElementById('stepNextBtn');
  let backBtn=document.getElementById('stepBackBtn');
  if(form && (!stepper || !nextBtn || !backBtn || !progress)){
    form.innerHTML='<div class="progress-row" aria-hidden="true"></div><div id="bookingStepper" class="stepper-card"></div><div class="modal-actions"><button class="btn btn-outline" type="button" id="stepBackBtn">Back</button><button class="btn" type="button" id="stepNextBtn">Next</button></div>';
    stepper=document.getElementById('bookingStepper');
    progress=form.querySelector('.progress-row');
    nextBtn=document.getElementById('stepNextBtn');
    backBtn=document.getElementById('stepBackBtn');
  }
  let lastTrigger=null;

  const steps=[
    {key:'patient',title:'Are you already a patient?',type:'choice',options:['Yes','No']},
    {key:'name',title:'What is your full name?',type:'input',inputType:'text'},
    {key:'email',title:'What is your email address?',type:'input',inputType:'email'},
    {key:'phone',title:'Best phone number to reach you?',type:'input',inputType:'tel'},
    {key:'contact',title:'Preferred contact method?',type:'choice',options:['Phone','Email']},
    {key:'dentist',title:'Do you have a preferred dentist?',type:'choice',options:['No preference','Mitul','Mo','Other / Not sure']},
    {key:'date',title:'Which date would you prefer?',type:'input',inputType:'date'},
    {key:'time',title:'Which time would suit you?',type:'input',inputType:'time'},
    {key:'help',title:'What do you need help with?',type:'input',inputType:'text'},
    {key:'message',title:'Anything else we should know?',type:'textarea'}
  ];
  let index=0; const answers={};

  const getFocusable=()=>[...modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled);
  const open=trigger=>{lastTrigger=trigger||document.activeElement;modal.classList.add('show');document.body.style.overflow='hidden';renderStep();setTimeout(()=>getFocusable()[0]?.focus(),20);};
  const close=()=>{modal.classList.remove('show');document.body.style.overflow='';lastTrigger?.focus?.();};

  function renderProgress(){progress.innerHTML=steps.map((_,i)=>`<span class="dot ${i<=index?'active':''}"></span>`).join('');}
  function renderStep(){
    const s=steps[index]; renderProgress();
    backBtn.style.visibility=index===0?'hidden':'visible';
    nextBtn.textContent=index===steps.length-1?'Submit':'Next';
    if(s.type==='choice'){
      stepper.innerHTML=`<p class="step-title">${s.title}</p><div class="choice-grid">${s.options.map(op=>`<button class="choice-btn ${answers[s.key]===op?'selected':''}" type="button" data-choice="${op}">${op}</button>`).join('')}</div>`;
      stepper.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>{answers[s.key]=btn.dataset.choice;renderStep();});
    } else if(s.type==='textarea'){
      stepper.innerHTML=`<p class="step-title">${s.title}</p><textarea class="input" rows="5" id="stepInput" placeholder="Share any details...">${answers[s.key]||''}</textarea>`;
    } else {
      stepper.innerHTML=`<p class="step-title">${s.title}</p><input class="input" id="stepInput" type="${s.inputType}" value="${answers[s.key]||''}" />`;
    }
  }

  function saveCurrent(){const s=steps[index]; if(s.type==='choice') return !!answers[s.key]; const val=stepper.querySelector('#stepInput')?.value?.trim()||''; answers[s.key]=val; return !!val || s.key==='message';}
  function submitFlow(){form.innerHTML='<div class="card"><h3>Thank you — your mock appointment request has been submitted.</h3><p>Our team will be in touch soon.</p></div>';}

  nextBtn?.addEventListener('click',()=>{if(!saveCurrent()) return; if(index===steps.length-1){submitFlow(); return;} index++; renderStep();});
  backBtn?.addEventListener('click',()=>{if(index===0) return; saveCurrent(); index--; renderStep();});

  document.body.addEventListener('click',e=>{if(e.target.matches('[data-book-open]')) open(e.target); if(e.target.matches('[data-book-close]')||e.target===modal) close();});
  modal.addEventListener('keydown',e=>{if(e.key==='Escape') close(); if(e.key!=='Tab') return; const f=getFocusable(); if(!f.length) return; const first=f[0],last=f[f.length-1]; if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
});
