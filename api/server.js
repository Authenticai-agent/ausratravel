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
    const { name, email, experience, occupancy, guests, dates, notes } = req.body;
    
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
      const total = rate * parseInt(guests, 10) * nights;
      const formattedTotal = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(total);
      
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
          <p><strong>Dates:</strong> ${checkIn} to ${checkOut} (${nights} nights)</p>
          <p><strong>Estimated Total:</strong> ${formattedTotal}</p>
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase: ${supabase ? 'connected' : 'not configured'}`);
  console.log(`Resend: ${resend ? 'configured' : 'not configured'}`);
});

