import { orderService } from '../services/orderService.js';
import { success } from '../utils/ApiResponse.js';

export const orderController = {
  async place(req, res) {
    const order = await orderService.place(req.user.id, req.body);
    return success(res, { order }, 'Order placed', 201);
  },

  async list(req, res) {
    const role = req.query.role || 'buyer';
    const orders = await orderService.list(req.user.id, role);
    return success(res, { orders });
  },

  async getById(req, res) {
    const order = await orderService.getById(req.user.id, req.params.id);
    return success(res, { order });
  },

  async updateStatus(req, res) {
    const order = await orderService.updateStatus(
      req.user.id,
      req.params.id,
      req.body.action,
    );
    return success(res, { order }, 'Order updated');
  },
};
