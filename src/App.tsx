import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, ShoppingCart as CartIcon, User as UserIcon, 
  Sparkles, Check, ChevronRight, X, Smartphone, Tv, Shirt, 
  Sparkles as SparklesIcon, Footprints, Home as HomeIcon2, 
  Dumbbell, Gamepad2, Compass, Trophy, Loader2
} from 'lucide-react';
import { Product, CartItem, Coupon } from './types';
import Header from './components/Header';
import HomeView from './components/HomeView';
import ProductDetailView from './components/ProductDetailView';
import CartView from './components/CartView';
import MeView from './components/MeView';
import SorteiosView from './components/SorteiosView';
import FlashDealsView from './components/FlashDealsView';
import CategoryView from './components/CategoryView';
import AdminDashboard from './components/AdminDashboard';
import OptionsPickerPopup from './components/OptionsPickerPopup';
import CheckoutPixPopup from './components/CheckoutPixPopup';

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

export default function App() {
  // Database catalog & coupons state
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // Navigation
  const [currentView, setCurrentView] = useState<'home' | 'product' | 'cart' | 'me' | 'sorteios' | 'flash_deals' | 'category' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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

  // Strictly load live production data from Firestore.
  // No mock fallbacks are allowed, obeying the user's intent to remove all non-fixed test data.
  useEffect(() => {
    const loadStoreContent = async () => {
      try {
        // Load products collection
        const prodSnap = await getDocs(collection(db, 'products'));
        const prodList: Product[] = [];
        prodSnap.forEach((doc) => {
          prodList.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(prodList);

        // Load coupons collection
        const coupSnap = await getDocs(collection(db, 'coupons'));
        const coupList: Coupon[] = [];
        coupSnap.forEach((doc) => {
          coupList.push({ id: doc.id, ...doc.data() } as Coupon);
        });
        setAvailableCoupons(coupList);
        setIsLoadingDB(false);
      } catch (error) {
        console.error("Firestore database integration loading error:", error);
        handleFirestoreError(error, OperationType.GET, 'products');
        setIsLoadingDB(false);
      }
    };

    loadStoreContent();
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
      if (fUser) {
        setFirebaseUser(fUser);
        if (fUser.email === 'adminbuy22@gmail.com') {
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
        const response = await fetch('/api/create-pix', {
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Falha ao gerar o pagamento via Pix. Tente outro método ou revise seus dados.');
        }

        const mpData = await response.json();
        
        // ONLY write to Firestore if PIX was successfully generated
        await setDoc(doc(db, 'orders', generatedOrderId), newOrder);

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
      showToast(error.message || 'Erro ao processar seu pedido. Tente novamente.');
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
    <div className={currentView === 'admin' ? "min-h-screen w-screen" : "min-h-screen bg-slate-900 flex justify-center items-stretch font-sans text-gray-800 antialiased overflow-x-hidden md:p-4"}>
      {currentView === 'admin' ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <div className="w-full max-w-md bg-white flex flex-col min-h-screen shadow-2xl relative overflow-hidden md:rounded-2xl border border-gray-150 relative">
          
          {/* 1. Header Toolbar Component (Hidden for standalone product, category, or flash deals page) */}
          {currentView !== 'product' && currentView !== 'category' && currentView !== 'flash_deals' && (
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
              <HomeView 
                products={categoryProducts}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  setCurrentView('product');
                }}
                onSelectCoupon={handleClaimCoupon}
                searchQuery={searchQuery}
                onNavigateToCategory={handleNavigateToCategory}
                onNavigateToFlashDeals={() => setCurrentView('flash_deals')}
                availableCoupons={availableCoupons}
              />
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
              />
            )}

            {currentView === 'cart' && (
              <CartView 
                cartItems={cart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onToggleSelectItem={handleToggleSelectItem}
                onToggleSelectAll={handleToggleSelectAll}
                coupons={claimedCoupons}
                onCheckout={handleCheckout}
                favorites={favorites}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  setCurrentView('product');
                }}
              />
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
              />
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

            {currentView === 'category' && (
              <CategoryView 
                categoryId={selectedCategory}
                products={products}
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
          <nav className="fixed bottom-0 z-40 w-full max-w-md bg-white border-t border-gray-150 px-2 flex items-center justify-around h-15 shadow-inner" style={{ transform: 'translateX(-1px)' }}>
            
            <button 
              onClick={() => {
                setCurrentView('home');
                setSelectedProduct(null);
                setActiveCategoryFilter('');
                setSearchQuery('');
              }}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 transition-colors relative tap-highlight-transparent ${currentView === 'home' ? 'text-brand-blue font-bold' : 'text-gray-400 font-medium hover:text-gray-600'}`}
            >
              <HomeIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Início</span>
            </button>

            <button 
              onClick={() => {
                setCurrentView('sorteios');
                setSelectedProduct(null);
              }}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 transition-colors relative tap-highlight-transparent ${currentView === 'sorteios' ? 'text-brand-blue font-bold' : 'text-gray-400 font-medium hover:text-gray-600'}`}
            >
              <Trophy className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Sorteios</span>
            </button>

            {/* Cart Tab button */}
            <button 
              onClick={() => setCurrentView('cart')}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 transition-colors relative tap-highlight-transparent ${currentView === 'cart' ? 'text-brand-blue font-bold' : 'text-gray-400 font-medium hover:text-gray-600'}`}
            >
              <div className="relative">
                <CartIcon className="w-5 h-5 mb-0.5" />
                {cartTotalBadge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-brand-yellow text-brand-blue font-black text-[9px] min-w-[14px] h-[14px] rounded-full flex items-center justify-center border border-white">
                    {cartTotalBadge}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Carrinho</span>
            </button>

            {/* Profile tab button */}
            <button 
              onClick={() => setCurrentView('me')}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 transition-colors relative tap-highlight-transparent ${currentView === 'me' ? 'text-brand-blue font-bold' : 'text-gray-400 font-medium hover:text-gray-600'}`}
            >
              <UserIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Eu</span>
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
                    <span className="text-brand-blue font-black text-lg">R$ {checkoutSuccessModal.total.toFixed(2)}</span>
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
                      setCurrentView('me');
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
                setCurrentView('me');
                showToast('Pagamento confirmado! 🚀');
              }}
              onClose={() => {
                setPixPaymentData(null);
                setCurrentView('me'); // Redirect to Me view to see the pending order
                showToast('Pedido reservado! Pague para confirmar.');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
