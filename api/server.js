import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.TO_EMAIL || 'jura@authenticai.ai';

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
      name, email, experience, occupancy, guests, dates, notes,
      physical_ability, interests, activity_level, group_preference,
      bathroom_ack, rooming_with, travel_companions, marketing_source,
      additional_info, extra_days_before, extra_days_after
    } = req.body;
    
    if (!name || !email || !experience || !dates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [checkIn, checkOut] = dates.split(' to ');
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Invalid date range' });
    }
    
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (nights < 4) {
      return res.status(400).json({ error: 'Minimum stay is 4 nights' });
    }
    
    // Save to Supabase
    let bookingId = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          name,
          email,
          experience,
          occupancy,
          guests: parseInt(guests, 10),
          check_in: checkIn,
          check_out: checkOut,
          nights,
          notes: notes || null,
          status: 'pending'
        })
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
      const pricePerDay = { double: 700, single: 1200 };
      const rate = pricePerDay[occupancy] || 700;
      const extraDays = (parseInt(extra_days_before || 0, 10) + parseInt(extra_days_after || 0, 10));
      const totalNights = nights + extraDays;
      const extraTotal = rate * parseInt(guests, 10) * extraDays;
      const total = rate * parseInt(guests, 10) * nights + extraTotal;
      const formattedTotal = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(total);
      
      // Build questionnaire data summary
      let questionnaireHtml = '';
      if (physical_ability || interests || activity_level || marketing_source) {
        questionnaireHtml = '<h3>Questionnaire Data</h3>';
        const interestsList = Array.isArray(interests) ? interests : (interests ? interests.split(',').map(i => i.trim()) : []);
        if (interestsList.length > 0) questionnaireHtml += `<p><strong>Interests:</strong> ${interestsList.join(', ')}</p>`;
        if (activity_level) questionnaireHtml += `<p><strong>Activity Level:</strong> ${activity_level}</p>`;
        if (group_preference) questionnaireHtml += `<p><strong>Group Preference:</strong> ${group_preference}</p>`;
        if (marketing_source) questionnaireHtml += `<p><strong>Marketing Source:</strong> ${marketing_source}</p>`;
        if (rooming_with) questionnaireHtml += `<p><strong>Rooming With:</strong> ${rooming_with}</p>`;
        if (travel_companions) questionnaireHtml += `<p><strong>Travel Companions:</strong> ${travel_companions}</p>`;
        if (additional_info) questionnaireHtml += `<p><strong>Additional Info:</strong> ${additional_info}</p>`;
        questionnaireHtml += '<hr>';
      }
      
      await resend.emails.send({
        from: 'Authentic France <noreply@authenticai.ai>',
        to: TO_EMAIL,
        replyTo: email,
        subject: `New Booking Request: ${experience}`,
        html: `
          <h2>New Booking Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Experience:</strong> ${experience}</p>
          <p><strong>Occupancy:</strong> ${occupancy}</p>
          <p><strong>Guests:</strong> ${guests}</p>
          <p><strong>Dates:</strong> ${checkIn} to ${checkOut} (${nights} nights${extraDays > 0 ? ` + ${extraDays} extra nights` : ''})</p>
          <p><strong>Estimated Total:</strong> ${formattedTotal}</p>
          ${questionnaireHtml}
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          ${bookingId ? `<p><strong>Booking ID:</strong> ${bookingId}</p>` : ''}
          <hr>
          <p><em>Reply to this email to respond directly to ${name}.</em></p>
        `
      });
      
      // Confirmation email to customer
      await resend.emails.send({
        from: 'Authentic France <noreply@authenticai.ai>',
        to: email,
        subject: 'Booking Request Received - Authentic France',
        html: `
          <h2>Thank you, ${name}!</h2>
          <p>We've received your booking request for <strong>${experience}</strong>.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Dates: ${checkIn} to ${checkOut} (${nights} nights)</li>
            <li>Guests: ${guests} · Occupancy: ${occupancy}</li>
            <li>Estimated Total: ${formattedTotal}</li>
          </ul>
          <p>We'll review availability and respond within <strong>24–48 hours</strong>.</p>
          <p>If you have any questions, please reply to this email.</p>
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
});

