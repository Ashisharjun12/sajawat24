import CircuitBreaker from 'opossum';
import { logger } from '../../utils/logger.js';
export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
}

const defaultOptions: CircuitBreakerOptions = {
    timeout: 5000,  //  5 sec if function take longer than 5 sec 
    errorThresholdPercentage: 50, // 50 % error then open the circuit
    resetTimeout: 30000,  // 30 sec wait before trying again
};
// circuit breaker for any servcie
export class CircuitBreakerFactory {
    static create<T extends (...args: any[]) => Promise<any>>(
        action: T,
        name: string,
        options: CircuitBreakerOptions = {}
    ): CircuitBreaker {
        const breaker = new CircuitBreaker(action, {
            ...defaultOptions,
            ...options,
        });

        breaker.on('open', () => {
            logger.warn(`CircuitBreaker ${name} is OPEN. Failing fast.`);
        });

        breaker.on('close', () => {
            logger.info(`CircuitBreaker ${name} is CLOSED. Resuming normal operations.`);
        });

        breaker.on('halfOpen', () => {
            logger.info(`CircuitBreaker ${name} is HALF_OPEN. Testing service recovery.`);
        });

        breaker.on('fallback', (err: any) => {
            logger.error(`CircuitBreaker ${name} fallback triggered due to: ${err?.message}`);
        });

        return breaker;
    }
}