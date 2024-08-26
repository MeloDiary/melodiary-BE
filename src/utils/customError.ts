//하위 함수에서 상위 함수로 에러 메시지와 status code를 전달하기 위한 클래스
export default class CustomError extends Error {
    statusCode : number
    constructor(statusCode:number, message:string) {
      super(message);
      this.statusCode = statusCode;
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
}