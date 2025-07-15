export function allowCors(handler: Function) {
    return async (req: any, res: any) => {
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Origin", "*"); // Or restrict to chrome-extension://<your-extension-id>
      res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization"
      );
  
      if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
      }
  
      return handler(req, res);
    };
  }