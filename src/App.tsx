import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Bell, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight,
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Package,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  Edit,
  User,
  Lightbulb,
  Zap,
  ShoppingBag,
  History,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  MinusCircle,
  PlusCircle,
  Clock,
  LogOut
} from 'lucide-react';
import { TABS, Product, Transaction } from './types';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCashOpen, setIsCashOpen] = useState(true);
  
  // Real App State
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setTransactions([]);
      setClients([]);
      return;
    }

    const qProducts = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const prods = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(prods);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const qTransactions = query(collection(db, 'transactions'), where('ownerId', '==', user.uid));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(txs.sort((a, b) => b.id.localeCompare(a.id))); // Simple sort by ID (timestamp string)
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const qClients = query(collection(db, 'clients'), where('ownerId', '==', user.uid));
    const unsubClients = onSnapshot(qClients, (snapshot) => {
      const cls = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setClients(cls);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'clients'));

    return () => {
      unsubProducts();
      unsubTransactions();
      unsubClients();
    };
  }, [user]);

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'transactions'), { ...tx, ownerId: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'transactions');
    }
  };

  const addProduct = async (p: Omit<Product, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'products'), { ...p, ownerId: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const addClient = async (c: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'clients'), { ...c, ownerId: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'clients');
    }
  };

  const onSale = async (sale: any) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // Add transaction
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, { ...sale, ownerId: user.uid });

      // Update products stock
      sale.items?.forEach((item: any) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const productRef = doc(db, 'products', product.id);
          batch.update(productRef, { stock: product.stock - item.quantity });
        }
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'sale complex operation');
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError(`Este domínio (${window.location.hostname}) não está autorizado no Firebase. Por favor, adicione-o em 'Authorized Domains' no console do Firebase.`);
      } else {
        setAuthError(err.message || "Ocorreu um erro ao tentar entrar.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center space-y-4">
          <img src="input_file_0.png" alt="GerentePro Logo" className="w-full max-w-[280px] mx-auto drop-shadow-xl" referrerPolicy="no-referrer" />
          <p className="text-outline">Gerencie seu negócio com facilidade e segurança.</p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          {authError && (
            <div className="bg-error-container text-error p-4 rounded-xl text-xs font-bold border border-error/20 animate-pulse">
              {authError}
            </div>
          )}
          
          <button 
            onClick={handleLogin}
            className="w-full bg-white border border-outline-variant p-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-md hover:bg-surface-container transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView isCashOpen={isCashOpen} transactions={transactions} products={products} />;
      case 'caixa':
        return (
          <CaixaView 
            isCashOpen={isCashOpen} 
            setIsCashOpen={setIsCashOpen} 
            products={products} 
            onSale={onSale}
          />
        );
      case 'vendas':
        return <VendasView transactions={transactions} />;
      case 'estoque':
        return <EstoqueView products={products} onAddProduct={addProduct} onDeleteProduct={deleteProduct} />;
      case 'clientes':
        return <ClientesView clients={clients} onAddClient={addClient} />;
      case 'relatorios':
        return <RelatoriosView transactions={transactions} products={products} />;
      case 'config':
        return <ConfiguracoesView />;
      default:
        return <DashboardView isCashOpen={isCashOpen} transactions={transactions} products={products} />;
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-surface flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed border-2 border-primary flex items-center justify-center text-primary">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={24} />
            )}
          </div>
          <img src="input_file_0.png" alt="GerentePro Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={logout}
            className="p-2 rounded-full hover:bg-error/10 text-error transition-colors"
            title="Sair"
          >
            <LogOut size={22} />
          </button>
          <button className="relative p-2 rounded-full hover:bg-surface-container transition-colors">
            <Bell className="text-outline" size={24} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/95 backdrop-blur-lg border-t border-outline-variant flex items-center justify-between px-1 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center transition-all min-w-[72px] ${
              activeTab === tab.id 
                ? 'text-primary scale-110' 
                : 'text-outline hover:text-secondary'
            }`}
          >
            <tab.icon size={24} fill={activeTab === tab.id ? "currentColor" : "none"} />
            <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -top-1 w-8 h-1 bg-primary rounded-b-full"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

function DashboardView({ isCashOpen, transactions, products }: { isCashOpen: boolean, transactions: Transaction[], products: Product[] }) {
  const todaySales = transactions.filter(t => t.type === 'sale').reduce((acc, curr) => acc + curr.amount, 0);
  const lowStockProducts = products.filter(p => p.stock <= 5);
  const expiringSoonProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });
  
  const alertsCount = lowStockProducts.length + expiringSoonProducts.length;
  const balance = transactions.reduce((acc, curr) => (curr.type === 'sale' || curr.type === 'input') ? acc + curr.amount : acc - curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Painel de Controle</h2>
          <p className="text-outline text-sm">Resumo operacional de hoje</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          isCashOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
        }`}>
          {isCashOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Grid Card */}
        <div className="bg-primary rounded-2xl p-5 text-white shadow-lg overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Saldo total</span>
              <div className="bg-white/20 p-1.5 rounded-lg">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl font-bold">R$ {balance.toFixed(2).replace('.', ',')}</h3>
              <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                Total acumulado no sistema
              </p>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Entries Grid Card */}
        <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-outline uppercase tracking-widest">Vendas Hoje</span>
            <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
              <ArrowUp size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-emerald-600">R$ {todaySales.toFixed(2).replace('.', ',')}</h3>
            <p className="text-xs text-outline mt-1 font-medium">{transactions.filter(t => t.type === 'sale').length} transações realizadas</p>
          </div>
        </div>

        {/* Exits Grid Card */}
        <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-outline uppercase tracking-widest">Alertas</span>
            <div className="bg-rose-100 text-rose-600 p-1.5 rounded-full">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-rose-600">{alertsCount}</h3>
            <p className="text-xs text-outline mt-1 font-medium">Alertas de estoque/validade</p>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="text-error" size={20} />
            Alertas Críticos
          </h3>
        </div>
        <div className="space-y-3">
          {alertsCount > 0 ? (
            <>
              {lowStockProducts.map(p => (
                <div key={`low-${p.id}`} className="bg-white border border-outline-variant rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-error">
                    <Package size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{p.name}</h4>
                    <p className="text-xs text-outline">Estoque: {p.stock} unidades</p>
                  </div>
                  <span className="bg-error-container text-error px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Estoque</span>
                </div>
              ))}
              {expiringSoonProducts.map(p => (
                <div key={`exp-${p.id}`} className="bg-white border border-outline-variant rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-tertiary-container/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-tertiary">
                    <Calendar size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{p.name}</h4>
                    <p className="text-xs text-outline">Vence em: {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                  <span className="bg-tertiary-container text-on-tertiary-container px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Validade</span>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-white border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center">
              <CheckCircle2 size={32} className="text-outline/40" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-outline">Tudo sob controle</h4>
                <p className="text-xs text-outline/60">Não há alertas críticos no momento.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI Insight */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl border border-white/10 group">
        <div className="relative z-10 max-w-[75%] space-y-4">
          <div className="flex items-center gap-2 text-primary-fixed-dim">
            <Lightbulb size={20} fill="currentColor" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Insight Inteligente</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Otimize seu Fluxo de Caixa</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              O item <strong className="text-white">"Cabo HDMI 2.0"</strong> está parado há 45 dias. Sugerimos um desconto de 15% para acelerar a liquidação.
            </p>
          </div>
          <button className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg">
            APLICAR PROMOÇÃO
            <Zap size={14} />
          </button>
        </div>
        {/* Abstract shapes for visual flair */}
        <div className="absolute right-[-10%] top-[-10%] w-48 h-48 bg-primary/20 rounded-full blur-[60px]"></div>
        <div className="absolute right-0 bottom-0 p-4 opacity-20 transition-transform group-hover:scale-110">
          <TrendingUp size={120} strokeWidth={1} />
        </div>
      </div>
    </div>
  );
}

function CaixaView({ isCashOpen, setIsCashOpen, products, onSale }: { isCashOpen: boolean, setIsCashOpen: (v: boolean) => void, products: Product[], onSale: (sale: any) => void }) {
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState(1);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleFinalize = () => {
    if(cart.length === 0) return;
    onSale({
      type: 'sale',
      description: `Venda de ${cart.length} itens`,
      amount: total,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: 'Dinheiro/Pix',
      items: cart
    });
    setCart([]);
    alert('Venda finalizada com sucesso!');
  };

  const filteredSearch = search.length > 0 
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Caixa Registradora</h2>
          <p className="text-outline text-sm">Operação de frente de loja (PDV)</p>
        </div>
      </div>

      <div className="bg-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Saldo do Caixa</p>
            <h3 className="text-4xl font-bold mt-1">R$ 0,00</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Total do Carrinho</p>
            <h3 className="text-4xl font-bold mt-1">R$ {total.toFixed(2).replace('.', ',')}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setIsCashOpen(!isCashOpen)}
          className={`w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-lg shadow-sm transition-all active:scale-[0.98] ${
            isCashOpen 
              ? 'bg-white border-primary text-primary' 
              : 'bg-primary border-primary text-white'
          }`}
        >
          {isCashOpen ? <Lock size={20} /> : <Unlock size={20} />}
          {isCashOpen ? 'Fechar Caixa' : 'Abrir Caixa'}
        </button>
      </div>

      {isCashOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* POS Input Area */}
          <div className="bg-white border border-outline-variant rounded-2xl p-4 shadow-sm space-y-4 relative">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Adicionar Itens</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar produto..."
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
                
                {/* Search Results Dropdown */}
                {filteredSearch.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-[60] mt-2 bg-white border border-outline-variant rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredSearch.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          const existing = cart.find(c => c.id === p.id);
                          if(existing) {
                            setCart(cart.map(c => c.id === p.id ? {...c, quantity: c.quantity + qty} : c));
                          } else {
                            setCart([...cart, { ...p, quantity: qty }]);
                          }
                          setSearch('');
                        }}
                        className="w-full p-3 text-left hover:bg-surface flex justify-between items-center border-b last:border-0"
                      >
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-[10px] text-outline">Estoque: {p.stock} un.</p>
                        </div>
                        <p className="font-bold text-primary text-sm">R$ {p.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input 
                type="number" 
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                min="1"
                className="w-20 px-3 py-3 bg-surface-container-low border border-outline-variant rounded-xl font-bold text-center outline-none"
              />
            </div>
          </div>

          {/* Cart View */}
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-surface-container p-3 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-widest text-outline">Itens da Venda</h3>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">{cart.length} itens</span>
            </div>
            {cart.length > 0 ? (
              <div className="divide-y divide-surface max-h-[300px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-container rounded-lg flex items-center justify-center text-outline">
                        <Package size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <p className="text-[10px] text-outline">Qtd: {item.quantity} x R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-on-surface">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-outline hover:text-error transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                <ShoppingBag size={48} strokeWidth={1} />
                <p className="text-xs font-bold uppercase tracking-wider">Carrinho Vazio</p>
              </div>
            )}
            
            {cart.length > 0 && (
              <div className="p-4 bg-surface-container-low border-t border-outline-variant">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-outline font-bold text-xs uppercase">Total</span>
                  <span className="text-xl font-extrabold text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <button 
                  onClick={handleFinalize}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 size={20} />
                  Finalizar Venda
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function VendasView({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Log de Vendas</h2>
          <p className="text-outline text-sm">Registro histórico de todas as transações</p>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-surface-container p-4 border-b border-outline-variant">
          <h3 className="font-bold text-xs uppercase tracking-widest text-outline">Vendas Realizadas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-4 py-3 text-[10px] font-bold text-outline uppercase tracking-widest">ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-outline uppercase tracking-widest">Data/Hora</th>
                <th className="px-4 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Valor</th>
                <th className="px-4 py-3 text-[10px] font-bold text-outline uppercase tracking-widest">Met. Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface text-sm">
              {transactions.length > 0 ? transactions.filter(t => t.type === 'sale').map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-4 py-4 font-mono text-[10px] text-outline">#{tx.id.slice(-6)}</td>
                  <td className="px-4 py-4 text-on-surface font-medium">{tx.date}</td>
                  <td className="px-4 py-4 font-bold text-right text-emerald-600">R$ {tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-4 text-outline">{tx.paymentMethod}</td>
                </tr>
              )) : (
                <tr className="hover:bg-surface-container-lowest transition-colors italic">
                  <td colSpan={4} className="px-4 py-12 text-center text-outline opacity-50">Nenhuma venda registrada no sistema ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ClientesView({ clients, onAddClient }: { clients: any[], onAddClient: (c: any) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClient(newClient);
    setIsAdding(false);
    setNewClient({ name: '', phone: '', email: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-outline text-sm">Gestão de sua base de consumidores</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 active:scale-95"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6"
            >
              <h3 className="text-xl font-bold">Novo Cliente</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-outline">Nome Completo</label>
                  <input required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full p-3 bg-surface rounded-xl border border-outline-variant outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-outline">Telefone (WhatsApp)</label>
                  <input value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full p-3 bg-surface rounded-xl border border-outline-variant outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-outline">E-mail</label>
                  <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full p-3 bg-surface rounded-xl border border-outline-variant outline-none focus:border-primary" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 font-bold text-outline hover:bg-surface rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 font-bold bg-primary text-white rounded-xl shadow-lg active:scale-95 transition-all">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        {clients.length > 0 ? (
          <div className="divide-y divide-surface">
            {clients.map(c => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-surface transition-colors cursor-pointer capitalize">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-outline">
                      <User size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm">{c.name}</h5>
                      <p className="text-[10px] text-outline">{c.phone || c.email || 'Sem contato'}</p>
                    </div>
                 </div>
                 <ChevronRight className="text-outline/30" size={16} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/30">
              <User size={40} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-lg text-on-surface">Comece a cadastrar</h4>
              <p className="text-sm text-outline max-w-xs">Organize seus clientes para ter acesso a mais insights sobre tendências de compra.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfiguracoesView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Ajustes</h2>
          <p className="text-outline text-sm">Configurações do sistema Cloud Edition</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { label: 'Perfil da Empresa', desc: 'Logotipo, CNPJ, Endereço', icon: User },
          { label: 'Configurações de PDV', desc: 'Métodos de pagamento, impressoras', icon: ShoppingBag },
          { label: 'Sincronização Cloud', desc: 'Status da conexão com Supabase/Firebase', icon: Zap },
          { label: 'Segurança', desc: 'Permissões de funcionários e senhas', icon: Lock },
        ].map((item, i) => (
          <button key={i} className="bg-white border border-outline-variant p-5 rounded-2xl flex items-center gap-4 hover:border-primary transition-all text-left shadow-sm group">
            <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-outline group-hover:bg-primary group-hover:text-white transition-colors">
              <item.icon size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base text-on-surface">{item.label}</h4>
              <p className="text-xs text-outline leading-none mt-1">{item.desc}</p>
            </div>
            <ChevronRight className="text-outline" size={20} />
          </button>
        ))}
      </div>
      
      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3 text-rose-700">
          <AlertTriangle size={20} />
          <span className="text-sm font-bold">Deseja sair do sistema?</span>
        </div>
        <button className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase active:scale-95 transition-all">Sair</button>
      </div>
    </div>
  );
}

function EstoqueView({ products, onAddProduct, onDeleteProduct }: { products: Product[], onAddProduct: (p: any) => void, onDeleteProduct: (id: string) => void }) {
  const [filter, setFilter] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newProd, setNewProd] = useState({ name: '', price: '', stock: '', category: 'Geral', sku: '', expiryDate: '' });

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'low') return p.stock <= 5;
    if (filter === 'expiring') {
      if (!p.expiryDate) return false;
      const expiry = new Date(p.expiryDate);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    return true;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    let status: 'normal' | 'low-stock' | 'expiring-soon' = 'normal';
    if (Number(newProd.stock) <= 5) status = 'low-stock';
    
    if (newProd.expiryDate) {
      const expiry = new Date(newProd.expiryDate);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) status = 'expiring-soon';
    }

    onAddProduct({
      ...newProd,
      price: Number(newProd.price),
      stock: Number(newProd.stock),
      sku: newProd.sku || `SKU-${Date.now().toString().slice(-6)}`,
      status
    });
    setIsAdding(false);
    setNewProd({ name: '', price: '', stock: '', category: 'Geral', sku: '', expiryDate: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Estoque</h2>
          <p className="text-outline text-sm">Controle de inventário e validade</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar no estoque..."
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-outline-variant rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary hover:bg-primary-container text-white py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-md active:scale-[0.98] transition-all"
        >
          <PlusCircle size={20} />
          Cadastrar Novo Produto
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6"
            >
              <h3 className="text-xl font-bold">Novo Produto</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-outline">Nome do Produto</label>
                  <input required value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} className="w-full p-3 bg-surface rounded-xl border border-outline-variant outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-outline">Preço (R$)</label>
                    <input required type="number" step="0.01" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} className="w-full p-3 bg-surface rounded-xl border border-outline-variant outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-outline">Qtd. Inicial</label>
                    <input required type="number" value={newProd.stock} onChange={e => setNewProd({...newProd, stock: e.target.value})} className="w-full p-3 bg-surface rounded-xl border border-outline-variant outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-outline">Data de Vencimento (Opcional)</label>
                  <input type="date" value={newProd.expiryDate} onChange={e => setNewProd({...newProd, expiryDate: e.target.value})} className="w-full p-3 bg-surface rounded-xl border border-outline-variant outline-none focus:border-primary" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 font-bold text-outline hover:bg-surface rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 font-bold bg-primary text-white rounded-xl shadow-lg active:scale-95 transition-all">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
        <button 
          onClick={() => setFilter('all')}
          className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            filter === 'all' 
              ? 'bg-primary text-white shadow-lg ring-4 ring-primary/10' 
              : 'bg-surface-container-high text-outline hover:bg-surface-container-highest'
          }`}
        >
          Tudo
        </button>
        <button 
          onClick={() => setFilter('low')}
          className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            filter === 'low' 
              ? 'bg-primary text-white shadow-lg ring-4 ring-primary/10' 
              : 'bg-surface-container-high text-outline hover:bg-surface-container-highest'
          }`}
        >
          Baixo Estoque
        </button>
        <button 
          onClick={() => setFilter('expiring')}
          className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            filter === 'expiring' 
              ? 'bg-primary text-white shadow-lg ring-4 ring-primary/10' 
              : 'bg-surface-container-high text-outline hover:bg-surface-container-highest'
          }`}
        >
          Vencendo Logo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.length > 0 ? filteredProducts.map((p) => {
          const isExpiringSoon = p.expiryDate && (new Date(p.expiryDate).getTime() - new Date().getTime()) <= (30 * 24 * 60 * 60 * 1000);
          
          return (
          <div key={p.id} className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm hover:border-primary transition-all group relative overflow-hidden">
            {(p.stock <= 5 || isExpiringSoon) && (
              <div className="absolute top-0 right-0 p-3 flex gap-2">
                {p.stock <= 5 && (
                  <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-error-container text-error">
                    Estoque Baixo
                  </span>
                )}
                {isExpiringSoon && (
                  <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-container">
                    Vencendo
                  </span>
                )}
              </div>
            )}
            
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0">
                <Package className="text-outline" size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="pr-16">
                  <h3 className="font-bold text-base truncate pr-8">{p.name}</h3>
                  <p className="text-[10px] text-outline font-medium tracking-wider">SKU: {p.sku}</p>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-[9px] text-outline font-bold uppercase tracking-widest leading-none mb-1">Preço</p>
                    <p className="text-xl font-bold text-primary">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-outline font-bold uppercase tracking-widest leading-none mb-1">Qtd.</p>
                    <p className={`text-xl font-extrabold ${p.stock <= 5 ? 'text-error' : 'text-on-surface'}`}>
                      {p.stock.toString().padStart(2, '0')} un.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-surface flex items-center justify-between">
              <div className={`flex items-center gap-1.5 ${isExpiringSoon ? 'text-tertiary' : 'text-outline'}`}>
                <Calendar size={14} />
                <span className="text-[11px] font-semibold">
                  {p.expiryDate ? `Vence: ${new Date(p.expiryDate).toLocaleDateString('pt-BR')}` : 'Sem validade'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onDeleteProduct(p.id)}
                  className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center opacity-30">
             <Package size={48} className="mx-auto mb-2" />
             <p className="font-bold uppercase text-xs">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RelatoriosView({ transactions, products }: { transactions: Transaction[], products: Product[] }) {
  const totalSales = transactions.filter(t => t.type === 'sale').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-outline text-sm">Análise de desempenho e tendências</p>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
        <div className="flex justify-around items-center pt-6 px-2">
          <div className="text-center">
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest mb-1">Faturamento Total</p>
            <p className="text-3xl font-extrabold text-primary">R$ {totalSales.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="w-[1px] h-8 bg-outline-variant"></div>
          <div className="text-center">
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest mb-1">Total de Itens</p>
            <p className="text-3xl font-extrabold text-on-surface">{products.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
