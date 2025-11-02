/* Tab functionality */
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none'; // Explicitly hide all tabs
      });
      
      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) {
        targetContent.classList.add('active');
        targetContent.style.display = 'block'; // Explicitly show active tab
      }
      
      // Reinitialize calendar when booking tab is clicked
      if (tabId === 'booking') {
        // If booking step is not visible, ensure it's shown (in case user navigates directly)
        const bookingStep = document.getElementById('booking-step');
        const questionnaireStep = document.getElementById('questionnaire-step');
        // Only auto-show booking if coming from direct tab click (not from questionnaire flow)
        if (bookingStep && bookingStep.style.display === 'none' && questionnaireStep && !questionnaireStep.classList.contains('active')) {
          // User clicked tab directly - show booking form
          proceedToBooking();
        } else {
          // Just reinit calendar
          setTimeout(() => {
            flatpickrInit();
          }, 100);
        }
      }
    });
  });

  // Subtabs functionality for About Us section
  const subtabBtns = document.querySelectorAll('.subtab-btn');
  const subtabContents = document.querySelectorAll('.subtab-content');

  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subtabId = btn.getAttribute('data-subtab');
      
      // Remove active class from all subtab buttons and contents
      subtabBtns.forEach(b => b.classList.remove('active'));
      subtabContents.forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
      });
      
      // Add active class to clicked button and show corresponding content
      btn.classList.add('active');
      const targetSubtabContent = document.getElementById(`subtab-${subtabId}`);
      if (targetSubtabContent) {
        targetSubtabContent.classList.add('active');
        targetSubtabContent.style.display = 'block';
      }
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

/* Generate available dates based on experience schedule */
function generateAvailableDates(experienceName) {
  const dates = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  
  // Helper to get first day of week (Monday = 1)
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }
  
  // Helper to format date range
  function formatDateRange(start) {
    const end = new Date(start);
    end.setDate(end.getDate() + 3); // 4 days, 3 nights
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const year = start.getFullYear() !== now.getFullYear() ? `, ${start.getFullYear()}` : '';
    return `${startStr}–${endStr}${year}`;
  }
  
  // Generate dates for next 18 months
  for (let year = currentYear; year <= nextYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      
      // Get first Monday of month (week 1)
      let firstMonday = getWeekStart(firstDay);
      if (firstMonday.getMonth() !== month - 1) {
        firstMonday = new Date(firstMonday);
        firstMonday.setDate(firstMonday.getDate() + 7);
      }
      
      // Calculate week dates
      const week1Start = new Date(firstMonday);
      const week2Start = new Date(firstMonday);
      week2Start.setDate(week2Start.getDate() + 7);
      const week3Start = new Date(week2Start);
      week3Start.setDate(week3Start.getDate() + 7);
      const week4Start = new Date(week3Start);
      week4Start.setDate(week4Start.getDate() + 7);
      
      // Skip if week start is in the past
      const skipIfPast = (date) => date > now;
      
      // Painting: week 1 (Jan, Feb, Mar, Oct, Nov, Dec)
      if (experienceName === 'Painting & Glass Art' && [1, 2, 3, 10, 11, 12].includes(month)) {
        if (skipIfPast(week1Start)) dates.push({ start: new Date(week1Start), label: formatDateRange(week1Start) });
      }
      
      // Yoga: week 1 (Apr, May, Sep)
      if (experienceName === 'Yoga with Goats' && [4, 5, 9].includes(month)) {
        if (skipIfPast(week1Start)) dates.push({ start: new Date(week1Start), label: formatDateRange(week1Start) });
      }
      
      // Cheese & Wine: week 2 every month except June, July, August
      if (experienceName === 'Cheese & Wine' && ![6, 7, 8].includes(month)) {
        if (skipIfPast(week2Start)) dates.push({ start: new Date(week2Start), label: formatDateRange(week2Start) });
      }
      
      // Meditation: week 3 (May, Apr, Sep, Oct, Nov)
      if (experienceName === 'Meditation & Mindfulness' && [4, 5, 9, 10, 11].includes(month)) {
        if (skipIfPast(week3Start)) dates.push({ start: new Date(week3Start), label: formatDateRange(week3Start) });
      }
      
      // Leave Me Alone: week 3 (Jan, Feb, Mar, Dec)
      if (experienceName === 'Leave Me Alone' && [1, 2, 3, 12].includes(month)) {
        if (skipIfPast(week3Start)) dates.push({ start: new Date(week3Start), label: formatDateRange(week3Start) });
      }
      
      // Truffles: week 4 (Mar, Apr, Sep, Oct)
      if (experienceName === 'Truffle Hunting' && [3, 4, 9, 10].includes(month)) {
        if (skipIfPast(week4Start)) dates.push({ start: new Date(week4Start), label: formatDateRange(week4Start) });
      }
      
      // Olive making: week 4 (August: together with lavender)
      if (experienceName === 'Olive Oil Workshop' && month === 8) {
        if (skipIfPast(week4Start)) dates.push({ start: new Date(week4Start), label: formatDateRange(week4Start) });
      }
      
      // Lavender: all weeks in June, July, August
      if (experienceName === 'Lavender Workshop' && [6, 7, 8].includes(month)) {
        [week1Start, week2Start, week3Start, week4Start].forEach(weekStart => {
          if (skipIfPast(weekStart)) dates.push({ start: new Date(weekStart), label: formatDateRange(weekStart) });
        });
      }
      
      // Verdon (Castellane Heritage): all remaining weeks (we'll add this after calculating others)
      // Perfume Making: weeks left unused (calculated dynamically)
    }
  }
  
  // Castellane Heritage & Verdon Discovery: Fill remaining weeks (simplified - show all weeks for now)
  if (experienceName === 'Castellane Heritage') {
    for (let year = currentYear; year <= nextYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const firstDay = new Date(year, month - 1, 1);
        let firstMonday = getWeekStart(firstDay);
        if (firstMonday.getMonth() !== month - 1) {
          firstMonday = new Date(firstMonday);
          firstMonday.setDate(firstMonday.getDate() + 7);
        }
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(firstMonday);
          weekStart.setDate(weekStart.getDate() + (week * 7));
          // Skip if already allocated or in the past
          if (skipIfPast(weekStart)) {
            dates.push({ start: new Date(weekStart), label: formatDateRange(weekStart) });
          }
        }
      }
    }
  }
  
  // Perfume Making: Add dates for remaining unused weeks (simplified - show weeks 2-4 in months not covered)
  if (experienceName === 'Perfume Making Grasse') {
    for (let year = currentYear; year <= nextYear; year++) {
      for (let month = 1; month <= 12; month++) {
        // Skip June, July, August (lavender season)
        if ([6, 7, 8].includes(month)) continue;
        
        const firstDay = new Date(year, month - 1, 1);
        let firstMonday = getWeekStart(firstDay);
        if (firstMonday.getMonth() !== month - 1) {
          firstMonday = new Date(firstMonday);
          firstMonday.setDate(firstMonday.getDate() + 7);
        }
        
        // Add weeks 2, 3, 4 for most months (week 1 is often taken)
        const week2Start = new Date(firstMonday);
        week2Start.setDate(week2Start.getDate() + 7);
        const week3Start = new Date(week2Start);
        week3Start.setDate(week3Start.getDate() + 7);
        const week4Start = new Date(week3Start);
        week4Start.setDate(week4Start.getDate() + 7);
        
        // Skip week 2 if it's Cheese & Wine month (already covered)
        if (![6, 7, 8].includes(month) && skipIfPast(week2Start)) {
          // Only add if not already in dates (simplified)
          dates.push({ start: new Date(week2Start), label: formatDateRange(week2Start) });
        }
        
        // Add week 3 if not meditation or leave me alone
        if (![4, 5, 9, 10, 11].includes(month) && ![1, 2, 3, 12].includes(month) && skipIfPast(week3Start)) {
          dates.push({ start: new Date(week3Start), label: formatDateRange(week3Start) });
        }
        
        // Add week 4 if not truffles or olive
        if (![3, 4, 9, 10].includes(month) && month !== 8 && skipIfPast(week4Start)) {
          dates.push({ start: new Date(week4Start), label: formatDateRange(week4Start) });
        }
      }
    }
  }
  
  // Sort dates and limit to next 12 months
  dates.sort((a, b) => a.start - b.start);
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  return dates.filter(d => d.start <= oneYearFromNow);
}

/* Display available dates as clickable links */
function showAvailableDates(experienceName) {
  const container = document.getElementById('available-dates-container');
  const list = document.getElementById('available-dates-list');
  if (!container || !list) return;
  
  const dates = generateAvailableDates(experienceName);
  
  if (dates.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  list.innerHTML = '';
  dates.forEach(dateItem => {
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'date-link';
    link.textContent = dateItem.label;
    link.style.cssText = `
      display: block;
      padding: 0.75rem 1rem;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--primary);
      text-decoration: none;
      transition: all 0.2s;
      font-weight: 500;
    `;
    link.addEventListener('mouseenter', function() {
      this.style.background = 'rgba(37, 99, 235, 0.08)';
      this.style.borderColor = 'var(--primary)';
    });
    link.addEventListener('mouseleave', function() {
      this.style.background = 'var(--bg-elev)';
      this.style.borderColor = 'var(--border)';
    });
    link.addEventListener('click', function(e) {
      e.preventDefault();
      // 4 days/3 nights package: start date + 3 days = end date (check-in day 1, check-out day 4)
      const endDate = new Date(dateItem.start);
      endDate.setDate(endDate.getDate() + 3);
      const dateInput = document.getElementById('dates');
      if (dateInput) {
        const startStr = dateItem.start.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        dateInput.value = `${startStr} to ${endStr}`;
        if (dateInput._flatpickr) {
          dateInput._flatpickr.setDate([new Date(startStr), new Date(endStr)], true);
        }
        recalcPrice();
      }
      // Scroll to form
      dateInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    list.appendChild(link);
  });
  
  container.style.display = 'block';
}

/* Autofill experience in booking form from CTA buttons */
document.addEventListener('click', function (e) {
  const btn = e.target.closest('[data-experience]');
  if (!btn) return;
  e.preventDefault();
  const experience = btn.getAttribute('data-experience');
  const select = document.getElementById('experience');
  if (select) {
    const option = Array.from(select.options).find(o => o.value === experience);
    if (option) select.value = option.value;
  }
  
  // Switch to booking tab and show booking form directly (skip questionnaire)
  const bookingTabBtn = document.querySelector('[data-tab="booking"]');
  if (bookingTabBtn) {
    bookingTabBtn.click();
    // Skip questionnaire and go directly to booking
    setTimeout(() => {
      proceedToBooking();
      // Show available dates for this experience
      showAvailableDates(experience);
    }, 100);
  }
});

// Listen for experience dropdown changes
const experienceSelect = document.getElementById('experience');
if (experienceSelect) {
  experienceSelect.addEventListener('change', function() {
    const selected = this.value;
    if (selected) {
      showAvailableDates(selected);
    } else {
      const container = document.getElementById('available-dates-container');
      if (container) container.style.display = 'none';
    }
  });
}

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

  // Destroy existing Flatpickr instance if it exists
  if (input._flatpickr) {
    input._flatpickr.destroy();
  }

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
  single: 900
};

const dayDiff = (start, end) => {
  const ms = new Date(end) - new Date(start);
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

const recalcPrice = () => {
  const summary = document.getElementById('price-summary');
  const datesVal = document.getElementById('dates')?.value || '';
  const guests = parseInt(document.getElementById('total-guests')?.value || '1', 10);
  const occupancy = document.getElementById('occupancy')?.value || 'double';
  const experience = document.getElementById('experience')?.value || '';
  
  // Calculate extra days from date pickers
  const extraBeforeDates = document.getElementById('extra-dates-before')?.value || '';
  const extraAfterDates = document.getElementById('extra-dates-after')?.value || '';
  const extraBefore = extraBeforeDates ? calculateNightsFromDates(extraBeforeDates) : 0;
  const extraAfter = extraAfterDates ? calculateNightsFromDates(extraAfterDates) : 0;
  
  function calculateNightsFromDates(dateString) {
    if (!dateString) return 0;
    const parts = dateString.split(' to ');
    if (parts.length === 2) {
      return dayDiff(parts[0], parts[1]);
    } else if (parts.length === 1) {
      // Single date, assume 1 night
      return 1;
    }
    return 0;
  }

  if (!summary) return;
  const parts = datesVal.split(' to ');
  if (parts.length !== 2) { summary.textContent = ''; return; }
  const nights = dayDiff(parts[0], parts[1]);
  if (!Number.isFinite(nights) || nights <= 0) { summary.textContent = ''; return; }

  // Packages are 4 days/3 nights - ensure dates are valid
  if (nights < 3 || nights > 4) {
    // Show warning if dates don't match standard package
    if (nights !== 3) {
      summary.innerHTML = `<span style="color:#ffb648">We have 4 days/3 nights packages. Please select dates that match this duration.</span>`;
      return;
    }
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

['total-guests', 'occupancy', 'experience', 'extra-dates-before', 'extra-dates-after'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', recalcPrice);
  if (el) el.addEventListener('input', recalcPrice);
});

// Handle extra days checkbox
const needExtraDaysCheckbox = document.getElementById('need-extra-days');
const extraDaysSection = document.getElementById('extra-days-section');
if (needExtraDaysCheckbox && extraDaysSection) {
  needExtraDaysCheckbox.addEventListener('change', (e) => {
    extraDaysSection.style.display = e.target.checked ? 'block' : 'none';
    if (!e.target.checked) {
      document.getElementById('extra-dates-before').value = '';
      document.getElementById('extra-dates-after').value = '';
      recalcPrice();
    }
  });
}

/* Submit form with Stripe payment */
const form = document.getElementById('booking-form-main');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('form-message');
    const btn = document.getElementById('submit-btn');
    const stripeErrors = document.getElementById('stripe-errors');
    
    if (msg) msg.textContent = '';
    if (msg) msg.className = 'form-message';
    if (stripeErrors) stripeErrors.textContent = '';
    if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

    // Build payload
    const formData = new FormData(form);
    const payload = {};
    
    // Primary guest info
    payload.first_name = formData.get('first_name');
    payload.last_name = formData.get('last_name');
    payload.name = `${payload.first_name} ${payload.last_name}`;
    payload.email = formData.get('email');
    payload.phone = formData.get('phone');
    payload.address = formData.get('address');
    
    // Trip details
    payload.experience = formData.get('experience');
    payload.dates = formData.get('dates');
    payload.occupancy = formData.get('occupancy');
    payload.total_guests = parseInt(formData.get('total_guests') || '1', 10);
    
    // Travel companions
    const companions = [];
    const companionEntries = document.querySelectorAll('.companion-entry');
    companionEntries.forEach((entry, index) => {
      const companionId = entry.getAttribute('data-companion-id');
      const firstName = formData.get(`companion_first_name_${companionId}`);
      const lastName = formData.get(`companion_last_name_${companionId}`);
      if (firstName && lastName) {
        companions.push({
          first_name: firstName,
          last_name: lastName,
          email: formData.get(`companion_email_${companionId}`) || '',
          phone: formData.get(`companion_phone_${companionId}`) || ''
        });
      }
    });
    payload.travel_companions = companions;
    
    // Extra days
    const extraDatesBefore = formData.get('extra_dates_before') || '';
    const extraDatesAfter = formData.get('extra_dates_after') || '';
    
    if (extraDatesBefore) {
      const beforeParts = extraDatesBefore.split(' to ');
      payload.extra_days_before = {
        dates: beforeParts,
        nights: beforeParts.length === 2 ? dayDiff(beforeParts[0], beforeParts[1]) : 1
      };
    }
    
    if (extraDatesAfter) {
      const afterParts = extraDatesAfter.split(' to ');
      payload.extra_days_after = {
        dates: afterParts,
        nights: afterParts.length === 2 ? dayDiff(afterParts[0], afterParts[1]) : 1
      };
    }
    
    // Add-ons
    const addons = formData.getAll('addons').filter(a => a);
    payload.addons = addons;
    
    // Notes
    payload.notes = formData.get('notes') || '';
    
    // Add questionnaire data
    const questionnaireData = sessionStorage.getItem('questionnaireData');
    if (questionnaireData) {
      payload.questionnaire_data = JSON.parse(questionnaireData);
    }

    // Validate dates match 4 days/3 nights packages
    const parts = (payload.dates || '').split(' to ');
    if (parts.length === 2) {
      const nights = dayDiff(parts[0], parts[1]);
      if (nights !== 3 && nights !== 4) {
        if (msg) {
          msg.textContent = 'We have 4 days/3 nights packages. Please select dates that match this duration, or contact us for custom dates.';
          msg.className = 'form-message error';
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Pay $299 Deposit & Complete Booking'; }
        return;
      }
    }

    try {
      const apiUrl = window.API_BASE_URL || '';
      
      // Step 1: Create payment intent
      const paymentResponse = await fetch(`${apiUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 29900, booking_data: payload }) // $299 in cents
      });
      
      const paymentData = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Payment setup failed');
      }
      
      // Step 2: Confirm payment with Stripe
      if (!stripe || !paymentElement) {
        throw new Error('Payment system not initialized. Please refresh the page.');
      }
      
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements: { payment: paymentElement },
        clientSecret: paymentData.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}?booking=success`,
        },
        redirect: 'if_required'
      });
      
      if (stripeError) {
        if (stripeErrors) {
          stripeErrors.textContent = stripeError.message;
        }
        if (msg) {
          msg.textContent = stripeError.message;
          msg.className = 'form-message error';
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Pay $299 Deposit & Complete Booking'; }
        return;
      }
      
      // Step 3: Submit booking with payment confirmation
      payload.stripe_payment_intent_id = paymentIntent.id;
      payload.deposit_paid = paymentIntent.status === 'succeeded';
      
      const bookingResponse = await fetch(`${apiUrl}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const bookingData = await bookingResponse.json();
      
      if (!bookingResponse.ok) {
        throw new Error(bookingData.error || 'Booking failed');
      }
      
      if (msg) {
        msg.textContent = 'Thank you! Your booking has been confirmed. Check your email for details.';
        msg.className = 'form-message success';
      }
      
      // Reset form
      form.reset();
      document.getElementById('travel-companions-container').innerHTML = '';
      companionCount = 0;
      recalcPrice();
      
      // Reset calendars
      const dateInputs = ['dates', 'extra-dates-before', 'extra-dates-after'];
      dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && input._flatpickr) {
          input._flatpickr.clear();
        }
      });
      
      // Scroll to success message
      if (msg) {
        msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      
    } catch (err) {
      console.error('Booking error:', err);
      if (msg) {
        msg.textContent = err.message || 'Sorry, something went wrong. Please try again or email us directly.';
        msg.className = 'form-message error';
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Pay $299 Deposit & Complete Booking'; }
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

// Map experience display names to mapping keys
const experienceNameMap = {
  'Painting & Glass Art': 'Painting & Glass Art',
  'Yoga with Goats': 'Yoga with Goats',
  'Cheese & Wine': 'Cheese & Wine',
  'Meditation & Mindfulness': 'Meditation & Mindfulness',
  'Leave Me Alone': 'Leave Me Alone',
  'Perfume Making Grasse': 'Perfume Making Grasse',
  'Olive Oil Workshop': 'Olive Oil Workshop',
  'Lavender Workshop': 'Lavender Workshop',
  'Castellane Heritage': 'Castellane Heritage'
};

const calculateRecommendations = (formData) => {
  const interests = Array.from(formData.getAll('interests'));
  const activity = formData.get('activity_level');
  const group = formData.get('group_preference');

  const scores = {};
  const matchedExperiences = [];

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

    if (score > 0) {
      scores[exp] = score;
      matchedExperiences.push(exp);
    }
  });

  // Return all matched experiences (sorted by score, but show all that match)
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([exp]) => exp);
};

// Filter experience cards based on recommendations
function filterExperiences(matchedExperiences) {
  const experienceCards = document.querySelectorAll('.experiences .card');
  
  if (!matchedExperiences || matchedExperiences.length === 0) {
    // Show all experiences if no filter
    experienceCards.forEach(card => {
      card.style.display = '';
    });
    return;
  }

  // Map experience names to card buttons
  const experienceButtonMap = {
    'Painting & Glass Art': 'Painting & Glass Art',
    'Yoga with Goats': 'Yoga with Goats',
    'Cheese & Wine': 'Cheese & Wine',
    'Meditation & Mindfulness': 'Meditation & Mindfulness',
    'Leave Me Alone': 'Leave Me Alone',
    'Perfume Making Grasse': 'Perfume Making Grasse',
    'Olive Oil Workshop': 'Olive Oil Workshop',
    'Lavender Workshop': 'Lavender Workshop',
    'Castellane Heritage': 'Castellane Heritage'
  };

  experienceCards.forEach(card => {
    const bookButton = card.querySelector('a[data-experience]');
    if (bookButton) {
      const experienceName = bookButton.getAttribute('data-experience');
      // Check if this experience matches any of the recommended ones
      const isMatch = matchedExperiences.some(matched => {
        // Direct match
        if (experienceName === matched) return true;
        // Partial match (e.g., "Painting & Glass" matches "Painting & Glass Art")
        if (experienceName.includes(matched) || matched.includes(experienceName)) return true;
        // Check the button text
        const buttonText = bookButton.textContent.trim();
        if (buttonText.includes(matched.replace('&', '&'))) return true;
        return false;
      });

      if (isMatch) {
        card.style.display = '';
        card.classList.add('filtered-match');
      } else {
        card.style.display = 'none';
      }
    }
  });

  // Scroll to experiences section
  const experiencesSection = document.getElementById('experiences');
  if (experiencesSection && matchedExperiences.length > 0) {
    setTimeout(() => {
      experiencesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }
}

const showRecommendations = (recommended) => {
  const container = document.getElementById('recommended-experiences');
  const recommendationsDiv = document.getElementById('recommendations');
  const questionnaire = document.getElementById('pre-questionnaire');
  
  if (!container || !recommendationsDiv || !questionnaire) return;

  container.innerHTML = '';
  
  // Filter experiences based on recommendations
  filterExperiences(recommended);
  
  if (recommended.length === 0) {
    container.innerHTML = '<div class="recommended-card"><h5>All Experiences Available</h5><p>Based on your preferences, any of our experiences could work for you! Browse below or continue to book.</p></div>';
    // Show all experiences if no specific matches
    filterExperiences([]);
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
  if (questionnaireStep) {
    questionnaireStep.classList.remove('active');
    questionnaireStep.style.display = 'none';
  }
  if (bookingStep) {
    bookingStep.classList.add('active');
    bookingStep.style.display = 'block';
    // Switch to booking tab
    const bookingTabBtn = document.querySelector('[data-tab="booking"]');
    if (bookingTabBtn) bookingTabBtn.click();
    // Reinitialize calendar when booking tab becomes visible
    setTimeout(() => {
      flatpickrInit();
      bookingStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
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

// Skip questionnaire - show all experiences
const skipBtn = document.getElementById('skip-questionnaire');
if (skipBtn) {
  skipBtn.addEventListener('click', () => {
    filterExperiences([]); // Show all experiences
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


// Custom Request Form Modal
const customFormModal = document.getElementById('custom-form-modal');
const showCustomFormBtn = document.getElementById('show-custom-form');
const closeCustomFormBtn = document.getElementById('close-custom-form');
const cancelCustomFormBtn = document.getElementById('cancel-custom-form');
const customRequestForm = document.getElementById('custom-request-form');
const customFormMessage = document.getElementById('custom-form-message');

function showCustomForm() {
  if (customFormModal) {
    customFormModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => {
      const firstInput = customRequestForm?.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }
}

function hideCustomForm() {
  if (customFormModal) {
    customFormModal.style.display = 'none';
    document.body.style.overflow = '';
    customRequestForm?.reset();
    if (customFormMessage) {
      customFormMessage.textContent = '';
      customFormMessage.className = '';
    }
  }
}

if (showCustomFormBtn) {
  showCustomFormBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showCustomForm();
  });
}

if (closeCustomFormBtn) {
  closeCustomFormBtn.addEventListener('click', hideCustomForm);
}

if (cancelCustomFormBtn) {
  cancelCustomFormBtn.addEventListener('click', hideCustomForm);
}

// Close modal when clicking outside
if (customFormModal) {
  customFormModal.addEventListener('click', (e) => {
    if (e.target === customFormModal) {
      hideCustomForm();
    }
  });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && customFormModal && customFormModal.style.display !== 'none') {
    hideCustomForm();
  }
});

// Handle custom request form submission
if (customRequestForm) {
  customRequestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = customRequestForm.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    if (customFormMessage) {
      customFormMessage.textContent = '';
      customFormMessage.className = '';
    }

    const formData = new FormData(customRequestForm);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      notes: formData.get('notes')
    };

    try {
      const apiUrl = window.API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/custom-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }

      if (customFormMessage) {
        customFormMessage.textContent = 'Thank you! Your custom request has been submitted. We\'ll get back to you within 24–48 hours.';
        customFormMessage.className = 'form-message success';
      }

      customRequestForm.reset();
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        hideCustomForm();
      }, 3000);

    } catch (error) {
      console.error('Custom request error:', error);
      if (customFormMessage) {
        customFormMessage.textContent = error.message || 'Something went wrong. Please try again or contact us directly.';
        customFormMessage.className = 'form-message error';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

// Reviews functionality
const reviewForm = document.getElementById('review-form');
const reviewsList = document.getElementById('reviews-list');
const reviewFormMessage = document.getElementById('review-form-message');

// Load reviews on page load
async function loadReviews() {
  try {
    const apiUrl = window.API_BASE_URL || '';
    const response = await fetch(`${apiUrl}/api/reviews`);
    const data = await response.json();
    
    if (data.success && data.reviews) {
      displayReviews(data.reviews);
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

// Display reviews
function displayReviews(reviews) {
  if (!reviewsList) return;
  
  if (reviews.length === 0) {
    reviewsList.innerHTML = '<p class="reviews-empty">No reviews yet. Be the first to share your experience!</p>';
    return;
  }
  
  reviewsList.innerHTML = reviews.map(review => {
    const stars = '★'.repeat(review.rating);
    const date = new Date(review.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    return `
      <div class="review-item">
        <div class="review-header">
          <div>
            <div class="review-name">${escapeHtml(review.name)}</div>
            <div class="review-rating">${stars}</div>
          </div>
          <div class="review-date">${date}</div>
        </div>
        <p class="review-text">${escapeHtml(review.review)}</p>
      </div>
    `;
  }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle review form submission
if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = reviewForm.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    if (reviewFormMessage) {
      reviewFormMessage.textContent = '';
      reviewFormMessage.className = '';
    }

    const formData = new FormData(reviewForm);
    const data = {
      name: formData.get('name'),
      rating: parseInt(formData.get('rating'), 10),
      review: formData.get('review')
    };

    try {
      const apiUrl = window.API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review');
      }

      if (reviewFormMessage) {
        reviewFormMessage.textContent = 'Thank you! Your review has been submitted and will appear shortly.';
        reviewFormMessage.className = 'form-message success';
      }

      reviewForm.reset();
      
      // Reload reviews to show the new one
      await loadReviews();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        if (reviewFormMessage) {
          reviewFormMessage.textContent = '';
          reviewFormMessage.className = '';
        }
      }, 3000);

    } catch (error) {
      console.error('Review submission error:', error);
      if (reviewFormMessage) {
        reviewFormMessage.textContent = error.message || 'Something went wrong. Please try again.';
        reviewFormMessage.className = 'form-message error';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

// Travel companions management
let companionCount = 0;

function addCompanionField() {
  companionCount++;
  const container = document.getElementById('travel-companions-container');
  if (!container) return;
  
  // Person number is companionCount + 1 (because Person 1 is the primary guest)
  const personNumber = companionCount + 1;
  
  const companionDiv = document.createElement('div');
  companionDiv.className = 'companion-entry';
  companionDiv.setAttribute('data-companion-id', companionCount);
  companionDiv.innerHTML = `
    <div class="companion-card" style="background: var(--bg-elev); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
      <div class="companion-header">
        <button type="button" class="btn btn-secondary small remove-companion" data-id="${companionCount}" style="padding: 0.5rem 0.9rem; font-size: 0.9rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); margin-bottom: 0.75rem; width: 100%;">Remove</button>
        <h5 style="margin: 0; font-size: 1rem; color: var(--text); font-weight: 600;">Person ${personNumber}</h5>
      </div>
      <div class="form-row two">
        <div>
          <label style="color: var(--text); font-weight: 600;">First Name <span class="required">*</span></label>
          <input type="text" name="companion_first_name_${companionCount}" required style="background: var(--card); border: 1px solid var(--border); color: var(--text);">
        </div>
        <div>
          <label style="color: var(--text); font-weight: 600;">Last Name <span class="required">*</span></label>
          <input type="text" name="companion_last_name_${companionCount}" required style="background: var(--card); border: 1px solid var(--border); color: var(--text);">
        </div>
      </div>
      <div class="form-row two">
        <div>
          <label style="color: var(--text); font-weight: 600;">Email</label>
          <input type="email" name="companion_email_${companionCount}" style="background: var(--card); border: 1px solid var(--border); color: var(--text);">
        </div>
        <div>
          <label style="color: var(--text); font-weight: 600;">Phone</label>
          <input type="tel" name="companion_phone_${companionCount}" style="background: var(--card); border: 1px solid var(--border); color: var(--text);">
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(companionDiv);
  
  // Add remove button handler
  const removeBtn = companionDiv.querySelector('.remove-companion');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      companionDiv.remove();
      updateCompanionNumbers();
    });
  }
}

function updateCompanionNumbers() {
  const companions = document.querySelectorAll('.companion-entry');
  companions.forEach((comp, index) => {
    const h5 = comp.querySelector('h5');
    // Person 1 is the primary guest, so companions start at Person 2
    if (h5) h5.textContent = `Person ${index + 2}`;
  });
}

// Add companion button
const addCompanionBtn = document.getElementById('add-companion-btn');
if (addCompanionBtn) {
  addCompanionBtn.addEventListener('click', () => {
    const totalGuests = parseInt(document.getElementById('total-guests')?.value || '1', 10);
    const currentCompanions = document.querySelectorAll('.companion-entry').length;
    
    // Don't allow more companions than total guests - 1 (primary guest)
    if (currentCompanions >= totalGuests - 1) {
      alert(`You can add up to ${totalGuests - 1} travel companion(s) based on your total guests count.`);
      return;
    }
    
    addCompanionField();
  });
}

// Update companions when total guests changes
const totalGuestsInput = document.getElementById('total-guests');
if (totalGuestsInput) {
  totalGuestsInput.addEventListener('change', () => {
    const totalGuests = parseInt(totalGuestsInput.value || '1', 10);
    const currentCompanions = document.querySelectorAll('.companion-entry').length;
    
    // Remove excess companions if total guests is reduced
    if (currentCompanions > totalGuests - 1) {
      const companions = document.querySelectorAll('.companion-entry');
      for (let i = companions.length - 1; i >= totalGuests - 1; i--) {
        companions[i].remove();
      }
      updateCompanionNumbers();
    }
  });
}

// Initialize Stripe (will be configured with publishable key from backend)
let stripe = null;
let paymentElement = null;

async function initializeStripe() {
  try {
    // Get Stripe publishable key from backend
    const apiUrl = window.API_BASE_URL || '';
    const response = await fetch(`${apiUrl}/api/stripe-config`);
    const config = await response.json();
    
    if (config.publishableKey) {
      stripe = Stripe(config.publishableKey);
      const elements = stripe.elements({
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#3da6ff',
            colorBackground: '#0e1319',
            colorText: '#e7edf3',
            colorDanger: '#ff6b6b',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '12px'
          }
        }
      });
      
      paymentElement = elements.create('payment');
      paymentElement.mount('#stripe-payment-element');
    }
  } catch (error) {
    console.error('Stripe initialization error:', error);
    // Show fallback message
    const stripeContainer = document.getElementById('stripe-payment-element');
    if (stripeContainer) {
      stripeContainer.innerHTML = '<p style="color: var(--muted);">Payment processing will be available shortly.</p>';
    }
  }
}

// Initialize extra days calendars
function initExtraDaysCalendars() {
  const extraBeforeInput = document.getElementById('extra-dates-before');
  const extraAfterInput = document.getElementById('extra-dates-after');
  
  if (extraBeforeInput) {
    flatpickr(extraBeforeInput, {
      mode: 'range',
      minDate: 'today',
      dateFormat: 'Y-m-d',
      onClose: () => recalcPrice(),
    });
  }
  
  if (extraAfterInput) {
    flatpickr(extraAfterInput, {
      mode: 'range',
      minDate: 'today',
      dateFormat: 'Y-m-d',
      onClose: () => recalcPrice(),
    });
  }
}


document.addEventListener('DOMContentLoaded', () => {
  flatpickrInit();
  recalcPrice();
  loadReviews();
  initializeStripe();
  
  // Initialize extra days calendars when checkbox is checked
  const needExtraDaysCheckbox = document.getElementById('need-extra-days');
  if (needExtraDaysCheckbox) {
    needExtraDaysCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        setTimeout(initExtraDaysCalendars, 100);
      }
    });
  }
  
  // Handle cancellation policy link click - show modal
  const cancellationLink = document.getElementById('cancellation-policy-link');
  const cancellationModal = document.getElementById('cancellation-policy-modal');
  const closeCancellationModal = document.getElementById('close-cancellation-modal');
  
  function showCancellationModal() {
    if (cancellationModal) {
      cancellationModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }
  
  function hideCancellationModal() {
    if (cancellationModal) {
      cancellationModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
  
  if (cancellationLink) {
    cancellationLink.addEventListener('click', (e) => {
      e.preventDefault();
      showCancellationModal();
    });
  }
  
  if (closeCancellationModal) {
    closeCancellationModal.addEventListener('click', hideCancellationModal);
  }
  
  // Close modal when clicking outside
  if (cancellationModal) {
    cancellationModal.addEventListener('click', (e) => {
      if (e.target === cancellationModal) {
        hideCancellationModal();
      }
    });
  }
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cancellationModal && cancellationModal.style.display !== 'none') {
      hideCancellationModal();
    }
  });
});
