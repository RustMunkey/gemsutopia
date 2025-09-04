# Clear Old Categories Script

To clear all old category values from products and use only the category management system:

## Option 1: Using curl (if you have your admin token)

```bash
curl -X POST http://localhost:3001/api/admin/clear-old-categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## Option 2: Using browser console (while logged into admin dashboard)

```javascript
fetch('/api/admin/clear-old-categories', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Result:', data))
.catch(error => console.error('Error:', error));
```

## What this does:

1. Sets all products' old `category` field to 'uncategorized'
2. Products will now show their category name from the category management system
3. Products not assigned to any category will show "Uncategorized"
4. Old cached categories like "Ammolite" will be removed

Run this once and then your products will only show categories from the actual category management system.