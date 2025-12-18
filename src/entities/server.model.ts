
export class ServerModels {
  id: number;
  name: string;
  location?: string;
  ip: string;
  port: number;
  createdAt: string; 
  updatedAt: string;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.location = data.location;
    this.ip = data.ip;
    this.port = data.port;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
