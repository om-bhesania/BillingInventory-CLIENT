
import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const inventorySchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  category: Yup.string().required('Category is required'),
  quantity: Yup.number()
    .min(0, 'Quantity cannot be negative')
    .required('Quantity is required'),
  price: Yup.number()
    .min(0, 'Price cannot be negative')
    .required('Price is required'),
  reorderPoint: Yup.number().min(0, 'Reorder point cannot be negative'),
  shop: Yup.string().required('Shop is required'),
  description: Yup.string(),
});

export const shopSchema = Yup.object().shape({
  name: Yup.string().required('Shop name is required'),
  location: Yup.string().required('Location is required'),
  manager: Yup.string().required('Manager is required'),
  contact: Yup.string().required('Contact number is required'),
  email: Yup.string().email('Invalid email address'),
  openingTime: Yup.string(),
  closingTime: Yup.string(),
  description: Yup.string(),
});

export const employeeSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  position: Yup.string().required('Position is required'),
  shop: Yup.string().required('Shop is required'),
  joinDate: Yup.string(),
  address: Yup.string(),
  isAdmin: Yup.boolean(),
});

export const invoiceSchema = Yup.object().shape({
  customer: Yup.string().required('Customer name is required'),
  contactNumber: Yup.string(),
  shop: Yup.string().required('Shop is required'),
  invoiceDate: Yup.string().required('Invoice date is required'),
  items: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().required(),
        itemId: Yup.string().required('Item selection is required'),
        name: Yup.string().required(),
        quantity: Yup.number()
          .min(1, 'Quantity must be at least 1')
          .required('Quantity is required'),
        price: Yup.number()
          .min(0, 'Price cannot be negative')
          .required('Price is required'),
      })
    )
    .min(1, 'At least one item is required'),
  notes: Yup.string(),
});
