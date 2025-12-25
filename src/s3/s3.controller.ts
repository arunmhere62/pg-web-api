import { Controller, Post, Delete, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { S3Service } from './s3.service';

@ApiTags('s3')
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file to S3' })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @ApiResponse({ status: 500, description: 'Upload failed' })
  async uploadFile(
    @Body()
    uploadData: {
      key: string;
      contentType: string;
      fileData: string;
      isPublic: boolean;
      bucket: string;
    },
  ) {
    return this.s3Service.uploadFile(uploadData);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete file from S3' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(
    @Body()
    deleteData: {
      key: string;
      bucket: string;
    },
  ) {
    return this.s3Service.deleteFile(deleteData);
  }

  @Delete('delete-multiple')
  @ApiOperation({ summary: 'Delete multiple files from S3' })
  @ApiResponse({ status: 200, description: 'Files deleted successfully' })
  async deleteMultipleFiles(
    @Body()
    deleteData: {
      keys: string[];
      bucket: string;
    },
  ) {
    return this.s3Service.deleteMultipleFiles(deleteData);
  }

  @Get('exists')
  @ApiOperation({ summary: 'Check if file exists in S3' })
  @ApiResponse({ status: 200, description: 'File existence checked' })
  async fileExists(
    @Query()
    query: {
      key: string;
      bucket: string;
    },
  ) {
    return this.s3Service.fileExists(query);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check S3 service health' })
  @ApiResponse({ status: 200, description: 'S3 service is available' })
  async health() {
    return this.s3Service.health();
  }
}
