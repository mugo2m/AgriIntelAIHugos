import FarmerFarmForm from "@/components/FarmerFarmForm";

export default function RegisterFarmerPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Farmer and Farm Registration
          </h1>

          <p className="mt-2 text-gray-600">
            Register a farmer and record the
            farm location.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm md:p-8">
          <FarmerFarmForm />
        </div>
      </div>
    </main>
  );
}