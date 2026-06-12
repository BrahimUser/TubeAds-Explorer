import { userService } from '../services/userService.js';
import { success } from '../utils/ApiResponse.js';

export const userController = {
  async getById(req, res) {
    const user = await userService.getById(req.params.id);
    return success(res, { user });
  },

  async updateMe(req, res) {
    const user = await userService.updateProfile(req.user.id, req.body);
    return success(res, { user }, 'Profile updated');
  },
};
