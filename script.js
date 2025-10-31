/* Tab functionality */
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Handle hash navigation to tabs
  const hash = window.location.hash;
  if (hash && hash.startsWith('#tab-')) {
    const tabId = hash.replace('#tab-', '');
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) {
      btn.click();
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
});

/* Smooth scrolling for on-page anchors */
document.addEventListener('click', function (e) {
  const target = e.target.closest('a[href^="#"]');
  if (!target) return;
  const href = target.getAttribute('href');
  if (href.length <= 1) return;
  
  // Handle tab navigation
  if (href.startsWith('#tab-')) {
    const tabId = href.replace('#tab-', '');
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) {
      e.preventDefault();
      btn.click();
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }
  }
  
  const el = document.querySelector(href);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* Autofill experience in booking form from CTA buttons */
document.addEventListener('click', function (e) {
  const btn = e.target.closest('[data-experience]');
  if (!btn) return;
  const experience = btn.getAttribute('data-experience');
  const select = document.getElementById('experience');
  if (!select) return;
  const option = Array.from(select.options).find(o => o.value === experience);
  if (option) {
    select.value = option.value;
    const book = document.getElementById('book');
    if (book) book.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* Details open/close UX: close others in the same card */
document.querySelectorAll('.card .details summary').forEach(summary => {
  summary.addEventListener('click', e => {
    const current = e.currentTarget.parentElement;
    const card = current.closest('.card');
    if (!card) return;
    card.querySelectorAll('.details').forEach(d => {
      if (d !== current) d.open = false;
    });
  });
});


// Railway API endpoint (set via env or default to relative)
const API_BASE = window.API_BASE_URL || '';

/* Airbnb-like calendar and availability + pricing */
const flatpickrInit = async () => {
  if (typeof flatpickr === 'undefined') return;
  const input = document.getElementById('dates');
  if (!input) return;

  // Fetch blocked dates from Railway API
  let disabledRanges = [];
  try {
    const res = await fetch(`${API_BASE}/api/availability`);
    if (res.ok) {
      const data = await res.json();
      disabledRanges = data.blocked || [];
    }
  } catch (err) {
    console.warn('Could not fetch availability:', err);
  }

  const isDisabled = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    return disabledRanges.some(r => iso >= r.from && iso <= r.to);
  };

  flatpickr(input, {
    mode: 'range',
    minDate: 'today',
    dateFormat: 'Y-m-d',
    disable: [isDisabled],
    showMonths: 2,
    onClose: () => recalcPrice(),
  });
};

const pricePerDay = {
  double: 700, // per person per day
  single: 1200
};

const dayDiff = (start, end) => {
  const ms = new Date(end) - new Date(start);
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

const recalcPrice = () => {
  const summary = document.getElementById('price-summary');
  const datesVal = document.getElementById('dates')?.value || '';
  const guests = parseInt(document.getElementById('guests')?.value || '1', 10);
  const occupancy = document.getElementById('occupancy')?.value || 'double';
  const experience = document.getElementById('experience')?.value || '';

  if (!summary) return;
  const parts = datesVal.split(' to ');
  if (parts.length !== 2) { summary.textContent = ''; return; }
  const nights = dayDiff(parts[0], parts[1]);
  if (!Number.isFinite(nights) || nights <= 0) { summary.textContent = ''; return; }

  if (nights < 4) {
    summary.innerHTML = `<span style="color:#ffb648">Minimum stay is 4 nights. You selected ${nights}.</span>`;
    return;
  }

  const rate = pricePerDay[occupancy];
  const total = rate * guests * nights;
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
  summary.innerHTML = `
    <div><strong>Estimate:</strong> ${formatted} · ${nights} night(s) · ${guests} guest(s) · ${occupancy} · ${experience}</div>
    <div style="opacity:.8; font-size:.9rem;">Final pricing confirmed in email. Flights not included.</div>
  `;
};

['guests', 'occupancy', 'experience'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', recalcPrice);
});

/* Submit form to Railway API that sends email via Resend and saves to Supabase */
const form = document.querySelector('.booking-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('form-message');
    const btn = document.getElementById('submit-btn');
    if (msg) msg.textContent = '';
    if (msg) msg.className = 'form-message';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    const payload = Object.fromEntries(new FormData(form).entries());

    // basic min nights check client-side
    const parts = (payload.dates || '').split(' to ');
    if (parts.length === 2 && dayDiff(parts[0], parts[1]) < 4) {
      if (msg) {
        msg.textContent = 'Minimum stay is 4 nights.';
        msg.className = 'form-message error';
      }
      if (btn) { btn.disabled = false; btn.textContent = 'Request Availability'; }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      if (msg) {
        msg.textContent = 'Thanks! We received your request and will reply within 24–48 hours.';
        msg.className = 'form-message success';
      }
      form.reset();
      recalcPrice();
      
      // Reset calendar
      const dateInput = document.getElementById('dates');
      if (dateInput && dateInput._flatpickr) {
        dateInput._flatpickr.clear();
      }
    } catch (err) {
      if (msg) {
        msg.textContent = err.message || 'Sorry, something went wrong. Please try again or email us directly.';
        msg.className = 'form-message error';
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Request Availability'; }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  flatpickrInit();
  recalcPrice();
});
