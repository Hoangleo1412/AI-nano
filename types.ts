
export interface Product {
  name: string;
  prompt: string;
}

export interface Products {
  [key: string]: Product;
}

export enum Status {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export interface Mockup {
  id: string;
  name: string;
  status: Status;
  imageUrl: string | null;
}

export interface ClonedDesign {
  status: Status;
  imageUrl: string | null;
}

export interface ProductDetails {
  title: string;
  description: string;
  tags: string;
}
