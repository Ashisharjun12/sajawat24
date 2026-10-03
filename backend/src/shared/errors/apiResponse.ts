
export class ApiResponse<T>{
    public readonly success:boolean;
    public readonly statusCode:number;
    public readonly data:T;
    public readonly message:string;
    public readonly stack?:string;

    constructor(statusCode:number,data:T,message:string,stack?:string){
        this.success=(statusCode<400)
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.stack=stack
    }

}