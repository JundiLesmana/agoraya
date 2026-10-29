import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input id="email" type="email" className="mt-1 block w-full rounded border p-2" />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </main>
  );
}
