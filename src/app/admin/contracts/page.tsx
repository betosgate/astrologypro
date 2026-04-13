import { ContractAmendmentsClient } from "@/components/admin/contract-amendments-client";
import { ContractsClient } from "@/components/admin/contracts-client";
import {
  listContractAmendmentRollouts,
  listContractTemplates,
  listContractVariables,
  listRoleContractRequirements,
} from "@/lib/contract-orchestration";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contracts - Admin" };

export default async function AdminContractsPage() {
  const [templates, variables, requirements, rollouts] = await Promise.all([
    listContractTemplates(),
    listContractVariables(),
    listRoleContractRequirements(),
    listContractAmendmentRollouts(),
  ]);

  return (
    <div className="space-y-8">
      <ContractsClient
        initialTemplates={templates}
        initialVariables={variables}
        initialRequirements={requirements}
      />
      <ContractAmendmentsClient initialRollouts={rollouts} templates={templates} />
    </div>
  );
}
