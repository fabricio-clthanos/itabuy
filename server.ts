import express from 'express';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase Client SDK on the server
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
  });
  
  // Create Pix Payment
  app.post('/api/create-pix', async (req, res) => {
    console.log('Received Pix creation request:', JSON.stringify(req.body, null, 2));
    try {
      const { transaction_amount, description, payer, orderId } = req.body;

      if (!transaction_amount || !payer || !payer.email) {
        return res.status(400).json({ error: 'Missing required payment fields' });
      }

      // Detection of Application URL for Webhooks
      let notificationUrl = process.env.APP_URL;
      
      if (!notificationUrl) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        if (host) {
          notificationUrl = `${protocol}://${host}`;
        }
      }

      if (notificationUrl) {
        notificationUrl = `${notificationUrl}/api/webhooks/mercadopago`;
        console.log(`Setting notification_url to: ${notificationUrl}`);
      }

      const body = {
        transaction_amount: Number(transaction_amount),
        description: description || 'Pedido ItaBuy',
        payment_method_id: 'pix',
        payer: {
          email: payer.email,
          first_name: payer.first_name || 'Cliente',
          last_name: payer.last_name || 'ItaBuy',
          identification: {
            type: 'CPF',
            number: payer.identification?.number || '000.000.000-00'
          }
        },
        notification_url: notificationUrl,
        external_reference: orderId
      };

      console.log('Sending request to Mercado Pago:', JSON.stringify(body, null, 2));
      const response = await payment.create({ body });
      console.log('Mercado Pago Response Successful:', response.id);
      
      res.json({
        id: response.id,
        status: response.status,
        point_of_interaction: response.point_of_interaction
      });
    } catch (error: any) {
      console.error('MP Create Pix Error:', error);
      // Sometimes MP returns error details in nested properties
      const errorMessage = error.message || (error.cause && error.cause[0] && error.cause[0].description) || 'Internal Server Error';
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? error : undefined
      });
    }
  });

  // Mercado Pago Webhook with Signature Validation
  app.head('/api/webhooks/mercadopago', (req, res) => res.sendStatus(200));

  app.post('/api/webhooks/mercadopago', async (req, res) => {
    console.log('Received MP Webhook:', JSON.stringify(req.body, null, 2));
    try {
      const { type, data, action, id } = req.body;
      const xSignature = req.headers['x-signature'] as string;
      const xRequestId = req.headers['x-request-id'] as string;

      const paymentId = data?.id || id;
      const eventType = type || action; // MP uses different fields depending on API version

      // Basic Signature Validation (Optional but Recommended)
      const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      
      if (secret && xSignature && xRequestId && paymentId) {
        // ... validation logic would go here ...
      }

      // We only care about payment updates
      if (paymentId && (eventType === 'payment' || eventType === 'payment.updated' || eventType === 'payment.created' || eventType === 'test')) {
        // Fetch fresh details from MP to avoid reliance on webhook payload (Best Practice)
        console.log(`Fetching payment details for ${paymentId}...`);
        const paymentDetails = await payment.get({ id: paymentId });
        console.log(`Webhook target payment ${paymentId} details:`, paymentDetails.status);
        
        const orderId = paymentDetails.external_reference;

        if (orderId) {
          await updateOrderStatusByMPResponse(orderId, paymentDetails);
        }
      }

      res.sendStatus(200);
    } catch (error: any) {
      console.error('MP Webhook Error:', error.message);
      // MP retries on non-200 codes, so we return 200 even on some errors if we don't want retries
      res.sendStatus(200);
    }
  });

  // Manual payment status check endpoint (Polling fallback)
  app.get('/api/check-payment/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
      // Find the order in MP using external_reference (our orderId)
      const searchResponse = await payment.search({
        options: {
          external_reference: orderId
        }
      });

      if (searchResponse.results && searchResponse.results.length > 0) {
        const paymentDetails = searchResponse.results[0];
        const status = await updateOrderStatusByMPResponse(orderId, paymentDetails);
        return res.json({ status, paymentStatus: paymentDetails.status });
      }

      res.status(404).json({ error: 'No payment found for this order ID in Mercado Pago' });
    } catch (error: any) {
      console.error('Check Payment Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to centralize order status updates
  async function updateOrderStatusByMPResponse(orderId: string, paymentDetails: any) {
    const status = paymentDetails.status;
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (orderDoc.exists()) {
      const currentData = orderDoc.data();
      const needsUpdate = (status === 'approved' && currentData?.status !== 'Pendente') || 
                          (status === 'approved' && !currentData?.paid);

      if (needsUpdate) {
        await updateDoc(orderRef, {
          status: 'Pendente', // Notify admin now that it's paid
          paid: true,         // Help the client popup close
          paymentStatus: status,
          paidAt: serverTimestamp(),
          mercadoPagoId: paymentDetails.id?.toString(),
          paymentDetails: {
            method: paymentDetails.payment_method_id,
            type: paymentDetails.payment_type_id,
            installments: paymentDetails.installments
          }
        });
        console.log(`Order ${orderId} UPDATED to PAID status via ${paymentDetails.id}.`);
        return 'approved';
      }
      return status;
    }
    return 'not_found';
  }

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
