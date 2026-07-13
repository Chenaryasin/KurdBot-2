"use client";

import { useEffect, useState } from "react";
import { getProfessionalById, toggleFavorite, addReview } from "../../actions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { showAlert } from "@/lib/alerts";
import { Heart, Star, PhoneCall, MessageCircle, Send } from "lucide-react";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isApproved, setIsApproved] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (id) {
        const data = await getProfessionalById(id as string);
        
        if (data) {
          let authorized = false;
          if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            tg.ready();
            const user = tg.initDataUnsafe?.user;
            if (user?.id) {
              const tgId = user.id.toString();
              if (tgId === "1932967171" || (data.telegram_id && data.telegram_id.toString() === tgId)) {
                setIsAuthorized(true);
                authorized = true;
              }
            }
          }

          if (data.is_approved === false && !authorized) {
            setIsApproved(false);
          } else {
            setProfile(data);
          }
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!profile || togglingFav) return;
    setTogglingFav(true);
    const res = await toggleFavorite(profile.id);
    if (res.success) {
      setProfile((prev: any) => ({ ...prev, is_favorite: !prev.is_favorite }));
    } else {
      showAlert("کێشەیەک ڕوویدا: " + res.error);
    }
    setTogglingFav(false);
  };

  const handleReviewSubmit = async () => {
    if (!profile || !reviewText.trim() || submittingReview) return;
    setSubmittingReview(true);
    const res = await addReview(profile.id, reviewRating, reviewText);
    if (res.success) {
      showAlert("هەڵسەنگاندنەکەت بە سەرکەوتوویی نێردرا!");
      const data = await getProfessionalById(id as string);
      setProfile(data);
      setReviewText("");
    } else {
      showAlert("کێشەیەک ڕوویدا: " + res.error);
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-secondary-foreground">چاوەڕێ بکە...</div>;
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-xl font-bold">ڕێگەپێدراو نیت!</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">ئەم پڕۆفایلە هێشتا پەسەند نەکراوە لەلایەن بەڕێوبەرەوە.</p>
        <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md active:scale-95 transition-transform">گەڕانەوە</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-secondary-foreground gap-4">
        <div>پڕۆفایل نەدۆزرایەوە!</div>
        <button onClick={() => router.back()} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold">گەڕانەوە</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Cover & Header */}
      <div className="bg-gradient-to-br from-primary to-blue-800 pt-8 pb-20 px-4 rounded-b-[40px] relative shadow-lg">
        <button onClick={() => router.back()} className="absolute top-6 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl text-white active:scale-95 transition-transform">
          🔙
        </button>
        <div className="absolute top-6 right-4 flex gap-2">
          <button 
            onClick={handleToggleFavorite}
            disabled={togglingFav}
            className={`w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center transition-colors active:scale-95 ${
              profile.is_favorite ? "bg-white text-red-500" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <Heart className={`w-5 h-5 ${profile.is_favorite ? "fill-red-500" : ""}`} />
          </button>
          
          {isAuthorized && (
            <Link href={`/profile/${id}/edit`} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl text-white active:scale-95 transition-transform">
              ✏️
            </Link>
          )}
        </div>

        <div className="text-center text-white mt-4">
          <p className="text-blue-100 text-sm mb-1">{profile.categories?.icon} {profile.categories?.name_ku}</p>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <div className="flex items-center justify-center gap-1 mt-2 text-yellow-400">
            <span className="text-sm font-bold text-white ml-1">
              ({profile.rating ? profile.rating.toFixed(1) : "نوێ"})
            </span>
            <Star className={`w-4 h-4 ${profile.rating >= 1 ? "fill-current" : "opacity-40"}`} />
            <Star className={`w-4 h-4 ${profile.rating >= 2 ? "fill-current" : "opacity-40"}`} />
            <Star className={`w-4 h-4 ${profile.rating >= 3 ? "fill-current" : "opacity-40"}`} />
            <Star className={`w-4 h-4 ${profile.rating >= 4 ? "fill-current" : "opacity-40"}`} />
            <Star className={`w-4 h-4 ${profile.rating >= 5 ? "fill-current" : "opacity-40"}`} />
          </div>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="glass-card rounded-3xl p-6 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-card p-1 rounded-full shadow-lg border border-border">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover rounded-full bg-secondary" />
            ) : (
              <div className="w-full h-full bg-secondary rounded-full flex items-center justify-center text-4xl">
                {profile.categories?.icon || '👤'}
              </div>
            )}
          </div>
          
          <div className="mt-14 text-center">
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800/50">📍 {profile.cities?.name_ku}</span>
              <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-sm font-medium border border-orange-100 dark:border-orange-800/50">⭐ {profile.experience_years} ساڵ ئەزموون</span>
            </div>

            <div className="flex gap-3">
              <a 
                href={`tel:${profile.phone}`}
                className="flex-1 bg-primary hover:bg-indigo-600 text-primary-foreground font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active-scale shadow-md shadow-indigo-200 dark:shadow-none transition-colors"
              >
                <PhoneCall className="w-5 h-5" /> پەیوەندی
              </a>
              <a 
                href={`https://wa.me/${profile.phone.replace('+', '')}`}
                target="_blank"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active-scale shadow-md shadow-green-200 dark:shadow-none transition-colors"
              >
                <MessageCircle className="w-5 h-5" /> وەتسئاپ
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Extended Info */}
      <div className="px-4 mt-6 flex flex-col gap-4">
        
        {profile.degree && (
          <div className="glass-card p-5 rounded-3xl">
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
              <span>🎓</span> بڕوانامە
            </h3>
            <p className="text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap">{profile.degree}</p>
          </div>
        )}

        {profile.skills && (
          <div className="glass-card p-5 rounded-3xl">
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
              <span>🛠️</span> شارەزاییەکان
            </h3>
            <p className="text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap">{profile.skills}</p>
          </div>
        )}

        {profile.work_locations && (
          <div className="glass-card p-5 rounded-3xl">
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
              <span>🏢</span> شوێنەکانی کارکردن
            </h3>
            <p className="text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap">{profile.work_locations}</p>
          </div>
        )}

        {/* Portfolio Gallery */}
        {profile.portfolio_images && profile.portfolio_images.length > 0 && (
          <div className="glass-card p-5 rounded-3xl mt-2">
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <span>📸</span> وێنەی کارەکان
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {profile.portfolio_images.map((img: any) => (
                <div key={img.id} className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border">
                  <img src={img.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="glass-card p-5 rounded-3xl mt-2">
          <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> هەڵسەنگاندنەکان
          </h3>
          
          {/* Add Review */}
          {!isAuthorized && (
            <div className="mb-6 bg-secondary/30 p-4 rounded-2xl border border-border">
              <h4 className="text-sm font-bold mb-3 text-foreground">ڕای خۆت بنووسە:</h4>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none">
                    <Star className={`w-6 h-6 ${reviewRating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
                  </button>
                ))}
              </div>
              <textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="زۆر دەستڕەنگینە و کارەکانی خاوێنە..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary mb-3 min-h-[80px]"
              />
              <button 
                onClick={handleReviewSubmit}
                disabled={submittingReview || !reviewText.trim()}
                className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active-scale disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> ناردنی هەڵسەنگاندن
              </button>
            </div>
          )}

          {/* Review List */}
          <div className="flex flex-col gap-4">
            {profile.reviews && profile.reviews.length > 0 ? (
              profile.reviews.map((rev: any) => (
                <div key={rev.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                      {rev.users?.photo_url ? (
                        <img src={rev.users.photo_url} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{rev.users?.name || "بەکارهێنەر"}</div>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3 h-3 ${rev.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-foreground pl-10">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-secondary-foreground text-sm py-4">تا ئێستا هیچ هەڵسەنگاندنێک نییە.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
