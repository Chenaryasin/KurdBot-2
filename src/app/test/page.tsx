import { getUserById } from "../actions";

export default async function TestPage() {
  const data = await getUserById("1");
  return <div>{JSON.stringify(data)}</div>;
}
