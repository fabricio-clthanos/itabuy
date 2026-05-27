import express from 'express';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Initialize Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' 
});
const payment = new Payment(client);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  
  // Create Pix Payment
  app.post('/api/create-pix', async (req, res) => {
    try {
      const { transaction_amount, description, payer, orderId } = req.body;

      // In a production environment, you should use a valid URL and HTTPS.
      // process.env.APP_URL should be like https://your-app.com
      const notificationUrl = process.env.APP_URL ? `${process.env.APP_URL}/api/webhooks/mercadopago` : undefined;

      const body = {
        transaction_amount,
        description,
        payment_method_id: 'pix',
        payer: {
          email: payer.email,
          first_name: payer.first_name,
          last_name: payer.last_name,
          identification: {
            type: 'CPF',
            number: payer.identification.number
          }
        },
        notification_url: notificationUrl,
        external_reference: orderId
      };

      const response = await payment.create({ body });
      
      res.json({
        id: response.id,
        status: response.status,
        point_of_interaction: response.point_of_interaction
      });
    } catch (error: any) {
      console.error('MP Create Pix Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Mercado Pago Webhook with Signature Validation
  app.post('/api/webhooks/mercadopago', async (req, res) => {
    try {
      const { type, data, action } = req.body;
      const xSignature = req.headers['x-signature'] as string;
      const xRequestId = req.headers['x-request-id'] as string;

      // Basic Signature Validation (Optional but Recommended)
      const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      
      if (secret && xSignature && xRequestId) {
        const parts = xSignature.split(',');
        let ts = '';
        let hash = '';
        
        parts.forEach(p => {
          const [key, value] = p.split('=');
          if (key.trim() === 'ts') ts = value;
          if (key.trim() === 'v1') hash = value;
        });

        const manifest = `id:${data.id};request-id:${xRequestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(manifest);
        const digest = hmac.digest('hex');

        if (digest !== hash) {
          console.error('Invalid MP Webhook Signature');
          return res.status(401).send('Invalid signature');
        }
      }

      // We only care about payment updates
      const eventType = type || action; // MP uses different fields depending on API version
      
      if ((eventType === 'payment' || eventType === 'payment.updated' || eventType === 'payment.created') && data?.id) {
        // Fetch fresh details from MP to avoid reliance on webhook payload (Best Practice)
        const paymentDetails = await payment.get({ id: data.id });
        
        const status = paymentDetails.status;
        const orderId = paymentDetails.external_reference;

        if (orderId && (status === 'approved' || status === 'authorized')) {
          // Update order in Firestore
          const orderRef = db.collection('orders').doc(orderId);
          const orderDoc = await orderRef.get();

          if (orderDoc.exists && orderDoc.data()?.status !== 'Confirmado') {
            await orderRef.update({
              status: 'Pendente', // Notify admin now that it's paid
              paid: true,         // Help the client popup close
              paymentStatus: status,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              mercadoPagoId: data.id
            });
            console.log(`Order ${orderId} confirmed via Pix notification.`);
          }
        }
      }

      res.sendStatus(200);
    } catch (error: any) {
      console.error('MP Webhook Error:', error.message);
      // MP retries on non-200 codes, so we return 200 even on some errors if we don't want retries
      res.sendStatus(200);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
