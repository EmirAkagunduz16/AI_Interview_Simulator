import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import axios, { AxiosRequestConfig, Method, AxiosError } from "axios";

export interface ProxyOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly defaultTimeout = 30000;

  async forward<T>(
    baseUrl: string,
    path: string,
    method: Method,
    data?: unknown,
    options: ProxyOptions = {},
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const { timeout = this.defaultTimeout, headers = {} } = options;

    const config: AxiosRequestConfig = {
      url,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      timeout,
      validateStatus: () => true, // Handle all statuses
    };

    if (data !== undefined && data !== null) {
      config.data = data;
    }

    try {
      this.logger.debug(`Proxying ${method} ${url}`);
      const response = await axios(config);

      if (response.status >= 400) {
        throw new HttpException(
          response.data || { message: "Service error" },
          response.status,
        );
      }

      return response.data as T;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const axiosError = error as AxiosError;

      if (axiosError.code === "ECONNREFUSED") {
        this.logger.error(`Service unavailable: ${baseUrl}`);
        throw new HttpException(
          { message: "Service temporarily unavailable" },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (
        axiosError.code === "ETIMEDOUT" ||
        axiosError.code === "ECONNABORTED"
      ) {
        this.logger.error(`Request timeout: ${url}`);
        throw new HttpException(
          { message: "Request timeout" },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      this.logger.error(`Proxy error: ${axiosError.message}`);
      throw new HttpException(
        { message: "Gateway error" },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
