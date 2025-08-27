document.addEventListener('DOMContentLoaded', () => {

const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const addDays = (d, n) => {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date.toLocaleDateString('ru-RU');
};

const smartCard  = $('#smartCard');      
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

function updateModalTitle() {
  const modal = document.querySelector('.modal');
  const modalTitle = document.querySelector('.modal-title');
  const visible = modal.querySelector('.step:not([hidden])');
  if (!visible) { modalTitle.textContent = ''; return; }
  const h = visible.querySelector('h2,h3');
  modalTitle.textContent = h ? h.textContent.trim() : (visible.dataset.title || '');
}

smartCard.addEventListener('click', () => {
  smartModal.classList.add('show');
  showStep('info');
  updateModalTitle();
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
const btnYes   = dlgClose.querySelector('.btn-dark-new');
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

  Object.assign(card.dataset, {
    bank   : 'Т-банк',
    sum    : sum.toLocaleString('ru-RU') + ' ₽',
    income : (sum + income).toLocaleString('ru-RU') + ' ₽',
    incomeDelta : '(+' + income.toLocaleString('ru-RU') + ' ₽)',
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

/* ---- Helpers: добавлять цель, рендерить список и инициализировать info-иконки ---- */

function renderGoalsList(card) {
  const goalsRaw = card.dataset.goals || '';
  const arr = goalsRaw ? goalsRaw.split('|').filter(Boolean) : [];
  const ul = dlgInfo.querySelector('.goal-list');
  ul.innerHTML = arr.map((g, idx) => `
    <li data-idx="${idx}">
      <span class="goal-text">${escapeHtml(g)}</span>
      <button class="remove-goal" type="button" aria-label="Удалить цель">×</button>
    </li>
  `).join('');
}

// временные описания (редактируйте как хотите)
const ACHV_DESCRIPTIONS = {
  'Самурай': 'Стабильность: удерживали вклад активным без снятий в течение нескольких циклов — проявили дисциплину.',
  'Вин-стрик': 'Серия успешных действий: несколько пополнений подряд без пропусков.'
};

// Замените/дополните ваш renderAchvList на этот вариант
function renderAchvList(card) {
  const achvRaw = card.dataset.achv || '';
  const arr = achvRaw ? achvRaw.split('|').filter(Boolean) : [];
  const ul = dlgInfo.querySelector('.achv-list');

  ul.innerHTML = arr.map(a => {
    const desc = ACHV_DESCRIPTIONS[a] || 'Описание пока не задано — можно добавить короткое пояснение к достижению.';
    return `
      <li>
        <span class="achv-text">${escapeHtml(a)}</span>
        <span class="info-icon" tabindex="0" data-tooltip="${escapeHtml(desc)}">i</span>
      </li>
    `;
  }).join('');

  // инициализация тултипов (тот же fallback, что и ранее)
  initLocalInfoIcons(dlgInfo);
}


/* Добавляет новую цель в pendingCard и обновляет UI */
function addGoalToPendingCard(text) {
  if (!pendingCard) return;
  const clean = (text || '').trim();
  if (!clean) return;
  const prev = pendingCard.dataset.goals || '';
  pendingCard.dataset.goals = prev ? (prev + '|' + clean) : clean;

  // Обновляем модалку (видимо openInfo открыт)
  renderGoalsList(pendingCard);

  // Также, если у карточки где-то отображается краткая информация (tpl), можно попытаться
  // найти и обновить её представление. Если у вас карточки в DOM используют data-field,
  // то открытие инфо снова покажет актуализацию.
}

/* Удалить цель по индексу (в рамках pendingCard) */
function removeGoalFromPendingCard(index) {
  if (!pendingCard) return;
  const arr = (pendingCard.dataset.goals || '').split('|').filter(Boolean);
  if (index < 0 || index >= arr.length) return;
  arr.splice(index, 1);
  pendingCard.dataset.goals = arr.join('|');
  renderGoalsList(pendingCard);
}

/* Простая защита от XSS в тексте целей/ачивов */
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

/* Инициализация простых тултипов для .info-icon внутри контейнера (fallback) */
function initLocalInfoIcons(container) {
  const icons = (container || document).querySelectorAll('.info-icon');
  icons.forEach(icon => {
    // если у иконки уже есть .tooltip — ничего не делаем
    if (icon.querySelector('.tooltip')) return;
    const txt = icon.getAttribute('data-tooltip') || '';
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.textContent = txt;
    tip.style.display = 'none';
    tip.style.position = 'absolute';
    tip.style.background = '#222';
    tip.style.color = '#fff';
    tip.style.padding = '8px 10px';
    tip.style.borderRadius = '6px';
    tip.style.fontSize = '13px';
    tip.style.zIndex = 9999;
    icon.style.position = 'relative';
    icon.appendChild(tip);

    icon.addEventListener('mouseenter', ()=> tip.style.display = 'block');
    icon.addEventListener('mouseleave', ()=> tip.style.display = 'none');
    icon.addEventListener('focus', ()=> tip.style.display = 'block');
    icon.addEventListener('blur', ()=> tip.style.display = 'none');

    // для клика (мобайл) — переключать
    icon.addEventListener('click', (e)=> {
      e.stopPropagation();
      tip.style.display = tip.style.display === 'block' ? 'none' : 'block';
    });
  });
}

/* ---- Event delegation: удаление цели и добавление новой ---- */

dlgInfo.addEventListener('click', (e) => {
  // удалить цель
  const rem = e.target.closest('.remove-goal');
  if (rem) {
    const li = rem.closest('li');
    const idx = Number(li.getAttribute('data-idx'));
    removeGoalFromPendingCard(idx);
    return;
  }
});

// добавить цель по Enter в поле
dlgInfo.querySelector('#goal-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = e.target.value;
    if (val && val.trim()) {
      addGoalToPendingCard(val);
      e.target.value = '';
    }
  }
});

// добавить цель по кнопке
dlgInfo.querySelector('#add-goal-btn').addEventListener('click', () => {
  const inp = dlgInfo.querySelector('#goal-input');
  const val = inp.value;
  if (val && val.trim()) {
    addGoalToPendingCard(val);
    inp.value = '';
    inp.focus();
  }
});

function openInfo(card){
  pendingCard = card;

  ['bank','sum','income','incomeDelta','count','max','end','next']
    .forEach(key=>{
      const el = dlgInfo.querySelector(`[data-field="${key}"]`);
      if (el) el.textContent = card.dataset[key] || '—';
    });

  // Рендер целей и ачивок через функции (они обновят DOM и инициализируют тултипы)
  renderGoalsList(card);
  renderAchvList(card);

  dlgInfo.showModal();
}

// function openInfo(card){
//   pendingCard = card;

//   ['bank','sum','income','incomeDelta','count','max','end','next']
//     .forEach(key=>{
//       const el = dlgInfo.querySelector(`[data-field="${key}"]`);
//       if (el) el.textContent = card.dataset[key] || '—';
//     });

//   dlgInfo.querySelector('.goal-list').innerHTML =
//     (card.dataset.goals||'')
//       .split('|').filter(Boolean).map(t=>`<li>${t}</li>`).join('');
//   dlgInfo.querySelector('.achv-list').innerHTML =
//     (card.dataset.achv||'')
//       .split('|').filter(Boolean).map(t=>`<li>${t}</li>`).join('');

//   dlgInfo.showModal();
// }

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



        
// пояснения для оформления вклада 
const icons = document.querySelectorAll('.info-icon');

icons.forEach(icon => {
            // создаём DOM тултип из data-tooltip (делаем один элемент, чтобы легче стилизовать)
            const tipText = icon.getAttribute('data-tooltip') || '';
            const tip = document.createElement('div');
            tip.className = 'tooltip';
            tip.textContent = tipText;
            icon.appendChild(tip);
        
            // aria support
            const id = 'tip-' + Math.random().toString(36).slice(2,9);
            tip.id = id;
            icon.setAttribute('aria-describedby', id);
        
            // hover для desktop
            icon.addEventListener('mouseenter', () => icon.classList.add('show'));
            icon.addEventListener('mouseleave', () => icon.classList.remove('show'));
        
            // click/tap для mobile: переключатель
            icon.addEventListener('click', (e) => {
              e.stopPropagation();
              icons.forEach(i => { if (i !== icon) i.classList.remove('show'); });
              icon.classList.toggle('show');
            });
        
            // клавиши: Enter / Space открывают тултип
            icon.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                icon.classList.toggle('show');
              } else if (e.key === 'Escape') {
                icon.classList.remove('show');
              }
            });
});
        
document.addEventListener('click', () => {
            document.querySelectorAll('.info-icon.show').forEach(i => i.classList.remove('show'));
  });
    
  

// нежелательные банки (может удалить)
(function () {
  // Список банков (можно загрузить динамически с сервера)
  const BANKS = [
    { id: 'sber', name: 'Сбер' },
    { id: 'tinkoff', name: 'Т-банк' },
    { id: 'vtb', name: 'ВТБ' },
    { id: 'alfabank', name: 'Альфа-Банк' },
    { id: 'gazprom', name: 'Газпромбанк' }
  ];

  function initBanSelect(rootId = 'banSelect') {
    const root = document.getElementById(rootId);
    if (!root) return;
    const search = root.querySelector('.ms-search');
    const list = root.querySelector('.ms-list');
    const chipsWrap = root.querySelector('.ms-chips');
    const hidden = document.getElementById('ban-input');
    const selection = root.querySelector('.ms-selection');

    let filtered = [...BANKS];
    let selected = []; // array of bank objects
    let focusedIndex = -1;

    // render list items
    function renderList() {
      list.innerHTML = '';
      filtered.forEach((b, i) => {
        const li = document.createElement('li');
        li.className = 'ms-item';
        li.setAttribute('role', 'option');
        li.setAttribute('data-id', b.id);
        li.setAttribute('data-name', b.name);
        li.textContent = b.name;
        li.tabIndex = -1;
        const isSelected = selected.find(s => s.id === b.id);
        li.setAttribute('aria-selected', !!isSelected);
        list.appendChild(li);
      });
      // show/hide list
      list.hidden = filtered.length === 0;
    }

    // render chips
    function renderChips() {
      chipsWrap.innerHTML = '';
      selected.forEach(b => {
        const chip = document.createElement('span');
        chip.className = 'ms-chip';
        chip.setAttribute('data-id', b.id);
        chip.innerHTML = `<span class="ms-chip-label">${b.name}</span><span class="remove" aria-hidden="true">×</span>`;
        chipsWrap.appendChild(chip);
      });
      // update hidden input (comma-separated ids)
      hidden.value = selected.map(s => s.id).join(',');
    }
    

    
    
    (function(){
      const modal = document.querySelector('.modal');
      const modalTitle = document.querySelector('.modal-title');
    
      function updateModalTitle() {
        const visible = modal.querySelector('.step:not([hidden])');
        if (!visible) { modalTitle.textContent = ''; return; }
        const h = visible.querySelector('h2,h3');
        modalTitle.textContent = h ? h.textContent.trim() : (visible.dataset.title || '');
      }
    
      // Запуск при загрузке
      document.addEventListener('DOMContentLoaded', updateModalTitle);
    
      // Если у вас кнопки перехода переключают hidden — вызывайте после переключения.
      // Добавляем делегирование на клики по вашим навигационным кнопкам (простой вариант)
      document.addEventListener('click', (e) => {
        if (e.target.matches('#toDetails, #toSurvey, #toForm, #backInfo1, #backInfo2, #backInfo3')) {
          // даём шанс другому коду обновить DOM
          requestAnimationFrame(updateModalTitle);
          setTimeout(updateModalTitle, 40);
        }
      });
    
      // Если модалка открывается программно, вызывайте updateModalTitle() после show.
    })();

    function openList() {
      list.hidden = false;
      selection.setAttribute('aria-expanded', 'true');
    }
    function closeList() {
      list.hidden = true;
      selection.setAttribute('aria-expanded', 'false');
      focusedIndex = -1;
      updateFocus();
    }

    function updateFocus() {
      const items = Array.from(list.children);
      items.forEach((it, idx) => {
        if (idx === focusedIndex) {
          it.classList.add('focused');
          it.focus();
        } else {
          it.classList.remove('focused');
        }
      });
    }

    // filter on input
    function doFilter(q) {
      const qq = (q || '').trim().toLowerCase();
      filtered = BANKS.filter(b => b.name.toLowerCase().includes(qq));
      renderList();
    }



    // select bank
    function selectBankById(id) {
      const bank = BANKS.find(b => b.id === id);
      if (!bank) return;
      if (!selected.find(s => s.id === bank.id)) {
        selected.push(bank);
        renderChips();
        renderList();
      }
    }

    // deselect
    function deselectById(id) {
      selected = selected.filter(s => s.id !== id);
      renderChips();
      renderList();
    }

    // click on item
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.ms-item');
      if (!li) return;
      const id = li.getAttribute('data-id');
      selectBankById(id);
      search.value = '';
      doFilter('');
      search.focus();
      openList();
    });

    // chips: remove by click
    chipsWrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.ms-chip');
      if (!chip) return;
      if (e.target.classList.contains('remove')) {
        const id = chip.getAttribute('data-id');
        deselectById(id);
      }
    });

    // keyboard interactions
    search.addEventListener('keydown', (e) => {
      const items = Array.from(list.children);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length === 0) return;
        focusedIndex = Math.min(items.length - 1, focusedIndex + 1);
        updateFocus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length === 0) return;
        focusedIndex = Math.max(0, focusedIndex - 1);
        updateFocus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && items[focusedIndex]) {
          const id = items[focusedIndex].getAttribute('data-id');
          selectBankById(id);
          search.value = '';
          doFilter('');
        }
      } else if (e.key === 'Backspace' && search.value === '') {
        // удаляем последний чип если есть
        if (selected.length) {
          deselectById(selected[selected.length - 1].id);
        }
      } else if (e.key === 'Escape') {
        closeList();
      }
    });

    // typing filter
    search.addEventListener('input', (e) => {
      doFilter(e.target.value);
      openList();
      focusedIndex = -1;
    });

    // focus behavior: open list on focus
    selection.addEventListener('focus', () => {
      doFilter(search.value);
      openList();
    });

    // click on selection opens search
    selection.addEventListener('click', () => {
      search.focus();
      doFilter(search.value);
      openList();
    });

    // click outside close
    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) closeList();
    });

    // initial render
    doFilter('');
    renderChips();
    renderList();
  }

  
  // wait DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initBanSelect());
  } else {
    initBanSelect();
  }
})();  
}); 
