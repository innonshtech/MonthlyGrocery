import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Truck, PlayCircle } from "lucide-react";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CategoryPlaceholder } from "@/components/ProductImage";

export default function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [brokenIdx, setBrokenIdx] = useState(() => new Set());
  const { addToCart, city } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const params = city ? `?city=${encodeURIComponent(city)}` : "";
    api.get(`/products/${productId}${params}`).then((r) => { setProduct(r.data.product); setActiveIdx(0); setShowVideo(false); setBrokenIdx(new Set()); }).catch(() => setProduct(false));
  }, [productId, city]);

  const photos = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image_url) list.push(product.image_url);
    (product.images || []).forEach((u) => { if (u && !list.includes(u)) list.push(u); });
    return list; // may be empty — we render <CategoryPlaceholder/> in that case
  }, [product]);

  if (product === null) return <div className="p-8 max-w-5xl mx-auto"><Skeleton className="h-96 rounded-3xl"/></div>;
  if (product === false) return <div className="p-8 text-center text-gray-500">Product not found.</div>;

  const add = async (goCart=false) => {
    try {
      await addToCart(product.id, qty);
      toast.success(`Added ${qty} × ${product.name}`);
      if (goCart) navigate("/cart");
    } catch (_e) { /* toast handled upstream */ }
  };

  const hasVideo = !!product.video_url;
  const activePhoto = photos[activeIdx];
  const showPhoto = !showVideo && activePhoto && !brokenIdx.has(activeIdx);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link to="/shop" data-testid="back-home" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#22C55E] text-sm font-semibold"><ArrowLeft className="w-4 h-4"/> Continue shopping</Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">
          {/* Media column */}
          <div>
            <div className="rounded-[24px] overflow-hidden bg-white border border-gray-100 mm-shadow-soft relative aspect-square" data-testid="product-media">
              {showVideo && hasVideo ? (
                isYoutube(product.video_url) ? (
                  <iframe title="product video" src={toEmbed(product.video_url)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen/>
                ) : (
                  <video src={product.video_url} controls autoPlay className="w-full h-full object-cover"/>
                )
              ) : showPhoto ? (
                <img src={activePhoto} alt={product.name} className="w-full h-full object-cover" onError={()=>setBrokenIdx(prev => new Set(prev).add(activeIdx))}/>
              ) : (
                <CategoryPlaceholder product={product} size="lg"/>
              )}
              {hasVideo && !showVideo && (
                <button data-testid="play-video" onClick={()=>setShowVideo(true)} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                  <span className="w-16 h-16 rounded-full bg-white text-[#22C55E] flex items-center justify-center mm-shadow-hover"><PlayCircle className="w-10 h-10"/></span>
                </button>
              )}
            </div>
            {/* Thumbnails */}
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
              {photos.length === 0 && (
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-transparent">
                  <CategoryPlaceholder product={product} size="sm"/>
                </div>
              )}
              {photos.map((url, i) => (
                <button key={i} data-testid={`thumb-${i}`} onClick={()=>{ setActiveIdx(i); setShowVideo(false); }}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${activeIdx===i && !showVideo ? "border-[#6C3BFF]" : "border-transparent"}`}>
                  {brokenIdx.has(i) ? (
                    <CategoryPlaceholder product={product} size="sm"/>
                  ) : (
                    <img src={url} alt={`view ${i+1}`} className="w-full h-full object-cover" onError={()=>setBrokenIdx(prev => new Set(prev).add(i))}/>
                  )}
                </button>
              ))}
              {hasVideo && (
                <button data-testid="thumb-video" onClick={()=>setShowVideo(true)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors flex items-center justify-center bg-black text-white ${showVideo ? "border-[#6C3BFF]" : "border-transparent"}`}>
                  <PlayCircle className="w-6 h-6"/>
                </button>
              )}
            </div>
          </div>

          {/* Details column */}
          <div>
            <div className="text-xs uppercase tracking-widest font-semibold text-[#22C55E]">{product.category}</div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tighter font-display">{product.name}</h1>
            <div className="mt-2 text-gray-500">{product.brand} · {product.unit}</div>

            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <span className="text-4xl font-bold" data-testid="product-price">₹{product.price}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through" data-testid="product-mrp">₹{product.mrp}</span>
                  <Badge className="bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]" data-testid="product-discount">Save {product.discount_percent}%</Badge>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
                <button data-testid="qty-dec" onClick={()=>setQty(Math.max(1,qty-1))} className="w-10 h-10 rounded-full">−</button>
                <div className="w-8 text-center font-semibold">{qty}</div>
                <button data-testid="qty-inc" onClick={()=>setQty(qty+1)} className="w-10 h-10 rounded-full">+</button>
              </div>
              <Button data-testid="add-to-cart" onClick={()=>add(false)} className="rounded-full bg-[#22C55E] hover:bg-[#16A34A] h-11 px-6"><ShoppingCart className="w-4 h-4 mr-2"/>Add to cart</Button>
              <Button data-testid="buy-now" onClick={()=>add(true)} variant="outline" className="rounded-full h-11 px-6">Buy now</Button>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 mm-shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold"><Truck className="w-4 h-4 text-[#22C55E]"/> Delivery within 4 hours</div>
              <div className="text-xs text-gray-500 mt-1">Free delivery. Minimum order value ₹2,500.</div>
            </div>

            {product.description && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold tracking-tight">About this product</h3>
                <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-line" data-testid="product-description">{product.description}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {product.is_veg && <Badge className="bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]">Veg</Badge>}
              {product.is_organic && <Badge className="bg-[#F0FDF4] text-[#166534] hover:bg-[#F0FDF4]">Organic</Badge>}
              {product.best_seller && <Badge className="bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]">Bestseller</Badge>}
              {product.todays_deal && <Badge className="bg-[#F3EEFF] text-[#22C55E] hover:bg-[#F3EEFF]">Today's Deal</Badge>}
              {product.featured && <Badge className="bg-[#EDE6FF] text-[#22C55E] hover:bg-[#EDE6FF]">Featured</Badge>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isYoutube(url) {
  return /youtube\.com|youtu\.be/i.test(url || "");
}
function toEmbed(url) {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([\w-]+)/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  return url;
}
