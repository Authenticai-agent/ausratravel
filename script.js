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
  const extraBefore = parseInt(document.getElementById('extra-days-before')?.value || '0', 10) || 0;
  const extraAfter = parseInt(document.getElementById('extra-days-after')?.value || '0', 10) || 0;

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
  const tripTotal = rate * guests * nights;
  const extraTotal = rate * guests * (extraBefore + extraAfter); // Extra days at same rate (accommodation + meals)
  const total = tripTotal + extraTotal;
  const totalNights = nights + extraBefore + extraAfter;
  
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
  const tripFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tripTotal);
  
  let extraText = '';
  if (extraBefore > 0 || extraAfter > 0) {
    const extraFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(extraTotal);
    extraText = `<div style="opacity:.9; font-size:.9rem; margin-top:.4rem;">Trip: ${tripFormatted} (${nights} nights) ${(extraBefore > 0 || extraAfter > 0) ? `+ Extra days: ${extraFormatted} (${extraBefore + extraAfter} nights)` : ''}</div>`;
  }
  
  summary.innerHTML = `
    <div><strong>Estimate:</strong> ${formatted} · ${totalNights} total night(s) · ${guests} guest(s) · ${occupancy}</div>
    ${extraText}
    <div style="opacity:.8; font-size:.9rem; margin-top:.4rem;">Final pricing confirmed in email. Extra days include accommodation & meals only. Flights not included.</div>
  `;
};

['guests', 'occupancy', 'experience', 'extra-days-before', 'extra-days-after'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', recalcPrice);
  if (el) el.addEventListener('input', recalcPrice);
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

/* Questionnaire recommendation engine */
const experienceMapping = {
  'Painting & Glass Art': {
    interests: ['art-creative', 'nature'],
    activity: ['active', 'moderate'],
    group: ['social', 'mixed']
  },
  'Yoga with Goats': {
    interests: ['wellness', 'nature', 'solitude'],
    activity: ['moderate', 'relaxed'],
    group: ['social', 'mixed', 'solo']
  },
  'Cheese & Wine': {
    interests: ['culinary', 'culture-history'],
    activity: ['active', 'moderate'],
    group: ['social', 'mixed']
  },
  'Meditation & Mindfulness': {
    interests: ['wellness', 'solitude'],
    activity: ['relaxed', 'moderate'],
    group: ['solo', 'mixed']
  },
  'Leave Me Alone': {
    interests: ['solitude', 'nature'],
    activity: ['relaxed'],
    group: ['solo']
  },
  'Perfume Making Grasse': {
    interests: ['art-creative', 'culture-history'],
    activity: ['active', 'moderate'],
    group: ['social', 'mixed']
  },
  'Olive Oil Workshop': {
    interests: ['culinary', 'culture-history', 'nature'],
    activity: ['active', 'moderate'],
    group: ['social', 'mixed']
  },
  'Lavender Workshop': {
    interests: ['art-creative', 'nature', 'culture-history'],
    activity: ['active', 'moderate'],
    group: ['social', 'mixed']
  },
  'Castellane Heritage': {
    interests: ['culture-history', 'nature'],
    activity: ['active', 'moderate'],
    group: ['social', 'mixed']
  }
};

const calculateRecommendations = (formData) => {
  const interests = Array.from(formData.getAll('interests'));
  const activity = formData.get('activity_level');
  const group = formData.get('group_preference');

  const scores = {};

  Object.keys(experienceMapping).forEach(exp => {
    let score = 0;
    const mapping = experienceMapping[exp];

    // Score based on interests
    interests.forEach(int => {
      if (mapping.interests.includes(int)) score += 3;
    });

    // Score based on activity level
    if (activity && mapping.activity.includes(activity)) score += 2;

    // Score based on group preference
    if (group && mapping.group.includes(group)) score += 2;

    if (score > 0) scores[exp] = score;
  });

  // Sort by score and return top matches
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([exp]) => exp);
};

const showRecommendations = (recommended) => {
  const container = document.getElementById('recommended-experiences');
  const recommendationsDiv = document.getElementById('recommendations');
  const questionnaire = document.getElementById('pre-questionnaire');
  
  if (!container || !recommendationsDiv || !questionnaire) return;

  container.innerHTML = '';
  
  if (recommended.length === 0) {
    container.innerHTML = '<div class="recommended-card"><h5>All Experiences Available</h5><p>Based on your preferences, any of our experiences could work for you! Browse below or continue to book.</p></div>';
  } else {
    recommended.forEach(exp => {
      const card = document.createElement('div');
      card.className = 'recommended-card';
      card.innerHTML = `
        <h5>${exp}</h5>
        <p>Based on your interests and preferences, this experience seems like a great match for you.</p>
        <button type="button" class="btn btn-secondary small" data-select-exp="${exp}" style="margin-top:.75rem;">Select This Experience</button>
      `;
      container.appendChild(card);
    });
  }

  questionnaire.style.display = 'none';
  recommendationsDiv.style.display = 'block';

  // Handle select experience buttons
  container.querySelectorAll('[data-select-exp]').forEach(btn => {
    btn.addEventListener('click', () => {
      const exp = btn.getAttribute('data-select-exp');
      const select = document.getElementById('experience');
      if (select) {
        const option = Array.from(select.options).find(o => o.value === exp || o.textContent.includes(exp));
        if (option) select.value = option.value;
      }
      proceedToBooking();
    });
  });
};

const proceedToBooking = () => {
  const questionnaireStep = document.getElementById('questionnaire-step');
  const bookingStep = document.getElementById('booking-step');
  if (questionnaireStep) questionnaireStep.classList.remove('active');
  if (bookingStep) {
    bookingStep.classList.add('active');
    bookingStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Questionnaire form handling
const questionnaireForm = document.getElementById('pre-questionnaire');
if (questionnaireForm) {
  questionnaireForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(questionnaireForm);
    
    // Store questionnaire data in sessionStorage for later
    const questionnaireData = {};
    formData.forEach((value, key) => {
      if (key === 'interests') {
        if (!questionnaireData[key]) questionnaireData[key] = [];
        questionnaireData[key].push(value);
      } else {
        questionnaireData[key] = value;
      }
    });
    sessionStorage.setItem('questionnaireData', JSON.stringify(questionnaireData));
    
    const recommended = calculateRecommendations(formData);
    showRecommendations(recommended);
  });
}

// Skip questionnaire
const skipBtn = document.getElementById('skip-questionnaire');
if (skipBtn) {
  skipBtn.addEventListener('click', () => {
    proceedToBooking();
  });
}

// Back to questionnaire
const backBtn = document.getElementById('back-to-questionnaire');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    const recommendationsDiv = document.getElementById('recommendations');
    const questionnaire = document.getElementById('pre-questionnaire');
    if (recommendationsDiv) recommendationsDiv.style.display = 'none';
    if (questionnaire) questionnaire.style.display = 'block';
  });
}

// Proceed to booking from recommendations
const proceedBtn = document.getElementById('proceed-to-booking');
if (proceedBtn) {
  proceedBtn.addEventListener('click', () => {
    proceedToBooking();
  });
}

// Include questionnaire data in booking submission
const bookingForm = document.querySelector('.booking-form');
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    // Get questionnaire data if available and add as hidden fields
    const questionnaireData = sessionStorage.getItem('questionnaireData');
    if (questionnaireData) {
      const data = JSON.parse(questionnaireData);
      
      // Create hidden fields for questionnaire data
      Object.keys(data).forEach(key => {
        const value = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
        if (value) {
          let hiddenInput = document.querySelector(`input[name="${key}"][type="hidden"]`);
          if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = key;
            bookingForm.appendChild(hiddenInput);
          }
          hiddenInput.value = value;
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  flatpickrInit();
  recalcPrice();
});
