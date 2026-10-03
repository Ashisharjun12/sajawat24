/** Demo-only data for Android/iOS Content preview — not persisted. */

export const MOCK_APP_ANNOUNCEMENTS = [
  {
    id: "demo-ann-1",
    message: "Free setup on orders above ₹4,999 this weekend",
    tone: "promo",
  },
]

export const MOCK_APP_BANNERS = [
  {
    id: "demo-banner-1",
    title: "Festive decor",
    subtitle: "Book early slots",
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80",
  },
  {
    id: "demo-banner-2",
    title: "Instant delivery",
    subtitle: "Same-day in select areas",
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  },
]

export const MOCK_APP_CATEGORIES = [
  { id: "c1", label: "Birthday", imageUrl: null },
  { id: "c2", label: "Wedding", imageUrl: null },
  { id: "c3", label: "Office", imageUrl: null },
  { id: "c4", label: "Kids", imageUrl: null },
  { id: "c5", label: "Festive", imageUrl: null },
  { id: "c6", label: "Outdoor", imageUrl: null },
]

export const MOCK_APP_RAILS = [
  {
    id: "rail-1",
    title: "Trending near you",
    products: [
      { id: "p1", name: "Balloon arch kit", price: "₹2,499" },
      { id: "p2", name: "LED backdrop", price: "₹3,199" },
      { id: "p3", name: "Floral entrance", price: "₹4,899" },
    ],
  },
  {
    id: "rail-2",
    title: "Under ₹1,999",
    products: [
      { id: "p4", name: "Table runner set", price: "₹899" },
      { id: "p5", name: "Photo booth props", price: "₹1,299" },
      { id: "p6", name: "Cake topper", price: "₹499" },
    ],
  },
]
