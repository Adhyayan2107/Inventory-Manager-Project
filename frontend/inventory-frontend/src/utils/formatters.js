export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };
  
  export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  export const getStatusColor = (status) => {
    const colors = {
      active: 'badge-success',
      inactive: 'badge-danger',
      discontinued: 'badge-warning',
      out_of_stock: 'badge-danger',
      low_stock: 'badge-warning',
      in_stock: 'badge-success',
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      paid: 'badge-success',
      unpaid: 'badge-danger',
      partial: 'badge-warning'
    };
    return colors[status] || 'badge-info';
  };
  
  export const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };