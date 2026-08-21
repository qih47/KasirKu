import { getTrialConfigurationAction } from "@/modules/superadmin/trial-actions";
import { RegisterClient } from "./register-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Akun & Mulai Coba Gratis | Qassa Cloud POS",
  description: "Daftar akun kasir Qassa POS secara instan tanpa kartu kredit. Dukungan khusus Cafe, Barbershop, Retail, dan Laundry.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const initialVertical =
    typeof searchParams.vertical === "string" ? searchParams.vertical : "cafe";
  const trialConfig = await getTrialConfigurationAction();

  return (
    <RegisterClient
      initialVertical={initialVertical}
      trialConfig={trialConfig}
    />
  );
}
