import { ContractsClient } from "@/components/admin/contracts-client";
import {
  listContractTemplates,
  listContractVariables,
  listRoleContractRequirements,
} from "@/lib/contract-orchestration";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contracts - Admin" };

export default async function AdminContractsPage() {
  const [templates, variables, requirements] = await Promise.all([
    listContractTemplates(),
    listContractVariables(),
    listRoleContractRequirements(),
  ]);

  return (
    <ContractsClient
      initialTemplates={templates}
      initialVariables={variables}
      initialRequirements={requirements}
    />
  );
}
