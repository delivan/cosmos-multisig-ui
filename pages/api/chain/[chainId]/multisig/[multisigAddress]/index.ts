import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../../../lib/mongodbHelpers";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      try {
        const client = await clientPromise;
        const db = client.db("keplr-multisig");

        const multisigAddress = req.query.multisigAddress.toString();
        const chainId = req.query.chainId.toString();

        const multisig = await db.collection("multisigs").findOne({
          address: multisigAddress,
          chainId,
        });

        if (!multisig) {
          res.status(404).send("Multisig not found");
          return;
        }
        console.log("success", multisig);
        res.status(200).send(multisig);
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
