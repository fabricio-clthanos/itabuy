import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, ShoppingCart as CartIcon, User as UserIcon, Package,
  Sparkles, Check, ChevronRight, X, Smartphone, Tv, Shirt, 
  Sparkles as SparklesIcon, Footprints, Home as HomeIcon2, 
  Dumbbell, Gamepad2, Compass, Trophy, Loader2
} from 'lucide-react';
import { Product, CartItem, Coupon } from './types';
import Header from './components/Header';
import HomeView from './components/HomeView';
import ProductDetailView from './components/ProductDetailView';
import CategoryView from './components/CategoryView';
import BannerPageView from './components/BannerPageView';
import SearchView from './components/SearchView';
import CartView from './components/CartView';
import MeView from './components/MeView';
import MyPurchasesView from './components/MyPurchasesView';
import SorteiosView from './components/SorteiosView';
import FlashDealsView from './components/FlashDealsView';
import AdminDashboard from './components/AdminDashboard';
import OptionsPickerPopup from './components/OptionsPickerPopup';
import CheckoutPixPopup from './components/CheckoutPixPopup';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Firebase core imports
import { auth, db } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';

// Helper to dynamically get host URL for separate deployments (like Vercel)
const getApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_URL || '';
  const cleanUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  
  // If the target URL contains "run.app", it belongs to the temporary platform container.
  // Direct cross-origin calls to the platform preview host (run.app) will fail with CORS / security blocks.
  // We MUST use relative paths ('') on both our local/Cloud Run environments and Vercel environments
  // to ensure same-origin requests succeed natively.
  if (cleanUrl.includes('run.app')) {
    return '';
  }
  
  return cleanUrl;
};

export default function App() {
  // Database catalog & coupons state
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [backToast, setBackToast] = useState(false);
  const lastBackTime = useRef(0);
  const isPopState = useRef(false);

  // Dark Mode State with local storage sync
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme_dark_mode') === 'true';
  });

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme_dark_mode', String(newMode));
  };

  // Navigation
  const [currentView, setCurrentView] = useState<'home' | 'product' | 'cart' | 'me' | 'sorteios' | 'flash_deals' | 'category' | 'admin' | 'compras' | 'search'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Favorites State (Persisted in localStorage)
  const [favorites, setFavorites] = useState<Product[]>(() => {
    const saved = localStorage.getItem('itabuy_favorites');
    return saved ? JSON.parse(saved) : []; // defaults
  });

  const handleToggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      let updated;
      if (exists) {
        updated = prev.filter((p) => p.id !== product.id);
        showToast('Removido dos favoritos!');
      } else {
        updated = [...prev, product];
        showToast('Adicionado aos favoritos! ❤️');
      }
      localStorage.setItem('itabuy_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      isPopState.current = true;
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
      } else if (currentView === 'home') {
        const now = Date.now();
        if (now - lastBackTime.current < 2000) {
          // Let it exit
        } else {
          lastBackTime.current = now;
          setBackToast(true);
          setTimeout(() => setBackToast(false), 2000);
          // Prevent exit
          history.pushState({ view: 'home' }, '');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  useEffect(() => {
    if (isPopState.current) {
      isPopState.current = false;
      return;
    }
    history.pushState({ view: currentView }, '');
  }, [currentView]);

  // Scroll to extreme top when entering product detail or switching modes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'instant' as any });
    }
  }, [currentView, selectedProduct]);

  // Cart State (Backed up by localStorage for instant retrieval)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('itabuy_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // User Coins and claims
  const [userCoins, setUserCoins] = useState<number>(0);

  // Claimed Coupons list
  const [claimedCoupons, setClaimedCoupons] = useState<Coupon[]>([]);

  // Banners for carousels
  const [banners, setBanners] = useState<any[]>([]);

  // Orders Log History list populated from Firestore
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // Toast notices / alerts
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Payment checkout completion modal state
  const [checkoutSuccessModal, setCheckoutSuccessModal] = useState<{
    opened: boolean;
    orderId: string;
    total: number;
    method: 'pix' | 'cartao' | 'dinheiro';
    address?: any;
    needsChange?: boolean;
    changeAmount?: string;
  }>({
    opened: false,
    orderId: '',
    total: 0,
    method: 'pix',
    address: null,
    needsChange: false,
    changeAmount: ''
  });

  // State for Pix Payment
  const [pixPaymentData, setPixPaymentData] = useState<{
    orderId: string;
    total: number;
    qr_code: string;
    qr_code_base64: string;
  } | null>(null);

  // State for Options Picker
  const [pickingOptionsProduct, setPickingOptionsProduct] = useState<Product | null>(null);
  const [pendingAction, setPendingAction] = useState<'cart' | 'buy'>('cart');

  // Safe Add To Cart logic with Specs checks
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);

  // General UI & Elementor settings
  const [storeSettings, setStoreSettings] = useState<any>({
    headerLogoUrl: 'https://i.ibb.co/bjjh6VkK/Ita-Magazine-1.png',
    headerShowSearch: true,
    headerPromotag: '⚡ Entregamos no mesmo dia em Itacoatiara - AM',
    headerBannerBg: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80'
  });
  const [inspectMode, setInspectMode] = useState(false);

  // Strictly load live production data from Firestore.
  // No mock fallbacks are allowed, obeying the user's intent to remove all non-fixed test data.
  useEffect(() => {
    // Listen to products live updates
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList: Product[] = [];
      snapshot.forEach((doc) => {
        prodList.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prodList);
      setIsLoadingDB(false);
    }, (error) => {
      console.error("Firestore loading error for products:", error);
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // Listen to banners live updates
    const unsubBanners = onSnapshot(doc(db, 'settings', 'banners'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().banners) {
        setBanners(docSnap.data().banners);
      }
    });

    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const coupList: Coupon[] = [];
      snapshot.forEach((doc) => {
        coupList.push({ id: doc.id, ...doc.data() } as Coupon);
      });
      setAvailableCoupons(coupList);
    });
    
    // Live Elementor Settings from Firestore
    const unsubSettings = onSnapshot(doc(db, 'settings', 'elementor'), (docSnap) => {
      if (docSnap.exists()) {
        setStoreSettings((prev: any) => ({ ...prev, ...docSnap.data() }));
      }
    });

    return () => {
      unsubProducts();
      unsubSettings();
      unsubBanners();
      unsubCoupons();
    };
  }, []);

  // Listen to Window message for live preview from Elementor Builder
  useEffect(() => {
    const isPreview = window.location.search.includes('preview=true');
    if (isPreview) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'ELEMENTOR_PREVIEW') {
          const { key, value } = event.data.payload;
          setStoreSettings((prev: any) => ({ ...prev, [key]: value }));
        } else if (event.data?.type === 'ELEMENTOR_INSPECT_MODE') {
          setInspectMode(event.data.payload.active);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Sync state cleanly, wiping local residual values to obey user intent
  useEffect(() => {
    const cleanFlag = 'itabuy_clean_slate_force_final_empty_v15';
    const isCleaned = localStorage.getItem(cleanFlag);
    if (!isCleaned) {
      localStorage.clear(); // Empty all cached cards, addresses and values
      localStorage.setItem(cleanFlag, 'true');
      setCart([]);
      setFavorites([]);
      setOrderHistory([]);
      setUserCoins(1000);
      setClaimedCoupons([]);
    }
  }, []);

  // Listen to Firestore changes and Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      const isPreview = window.location.search.includes('preview=true');

      if (fUser) {
        setFirebaseUser(fUser);
        if (fUser.email === 'adminbuy22@gmail.com' && !isPreview) {
          setCurrentView('admin');
        }
        
        // Fetch or initialize user profile doc
        const userDocRef = doc(db, 'users', fUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserCoins(userData.coins ?? 1000);
            
            // Map claimed coupon codes to details
            const claimedIds = userData.claimedCouponIds || [];
            const resolved = availableCoupons.filter(c => claimedIds.includes(c.id));
            setClaimedCoupons(resolved);
          } else {
            const newProfile = {
              uid: fUser.uid,
              email: fUser.email || '',
              displayName: fUser.displayName || fUser.email?.split('@')[0] || 'Cliente ItaBuy',
              coins: 1000,
              claimedCouponIds: []
            };
            await setDoc(userDocRef, newProfile);
            setUserCoins(1000);
            setClaimedCoupons([]);
          }
        } catch (error) {
          console.error("User profile Firestore sync error:", error);
          handleFirestoreError(error, OperationType.GET, `users/${fUser.uid}`);
          setUserCoins(1000);
        }

        // Setup real-time dynamic fetch listener for orders history associated with fUser.uid
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', fUser.uid)
        );
        const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          // Sort items dynamically by ID or order date (descending)
          items.sort((a,b) => (b.id || '').localeCompare(a.id || ''));
          setOrderHistory(items);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'orders');
        });

        return () => unsubOrders();
      } else {
        setFirebaseUser(null);
        setOrderHistory([]);
        setClaimedCoupons([]);
        setUserCoins(0);
      }
    });

    return () => unsubscribe();
  }, [availableCoupons]);

  // Auth helper callbacks
  const handleLoginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      showToast('Bem-vindo de volta ao ItaBuy! ⚡');
    } catch (error: any) {
      console.error(error);
      throw new Error('E-mail ou senha inválidos! Por favor, confira.');
    }
  };

  const handleRegisterWithEmail = async (name: string, email: string, pass: string) => {
    try {
      const resp = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(resp.user, { displayName: name });
      
      await setDoc(doc(db, 'users', resp.user.uid), {
        uid: resp.user.uid,
        email: email,
        displayName: name,
        coins: 1000,
        claimedCouponIds: []
      });
      showToast('Conta criada com sucesso! Boas-vindas ItaBuy. 🎉');
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || 'Falha ao criar o seu cadastro.');
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('E-mail de recuperação enviado!');
    } catch (error: any) {
      console.error(error);
      throw new Error('Não foi possível enviar o reset de senha.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('home');
      showToast('Desconectado com sucesso da sua conta.');
    } catch (error: any) {
      console.error(error);
      throw new Error('Erro ao sair.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Acesso via Google concedido! 🌐');
    } catch (error: any) {
      console.error(error);
      throw new Error('Erro ao autenticar com Google.');
    }
  };

  // Keep local storage cart synchronized
  useEffect(() => {
    localStorage.setItem('itabuy_cart', JSON.stringify(cart));
  }, [cart]);

  // Utility to fire temporary mobile-friendly Toast notifications
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  };

  // Safe Add To Cart logic with Specs checks
  const handleAddToCart = (product: Product, spec?: {[key: string]: string}) => {
    // Check if product has options and if ALL of them are provided in the selection
    const allOptionsSelected = product.availableOptions?.every(opt => spec && spec[opt.name]);

    if (product.availableOptions && product.availableOptions.length > 0 && !allOptionsSelected) {
      setPickingOptionsProduct(product);
      setPendingAction('cart');
      return;
    }

    const itemSpec = spec || {};

    setCart((prev) => {
      // Find if item already in cart with same specs
      const existingIdx = prev.findIndex(
        (item) => {
          if (item.product.id !== product.id) return false;
          
          const s1 = item.selectedSpec || {};
          const s2 = itemSpec;
          const k1 = Object.keys(s1);
          const k2 = Object.keys(s2);
          
          if (k1.length !== k2.length) return false;
          return k1.every(k => s1[k] === s2[k]);
        }
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `${product.id}_${Date.now()}`,
            product,
            quantity: 1,
            selected: true,
            selectedSpec: itemSpec
          }
        ];
      }
    });

    showToast(`Adicionado ao carrinho: ${product.name.slice(0, 20)}...`);
  };

  // Buy Now immediate workflow
  const handleBuyNow = (product: Product, spec?: { [key: string]: string }) => {
    // Check if product has options and if ALL of them are provided in the selection
    const allOptionsSelected = product.availableOptions?.every(opt => spec && spec[opt.name]);

    if (product.availableOptions && product.availableOptions.length > 0 && !allOptionsSelected) {
      setPickingOptionsProduct(product);
      setPendingAction('buy');
      return;
    }

    // Add to cart first
    handleAddToCart(product, spec);
    // Redirect instantly to Cart Page
    setCurrentView('cart');
  };

  // Claim voucher logic writing to Firestore if authenticated
  const handleClaimCoupon = async (coupon: Coupon) => {
    if (!firebaseUser) {
      showToast('Por favor, entre ou crie seu cadastro para resgatar cupons!');
      setCurrentView('me');
      return;
    }

    const alreadyOwns = claimedCoupons.some((c) => c.id === coupon.id || c.code === coupon.code);
    if (alreadyOwns) {
      showToast('Você já possui este cupom de desconto!');
      return;
    }

    try {
      const newClaimed = [...claimedCoupons, coupon];
      setClaimedCoupons(newClaimed);

      // Save claimedCouponIds in Firestore user document
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        claimedCouponIds: newClaimed.map(c => c.id)
      }, { merge: true });

      showToast(`Cupom ${coupon.code} resgatado com sucesso! Use no carrinho.`);
    } catch (error) {
      console.error(error);
      showToast('Erro ao resgatar seu cupom no banco de dados.');
    }
  };

  // Cart actions
  const handleUpdateCartQuantity = (id: string, newQt: number) => {
    if (newQt <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQt } : item))
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast('Produto removido de seu carrinho.');
  };

  const handleToggleSelectItem = (id: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setCart((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  // Dynamic real persistent Firestore checkouts
  const handleCheckout = async (
    couponApplied: Coupon | null, 
    address: {
      street: string;
      number: string;
      neighborhood: string;
      reference: string;
      fullname: string;
      email: string;
    },
    paymentMethod: 'pix' | 'cartao' | 'dinheiro',
    needsChange: boolean,
    changeAmount: string
  ) => {
    const selectedItems = cart.filter((item) => item.selected);
    if (selectedItems.length === 0) return;

    if (!firebaseUser) {
      showToast('Entre na sua conta para finalizar o pedido!');
      setCurrentView('me');
      return;
    }

    if (isCheckingOut) return;
    setIsCheckingOut(true);

    // Enrich address with user info
    address.fullname = firebaseUser.displayName || 'Cliente ItaBuy';
    address.email = firebaseUser.email || '';

    const subtotal = selectedItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    
    // Apply discount
    let discount = 0;
    if (couponApplied) {
      if (couponApplied.type === 'percentage') {
        discount = subtotal * (couponApplied.discount / 100);
      } else {
        discount = couponApplied.discount;
      }
    }

    const shipping = 0;
    const finalOrderTotal = Math.max(0, subtotal - discount + shipping);

    const generatedOrderId = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const currentDateStr = now.toLocaleDateString('pt-BR');
    const timestamp = now.getTime();

    // Create history item for Firestore
    const newOrder = {
      id: generatedOrderId,
      userId: firebaseUser.uid,
      date: currentDateStr,
      timestamp: timestamp,
      total: finalOrderTotal,
      itemsCount: selectedItems.reduce((sum, i) => sum + i.quantity, 0),
      status: paymentMethod === 'pix' ? 'Aguardando Pagamento' : 'Pendente',
      address,
      paymentMethod,
      needsChange,
      changeAmount,
      items: selectedItems.map((item) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images
        },
        quantity: item.quantity,
        selectedSpec: item.selectedSpec || {}
      }))
    };

    try {
      // If it's PIX, create payment on Mercado Pago
      if (paymentMethod === 'pix') {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/create-pix`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_amount: finalOrderTotal,
            description: `Pedido #${generatedOrderId} na ItaBuy`,
            payer: {
              email: firebaseUser.email || 'cliente@itabuy.com', // Fallback email
              first_name: firebaseUser.displayName?.split(' ')[0] || 'Cliente',
              last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'ItaBuy',
              identification: {
                type: 'CPF',
                number: '000.000.000-00' // In a real app, this should be collected
              }
            },
            orderId: generatedOrderId
          })
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = 'Falha ao gerar o pagamento via Pix. Tente outro método ou revise seus dados.';
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json().catch(() => ({}));
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            console.error('Server returned non-JSON error:', text);
            if (response.status === 404) errorMessage = 'Serviço de pagamentos não encontrado. Por favor, contate o suporte.';
            else if (response.status >= 500) errorMessage = 'O servidor de pagamentos encontrou um erro. Tente novamente em instantes.';
          }
          
          throw new Error(errorMessage);
        }

        const mpData = await response.json();
        
        // ONLY write to Firestore if PIX was successfully generated
        // Enrich order with Mercado Pago ID and QR Code payload
        const orderWithMP = {
          ...newOrder,
          mercadoPagoId: mpData.id?.toString(),
          qr_code: mpData.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64
        };
        await setDoc(doc(db, 'orders', generatedOrderId), orderWithMP);

        setPixPaymentData({
          orderId: generatedOrderId,
          total: finalOrderTotal,
          qr_code: mpData.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64
        });
      } else {
        // Card/Cash - write to Firestore directly
        await setDoc(doc(db, 'orders', generatedOrderId), newOrder);

        // For Card/Cash, we show the success modal directly as requested
        setCheckoutSuccessModal({
          opened: true,
          orderId: generatedOrderId,
          total: finalOrderTotal,
          method: paymentMethod,
          address,
          needsChange,
          changeAmount
        });
      }

      // Decrement catalog stock in Firestore
      for (const item of selectedItems) {
        const prodRef = doc(db, 'products', item.product.id);
        const prodDoc = await getDoc(prodRef);
        const currentStock = prodDoc.exists() ? (prodDoc.data().stock || 0) : 0;
        const currentSales = prodDoc.exists() ? (prodDoc.data().salesCount || 0) : 0;
        
        const newStock = Math.max(0, currentStock - item.quantity);
        const newSalesCount = currentSales + item.quantity;
        
        await setDoc(prodRef, { 
          stock: newStock,
          salesCount: newSalesCount 
        }, { merge: true });
      }

      // Decrement used coin balances if coupon applied, or award 10 ItaCoins per purchase!
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const updatedCoins = userCoins + 10;
      await setDoc(userDocRef, { coins: updatedCoins }, { merge: true });
      setUserCoins(updatedCoins);

      // Clear checked items from the React cart layout
      setCart((prev) => prev.filter((item) => !item.selected));
    } catch (error: any) {
      console.error("Checkout Error:", error);
      let userMsg = error.message || 'Erro ao processar seu pedido. Tente novamente.';
      if (error && (error.message === 'Failed to fetch' || error.message?.includes('fetch'))) {
        userMsg = 'Erro de Conexão (API): A variável VITE_API_URL no Vercel não foi configurada ou aponta para uma URL privada. Configure-a com a URL Pública (Shared App URL) do Cloud Run do AI Studio.';
      }
      showToast(userMsg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Clear orders history deleting records from Firestore
  const handleClearHistory = async () => {
    if (!firebaseUser) return;
    try {
      for (const order of orderHistory) {
        await deleteDoc(doc(db, 'orders', order.id));
      }
      setOrderHistory([]);
      showToast('Histórico excluído do banco de dados.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'orders');
    }
  };

  // Cancellation and Refund process trigger
  const handleRequestCancellation = async (order: any) => {
    if (!firebaseUser) return;
    try {
      // 1. Create/update a cancellation request document in Firestore collection 'cancellations'
      const cancellationRef = doc(db, 'cancellations', order.id);
      await setDoc(cancellationRef, {
        orderId: order.id,
        userId: firebaseUser.uid,
        userName: firebaseUser.displayName || mappedUser?.name || 'Cliente ItaBuy',
        userEmail: firebaseUser.email || mappedUser?.email || '',
        total: order.total,
        paymentMethod: order.paymentMethod || 'não informado',
        itemsCount: order.itemsCount || 1,
        items: order.items || [],
        address: order.address || {},
        status: 'Pendente',
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('pt-BR')
      });

      // 2. We also flag the order itself with cancellationRequested: true
      const orderRef = doc(db, 'orders', order.id);
      await setDoc(orderRef, {
        status: 'Análise de Cancelamento',
        cancellationRequested: true,
        cancellationStatus: 'Pendente'
      }, { merge: true });

      // 3. Create an admin notification inside Firestore
      const notificationRef = doc(db, 'notifications', `cancel-${order.id}`);
      await setDoc(notificationRef, {
        id: `cancel-${order.id}`,
        title: 'Nova Solicitação de Cancelamento',
        message: `O cliente ${firebaseUser.displayName || mappedUser?.name || 'ItaBuy'} solicitou cancelamento do pedido #${order.id} (R$ ${(order.total || 0).toFixed(2)})`,
        type: 'cancellation',
        orderId: order.id,
        timestamp: Date.now(),
        read: false
      });

      showToast('Solicitação de cancelamento enviada ao administrador! 🚀');
    } catch (error: any) {
      console.error("Cancellation Error in App:", error);
      showToast('Erro ao solicitar cancelamento: ' + error.message);
    }
  };

  // Category filter navigation
  const handleNavigateToCategory = (catId: string) => {
    if (catId === '') {
      setSelectedCategory('');
      setCurrentView('home');
    } else {
      setSelectedCategory(catId);
      setCurrentView('category');
    }
  };

  const handleNavigateToPage = (pId: string) => {
    setCurrentPageId(pId);
    setCurrentView('banner_page');
  };

  // Filter products strictly based on categories selection if any
  const categoryProducts = activeCategoryFilter 
    ? products.filter((p) => p.category === activeCategoryFilter)
    : products;

  // Total items in cart for badge calculations
  const cartTotalBadge = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Authenticated user object mapping
  const mappedUser = firebaseUser ? {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Cliente ItaBuy',
    email: firebaseUser.email || '',
    coins: userCoins
  } : null;

  return (
    <div className={currentView === 'admin' ? "min-h-screen w-screen" : "min-h-screen bg-[#ebebeb] flex justify-center items-stretch font-sans text-gray-800 antialiased overflow-x-hidden md:p-4"}>
      {currentView === 'admin' ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <div 
          className={`w-full max-w-md ${darkMode ? 'dark-theme-wrapper' : 'bg-white'} flex flex-col min-h-screen shadow-sm relative overflow-hidden md:rounded-none border ${inspectMode ? 'border-amber-500 border-4 cursor-crosshair' : 'border-gray-200 relative'}`}
          onClickCapture={(e) => {
            if (inspectMode) {
              e.preventDefault();
              e.stopPropagation();
              let target = e.target as HTMLElement;
              let sectionId = 'home';
              
              if (target.closest('header')) {
                sectionId = 'header';
              } else if (target.closest('#footer') || target.closest('footer')) {
                sectionId = 'footer';
              } else {
                sectionId = 'home';
              }
              
              window.parent.postMessage({ type: 'ELEMENTOR_INSPECT_RESULT', payload: { sectionId } }, '*');
              setInspectMode(false);
            }
          }}
        >
          
          {/* Toast for exit */}
          <AnimatePresence>
            {backToast && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-bold z-50 pointer-events-none"
              >
                Pressione voltar novamente para sair
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 1. Header Toolbar Component (Hidden for standalone product, category, flash deals, or search page) */}
          {currentView !== 'product' && currentView !== 'category' && currentView !== 'flash_deals' && currentView !== 'search' && (
            <Header 
              currentView={currentView}
              onNavigate={(view) => {
                setCurrentView(view);
                if (view === 'home') {
                  setActiveCategoryFilter('');
                  setSearchQuery('');
                }
              }}
              searchQuery={searchQuery}
              setSearchQuery={(q) => {
                setSearchQuery(q);
                if (activeCategoryFilter) setActiveCategoryFilter('');
              }}
              cartCount={cartTotalBadge}
              storeSettings={storeSettings}
              products={products}
              onSearchSubmit={(q) => {
                setSearchQuery(q);
                setCurrentView('search');
              }}
            />
          )}

          {/* 2. Main Content View Router switcher */}
          <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-16">
            
            {/* Active Category Filter Header feedback if selected */}
            {activeCategoryFilter && (
              <div className="bg-brand-blue/5 text-brand-blue flex items-center justify-between p-2.5 px-4 text-xs font-bold border-b border-gray-200">
                <span className="capitalize">Categoria: {activeCategoryFilter}</span>
                <button 
                  onClick={() => handleNavigateToCategory('')}
                  className="text-gray-400 hover:text-red-500 font-extrabold"
                >
                  Limpar Filtro ✕
                </button>
              </div>
            )}

            {currentView === 'home' && (
              <>
                {/* Moving Instagram Ticker Banner */}
                <a 
                  href="https://www.instagram.com/itabuy.com.br/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block bg-gradient-primary text-white py-2 overflow-hidden select-none cursor-pointer border-b border-gray-100 shrink-0 shadow-sm"
                >
                  <div className="w-full overflow-hidden flex">
                    <div className="animate-marquee flex gap-12 text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">
                      {/* Repeated phrases to span larger than screen width */}
                      <span>👉 Segue a gente no Insta e participe de sorteios: @itabuy.com.br 🎁</span>
                      <span>👉 Segue a gente no Insta e participe de sorteios: @itabuy.com.br 🎁</span>
                      <span>👉 Segue a gente no Insta e participe de sorteios: @itabuy.com.br 🎁</span>
                      <span>👉 Segue a gente no Insta e participe de sorteios: @itabuy.com.br 🎁</span>
                      
                      {/* Identical cloned items for a perfect seamless infinite loop */}
                      <span>👉 Segue a gente no Insta e participe de sorteios: @itabuy.com.br 🎁</span>
                      <span>👉 Segue a gente no Insta e participe de sorteios: @itabuy.com.br 🎁</span>
                      <span>👉 Segue a gente no Insta e participe de sorteios: @itabuy.com.br 🎁</span>
                      <span>👉 Segue a gente no Insta e participe de sorteios: @itabuy.com.br 🎁</span>
                    </div>
                  </div>
                </a>

                <HomeView 
                  products={categoryProducts}
                  onSelectProduct={(p) => {
                    setSelectedProduct(p);
                    setCurrentView('product');
                  }}
                  onSelectCoupon={handleClaimCoupon}
                  searchQuery={searchQuery}
                  onNavigateToCategory={handleNavigateToCategory}
                  onNavigateToPage={handleNavigateToPage}
                  onNavigateToFlashDeals={() => setCurrentView('flash_deals')}
                  availableCoupons={availableCoupons}
                  banners={banners}
                  loading={isLoadingDB}
                  storeSettings={storeSettings}
                  inspectMode={inspectMode}
                />
              </>
            )}

            {currentView === 'product' && selectedProduct && (
              <ProductDetailView 
                product={selectedProduct}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onBack={() => setCurrentView('home')}
                storeCoupons={availableCoupons.filter((c) => c.id !== 'c1')} // exclude main checkout free shipping
                onClaimCoupon={handleClaimCoupon}
                isFavorite={favorites.some((fav) => fav.id === selectedProduct.id)}
                onToggleFavorite={handleToggleFavorite}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onViewCart={() => setCurrentView('cart')}
              />
            )}

            {currentView === 'search' && (
              <SearchView 
                products={products}
                initialQuery={searchQuery}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  setCurrentView('product');
                }}
                onBack={() => {
                  setCurrentView('home');
                  setSearchQuery('');
                }}
                categoriesList={storeSettings?.categories}
              />
            )}

            {currentView === 'cart' && (
              firebaseUser ? (
                <CartView 
                  cartItems={cart}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveCartItem}
                  onToggleSelectItem={handleToggleSelectItem}
                  onToggleSelectAll={handleToggleSelectAll}
                  coupons={claimedCoupons}
                  onCheckout={handleCheckout}
                  isCheckingOut={isCheckingOut}
                  favorites={favorites}
                  onSelectProduct={(p) => {
                    setSelectedProduct(p);
                    setCurrentView('product');
                  }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-sm text-gray-600 mb-4">Você precisa estar logado para acessar seu carrinho.</p>
                    <button onClick={() => setCurrentView('me')} className="bg-brand-blue text-white px-6 py-2 rounded-xl text-xs font-black">Ir para Login</button>
                </div>
              )
            )}

            {currentView === 'me' && (
              <MeView 
                userCoupons={claimedCoupons}
                orderHistory={orderHistory}
                onClearHistory={handleClearHistory}
                favorites={favorites}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  setCurrentView('product');
                }}
                onShowToast={showToast}
                currentUser={mappedUser}
                onLoginWithEmail={handleLoginWithEmail}
                onRegisterWithEmail={handleRegisterWithEmail}
                onForgotPassword={handleForgotPassword}
                onLogout={handleLogout}
                onGoogleLogin={handleGoogleLogin}
                onCancelOrder={handleRequestCancellation}
                onReopenPix={(orderId, total, qr_code, qr_code_base64) => {
                  setPixPaymentData({
                    orderId,
                    total,
                    qr_code,
                    qr_code_base64
                  });
                }}
                darkMode={darkMode}
                onToggleDarkMode={handleToggleDarkMode}
              />
            )}

            {currentView === 'compras' && (
              firebaseUser ? (
                <MyPurchasesView
                  orderHistory={orderHistory}
                  onCancelOrder={handleRequestCancellation}
                  onShowToast={showToast}
                  onBack={() => setCurrentView('me')}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-sm text-gray-600 mb-4">Você precisa estar logado para acessar seus pedidos.</p>
                    <button onClick={() => setCurrentView('me')} className="bg-brand-blue text-white px-6 py-2 rounded-xl text-xs font-black">Ir para Login</button>
                </div>
              )
            )}

            {currentView === 'sorteios' && (
              <SorteiosView 
                onShowToast={showToast}
              />
            )}

            {currentView === 'flash_deals' && (
              <FlashDealsView 
                products={products}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  setCurrentView('product');
                }}
                onBack={() => setCurrentView('home')}
              />
            )}

            {currentView === 'banner_page' && currentPageId && (
              <BannerPageView
                pageId={currentPageId}
                onBack={() => setCurrentView('home')}
              />
            )}

            {currentView === 'category' && (
              <CategoryView 
                categoryId={selectedCategory}
                products={products}
                loading={isLoadingDB}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  setCurrentView('product');
                }}
                onBack={() => {
                  setSelectedCategory('');
                  setCurrentView('home');
                }}
              />
            )}

          </main>

          {/* 3. Shopee-styled Fixed Navigation Bar at the absolute mobile bottom */}
          <nav id="footer" className="fixed bottom-0 z-40 w-full max-w-md bg-gradient-to-r from-brand-blue via-indigo-900 to-brand-blue border-t border-white/10 px-2 flex items-center justify-around h-16 shadow-2xl rounded-t-2xl" style={{ transform: 'translateX(-1px)' }}>
            
            <button 
              onClick={() => {
                setCurrentView('home');
                setSelectedProduct(null);
                setActiveCategoryFilter('');
                setSearchQuery('');
              }}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 transition-colors duration-200 relative h-full tap-highlight-transparent ${currentView === 'home' ? 'text-brand-yellow font-black' : 'text-blue-200/60 font-medium hover:text-white'}`}
            >
              {currentView === 'home' && (
                <motion.div 
                  layoutId="activeTabPill" 
                  className="absolute inset-[6px] bg-white/10 border border-white/15 rounded-xl -z-10" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <HomeIcon className="w-5 h-5 mb-0.5 relative z-10" />
              <span className="text-[10px] uppercase font-bold relative z-10">Início</span>
            </button>

            {/* Minhas Compras Tab */}
            <button 
              onClick={() => setCurrentView('compras')}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 transition-colors duration-200 relative h-full tap-highlight-transparent ${currentView === 'compras' ? 'text-brand-yellow font-black' : 'text-blue-200/60 font-medium hover:text-white'}`}
            >
              {currentView === 'compras' && (
                <motion.div 
                  layoutId="activeTabPill" 
                  className="absolute inset-[6px] bg-white/10 border border-white/15 rounded-xl -z-10" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Package className="w-5 h-5 mb-0.5 relative z-10" />
              <span className="text-[10px] uppercase font-bold relative z-10">Compras</span>
            </button>

            {/* Minha Conta Tab */}
            <button 
              onClick={() => setCurrentView('me')}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 transition-colors duration-200 relative h-full tap-highlight-transparent ${currentView === 'me' ? 'text-brand-yellow font-black' : 'text-blue-200/60 font-medium hover:text-white'}`}
            >
              {currentView === 'me' && (
                <motion.div 
                  layoutId="activeTabPill" 
                  className="absolute inset-[6px] bg-white/10 border border-white/15 rounded-xl -z-10" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <UserIcon className="w-5 h-5 mb-0.5 relative z-10" />
              <span className="text-[10px] uppercase font-bold relative z-10">Conta</span>
            </button>

          </nav>

          {/* 4. Centered lightweight mobile Toast Alert */}
          {toast.visible && (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
              <div className="bg-brand-blue text-white font-black text-xs py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-brand-yellow/40 animate-fade-in max-w-[85%] text-center">
                <span className="text-brand-yellow text-sm">🎉</span> <span>{toast.message}</span>
              </div>
            </div>
          )}

          {/* 5. Checkout Success Interactive Simulation Modal */}
          {checkoutSuccessModal.opened && (
            <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
              <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl p-5 border border-gray-150 animate-scale-up">
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 text-emerald-500 mb-3">
                    <Check className="w-6 h-6 stroke-[3px]" />
                  </div>

                  <h3 className="text-gray-900 font-black text-sm uppercase tracking-wider">
                    Pedido Recebido!
                  </h3>
                  
                  <p className="text-[11px] text-gray-500 mt-1 lines-clamp-3">
                    Seu pedido na <strong>ItaBuy</strong> foi enviado para a esteira logística. Código: <strong>#{checkoutSuccessModal.orderId}</strong>
                  </p>

                  <div className="my-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl w-full text-center">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold leading-none mb-1">Total a Pagar</span>
                    <span className="text-brand-blue font-black text-lg">R$ {(checkoutSuccessModal.total || 0).toFixed(2)}</span>
                  </div>

                  {/* Delivery Address display */}
                  <div className="w-full text-left bg-blue-50/20 border border-blue-100/50 p-2.5 rounded-lg mb-3 text-[10.5px] text-gray-600 line-clamp-2">
                    📍 <strong>Entrega em:</strong> {checkoutSuccessModal.address?.street}, {checkoutSuccessModal.address?.number} - {checkoutSuccessModal.address?.neighborhood}
                  </div>

                  {checkoutSuccessModal.method === 'pix' && (
                    <div className="w-full flex flex-col items-center py-4 bg-blue-50/30 rounded-xl border border-blue-100">
                      <Loader2 className="w-6 h-6 text-brand-blue animate-spin mb-2" />
                      <p className="text-[11px] text-brand-blue font-black uppercase tracking-widest">Processando Pix...</p>
                    </div>
                  )}

                  {checkoutSuccessModal.method === 'cartao' && (
                    <div className="w-full text-center">
                      <span className="text-[10px] font-bold text-brand-blue bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-md block text-center mb-2">
                        💳 PAGAMENTO NA ENTREGA (CARTÃO)
                      </span>
                      <p className="text-[11px] text-gray-600 leading-normal font-medium">
                        Estaremos levando a nossa maquininha até seu endereço. Pague na entrega usando crédito ou débito.
                      </p>
                    </div>
                  )}

                  {checkoutSuccessModal.method === 'dinheiro' && (
                    <div className="w-full text-center space-y-1 bg-amber-50/30 border border-amber-100 p-2 rounded-lg">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded-md block text-center">
                        💵 PAGAMENTO NA ENTREGA (DINHEIRO)
                      </span>
                      <p className="text-[11px] text-gray-600 font-medium">
                        {checkoutSuccessModal.needsChange ? (
                          <span>🙋‍♂️ Preparamos o troco solicitado para: <strong>{checkoutSuccessModal.changeAmount}</strong></span>
                        ) : (
                          <span>🙋‍♂️ Sem necessidade de levar troco. PAGO EM DINHEIRO FÍSICO.</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Confirm order closing button */}
                  <button
                    onClick={() => {
                      setCheckoutSuccessModal({ opened: false, orderId: '', total: 0, method: 'pix', address: '', needsChange: false, changeAmount: '' });
                      setCurrentView('compras');
                    }}
                    className="w-full bg-transparent border border-gray-250 text-gray-550 active:bg-gray-100 hover:border-gray-400 mt-3 font-semibold text-xs py-2 rounded-md text-gray-600 transition-all active:scale-95"
                  >
                    Ver Meu Rastreio
                  </button>
                </div>

              </div>
            </div>
          )}
          {/* 6. Options Picker Popup */}
          <AnimatePresence>
            {pickingOptionsProduct && (
              <OptionsPickerPopup 
                product={pickingOptionsProduct}
                onConfirm={(selections) => {
                  if (pendingAction === 'cart') {
                    handleAddToCart(pickingOptionsProduct, selections);
                  } else {
                    handleBuyNow(pickingOptionsProduct, selections);
                  }
                  setPickingOptionsProduct(null);
                }}
                onCancel={() => setPickingOptionsProduct(null)}
              />
            )}
          </AnimatePresence>
          {/* 7. Mercado Pago Pix Popup */}
          {pixPaymentData && (
            <CheckoutPixPopup 
              orderId={pixPaymentData.orderId}
              total={pixPaymentData.total}
              pixData={{
                qr_code: pixPaymentData.qr_code,
                qr_code_base64: pixPaymentData.qr_code_base64
              }}
              onSuccess={() => {
                setPixPaymentData(null);
                setCurrentView('compras');
                showToast('Pagamento confirmado! 🚀');
              }}
              onClose={() => {
                setPixPaymentData(null);
                setCurrentView('compras'); // Redirect to Compras view to see the pending order
                showToast('Pedido reservado! Pague para confirmar.');
              }}
            />
          )}
          <PWAInstallPrompt />
        </div>
      )}
    </div>
  );
}
