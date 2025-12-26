import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsumerPrismaService } from '../prisma/consumer-prisma.service';
import { ResponseUtil } from '../common/utils/response.util';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { BulkUpsertPermissionsDto } from './dto/bulk-permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly consumerPrisma: ConsumerPrismaService) {}

  private normalizeScreenName(s: string) {
    return String(s ?? '').trim().toLowerCase();
  }

  async findAll() {
    const permissions = await this.consumerPrisma.permissions_master.findMany({
      orderBy: [{ screen_name: 'asc' }, { action: 'asc' }],
    });

    return ResponseUtil.success(permissions, 'Permissions fetched successfully');
  }

  async findOne(id: number) {
    const permission = await this.consumerPrisma.permissions_master.findUnique({
      where: { s_no: id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return ResponseUtil.success(permission, 'Permission fetched successfully');
  }

  async create(dto: CreatePermissionDto) {
    const screen_name = this.normalizeScreenName(dto.screen_name);
    const action = dto.action;

    const existing = await this.consumerPrisma.permissions_master.findFirst({
      where: { screen_name, action },
      select: { s_no: true },
    });

    if (existing) {
      throw new ConflictException('Permission already exists for this screen_name and action');
    }

    const created = await this.consumerPrisma.permissions_master.create({
      data: {
        screen_name,
        action,
        description: dto.description,
      },
    });

    return ResponseUtil.created(created, 'Permission created successfully');
  }

  async update(id: number, dto: UpdatePermissionDto) {
    const existing = await this.consumerPrisma.permissions_master.findUnique({
      where: { s_no: id },
    });

    if (!existing) {
      throw new NotFoundException('Permission not found');
    }

    const nextScreenName =
      dto.screen_name != null ? this.normalizeScreenName(dto.screen_name) : existing.screen_name;
    const nextAction = dto.action != null ? dto.action : (existing.action as any);

    const conflict = await this.consumerPrisma.permissions_master.findFirst({
      where: {
        screen_name: nextScreenName,
        action: nextAction as any,
        NOT: { s_no: id },
      },
      select: { s_no: true },
    });

    if (conflict) {
      throw new ConflictException('Another permission already exists for this screen_name and action');
    }

    const updated = await this.consumerPrisma.permissions_master.update({
      where: { s_no: id },
      data: {
        screen_name: nextScreenName,
        action: nextAction as any,
        description: dto.description,
      },
    });

    return ResponseUtil.success(updated, 'Permission updated successfully');
  }

  async remove(id: number) {
    const existing = await this.consumerPrisma.permissions_master.findUnique({
      where: { s_no: id },
    });

    if (!existing) {
      throw new NotFoundException('Permission not found');
    }

    const [roleUsageCount, userOverrideCount] = await Promise.all([
      this.consumerPrisma.role_permissions.count({
        where: { permission_id: id },
      }),
      this.consumerPrisma.user_permission_overrides.count({
        where: { permission_id: id },
      }),
    ]);

    if (roleUsageCount > 0 || userOverrideCount > 0) {
      throw new ConflictException(
        `Cannot delete permission. It is being used by ${roleUsageCount} role permission assignment(s) and ${userOverrideCount} user override(s)`,
      );
    }

    await this.consumerPrisma.permissions_master.delete({
      where: { s_no: id },
    });

    return ResponseUtil.noContent('Permission deleted successfully');
  }

  async bulkUpsert(dto: BulkUpsertPermissionsDto) {
    const screen_name = String(dto.screen_name ?? '').trim().toLowerCase();

    if (!screen_name) {
      throw new ConflictException('screen_name is required');
    }

    const actions = Array.from(new Set(dto.actions.map((a) => String(a).toUpperCase())));

    const results = await this.consumerPrisma.$transaction(
      actions.map((action) =>
        this.consumerPrisma.permissions_master.upsert({
          where: {
            screen_name_action: {
              screen_name,
              action: action as any,
            },
          },
          create: {
            screen_name,
            action: action as any,
            description: dto.description,
          },
          update: {
            description: dto.description,
          },
        }),
      ),
    );

    return ResponseUtil.success(results, 'Permissions upserted successfully');
  }
}
