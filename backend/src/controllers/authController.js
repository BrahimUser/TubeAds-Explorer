import { authService } from '../services/authService.js';
import { success } from '../utils/ApiResponse.js';

export const authController = {
  async register(req, res) {
    const result = await authService.register(req.body);
    return success(res, result, 'Registration successful', 201);
  },

  async login(req, res) {
    const result = await authService.login(req.body);
    return success(res, result, 'Login successful');
  },

  async logout(req, res) {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    await authService.logout(refreshToken);
    return success(res, {}, 'Logged out');
  },

  async refresh(req, res) {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await authService.refresh(refreshToken);
    return success(res, result, 'Token refreshed');
  },

  async me(req, res) {
    const user = await authService.me(req.user.id);
    return success(res, { user }, 'Profile retrieved');
  },
};
