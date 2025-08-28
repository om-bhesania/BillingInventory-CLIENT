# 🚀 useApi Hook Usage Examples

This document shows how to use the `useApi` custom hook for making API calls in your React components.

## 📋 Table of Contents

1. [Basic Usage](#basic-usage)
2. [Specialized Hooks](#specialized-hooks)
3. [Advanced Patterns](#advanced-patterns)
4. [Real-World Examples](#real-world-examples)
5. [Best Practices](#best-practices)

## 🎯 Basic Usage

### Simple GET Request
```typescript
import { useApi } from '@/hooks/useApi';

const UserList = () => {
  const { data: users, loading, error, execute } = useApi('/users', 'GET');

  useEffect(() => {
    execute(); // Fetch users on component mount
  }, [execute]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {users?.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
};
```

### POST Request with Form Data
```typescript
const CreateUser = () => {
  const { data, loading, error, execute } = useApi('/users', 'POST');

  const handleSubmit = async (formData: UserFormData) => {
    const result = await execute(formData);
    if (result) {
      // User created successfully
      console.log('User created:', result);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

## 🔧 Specialized Hooks

### useGet - For GET Requests
```typescript
import { useGet } from '@/hooks/useApi';

const ProductList = () => {
  const { data: products, loading, error, execute } = useGet('/products');

  // Execute immediately on mount
  useEffect(() => execute(), [execute]);

  // With query parameters
  const handleSearch = (searchTerm: string) => {
    execute({ query: { search: searchTerm, limit: 20 } });
  };

  return (
    <div>
      <SearchInput onSearch={handleSearch} />
      {loading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {products && <ProductGrid products={products} />}
    </div>
  );
};
```

### usePost - For POST Requests
```typescript
import { usePost } from '@/hooks/useApi';

const CreateProduct = () => {
  const { data, loading, error, execute } = usePost('/products');

  const handleCreate = async (productData: ProductFormData) => {
    const newProduct = await execute(productData);
    if (newProduct) {
      // Handle success
      navigate(`/products/${newProduct.id}`);
    }
  };

  return (
    <ProductForm onSubmit={handleCreate} loading={loading} />
  );
};
```

### usePatch - For PATCH Requests
```typescript
import { usePatch } from '@/hooks/useApi';

const UpdateProduct = ({ productId }: { productId: string }) => {
  const { data, loading, error, execute } = usePatch(`/products/${productId}`);

  const handleUpdate = async (updates: Partial<Product>) => {
    const updatedProduct = await execute(updates);
    if (updatedProduct) {
      // Handle success
      toast.success('Product updated successfully');
    }
  };

  return (
    <ProductForm onSubmit={handleUpdate} loading={loading} />
  );
};
```

### useDelete - For DELETE Requests
```typescript
import { useDelete } from '@/hooks/useApi';

const DeleteProduct = ({ productId }: { productId: string }) => {
  const { loading, error, execute } = useDelete('/products');

  const handleDelete = async () => {
    const confirmed = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (confirmed.isConfirmed) {
      const result = await execute({ id: productId });
      if (result) {
        // Handle success
        toast.success('Product deleted successfully');
      }
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete Product'}
    </button>
  );
};
```

## 🚀 Advanced Patterns

### Immediate Execution
```typescript
const Dashboard = () => {
  // Fetch data immediately when component mounts
  const { data: stats, loading, error } = useGet('/dashboard/stats', { 
    immediate: true 
  });

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <DashboardStats stats={stats} />;
};
```

### With Initial Data
```typescript
const UserProfile = ({ userId }: { userId: string }) => {
  const { data: user, loading, error, execute } = useGet(`/users/${userId}`, {
    immediate: true,
    initialData: { id: userId, name: 'Loading...', email: '...' }
  });

  // Component renders immediately with initial data
  // Then updates when real data arrives
  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      {loading && <small>Updating...</small>}
    </div>
  );
};
```

### Complex API Calls
```typescript
const AdvancedSearch = () => {
  const { data: results, loading, error, execute } = useGet('/search');

  const handleSearch = (filters: SearchFilters) => {
    execute({
      query: {
        q: filters.query,
        category: filters.category,
        price_min: filters.priceRange.min,
        price_max: filters.priceRange.max,
        sort: filters.sortBy,
        page: filters.page,
        limit: filters.limit
      }
    });
  };

  return (
    <div>
      <SearchFilters onSubmit={handleSearch} />
      <SearchResults results={results} loading={loading} error={error} />
    </div>
  );
};
```

## 🌟 Real-World Examples

### Restock Management Integration
```typescript
import { useApi } from '@/hooks/useApi';
import { API_URL } from '@/services/apiuri';

const RestockManagement = () => {
  // Get all restock requests
  const { 
    data: requests, 
    loading, 
    error, 
    execute: fetchRequests 
  } = useGet(API_URL.restockRequest.getAll, { immediate: true });

  // Update request status
  const { 
    data: updateResult, 
    loading: updating, 
    error: updateError, 
    execute: updateStatus 
  } = usePatch('/restock-requests');

  // Delete request
  const { 
    loading: deleting, 
    error: deleteError, 
    execute: deleteRequest 
  } = useDelete('/restock-requests');

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    const result = await updateStatus({ 
      url: `/restock-requests/${requestId}/status`,
      data: { status: newStatus }
    });
    
    if (result) {
      fetchRequests(); // Refresh the list
    }
  };

  const handleDelete = async (requestId: string) => {
    const result = await deleteRequest({ id: requestId });
    if (result) {
      fetchRequests(); // Refresh the list
    }
  };

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      
      {requests?.map(request => (
        <RestockRequestCard
          key={request.id}
          request={request}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          updating={updating}
          deleting={deleting}
        />
      ))}
    </div>
  );
};
```

### Form with Validation
```typescript
const ProductForm = ({ productId, initialData }: ProductFormProps) => {
  const isEditing = !!productId;
  const endpoint = isEditing ? `/products/${productId}` : '/products';
  const method = isEditing ? 'PUT' : 'POST';

  const { data, loading, error, execute } = useApi(endpoint, method, {
    initialData: initialData || {}
  });

  const [formData, setFormData] = useState(initialData || {});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.price || formData.price <= 0) errors.price = 'Valid price is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const result = await execute(formData);
    if (result) {
      toast.success(`Product ${isEditing ? 'updated' : 'created'} successfully`);
      // Navigate or close modal
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Product name"
        />
        {validationErrors.name && <span className="error">{validationErrors.name}</span>}
      </div>

      <div>
        <input
          type="number"
          value={formData.price || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
          placeholder="Price"
        />
        {validationErrors.price && <span className="error">{validationErrors.price}</span>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
      </button>

      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

## 💡 Best Practices

### 1. **Use Specialized Hooks When Possible**
```typescript
// ✅ Good - Clear intent
const { data, loading, execute } = useGet('/users');

// ❌ Less clear
const { data, loading, execute } = useApi('/users', 'GET');
```

### 2. **Handle Loading States**
```typescript
// ✅ Good - User knows something is happening
<button disabled={loading}>
  {loading ? 'Creating...' : 'Create User'}
</button>

// ❌ Bad - Button stays enabled during request
<button>Create User</button>
```

### 3. **Reset State When Needed**
```typescript
const { data, error, reset } = usePost('/users');

const handleSuccess = () => {
  // Clear form or navigate away
  reset(); // Clears data and error
};
```

### 4. **Use Immediate Execution for Critical Data**
```typescript
// ✅ Good - Data loads immediately
const { data: user } = useGet('/profile', { immediate: true });

// ❌ Requires manual execution
const { data: user, execute } = useGet('/profile');
useEffect(() => execute(), [execute]);
```

### 5. **Handle Errors Gracefully**
```typescript
const { error, execute } = useApi('/api/endpoint', 'POST');

// ✅ Good - Show user-friendly error
{error && (
  <div className="alert alert-error">
    {error === 'Network Error' ? 'Connection failed. Please try again.' : error}
  </div>
)}

// ❌ Bad - Show raw error to user
{error && <div>{error}</div>}
```

## 🔄 Migration from Direct Service Calls

### Before (Direct service usage)
```typescript
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchUsers = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await service({ url: '/users', method: 'GET' });
    setUsers(response);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchUsers();
}, []);
```

### After (Using useApi hook)
```typescript
const { data: users, loading, error, execute: fetchUsers } = useGet('/users', { 
  immediate: true 
});

// That's it! No manual state management needed.
```

## 🎉 Benefits of useApi Hook

1. **🚀 Reduced Boilerplate** - No more manual loading/error state management
2. **🔄 Consistent API** - Same pattern for all HTTP methods
3. **⚡ Built-in Optimization** - Uses useCallback for stable function references
4. **🛡️ Type Safety** - Full TypeScript support with generics
5. **🎯 Flexible** - Supports immediate execution, initial data, and custom parameters
6. **🧹 Clean Code** - More readable and maintainable components

---

**Ready to use?** Import the hook and start building better API integrations! 🚀
