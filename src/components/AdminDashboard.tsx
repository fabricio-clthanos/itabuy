import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Package, Ticket, LogOut, ClipboardList, Bell, X, Edit2, Trash2, Plus } from 'lucide-react';
import { Product } from '../types';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'products' | 'coupons' | 'pedidos'>('products');

  return (
    <div className="flex h-screen w-screen bg-white text-gray-900">
      <aside className="w-72 bg-gray-50 border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-8"><h2 className="text-2xl font-bold text-gray-950 tracking-tight">Admin Portal</h2></div>
        <nav className="flex-1 px-6 space-y-1">
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-4 w-full p-4 rounded-xl text-lg font-medium transition ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}><Package size={24} /> Produtos</button>
          <button onClick={() => setActiveTab('pedidos')} className={`flex items-center gap-4 w-full p-4 rounded-xl text-lg font-medium transition ${activeTab === 'pedidos' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}><ClipboardList size={24} /> Pedidos</button>
          <button onClick={() => setActiveTab('coupons')} className={`flex items-center gap-4 w-full p-4 rounded-xl text-lg font-medium transition ${activeTab === 'coupons' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}><Ticket size={24} /> Cupons</button>
        </nav>
        <div className="p-6">
          <button onClick={onLogout} className="flex items-center gap-4 w-full p-4 rounded-xl text-red-600 hover:bg-red-50 transition"><LogOut size={24} /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 p-16 overflow-y-auto bg-white">
        <div className="max-w-6xl">
          <h2 className="text-4xl font-extrabold text-gray-950 mb-12 capitalize">{activeTab}</h2>
          {activeTab === 'products' && <ProductsAdminTab />}
          {activeTab === 'pedidos' && <PedidosAdminTab />}
        </div>
      </main>
    </div>
  );
}

function ProductsAdminTab() {
  const [subTab, setSubTab] = useState<'list' | 'add'>('list');
  return (
    <div className="space-y-8">
      <div className="flex gap-8 border-b border-gray-100">
        <button onClick={() => setSubTab('list')} className={`pb-4 text-lg transition ${subTab === 'list' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>Listar Produtos</button>
        <button onClick={() => setSubTab('add')} className={`pb-4 text-lg transition ${subTab === 'add' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>Adicionar Produto</button>
      </div>
      {subTab === 'list' ? <ProductList /> : <ProductAddForm />}
    </div>
  );
}

function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'products'));
        const unsubscribe = onSnapshot(q, (snap) => {
            setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (productId: string) => {
        try {
            await deleteDoc(doc(db, 'products', productId));
            alert('Produto excluído com sucesso!');
            setShowDeleteConfirm(null);
        } catch (err) {
            alert('Erro ao excluir: ' + err);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(p => (
                    <div key={p.id} className="group p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-indigo-500 hover:shadow-xl transition-all relative overflow-hidden" onClick={() => setSelectedProduct(p)}>
                        <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gray-50 border border-gray-50">
                            <img src={p.images?.[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={p.name} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-indigo-600 font-black">R$ {(p.price || 0).toFixed(2)}</span>
                                <span className="text-gray-400 text-xs">{p.salesCount} vendidos</span>
                            </div>
                        </div>
                        
                        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(p.id); }} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg text-red-600 hover:bg-red-600 hover:text-white transition">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[200]">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-center text-gray-950 mb-2">Excluir Produto?</h3>
                        <p className="text-center text-gray-500 mb-8">Esta ação não pode ser desfeita. O produto será removido permanentemente.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Cancelar</button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition">Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedProduct && <ProductDetailPopup product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
        </>
    )
}

function ProductDetailPopup({ product, onClose }: { product: Product, onClose: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProduct, setEditedProduct] = useState<Product>({...product});
    const [useOptions, setUseOptions] = useState(!!product.availableOptions && product.availableOptions.length > 0);
    const [options, setOptions] = useState<{name: string, values: {label: string, stock: number}[]}[]>(
        product.availableOptions ? product.availableOptions.map(opt => ({ 
            name: opt.name, 
            values: opt.values.map(v => ({ label: v.label, stock: v.stock ?? 10 })) 
        })) : []
    );

    const handleSave = async () => {
        try {
            const { id, ...data } = editedProduct;
            
            const optionsList = useOptions ? options.filter(o => o.name.trim()).map(o => ({
                name: o.name.trim(),
                values: o.values.filter(v => v.label.trim() !== '').map(v => ({
                    label: v.label.trim(),
                    stock: Number(v.stock)
                }))
            })) : [];

            await updateDoc(doc(db, 'products', id), {
                ...data,
                availableOptions: optionsList,
                images: editedProduct.images?.filter(img => img.trim() !== '')
            });
            alert('Produto atualizado com sucesso!');
            setIsEditing(false);
            onClose();
        } catch (err) {
            alert('Erro ao atualizar: ' + err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
            <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-950">{isEditing ? 'Editar Produto' : product.name}</h2>
                        <p className="text-xs text-gray-400 font-mono tracking-widest mt-1 uppercase">ID: {product.id}</p>
                    </div>
                    <div className="flex gap-3">
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition">
                                <Edit2 size={18} /> Editar dados
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-950 transition"><X size={28} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10">
                    {isEditing ? (
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <section>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Informações Básicas</label>
                                    <div className="space-y-4">
                                        <input type="text" placeholder="Nome do Produto" value={editedProduct.name || ''} onChange={e => setEditedProduct({...editedProduct, name: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl text-lg focus:ring-2 ring-indigo-500 outline-none" />
                                        <textarea placeholder="Descrição" value={editedProduct.description || ''} onChange={e => setEditedProduct({...editedProduct, description: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl text-lg focus:ring-2 ring-indigo-500 outline-none" rows={6} />
                                    </div>
                                </section>

                                <section>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Imagens (URLs)</label>
                                    <div className="space-y-2">
                                        {(editedProduct.images || ['']).map((img, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input type="text" placeholder={`URL ${i + 1}`} value={img || ''} onChange={e => {
                                                    const ni = [...(editedProduct.images || [''])];
                                                    ni[i] = e.target.value;
                                                    setEditedProduct({...editedProduct, images: ni});
                                                }} className="flex-1 p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 ring-indigo-500 outline-none" />
                                                <button onClick={() => setEditedProduct({...editedProduct, images: (editedProduct.images || []).filter((_, idx) => idx !== i)})} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => setEditedProduct({...editedProduct, images: [...(editedProduct.images || []), '']})} className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition">
                                            <Plus size={16} /> Adicionar mais 1
                                        </button>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-8">
                                <section className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Package size={18} className="text-indigo-600" />
                                            <label className="text-sm font-black text-gray-900">Especificar Opções (Cores, Tamanhos)</label>
                                        </div>
                                        <button onClick={() => setUseOptions(!useOptions)} className={`w-12 h-6 rounded-full relative transition-colors ${useOptions ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useOptions ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    {useOptions && (
                                        <div className="space-y-6">
                                            {options.map((opt, i) => (
                                                <div key={i} className="space-y-3 p-4 bg-white border border-gray-100 rounded-xl">
                                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                                        <input type="text" placeholder="Nome (Ex: Cor)" value={opt.name || ''} onChange={e => { const ns = [...options]; ns[i].name = e.target.value; setOptions(ns); }} className="font-bold text-sm border-none bg-transparent focus:ring-0 w-1/2 p-0" />
                                                        <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        {opt.values.map((v, valIdx) => (
                                                            <div key={valIdx} className="flex gap-2 items-center">
                                                                <input type="text" placeholder="Valor" value={v.label || ''} onChange={e => {
                                                                    const ns = [...options];
                                                                    ns[i].values[valIdx].label = e.target.value;
                                                                    setOptions(ns);
                                                                }} className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" />
                                                                <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Estoque:</span>
                                                                    <input type="number" value={v.stock ?? 0} onChange={e => {
                                                                        const ns = [...options];
                                                                        ns[i].values[valIdx].stock = Number(e.target.value);
                                                                        setOptions(ns);
                                                                    }} className="w-12 p-1 bg-transparent border-none text-xs focus:ring-0 font-bold" />
                                                                </div>
                                                                <button onClick={() => {
                                                                    const ns = [...options];
                                                                    ns[i].values = ns[i].values.filter((_, idx) => idx !== valIdx);
                                                                    setOptions(ns);
                                                                }} className="text-gray-300 hover:text-red-500 transition"><X size={14} /></button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => {
                                                            const ns = [...options];
                                                            ns[i].values.push({ label: '', stock: 10 });
                                                            setOptions(ns);
                                                        }} className="text-[10px] font-bold text-indigo-500 hover:underline">+ Adicionar valor</button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => setOptions([...options, { name: '', values: [{ label: '', stock: 10 }] }])} className="text-xs font-bold text-indigo-600 hover:underline">+ Adicionar tipo de opção</button>
                                        </div>
                                    )}
                                    {!useOptions && <p className="text-xs text-gray-400 text-center py-2 italic font-medium">As opções de escolha (cores, tamanhos) estão desligadas.</p>}
                                </section>

                                <section>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Preços e Estoque</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 ml-1">Preço Original</span>
                                            <input type="number" value={editedProduct.originalPrice ?? 0} onChange={e => setEditedProduct({...editedProduct, originalPrice: Number(e.target.value)})} className="w-full p-4 border border-gray-200 rounded-xl" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 ml-1">Preço Atual</span>
                                            <input type="number" value={editedProduct.price ?? 0} onChange={e => setEditedProduct({...editedProduct, price: Number(e.target.value)})} className="w-full p-4 border border-gray-200 rounded-xl" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-indigo-400 ml-1">Preço Pix</span>
                                            <input type="number" value={editedProduct.pixPrice ?? 0} onChange={e => setEditedProduct({...editedProduct, pixPrice: Number(e.target.value)})} className="w-full p-4 border border-gray-200 rounded-xl text-indigo-600 font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 ml-1">Estoque</span>
                                            <input type="number" value={editedProduct.stock ?? 0} onChange={e => setEditedProduct({...editedProduct, stock: Number(e.target.value)})} className="w-full p-4 border border-gray-200 rounded-xl" />
                                        </div>
                                    </div>
                                </section>

                                <button onClick={handleSave} className="w-full p-5 bg-indigo-600 text-white font-black text-xl rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100">Salvar Alterações</button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-12">
                            <div className="col-span-2 space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    {(product.images || []).map((img, i) => (
                                        <img key={i} src={img} className="rounded-2xl border border-gray-100 aspect-square object-cover" alt="" />
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-3 space-y-8">
                                <section>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Descrição</label>
                                    <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">{product.description}</p>
                                </section>

                                <div className="grid grid-cols-2 gap-8">
                                    <section className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">Finanças</label>
                                        <div className="space-y-2">
                                            {product.originalPrice && <p className="text-xs text-gray-400 line-through">De: R$ {product.originalPrice.toFixed(2)}</p>}
                                            <p className="text-sm text-gray-500">Por: <span className="font-bold text-gray-900">R$ {(product.price || 0).toFixed(2)}</span></p>
                                            <p className="text-sm text-indigo-500">Pix: <span className="font-black text-indigo-600 text-xl">R$ {(product.pixPrice || 0).toFixed(2)}</span></p>
                                        </div>
                                    </section>
                                    <section className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">Estoque</label>
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-500">Total Vendidos: <span className="font-bold text-green-600">{product.salesCount}</span></p>
                                            <p className="text-sm text-gray-500">Em Estoque: <span className="font-bold text-gray-900">{product.stock}</span></p>
                                        </div>
                                    </section>
                                </div>

                                {product.availableOptions && product.availableOptions.length > 0 && (
                                    <section className="bg-indigo-50/30 p-8 rounded-3xl border border-indigo-100/50">
                                        <label className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 block">Opções Disponíveis (Escolha do Usuário)</label>
                                        <div className="grid grid-cols-2 gap-6">
                                            {product.availableOptions.map((opt, i) => (
                                                <div key={i}>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{opt.name}</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {opt.values.map((v, vIdx) => (
                                                            <span key={vIdx} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                                                {v.label} ({v.stock} un)
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ProductAddForm() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [salesCount, setSalesCount] = useState(0);
    const [useOptions, setUseOptions] = useState(false);
    const [options, setOptions] = useState<{name: string, values: {label: string, stock: number}[]}[]>([]);
    const [price, setPrice] = useState(0);
    const [pixPrice, setPixPrice] = useState(0);
    const [originalPrice, setOriginalPrice] = useState(0);
    const [images, setImages] = useState<string[]>(['']);

    const handleAddProduct = async () => {
        try {
            const optionsList = useOptions ? options.filter(o => o.name.trim()).map(o => ({
                name: o.name.trim(),
                values: o.values.filter(v => v.label.trim() !== '').map(v => ({
                    label: v.label.trim(),
                    stock: Number(v.stock)
                }))
            })) : [];

            await addDoc(collection(db, 'products'), {
                name,
                description,
                salesCount,
                availableOptions: optionsList,
                price,
                pixPrice,
                originalPrice: originalPrice > 0 ? originalPrice : null,
                stock: 10,
                rating: 5,
                images: images.filter(img => img.trim() !== ''),
                category: 'Geral', // Default category
                location: 'Manaus, AM', // Default location
                storeName: 'ItaBuy Store',
                storeRating: 4.9,
                storeProductsCount: 150,
                freeShipping: true,
                specs: {} // Empty specs for now as we use availableOptions
            });
            alert('Produto adicionado com sucesso!');
            setName(''); setDescription(''); setSalesCount(0); setOptions([]); setPrice(0); setPixPrice(0); setOriginalPrice(0); setImages(['']);
        } catch (e) { alert('Erro ao adicionar produto: ' + e); }
    };

    return (
        <div className="bg-gray-50 p-12 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                    <section>
                        <h3 className="text-xl font-black text-gray-950 mb-6 flex items-center gap-2">
                           <div className="w-2 h-6 bg-indigo-600 rounded-full" /> Dados do Produto
                        </h3>
                        <div className="space-y-5">
                            <div className="group">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-4 mb-1 block">Nome Comercial</label>
                                <input type="text" placeholder="Ex: iPhone 15 Pro Max Titanium" value={name || ''} onChange={e => setName(e.target.value)} className="w-full p-5 bg-white border border-gray-100 rounded-2xl text-lg focus:ring-4 ring-indigo-500/10 outline-none transition-all focus:border-indigo-500" />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-4 mb-1 block">Descrição do Produto</label>
                                <textarea placeholder="Detalhes técnicos e diferenciais..." value={description || ''} onChange={e => setDescription(e.target.value)} className="w-full p-5 bg-white border border-gray-100 rounded-2xl text-lg focus:ring-4 ring-indigo-500/10 outline-none transition-all focus:border-indigo-500" rows={5} />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-gray-950 mb-6 flex items-center gap-2">
                           <div className="w-2 h-6 bg-indigo-600 rounded-full" /> Mídia Visual
                        </h3>
                        <div className="space-y-3">
                            {images.map((img, i) => (
                                <div key={i} className="relative group flex gap-2">
                                    <input type="text" placeholder={`URL de imagem ${i + 1}`} value={img || ''} onChange={e => { const ns = [...images]; ns[i] = e.target.value; setImages(ns); }} className="flex-1 p-4 bg-white border border-gray-100 rounded-2xl focus:border-indigo-500 outline-none" />
                                    {images.length > 1 && (
                                        <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="p-4 text-red-400 hover:text-red-500 transition">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setImages([...images, ''])} className="w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                                <Plus size={20} /> Adicionar mais 1 imagem
                            </button>
                        </div>
                    </section>
                </div>
                
                <div className="space-y-10">
                    <section className="bg-white p-8 rounded-3xl border border-gray-100">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Package size={18} className="text-indigo-600" />
                                <h3 className="font-black text-gray-950">Especificar Opções (Cores, Tamanhos)</h3>
                            </div>
                            <button onClick={() => setUseOptions(!useOptions)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${useOptions ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-gray-200'}`}>
                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${useOptions ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                        
                        {useOptions && (
                            <div className="space-y-6 animate-in slide-in-from-top-4">
                                {options.map((opt, i) => (
                                    <div key={i} className="space-y-3 p-5 bg-gray-50 border border-gray-100 rounded-2xl relative">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                            <input type="text" placeholder="Nome (Ex: Cor)" value={opt.name || ''} onChange={e => { const ns = [...options]; ns[i].name = e.target.value; setOptions(ns); }} className="font-black text-sm border-none bg-transparent focus:ring-0 w-1/2 p-0 placeholder:text-gray-300" />
                                            <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-red-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {opt.values.map((v, valIdx) => (
                                                <div key={valIdx} className="flex gap-2 items-center animate-in fade-in duration-300">
                                                    <input type="text" placeholder="Valor" value={v.label || ''} onChange={e => {
                                                        const ns = [...options];
                                                        ns[i].values[valIdx].label = e.target.value;
                                                        setOptions(ns);
                                                    }} className="flex-1 p-2.5 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:border-indigo-200" />
                                                    <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-3 h-[38px]">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase">Stock:</span>
                                                        <input type="number" value={v.stock ?? 0} onChange={e => {
                                                            const ns = [...options];
                                                            ns[i].values[valIdx].stock = Number(e.target.value);
                                                            setOptions(ns);
                                                        }} className="w-10 p-0 bg-transparent border-none text-xs focus:ring-0 font-black text-indigo-600" />
                                                    </div>
                                                    <button onClick={() => {
                                                        const ns = [...options];
                                                        ns[i].values = ns[i].values.filter((_, idx) => idx !== valIdx);
                                                        setOptions(ns);
                                                    }} className="text-gray-300 hover:text-red-400 transition"><X size={14} /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => {
                                                const ns = [...options];
                                                ns[i].values.push({ label: '', stock: 10 });
                                                setOptions(ns);
                                            }} className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 mt-2 flex items-center gap-1">
                                                <Plus size={12} /> ADICIONAR VALOR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setOptions([...options, {name: '', values: [{label: '', stock: 10}]}])} className="text-sm font-black text-indigo-600 hover:text-indigo-800 transition flex items-center gap-2">
                                    <Plus size={16} /> NOVO TIPO DE OPÇÃO
                                </button>
                            </div>
                        )}
                        {!useOptions && (
                            <p className="text-gray-400 text-sm italic text-center py-4">As opções de escolha estão desligadas para este produto.</p>
                        )}
                    </section>
                    
                    <section className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Preço Original (R$)</label>
                                <input type="number" step="0.01" value={originalPrice ?? 0} onChange={e => setOriginalPrice(Number(e.target.value))} className="w-full text-xl font-black text-gray-400 border-none outline-none p-0 bg-transparent" />
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Preço Atual (R$)</label>
                                <input type="number" step="0.01" value={price ?? 0} onChange={e => setPrice(Number(e.target.value))} className="w-full text-xl font-black text-gray-900 border-none outline-none p-0 bg-transparent" />
                            </div>
                        </div>
                        <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100">
                            <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-2">Preço Pix (R$)</label>
                            <input type="number" step="0.01" value={pixPrice ?? 0} onChange={e => setPixPrice(Number(e.target.value))} className="w-full text-2xl font-black text-white border-none outline-none p-0 bg-transparent" />
                        </div>
                    </section>
                    
                    <button onClick={handleAddProduct} className="group w-full p-8 bg-gray-950 text-white font-black text-2xl rounded-3xl hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4">
                        Salvar Produto <Package className="group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function PedidosAdminTab() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [newOrder, setNewOrder] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = { id: change.doc.id, ...change.doc.data() };
          setNewOrder(order);
          const synth = window.speechSynthesis;
          const utter = new SpeechSynthesisUtterance('Novo pedido na área');
          synth.speak(utter);
          setPedidos((prev) => [order, ...prev]);
        }
      });
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-12">
        {newOrder && (
            <div className="p-8 bg-red-50 border border-red-100 rounded-[2rem] shadow-xl shadow-red-100/50 animate-bounce cursor-pointer" onClick={() => setNewOrder(null)}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Bell size={24} className="animate-ring" />
                    </div>
                   <h3 className="text-2xl font-black text-red-900">Urgente: Novo Pedido!</h3>
                </div>
                <div className="bg-white/50 backdrop-blur rounded-2xl p-6 border border-red-100">
                    <pre className="text-sm font-mono text-red-800 overflow-x-auto">{JSON.stringify(newOrder, null, 2)}</pre>
                </div>
                <p className="mt-4 text-xs text-red-400 font-bold uppercase text-center">Clique para fechar alerta</p>
            </div>
        )}
        <div className="bg-gray-50 p-12 rounded-[2.5rem] border border-gray-100">
            <h3 className="text-2xl font-black mb-10 flex items-center gap-3"><ClipboardList className="text-indigo-600" /> Fluxo de Pedidos</h3>
            <div className="space-y-4"> 
                {pedidos.map((p, i) => ( 
                    <div key={p.id || i} className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow flex justify-between items-center group"> 
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">ID PEDIDO: {p.id?.slice(-8) || i}</span>
                            <span className="font-bold text-gray-900">R$ {Number(p.total || 0).toFixed(2)}</span>
                        </div>
                        <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalhes</button>
                    </div> 
                ))} 
            </div>
        </div>
    </div>
  );
}
