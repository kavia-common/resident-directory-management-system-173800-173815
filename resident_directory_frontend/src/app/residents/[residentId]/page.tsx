import ResidentProfileClientPage from "./ResidentProfileClientPage";

export const dynamicParams = false;
export const revalidate = false;

// PUBLIC_INTERFACE
export async function generateStaticParams() {
  /** Required for `output: "export"` builds; dynamic params must be enumerated at build time. */
  return [];
}

// PUBLIC_INTERFACE
export default async function ResidentProfilePage({
  params,
}: {
  /** Next.js dynamic route params (static export expects async params typing). */
  params: Promise<{ residentId: string }>;
}) {
  /** Server wrapper for static export compatibility; renders client component. */
  const resolved = await params;
  return <ResidentProfileClientPage residentId={resolved.residentId} />;
}
