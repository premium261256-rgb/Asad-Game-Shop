export interface GamePackage {
  id: string;
  game: 'Free Fire' | 'PUBG' | 'Mobile Legends' | 'Call of Duty';
  name: string;
  amount: string;
  price: number;
  image: string;
}

export type OrderStatus = 'pending' | 'approved' | 'cancelled';

export interface Order extends OrderDetails {
  id: string;
  userEmail: string;
  userName: string;
  status: OrderStatus;
  timestamp: number;
  packageName: string;
  price: number;
}

export interface OrderDetails {
  packageId: string;
  playerId: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket';
  phoneNumber: string;
  transactionId: string;
}
