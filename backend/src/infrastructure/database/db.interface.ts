export interface IDbProvider {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnection(): unknown; 
  }