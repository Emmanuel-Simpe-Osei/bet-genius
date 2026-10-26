import MomoUssdButton from "@/components/MomoUssdButton";

export const metadata = { title: "Pay with Mobile Money" };

export default function PayPage() {
  return (
    <div className="min-h-screen bg-white">
      <MomoUssdButton />
    </div>
  );
}
