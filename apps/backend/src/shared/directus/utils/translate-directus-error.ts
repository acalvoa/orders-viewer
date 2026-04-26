import {
  BadGatewayException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { DirectusErrorResponse } from '@repo/shared';

export function translateDirectusError(
  error: AxiosError<DirectusErrorResponse>,
): Error {
  const status: number | undefined = error.response?.status;
  const message: string =
    error.response?.data?.errors?.[0]?.message ?? error.message;

  switch (status) {
    case 404:
      return new NotFoundException(message);
    case 401:
    case 403:
      return new UnauthorizedException(message);
    default:
      return new BadGatewayException(`Directus: ${message}`);
  }
}
