import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, Logger } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

/**
 * A generic HTTP client service that wraps NestJS's HttpService (Axios) and provides
 * typed methods for common HTTP verbs. All Axios errors are caught, logged, and
 * re-thrown as NestJS HttpExceptions so they are handled consistently by the
 * global exception filter.
 */
@Injectable()
export class HttpClient {
  private readonly logger = new Logger(HttpClient.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Handles errors thrown by Axios requests.
   *
   * Axios errors are mapped to an HttpException using the upstream response status
   * and message. Non-Axios errors are re-thrown as-is.
   *
   * @param {unknown} error - The caught error.
   * @throws {HttpException} When the error is an Axios error.
   * @returns {never} This method always throws.
   */
  private handleError(error: unknown): never {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const message = error.response?.data?.message ?? error.message;
      this.logger.error(`HTTP error ${status}: ${message}`, error.stack);
      throw new HttpException(message, status);
    }
    throw error;
  }

  /**
   * Performs an HTTP GET request.
   *
   * @template T - The expected shape of the response body.
   * @param {string} url - The target URL.
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration (headers, params, etc.).
   * @returns {Promise<T>} The response body deserialized as T.
   * @throws {HttpException} When the request fails.
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.get<T>(url, config),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Performs an HTTP POST request.
   *
   * @template T - The expected shape of the response body.
   * @param {string} url - The target URL.
   * @param {unknown} [data] - The request body payload.
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration.
   * @returns {Promise<T>} The response body deserialized as T.
   * @throws {HttpException} When the request fails.
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.post<T>(url, data, config),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Performs an HTTP PUT request.
   *
   * @template T - The expected shape of the response body.
   * @param {string} url - The target URL.
   * @param {unknown} [data] - The request body payload.
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration.
   * @returns {Promise<T>} The response body deserialized as T.
   * @throws {HttpException} When the request fails.
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.put<T>(url, data, config),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Performs an HTTP PATCH request.
   *
   * @template T - The expected shape of the response body.
   * @param {string} url - The target URL.
   * @param {unknown} [data] - The partial request body payload.
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration.
   * @returns {Promise<T>} The response body deserialized as T.
   * @throws {HttpException} When the request fails.
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.patch<T>(url, data, config),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Performs an HTTP DELETE request.
   *
   * @template T - The expected shape of the response body.
   * @param {string} url - The target URL.
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration.
   * @returns {Promise<T>} The response body deserialized as T.
   * @throws {HttpException} When the request fails.
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.delete<T>(url, config),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}
