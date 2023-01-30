import { createTransaction } from "../../../lib/graphqlHelpers";
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodbHelpers";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      try {
        const client = await clientPromise;
        const db = client.db("keplr-multisig");

        const { dataJSON } = req.body;
        const result = await db.collection("transactions").insertOne({
          dataJSON,
        });
        console.log("test");
        res.json(result);
        return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.log(err);
        res.status(400).send(err.message);
        return;
      }
  }
  // no route matched
  res.status(405).end();
  return;
}
