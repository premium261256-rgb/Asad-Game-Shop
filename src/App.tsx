import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft,
  ChevronRight,
  Gamepad2, 
  ShieldCheck, 
  Zap, 
  Search, 
  X, 
  CheckCircle2, 
  ArrowRight,
  Mail,
  Phone,
  User,
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Save,
  LogOut,
  Lock,
  Clock,
  Check,
  AlertCircle,
  ShoppingBag,
  Copy,
  Upload
} from 'lucide-react';
import { GamePackage, OrderDetails, Order, OrderStatus } from './types';

export default function App() {
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    packageId: '',
    playerId: '',
    paymentMethod: 'bKash',
    phoneNumber: '',
    transactionId: '',
  });

  // Admin States
  const [isAdminView, setIsAdminView] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GamePackage>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'products' | 'orders'>('products');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // User Auth States
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [showUserOrders, setShowUserOrders] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchPackages();
    // Check for existing user session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsUserLoggedIn(true);
      fetchUserOrders(user.email);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAllOrders();
    }
  }, [currentUser]);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPackages(data);
      } else {
        console.error('Expected array of products, got:', data);
        setPackages([]);
      }
    } catch (err) {
      console.error('Failed to fetch packages', err);
      setPackages([]);
    }
  };

  const fetchAllOrders = async () => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== 'premium261256@gmail.com')) return;
    try {
      const res = await fetch('/api/orders', {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllOrders(data.sort((a: Order, b: Order) => b.timestamp - a.timestamp));
      } else {
        console.error('Expected array of orders, got:', data);
        setAllOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setAllOrders([]);
    }
  };

  const fetchUserOrders = async (email: string) => {
    try {
      const res = await fetch(`/api/orders/user/${email}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUserOrders(data.sort((a: Order, b: Order) => b.timestamp - a.timestamp));
      } else {
        console.error('Expected array of user orders, got:', data);
        setUserOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch user orders', err);
      setUserOrders([]);
    }
  };

  const handleLogout = () => {
    setIsAdminView(false);
    setShowProfileModal(false);
    handleUserLogout();
  };

  const handleUserAuth = async (e: FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'signup' && (!authForm.name || !authForm.email || !authForm.password)) {
      alert('Please fill in all fields');
      return;
    }
    if (authMode === 'login' && (!authForm.email || !authForm.password)) {
      alert('Please fill in email and password');
      return;
    }

    const endpoint = authMode === 'signup' ? '/api/user/signup' : '/api/user/login';
    const normalizedForm = {
      ...authForm,
      email: authForm.email.toLowerCase().trim()
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedForm),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setIsUserLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(data));
        setShowAuthModal(false);
        fetchUserOrders(data.email);
        setAuthForm({ email: '', password: '', name: '' });
      } else {
        const errorMsg = data.error || 'Authentication failed';
        const detailedMsg = data.message || data.details || '';
        alert(`${errorMsg}${detailedMsg ? ': ' + detailedMsg : ''}`);
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Authentication error: ${errorMessage}. Please check your connection.`);
    }
  };

  const handleUserLogout = () => {
    setIsUserLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.imageUrl) {
        setEditForm(prev => ({ ...prev, image: data.imageUrl }));
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== 'premium261256@gmail.com')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) {
        fetchPackages();
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleSave = async (id: string) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== 'premium261256@gmail.com')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id 
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setIsEditing(null);
        fetchPackages();
      }
    } catch (err) {
      alert('Save failed');
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== 'premium261256@gmail.com')) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id 
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setIsAdding(false);
        setEditForm({});
        fetchPackages();
      }
    } catch (err) {
      alert('Add failed');
    }
  };

  const safePackages = Array.isArray(packages) ? packages : [];
  const games = Array.from(new Set(safePackages.map(p => p.game)));
  
  const filteredPackages = safePackages.filter(p => {
    const matchesGame = selectedGame ? p.game === selectedGame : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.game.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGame && matchesSearch;
  });

  const featuredPackages = safePackages.slice(0, 5);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);

  useEffect(() => {
    if (featuredPackages.length > 0 && !isHoveringSlider) {
      const timer = setInterval(() => {
        setCurrentFeaturedIndex((prev) => (prev + 1) % featuredPackages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [featuredPackages.length, isHoveringSlider]);

  const nextSlide = () => {
    setCurrentFeaturedIndex((prev) => (prev + 1) % featuredPackages.length);
  };

  const prevSlide = () => {
    setCurrentFeaturedIndex((prev) => (prev - 1 + featuredPackages.length) % featuredPackages.length);
  };

  const handleBuyNow = (pkg: GamePackage) => {
    setSelectedPackage(pkg);
    setOrderDetails(prev => ({ ...prev, packageId: pkg.id }));
    setIsCheckingOut(true);
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!isUserLoggedIn) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    const orderData = {
      ...orderDetails,
      userEmail: currentUser?.email,
      userName: currentUser?.name,
      packageName: selectedPackage?.name,
      price: selectedPackage?.price,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        setOrderComplete(true);
        setIsCheckingOut(false);
        fetchUserOrders(currentUser!.email);
      }
    } catch (err) {
      alert('Order failed');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== 'premium261256@gmail.com')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        alert(`Order ${status === 'approved' ? 'Approved' : 'Cancelled'} Successfully!`);
        fetchAllOrders();
      } else {
        const data = await res.json();
        alert(`Update failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 overflow-hidden rounded-xl border border-amber-500/30">
                <img 
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=asad&backgroundColor=FFD700" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">Asad Game Shop</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setIsAdminView(false)}
                className={`text-sm font-medium transition-colors ${!isAdminView ? 'text-white' : 'text-white/70 hover:text-white'}`}
              >
                Home
              </button>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Games</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Support</a>
              
              {isUserLoggedIn ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setShowUserOrders(true);
                      fetchUserOrders(currentUser?.email || '');
                    }}
                    className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                    My Orders
                  </button>
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <User className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">{currentUser?.name}</span>
                  </button>
                  <button 
                    onClick={handleUserLogout}
                    className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Login / Sign Up
                </button>
              )}

              {(currentUser?.role === 'admin' || currentUser?.email === 'premium261256@gmail.com') && (
                <button 
                  onClick={() => setIsAdminView(!isAdminView)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isAdminView ? 'bg-amber-700 text-white' : 'bg-amber-600 text-white hover:bg-amber-500'}`}
                >
                  <Settings className="w-4 h-4" />
                  {isAdminView ? 'Exit Admin' : 'Admin Panel'}
                </button>
              )}
              {!isUserLoggedIn && (
                <button className="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-amber-500 transition-colors">
                  Track Order
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isAdminView ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {(currentUser?.role !== 'admin' && currentUser?.email !== 'premium261256@gmail.com') ? (
            <div className="max-w-md mx-auto bg-[#111] border border-white/10 rounded-[2rem] p-8 text-center">
              <Lock className="w-12 h-12 text-amber-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-6">Admin Access Required</h2>
              <p className="text-white/60 mb-8">You must be logged in with an admin account to access this panel.</p>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-500 transition-all shadow-lg shadow-amber-600/20"
                >
                  Login as Admin
                </button>
                <button 
                  onClick={() => setIsAdminView(false)}
                  className="w-full bg-white/5 text-white/60 py-3 rounded-xl font-bold hover:bg-white/10 transition-all"
                >
                  Go Back Home
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                  <p className="text-white/50 text-sm mt-1">Manage your products and customer orders</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setAdminActiveTab('products')}
                    className={`px-6 py-2.5 rounded-xl font-bold transition-all ${adminActiveTab === 'products' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                  >
                    Products
                  </button>
                  <button 
                    onClick={() => {
                      setAdminActiveTab('orders');
                      fetchAllOrders();
                    }}
                    className={`px-6 py-2.5 rounded-xl font-bold transition-all ${adminActiveTab === 'orders' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                  >
                    Orders
                  </button>
                  <div className="w-px h-10 bg-white/10 mx-2 hidden md:block" />
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-white/5 text-white/60 px-6 py-2.5 rounded-xl font-bold hover:bg-white/10 transition-all"
                  >
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </div>
              </div>

              {adminActiveTab === 'products' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Gamepad2 className="w-6 h-6 text-amber-500" />
                      Product Management
                    </h3>
                    <button 
                      onClick={() => { setIsAdding(true); setEditForm({}); }}
                      className="flex items-center gap-2 bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-amber-500 transition-all shadow-lg shadow-amber-600/20"
                    >
                      <Plus className="w-5 h-5" /> Add New Product
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {packages.map(pkg => (
                      <div key={pkg.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-amber-500/30 transition-all">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                          <img src={pkg.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          {isEditing === pkg.id ? (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Name</label>
                                <input 
                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  value={editForm.name || pkg.name}
                                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Game</label>
                                <input 
                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  value={editForm.game || pkg.game}
                                  onChange={e => setEditForm({...editForm, game: e.target.value as any})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Price</label>
                                <input 
                                  type="number"
                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  value={editForm.price || pkg.price}
                                  onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Image</label>
                                <div className="flex gap-2">
                                  <input 
                                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    placeholder="URL"
                                    value={editForm.image || pkg.image}
                                    onChange={e => setEditForm({...editForm, image: e.target.value})}
                                  />
                                  <label className="cursor-pointer p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center">
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                    />
                                    <Upload className={`w-4 h-4 ${isUploading ? 'animate-pulse text-amber-500' : 'text-white/40'}`} />
                                  </label>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Name</label>
                                <p className="font-bold">{pkg.name}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Game</label>
                                <p className="text-white/60 font-bold">{pkg.game}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Price</label>
                                <p className="font-bold text-amber-400">৳ {pkg.price}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">ID</label>
                                <p className="font-mono text-[10px] text-white/40">{pkg.id}</p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isEditing === pkg.id ? (
                            <button 
                              onClick={() => handleSave(pkg.id)}
                              className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-all"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => { setIsEditing(pkg.id); setEditForm(pkg); }}
                              className="p-3 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-all"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(pkg.id)}
                            className="p-3 bg-amber-600/20 text-amber-500 rounded-xl hover:bg-amber-600 hover:text-white transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-amber-500" />
                        Order Management
                      </h3>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={fetchAllOrders}
                          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/60"
                          title="Refresh Orders"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                        <div className="text-sm text-white/40">
                          Total Orders: {allOrders.length}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input 
                          type="text"
                          placeholder="Search TXID, Email, or Name..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                          value={orderSearchTerm}
                          onChange={(e) => setOrderSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        {(['all', 'pending', 'approved', 'cancelled'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                              statusFilter === status 
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                                : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {allOrders.filter(o => {
                      const matchesSearch = o.transactionId.toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
                        o.userEmail.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                        o.userName.toLowerCase().includes(orderSearchTerm.toLowerCase());
                      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    }).length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">No orders found matching your criteria.</p>
                      </div>
                    ) : (
                      allOrders.filter(o => {
                        const matchesSearch = o.transactionId.toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
                          o.userEmail.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                          o.userName.toLowerCase().includes(orderSearchTerm.toLowerCase());
                        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
                        return matchesSearch && matchesStatus;
                      }).map(order => (
                        <div key={order.id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all">
                          <div className="p-6 flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Customer</label>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold">{order.userName}</p>
                                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                                      {allOrders.filter(o => o.userEmail === order.userEmail).length} Orders
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/40">{order.userEmail}</p>
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Package</label>
                                  <p className="text-amber-500 font-bold">{order.packageName}</p>
                                  <p className="text-xs font-bold">৳{order.price}</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Player ID</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="font-mono bg-white/5 px-2 py-1 rounded text-sm inline-block">{order.playerId}</p>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.playerId);
                                        alert('Player ID Copied!');
                                      }}
                                      className="p-1 hover:bg-white/10 rounded transition-colors"
                                      title="Copy Player ID"
                                    >
                                      <Copy className="w-3 h-3 text-white/40" />
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Payment</label>
                                  <p className="text-sm">{order.paymentMethod} - {order.phoneNumber}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs font-mono text-amber-500">TXID: {order.transactionId}</p>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.transactionId);
                                        alert('TXID Copied!');
                                      }}
                                      className="p-1 hover:bg-white/10 rounded transition-colors"
                                      title="Copy TXID"
                                    >
                                      <Copy className="w-3 h-3 text-white/40" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Date & Time</label>
                                  <p className="text-sm">{new Date(order.timestamp).toLocaleString()}</p>
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Status</label>
                                  <div className="mt-1">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      order.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                      order.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex lg:flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-6">
                              {order.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'approved')}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-500 transition-all"
                                  >
                                    <Check className="w-4 h-4" /> Approve
                                  </button>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-500 transition-all"
                                  >
                                    <X className="w-4 h-4" /> Cancel
                                  </button>
                                </>
                              )}
                              {order.status !== 'pending' && (
                                <div className="text-white/30 text-xs italic text-center py-4">
                                  Order processed
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {isAdding && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
                  <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2rem] p-8">
                    <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          required
                          className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          placeholder="Product Name"
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                        />
                        <input 
                          required
                          className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          placeholder="Game Name"
                          onChange={e => setEditForm({...editForm, game: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          required
                          type="number"
                          className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          placeholder="Price"
                          onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                        />
                        <input 
                          required
                          className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          placeholder="Amount (e.g. 100 UC)"
                          onChange={e => setEditForm({...editForm, amount: e.target.value})}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input 
                          required
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          placeholder="Image URL"
                          value={editForm.image || ''}
                          onChange={e => setEditForm({...editForm, image: e.target.value})}
                        />
                        <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                          />
                          <Upload className={`w-5 h-5 ${isUploading ? 'animate-pulse text-amber-500' : 'text-white/40'}`} />
                        </label>
                      </div>
                      <div className="flex gap-4 mt-6">
                        <button type="submit" className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-500 transition-all">
                          Add Product
                        </button>
                        <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-white/5 text-white/60 py-3 rounded-xl font-bold hover:bg-white/10 transition-all">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Hero Section */}
      <header className="relative py-12 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-600/10 via-yellow-600/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5 text-left"
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                আপনার গেমিং কারেন্সি টপ-আপ করুন
              </h1>
              <p className="text-lg md:text-xl text-white/60 mb-10">
                নিরাপদ এবং দ্রুত ডেলিভারি। আমরা ফ্রি ফায়ার, পাবজি এবং আরও অনেক গেমের জন্য টপ-আপ প্রদান করি।
              </p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-medium">100% Secure</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Instant Delivery</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Search for games or packages..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            {/* Featured Slider */}
            <div className="lg:col-span-4">
              {featuredPackages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                  onMouseEnter={() => setIsHoveringSlider(true)}
                  onMouseLeave={() => setIsHoveringSlider(false)}
                >
                  <div className="relative aspect-[16/9] lg:aspect-[4/3] rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl shadow-amber-500/5">
                    <AnimatePresence mode="wait">
                      {featuredPackages[currentFeaturedIndex] && (
                        <motion.div
                          key={featuredPackages[currentFeaturedIndex].id}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute inset-0"
                        >
                          <img 
                            src={featuredPackages[currentFeaturedIndex].image} 
                            alt="" 
                            className="w-full h-full object-cover opacity-70"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                          <div className="absolute bottom-6 left-6 right-6 lg:bottom-8 lg:left-8 lg:right-8">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                              <span className="bg-amber-600 text-white text-[9px] lg:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Latest</span>
                              <span className="text-white/80 text-[10px] lg:text-xs font-bold">{featuredPackages[currentFeaturedIndex].game}</span>
                            </div>
                            <h3 className="text-xl lg:text-3xl font-bold mb-2 lg:mb-3 line-clamp-1">{featuredPackages[currentFeaturedIndex].name}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xl lg:text-2xl font-bold text-amber-400">৳ {featuredPackages[currentFeaturedIndex].price}</span>
                              <button 
                                onClick={() => handleBuyNow(featuredPackages[currentFeaturedIndex])}
                                className="bg-white text-black px-4 py-1.5 lg:px-6 lg:py-2 rounded-xl text-xs lg:text-sm font-bold hover:bg-amber-600 hover:text-white transition-all active:scale-95"
                              >
                                Grab Now
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
     
                    {/* Navigation Arrows */}
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
                      <button 
                        onClick={prevSlide}
                        className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white pointer-events-auto hover:bg-amber-600 transition-all active:scale-90"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={nextSlide}
                        className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white pointer-events-auto hover:bg-amber-600 transition-all active:scale-90"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {featuredPackages.map((_, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setCurrentFeaturedIndex(idx)}
                          className={`h-1 rounded-full transition-all duration-500 ${idx === currentFeaturedIndex ? 'w-8 bg-amber-600' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-600/20 blur-3xl rounded-full hidden lg:block" />
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-amber-600/10 blur-3xl rounded-full hidden lg:block" />
                </motion.div>
              )}
            </div>

            {/* Quick Auth Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 shadow-2xl shadow-amber-500/5">
                {isUserLoggedIn ? (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <User className="w-8 h-8 text-amber-500" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold">{currentUser?.name}</h3>
                        <p className="text-white/40 text-xs">{currentUser?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        onClick={() => {
                          setShowUserOrders(true);
                          fetchUserOrders(currentUser?.email || '');
                        }}
                        className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                        আমার অর্ডারসমূহ
                      </button>
                      <button 
                        onClick={() => setShowProfileModal(true)}
                        className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <User className="w-4 h-4 text-amber-500" />
                        প্রোফাইল দেখুন
                      </button>
                      {(currentUser?.role === 'admin' || currentUser?.email === 'premium261256@gmail.com') && (
                        <button 
                          onClick={() => setIsAdminView(!isAdminView)}
                          className="w-full py-2.5 rounded-xl bg-amber-600/20 border border-amber-600/30 hover:bg-amber-600 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          {isAdminView ? 'Exit Admin' : 'Admin Panel'}
                        </button>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="w-full py-2.5 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        লগআউট
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-1">স্বাগতম!</h3>
                      <p className="text-white/40 text-xs">অর্ডার ট্র্যাক করতে লগইন করুন</p>
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          setAuthMode('login');
                          setShowAuthModal(true);
                        }}
                        className="w-full py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-500 transition-all text-sm shadow-lg shadow-amber-600/20"
                      >
                        লগইন করুন
                      </button>
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">অথবা</span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                      <button 
                        onClick={() => {
                          setAuthMode('signup');
                          setShowAuthModal(true);
                        }}
                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all text-sm"
                      >
                        নতুন অ্যাকাউন্ট খুলুন
                      </button>
                    </div>
                    <p className="text-[10px] text-center text-white/30 leading-relaxed">
                      এগিয়ে যাওয়ার মাধ্যমে আপনি আমাদের শর্তাবলী এবং গোপনীয়তা নীতিতে সম্মত হচ্ছেন।
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          <button 
            onClick={() => setSelectedGame(null)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!selectedGame ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            All Games
          </button>
          {games.map(game => (
            <button 
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGame === game ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
            >
              {game}
            </button>
          ))}
        </div>
 
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <ArrowRight className="w-6 h-6 text-amber-500" />
          প্যাকেজ নির্বাচন করুন
        </h2>
 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPackages.map((pkg) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={pkg.id}
                className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-500/10"
              >
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={pkg.image} 
                    alt={pkg.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                    {pkg.game}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
                  <p className="text-white/40 text-sm mb-4">Instant Top-up</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-amber-400">৳ {pkg.price}</span>
                    <button 
                      onClick={() => handleBuyNow(pkg)}
                      className="bg-white text-black px-6 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 hover:text-white transition-all active:scale-95"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredPackages.length === 0 && (
          <div className="text-center py-24">
            <p className="text-white/40">No packages found matching your criteria.</p>
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckingOut && selectedPackage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckingOut(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Checkout</h2>
                  <button 
                    onClick={() => setIsCheckingOut(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 mb-8 flex items-center gap-4 border border-white/5">
                  <img src={selectedPackage.image} alt="" className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-sm text-white/40">{selectedPackage.game}</p>
                    <p className="font-bold">{selectedPackage.name}</p>
                    <p className="text-amber-400 font-bold">৳ {selectedPackage.price}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                      <User className="w-4 h-4" /> Player ID / UID
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter your Game ID"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      value={orderDetails.playerId}
                      onChange={(e) => setOrderDetails({ ...orderDetails, playerId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['bKash', 'Nagad', 'Rocket'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setOrderDetails({ ...orderDetails, paymentMethod: method as any })}
                          className={`py-3 rounded-xl text-xs font-bold border transition-all ${orderDetails.paymentMethod === method ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">Send Money to this Number</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-mono font-bold text-white">01645552740</span>
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText('01645552740')}
                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        title="Copy Number"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </button>
                    </div>
                    <p className="text-[10px] text-white/40 mt-2 italic">Please send the exact amount before confirming</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Your Number
                      </label>
                      <input 
                        required
                        type="tel" 
                        placeholder="017XXXXXXXX"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        value={orderDetails.phoneNumber}
                        onChange={(e) => setOrderDetails({ ...orderDetails, phoneNumber: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Transaction ID
                      </label>
                      <input 
                        required
                        type="text" 
                        placeholder="TrxID..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        value={orderDetails.transactionId}
                        onChange={(e) => setOrderDetails({ ...orderDetails, transactionId: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-500 transition-all active:scale-[0.98] mt-4"
                  >
                    Confirm Order
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {orderComplete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-sm bg-[#111] border border-amber-500/30 rounded-[2.5rem] p-10 text-center shadow-2xl shadow-amber-500/20"
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Order Placed!</h2>
              <p className="text-white/60 mb-8">
                আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। ৫-১০ মিনিটের মধ্যে আপনার অ্যাকাউন্টে কারেন্সি পৌঁছে যাবে।
              </p>
              <button 
                onClick={() => setOrderComplete(false)}
                className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold hover:bg-amber-500 transition-all"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        </>
      )}

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-8 h-8 overflow-hidden rounded-lg border border-amber-500/30">
                  <img 
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=asad&backgroundColor=FFD700" 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">Asad Game Shop</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                বাংলাদেশের সবচেয়ে নির্ভরযোগ্য গেমিং টপ-আপ শপ। আমরা দ্রুত এবং নিরাপদ ডেলিভারি নিশ্চিত করি।
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-sm text-white/40">
                <li><a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Refund Policy</a></li>
                <li>
                  <button 
                    onClick={() => setIsAdminView(true)}
                    className="hover:text-amber-400 transition-colors opacity-20 hover:opacity-100"
                  >
                    Admin Login
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Contact Us</h4>
              <ul className="space-y-4 text-sm text-white/40">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 01645552740</li>
                <li>Support available 24/7</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 text-center text-white/20 text-xs">
            © 2026 Asad Game Shop. All rights reserved.
          </div>
        </div>
      </footer>
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] p-8 overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 blur-3xl -ml-16 -mb-16" />

              <div className="flex justify-between items-center mb-8 relative">
                <div>
                  <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                  <p className="text-white/50 text-sm mt-1">
                    {authMode === 'login' ? 'Login to manage your orders' : 'Join us for a better experience'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUserAuth} className="space-y-4 relative">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-4 rounded-2xl font-bold hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg shadow-amber-600/20 mt-4"
                >
                  {authMode === 'login' ? 'Login' : 'Sign Up'}
                </button>

                <div className="text-center mt-6">
                  <p className="text-white/50 text-sm">
                    {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    <button 
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="ml-2 text-amber-500 font-semibold hover:underline"
                    >
                      {authMode === 'login' ? 'Sign Up' : 'Login'}
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6 text-amber-500" />
                Customer Profile
              </h2>
              <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                  <User className="w-12 h-12 text-amber-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{currentUser?.name}</h3>
                  <p className="text-white/40 text-sm">{currentUser?.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium">Total Orders</span>
                  </div>
                  <span className="font-bold">{userOrders.length}</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium">Member Since</span>
                  </div>
                  <span className="text-sm text-white/60">March 2026</span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full bg-red-600/10 text-red-500 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout from Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Orders Modal */}
      {showUserOrders && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUserOrders(false)} />
          <div className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2rem] p-8 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-amber-500" />
                My Orders
              </h2>
              <button onClick={() => setShowUserOrders(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40">You haven't placed any orders yet.</p>
                </div>
              ) : (
                userOrders.map(order => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-bold text-amber-500">{order.packageName}</p>
                      <p className="text-xs text-white/40">{new Date(order.timestamp).toLocaleString()}</p>
                      <div className="mt-2 flex gap-4 text-[10px] uppercase tracking-wider font-bold">
                        <span className="text-white/40">TXID: <span className="text-white/60">{order.transactionId}</span></span>
                        <span className="text-white/40">Price: <span className="text-white/60">৳{order.price}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                        order.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
