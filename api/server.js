import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Stripe from 'stripe';

const app = express();

// Configure CORS to allow requests from Netlify and localhost
const corsOptions = {
  origin: [
    'https://ausratravel.netlify.app',
    'http://localhost:8888',
    'http://localhost:3000',
    'http://127.0.0.1:8888',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
const TO_EMAIL = process.env.TO_EMAIL || 'jura@authenticai.ai';

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Authentic France API',
    version: '1.0.2',
    status: 'running',
    endpoints: {
      health: '/health',
      stripeConfig: '/api/stripe-config',
      createPaymentIntent: '/api/create-payment-intent',
      booking: '/api/booking',
      availability: '/api/availability',
      customRequest: '/api/custom-request',
      reviews: '/api/reviews'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Stripe configuration
app.get('/api/stripe-config', (req, res) => {
  res.json({ 
    publishableKey: STRIPE_PUBLISHABLE_KEY || '',
    enabled: !!STRIPE_SECRET_KEY 
  });
});

// Create Stripe payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, booking_data } = req.body;
    
    if (!stripe) {
      return res.status(503).json({ error: 'Payment processing not configured' });
    }
    
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount, 10),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        booking_type: 'deposit',
        email: booking_data?.email || '',
        experience: booking_data?.experience || ''
      }
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error('Stripe payment intent error:', err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Get availability (blocked date ranges)
app.get('/api/availability', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ blocked: [] });
    }
    const { data, error } = await supabase
      .from('bookings')
      .select('check_in, check_out, status')
      .eq('status', 'confirmed');
    
    if (error) throw error;
    
    // Convert bookings to blocked ranges
    const blocked = (data || []).map(b => ({
      from: b.check_in,
      to: b.check_out
    }));
    
    res.json({ blocked });
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Submit booking request
app.post('/api/booking', async (req, res) => {
  try {
    const { 
      first_name, last_name, name, email, phone, address,
      experience, occupancy, total_guests, dates,
      travel_companions, extra_days_before, extra_days_after,
      addons, notes, questionnaire_data,
      stripe_payment_intent_id, deposit_paid
    } = req.body;
    
    // Validation
    if (!first_name || !last_name || !email || !phone || !address || !experience || !dates || !total_guests) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const fullName = name || `${first_name} ${last_name}`;
    
    const [checkIn, checkOut] = dates.split(' to ');
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Invalid date range' });
    }
    
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (nights < 4) {
      return res.status(400).json({ error: 'Minimum stay is 4 nights' });
    }
    
    // Calculate pricing
    const pricePerDay = { double: 700, single: 1200 };
    const rate = pricePerDay[occupancy] || 700;
    const tripTotal = rate * total_guests * nights;
    
    // Calculate extra days pricing
    let extraBeforeNights = 0;
    let extraAfterNights = 0;
    let extraBeforeDates = null;
    let extraAfterDates = null;
    
    if (extra_days_before && extra_days_before.nights) {
      extraBeforeNights = extra_days_before.nights;
      extraBeforeDates = extra_days_before.dates;
    }
    
    if (extra_days_after && extra_days_after.nights) {
      extraAfterNights = extra_days_after.nights;
      extraAfterDates = extra_days_after.dates;
    }
    
    const extraDaysTotal = rate * total_guests * (extraBeforeNights + extraAfterNights);
    
    // Calculate add-ons total (placeholder - will be calculated from addons_catalog later)
    const addonsTotal = 0; // TODO: Calculate from addons array
    
    const totalAmount = tripTotal + extraDaysTotal + addonsTotal;
    const remainingBalance = totalAmount - (deposit_paid ? 299 : 0);
    
    // Save to Supabase
    let bookingId = null;
    if (supabase) {
      const bookingData = {
        first_name,
        last_name,
        email,
        phone,
        address,
        experience,
        occupancy,
        total_guests: parseInt(total_guests, 10),
        check_in: checkIn,
        check_out: checkOut,
        nights,
        travel_companions: travel_companions || [],
        extra_days_before: extraBeforeDates ? { dates: extraBeforeDates, nights: extraBeforeNights } : null,
        extra_days_after: extraAfterDates ? { dates: extraAfterDates, nights: extraAfterNights } : null,
        addons: addons || [],
        notes: notes || null,
        questionnaire_data: questionnaire_data || null,
        deposit_amount: 299.00,
        deposit_paid: deposit_paid || false,
        stripe_payment_intent_id: stripe_payment_intent_id || null,
        trip_total: tripTotal,
        extra_days_total: extraDaysTotal,
        addons_total: addonsTotal,
        total_amount: totalAmount,
        remaining_balance: remainingBalance,
        status: deposit_paid ? 'confirmed' : 'pending'
      };
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        // Continue even if DB fails
      } else {
        bookingId = data?.id;
      }
    }
    
    // Send email via Resend
    if (resend) {
      const formattedTotal = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(totalAmount);
      
      const formattedDeposit = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(299);
      
      const formattedRemaining = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(remainingBalance);
      
      // Build travel companions HTML
      let companionsHtml = '';
      if (travel_companions && travel_companions.length > 0) {
        companionsHtml = '<h3>Travel Companions</h3><ul>';
        travel_companions.forEach((comp, idx) => {
          companionsHtml += `<li><strong>Person ${idx + 1}:</strong> ${comp.first_name} ${comp.last_name}${comp.email ? ` (${comp.email})` : ''}${comp.phone ? ` - ${comp.phone}` : ''}</li>`;
        });
        companionsHtml += '</ul><hr>';
      }
      
      // Build extra days HTML
      let extraDaysHtml = '';
      if (extraBeforeNights > 0 || extraAfterNights > 0) {
        extraDaysHtml = '<h3>Extra Days</h3>';
        if (extraBeforeNights > 0) {
          extraDaysHtml += `<p><strong>Before trip:</strong> ${extraBeforeDates.join(' to ')} (${extraBeforeNights} nights)</p>`;
        }
        if (extraAfterNights > 0) {
          extraDaysHtml += `<p><strong>After trip:</strong> ${extraAfterDates.join(' to ')} (${extraAfterNights} nights)</p>`;
        }
        extraDaysHtml += '<hr>';
      }
      
      // Build add-ons HTML
      let addonsHtml = '';
      if (addons && addons.length > 0) {
        addonsHtml = `<p><strong>Add-ons:</strong> ${addons.join(', ')}</p>`;
      }
      
      // Build questionnaire data summary
      let questionnaireHtml = '';
      if (questionnaire_data) {
        questionnaireHtml = '<h3>Questionnaire Data</h3>';
        if (questionnaire_data.interests && Array.isArray(questionnaire_data.interests)) {
          questionnaireHtml += `<p><strong>Interests:</strong> ${questionnaire_data.interests.join(', ')}</p>`;
        }
        if (questionnaire_data.activity_level) {
          questionnaireHtml += `<p><strong>Activity Level:</strong> ${questionnaire_data.activity_level}</p>`;
        }
        if (questionnaire_data.group_preference) {
          questionnaireHtml += `<p><strong>Group Preference:</strong> ${questionnaire_data.group_preference}</p>`;
        }
        if (questionnaire_data.marketing_source) {
          questionnaireHtml += `<p><strong>Marketing Source:</strong> ${questionnaire_data.marketing_source}</p>`;
        }
        questionnaireHtml += '<hr>';
      }
      
      await resend.emails.send({
        from: 'Authentic France <noreply@authenticai.ai>',
        to: TO_EMAIL,
        replyTo: email,
        subject: `${deposit_paid ? 'NEW BOOKING' : 'New Booking Request'}: ${experience}`,
        html: `
          <h2>${deposit_paid ? 'NEW BOOKING CONFIRMED' : 'New Booking Request'}</h2>
          <h3>Primary Guest</h3>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Address:</strong> ${address}</p>
          ${companionsHtml}
          <h3>Trip Details</h3>
          <p><strong>Experience:</strong> ${experience}</p>
          <p><strong>Occupancy:</strong> ${occupancy}</p>
          <p><strong>Total Guests:</strong> ${total_guests}</p>
          <p><strong>Dates:</strong> ${checkIn} to ${checkOut} (${nights} nights)</p>
          ${extraDaysHtml}
          <h3>Pricing</h3>
          <p><strong>Trip Total:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tripTotal)}</p>
          ${extraDaysTotal > 0 ? `<p><strong>Extra Days:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(extraDaysTotal)}</p>` : ''}
          ${addonsTotal > 0 ? `<p><strong>Add-ons:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(addonsTotal)}</p>` : ''}
          <p><strong>Total Amount:</strong> ${formattedTotal}</p>
          <p><strong>Deposit:</strong> ${formattedDeposit} ${deposit_paid ? '✓ PAID' : '(pending)'}</p>
          <p><strong>Remaining Balance:</strong> ${formattedRemaining}</p>
          ${addonsHtml}
          ${questionnaireHtml}
          ${notes ? `<h3>Notes</h3><p>${notes}</p>` : ''}
          ${stripe_payment_intent_id ? `<p><strong>Stripe Payment Intent:</strong> ${stripe_payment_intent_id}</p>` : ''}
          ${bookingId ? `<p><strong>Booking ID:</strong> ${bookingId}</p>` : ''}
          <hr>
          <p><em>Reply to this email to respond directly to ${fullName}.</em></p>
        `
      });
      
      // Confirmation email to customer
      await resend.emails.send({
        from: 'Authentic France <noreply@authenticai.ai>',
        to: email,
        subject: deposit_paid ? 'Booking Confirmed - Authentic France' : 'Booking Request Received - Authentic France',
        html: `
          <h2>Thank you, ${first_name}!</h2>
          ${deposit_paid ? '<p style="color: #39d98a; font-weight: 600;">Your booking has been confirmed! Your $299 deposit has been processed.</p>' : '<p>We\'ve received your booking request.</p>'}
          <p><strong>Booking Details:</strong></p>
          <ul>
            <li><strong>Experience:</strong> ${experience}</li>
            <li><strong>Dates:</strong> ${checkIn} to ${checkOut} (${nights} nights)</li>
            <li><strong>Guests:</strong> ${total_guests} · Occupancy: ${occupancy}</li>
            <li><strong>Total Amount:</strong> ${formattedTotal}</li>
            <li><strong>Deposit:</strong> ${formattedDeposit} ${deposit_paid ? '✓ Paid' : '(pending)'}</li>
            <li><strong>Remaining Balance:</strong> ${formattedRemaining} (due 7 days before arrival)</li>
          </ul>
          ${deposit_paid ? '<p>Your spot is secured! We\'ll send you trip preparation details closer to your arrival date.</p>' : '<p>We\'ll review availability and confirm your booking within <strong>24–48 hours</strong>.</p>'}
          <p>If you have any questions, please reply to this email or call us at <strong>+1 (703) 375-9548</strong>.</p>
          <hr>
          <p><small>Authentic Experiences in South of France</small></p>
        `
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Booking request submitted successfully',
      bookingId 
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to process booking request' });
  }
});

// Get reviews
app.get('/api/reviews', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ success: true, reviews: [] });
    }
    
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      reviews: data || [] 
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit review
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, review } = req.body;
    
    if (!name || !rating || !review) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Save to Supabase
    let reviewId = null;
    if (!supabase) {
      console.error('Supabase client not initialized - check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
      return res.status(503).json({ error: 'Database not configured' });
    }
    
    console.log('Attempting to insert review:', { name, rating: parseInt(rating, 10), status: 'pending' });
    console.log('Supabase client initialized:', !!supabase);
    console.log('Supabase URL:', SUPABASE_URL ? 'Set' : 'Missing');
    console.log('Supabase Key type:', SUPABASE_KEY ? (SUPABASE_KEY.startsWith('eyJ') ? 'JWT (likely service role)' : 'Unknown format') : 'Missing');
    
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        name,
        rating: parseInt(rating, 10),
        review,
        status: 'pending' // Reviews need approval
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error inserting review:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error hint:', error.hint);
      
      // Check if it's an RLS issue
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('⚠️ RLS (Row Level Security) is blocking the insert!');
        console.error('Solution: Run api/fix-reviews-rls.sql in Supabase or ensure SUPABASE_SERVICE_ROLE_KEY is set correctly');
      }
      
      return res.status(500).json({ 
        error: 'Failed to save review to database',
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }
    
    if (data) {
      reviewId = data.id;
      console.log(`Review saved successfully with ID: ${reviewId}`);
    } else {
      console.error('Review insert returned no data');
      return res.status(500).json({ error: 'Failed to save review - no data returned' });
    }
    
    // Send email notification to admin
    if (resend) {
      await resend.emails.send({
        from: 'Authentic France <noreply@authenticai.ai>',
        to: TO_EMAIL,
        subject: `New Review Submitted: ${rating} stars`,
        html: `
          <h2>New Review Submitted</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Rating:</strong> ${rating} out of 5 stars</p>
          <p><strong>Review:</strong></p>
          <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0; white-space: pre-wrap;">${review}</div>
          ${reviewId ? `<p><strong>Review ID:</strong> ${reviewId}</p>` : ''}
          <p><em>Review is pending approval. Approve it in your database to make it visible on the website.</em></p>
        `
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Review submitted successfully',
      reviewId 
    });
  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Submit custom request (feedback/contact form)
app.post('/api/custom-request', async (req, res) => {
  try {
    const { name, email, notes } = req.body;
    
    if (!name || !email || !notes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Save to Supabase
    let requestId = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('custom_requests')
        .insert({
          name,
          email,
          notes,
          status: 'new'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        // Continue even if DB fails
      } else {
        requestId = data?.id;
      }
    }
    
    // Send email via Resend
    if (resend) {
      await resend.emails.send({
        from: 'Authentic France <noreply@authenticai.ai>',
        to: TO_EMAIL,
        replyTo: email,
        subject: `Custom Request: ${name}`,
        html: `
          <h2>New Custom Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Request Details:</strong></p>
          <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0; white-space: pre-wrap;">${notes}</div>
          ${requestId ? `<p><strong>Request ID:</strong> ${requestId}</p>` : ''}
          <hr>
          <p><em>Reply to this email to respond directly to ${name}.</em></p>
        `
      });
      
      // Confirmation email to customer
      await resend.emails.send({
        from: 'Authentic France <noreply@authenticai.ai>',
        to: email,
        subject: 'Custom Request Received - Authentic France',
        html: `
          <h2>Thank you, ${name}!</h2>
          <p>We've received your custom request. Our team will review it and get back to you within <strong>24–48 hours</strong>.</p>
          <p><strong>Your Request:</strong></p>
          <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0; white-space: pre-wrap;">${notes}</div>
          <p>If you have any urgent questions, please call us at <strong>+1 (703) 375-9548</strong> or reply to this email.</p>
          <hr>
          <p><small>Authentic Experiences in South of France</small></p>
        `
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Custom request submitted successfully',
      requestId 
    });
  } catch (err) {
    console.error('Custom request error:', err);
    res.status(500).json({ error: 'Failed to process custom request' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase: ${supabase ? 'connected' : 'not configured'}`);
  console.log(`Resend: ${resend ? 'configured' : 'not configured'}`);
  console.log(`Stripe: ${stripe ? 'configured' : 'not configured'}`);
});

