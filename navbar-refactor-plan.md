# Move Search & Filters to Navbar - Refactoring Plan

## Goal
Move the search bar and filter controls from the SearchFilter component into the Navbar for a cleaner, more YouTube-like interface.

## Current Structure

### Files Involved:
1. `frontend/src/components/Navbar/Navbar.tsx` - Navigation bar (Home, Admin, Login/Logout)
2. `frontend/src/components/SearchFilter/SearchFilter.tsx` - Search and filters
3. `frontend/src/pages/HomePage.tsx` - Manages state and passes to SearchFilter

### Current Flow:
```
HomePage (manages state)
  ├── Navbar (navigation only)
  └── SearchFilter (search, sort, channel filter)
      └── VideoGrid
```

## Proposed Structure

### New Flow:
```
App
  └── Navbar (navigation + search + filters)
HomePage
  └── VideoGrid (just videos and pagination)
```

## Changes Required

### 1. Update Navbar Component
**File:** `frontend/src/components/Navbar/Navbar.tsx`

**Add props:**
```typescript
interface NavbarProps {
  // Search and filter props
  onSearch?: (query: string) => void;
  onSortChange?: (sort: 'newest' | 'oldest' | 'popular') => void;
  onChannelChange?: (channelId: string | undefined) => void;
  channels?: Array<{ id: string; name: string }>;
  selectedChannel?: string;
  currentSearch?: string;
  
  // Only show search/filters on home page
  showSearch?: boolean;
}
```

**Add to navbar:**
- Search input (centered or right side)
- Sort dropdown
- Channel filter dropdown
- Clear filters button (only if filters active)

**Layout considerations:**
- Mobile: Collapse to hamburger menu or second row
- Desktop: Horizontal layout after logo/nav links

### 2. Update HomePage
**File:** `frontend/src/pages/HomePage.tsx`

**Changes:**
- Remove `<SearchFilter />` component
- Pass search/filter props to `<Navbar />` instead
- Keep state management in HomePage
- Navbar becomes "controlled component" receiving callbacks

**New structure:**
```typescript
export function HomePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [selectedChannel, setSelectedChannel] = useState<string | undefined>();
  
  // ... existing hooks ...
  
  return (
    <>
      {/* No SearchFilter here anymore */}
      <VideoGrid ... />
      {selectedVideo && <VideoPlayer ... />}
    </>
  );
}
```

### 3. Update App.tsx to Pass Props
**File:** `frontend/src/App.tsx`

**Option A - Pass through routes:**
```typescript
<Routes>
  <Route 
    path="/" 
    element={<HomePage onNavbarPropsChange={setNavbarProps} />} 
  />
</Routes>
```

**Option B - Conditional rendering in Navbar:**
```typescript
// Navbar checks current route
const location = useLocation();
const isHomePage = location.pathname === '/';

{isHomePage && (
  <div className="navbar-search">
    {/* Search and filters */}
  </div>
)}
```

**Recommended:** Option B is simpler

### 4. Handle State Communication

**Challenge:** HomePage has the state, but Navbar needs to trigger changes.

**Solution:** Use React Router's `useLocation` and `useNavigate` with URL query params:

```typescript
// In HomePage
const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page') || '1';
const search = searchParams.get('search') || '';
const sort = searchParams.get('sort') || 'newest';

// In Navbar
const handleSearch = (query: string) => {
  const newParams = new URLSearchParams(window.location.search);
  newParams.set('search', query);
  newParams.set('page', '1');
  navigate({ search: newParams.toString() });
};
```

**Benefits:**
- Shareable URLs with filters
- Browser back/forward works
- No prop drilling needed

### 5. Update Navbar CSS
**File:** `frontend/src/components/Navbar/Navbar.css`

**Add styles for:**
- Search input container
- Filter dropdowns
- Clear button
- Responsive breakpoints
- YouTube-inspired styling

**Layout:**
```
Desktop:
[📺 Kiddos] [Home] [Admin] [🔍 Search...] [Sort ▼] [Channel ▼] [Clear] [Login]

Mobile:
[📺 Kiddos]                                              [☰]
[🔍 Search...] [Sort ▼] [Channel ▼] [Clear]
```

### 6. Remove SearchFilter Component (Optional)
**Files to delete/deprecate:**
- `frontend/src/components/SearchFilter/SearchFilter.tsx`
- `frontend/src/components/SearchFilter/SearchFilter.css`

Or keep it for reuse elsewhere.

## Implementation Steps

1. ✅ Create this plan
2. Add URL query param management to HomePage (using `useSearchParams`)
3. Update Navbar to accept search/filter props
4. Add search/filter UI to Navbar component
5. Style Navbar with new layout
6. Update HomePage to remove SearchFilter and pass props to Navbar
7. Test on desktop and mobile
8. Remove SearchFilter component if no longer needed
9. Clean up unused CSS

## Testing Checklist

- [ ] Search works from navbar
- [ ] Sort dropdown changes video order
- [ ] Channel filter works
- [ ] Clear filters button appears when filters active
- [ ] Clear filters button resets everything
- [ ] Pagination resets to 1 when filters change
- [ ] URL updates with query params
- [ ] Browser back/forward works with filters
- [ ] Mobile responsive (hamburger menu or stacked layout)
- [ ] Navbar doesn't show search on Admin/Login pages

## Alternative: Simpler Approach

If URL params are too complex, keep state in HomePage and pass callbacks to Navbar:

```typescript
// App.tsx
function App() {
  const [navbarProps, setNavbarProps] = useState({});
  
  return (
    <Navbar {...navbarProps} />
    <Routes>
      <Route path="/" element={<HomePage setNavbar={setNavbarProps} />} />
    </Routes>
  );
}
```

But this requires lifting state to App level and prop drilling.

## Recommendation

**Best approach:**
1. Use URL query params for filter state
2. Navbar reads from URL and updates URL on changes
3. HomePage reads from URL for fetching videos
4. Clean, shareable, no prop drilling

**Estimated time:** 30-45 minutes
**Complexity:** Medium (URL params + responsive styling)


