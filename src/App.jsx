import { useState, useEffect } from 'react';
import { Calculator, Home, PlusCircle, Edit2, Trash2, ShoppingCart, Upload, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from './supabase';

const db = {
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id');

    if (error) throw error;
    return data;
  },

  async addProduct(product) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();

    if (error) throw error;
    return data[0];
  },

  async updateProduct(product) {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: product.name,
        cost: product.cost,
        image: product.image
      })
      .eq('id', product.id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};







// Main App Component
export default function App() {
  const [page, setPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', cost: '', image: '/api/placeholder/200/200' });
  const [loading, setLoading] = useState(false);
  const [pageHistory, setPageHistory] = useState(['home']);
  const [dbInitialized, setDbInitialized] = useState(true);
  
  

  // Reload products when the database is initialized
  useEffect(() => {
    if (dbInitialized) {
      const loadProducts = async () => {
        try {
          const loadedProducts = await db.getProducts();
          setProducts(loadedProducts);
        } catch (error) {
          console.error('Error loading products:', error);
        }
      };
      
      loadProducts();
    }
  }, [dbInitialized]);
  
  const goToPage = (pageName) => {
    if (pageName === 'back') {
      const newHistory = [...pageHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1] || 'home';
      setPageHistory(newHistory);
      setPage(previousPage);
    } else {
      setPageHistory([...pageHistory, pageName]);
      setPage(pageName);
    }
  };
  
  const addProductToCart = (product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };
  
  const updateCartItemQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      ));
    }
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.cost * item.quantity), 0);
  };
  
  const saveProduct = async () => {
    try {
      if (editingProduct) {
        await db.updateProduct(editingProduct);
        const updatedProducts = await db.getProducts();
        setProducts(updatedProducts);
        setEditingProduct(null);
      } else if (newProduct.name && newProduct.cost) {
        await db.addProduct({
          ...newProduct,
          cost: Number(newProduct.cost)
        });
        const updatedProducts = await db.getProducts();
        setProducts(updatedProducts);
        setNewProduct({ name: '', cost: '', image: '/api/placeholder/200/200' });
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };
  
  const deleteProduct = async (id) => {
    try {
      await db.deleteProduct(id);
      const updatedProducts = await db.getProducts();
      setProducts(updatedProducts);
      setCart(cart.filter(item => item.product.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };
  
  // Handle image upload
  const handleImageUpload = (e, forProduct) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target.result;
        if (forProduct === 'new') {
          setNewProduct({ ...newProduct, image: imageDataUrl });
        } else {
          setEditingProduct({ ...editingProduct, image: imageDataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Format number with Uzbek currency formatting
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Logo and Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-center">
          <div className="mr-3 text-3xl font-bold">🪑</div>
          <h1 className="text-2xl font-bold">Odil Usta</h1>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-grow p-4">
        {page === 'home' && (
          <HomePage goToPage={goToPage} />
        )}
        
        {page === 'hisoblash' && (
          <HisoblashPage 
            products={products} 
            cart={cart} 
            addProductToCart={addProductToCart}
            updateCartItemQuantity={updateCartItemQuantity}
            calculateTotal={calculateTotal}
            formatCurrency={formatCurrency}
            goToPage={goToPage}
          />
        )}
        
        {page === 'tanlanganlar' && (
          <TanlanganlarPage 
            cart={cart} 
            updateCartItemQuantity={updateCartItemQuantity}
            calculateTotal={calculateTotal}
            formatCurrency={formatCurrency}
            goToPage={goToPage}
          />
        )}
        
        {page === 'mahsulotlar' && (
          <MahsulotlarPage 
            products={products} 
            deleteProduct={deleteProduct}
            setEditingProduct={setEditingProduct}
            editingProduct={editingProduct}
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            saveProduct={saveProduct}
            formatCurrency={formatCurrency}
            handleImageUpload={handleImageUpload}
            goToPage={goToPage}
          />
        )}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="bg-white shadow-inner border-t border-gray-200">
        <div className="flex justify-around p-4">
          <button 
            onClick={() => goToPage('home')}
            className={`flex flex-col items-center ${page === 'home' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Bosh sahifa</span>
          </button>
          <button 
            onClick={() => goToPage('hisoblash')}
            className={`flex flex-col items-center ${page === 'hisoblash' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Calculator size={24} />
            <span className="text-xs mt-1">Hisoblash</span>
          </button>
          <button 
            onClick={() => goToPage('mahsulotlar')}
            className={`flex flex-col items-center ${page === 'mahsulotlar' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <ShoppingCart size={24} />
            <span className="text-xs mt-1">Mahsulotlar</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// Home Page Component
function HomePage({ goToPage }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8">
      <div className="w-32 h-32 bg-blue-600 text-white rounded-full flex items-center justify-center mb-4">
        <div className="text-5xl">🪑</div>
      </div>
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Odil Usta</h2>
        <p className="text-gray-600">Mebel mahsulotlarini hisoblab chiqarish tizimi</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 w-full max-w-md">
        <button 
          onClick={() => goToPage('hisoblash')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-md flex items-center justify-center space-x-4 transition"
        >
          <Calculator size={32} />
          <span className="text-xl font-semibold">Hisoblash</span>
        </button>
        
        <button 
          onClick={() => goToPage('mahsulotlar')}
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-md flex items-center justify-center space-x-4 transition"
        >
          <ShoppingCart size={32} />
          <span className="text-xl font-semibold">Mahsulotlar</span>
        </button>
      </div>
    </div>
  );
}

// Hisoblash Page Component
function HisoblashPage({ products, cart, addProductToCart, calculateTotal, formatCurrency, goToPage }) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center mb-2">
        <h2 className="text-xl font-bold text-gray-800">Mahsulotlar tanlash</h2>
      </div>
      
      {/* Products list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="flex">
              <img 
                src={product.image} 
                alt={product.name} 
                className="h-24 w-24 object-cover"
              />
              <div className="p-3 flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-blue-600 font-medium">{formatCurrency(product.cost)}</p>
                </div>
                <button 
                  onClick={() => addProductToCart(product)}
                  className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200 mt-2 self-end"
                >
                  Tanlash
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Cart summary and button */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white shadow-md border-t border-gray-200">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between items-center">
              <span className="font-medium">Tanlangan: {cart.reduce((sum, item) => sum + item.quantity, 0)} ta mahsulot</span>
              <span className="font-semibold text-blue-600">{formatCurrency(calculateTotal())}</span>
            </div>
            <button 
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md w-full mt-3"
              onClick={() => goToPage('tanlanganlar')}
            >
              Hisobla
            </button>
          </div>
        </div>
      )}
      
      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p>Hozircha mahsulotlar mavjud emas</p>
        </div>
      )}
    </div>
  );
}

// Tanlanganlar Page Component
function TanlanganlarPage({ cart, updateCartItemQuantity, calculateTotal, formatCurrency, goToPage }) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center mb-2">
        <button 
          onClick={() => goToPage('back')}
          className="mr-3 p-1 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Tanlangan mahsulotlar</h2>
      </div>
      
      {cart.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {cart.map(item => (
            <div key={item.product.id} className="border-b border-gray-200 last:border-0 p-4 flex items-center">
              <img 
                src={item.product.image} 
                alt={item.product.name} 
                className="h-16 w-16 object-cover rounded mr-4"
              />
              <div className="flex-grow">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-blue-600">{formatCurrency(item.product.cost)}</p>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                  className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                >
                  -
                </button>
                <span className="mx-3 w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                  className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          
          <div className="bg-gray-50 p-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Umumiy narx:</span>
              <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p>Hozircha mahsulotlar tanlanmagan</p>
          <button 
            onClick={() => goToPage('hisoblash')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Mahsulot tanlash
          </button>
        </div>
      )}
      
      {cart.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <button 
            className="bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg"
            onClick={() => goToPage('hisoblash')}
          >
            Orqaga
          </button>
          <button 
            className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg"
            onClick={() => {
              alert(`Umumiy summa: ${formatCurrency(calculateTotal())}\nBuyurtma muvaffaqiyatli qabul qilindi!`);
              goToPage('home');
            }}
          >
            Buyurtma berish
          </button>
        </div>
      )}
    </div>
  );
}

// Mahsulotlar Page Component
function MahsulotlarPage({ 
  products, 
  deleteProduct, 
  setEditingProduct, 
  editingProduct,
  newProduct,
  setNewProduct,
  saveProduct,
  formatCurrency,
  handleImageUpload,
  goToPage
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Mahsulotlar ro'yxati</h2>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setShowAddForm(!showAddForm);
          }}
          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center"
        >
          <PlusCircle size={20} className="mr-1" />
          <span>Qo'shish</span>
        </button>
      </div>
      
      {/* Add/Edit Product Form */}
      {(showAddForm || editingProduct) && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h3 className="font-semibold mb-4">{editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
              <input 
                type="text" 
                value={editingProduct ? editingProduct.name : newProduct.name}
                onChange={(e) => editingProduct 
                  ? setEditingProduct({...editingProduct, name: e.target.value})
                  : setNewProduct({...newProduct, name: e.target.value})
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Mahsulot nomi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Narxi (so'm)</label>
              <input 
                type="number" 
                value={editingProduct ? editingProduct.cost : newProduct.cost}
                onChange={(e) => editingProduct 
                  ? setEditingProduct({...editingProduct, cost: Number(e.target.value)})
                  : setNewProduct({...newProduct, cost: e.target.value})
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Mahsulot narxi"
              />
            </div>
            
            {/* Image upload section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rasm</label>
              <div className="flex items-center space-x-4">
                <img 
                  src={editingProduct ? editingProduct.image : newProduct.image} 
                  alt="Product preview" 
                  className="h-20 w-20 object-cover border rounded-md"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md border border-gray-300 flex items-center">
                  <Upload size={18} className="mr-2" />
                  <span>Rasm yuklash</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, editingProduct ? 'edit' : 'new')}
                  />
                </label>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  saveProduct();
                  setShowAddForm(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Saqlash
              </button>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setShowAddForm(false);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rasm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nomi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Narxi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="h-12 w-12 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-blue-600">{formatCurrency(product.cost)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setShowAddForm(true);
                        setEditingProduct(product);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {products.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  Mahsulotlar ro'yxati bo'sh
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
