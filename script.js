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

    // Build payload with questionnaire data
    const formData = new FormData(form);
    const payload = {};
    
    // Get all form fields
    for (const [key, value] of formData.entries()) {
      if (key === 'interests') {
        if (!payload.interests) payload.interests = [];
        payload.interests.push(value);
      } else {
        payload[key] = value;
      }
    }
    
    // Add questionnaire data from sessionStorage
    const questionnaireData = sessionStorage.getItem('questionnaireData');
    if (questionnaireData) {
      const qData = JSON.parse(questionnaireData);
      Object.keys(qData).forEach(key => {
        if (key === 'interests' && Array.isArray(qData[key])) {
          payload.interests = qData[key];
        } else if (qData[key] && !payload[key]) {
          payload[key] = qData[key];
        }
      });
    }

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
  if (questionnaireStep) questionnaireStep.classList.remove('active');
  if (bookingStep) {
    bookingStep.classList.add('active');
    // Switch to booking tab
    const bookingTabBtn = document.querySelector('[data-tab="booking"]');
    if (bookingTabBtn) bookingTabBtn.click();
    setTimeout(() => {
      bookingStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

document.addEventListener('DOMContentLoaded', () => {
  flatpickrInit();
  recalcPrice();
  loadReviews();
});
