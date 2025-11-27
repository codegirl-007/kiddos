# Pagination Bug Investigation Plan

## Problem Statement
The `meta.page` property in API responses always shows `1`, even when requesting page 2, 3, etc.

## Request Flow Analysis

### Step 1: Frontend sends request
**File:** `frontend/src/services/apiClient.ts` line 113
```typescript
getAll: (params?: any) => api.get('/videos', { params })
```
**What happens:** 
- Axios converts params object to query string
- Request: `GET /api/videos?page=2&limit=12&sort=newest`

### Step 2: Express receives request
**What happens:**
- Express parses query string into `req.query` object
- All values are **strings**: `{ page: '2', limit: '12', sort: 'newest' }`

### Step 3: Validation Middleware
**File:** `backend/src/middleware/validation.ts` line 21-30
```typescript
const validated = schema.parse(req.body || req.query);
if (req.method === 'GET') {
  req.query = validated as any;
}
```

**Schema:** `backend/src/middleware/validation.ts` line 14
```typescript
page: z.coerce.number().int().min(1).default(1)
```

**POTENTIAL BUG #1:** 
- `.default(1)` only applies when value is `undefined`
- If page='2' (string), Zod should:
  1. Check if undefined → NO (it's '2')
  2. Coerce to number → page becomes 2
  3. Validate int and min(1) → passes
  4. Result: `validated = { page: 2, ... }`

**QUESTION:** Is req.query being properly replaced?

### Step 4: Controller receives request
**File:** `backend/src/controllers/videos.controller.ts` line 10-13
```typescript
const { page = 1, limit = 12, channelId, search, sort = 'newest' } = req.query as any;

const pageNum = page as number;
const limitNum = limit as number;
```

**POTENTIAL BUG #2:**
- Destructuring defaults (= 1, = 12) only apply if value is `undefined`
- After validation, `page` should be a number (not undefined)
- So `pageNum` should equal whatever `page` is

**QUESTION:** Is `req.query.page` actually the validated number?

### Step 5: Response
**File:** `backend/src/controllers/videos.controller.ts` line 87-98
```typescript
res.json({
  success: true,
  data: { videos },
  meta: {
    page: pageNum,  // Should be 2 if we requested page 2
    ...
  }
});
```

## Root Cause Hypotheses

### Hypothesis 1: Validation middleware not working
**Evidence needed:**
- Add `console.log('Before validation:', req.query)` before line 24 in validation.ts
- Add `console.log('After validation:', validated)` after line 24 in validation.ts
- Check if validation is even running

### Hypothesis 2: req.query not being replaced
**Evidence needed:**
- Add `console.log('req.query in controller:', req.query)` at line 11 in videos.controller.ts
- Check if req.query has numbers or strings
- Check if req.query.page is actually 2 when we request page 2

### Hypothesis 3: Type coercion issue
**Evidence needed:**
- Add `console.log('pageNum:', pageNum, 'type:', typeof pageNum)` at line 14 in videos.controller.ts
- Check if pageNum is actually a number or if it's somehow being converted back to default

### Hypothesis 4: Multiple requests interfering
**Evidence needed:**
- Check browser network tab to see if there are duplicate requests
- One request might be page 2, another might be page 1
- Frontend might be showing response from wrong request

## Debugging Steps

1. **Add logging to validation middleware**
   - Log `req.query` before validation
   - Log `validated` result after validation
   - Verify Zod is correctly converting and not defaulting

2. **Add logging to controller**
   - Log `req.query` when controller receives it
   - Log `page`, `pageNum`, `offset` calculations
   - Verify the response meta.page value

3. **Check browser network tab**
   - Verify the request URL includes correct page parameter
   - Verify the response meta.page value
   - Check if there are multiple simultaneous requests

4. **Test with direct curl**
   - `curl "http://localhost:3000/api/videos?page=2&limit=12"`
   - See if backend returns correct page in meta
   - This isolates frontend vs backend issue

## Expected Behavior

Request: `GET /api/videos?page=2`
Response:
```json
{
  "success": true,
  "data": { "videos": [...] },
  "meta": {
    "page": 2,  // Should be 2!
    "limit": 12,
    "total": 60,
    "totalPages": 5,
    ...
  }
}
```

## Action Items

1. Add debug logging to both validation middleware and controller
2. Test with page 2 request and check all console.logs
3. Based on logs, identify which hypothesis is correct
4. Fix the actual bug
5. Remove debug logging
6. Test pagination works correctly

