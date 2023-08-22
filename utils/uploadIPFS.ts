import { readFile } from "fs/promises";
import { TOKENS, getRandom } from "./getRandom";

export const uploadIPFS = async (path: string) => {
  const body = await readFile(path);

  const data = await fetch("https://api.nft.storage/upload", {
    headers: {
      authorization: `Bearer ${getRandom(TOKENS)}`,
      "content-type": "image/png",
    },
    method: "POST",
    body,
  })
    .then<Response>((res) => res.json())
    .then(async (data) => {
      await fetch(getIpfsURL(data.value.cid));
      return data;
    });

  return data;
};

export const getIpfsURL = (cid: string) => `https://${cid}.ipfs.dweb.link`;

interface Response {
  ok: boolean;
  value: Value;
}

interface Value {
  cid: string;
  created: string;
  type: string;
  scope: string;
  files: any[];
  size: number;
  name: string;
  pin: Pin;
  deals: any[];
}

interface Pin {
  cid: string;
  created: string;
  size: number;
  status: string;
}
