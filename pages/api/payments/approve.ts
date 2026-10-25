import type { NextApiRequest, NextApiResponse } from "next";
import paymentHandler from "../pi-payment";
// Legacy routes share the same authenticated authoritative validation path.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  req.body = { ...(req.body || {}), action: "approve" };
  return paymentHandler(req, res);
}
