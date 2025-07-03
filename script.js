document.addEventListener('DOMContentLoaded', () => {

const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const addDays = (d, n) => {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date.toLocaleDateString('ru-RU');
};

const smartCard  = $('#smartCard');
console.log(smartCard)      
const smartModal = $('#smartModal');     
const smartClose = smartModal.querySelector('.close-btn');

const steps = {
  info   : $('#step-info'),
  details: $('#step-details'),
  survey : $('#step-survey'),
  form   : $('#step-form')
};

function showStep(key){
  Object.values(steps).forEach(s => s.hidden = true);
  steps[key].hidden = false;
}

smartCard.addEventListener('click', () => {
  smartModal.classList.add('show');
  showStep('info');
});
smartClose.addEventListener('click', () =>
  smartModal.classList.remove('show'));
smartModal.addEventListener('click', e=>{
  if (e.target === smartModal) smartModal.classList.remove('show');
});

$('#toDetails').onclick = () => showStep('details');
$('#toSurvey' ).onclick = () => showStep('survey');
$('#toForm'   ).onclick = () => showStep('form');
$('#backInfo1').onclick =
$('#backInfo2').onclick =
$('#backInfo3').onclick = () => showStep('info');

function sync(range, out, suff = ''){
  out.textContent = range.value + suff;
  range.addEventListener('input',
    () => out.textContent = range.value + suff);
}
sync($('#term'),    $('#termVal'));
sync($('#reserve'), $('#reserveVal'));

$('#surveyForm').addEventListener('submit', e=>{
  e.preventDefault();
  const f   = e.target;
  const amt = +f.amount.value;
  const hor = f.horizon.value;
  const pri = f.priority.value;
  const box = $('#surveyResult');

  let ok = (amt <= 30000)
           ? (pri !== 'flex')
           : (pri === 'rate' && hor !== '3+ года');

  box.hidden = false;
  box.className = 'survey-result ' + (ok ? 'good' : 'bad');
  box.innerHTML = ok
    ? `👍 <strong>SmartВклад подходит вам.</strong><br>
       Вы получите лучшие ставки при минимальных усилиях.<br><br>
       <button id="resultToForm" class="btn" style="margin-top:8px">
         Перейти к оформлению
       </button>`
    : `👀 <strong>SmartВклад сейчас не оптимален.</strong><br>
       Попробуйте увеличить горизонт или выбрать
       вариант с фиксированной ставкой в банке.`;

  $('#resultToForm')?.addEventListener('click', () => showStep('form'));
});

$$('.task-panel').forEach(panel=>{
  panel.querySelector('.tp-header')
       .addEventListener('click',
         () => panel.classList.toggle('is-open'));
});
$$('.panel .shapka-card').forEach(head=>{
  head.addEventListener('click',
    () => head.parentElement.classList.toggle('collapsed'));
});
   const form     = $('#depositForm');
const tplSmart = $('#tpl-smart');
const products = $('.products');
const banner   = $('.banner');

const dlgAlert = $('#dlg-alert');
dlgAlert.querySelector('.dlg-close')
        .addEventListener('click', () => dlgAlert.close());

const dlgInfo  = $('#dlg-info');
const dlgClose = $('#dlg-close');

const agreeBox = $('#closeAgree');
const btnYes   = dlgClose.querySelector('.dlg-ok');
const btnCancelClose = dlgClose.querySelector('.dlg-cancel');

let pendingCard = null; 

form.addEventListener('submit', e=>{
  e.preventDefault();

  const monthly = +$('#monthly').value || 0;
  const term    = +$('#term').value    || 0;
  const sum     = monthly;
  const today   = new Date();

  const card = tplSmart.content.firstElementChild.cloneNode(true);

  const income      = sum * 0.12;
  const incomeDelta = sum * 0.02;

  Object.assign(card.dataset, {
    bank   : 'Банк «Ракета»',
    sum    : sum.toLocaleString('ru-RU') + ' ₽',
    income : (sum + income).toLocaleString('ru-RU') + ' ₽',
    incomeDelta : '(+' + incomeDelta.toLocaleString('ru-RU') + ' ₽)',
    count  : '1',
    max    : term + ' мес',
    end    : addDays(today, term*30),
    next   : addDays(today, 30),
    goals  : 'Накопить 150 000 ₽ на машину',
    achv   : 'Самурай|Вин-стрик'
  });

  card.querySelector('[data-el="sum"]').textContent    = card.dataset.sum;
  card.querySelector('[data-el="income"]').textContent = income.toLocaleString('ru-RU') + ' ₽';
  card.querySelector('[data-el="count"]').textContent  = card.dataset.count;

  card.addEventListener('click', () => openInfo(card));

  products.insertBefore(card, banner);

  smartModal.classList.remove('show');
  dlgAlert.showModal();
});

function openInfo(card){
  pendingCard = card;

  ['bank','sum','income','incomeDelta','count','max','end','next']
    .forEach(key=>{
      const el = dlgInfo.querySelector(`[data-field="${key}"]`);
      if (el) el.textContent = card.dataset[key] || '—';
    });

  dlgInfo.querySelector('.goal-list').innerHTML =
    (card.dataset.goals||'')
      .split('|').filter(Boolean).map(t=>`<li>${t}</li>`).join('');
  dlgInfo.querySelector('.achv-list').innerHTML =
    (card.dataset.achv||'')
      .split('|').filter(Boolean).map(t=>`<li>${t}</li>`).join('');

  dlgInfo.showModal();
}

dlgInfo.querySelector('.dlg-x')
       .addEventListener('click', () => dlgInfo.close());


dlgInfo.querySelector('.close-deposit')
       .addEventListener('click', () => {
         dlgInfo.close();
         agreeBox.checked = false;
         btnYes.disabled  = true;
         dlgClose.showModal();
       });

agreeBox.addEventListener('change',
  () => btnYes.disabled = !agreeBox.checked);


btnYes.addEventListener('click', () => {
  pendingCard?.remove();
  dlgClose.close();
  pendingCard = null;
});

btnCancelClose.addEventListener('click', () => dlgClose.close());
dlgClose.querySelector('.dlg-close')
        .addEventListener('click', () => dlgClose.close());

}); 