import { SetMetadata } from '@nestjs/common';
import { ChannelRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ChannelRole[]) => SetMetadata(ROLES_KEY, roles);
