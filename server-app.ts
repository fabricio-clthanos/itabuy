import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

const serverApp = express();

serverApp.set('trust proxy', true);

// Configure CORS to accept requests from any origin (ideal for Vercel + custom domains)
serverApp.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

serverApp.use(express.json());

// API Routes
serverApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Create Pix Payment
serverApp.post('/api/create-pix', async (req, res) => {
  console.log('Received Pix creation request:', JSON.stringify(req.body, null, 2));
  try {
    const { transaction_amount, description, payer, orderId } = req.body;

    if (!transaction_amount || !payer || !payer.email) {
      return res.status(400).json({ error: 'Missing required payment fields' });
    }

    // Detection of Application URL for Webhooks
    let notificationUrl = process.env.APP_URL;
    
    if (!notificationUrl) {
      let protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      
      // Force HTTPS for any hosted environments to ensure Mercado Pago webhooks succeed
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        protocol = 'https';
      }
      
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
    const errorMessage = error.message || (error.cause && error.cause[0] && error.cause[0].description) || 'Internal Server Error';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV !== 'production' ? error : undefined
    });
  }
});

// Mercado Pago Webhook with Signature Validation
serverApp.head('/api/webhooks/mercadopago', (req, res) => res.sendStatus(200));

serverApp.post('/api/webhooks/mercadopago', async (req, res) => {
  console.log('Received MP Webhook:', JSON.stringify(req.body, null, 2));
  try {
    const { type, data, action, id } = req.body;
    const paymentId = data?.id || id;
    const eventType = type || action; // MP uses different fields depending on API version

    // We only care about payment updates
    if (paymentId && (eventType === 'payment' || eventType === 'payment.updated' || eventType === 'payment.created' || eventType === 'test')) {
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
    res.sendStatus(200);
  }
});

// Manual payment status check endpoint (Polling fallback)
serverApp.get('/api/check-payment/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
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

// AI Generation Endpoint
serverApp.post('/api/ai/generate', async (req, res) => {
  const { type, context } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const genAiModule: any = await import('@google/genai');
    // In @google/genai, GoogleGenAI is a named export.
    // In some environments, it might be nested in .default
    const GoogleGenAI = genAiModule.GoogleGenAI || genAiModule.default?.GoogleGenAI;
    
    if (!GoogleGenAI) {
      console.error('Imported module keys:', Object.keys(genAiModule));
      throw new Error('Could not find GoogleGenAI constructor in module @google/genai');
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    let prompt = '';
    switch (type) {
      case 'gerar':
        prompt = `Gere uma dica rápida ou um conselho útil relacionado a: ${context || 'e-commerce e compras inteligentes'}. Responda em apenas uma frase curta e impactante.`;
        break;
      case 'desafio':
        prompt = `Gere um pequeno desafio ou missão divertida para o usuário fazer hoje na loja ItaBuy. Exemplo: 'Encontre 3 produtos azuis'. Seja criativo. Responda em apenas uma frase curta.`;
        break;
      case 'curiosidade':
        prompt = `Gere uma curiosidade rápida e interessante sobre ${context || 'compras, tecnologia ou marcas famosas'}. Responda em apenas uma frase curta e interessante.`;
        break;
      case 'capsula':
        prompt = `Você é uma cápsula do tempo da ItaBuy. Gere uma mensagem surpresa inspiradora ou uma previsão divertida sobre o futuro das compras para o usuário. Responda em apenas uma frase curta e mágica.`;
        break;
      default:
        prompt = 'Diga oi de um jeito amigável em uma frase curta.';
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    const text = response.text || (typeof response.text === 'function' ? (response as any).text() : 'Pronto!');
    res.json({ result: text.trim() });
  } catch (error: any) {
    console.error('Gemini AI Error:', error);
    
    // Friendly response for quota issues
    const isQuotaError = error.status === 429 || 
                        error.message?.includes('RESOURCE_EXHAUSTED') || 
                        error.message?.includes('quota');
                        
    if (isQuotaError) {
      return res.json({ result: 'Opa! Muita gente pedindo dicas agora. Tente novamente daqui a pouco!' });
    }

    res.status(500).json({ error: 'Falha ao processar requisição de IA' });
  }
});

export { serverApp };

