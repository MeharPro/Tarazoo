import { Product, Collection } from './types';

// Mock products for demo mode when Shopify is not configured
export const mockProducts: Product[] = [
  {
    id: 'mock-product-1',
    handle: 'sample-product-1',
    availableForSale: true,
    title: 'Sample Product 1',
    description: 'This is a sample product for demonstration purposes.',
    descriptionHtml: '<p>This is a sample product for demonstration purposes.</p>',
    options: [
      {
        id: 'option-1',
        name: 'Size',
        values: ['Small', 'Medium', 'Large']
      }
    ],
    priceRange: {
      maxVariantPrice: {
        amount: '99.00',
        currencyCode: 'USD'
      },
      minVariantPrice: {
        amount: '99.00',
        currencyCode: 'USD'
      }
    },
    variants: [
      {
        id: 'variant-1',
        title: 'Small',
        availableForSale: true,
        selectedOptions: [
          {
            name: 'Size',
            value: 'Small'
          }
        ],
        price: {
          amount: '99.00',
          currencyCode: 'USD'
        }
      }
    ],
    featuredImage: {
      url: 'https://via.placeholder.com/600x600/4F46E5/ffffff?text=Sample+Product+1',
      altText: 'Sample Product 1',
      width: 600,
      height: 600
    },
    images: [
      {
        url: 'https://via.placeholder.com/600x600/4F46E5/ffffff?text=Sample+Product+1',
        altText: 'Sample Product 1',
        width: 600,
        height: 600
      }
    ],
    seo: {
      title: 'Sample Product 1',
      description: 'This is a sample product for demonstration purposes.'
    },
    tags: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-product-2',
    handle: 'sample-product-2',
    availableForSale: true,
    title: 'Sample Product 2',
    description: 'Another sample product for demonstration.',
    descriptionHtml: '<p>Another sample product for demonstration.</p>',
    options: [
      {
        id: 'option-2',
        name: 'Color',
        values: ['Red', 'Blue', 'Green']
      }
    ],
    priceRange: {
      maxVariantPrice: {
        amount: '149.00',
        currencyCode: 'USD'
      },
      minVariantPrice: {
        amount: '149.00',
        currencyCode: 'USD'
      }
    },
    variants: [
      {
        id: 'variant-2',
        title: 'Red',
        availableForSale: true,
        selectedOptions: [
          {
            name: 'Color',
            value: 'Red'
          }
        ],
        price: {
          amount: '149.00',
          currencyCode: 'USD'
        }
      }
    ],
    featuredImage: {
      url: 'https://via.placeholder.com/600x600/10B981/ffffff?text=Sample+Product+2',
      altText: 'Sample Product 2',
      width: 600,
      height: 600
    },
    images: [
      {
        url: 'https://via.placeholder.com/600x600/10B981/ffffff?text=Sample+Product+2',
        altText: 'Sample Product 2',
        width: 600,
        height: 600
      }
    ],
    seo: {
      title: 'Sample Product 2',
      description: 'Another sample product for demonstration.'
    },
    tags: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-product-3',
    handle: 'sample-product-3',
    availableForSale: true,
    title: 'Sample Product 3',
    description: 'A third sample product for the demo.',
    descriptionHtml: '<p>A third sample product for the demo.</p>',
    options: [
      {
        id: 'option-3',
        name: 'Style',
        values: ['Classic', 'Modern']
      }
    ],
    priceRange: {
      maxVariantPrice: {
        amount: '199.00',
        currencyCode: 'USD'
      },
      minVariantPrice: {
        amount: '199.00',
        currencyCode: 'USD'
      }
    },
    variants: [
      {
        id: 'variant-3',
        title: 'Classic',
        availableForSale: true,
        selectedOptions: [
          {
            name: 'Style',
            value: 'Classic'
          }
        ],
        price: {
          amount: '199.00',
          currencyCode: 'USD'
        }
      }
    ],
    featuredImage: {
      url: 'https://via.placeholder.com/600x600/F59E0B/ffffff?text=Sample+Product+3',
      altText: 'Sample Product 3',
      width: 600,
      height: 600
    },
    images: [
      {
        url: 'https://via.placeholder.com/600x600/F59E0B/ffffff?text=Sample+Product+3',
        altText: 'Sample Product 3',
        width: 600,
        height: 600
      }
    ],
    seo: {
      title: 'Sample Product 3',
      description: 'A third sample product for the demo.'
    },
    tags: [],
    updatedAt: new Date().toISOString()
  }
];

export const mockCollections: Collection[] = [
  {
    handle: '',
    title: 'All',
    description: 'All products',
    seo: {
      title: 'All',
      description: 'All products'
    },
    path: '/search',
    updatedAt: new Date().toISOString()
  },
  {
    handle: 'featured',
    title: 'Featured',
    description: 'Featured products',
    seo: {
      title: 'Featured',
      description: 'Featured products'
    },
    path: '/search/featured',
    updatedAt: new Date().toISOString()
  }
];

export const mockMenu = [
  {
    title: 'All',
    path: '/search'
  },
  {
    title: 'Featured',
    path: '/search/featured'
  }
];

export const mockCart = {
  id: 'mock-cart',
  checkoutUrl: '#',
  cost: {
    subtotalAmount: {
      amount: '0',
      currencyCode: 'USD'
    },
    totalAmount: {
      amount: '0',
      currencyCode: 'USD'
    },
    totalTaxAmount: {
      amount: '0',
      currencyCode: 'USD'
    }
  },
  lines: [],
  totalQuantity: 0
};
