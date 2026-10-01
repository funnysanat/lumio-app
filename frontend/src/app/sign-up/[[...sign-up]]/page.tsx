import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', textAlign: 'center', overflowX: 'hidden', padding: '1rem' }}>
      <SignUp path="/sign-up" />
    </div>
  );
}
