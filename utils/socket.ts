import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://testingdomain.store/';
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';


let socket: Socket | null = null;

export const initiateSocket = (storeId: string = 'all') => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            forceNew: true,
            query: { storeId }
        });
        console.log(`Connecting to socket with storeId: ${storeId}...`);
    }

    if (socket) {
        socket.on('connect', () => {
            console.log('Socket Connected!');
        });

        socket.on('disconnect', () => {
            console.log('Socket Disconnected!');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });
    }

    return socket;
};

export const joinStore = (storeId: string = 'all') => {
    if (!socket) return;
    console.log(`📡 Emitting join_store for: ${storeId}`);
    socket.emit('join_store', storeId);
};

export const getOrders = (params: { storeId: string, search?: string, page?: number, limit?: number }) => {
    if (!socket) return;
    console.log('📡 Emitting get_orders with params:', params);
    socket.emit('get_orders', params);
};

export const subscribeToOrders = (cb: (err: any, data: any) => void) => {
    if (!socket) return;

    // Listen for initial batch of orders for all stores
    socket.on('INITIAL_ORDERS_DATA', (orders: any) => {
        console.log('📦 Received INITIAL_ORDERS_DATA');
        return cb(null, { eventType: 'INITIAL_BATCH', orders });
    });

    // Listen for the new standardized INITIAL_BATCH event
    socket.on('INITIAL_BATCH', (data: any) => {
        console.log('📦 Received INITIAL_BATCH', data);
        return cb(null, { eventType: 'INITIAL_BATCH', ...data });
    });

    // Listen for initial batch of orders for a specific store
    socket.on('INITIAL_STORE_ORDERS_DATA', (data: any) => {
        console.log('📦 Received INITIAL_STORE_ORDERS_DATA', data);
        return cb(null, { eventType: 'INITIAL_BATCH', ...data });
    });

    // Listen for live updates (All Stores / Admins)
    socket.on('ORDER_UPDATED', (payload: any) => {
        console.log('🚀 Received ORDER_UPDATED:', payload);
        return cb(null, payload);
    });

    // Listen for store-specific updates
    socket.on('STORE_ORDERS_UPDATED', (payload: any) => {
        console.log('🏪 Received STORE_ORDERS_UPDATED:', payload);
        return cb(null, payload);
    });

    // Listen for individual order status changes
    socket.on('ORDER_STATUS_CHANGED', (payload: any) => {
        console.log('📍 Received ORDER_STATUS_CHANGED:', payload);
        return cb(null, payload);
    });

    // Handle generic errors
    socket.on('ERROR', (err: any) => {
        console.error('Socket Error:', err);
        return cb(err, null);
    });
};

export const unsubscribeFromOrders = () => {
    if (!socket) return;
    socket.off('INITIAL_ORDERS_DATA');
    socket.off('INITIAL_BATCH');
    socket.off('INITIAL_STORE_ORDERS_DATA');
    socket.off('ORDER_UPDATED');
    socket.off('STORE_ORDERS_UPDATED');
    socket.off('ORDER_STATUS_CHANGED');
    socket.off('ERROR');
};


export const disconnectSocket = () => {
    console.log('Disconnecting socket...');
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;
