import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../../lib/mongodbHelpers";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      try {
        const client = await clientPromise;
        const db = client.db("keplr-multisig");

        const { address, pubkeyJSON, chainId } = req.body;

        const multisig = await db.collection("multisigs").insertOne({
          address,
          pubkeyJSON,
          chainId,
        });
        res.json(multisig);
      } catch (e) {
        console.error(e);
        throw new Error(e).message;
      }
  }
  // no route matched
  res.status(405).end();
  return;
}
