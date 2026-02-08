# 🖼️ Cluaiz Interview Mastery: Frontend Breakdown (Next.js 16 & React 19)
**Status:** Expanded | **Count:** 25 Questions | **Tech:** Next.js 16, React 19, Tailwind, Zustand

---

## 🎨 Next.js 16 & App Router (The "New Normal")

### Q1: App Router vs Pages Router (Why Rewrite?)
**Answer:**
"Main reason hai **Control** aur **Waterfall Requests**.
- **Pages:** `getServerSideProps` block karta tha page load ko.
- **App:** `loading.tsx` component allow karta hai ki hum header/footer dikha dein aur heavy content (Table) background mein load karein (Streaming).
- **Layouts:** Persistent UI shared across routes."

### Q2: Server Actions vs API Routes?
**Scenario:** Form submit karna hai.
**Answer:**
"Pehle hum `/api/contact` banate, fir `axios.post` karte, fir `useEffect` lagate.
Ab hum **Server Actions** use karte hain:
```tsx
async function submitForm(formData) {
  'use server'
  await db.users.create(formData)
}
```
Direct `form` ke `action` attribute mein pass kar diya. No API endpoints to manage, no client-side JS needed for basic forms."

### Q3: `useOptimistic` hook kya karta hai? (React 19)
**Answer:**
"Jab user 'Send' dabata hai, hum wait nahi karte.
Hum `useOptimistic` hook se UI ko turant update kar dete hain.
Agar server fail kare, to UI apne aap revert ho jati hai.
Isse **Perceived Performance** infinite lagti hai."

### Q4: `useSuspenseQuery` vs `useEffect` fetching?
**Answer:**
"Hum `useEffect` avoid karte hain data fetching ke liye kyunki wo **Waterfall** (serial requests) banata hai.
Hum React Query ya Next.js `fetch` use karte hain `Suspense` ke saath.
Isse hum components ko parallel mein load kar sakte hain aur loading skeletons dikha sakte hain automatically."

### Q5: Static vs Dynamic Rendering? (The Cache Strategy)
**Answer:**
- **Static (Default):** Build time pe page ban gaya (About Us, Pricing). Super fast.
- **Dynamic:** Request time pe banta hai (Dashboard, User Profile).
"Hum `export const dynamic = 'force-dynamic'` use karte hain un pages ke liye jahan data har second badal raha hai."

---

## ⚡ Performance Optimization

### Q6: First Contentful Paint (FCP) kaise improve kiya?
**Answer:**
1.  **Fonts:** `next/font` use kiya (Google Fonts self-hosted hain, zero layout shift).
2.  **Images:** `next/image` use kiya (WebP conversion, Lazy Loading automatic).
3.  **Scripts:** Third party scripts (Analytics) ko `Strategy="lazyOnload"` kiya.

### Q7: Bundle Analysis kaise karte ho?
**Answer:**
"Hum `@next/bundle-analyzer` plugin use karte hain.
Pta chala `moment.js` bahot heavy tha, humne usse `date-fns` (tree-shakable) se replace kiya.
`lodash` ki jagah `lodash-es` use kiya taaki poori library import na ho."

### Q8: `revalidatePath` aur `revalidateTag` kya hain?
**Answer:**
"Ye **Incremental Static Regeneration (ISR)** ka naya roop hai.
Agar admin ne blog post update ki, to hum poori site rebuild nahi karte.
Hum sirf us specific URL ka cache purge karte hain using `revalidatePath('/blog/post-1')`. Content instantly update ho jata hai."

### Q9: Virtualization (Large Lists)
**Problem:** Chat history mein 10,000 messages hain. DOM node banenge -> Browser crash.
**Answer:**
"Hum `react-window` ya `tanstack-virtual` use karte hain.
Hum sirf wahi 20 messages render karte hain jo screen pe dikh rahe hain. Baaki DOM mein exist hi nahi karte."

### Q10: Image Optimization Strategy?
**Answer:**
"Hum kabhi bhi user ki upload ki hui image direct nahi dikhate.
Hum usse **Cloudinary/ImageKit** ya **Next.js Image Optimization** se resize karke dikhate hain.
Agar user ne 5MB ki image daali, to thumbnail mein 5KB ki hi load hoti hai."

---

## 🧩 Advanced Frameworks & UI Architecture

### Q11: TailwindCSS: `@apply` vs Utility Classes?
**Answer:**
"Hum mostly Utility classes (`flex p-4 bg-red-500`) prefer karte hain HTML mein.
`@apply` sirf tab use karte hain jab same button style 50 jagah use ho raha ho aur component banana feasible na ho (e.g., global headings `h1`)."

### Q12: Why Radix UI (Headless UI)? Why not Material UI?
**Answer:**
"MUI ka bundle size bahut bada hai aur difficult to override styles.
**Radix UI** humein functionality deta hai (Keyboard navigation, Accessibility, Focus management) bina kisi style ke.
Hum Tailwind se style karte hain. Isse hamara Design System unique banta hai, Google jaisa generic nahi lagta."

### Q13: `shadcn/ui` kya hai? (Is it a library?)
**Answer:**
"Ye koi npm package nahi hai. Ye code snippets hain.
Hum component copy-paste karte hain apne project mein. Iska faayda ye hai ki hum code puri tarah own karte hain. Agar `Button` component mein kuch change karna hai, to hum seedha code edit kar sakte hain."

### Q14: Zustand: Persistent State?
**Answer:**
"User ki theme preference (Dark/Light) ya Sidebar state (Collapsed/Open) hum `persist` middleware ke saath save karte hain `localStorage` mein.
Jab user reload karta hai, to state wahi rehti hai."

### Q15: Error Boundaries (React)
**Answer:**
"Agar ek widget crash ho jaye, to poora page Safed (White Screen) nahi hona chahiye.
Hum har major section (Sidebar, ChatWindow) ko `<ErrorBoundary>` mein wrap karte hain.
Agar chat crash hui, to wahan 'Something went wrong' button aata hai, baaki app chalta rehta hai."

---

## 🛠️ Real-World Scenarios

### Q16: "Hydration Mismatch" (Detailed Debugging)
**Issue:** `<div> (Server) !== <div> (Client)`.
**Common Causes:**
1.  Invalid HTML nesting (`<p>` ke andar `<div>`).
2.  `typeof window !== 'undefined'` checks during render.
3.  Timestamps/Random numbers generated during render.
**Fix:** `suppressHydrationWarning` on timestamp elements.

### Q17: File Upload implementation (Progress Bar)
**Technique:**
"Hum `XMLHttpRequest` (XHR) use karte hain `axios` ke saath taaki `onUploadProgress` event mile. Fetch API mein upload progress track karna mushkil hai."

### Q18: Middleware (`middleware.ts`) uses?
**Answer:**
1.  **Auth Guard:** Agar cookie nahi hai to Login pe redirect karo.
2.  **Geolocation:** User ki country detect karke currency set karo.
3.  **A/B Testing:** Traffic split karna naye features ke liye.

### Q19: Layout Shift (CLS) eliminate kaise kiya?
**Answer:**
"Images aur Videos ko hamesha fixed `width` aur `height` (aspect ratio) di.
Ads ya dynamic content ke liye pehle se jagah reserve ki (Min-Height container)."

### Q20: Web Workers ka use case?
**Answer:**
"Agar humein browser mein heavy JSON parsing ya Image processing karni ho, to hum Main Thread free rakhne ke liye Web Worker use karenge.
Filhal Cluaiz mein heavy kaam Backend pe hota hai."

### Q21: SEO for Dynamic Routes?
**Answer:**
"Hum `generateMetadata` function use karte hain har page (`page.tsx`) mein.
Ye dynamic DB call karke Title aur Description set karta hai OpenGraph tags ke saath."

### Q22: Accessibility (a11y)
**Answer:**
"Hum `eslint-plugin-jsx-a11y` use karte hain.
Radix UI ensure karta hai ki sare components keyboard accessible hon (Tab key, Enter, Space)."

### Q23: TypeScript: `interface` vs `type`?
**Answer:**
"Hum `type` use karte hain mostly Unions aur Intersections ke liye.
`interface` use karte hain Objects define karne ke liye jo extend ho sakte hain (`extends`).
Cluaiz mein consistency ke liye hum `type` prefer karte hain props ke liye."

### Q24: React Context limitations?
**Answer:**
"Context har render pe re-render trigger karta hai saare consumers mein.
Agar state frequent update ho rahi hai (e.g., Mouse Position, Timer), to Context mat use karo. Zustand ya Signals use karo."

### Q25: Why TurboPack (Next.js)?
**Answer:**
"Development server ka startup time fast karne ke liye. Webpack Rust-based TurboPack se replace ho raha hai. Isse HMR (Hot Module Replacement) instant ho jata hai."
