import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsumerPrismaService } from '../prisma/consumer-prisma.service';
import { ResponseUtil } from '../common/utils/response.util';
import { CreateLegalDocumentDto } from './dto/create-legal-document.dto';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto';

@Injectable()
export class LegalDocumentsService {
  constructor(private readonly consumerPrisma: ConsumerPrismaService) {}

  async list(params: {
    page: number;
    limit: number;
    type?: string;
    is_active?: boolean;
    required_only?: boolean;
    organization_id?: number;
  }) {
    const { page, limit, type, is_active, required_only, organization_id } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (typeof is_active === 'boolean') where.is_active = is_active;
    if (required_only) where.is_required = true;
    if (organization_id != null) where.organization_id = organization_id;

    const [total, rows] = await Promise.all([
      this.consumerPrisma.legal_documents.count({ where }),
      this.consumerPrisma.legal_documents.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ created_at: 'desc' }],
      }),
    ]);

    return ResponseUtil.paginated(rows, total, page, limit, 'Legal documents fetched successfully');
  }

  async create(dto: CreateLegalDocumentDto, createdBy?: number) {
    const exists = await this.consumerPrisma.legal_documents.findFirst({
      where: {
        type: dto.type,
        version: dto.version,
      },
      select: { s_no: true },
    });

    if (exists) {
      throw new ConflictException('Legal document with this type and version already exists');
    }

    const created = await this.consumerPrisma.legal_documents.create({
      data: {
        type: dto.type,
        title: dto.title,
        version: dto.version,
        url: dto.url,
        is_active: dto.is_active ?? true,
        is_required: dto.is_required ?? true,
        effective_date: dto.effective_date ? new Date(dto.effective_date) : new Date(),
        expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : null,
        organization_id: dto.organization_id ?? null,
        created_by: createdBy ?? null,
        updated_by: createdBy ?? null,
      },
    });

    return ResponseUtil.created(created, 'Legal document created successfully');
  }

  async update(id: number, dto: UpdateLegalDocumentDto, updatedBy?: number) {
    const existing = await this.consumerPrisma.legal_documents.findUnique({
      where: { s_no: id },
    });

    if (!existing) {
      throw new NotFoundException('Legal document not found');
    }

    if ((dto.type || dto.version) && (dto.type ?? existing.type) && (dto.version ?? existing.version)) {
      const conflict = await this.consumerPrisma.legal_documents.findFirst({
        where: {
          type: dto.type ?? existing.type,
          version: dto.version ?? existing.version,
          NOT: { s_no: id },
        },
        select: { s_no: true },
      });

      if (conflict) {
        throw new ConflictException('Another legal document already exists for this type and version');
      }
    }

    const updated = await this.consumerPrisma.legal_documents.update({
      where: { s_no: id },
      data: {
        type: dto.type,
        title: dto.title,
        version: dto.version,
        url: dto.url,
        is_active: dto.is_active,
        is_required: dto.is_required,
        effective_date: dto.effective_date ? new Date(dto.effective_date) : undefined,
        expiry_date: dto.expiry_date === null ? null : dto.expiry_date ? new Date(dto.expiry_date) : undefined,
        organization_id: dto.organization_id,
        updated_by: updatedBy ?? null,
        updated_at: new Date(),
      },
    });

    return ResponseUtil.success(updated, 'Legal document updated successfully');
  }

  async setActive(id: number, value: boolean, updatedBy?: number) {
    const existing = await this.consumerPrisma.legal_documents.findUnique({
      where: { s_no: id },
    });

    if (!existing) {
      throw new NotFoundException('Legal document not found');
    }

    const updated = await this.consumerPrisma.legal_documents.update({
      where: { s_no: id },
      data: {
        is_active: value,
        updated_by: updatedBy ?? null,
        updated_at: new Date(),
      },
    });

    return ResponseUtil.success(updated, 'Legal document status updated successfully');
  }
}
