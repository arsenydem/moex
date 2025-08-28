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


(function() {
  const selects = document.querySelectorAll('select');
  const svgArrow = `<svg viewBox="0 0 24 24" class="custom-select__arrow" aria-hidden="true">
    <path d="M7 10l5 5 5-5z" fill="currentColor"/>
  </svg>`;

  selects.forEach(original => createCustomSelect(original));

  function createCustomSelect(original) {
    // wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    wrapper.tabIndex = -1;

    // hide native select but keep in DOM (form submission)
    original.classList.add('custom-select--native-hidden');

    // button that shows current value / placeholder
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'custom-select__button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');

    const displaySpan = document.createElement('span');
    displaySpan.className = 'custom-select__value';

    // initial text
    const initial = original.options[original.selectedIndex] && original.options[original.selectedIndex].text;
    displaySpan.textContent = initial && original.value !== '' ? initial : (original.querySelector('option[disabled][selected]')?.textContent || 'Выберите…');
    if (original.value === '' || original.selectedIndex === -1) displaySpan.classList.add('placeholder');

    btn.appendChild(displaySpan);
    btn.insertAdjacentHTML('beforeend', svgArrow);

    // build list
    const list = document.createElement('ul');
    list.className = 'ms-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('tabindex', '-1');
    list.style.display = 'none';

    // create items from options
    const items = [];
    Array.from(original.options).forEach((opt, idx) => {
      const li = document.createElement('li');
      li.className = 'ms-item';
      li.setAttribute('role', 'option');
      li.dataset.value = opt.value;
      li.dataset.index = idx;
      li.textContent = opt.textContent;
      if (opt.disabled) {
        li.setAttribute('aria-disabled', 'true');
        li.style.opacity = 0.6;
      }
      if (original.value === opt.value && !opt.disabled) {
        li.setAttribute('aria-selected', 'true');
      } else {
        li.setAttribute('aria-selected', 'false');
      }
      list.appendChild(li);
      items.push(li);
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(list);
    original.parentNode.insertBefore(wrapper, original.nextSibling);

    // state
    let open = false;
    let focusedIndex = -1;

    // helpers
    function openList() {
      if (open) return;
      wrapper.classList.add('open');
      list.style.display = '';
      btn.setAttribute('aria-expanded', 'true');
      open = true;
      // set focus on selected item or first enabled
      const sel = items.findIndex(i => i.getAttribute('aria-selected') === 'true' && i.getAttribute('aria-disabled') !== 'true');
      focusedIndex = sel >= 0 ? sel : items.findIndex(i => i.getAttribute('aria-disabled') !== 'true');
      focusItem(focusedIndex);
      // prevent page scroll when using arrows
      list.focus();
    }

    function closeList() {
      if (!open) return;
      wrapper.classList.remove('open');
      list.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
      removeFocused();
      open = false;
      focusedIndex = -1;
    }

    function selectIndex(idx) {
      const item = items[idx];
      if (!item || item.getAttribute('aria-disabled') === 'true') return;
      // update original select
      original.value = item.dataset.value;
      // update display
      displaySpan.textContent = item.textContent;
      displaySpan.classList.remove('placeholder');
      // set aria-selected
      items.forEach(i => i.setAttribute('aria-selected', 'false'));
      item.setAttribute('aria-selected', 'true');

      // trigger change event on original select (in case есть слушатели)
      const ev = new Event('change', { bubbles: true });
      original.dispatchEvent(ev);

      closeList();
      btn.focus();
    }

    function focusItem(idx) {
      removeFocused();
      if (idx < 0 || idx >= items.length) return;
      focusedIndex = idx;
      const it = items[idx];
      it.classList.add('focused');
      it.scrollIntoView({ block: 'nearest' });
      it.focus?.();
    }

    function removeFocused() {
      items.forEach(i => i.classList.remove('focused'));
    }

    // click handlers
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      open ? closeList() : openList();
    });

    items.forEach((it, idx) => {
      it.addEventListener('click', (e) => {
        e.stopPropagation();
        if (it.getAttribute('aria-disabled') === 'true') return;
        selectIndex(idx);
      });
      // allow keyboard focus per item
      it.addEventListener('mouseenter', () => { focusItem(idx); });
    });

    // keyboard handling on wrapper
    wrapper.addEventListener('keydown', (e) => {
      const key = e.key;
      if (!open) {
        if (key === 'ArrowDown' || key === 'ArrowUp' || key === ' ') {
          e.preventDefault();
          openList();
        }
        return;
      }

      if (key === 'ArrowDown') {
        e.preventDefault();
        // next enabled
        let i = focusedIndex;
        do { i = (i + 1) % items.length; } while (items[i].getAttribute('aria-disabled') === 'true' && i !== focusedIndex);
        focusItem(i);
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        let i = focusedIndex;
        do { i = (i - 1 + items.length) % items.length; } while (items[i].getAttribute('aria-disabled') === 'true' && i !== focusedIndex);
        focusItem(i);
      } else if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        selectIndex(focusedIndex);
      } else if (key === 'Escape') {
        e.preventDefault();
        closeList();
        btn.focus();
      } else if (key === 'Home') {
        e.preventDefault();
        const i = items.findIndex(it => it.getAttribute('aria-disabled') !== 'true');
        focusItem(i);
      } else if (key === 'End') {
        e.preventDefault();
        let i = items.length - 1;
        while (i >= 0 && items[i].getAttribute('aria-disabled') === 'true') i--;
        focusItem(i);
      } else if (key.length === 1 && /\S/.test(key)) {
        // type to jump (simple)
        const ch = key.toLowerCase();
        const start = (focusedIndex + 1) % items.length;
        let i = start;
        do {
          if (items[i].textContent.trim().toLowerCase().startsWith(ch) && items[i].getAttribute('aria-disabled') !== 'true') {
            focusItem(i);
            break;
          }
          i = (i + 1) % items.length;
        } while (i !== start);
      }
    });

    // click outside closes
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) closeList();
    });

    // keep original select in sync if changed programmatically
    original.addEventListener('change', () => {
      const val = original.value;
      const idx = Array.from(original.options).findIndex(o => o.value === val);
      if (idx >= 0) {
        displaySpan.textContent = original.options[idx].textContent;
        displaySpan.classList.toggle('placeholder', original.value === '');
        items.forEach(i => i.setAttribute('aria-selected', 'false'));
        if (items[idx]) items[idx].setAttribute('aria-selected', 'true');
      }
    });

    // close on form submit? (optional)
    const parentForm = original.closest('form');
    if (parentForm) {
      parentForm.addEventListener('submit', () => {
        // nothing special — значение в оригинальном select уже установлено
        closeList();
      });
    }
  }
})();


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

// Окно подтверждения при открытии вклада
const dlgAlert = $('#dlg-alert');
const dlg = document.getElementById('dlg-alert'); 
(() => {
  // --- Получаем элемент (работает с $ (jQuery-подобным) или без него) ---
  const raw = (typeof $ === 'function') ? $('#dlg-alert') : null;
  const dlg = raw
    ? (raw instanceof Element ? raw : raw[0])   // если $ вернул DOM-узел или jQuery-объект
    : document.getElementById('dlg-alert');

  if (!dlg) {
    console.warn('Диалог #dlg-alert не найден');
    return;
  }

  const checkbox = dlg.querySelector('#openAgree');
  const btnConfirm = dlg.querySelector('#confirmOpen');
  const btnCancel = dlg.querySelector('.dlg-cancel');

  // Защита: если чего-то нет — лог и выход
  if (!checkbox || !btnConfirm || !btnCancel) {
    console.warn('В модалке отсутствуют необходимые элементы: checkbox / confirm / cancel');
    return;
  }

  // --- Состояние фокуса для восстановления ---
  let previousActive = null;

  // --- Вспомогательные: открыть / закрыть модалку ---
  function showDialog() {
    previousActive = document.activeElement;
    // если браузер поддерживает <dialog>
    if (typeof dlg.showModal === 'function') {
      try { dlg.showModal(); }
      catch (e) { /* если уже открыт или ошибка — игнор */ }
    } else {
      dlg.removeAttribute('hidden');
      dlg.setAttribute('aria-modal', 'true');
    }
    // фокус на чекбоксе (или на кнопке, если нужно)
    checkbox.focus();
    // синхронизируем кнопку (вдруг состояние осталось)
    btnConfirm.disabled = !checkbox.checked;
  }

  function closeDialog(reason = 'cancel') {
    if (typeof dlg.close === 'function') {
      try { dlg.close(); } catch (e) {}
    } else {
      dlg.setAttribute('hidden', '');
      dlg.removeAttribute('aria-modal');
    }
    // восстановим фокус
    if (previousActive && typeof previousActive.focus === 'function') {
      previousActive.focus();
      previousActive = null;
    }
    // чистим чекбокс чтобы при следующем открытии было предсказуемо
    checkbox.checked = false;
    btnConfirm.disabled = true;
  }

  // --- Логика активации кнопки по чекбоксу ---
  checkbox.addEventListener('change', () => {
    btnConfirm.disabled = !checkbox.checked;
  });

  // --- Обработчики кнопок ---
  btnConfirm.addEventListener('click', (e) => {
    e.preventDefault();
    if (btnConfirm.disabled) return;
    // высылаем событие, чтобы основной код сделал списание/открытие вклада
    dlg.dispatchEvent(new CustomEvent('deposit:confirm', { detail: { timestamp: Date.now() } }));
    closeDialog('confirm');
  });

  btnCancel.addEventListener('click', (e) => {
    e.preventDefault();
    dlg.dispatchEvent(new CustomEvent('deposit:cancel', { detail: { timestamp: Date.now() } }));
    closeDialog('cancel');
  });

  // --- Обработка клавиш внутри модалки ---
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dlg.dispatchEvent(new CustomEvent('deposit:cancel', { detail: { by: 'escape' } }));
      closeDialog('cancel');
    } else if (e.key === 'Enter') {
      // если Enter и кнопка активна — подтвердить
      // но если фокус в чекбоксе — стандартное поведение toggle оставим
      const active = document.activeElement;
      const inCheckbox = active === checkbox;
      if (!btnConfirm.disabled && !inCheckbox) {
        e.preventDefault();
        dlg.dispatchEvent(new CustomEvent('deposit:confirm', { detail: { by: 'enter' } }));
        closeDialog('confirm');
      }
    }
  });

  // --- Обработка клика по backdrop (опционально) ---
  // если хотите закрывать при клике по затемнению — раскомментируйте:
  /*
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) { // клик именно по фону
      dlg.dispatchEvent(new CustomEvent('deposit:cancel', { detail: { by: 'backdrop' } }));
      closeDialog('cancel');
    }
  });
  */

  // --- Обработчик события cancel (на native <dialog>) ---
  dlg.addEventListener('cancel', (e) => {
    // предотвращаем автоматическое закрытие, если нужно — или просто обрабатываем
    // e.preventDefault();
    dlg.dispatchEvent(new CustomEvent('deposit:cancel', { detail: { by: 'native-cancel' } }));
    closeDialog('cancel');
  });

  // --- Публичный API: показываем модалку через dlg._openDeposit() ---
  // Можно вызвать dlg._openDeposit() извне, чтобы открыть диалог.
  dlg._openDeposit = showDialog;
  dlg._closeDeposit = () => closeDialog('programmatic');

  // --- Пример: подписка на подтверждение/отмену ---
  // В основном коде используйте:
  // dlg.addEventListener('deposit:confirm', e => { /* выполнить списание */ });
  // dlg.addEventListener('deposit:cancel', e => { /* логика отмены */ });

  // Автоматически синхронизируем состояние при инициализации
  btnConfirm.disabled = !checkbox.checked;

  // --- Если нужно: открываем автоматически (удалите/закомментируйте) ---
  // showDialog();

})();



const dlgInfo  = $('#dlg-info');



const dlgClose = $('#dlg-close');

const agreeBox = $('#closeAgree');

const btnYes   = dlgClose.querySelector('.btn-dark-new');
const btnCancelClose = dlgClose.querySelector('.dlg-cancel');

let pendingCard = null; 

// Утилита форматирования суммы
function formatRub(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

// --- Обработчик отправки формы: создаём карточку, но не вставляем ---
form.addEventListener('submit', e => {
  e.preventDefault();

  const monthly = +document.getElementById('monthly').value || 0;
  const term    = +document.getElementById('term').value    || 0;
  const sum     = monthly;
  const today   = new Date();

  // собираем карточку (клонируем шаблон)
  const card = tplSmart.content.firstElementChild.cloneNode(true);

  const income = sum * 0.12; // ваша формула

  Object.assign(card.dataset, {
    bank   : 'Т-банк',
    sum    : formatRub(sum),
    income : formatRub(sum + income),
    incomeDelta : '(+' + formatRub(income).replace(' ₽','') + ' ₽)',
    count  : '1',
    max    : term + ' мес',
    end    : addDays(today, term*30), // предполагается, что addDays определён
    next   : addDays(today, 30),
    goals  : 'Накопить 150 000 ₽ на машину',
    achv   : 'Самурай|Вин-стрик'
  });

  card.querySelector('[data-el="sum"]').textContent    = card.dataset.sum;
  card.querySelector('[data-el="income"]').textContent = (income).toLocaleString('ru-RU') + ' ₽';
  card.querySelector('[data-el="count"]').textContent  = card.dataset.count;

  // не вешаем card.addEventListener('click', ...) пока не вставим в DOM —
  // вешаем это при подтверждении.

  // сохраняем карточку как pending (перезаписываем предыдущую, если была)
  pendingCard = card;

  // закрываем smart modal (если используется) и открываем окно подтверждения
  if (smartModal && smartModal.classList) smartModal.classList.remove('show');

  // поддержка двух вариантов открытия: если диалог имеет метод _openDeposit (наш ранее предложенный скрипт) — используем его,
  // иначе native showModal, иначе убираем hidden.
  if (dlg) {
    if (typeof dlg._openDeposit === 'function') dlg._openDeposit();
    else if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.removeAttribute('hidden');
  } else {
    console.warn('#dlg-alert не найден — карточка будет добавлена немедленно');
    // fallback: вставляем сразу (но это странно — лучше иметь диалог)
    products.insertBefore(card, banner);
    // навешиваем обработчик безопасно — this будет ссылаться на элемент
    card.addEventListener('click', function (e) {
      openInfo(this); 
    });
    pendingCard = null;
  }
});

// --- Подтверждение: вставляем pendingCard в DOM ---
function confirmInsert() {
  if (!pendingCard) return;

  // вставляем в DOM
  products.insertBefore(pendingCard, banner);

  // вешаем обработчик так, чтобы openInfo получил именно элемент (this / e.currentTarget)
  pendingCard.addEventListener('click', function (e) {
    openInfo(e.currentTarget); // или openInfo(this)
  });

  // обнуляем переменную pendingCard (обработчик уже привязан к элементу)
  pendingCard = null;

  // Закрываем диалог, если он ещё открыт
  if (dlg) {
    if (typeof dlg._closeDeposit === 'function') dlg._closeDeposit();
    else if (typeof dlg.close === 'function') {
      try { dlg.close(); } catch (err) {}
    } else dlg.setAttribute('hidden', '');
  }
}

function cancelPending() {
  pendingCard = null;
  if (dlg) {
    if (typeof dlg._closeDeposit === 'function') dlg._closeDeposit();
    else if (typeof dlg.close === 'function') {
      try { dlg.close(); } catch (err) {}
    } else dlg.setAttribute('hidden', '');
  }
}

// --- Слушаем события от модалки ---
// 1) Кастомные события (если используется предыдущий скрипт модалки)
if (dlg) {
  dlg.addEventListener('deposit:confirm', confirmInsert);
  dlg.addEventListener('deposit:cancel', cancelPending);

  // 2) И на всякий случай — прямые клики на кнопки внутри диалога
  const btnConfirm = dlg.querySelector('#confirmOpen');
  const btnCancel  = dlg.querySelector('.dlg-cancel');

  if (btnConfirm) btnConfirm.addEventListener('click', (e) => {
    e.preventDefault();
    // если кнопка была выключена — ничего не делаем
    if (btnConfirm.disabled) return;
    confirmInsert();
  });

  if (btnCancel) btnCancel.addEventListener('click', (e) => {
    e.preventDefault();
    cancelPending();
  });

  // 3) Если диалог закрывается нативно (например методом close или backdrop),
  //    можно очистить pending, чтобы не оставить "висячую" карточку.
  dlg.addEventListener('close', () => {
    // если диалог закрылся без явного confirm — считаем это отменой
    // (если confirm уже сработал, pendingCard = null)
    if (pendingCard) pendingCard = null;
  });
}

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
    
  

// нежелательные банки 
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

    let suppressOpen = false;

    // pointerdown в capture: предотвращаем дефолт (фокус) и помечаем suppressOpen
    chipsWrap.addEventListener('pointerdown', (e) => {
      const removeEl = e.target.closest('.remove');
      if (removeEl) {
        // предотвращаем переход фокуса и другие стандартные эффекты
        e.preventDefault();
        // помечаем, что следующий focus/click на selection нужно игнорировать
        suppressOpen = true;
        // сбросим флаг в следующем макротаске (чтобы он не висел слишком долго)
        setTimeout(() => { suppressOpen = false; }, 0);
      }
    }, { capture: true });

    // chips: remove by click
    chipsWrap.addEventListener('click', (e) => {
      const removeEl = e.target.closest('.remove');
      if (!removeEl) return;
      // предотвращаем попадание клика в родителя
      e.stopPropagation();

      const chip = removeEl.closest('.ms-chip');
      if (!chip) return;
      const id = chip.getAttribute('data-id');

      // удаляем чип
      deselectById(id);

      // не делаем search.focus() — чтобы не открывать список
      // если хочется фокусировать, можно это делать по явному действию пользователя (например, по клику в свободное место)
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
    
    // click on selection opens search
    selection.addEventListener('click', (e) => {
      if (suppressOpen) {
        // сразу сбрасываем и ничего не делаем
        suppressOpen = false;
        return;
      }
      // если клик попал в чип — ничего не делаем (удаление обработано выше)
      if (e.target.closest('.ms-chip') || e.target.closest('.remove')) return;

      // обычное поведение: переводим фокус в инпут и открываем список
      search.focus();
      doFilter(search.value);
      openList();
    });


    // focus behavior: open list on focus
    selection.addEventListener('focus', (e) => {
      if (suppressOpen) { suppressOpen = false; return; }
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
// окно предупреждения при открытии вклада
  const chk = document.getElementById('openAgree');
  const btn = document.getElementById('confirmOpen');
  chk.addEventListener('change', () => btn.disabled = !chk.checked);
}); 
