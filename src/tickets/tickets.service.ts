import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsumerPrismaService } from '../prisma/consumer-prisma.service';
import { ManagementPrismaService } from '../prisma/management-prisma.service';
import { ResponseUtil } from '../common/utils/response.util';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddTicketCommentDto } from './dto/add-ticket-comment.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly consumerPrisma: ConsumerPrismaService,
    private readonly managementPrisma: ManagementPrismaService,
  ) {}

  private parseJsonArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  async getTickets(args: {
    page: number;
    limit: number;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }) {
    const { page, limit, status, category, priority, search } = args;
    const skip = (page - 1) * limit;

    const where: any = {
      is_deleted: false,
    };

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticket_number: { contains: search } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.consumerPrisma.issue_tickets.findMany({
        where,
        skip,
        take: limit,
        include: {
          users_issue_tickets_reported_byTousers: {
            select: {
              s_no: true,
              name: true,
              email: true,
              roles: { select: { role_name: true } },
            },
          },
          users_issue_tickets_assigned_toTousers: {
            select: {
              s_no: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ created_at: 'desc' }],
      }),
      this.consumerPrisma.issue_tickets.count({ where }),
    ]);

    const mapped = tickets.map((t: any) => ({
      ...t,
      attachments: this.parseJsonArray(t.attachments),
    }));

    return ResponseUtil.paginated(mapped, total, page, limit, 'Tickets fetched successfully');
  }

  async getTicketById(id: number) {
    const ticket = await this.consumerPrisma.issue_tickets.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        users_issue_tickets_reported_byTousers: {
          select: {
            s_no: true,
            name: true,
            email: true,
            roles: { select: { role_name: true } },
          },
        },
        users_issue_tickets_assigned_toTousers: {
          select: {
            s_no: true,
            name: true,
            email: true,
          },
        },
        issue_ticket_comments: {
          where: { is_deleted: false },
          include: {
            users: {
              select: {
                s_no: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ResponseUtil.success(
      {
        ...ticket,
        attachments: this.parseJsonArray((ticket as any).attachments),
        issue_ticket_comments: ((ticket as any).issue_ticket_comments || []).map((c: any) => ({
          ...c,
          attachments: this.parseJsonArray(c.attachments),
        })),
      },
      'Ticket fetched successfully',
    );
  }

  async updateTicket(id: number, dto: UpdateTicketDto) {
    const exists = await this.consumerPrisma.issue_tickets.findFirst({
      where: { s_no: id, is_deleted: false },
      select: { s_no: true },
    });

    if (!exists) {
      throw new NotFoundException('Ticket not found');
    }

    const updated = await this.consumerPrisma.issue_tickets.update({
      where: { s_no: id },
      data: {
        status: dto.status ?? undefined,
        resolution: dto.resolution ?? undefined,
        updated_at: new Date().toISOString(),
        resolved_at:
          dto.status === 'RESOLVED' || dto.status === 'CLOSED' ? new Date().toISOString() : undefined,
      },
      include: {
        users_issue_tickets_reported_byTousers: {
          select: {
            s_no: true,
            name: true,
            email: true,
          },
        },
        users_issue_tickets_assigned_toTousers: {
          select: {
            s_no: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return ResponseUtil.success(
      {
        ...updated,
        attachments: this.parseJsonArray((updated as any).attachments),
      },
      'Ticket updated successfully',
    );
  }

  async addComment(ticketId: number, dto: AddTicketCommentDto, managementUserId?: number) {
    const ticket = await this.consumerPrisma.issue_tickets.findFirst({
      where: { s_no: ticketId, is_deleted: false },
      select: { s_no: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!managementUserId) {
      throw new BadRequestException('Missing required header: x-user-id');
    }

    const managementUser = await this.managementPrisma.user.findFirst({
      where: { s_no: managementUserId },
      select: { s_no: true, name: true, email: true },
    });

    const comment = await this.consumerPrisma.issue_ticket_comments.create({
      data: {
        ticket_id: ticketId,
        user_id: null,
        author_source: 'MANAGEMENT' as any,
        management_user_id: managementUserId,
        management_user_name: managementUser?.name ?? null,
        management_user_email: managementUser?.email ?? null,
        comment: dto.comment,
        attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
        created_at: new Date().toISOString(),
      },
      include: {
        users: {
          select: {
            s_no: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await this.consumerPrisma.issue_tickets.update({
      where: { s_no: ticketId },
      data: { updated_at: new Date().toISOString() },
    });

    return ResponseUtil.success(
      {
        ...comment,
        attachments: this.parseJsonArray((comment as any).attachments),
      },
      'Comment added successfully',
      201,
    );
  }
}
