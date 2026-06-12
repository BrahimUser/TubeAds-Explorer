import { userRepository } from '../repositories/userRepository.js';
import { NotFoundError } from '../utils/AppError.js';
import { mapUser } from '../utils/mappers.js';

export const userService = {
  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return mapUser(user);
  },

  async updateProfile(userId, data) {
    const user = await userRepository.update(userId, {
      shopName: data.shopName,
      shopLogoUrl: data.shopLogoUrl,
      shopDescription: data.shopDescription,
      displayName: data.displayName,
      isPro: data.isPro,
    });
    return mapUser(user);
  },
};
